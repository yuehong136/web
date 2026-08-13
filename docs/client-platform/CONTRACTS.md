# Client Platform 合同设计

> 合同先于实现。CLP-DESK0 当前已有版本为 `1` 的最小静态 capability bridge；CLP-DX1 已冻结双 composition、最小 `PlatformPort`、命令注册表和 bridge v2 目标，但实现证据仍以 [ROADMAP.md](./ROADMAP.md) 为准。远程 schema 的真相源在 MultiRAG 后端，本仓只链接/消费，不复制维护。

## 1. 合同分层

| 合同            | 两端                                    | MVP 作用                              | 真相源                                    |
| --------------- | --------------------------------------- | ------------------------------------- | ----------------------------------------- |
| `PlatformPort`  | React product ↔ browser/desktop adapter | 屏蔽平台差异，承载固定能力面          | 本仓浏览器安全 TypeScript interface       |
| `RunClient`     | Shared Client ↔ Run Service v2          | Web/Desktop 统一 durable Run 生命周期 | MultiRAG 服务端 API/事件 schema           |
| Renderer Bridge | Renderer ↔ preload/main                 | Electron 薄壳能力                     | 本仓 schema + TS types + channel registry |
| Host RPC        | Electron main ↔ Rust Host               | Beta 本地能力                         | Beta JSON Schema + version + fixtures     |

这些合同不得合并成“万能 RPC”。MVP 不依赖 Host RPC；云端 Run 不通过 Electron main 代理。

## 2. CLP-DX1 最小 Composition 合同

DX1 只引入当前桌面体验需要的浏览器安全合同：

```ts
enum PlatformKind {
  WEB = 'web',
  DESKTOP = 'desktop',
}

interface PlatformCapabilities {
  desktop: boolean
  nativeMenu: boolean
  updater: boolean
  notifications: boolean
  localAgent: boolean
  pty: boolean
  localMcp: boolean
}

interface PlatformPort {
  readonly kind: PlatformKind
  capabilities(): Readonly<PlatformCapabilities>
}

interface CommandSource {
  subscribe(listener: (id: ProductCommandId) => void): () => void
}

interface ApplicationComposition {
  platform: PlatformPort
  commandSource: CommandSource
}
```

选择与失败语义固定为：

- `http:` / `https:` 使用 Web composition；`app://bundle/` 使用 Desktop composition。
- `app:` 下 bridge 缺失、shape 错误或版本不匹配必须显示脱敏兼容性错误，不得静默降级成 Web。
- 未批准 scheme 不进入产品应用。
- 平台判断只存在于 entrypoint/composition；`pages/components/stores` 不得读取 bridge 或导入 Electron/Node。
- Web 的 `CommandSource` 不消费原生事件；Desktop 只消费 bridge v2 的 allowlisted command event。

DX1 的 capability 真值是：Web 的 `desktop/nativeMenu=false`；Desktop 的 `desktop/nativeMenu=true`；`updater/notifications/localAgent/pty/localMcp` 均为 `false`。不得为了让 UI 可见而返回尚不存在的能力。

### 产品命令合同

DX1 固定命令 ID：

```text
palette.open
conversation.new
view.sidebar.toggle
navigation.home
navigation.search
navigation.settings
navigation.back
navigation.forward
```

命令 ID 是产品动作的稳定标识，不是任意 IPC channel。命令注册表必须拒绝重复 ID，route-scoped 注册返回 disposer；命令面板、toolbar、快捷键与原生菜单调用同一 handler。`conversation.new` 只进入当前 Conversation 工作流，不能被解释成 durable Run 创建。

## 3. MVP 扩展 `PlatformPort`

产品 UI 只能依赖下列稳定能力域；实现 DTO 在 Shared Client 阶段生成，但能力名称和安全语义现在冻结：

| 能力            | 责任                                                                                                                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `capabilities`  | `capabilities()` 返回 `desktop/updater/notifications/localAgent/pty/localMcp` 的支持状态、版本与降级原因；MVP 的本地能力必须为 unsupported |
| `auth`          | 登录发起、回调交接、会话变化和登出；服务端仍是身份权威                                                                                     |
| `openExternal`  | 只接受 `https:` / `mailto:`，并通过 host/address allowlist；其他 scheme 一律拒绝                                                           |
| `downloads`     | 开始、查询、取消与揭示下载；不向 Renderer 暴露任意写路径                                                                                   |
| `notifications` | 请求授权、发送/点击事件；默认最小权限                                                                                                      |
| `updates`       | 检查、下载、安装与受控 `beta/stable` 通道切换；Web adapter 明确 unsupported，Renderer 不能注入 feed URL                                    |
| `runs`          | 提供固定 `RunClient`，Web/Desktop 行为一致                                                                                                 |

浏览器 adapter 必须实现同一 interface，对不可用能力返回类型化 unsupported；组件不得直接检查 `window.electron`。

## 4. 固定 `RunClient`

MVP 的 Shared Client 必须提供且只围绕以下核心操作设计：

```text
createRun(input)                 -> Run
getRun(runId, options?)         -> RunProjection
subscribe(runId, cursor?, sink) -> Subscription
cancelRun(runId, reason?)       -> RunProjection
submitInteraction(runId, input) -> RunProjection
```

### 语义要求

- `createRun` 返回服务器持久化的 Run id；HTTP/stream 连接不是 Run 生命周期。
- `getRun` 返回可恢复投影和最新事件 cursor/sequence。
- `subscribe` 从 cursor 继续，处理重复事件并检测 gap；断线不合成成功。
- `cancelRun` 是幂等意图，最终以服务端事件/投影为准。
- `submitInteraction` 处理服务端已持久化的 human/tool confirmation 等待；必须绑定 interaction id、principal 和参数摘要。
- Renderer 重载后重新 `getRun + subscribe`，批准门槛要求 2 秒内恢复任务投影。
- v2/v1 并行迁移时先发布兼容消费者，再生产新事件；v1 至少保留一个完整发布周期。

### 远程 schema 真相源

- Run、event、interaction、error、cursor 和 OpenAPI schema 只由 MultiRAG 后端仓定义并版本化。
- 权威定位是 MultiRAG 仓的 `docs/run-platform/CONTRACT.md`；实施/灰度状态只看该仓 `docs/run-platform/ROADMAP.md`。本仓只保存逻辑路径，不复制跨仓相对链接或端点表。
- 本仓可以生成 client types、保存测试 fixture 或记录服务端 schema digest，但**不得手写第二份远程 schema**。
- schema URL、版本和生成命令在 Shared Client 实施时登记；服务端 schema 不可达时 CI 应使用已审核 artifact，而不是临时猜 shape。

## 5. Renderer Bridge

### 当前 DESK0 子集

preload 目前只通过 `window.multiRagDesktop` 暴露版本号和 `capabilities()`。返回值中只有 `desktop=true`；`updater`、`notifications`、`localAgent`、`pty`、`localMcp` 固定为 `false`。该子集不调用 `ipcRenderer`，不包含 auth、Run、下载或外链方法，不得作为下述目标 Bridge 已完成的证据。

### CLP-DX1 bridge v2 目标

```ts
interface MultiRagDesktopBridge {
  readonly version: 2
  capabilities(): Readonly<DesktopCapabilities>
  readonly commands: {
    onInvoked(listener: (id: DesktopCommandId) => void): () => void
  }
}
```

- v2 是 DESK0 v1 的显式不兼容升级；staging/build manifest 与 Renderer adapter 必须精确匹配 `2`。
- 命令通道只允许 main → preload → Renderer。preload 过滤固定 `DesktopCommandId`、不传 Electron event，并返回幂等 unsubscribe。
- main 只向仍存活且顶层 URL 属于 `app://bundle/**` 的主窗口派发；开发来源必须继续经过精确 loopback policy。
- 禁止 `send(channel)`、`invoke(channel)`、`on(channel)`、任意 `execute(commandId)` 或暴露 `ipcRenderer`。

### API 形态

- 一项平台能力一个方法，不暴露通用 channel。
- Request/response 先做 schema 验证；subscription 返回 unsubscribe。
- Renderer 回调拿不到 Electron event，也拿不到 `ipcRenderer`。
- 错误返回枚举 code、operation/run id、可恢复性和 trace id，不传 Error prototype。
- Renderer 发来的身份、权限、URL、文件名和 path 都不可信，main 必须重新验证。

### Sender 与 origin

每个 main handler 都验证 `senderFrame`：

- 生产只接受受信 `app://bundle` 顶层 frame。
- 开发只接受显式配置的 loopback Vite origin。
- iframe、弹窗、远程导航后的 frame 默认拒绝。
- 权限校验发生在执行前，不能只在 UI 隐藏按钮。

### 高频通道

MVP 的云端 Run 事件由 Shared Client 在 Renderer 内消费，不经 IPC。Beta 的 PTY/日志才使用一次低频 IPC 授权后建立的有界 MessagePort/流；禁止 synchronous IPC 和逐字符 `invoke`。

## 6. Run 与错误语义

云端 Run 至少区分：`queued`、`running`、`interaction_required`、`completed`、`cancelled`、`failed`、`interrupted`。Client transport 另外区分 `unauthorized`、`timed_out`、`disconnected` 和事件 gap，不能把 transport EOF 写成 Run completed。

| 分类                         | Client 行为                            |
| ---------------------------- | -------------------------------------- |
| `INVALID_ARGUMENT`           | 指向输入，不自动重试                   |
| `UNAUTHORIZED`               | 统一 auth 恢复，不清空其他账号数据边界 |
| `PERMISSION_DENIED`          | 解释策略，不泄露资源存在性             |
| `INTERACTION_REQUIRED`       | 渲染结构化交互，提交前再授权           |
| `CANCELLED`                  | 等服务端终态，不显示为 timeout         |
| `TIMED_OUT` / `DISCONNECTED` | 恢复订阅/投影，不改变 Run 终态         |
| `EVENT_GAP`                  | 用 `getRun` 重建投影后再订阅           |
| `INCOMPATIBLE_API`           | 停止该能力并引导升级/回退 v1           |

原始 OS error、命令行、token、prompt、完整路径不能直接进入 telemetry 或用户消息。

## 7. 有副作用工具与交互

服务端 interaction 不是本地布尔 UI 状态。确认至少绑定：

- principal/tenant/session
- Run/interaction id
- tool server + tool name + canonical parameter digest
- capability/scope
- expiry + nonce
- idempotency key

`submitInteraction` 前后都由服务端重新验证权限和参数摘要。未知执行结果进入 interrupted/unknown，不能静默重发。password/API key/token/OAuth 不通过普通 MCP form 采集。

## 8. Auth 合同

- `PlatformPort.auth` 同时支持密码登录和系统浏览器 OIDC Authorization Code + PKCE，并统一为同一 session/Principal 语义。
- 密码登录返回短期 access token，并使用 rotation refresh token；页面永远拿不到 refresh token 原文。
- Web refresh token 只存于 `HttpOnly + Secure + SameSite` cookie；access token 只在内存态/API client 中使用。
- Desktop refresh token 只允许由 main 使用 Electron `safeStorage` 加密后写入受限 app-data；access token 只驻留内存，preload/Renderer 不获得 refresh token。
- Desktop OIDC 使用系统浏览器 + loopback callback + Authorization Code + PKCE；state、code verifier 和授权 code 都一次性、短 TTL，并绑定本次登录发起者。
- Electron deep link/loopback callback 只能交接短期 code/state；URL、localStorage、日志和 telemetry 禁止出现 token。
- EIM-I6 建立并验证显式 provider-subject binding 前，OIDC 必须 fail closed；禁止按相同邮箱静默登录、注册或合并账号。
- auth 完成后 Shared Client 获取/恢复 Run 的权威身份；main 不能自行推导租户权限。
- Client Platform 只消费 EIM/服务端返回的 authenticated session/context；不得从 API Key、邮箱、
  Channel actor、target id 或 `user_id` 推导 Principal，不定义 owner/admin/member、SDK service identity、
  Channel workload/candidate capability 或跨入口 ownership 等价关系。
- Run/Shared Client 看到的 `tenant_id`、`principal_id` 与 authorization handle 都是 opaque server result；
  EIM port 未冻结或授权依赖不可用时相应能力 fail closed，不用字符串前缀或本地规则兜底。

## 9. Downloads、notifications、updates

- Downloads：服务器产生受控 download descriptor，desktop adapter 管理目标、进度、取消和文件名净化；任意 URL/path 不直接进入 main。
- Notifications：只有明确 permission 和产品设置允许时发送；点击事件携带 opaque route/run id，经 Renderer 再取权威状态。
- Updates：beta/stable 私有 HTTPS channel 分离；状态可观测，可延后安装，不能通过 Renderer 提供任意 feed URL。

### 本地持久化上限

- 允许：加密 refresh credential、`run_id`、每 Run cursor、投影 schema/version、窗口与 UI 偏好、更新通道。
- 禁止：access token、prompt、对话正文、模型输出、tool/MCP 参数与结果、任意文件内容、完整本地路径。
- Run projection 可在启动时由 `getRun + subscribe` 重建；本地缓存损坏或删除不能改变云端 Run 权威状态。

## 10. Host RPC（Beta）

MVP 后确需本地能力才定义 Host RPC。其 envelope 至少有 protocol version、message/operation id、method/event、payload、sequence 和受控 trace context；启动先交换 build、protocol range、capabilities、platform/arch 与 executable hash。

framed stdio 与仅当前用户可访问的 Unix domain socket/named pipe 在 Beta PoC 比较；禁止无认证 localhost port。所有长操作有取消、超时、单一 terminal state 和 Host crash 恢复策略。

## 11. 文件与路径（Beta）

- UI 优先传用户选择产生的 opaque handle，不传任意绝对路径。
- Host 每次重新规范化并验证允许根、符号链接、类型、大小和权限。
- 路径展示/日志默认脱敏；上传云端必须有明确用户动作与数据分类。
- 目录授权不自动扩展到父目录。

## 12. 版本与迁移

- Run Service API/event 版本由 MultiRAG 真相源治理；Shared Client 显式声明 v1/v2 compatibility。
- Bridge/Host 协议使用明确 major/minor；breaking 语义升 major。
- 每个 release manifest 写入 Shared Client、bridge、可选 Host 与 cloud API min-max，不用 app semver 猜兼容。
- Run Service v2 灰度遵循：兼容消费者先行 → v2/v1 并行 → Alpha → 10% → 50% → 100%；指标越线自动停推。
- Host schema 生成 TS/Rust DTO 并做 drift check，但不复制远程 Run schema。

## 13. 合同变更流程

1. 在真相源先定义 schema、终态、取消、权限和兼容性。
2. 明确 breaking/non-breaking、v1/v2 并行窗口和回退路径。
3. 生成/更新 Shared Client，运行 fixture、重复/gap/断线与旧版本测试。
4. 先落兼容 reader，再让服务端生产新事件。
5. 最后接 UI；不能用页面 fallback 掩盖合同缺失。
