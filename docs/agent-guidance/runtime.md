# 运行时与安全专题规则

仅在修改对应能力时读取相关节。下述 MCP 确认要求约束产品交互，不要求编码助手为已授权的本地编辑或检查重复询问。

## Data

### API 层（强制）

- 普通 HTTP 走 `src/api/client.ts` 的共享 `APIClient`（鉴权头、超时、重试、错误信封）。SSE 等需要原始 `Response` 的请求由领域 API/传输适配负责，复用鉴权与错误处理，交给 `src/lib/streaming/` 解析。页面、组件、store 不新增直接 `fetch`/`axios`，不为绕过客户端而新建传输层。
- 一个领域一个文件（`src/api/agent.ts`、`knowledge.ts`…）。新端点加进对应领域文件，**不得**内联在 hook 或组件里。
- 错误统一抛类型化 `APIError`（status / code / message / details），不要再包一层临时错误对象；UI 按 `APIError.code`/`status` 分支。
- 信封顶层的分页总数用 opt-in 的 `withEnvelope: true`（`ApiEnvelope`）取回，不要发第二个请求。
- **Query key factory 强制**：每个领域暴露 `<domain>Keys` 工厂（`datasourceKeys.list()`、`datasourceKeys.detail(id)`），所有 `queryKey` / `invalidateQueries` 统一走工厂。**禁止**在组件里手写数组字面量 query key。

### 状态管理

| 类别            | 工具                      | 位置                                 |
| --------------- | ------------------------- | ------------------------------------ |
| 服务器状态      | TanStack Query            | `src/hooks/use-*-request.ts`         |
| UI / 客户端状态 | Zustand                   | `src/stores/*`                       |
| 流式 chunks     | 局部 ref / store 临时字段 | 组件或 store（**不进 Query cache**） |
| 表单状态        | react-hook-form + zod     | 组件局部                             |

服务器数据通过领域 Query hook 加载，不能 `useEffect` 手写加载或持久化到 localStorage；仅持久化 UI 偏好。

Zustand selector 卫生（React 19）：**禁止 selector 返回新对象字面量**，会触发 `getSnapshot` 死循环。用 `useShallow` 或拆成原子 selector。

### 错误处理

路由树必须由一个无 `path` 的顶层分支统一声明共享 `ErrorFallback`。后代路由继承该边界，嵌套 render / loader / lazy import 错误向上冒泡；不要在每个叶子路由重复声明。顶层分支还必须有显式 `*` catch-all，呈现产品化 404：

```tsx
{
  errorElement: <ErrorFallback />,
  children: [
    ...topLevelRoutes,
    { path: '*', element: <NotFoundPage /> },
  ],
}
```

应用根节点必须保留共享 `ErrorBoundary`，覆盖路由 provider 之外的渲染失败。React / Router 捕获回调在 ENG-10 脱敏遥测落地前不得输出原始 Error；接入遥测后也只允许固定分类、route、release 与 trace ID。

Mutation 错误归属通过 `MutationErrorFeedback` 明确标注：`Global` 由 QueryClient 用 `sonner` 给统一反馈，`Local` 由调用面呈现可恢复错误，`Silent` 仅用于预期取消或确实无需提示的后台动作。新增或修改的用户反馈必须映射为固定、已国际化的安全文案，**禁止**渲染或拼接原始 `error.message`、`details`、响应体或 mutation variables；存量违规按 ENG-3 的 mutation UX 棘轮持续清退。除非用户必须现场恢复状态，否则不用 dialog 阻塞错误反馈。

## Streaming

### AI 流式 UI（强制）

流式是产品核心（聊天、Agent 运行时、日志工作台、结构化输出）。规则：

1. **流式 chunk 不进 Query cache**。用 Zustand 临时字段或 `useRef` 缓冲；流结束后再 `queryClient.setQueryData` 写回。
2. **订阅与任务生命周期分开**。每条连接有明确的 `AbortController` 所有者；页面卸载或订阅 key 改变时清理旧订阅。`abort` 只证明本地连接终止；用户“停止任务”应走已有后端取消合同并确认结果，不能据此把服务端任务标成已取消。持久 Run/跨页面 owner 的生命周期依实际后端能力处理，详见 [平台合同](../client-platform/CONTRACTS.md)。
3. **SSE 用 `eventsource-parser`**，不要手写 `\n\n` 拆分。
4. **重连 / 续传**：服务端支持 `Last-Event-ID` 时续传；否则在 store 里把流标记为 `interrupted`，前端给出"重试"入口，**不要静默重发**。
5. **生成式 UI**：结构化输出与 tool-call payload 走 `src/pages/agent/operators/`、`pages/agent/adapters/` 的注册表。新节点渲染器加在那里，**不要**在页面组件里 switch case。
6. **Suspense 边界**仅用于*首屏*加载。流式进度归 store/UI，不写在 suspending fallback 里。
7. **可访问性**：流式文字容器加 `aria-live="polite"`、流式期间 `aria-busy="true"`；流式期间**禁止**抢焦点。
8. **Token / 成本统计**：归口在 `lib/agent/` 聚合器，不在组件里现算。

新增 SSE 消费面复用 `src/lib/streaming/`（`readSSEStream`、`assertSSEResponse`、类型化 envelope、answer reducer），不手写解码/解析循环。见 [流式运行时设计](../streaming-runtime-design.md)。

### Tool Calling 与结构化输出

- JSON Schema 是唯一真相源。Schema → 表单/渲染走 `jsonjoy-builder` / `schema-editor` / `pages/agent/features/form-sheet/`。
- Tool-call 请求/响应 shape 在 `types/agent.ts`，**不在页面里重新定义**。
- 部分输出走相同渲染器注册表；缺失字段渲染为骨架，不渲染为错误。
- MCP 工具集成走 `src/components/mcp/`、`src/pages/mcp-servers/`、`src/hooks/use-mcp-request.ts`。**任何有副作用的 MCP 工具调用都必须在 UI 上做二次确认**。

## Embed

### Agent Share / Widget 嵌入

agent share 表面（`src/pages/agent/share/` 及相关运行时组件）通过 iframe 外嵌。修改时：

- 主题统一走 `scoped-theme.tsx`，**不得**用全局 CSS override。
- 跨域消息使用类型化 `postMessage` envelope，新事件扩展类型映射，不使用 untyped 消息。当前发送入口见 `src/pages/agent/share/widget.tsx` 与 `widget-shell.tsx`；不要假设存在独立的 `lib/agent/embed/` 模块。
- 外部展示的附件必须走已有的代理/下载链路，**不得**直接给内部 blob 存储 URL。
- Widget bundle 必须懒加载重型依赖（Lexical、Monaco、mermaid、pdf-highlighter）。合并前用 `npm run build` 校核体积。

## Security

### 安全与隐私

#### 模型输出是不可信输入（强制）

LLM 产出或工具返回的一切 —— 文本、markdown、HTML、代码、URL、tool-call 参数 —— 都按攻击者可控对待（默认存在 prompt injection）。可静态检查的子集已由 `error` 级 lint 规则强制：`security/no-unsafe-iframe-sandbox`、`security/no-target-blank-without-rel`、`security/no-raw-dangerously-set-inner-html`、`security/no-imperative-html`、`security/no-sensitive-data-in-console`，以及核心 `no-eval` / `no-new-func` / `no-script-url`（见 `eslint-rules/`）：

- 模型产出的 HTML 全部走 DOMPurify；应用内 HTML 渲染统一走唯一出口 `SafeHtml`（`@/components/ui/safe-html`，内部 DOMPurify；标签/属性白名单经 `options` 传入，请提为模块级常量）—— 裸 `dangerouslySetInnerHTML` 会被 `security/no-raw-dangerously-set-inner-html` 拒绝（仅放行 `SafeHtml` 自身实现及 `__html` 值为 `sanitize(...)` 调用字面量的形式）。完整 HTML 文档/artifact 在**沙箱 iframe** 渲染（`allow-scripts` 与 `allow-same-origin` 不得同时开启），**禁止**注入应用 DOM。
- 模型/工具输出里的链接：仅放行 `http(s):`/`mailto:` 协议（拒绝 `javascript:`、`data:`），渲染加 `target="_blank" rel="noopener noreferrer"`。
- 禁止用非空 `innerHTML` / `outerHTML`、`insertAdjacentHTML` 或 `document.write*` 绕过 React / `SafeHtml`；仅允许 `innerHTML = ''` 清空第三方预览容器。
- **禁止** `eval` / `new Function` / 动态 import 模型生成的代码。代码 artifact 仅作展示（Shiki/Monaco），执行只能发生在沙箱 iframe 内。
- Tool-call 参数与结果走结构化查看器（注册表渲染器、JSON viewer）渲染，**不得**按原始 HTML 渲染。

#### 通用

- 用户输入流入 URL 参数、query string、innerHTML 时，必须在边界编码/净化
- **禁止**把对话内容、prompt、tool 输出写入 localStorage。仅持久化 UI 偏好
- 敏感字段（API key、token）UI 里掩码，**不写日志**、**不发第三方**
- Trace ID 可写日志；prompt 内容不可
- 浏览器侧环境变量必须 `VITE_*` 前缀；**不得**内联密钥

### 环境变量与配置

- 每个 `VITE_*` 变量必须在引入它的同一个 PR 里登记进 `.env.example`，并给安全的占位/默认值。`.env.local` / `.env.production` 不得带真实密钥提交。
- 功能开关沿用既有 `VITE_ENABLE_*` 命名（`VITE_ENABLE_AGENT_EMBED` 等），在模块边界/constants 层统一读取，不要在组件里散落 `import.meta.env`。
- 任何机密（API key、签名密钥）只能在服务端 —— `VITE_*` 变量天然是公开的。

## Client Platform

### Client Platform（强制）

- Web 仍是唯一生产产品并保持独立构建。`desktop/` 已有 `CLP-DESK0` 安全壳，`CLP-DX1` 增加 `src/entrypoints`、`src/platform`、Desktop Workbench 与固定命令桥；这些仍是非发布态内部体验基础。它尚无桌面原生认证、Shared `RunClient`、durable Run、自动更新、本地 PTY/MCP/Rust Host，也未完成 Windows 打包/签名实测；不得称为已发布桌面客户端。
- 开始任何 Shared Client、桌面壳、运行协议、更新/签名或本地能力工作前，先读 [平台入口](../client-platform/README.md)；架构/进程边界读 `ARCHITECTURE.md`，协议读 `CONTRACTS.md`，阶段规划读 `ROADMAP.md`，依赖/构建读 `VERSION_BASELINE.md`，发布/安全验收读 `TESTING_SECURITY.md`，无需每次通读全部。
- MVP 顺序固定为：Web 正确性与认证 → 云端 durable Run Service v2 → Web/Desktop Shared Client → Electron stable 薄壳 → 发布质量；Rust Host 只属于 MVP 后 Beta，不得作为桌面 MVP 隐藏前置。
- Renderer 继续是唯一产品 UI，禁止导入 `electron`、`node:*` 或 Host transport；Web/Desktop 只在 `src/entrypoints` 组合，页面只消费 `src/platform` 的 `PlatformPort`。DX1 仅实现 `capabilities` 与固定命令源；`auth/openExternal/downloads/notifications/updates/runs` 必须等待对应合同，不得加空实现。
- Shared `RunClient` 固定为 `createRun/getRun/subscribe/cancelRun/submitInteraction`。远程 Run API/事件 schema 的唯一真源在 MultiRAG 后端；本仓只消费生成物/fixture 和链接，不复制一份手写 schema。
- 精确版本快照只维护在 `docs/client-platform/VERSION_BASELINE.md`；长期正文只写受支持 stable 通道。当前 Vite 8 不降级，也不采用不兼容的 electron-vite stable 或 prerelease；main/preload 使用独立构建与 staging 边界。
