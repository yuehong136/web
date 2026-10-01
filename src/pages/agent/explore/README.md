# Explore 会话选择与请求归属

## 跟进范围

目标为 `4f6651968a4d3bd2d6635c048e1b5cf454b5221f` 的前端会话选择行为：页面选中的会话优先，明确的新建状态创建新会话。

本次同时采用后修 `c7dec3b9123c32e3782068437385470effd08a93` 的请求归属、历史恢复和加载期发送约束，以及 `575984877f83cf48277a4eff154d904e80238ddc` 的重复发送保护。相关改动映射到本仓 Explore Hook、页面和现有共享流式运行时。

上游审查基准：`origin/main` 为 `519e7d98a5651564d4e35d6648f006cba4baaf4f`。目标提交的 Python 默认值重置及后修 `c949096db038f11d44b969902da440a800a75a3f` 由后端 session 跟进。

## 行为

- 每次页面选择都有独立归属。A → B → A 和再次点击新建会使旧请求失效。
- 发送前同步锁定请求，锁覆盖创建会话和等待首帧。快速重复发送只启动一次创建或运行。
- 已有会话直接使用当前页面的 `sessionId`；`isNew` 优先于残留 ID。刚创建的 ID 只归当前选择使用，URL 接入该 ID 时保留正在进行的回答。
- 切换时立即展示当前会话的状态、消息和参数状态。已有会话历史加载完成前关闭发送入口；失败时展示固定中英文反馈和重试入口。
- 切换时中止当前请求。所有 HTTP 返回、SSE 帧、异常、终态、导航和刷新都检查请求归属。无 `session_id` 的帧依赖请求归属；明确的异会话 ID 被丢弃。
- 完成后只刷新本次实际运行的会话 key。旧请求的 finally 无法清除新请求的 controller。
- Composer 随选择重新挂载，旧发送的异步完成无法清除新会话草稿。
- 创建、运行和历史读取的错误反馈使用固定国际化文案。

## 当前后端契约

| 操作 | 方法与路径                                           | 请求要点                                                                           |
| ---- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 创建 | `POST /api/v1/agents/{canvasId}/sessions`            | `{ name }`，读取返回的 `id`                                                        |
| 历史 | `GET /api/v1/agents/{canvasId}/sessions/{sessionId}` | 经现有 session adapter 归一化                                                      |
| 运行 | `POST /api/v1/agents/chat/completion`                | `agent_id`、`query`、`session_id`、`files`、`inputs`，现有可选 `a2ui` / `metadata` |

运行继续使用 `agentAPI.runAgentSession` 的鉴权和 AbortSignal，以及 `consumeRuntimeStream` 的共享 SSE 消费链。Query key 继续使用 `agentQueryKeys` 工厂。

现有 serializer 将会话变量定义写入 `variables`，并将其值写入 `globals['env.<key>']`。本轮保留该合同，后端负责新会话恢复定义默认值、保留 False / 0 / 空值，以及可变默认值和会话运行值隔离。

## 回归与门禁

新增 3 个正式 Vitest 文件，共 25 项回归。测试使用真实 Explore 页面、Hook、Query、mutation、URL 跳转、Composer 和共享 SSE 消费器，在 API 边界控制历史、创建和流返回；消息展示、调试面板作为展示边界替身。

覆盖 A → B 立即发送、新建残留 ID、重复发送、URL 接入与续聊、历史延迟与失败重试、A → B → A、旧创建结果、旧首帧与 HTTP 错误、无 ID 帧、伪装 B 帧、终态和卸载，以及中英反馈切换。

本轮实际通过：

- `npm run test:ci`：112 个测试文件，697 项通过（Node 488、Vitest 121、Desktop 81、tooling 7）。
- `npm run lint`：0 error，全仓仍有 1493 warning。
- `npm run build`、`npm run check:bundle-size`。
- `npm run lint:typed`、`npm run typecheck:agent-strict`。
- `npm run lint:i18n-agent`、`npm run lint:file-size`。

真实跨端隔离验收待协调 session 发出后端最终默认值合同通知后执行。上述测试使用 API 替身，尚未验证实际 API 业务码、PostgreSQL / Redis 读回和浏览器截图。
