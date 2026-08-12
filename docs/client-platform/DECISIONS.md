# Client Platform 决策记录

> `Accepted for validation` 表示获准进入后续 PoC，不表示已经实现或不可重评。

## 决策总表

| ID     | 决策                                                            | 状态                    |
| ------ | --------------------------------------------------------------- | ----------------------- |
| CP-001 | Electron stable + 现有 React/Vite 作为 MVP 薄壳基线             | Accepted for validation |
| CP-002 | Rust Host 仅作为 MVP 后 Beta 本地能力增量                       | Deferred to Beta        |
| CP-003 | Web/Desktop 共享唯一 renderer 产品源码                          | Accepted                |
| CP-004 | MVP 先建设云端 durable Run Service v2 + Shared Client           | Accepted                |
| CP-005 | 当前不采用不兼容 Vite 8 的 electron-vite stable，也不采用 beta  | Accepted                |
| CP-006 | 生产本地资源走 secure custom protocol，不走 `file://`           | Accepted                |
| CP-007 | 以最小 staging app 打包，仓库根不是 builder app directory       | Accepted                |
| CP-008 | 普通云端 API/Run 由 Shared Client 直连，不全量代理 main/Host    | Accepted                |
| CP-009 | electron-builder 作为首个 packaging 基线                        | Accepted for validation |
| CP-010 | Host transport 延后 PoC；rusqlite/portable-pty 按批准基线起步   | Accepted                |
| CP-011 | Electron 不是永久绑定，按统一 benchmark 保留重评门              | Accepted                |
| CP-012 | 不把未公开竞品内部实现当作架构事实                              | Accepted                |
| CP-013 | 密码 + 系统浏览器 OIDC/PKCE 双轨，按平台隔离 refresh credential | Accepted                |
| CP-014 | 本地只保存恢复游标、状态等最小元数据                            | Accepted                |
| CP-015 | 首期保持单包，出现两个真实消费者后才迁移 workspace              | Accepted                |
| CP-016 | 首发仅 macOS/Windows 企业私有分发，beta/stable 私有更新         | Accepted                |

## CP-001：为什么先选 Electron

当前项目已经是复杂 React/Vite 产品，包含 Monaco、Lexical、图画布、Mermaid、多种 Office/PDF 预览与高频流式渲染。Electron 提供统一随应用发布的 Chromium，能最大限度保留现有 UI 和跨平台渲染行为。性能优先在这里不是“选最小壳”，而是衡量完整任务的启动、内存、滚动、编辑器、文档预览、PTY 与团队长期维护成本。

该选择必须通过 packaged benchmark；框架名本身不是性能结论。

## CP-002：为什么 Rust Host 延后到 Beta

Electron main 是窗口和系统事件的控制面，阻塞它会冻结整个应用。PTY、Git、大目录、进程树、SQLite 与本地 MCP 有不同的生命周期和安全风险，独立 Host 能带来：

- 与 renderer/main 崩溃域隔离；
- 明确的取消、背压、资源上限和协议版本；
- 原生进程/PTY/文件系统能力与未来 CLI 复用；
- 避免把大量 native Node module 装入 Electron ABI。

代价是多语言、跨进程合同、sidecar 签名和升级复杂度，而 MVP 的客户端价值可先由 durable Run + Electron 薄壳验证。因此 Host 不得成为 MVP 前置；MVP 完成且产品证明确需本地能力后，Beta 才做一个垂直切片。

## CP-010：为什么只延后 Host transport

`rusqlite`（`bundled`）与 `portable-pty` 已作为 Beta 的批准起始选型，精确快照由 [VERSION_BASELINE.md](./VERSION_BASELINE.md) 维护；Beta 开工仍要复核当日稳定版本、license、目标 macOS/Windows 行为、中文 IME、进程树与打包签名。尚未锁定的是 Host transport：framed stdio 与仅当前用户可访问的 Unix domain socket/named pipe 必须先比较权限、背压、延迟和崩溃恢复。该延后不允许把 SQLite/PTY 重新塞回 MVP。

## CP-004：为什么先做 Run Service v2 与 Shared Client

客户端进程、窗口和网络连接都会退出或重载。若 Run 只存在于 SSE/WS 连接或页面 store，Electron 只能把同一脆弱生命周期包装进安装包。服务端持久化 Run、事件 cursor 和 interaction，再由 Web/Desktop 共用 `RunClient`，才能让任务跨重载恢复、v1/v2 灰度和后续平台壳保持一致。

## CP-003：为什么不复制 renderer

双 renderer 会立刻复制路由、状态、设计令牌、i18n、安全净化、测试和业务 bug。桌面差异应通过 `PlatformPort` 与 capability 注入表达；只有真正原生且经过产品验证的独立界面才可另立实现。

## CP-005：为什么暂不采用 electron-vite

当前 stable peer 范围不包含项目的 Vite 8，支持 Vite 8 的版本仍是 prerelease。降级 Vite 会回退现有 Rolldown/Oxc 配置；使用 beta 会把桌面生产链路绑定到未稳定工具。因此先用明确的 renderer Vite build 与 main/preload direct Rolldown build。未来 stable 兼容后可重评开发编排，不重写架构。

## CP-007：为什么要求 staging

仓库根有大量 Web production dependencies、测试、脚本、文档和本地配置。依赖 builder 默认文件匹配会扩大安装包与供应链面。最小 staging 使 app.asar 内容、source map、Shared Client/Bridge 版本和签名输入可审计，也保护当前根 `dist/vs` Monaco 构建边界；Beta 再加入 Host hash。

## CP-013/014：认证与本地状态为什么按平台隔离

Web 与 Desktop 的安全边界不同，但不能形成两套账号或页面判断。密码/OIDC 都归一到服务端 canonical Principal：Web 用 HttpOnly refresh cookie；Desktop 由 main 用 `safeStorage` 加密 refresh token，access token 仅内存。系统浏览器 OIDC 使用 Authorization Code + PKCE + loopback callback，并依赖 EIM-I6 显式 provider-subject binding，不能用邮箱替代身份绑定。

客户端不是会话数据库。除加密 refresh credential 外，只允许持久化恢复所需 `run_id/cursor/projection version` 和 UI 偏好；正文、prompt、tool payload/result 由云端权威状态按需重建。这样能降低本地泄漏面，也避免本地缓存成为第二真相源。

## CP-015：为什么首期不改 monorepo/workspace

当前只有一个真实 React 产品消费者。先搬到 `apps/* + packages/*` 会同时改变路径、构建、测试和发布，却不能验证 durable Run 或桌面价值。首期在单包内用 entrypoint、contract、独立 tsconfig 和 import 规则建立边界；只有 Web/Desktop 都在生产消费、协议稳定且重复维护成本可测时才迁移。MultiRAG 后端始终保持独立仓。

## CP-016：为什么先做企业私有分发

首发范围固定为 macOS + Windows 的企业私有下载和 `beta/stable` HTTPS 更新通道，先把证书、签名、公证、安装器、停推和回滚闭环做实。Linux、应用商店和公开下载会带来新的包格式、审核、沙箱与支持责任，均不进入 MVP；范围扩大必须新增 ADR 与工程量。

## 备选方案与当前判断

### Tauri 2

优点是壳与内存基线通常更小、Rust 一等公民。对本项目的主要风险是依赖系统 WebView：不同 Windows/macOS/Linux WebView 对复杂编辑器、PDF/Office 预览、CSS 和调试的行为可能不一致。只有在同一真实 renderer 场景跑完兼容与性能矩阵后才能替代 Electron。

Tauri 是明确的挑战者，但重评门槛固定为：同一 Renderer 在所有目标平台无兼容阻断，并且冷启动或稳态内存至少有一项相对 Electron **领先 >20%**，同时流式输入处理延迟、事件到可见文本和 60 Hz 帧耗时均不退化。未同时满足这些条件时，Electron 首发结论不变；不接受用 hello-world 包体或单平台结果替代。

### 原生 Rust / GPUI

可能获得最佳原生控制与特定交互性能，但需要重写现有 React/Radix/Ant Design X、Monaco/文档预览和可访问/i18n 表面。适合未来少量性能关键原生视图或明确的新产品，不适合作为当前 Web 项目的第一步。

### Flutter

跨平台渲染一致，适合从零建设的应用；本项目要重写 TypeScript 业务 UI，且 Monaco、DOM 文档预览与现有 Web 插件生态无法直接复用。当前收益不足以覆盖迁移成本与行为回归。

### Wails

Go 后端和 Web UI 集成简单，但同样依赖平台 WebView，并会引入 Go 而非复用计划中的 Rust 本地能力。对当前项目没有足够的独特性能或生态收益。

### 纯 PWA / 浏览器

仍应保留并继续增强；它不能可靠提供完整 PTY、进程树、任意 workspace 文件系统与系统更新，因此不是所有桌面能力的替代品。

## 重评触发器

满足任一条件时重开 CP-001/CP-002：

- CLP-DESK/REL 在固定设备上连续两轮无法达到批准的启动、流式、帧耗时、CPU 或 soak 门槛，且瓶颈确认来自壳而非 renderer/业务网络。
- Chromium 包体或 Electron 安全升级节奏无法满足发布政策。
- Linux 成为一级平台而 WebView/发行要求显著改变结论。
- 产品最终只需要很小的原生能力，完整 Electron 壳收益不足。
- 产品决定建设全新原生交互，而非给现有 Web 提供客户端形式。

重评时所有候选必须使用同一 renderer/fixture、设备、采样方法和完整任务，不接受只比较 hello-world 安装包或宣传数据。

## 证据边界

本决策基于本仓实际技术栈、Electron/Vite/Cargo 官方边界和待执行 benchmark。可以参考公开开源项目的用户体验与公开代码，但不得声称知道 Codex Desktop 或其他商业产品未公开的内部进程、协议、框架或性能数据。
