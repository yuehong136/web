# Client Platform 文档总览

> 状态：F0 架构文档，2026-08-13。本文档集描述获准进入验证阶段的目标方案，**不代表桌面客户端已经实现或发布**。

## 当前事实

- 本仓当前仍是纯 Web 的 React/Vite 应用；生产入口、构建、部署和运行行为均未改变。
- 仓库当前没有 Electron main/preload、Rust Host、桌面安装包、自动更新或本地 PTY/MCP 运行时。
- 本轮 F0 只增加文档、导航和工程规则，不增加依赖，不修改业务代码，不建立发布承诺。
- 现有 `src/` 继续是唯一产品 UI 源码。未来客户端不能复制一套长期分叉的 renderer。

## 目标方向

批准进入 MVP 验证的基线是：

1. 复用现有 React 19 + Vite 8 应用作为唯一 renderer。
2. 使用受支持的 Electron stable 作为跨平台窗口与安全宿主。
3. preload 只暴露最小、类型化、可审计的能力；renderer 保持浏览器权限模型。
4. 先建设云端 durable Run Service v2 和 Web/Desktop 共用的 Shared Client，Electron MVP 不依赖本地 Rust Host。
5. 云端后端继续是租户、身份、权限、业务数据、Run 与模型执行的权威来源；客户端不是新的业务后端。
6. MVP 验证后，只有明确需要 PTY、Git、workspace 文件系统、本地进程或本地 MCP 时，才在 Beta 增加独立 Rust Host。

这是一套“Web 产品层 + 云端 durable Run + 桌面薄宿主；Beta 可选本地 Host”的兼容演进方案，不以仿制任何未公开商业客户端实现为依据。

## 阅读顺序

| 文档                                           | 用途                                          |
| ---------------------------------------------- | --------------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)           | 当前与目标架构、进程职责、关键数据流          |
| [REPOSITORY_LAYOUT.md](./REPOSITORY_LAYOUT.md) | 推荐目录、构建产物边界、禁止依赖              |
| [CONTRACTS.md](./CONTRACTS.md)                 | Renderer Bridge、Host RPC、后端契约与版本规则 |
| [DECISIONS.md](./DECISIONS.md)                 | 已接受的方向、备选方案及重评条件              |
| [VERSION_BASELINE.md](./VERSION_BASELINE.md)   | 唯一精确版本快照与锁定策略                    |
| [TESTING_SECURITY.md](./TESTING_SECURITY.md)   | 性能基准、测试矩阵、安全与发布门禁            |
| [ROADMAP.md](./ROADMAP.md)                     | F0 至发布的阶段、进入/退出条件                |
| [REFERENCES.md](./REFERENCES.md)               | 官方一手依据与证据边界                        |

## 长期规则

- 长期正文只写“受支持 stable 通道”和兼容规则；精确版本只在 [VERSION_BASELINE.md](./VERSION_BASELINE.md) 更新。
- 每次开始一个 CLP 阶段，都必须重新核验官方支持矩阵、仓库实际依赖和上一阶段的基准结果。
- 新的桌面能力先定义 contract、权限、取消与错误语义，再接 UI。
- Web 必须继续可独立构建和部署；桌面目录不能成为 Web 构建的隐式前置条件。
- Renderer 不得直接导入 `electron`、`node:*`、Rust Host transport 或本地凭据实现。
- 任何有副作用的 MCP/本地工具调用仍需明确确认、重授权和幂等语义。

## F0 非目标

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
