# Client Platform 官方参考

> 只列本轮用于架构判断的一手资料。链接内容会变化，实施阶段必须切到与所锁版本匹配的文档/tag 重新核验。

## Electron

- [Process Model](https://www.electronjs.org/docs/latest/tutorial/process-model) — main、renderer、preload 与 utility process 职责。
- [Security Checklist](https://www.electronjs.org/docs/latest/tutorial/security) — sandbox、context isolation、permissions、CSP、navigation、IPC sender、自定义协议等基线。
- [Context Isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) — 最小 contextBridge API，禁止暴露整个 IPC。
- [Process Sandboxing](https://www.electronjs.org/docs/latest/tutorial/sandbox) — sandbox renderer/preload 可用模块边界，以及 preload bundle 要求。
- [ES Modules in Electron](https://www.electronjs.org/docs/latest/tutorial/esm) — main ESM、sandbox preload 不支持 ESM imports、preload extension/时序约束。
- [Inter-Process Communication](https://www.electronjs.org/docs/latest/tutorial/ipc) — invoke/send、Structured Clone 与同步 IPC 性能警告。
- [MessagePortMain](https://www.electronjs.org/docs/latest/api/message-port-main) — 高频 channel messaging 的主进程端接口。
- [Protocol API](https://www.electronjs.org/docs/latest/api/protocol) 与 [CustomScheme](https://www.electronjs.org/docs/latest/api/structures/custom-scheme) — pre-ready scheme、standard/secure/fetch/code-cache privilege。
- [Session API](https://www.electronjs.org/docs/latest/api/session) — permission request/check handlers 与 session partition。
- [safeStorage API](https://www.electronjs.org/docs/latest/api/safe-storage) — 使用 OS 提供的密码学能力加解密本地敏感字符串；实现仍需限制 app-data 文件权限和明文生命周期。
- [Deep Links](https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app) — 单实例、平台协议注册与 URL 交接边界；属于 DX1 后续能力。
- [Notifications](https://www.electronjs.org/docs/latest/tutorial/notifications) — main/renderer notification API 与平台支持边界；属于真实 Run 状态接入后的能力。
- [Electron Fuses](https://www.electronjs.org/docs/latest/tutorial/fuses) — RunAsNode、cookie encryption、Node options/inspect、ASAR 与 file protocol fuse。
- [ASAR Archives](https://www.electronjs.org/docs/latest/tutorial/asar-archives) — archive 虚拟文件系统、二进制执行和 unpack caveat。
- [ASAR Integrity](https://www.electronjs.org/docs/latest/tutorial/asar-integrity) — header hash、fuse 配对和平台支持。
- [Code Signing](https://www.electronjs.org/docs/latest/tutorial/code-signing) — macOS 签名/公证与 Windows 签名要求。
- [Updating Applications](https://www.electronjs.org/docs/latest/tutorial/updates) — autoUpdater、metadata 与发布前提。
- [Performance](https://www.electronjs.org/docs/latest/tutorial/performance) — 测量、延迟加载、避免阻塞 main/renderer、bundle 入口。
- [Automated Testing](https://www.electronjs.org/docs/latest/tutorial/automated-testing) 与 [Headless CI](https://www.electronjs.org/docs/latest/tutorial/testing-on-headless-ci) — Playwright/WebdriverIO 和 display 要求。
- [Release Timelines](https://www.electronjs.org/docs/latest/tutorial/electron-timelines) 与 [Electron Releases](https://releases.electronjs.org/) — stable/support 核验。

## 构建与发布

- [Vite Production Build](https://vite.dev/guide/build) — renderer/library build 边界，以及高级非浏览器流程建议。
- [Vite Build Options](https://vite.dev/config/build-options.html) — Vite 8 `build.rolldownOptions` 与已弃用 alias。
- [Vite 8 Migration](https://vite.dev/guide/migration) — Rolldown/Oxc 构建链路变化。
- [Rolldown Documentation](https://rolldown.rs/) — main/preload direct build 候选工具的一手配置。
- [electron-builder Build Lifecycle](https://www.electron.build/docs/features/build-lifecycle/) — copy/ASAR/afterPack/fuses/sign/distributable/publish 顺序。
- [electron-builder Application Contents](https://www.electron.build/docs/contents/) — `files`、`extraResources` 与 staging 内容。
- [electron-builder Fuses](https://www.electron.build/docs/tutorials/adding-electron-fuses/) — builder 的 fuses 配置与读取验证。

## OAuth/OIDC 原生客户端

- [RFC 8252: OAuth 2.0 for Native Apps](https://www.rfc-editor.org/rfc/rfc8252) — 原生应用使用外部 user-agent、loopback redirect 和 Authorization Code flow 的标准边界。
- [RFC 7636: PKCE](https://www.rfc-editor.org/rfc/rfc7636) — authorization code interception 防护与 code verifier/challenge 语义。

## Rust 与 Cargo

- [Cargo Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html) — virtual workspace、共享 lock/target/dependencies/lints。
- [Cargo Dependency Resolver](https://doc.rust-lang.org/cargo/reference/resolver.html) — resolver 3、lockfile、`--locked` 与 feature 解析。
- [Cargo Dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html) — workspace dependency inheritance 与版本 requirement。
- [Cargo Targets](https://doc.rust-lang.org/cargo/reference/cargo-targets.html) — lib/bin/tests/examples/benches 目录规则。
- [Rust Stable Channel Manifest](https://static.rust-lang.org/dist/channel-rust-stable.toml) — Rust/Cargo stable 精确快照。
- [crates.io](https://crates.io/) — Tokio、PTY、SQLite、tracing/OpenTelemetry 候选版本元数据。

## 版本官方源

- [Node.js Releases](https://nodejs.org/en/about/previous-releases) 与 [official dist index](https://nodejs.org/dist/index.json) — 当前 LTS 与随附 npm。
- [npm registry: Electron](https://registry.npmjs.org/electron)、[electron-vite](https://registry.npmjs.org/electron-vite)、[electron-builder](https://registry.npmjs.org/electron-builder)、[electron-updater](https://registry.npmjs.org/electron-updater)、[@electron/fuses](https://registry.npmjs.org/@electron%2ffuses)、[@electron/asar](https://registry.npmjs.org/@electron%2fasar) — package version/dist-tag/peer 元数据。
- [Python release downloads](https://www.python.org/downloads/) — Python 受支持版本；不采用第三方生命周期 API 代替官方发布页。
- [FastAPI on PyPI](https://pypi.org/project/fastapi/) — Python backend package stable 元数据。
- [PostgreSQL Downloads](https://www.postgresql.org/download/) 与 [News](https://www.postgresql.org/about/news/) — 当前 major/minor 发布。
- [Valkey Downloads](https://valkey.io/download/) — 当前稳定发布。
- [OpenTelemetry language docs](https://opentelemetry.io/docs/languages/) — 跨语言版本并不统一；实现需按各语言 registry 锁定。

## 客户端与 Agent 产品对标

### OpenAI Codex App Server

- [Codex App Server](https://learn.chatgpt.com/docs/app-server) — 官方可确认：它是富客户端的双向 JSON-RPC 接口，覆盖认证、历史、审批与流式 agent events；默认 `stdio`，并列出 WebSocket/Unix socket transport。**同页明确 app-server command 与 WebSocket transport 是 experimental、unsupported for production workloads。**
- [Codex App Server source README](https://github.com/openai/codex/blob/main/codex-rs/app-server/README.md) — 官方开源仓可确认 thread/turn/item 稳定标识、生成 TypeScript/JSON Schema、能力协商和 approval 事件形态；引用实现细节时必须锁到实施 commit。
- 边界：这能支持“UI 与执行协议分层”的方向，不能作为本项目生产远程 WebSocket、托管 SLA、安全模型或 Codex Desktop 私有实现的承诺；本项目 MVP 仍以 MultiRAG durable Run Service v2 为远程真相源。

### OpenAI Codex App

- [Introducing the Codex app](https://openai.com/index/introducing-the-codex-app/) — 官方产品材料可观察到面向并行 agent/task 的 command-center 定位和跨任务工作组织。
- 边界：产品页面不公开完整 Desktop 进程、协议、存储或安全实现；DX1 只借鉴“任务入口优先”的信息架构，不在 Run Service 前伪造后台任务。

### Visual Studio Code

- [VS Code Agent Host architecture](https://code.visualstudio.com/docs/agents/concepts/agent-host) — 官方可确认：Agent Host 是独立进程，拥有独立于客户端的 session；AHP 使用 JSON-RPC，host 是状态真相源，客户端接收 snapshot + ordered actions，并可在断线后补 action 或重取 snapshot。该能力仍在 active development、逐步开放。
- [VS Code Source Code Organization](https://github.com/microsoft/vscode/wiki/source-code-organization) — 官方仓库可确认：代码按 `common/browser/node/electron-*` 目标运行时分层；Desktop/Web 有不同入口但共享 common workbench，平台服务有不同实现。
- [VS Code Commands Registry](https://github.com/microsoft/vscode/blob/c792848ab03cc2e969175b43305feab74cd0e851/src/vs/platform/commands/common/commands.ts)、[Actions/Menu Registry](https://github.com/microsoft/vscode/blob/c792848ab03cc2e969175b43305feab74cd0e851/src/vs/platform/actions/common/actions.ts) 与 [Keybindings Registry](https://github.com/microsoft/vscode/blob/c792848ab03cc2e969175b43305feab74cd0e851/src/vs/platform/keybinding/common/keybindingsRegistry.ts) — 锁定源码快照支持稳定命令 ID 与菜单/快捷键适配分层。
- 边界：这些事实支持 Shared Client、平台 adapter 和 durable projection，但不证明 VS Code 的 AHP、进程数量或整套仓库结构适合原样复制；我们的 MVP 也不因此增加本地 Agent Host。

### Goose

- [Goose repository](https://github.com/aaif-goose/goose) 与 [CONTRIBUTING](https://github.com/aaif-goose/goose/blob/main/CONTRIBUTING.md) — 官方源码可确认：Goose 同时提供桌面、CLI 和 API；其 GUI 是 Electron 应用，并与 Rust binaries/backend 一起开发，可把后端独立启动后由 UI 连接调试。
- [Goose AppLayout](https://github.com/aaif-goose/goose/blob/589ac048e0dae9e4877c8e43aa7227f98c85569a/ui/desktop/src/components/Layout/AppLayout.tsx) 与 [NavigationPanel](https://github.com/aaif-goose/goose/blob/589ac048e0dae9e4877c8e43aa7227f98c85569a/ui/desktop/src/components/Layout/NavigationPanel.tsx) — 锁定源码快照可观察 Activity Rail、可折叠会话侧栏和主工作区的布局模式。
- 边界：这证明 Electron + Rust execution/backend 是公开可行组合，不证明它的进程、HTTP 边界、资源占用或发布方式满足本项目门槛；我们的 Rust Host 仍是 MVP 后 Beta。

### OpenCode

- [OpenCode repository](https://github.com/anomalyco/opencode) 与 [releases](https://github.com/anomalyco/opencode/releases) — 官方可确认：项目提供 CLI，并把跨平台 Desktop 标为 Beta；release notes 单独跟踪桌面通知、更新、session timeline 与 large-session 性能问题。
- [OpenCode Desktop renderer](https://github.com/anomalyco/opencode/blob/cc4b45612974f735ddec46009ede07729511fba4/packages/desktop/src/renderer/index.tsx)、[Web entry](https://github.com/anomalyco/opencode/blob/cc4b45612974f735ddec46009ede07729511fba4/packages/app/src/entry.tsx) 与 [Platform context](https://github.com/anomalyco/opencode/blob/cc4b45612974f735ddec46009ede07729511fba4/packages/app/src/context/platform.tsx) — 锁定源码快照支持 Desktop/Web 分入口、共享 App 与平台注入模式。
- [OpenCode Command context](https://github.com/anomalyco/opencode/blob/cc4b45612974f735ddec46009ede07729511fba4/packages/app/src/context/command.tsx)、[shared desktop menu](https://github.com/anomalyco/opencode/blob/cc4b45612974f735ddec46009ede07729511fba4/packages/app/src/desktop-menu.ts) 与 [Electron menu adapter](https://github.com/anomalyco/opencode/blob/cc4b45612974f735ddec46009ede07729511fba4/packages/desktop/src/main/menu.ts) — 锁定源码快照支持稳定命令注册表驱动 palette/keybinding/menu adapter。
- 边界：Desktop 实现和 package 组织仍在快速变化，不能从单个 tag、issue 或历史目录推断长期框架承诺，更不能把其 Beta 状态当成我们的 Electron/Tauri 结论。实施期只允许引用锁定 tag 的源码事实。

### Zed / GPUI

- [GPUI README](https://github.com/zed-industries/zed/blob/main/crates/gpui/README.md) — 官方源码可确认：GPUI 是 Rust 的 hybrid immediate/retained、GPU-accelerated UI framework，提供面向高效大列表/自定义编辑器的低级 Elements；同时仍 pre-1.0、活跃开发，文档列出的桌面目标是 macOS/Linux。
- 边界：这说明全原生 Rust UI 有不同的性能上限，也同时说明采用它意味着重写当前 React/Radix/Monaco/预览表面；不能由 Zed 的体验反推本项目迁移后的性能或 Windows 可用性。

### Warp

- [Warp Blocks](https://docs.warp.dev/terminal/blocks) 与 [Block Basics](https://docs.warp.dev/terminal/blocks/block-basics) — 官方产品文档可确认：Warp 把 command 与 output 组成可选择、复制、导航、共享的原子 Block，并为错误退出提供状态表达。
- 边界：本方案可以借鉴长任务/工具输出的可恢复 block 交互模型；公开文档不建立 Warp 的内部渲染、PTY、进程或持久化架构事实。

### Tauri 2

- [Tauri Process Model](https://v2.tauri.app/concept/process-model/) — 官方可确认：Tauri 有 Rust core 与一个或多个 WebView process，IPC 由 core 路由，并强调最小权限。
- [Tauri Webview Versions](https://v2.tauri.app/reference/webview-versions/) — 官方可确认：Tauri 不随应用捆绑统一 WebView；Windows 使用 WebView2，macOS 使用 WKWebView，Linux 使用 webkit2gtk，运行时版本取决于系统/provider。
- 边界：更小的壳/包体不能自动推出本项目更快；Monaco、Office/PDF 预览、画布、CSS 和流式路径必须按目标 OS/WebView 实测。只有满足 [DECISIONS.md](./DECISIONS.md) 的 >20% 挑战者判据才重评 Electron 首发。

### Cursor

- [Keeping the Cursor app stable](https://cursor.com/blog/app-stability) — 官方文章可确认的可观察事实仅包括：客户端基于 VS Code 与 Electron 的多进程架构；团队按 process/session/request 观测 crash/OOM，使用 opt-in heap snapshot、持续 profiling、feature flag、性能测试和指标回归自动回滚。
- [Cursor Agents Window](https://cursor.com/docs/agent/agents-window) 与 [Cloud Agents](https://cursor.com/docs/cloud-agent) — 官方文档可观察独立 agent 窗口、多任务切换与云端异步执行的产品组织。
- 边界：文章不是完整架构或安全说明，文中改进百分比属于 Cursor 自身时间窗和负载；不能推断其未公开 Agent protocol、进程边界，也不能把数字移作本项目性能门槛。

### Devin

- [Desktop Agent Command Center](https://docs.devin.ai/desktop/agent-command-center)、[Spaces](https://docs.devin.ai/desktop/spaces) 与 [Cascade](https://docs.devin.ai/desktop/cascade/cascade) — 官方文档可观察任务切换、工作上下文组织和多步骤工作流的产品结构。
- 边界：公开产品文档不建立 Devin 的客户端 Runtime、持久化或协议事实；DX1 只把它作为任务优先信息架构的参考。

## 证据使用规则

公开开源项目和商业产品可以用来比较可观察的启动、交互、功能组织与公开源码，但不能把外观相似当成内部架构证据。本方案没有、也不声称拥有 Codex Desktop 或其他未开源商业客户端的私有实现信息。

任何二手 benchmark、博客或营销数字只能形成待验证假设，不能覆盖本项目在固定设备、相同 renderer、相同 fixture 上的 packaged benchmark。GitHub 源码事实必须锁到实施时使用的 tag/commit；`main`、`dev` 或 release note 只表示当时状态。
