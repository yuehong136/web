# 工程现代化路线图（Engineering Modernization Roadmap）

> 本文档是一次全仓批判性审计的产物与后续整改的**唯一进度账本**。
> 审计日期：2026-06-10，基准提交：`030a3b2`，审计者：Claude（Fable 5）+ 仓库 owner 确认。
> 对照系：2026 年主流 AI 前端/全栈项目实践（Vercel AI SDK、assistant-ui、shadcn 生态、TanStack 官方范式、OpenAPI codegen 工作流等）。

## 维护协议（MANDATORY — 任何处理本文档条目的 agent 必须遵守）

1. **开工前**：通读目标条目的全部小节（问题/证据/方案/验收），并用当前代码**重新核实证据**——本文档是时点快照，行数、文件名可能已漂移；以实际为准，发现漂移先更新证据再动手。
2. **完工后**：必须更新该条目的「状态与进展记录」表：填日期、提交哈希、实际做了什么、如何验证、遗留问题。状态枚举：`未开始` / `进行中` / `已完成` / `部分完成` / `已否决（写明原因）`。
3. **范围变化**：发现新问题 → 按现有 ID 规则追加新条目（不要塞进无关条目）；发现某条目不再成立 → 标记 `已否决` 并写明原因，**不要删除条目**（保留决策历史）。
4. **同步义务**：条目完成若改变了开发流程（新脚本、新门禁、新目录），必须同步 `CLAUDE.md` 与 `AGENTS.md`（双语镜像，同一提交）。
5. 本文档用**稳定 ID** 引用条目（SEC-x / ARCH-x / ENG-x / HYG-x），提交信息和 PR 里也用这些 ID。

## 审计方法与基线指标（2026-06-10 实测）

所有数字均为实际命令输出，非估算：

| 指标                                              | 实测值                                        | 测法                                              |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| src 源文件数                                      | 1308 个 `.ts/.tsx`                            | `find src -name "*.ts" -o -name "*.tsx" \| wc -l` |
| 测试文件数                                        | 40（覆盖率约 3%）                             | 同上加 `.test.` 过滤                              |
| `: any` 出现次数                                  | 246                                           | grep                                              |
| lint 现状                                         | 0 errors / ~1580 warnings                     | `npm run lint`                                    |
| 超 600 行的源文件（排除 locales/generated/tests） | 36 个                                         | 见 `scripts/file-size-baseline.json`              |
| JS 产物总量（不含 sourcemap）                     | 24.9 MB                                       | `find dist/js -name "*.js" ! -name "*.map"` 求和  |
| 最大 chunk                                        | vendor-graph-antv 1.4MB（gzip 387KB）         | build 输出 + gzip 实测                            |
| Zustand stores                                    | 13 个共 3498 行（model.ts 751）               | `wc -l src/stores/*`                              |
| 手写 API 类型                                     | types/api.ts 1604 行 + types/index.ts 2075 行 | `wc -l`                                           |
| API 边界 zod 校验                                 | 0 处（zod 仅用于表单）                        | `grep -rln "z\." src/api` 为空                    |

---

## SEC — 安全级（最高优先）

### SEC-1 认证凭证存 localStorage（含 refresh token）

- **状态**：未开始
- **问题**：`auth_token` 与 `refresh_token` 均持久化在 localStorage（`src/api/client.ts:119`、`src/constants/index.ts:45-46`）。本产品大量渲染 LLM/工具输出，XSS 攻击面真实存在（prompt injection → XSS 升级链已被 ESLint 规则部分拦截，但拦不住全部）。一旦 XSS，攻击者拿走 refresh token = **永久账号接管**。
- **主流对照**：refresh token 放 httpOnly + Secure + SameSite cookie；access token 只活在内存（页面刷新用 refresh cookie 静默换取）。
- **方案**：需要后端配合改造登录/刷新接口（Set-Cookie）。前端侧：`APIClient` 去掉 localStorage 读写，token 改内存字段；401 时静默 refresh（已有 `_isRetry` 重试骨架可复用）；登出调后端清 cookie。过渡期可先做"refresh token 进 cookie、access token 仍短时 localStorage"的折中。
- **验收**：localStorage 中无任何 token 键；刷新页面会话不丢；XSS PoC（在控制台执行脚本）拿不到可换长期凭证的东西。
- **状态与进展记录**：

| 日期       | 动作             | 提交 | 备注 |
| ---------- | ---------------- | ---- | ---- |
| 2026-06-10 | 立项，待后端排期 | —    | —    |

### SEC-2 全站无 Content-Security-Policy

- **状态**：未开始
- **问题**：`index.html`、`docker/`、`deploy/` 中均无 CSP 配置。对渲染模型输出的产品，CSP 是第一道防线，DOMPurify 只是第二道。
- **方案**：在 nginx/部署层下发 CSP 响应头（meta 标签为降级方案）。起步策略建议：`default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`，配合 report-only 模式灰度一周收集违例再收紧。注意已知的合法外联：API/WS 域名（`VITE_API_BASE_URL`）、模型头像/附件代理域。sandbox iframe 的 `srcdoc` 内容受嵌入页 CSP 约束，需验证 html-report 渲染不被误杀（可能需要 `frame-src data:` 或单独的 frame CSP）。
- **验收**：生产响应头含 CSP；html-report、文档预览、agent share embed 三个高危面功能正常；report-only 期无误杀后切 enforce。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### SEC-3 dangerouslySetInnerHTML 净化缺口审计

- **状态**：已完成（2026-06-10）
- **问题**：`dangerouslySetInnerHTML` 出现在 9 个文件，引用 DOMPurify 的只有 7 个文件。差值文件需逐处审计（文件级粗测，可能有同文件内净化但跨文件传入未净化的情况）。
- **当时命中的 9 个文件**：chat/ReferenceMarker、chat/MarkdownRenderer、chat/ReferenceDetailSheet、knowledge/HighlightText、knowledge/document-preview/docx-preview、settings/ApiKeysPage、studio/create-app/utils、search/detail/search-chunk-list、knowledge/document-chunks/chunk-list-row。
- **方案**：逐处确认 `__html` 的数据来源与净化链路；不可信来源（模型输出、文档内容、用户输入）必须净化；封装一个 `SafeHtml` 组件统一走 DOMPurify，逐步替换裸用法；考虑加自定义 lint 规则强制 `__html` 只能来自净化函数。
- **验收**：9 处全部有结论（安全来源说明 or 已修复）；新增 lint 防回归。
- **审计结论（9/9 全部有结论）**：
  - **已修复（原裸渲染模型输出，实锤 XSS 缺口）**：chat/MarkdownRenderer（聊天消息经 markdown-it `html:true` 直渲）、studio/create-app/utils（预览消息同样直渲）。两处改走 `SafeHtml`（`ADD_ATTR: ['target','rel']` 保留外链属性，DOMPurify 默认白名单不含 target）。
  - **已净化、迁移到 SafeHtml 统一出口**：chat/ReferenceMarker、chat/ReferenceDetailSheet、knowledge/HighlightText、knowledge/document-preview/docx-preview、search/detail/search-chunk-list、knowledge/document-chunks/chunk-list-row（数据来源均为文档解析/检索高亮，不可信但原已过 DOMPurify；白名单提为模块常量经 `options` 传入）。
  - **安全来源（静态可信常量）**：settings/ApiKeysPage 的内联 `<style>` 滚动条 CSS（模板字面量、无插值）。已移入 `api-keys-page.css` 并改用 `components-scrollbar-*` 语义令牌，文件净减 31 行（棘轮基线同步收紧 4068 → 4037）。
- **落地物**：`src/components/ui/safe-html.tsx`（唯一 HTML 渲染出口，内部 DOMPurify）；`eslint-rules/no-raw-dangerously-set-inner-html.js`（error 级，仅放行 SafeHtml 自身实现与 `__html` 为 `sanitize(...)` 调用字面量的形式；已用临时违例 fixture 实测命中后删除）；CLAUDE.md / AGENTS.md 安全章节同步。
- **验证**：`npm run lint`（0 errors）、`npm run lint:file-size`、`npm run build`、`npm run check:bundle-size`、`npm run test:agent-t1`（47 pass）、`npm run test:design-tokens`（11 pass）、`npm run lint:i18n-agent` 全部通过。
- **遗留**：lint 规则的 `sanitize*` 调用放行是静态启发（不验证函数体确实走 DOMPurify），由 code review 把关；迁移后全仓已无该形式的使用。
- **状态与进展记录**：

| 日期       | 动作                                                       | 提交    | 备注                                                                                                                                                               |
| ---------- | ---------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-10 | 立项                                                       | —       | —                                                                                                                                                                  |
| 2026-06-10 | 新增 SafeHtml 统一净化出口                                 | 4ed8f89 | `src/components/ui/safe-html.tsx`                                                                                                                                  |
| 2026-06-10 | 修复 2 处未净化 + 迁移 6 处 + ApiKeysPage 内联 style 迁出  | 1dd6c3f | 9/9 命中处全部收口；棘轮基线收紧                                                                                                                                   |
| 2026-06-10 | 上线 `security/no-raw-dangerously-set-inner-html`（error） | a2c66a7 | 含 CLAUDE.md / AGENTS.md 同步；全仓 lint 0 errors                                                                                                                  |
| 2026-06-11 | 修复 CI 棘轮红：拆出 `reference-meta.tsx` 共享辅助         | 38ef444 | Prettier 提交时重排版使 ReferenceDetailSheet.tsx 涨到 630 行；抽出与 ReferenceMarker 重复的 doc-type/相似度辅助后降到 529 行（按格式化后形态实测），全门禁复跑通过 |

---

## ARCH — 架构级

### ARCH-1 统一 streaming/chat runtime（最大架构收益）

- **状态**：进行中（阶段 2：逐面迁移，已迁 3/9）
- **问题**：全仓至少 **8 套并行流式实现**，各自维护 transport、解析、abort、状态：
  `src/pages/home/hooks/useHomeChat.ts`、`src/pages/home/utils/mcp-agent-stream.ts`、`src/pages/agent/form/html-report/designer/report-sse.ts`、`src/pages/agent/features/runtime-workbench/runtime-stream.ts`、`src/pages/studio/create-app/hooks/use-create-app-preview.ts`、`src/pages/explore/ExplorePage.tsx`（内联）、`src/pages/search/detail/hooks/useSearchExecution.ts`、`src/pages/agent/share/use-shared-agent-runner.ts`。
  另有 `src/components/chat/EnhancedSSEParser.ts` 是**手写 SSE 解析器**（不依赖 eventsource-parser），直接违反 CLAUDE.md 流式规则第 3 条。后果：abort/重连/token 统计行为在各面上不一致，每加一个聊天面就 fork 一份逻辑。
  **补记（2026-06-11 实扫）**：另发现第 9 个流式读取面 `src/pages/agent/features/pipeline-workbench/hooks/use-pipeline-workbench.ts`（手动 `split(/\r?\n/)` + `data:` 前缀剥离提取 message_id），归入迁移清单；`conversationAPI.completion` 此前不接收 AbortSignal，fetch 发起阶段无法取消（阶段 1 已补）。
- **主流对照**：Vercel AI SDK（useChat + 统一 stream protocol + typed parts）、assistant-ui、@ant-design/x-sdk（已安装未充分利用）。共同点：单一 transport + 单一消息状态机，渲染层只消费 typed parts。
- **方案**（建议分三步，每步可独立合并）：
  1. 抽 `src/lib/streaming/`：transport（fetch+eventsource-parser+AbortController 生命周期）、事件 envelope 类型（合并 EnhancedSSEParser 的消息类型定义）、chunk-merge reducer（纯函数，必须配测试）。
  2. 把 8 个实现逐个迁移到该 runtime（每个一个 PR，回归点明确）。
  3. 删除 EnhancedSSEParser 与各处手写解析。
- **验收**：~~`grep -rn "new TextDecoder\|split('\\n\\n')" src` 在流式场景零命中~~（口径修正 2026-06-11：原模式会子串误命中合法的 `new TextDecoderStream()`，且漏掉 `split('\n')` / `split(/\r?\n/)` 形态的手写解析）。改为分阶段验收：每个已迁移面 `grep -n "EventSourceParserStream\|TextDecoderStream\|JSON.parse"` 零命中（解析样板收口到 `@/lib/streaming`）；终态用精确模式（`new TextDecoder(`、`split('\n')`、`split(/\r?\n/)` 限流式读循环）扫描零命中。所有流式入口共享同一 abort/重连语义；reducer 有单测。详见 `docs/streaming-runtime-design.md` 第 4 节。
- **状态与进展记录**：

| 日期       | 动作                                                                                                                                                                                                                                                                                                | 提交                           | 备注                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | 立项；动手前先出设计稿放 `docs/streaming-runtime-design.md`                                                                                                                                                                                                                                         | —                              | —                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-06-11 | 设计稿落地；实扫补记第 9 个面 pipeline-workbench；验收 grep 口径修正                                                                                                                                                                                                                                | 5a8126c                        | 见 `docs/streaming-runtime-design.md`                                                                                                                                                                                                                                                                                                                                  |
| 2026-06-11 | `src/lib/streaming/` 落地（transport / types / answer-reducer + 25 个单测）；`test:streaming` 进 CI；reducer 自 `src/utils/streaming-answer.ts` 物理搬迁（原址留 shim，存量面零改动）；EnhancedSSEParser 消息类型归一到 lib；`conversationAPI.completion` 补 `{ signal }`；CLAUDE.md/AGENTS.md 同步 | cf52f88                        | 验证：`npm run test:streaming`（25 pass）+ 全量门禁                                                                                                                                                                                                                                                                                                                    |
| 2026-06-11 | 试点迁移 `use-create-app-preview.ts` 到共享 runtime（1/9）；abort 现贯穿 fetch 发起阶段；该面解析样板 grep（`EventSourceParserStream\|TextDecoderStream\|JSON.parse` 与 `new TextDecoder\|split('\n\n')` 双口径）零命中                                                                             | 6914acc                        | 遗留迁移顺序见 `docs/streaming-runtime-design.md` 第 5 节：runtime-stream → report-sse → mcp-agent-stream（parseErrorMode: 'throw'，接管死测试 agent-timeline.test.ts）→ pipeline-workbench → useHomeChat → use-shared-agent-runner → useSearchExecution（保 rAF 批处理）→ ExplorePage 内联（随拆文件）；阶段 3 迁 MCPChatPage/DataInput 后删 EnhancedSSEParser 运行时 |
| 2026-06-11 | 阶段 2 启动：迁移 `runtime-stream.ts`（2/9），改为委托 `@/lib/streaming` 的薄模块（61→18 行），删除无引用的 `assertRuntimeStreamResponse`；两个调用方（runtime-workbench / explore-session-chat）零改动                                                                                             | （见 git log）                 | 刻意不传 signal 给 `readSSEStream`：调用方依赖 AbortError 向外传播进入 STOPPED 态；解析样板 grep 零命中                                                                                                                                                                                                                                                                |
| 2026-06-11 | 迁移 `report-sse.ts`（3/9）：读循环换 `readSSEStream<SSEEnvelope>`（88→68 行），域逻辑（done 帧/收尾标记/进度帧/错误帧）原样保留；两个调用方（use-run-fill / use-generate-skeleton）零改动                                                                                                          | 470be48 后续提交（见 git log） | 同 runtime-stream：signal 只留 fetch，不传 readSSEStream，保 AbortError 静默退出语义；HTTP 错误文案升级为 assertSSEResponse 的 retmsg 提取                                                                                                                                                                                                                             |

### ARCH-2 API 契约零保证 → 代码生成或边界校验

- **状态**：未开始
- **问题**：`types/api.ts`（1604 行）+ `types/index.ts`（2075 行）全部手写；API 边界零 zod 校验；`: any` 246 处。后端改字段前端编译照样绿，错误在运行时爆。
- **主流对照**：OpenAPI → `openapi-typescript` / orval 生成类型与 TanStack Query hooks；或无 spec 时在边界 `z.parse()`。
- **方案**：先确认后端是否有 OpenAPI/Swagger spec。有 → 引入 openapi-typescript，生成物替换手写类型（渐进式：先新接口用生成物，旧的逐域迁移）；无 → 推动后端补 spec，短期对高风险接口（auth、agent run、知识库）加 zod 边界校验。
- **验收**：新增接口不再手写类型；CI 里有 spec 同步检查（生成物 diff 为空）。
- **状态与进展记录**：

| 日期       | 动作                       | 提交 | 备注 |
| ---------- | -------------------------- | ---- | ---- |
| 2026-06-10 | 立项，待确认后端 spec 现状 | —    | —    |

### ARCH-3 两套 query key 工厂并存

- **状态**：未开始
- **问题**：`src/lib/query-client.ts:34` 有中央 `queryKeys`（user/conversations/knowledgeBases…），同时 hooks 里有 10 个领域工厂（`datasourceKeys`、`memoryKeys`、`llmKeys`、`documentKeys`、`chatKeys`、`generateKeys`、`teamKeys`、`agentQueryKeys`、`mcpQueryKeys` 等）。两套 key 空间不互通，invalidate 命中与否靠运气。CLAUDE.md 已把领域工厂定为规范（2026-06-10 起）。
- **方案**：盘点中央 `queryKeys` 的全部引用 → 逐域迁到对应领域工厂（无对应领域的先建）→ 删除中央对象。注意 key 形状变化会导致一次性缓存失效，属可接受。
- **验收**：`lib/query-client.ts` 只剩 QueryClient 配置；全仓 queryKey 引用 100% 走领域工厂。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### ARCH-4 Zustand store 中的服务器状态清退

- **状态**：未开始
- **问题**：13 个 store 共 3498 行。`model.ts`（751 行）、`knowledge.ts`（443 行）等明显持有服务器数据副本，与 React Query 领域重叠（违反自家规范）；`chat`/`conversation` + dialog 页职责交叉。
- **方案**：逐 store 审计字段：服务器数据 → 迁 React Query；流式临时态 → 保留；UI 偏好 → 保留。从 `model.ts` 开始（最大、最典型）。
- **验收**：store 总行数显著下降；任一 store 不再有"列表数据 + loading + error"三件套字段。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### ARCH-5 设计令牌治理 + Tailwind 4 评估

- **状态**：未开始
- **问题**：1472 个 token、`theme-generator.ts` 2206 行；`components-*` 粒度 token 随组件数线性增长，对比主流（shadcn/Radix Themes 30–60 个语义变量）成本过高。Tailwind 停在 3.4，落后主流一个大版本；Tailwind 4 的 CSS-first `@theme` 与 build:themes 管线天然同构，迁移可能反而删管线。
- **方案**：(a) 先做 token 用量统计（哪些 token 全仓 0 引用 → 删）；(b) 新组件默认复用语义层 token，`components-*` 新增需 review 说明理由；(c) 单独立项评估 Tailwind 4 迁移（eslint-plugin-tailwindcss 兼容性、@theme 映射 PoC）。
- **验收**：0 引用 token 清零；token 新增有治理流程；Tailwind 4 评估有结论文档。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

---

## ENG — 工程执行

### ENG-1 文件体积棘轮（ratchet）门禁

- **状态**：已完成（2026-06-10）
- **问题**：CLAUDE.md 规定 >600 行禁止、债务文件"只许减不许增"，但**零 enforcement**，实测全在涨：ApiKeysPage 3293→4068（+775）、ExplorePage 2279→2369、api-key-modal 1757→1917、MCPChatPage 1409→1583。结论：没有门禁的规范等于装饰。
- **方案**：棘轮机制——`scripts/check-file-size-ratchet.mjs` + 基线 `scripts/file-size-baseline.json`（36 个超标文件的当前行数快照）。规则：超 600 行的文件必须在基线内且不得超过记录值；新文件不得超 600；缩减后跑 `npm run lint:file-size:update` 收紧基线（只降不升）。CI `checks` job 执行 `npm run lint:file-size`。排除：`src/locales/**`、`*.generated.ts`、`__tests__/`、`*.test.*`、`__dev__/`。
- **验收**：CI 上任何债务文件 +1 行即红；基线只能单调收紧。
- **状态与进展记录**：

| 日期       | 动作                                | 提交                           | 备注                                                           |
| ---------- | ----------------------------------- | ------------------------------ | -------------------------------------------------------------- |
| 2026-06-10 | 脚本+基线+CI 接入完成，本地验证通过 | （见 git log `feat(tooling)`） | 基线 36 个文件；后续每偿还一个债务文件要同步收紧基线并更新本表 |

### ENG-2 测试覆盖结构性失衡 + 零 E2E

- **状态**：未开始
- **问题**：40/1308 文件有测试（约 3%），全部集中 agent 序列化层；流式 reducer、stores、APIClient 零测试；零 E2E（登录、聊天流式、知识库主链路无任何冒烟）。
- **方案**：(a) ARCH-1 落地时强制 streaming reducer 带单测；(b) 引入 Playwright，先写 1 条冒烟（登录 → 发消息 → 收到流式回复），进 CI（可用 mock 后端或 staging）；(c) 聚合 `npm test` 脚本统一入口。
- **验收**：CI 有 E2E job；流式 reducer 覆盖率可见。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### ENG-3 "空头支票"规则落地（虚拟化 / a11y / mutation 错误 / i18n 分包）

- **状态**：未开始
- **问题**：四条文档规则与现实相反：
  1. 文档强制 >200 行列表虚拟化，但**仓库未安装任何虚拟化库**（无 @tanstack/react-virtual / react-window）。
  2. 文档称 a11y "强制"，eslint 里 jsx-a11y 全量降为 warn（`eslint.config.js` 的 `jsxA11yWarningRules`）。
  3. 文档要求 mutation 错误走 sonner toast，实际全局 `mutations.onError` 只有 `console.error`（`lib/query-client.ts:23`）。
  4. 文档要求 locale 按语言分包，实际 zh+en 全部随主包打（仅 knowledge 命名空间 2700+ 行），且 locale 是 .ts 不是 JSON（翻译平台无法处理）；`ensureLocaleLoaded()` 预留未实现。
- **方案**：1) 装 @tanstack/react-virtual，对最大的两个列表页先落地；2) 挑致命子集（alt-text、aria-props、role 系列）升 error；3) 全局 onError 接 sonner（带去重）；4) locale 迁 JSON + i18next 动态加载，实现 ensureLocaleLoaded。四项可拆四个独立 PR。
- **验收**：每条对应文档规则与代码一致；不一致的规则要么落地要么从文档删除。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### ENG-4 Bundle 体积预算门禁

- **状态**：已完成（2026-06-10）
- **问题**：JS 产物 24.9MB（未压缩、含全部懒加载 chunk）、最大 chunk vendor-graph-antv 1.4MB（gzip 387KB）、入口 index ~396KB raw，无任何体积门禁；widget embed 的"必须懒加载重型依赖"只靠人工看。
- **方案**：零依赖脚本 `scripts/check-bundle-size.mjs` + 预算 `scripts/bundle-size-budget.json`（总量 / 入口 gzip / 最大 chunk gzip 三道闸，预算=当前值+5% 余量，只许下调）。CI `build` job 在 build 后执行 `npm run check:bundle-size`。
- **验收**：CI 上体积超预算即红；预算单调收紧。
- **状态与进展记录**：

| 日期       | 动作                                | 提交                           | 备注                                                |
| ---------- | ----------------------------------- | ------------------------------ | --------------------------------------------------- |
| 2026-06-10 | 脚本+预算+CI 接入完成，本地验证通过 | （见 git log `feat(tooling)`） | 预算基于当日实测+5%；优化产物后应下调预算并更新本表 |

### ENG-5 mutation 全局错误兜底静默（并入 ENG-3 第 3 条执行）

- **状态**：未开始（执行归 ENG-3）
- 单列存档：`lib/query-client.ts` 全局 `onError: console.error` 与文档"sonner toast"冲突，用户侧表现为操作失败无感知。

---

## HYG — 仓库卫生

### HYG-1 LICENSE / CHANGELOG / 版本 tag

- **状态**：已完成（2026-06-10）
- **问题**：公开 GitHub 仓库（yuehong136/web）无 LICENSE（法律上=保留所有权利）、无 CHANGELOG、零 git tag（版本 0.9.8 只活在 package.json）。
- **决策**：owner 选定 **Apache-2.0**（2026-06-10，与 RAGFlow 生态一致）。发布流程采用轻量方案：Keep a Changelog 格式的 `CHANGELOG.md` + 手动 tag（`vX.Y.Z`）；changesets/release-please 对非发布型应用属过度工程，已否决（可在开源协作者变多后重评）。
- **发布流程（自本日起）**：改 `package.json` version → `CHANGELOG.md` 把 Unreleased 段落归档为版本段 → `git tag -a vX.Y.Z` → push with tags。
- **状态与进展记录**：

| 日期       | 动作                                          | 提交                            | 备注                                         |
| ---------- | --------------------------------------------- | ------------------------------- | -------------------------------------------- |
| 2026-06-10 | LICENSE(Apache-2.0)+CHANGELOG+v0.9.8 tag 完成 | （见 git log `chore(release)`） | tag 打在当日 HEAD，作为既有 0.9.8 的基线 tag |

### HYG-2 仓库杂物与依赖治理

- **状态**：未开始（(d) 部分豁免已于 2026-06-10 处理）
- **问题**：(a) `.claude/settings.local.json` 被提交（"local" 语义即不该入库）；(b) 根目录工作区残留 `agent-ops-center-demo.html`、`project-contribution-report.html`（未跟踪）；(c) 无 Dependabot/Renovate，`patch-package` 的 4 个补丁在依赖升级时是隐性回归源；(d) **重大：整个 `docs/` 目录被 .gitignore 忽略，0 个文档被 git 跟踪**——CLAUDE.md「拿不准时去看」指引的全部 agent-t\* 总结、设计令牌文档、rewrite plan 只存在于单机工作区，fresh clone 和 CI 中的 agent 全部看不到，且无任何备份。
- **方案**：(a) `git rm --cached` + 加 .gitignore；(b) 删除或挪 docs；(c) 加 `.github/dependabot.yml`（npm 周更、分组小版本），patch 对应的依赖锁死并注释原因；(d) owner 决策哪些 docs 应入库——若无敏感内容建议整目录解除忽略并提交（这是团队知识库）；已先行豁免本路线图文件（`.gitignore` 改为 `docs/*` + `!docs/engineering-modernization-roadmap.md`），因为它必须对无上下文的后续 agent 可见。
- **状态与进展记录**：

| 日期       | 动作                                        | 提交           | 备注                            |
| ---------- | ------------------------------------------- | -------------- | ------------------------------- |
| 2026-06-10 | 立项                                        | —              | —                               |
| 2026-06-10 | 发现 docs/ 整体未被跟踪；豁免并提交本路线图 | （见 git log） | 其余 docs 入库与否待 owner 决策 |

---

## 攻坚顺序（建议）

| #   | 条目                                        | 状态                 |
| --- | ------------------------------------------- | -------------------- |
| 1   | SEC-1 token 出 localStorage + SEC-2 CSP     | 未开始（需后端）     |
| 2   | ENG-1 ratchet + ENG-4 bundle 预算           | ✅ 已完成 2026-06-10 |
| 3   | ARCH-1 统一 streaming runtime               | 进行中（阶段 1）     |
| 4   | ARCH-2 API 契约代码生成                     | 未开始               |
| 5   | ARCH-3 删中央 queryKeys + ARCH-4 store 清退 | 未开始               |
| 6   | ENG-2 流式单测 + Playwright 冒烟            | 未开始               |
| 7   | ENG-3 空头支票四件套                        | 未开始               |
| 8   | HYG-1 LICENSE/tag/CHANGELOG                 | ✅ 已完成 2026-06-10 |
| 9   | ARCH-5 Tailwind 4 / token 治理 + HYG-2      | 未开始               |
