# Client Platform 文档总览

> 状态：F0 与 CLP-DX1 Desktop Experience Foundation 已完成；CLP-P0、Run F1a 与 CLP-DESK0/后续 CLP-DESK 是相互独立的切片，2026-08-13。DX1 只代表内部桌面体验基础，不代表 durable Run 或可发布桌面 MVP 已完成。

## 当前事实

- Web React/Vite 应用仍是唯一生产产品，根 `dist/` 构建、Docker 与 Web 发布保持独立。
- `desktop/` 以 CLP-DESK0 安全壳为基线：Electron main、sandbox preload、`app://bundle/` 协议、Rolldown 独立构建、显式 staging allowlist 与 electron-builder/ASAR/fuses 验证链路。
- CLP-DX1 已实现 Web/Desktop 双 composition root、最小 `PlatformPort`、Desktop Workbench、统一命令注册表、原生菜单与 Renderer Bridge v2。Web 仍独立使用现有 `AppShell`，Desktop 仅展示真实 Conversation，不创建伪 Run。
- DX1 的最终源码、macOS arm64 directory app、composition marker、网络可达性、截图和趋势证据见 [DX1_EXIT_REPORT.md](./DX1_EXIT_REPORT.md)。当前不包含桌面原生认证、Shared `RunClient`、durable Run 恢复、自动更新、本地 Host/PTY/MCP，也没有经验证的 Windows 安装包/签名。
- F0 后还已落地 task ID 隔离、Web 被动 detach 与无身份依赖的 Run F1a 协议核心；它们与 DESK0 均不等于 durable Run 或完整桌面产品已完成。
- 现有 `src/` 继续是唯一产品 UI 源码。未来客户端不能复制一套长期分叉的 renderer。

## 目标方向

批准进入 MVP 验证的基线是：

1. 复用现有 React 19 + Vite 8 应用作为唯一 renderer。
2. 使用受支持的 Electron stable 作为跨平台窗口与安全宿主。
3. preload 只暴露最小、类型化、可审计的能力；renderer 保持浏览器权限模型。
4. 先用 CLP-DX1 建立 Desktop 独立 composition、任务优先混合式工作台与键盘优先命令系统，但只展示真实 Conversation。
5. 再建设云端 durable Run Service v2 和 Web/Desktop 共用的 Shared Client，Electron MVP 不依赖本地 Rust Host。
6. 云端后端继续是租户、身份、权限、业务数据、Run 与模型执行的权威来源；客户端不是新的业务后端。
7. MVP 验证后，只有明确需要 PTY、Git、workspace 文件系统、本地进程或本地 MCP 时，才在 Beta 增加独立 Rust Host。

这是一套“Web 产品层 + 云端 durable Run + 桌面薄宿主；Beta 可选本地 Host”的兼容演进方案，不以仿制任何未公开商业客户端实现为依据。

## 阅读顺序

| 文档                                             | 用途                                          |
| ------------------------------------------------ | --------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)             | 当前与目标架构、进程职责、关键数据流          |
| [DESKTOP_EXPERIENCE.md](./DESKTOP_EXPERIENCE.md) | DX1 信息架构、composition、命令与验收边界     |
| [DX1_EXIT_REPORT.md](./DX1_EXIT_REPORT.md)       | DX1 实跑门禁、artifact、截图、趋势和未验证项  |
| [REPOSITORY_LAYOUT.md](./REPOSITORY_LAYOUT.md)   | 推荐目录、构建产物边界、禁止依赖              |
| [CONTRACTS.md](./CONTRACTS.md)                   | Renderer Bridge、Host RPC、后端契约与版本规则 |
| [DECISIONS.md](./DECISIONS.md)                   | 已接受的方向、备选方案及重评条件              |
| [VERSION_BASELINE.md](./VERSION_BASELINE.md)     | 唯一精确版本快照与锁定策略                    |
| [TESTING_SECURITY.md](./TESTING_SECURITY.md)     | 性能基准、测试矩阵、安全与发布门禁            |
| [ROADMAP.md](./ROADMAP.md)                       | F0 至发布的阶段、进入/退出条件                |
| [REFERENCES.md](./REFERENCES.md)                 | 官方一手依据与证据边界                        |

## 长期规则

- 长期正文只写“受支持 stable 通道”和兼容规则；精确版本只在 [VERSION_BASELINE.md](./VERSION_BASELINE.md) 更新。
- 每次开始一个 CLP 阶段，都必须重新核验官方支持矩阵、仓库实际依赖和上一阶段的基准结果。
- 新的桌面能力先定义 contract、权限、取消与错误语义，再接 UI。
- Conversation 与 durable Run 必须在命名、状态和恢复承诺上保持分离；没有服务端投影时不得伪造任务状态。
- Web 必须继续可独立构建和部署；桌面目录不能成为 Web 构建的隐式前置条件。
- Renderer 不得直接导入 `electron`、`node:*`、Rust Host transport 或本地凭据实现。
- 任何有副作用的 MCP/本地工具调用仍需明确确认、重授权和幂等语义。

## 当前非目标

- 不决定最终产品一定是 Codex 类工作台。
- 不承诺离线完整运行、移动端或浏览器扩展。
- 不在没有实测前宣称 Electron、Tauri、GPUI、Flutter 或 Wails 的绝对性能结论。
- 不把尚未建立的 Rust、SQLite、PTY、更新服务或签名链路写成当前能力。
- 不引用或推断 Codex Desktop 等商业产品未公开的内部架构。

## 状态词

- **当前实现**：代码和门禁已存在于本仓。
- **目标方案**：已批准进入后续验证，但尚未实现。
- **候选**：需要 PoC、兼容或性能证据后才能选定。
- **门禁**：不满足则不得进入下一阶段或发布。
