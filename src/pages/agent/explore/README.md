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
- A stream containing only rejected foreign-session frames fails at EOF / DONE. Discarded frames and generic DONE envelopes cannot establish success. Current-session and ID-free events retain the existing terminal and user-input contract.

## 当前后端契约

| 操作 | 方法与路径                                           | 请求要点                                                                           |
| ---- | ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 创建 | `POST /api/v1/agents/{canvasId}/sessions`            | `{ name }`，读取返回的 `id`                                                        |
| 历史 | `GET /api/v1/agents/{canvasId}/sessions/{sessionId}` | 经现有 session adapter 归一化                                                      |
| 运行 | `POST /api/v1/agents/chat/completion`                | `agent_id`、`query`、`session_id`、`files`、`inputs`，现有可选 `a2ui` / `metadata` |

运行继续使用 `agentAPI.runAgentSession` 的鉴权和 AbortSignal，以及 `consumeRuntimeStream` 的共享 SSE 消费链。Query key 继续使用 `agentQueryKeys` 工厂。

现有 serializer 将会话变量定义写入 `variables`，并将其值写入 `globals['env.<key>']`。本轮保留该合同，后端负责新会话恢复定义默认值、保留 False / 0 / 空值，以及可变默认值和会话运行值隔离。

## 回归与门禁

Three formal Vitest files cover 37 cases using actual Explore pages, hooks, queries, mutations, URL navigation, Composer, and shared SSE consumption. API responses and display-only message/debug surfaces are controlled test boundaries.

覆盖 A → B 立即发送、新建残留 ID、重复发送、URL 接入与续聊、历史延迟与失败重试、A → B → A、旧创建结果、旧首帧与 HTTP 错误、无 ID 帧、伪装 B 帧、终态和卸载，以及中英反馈切换。

本轮实际通过：

- `npm run test:ci`: 112 files, 709 passing cases (Node 488, Vitest 133, Desktop 81, tooling 7).
- `npm run lint`：0 error，全仓仍有 1493 warning。
- `npm run build`、`npm run check:bundle-size`。
- `npm run lint:typed`、`npm run typecheck:agent-strict`。
- `npm run lint:i18n-agent`、`npm run lint:file-size`。

## Isolated cross-end acceptance (2026-10-02)

Acceptance used the actual Web entrypoint (StrictMode and data router), Explore page, authenticated HTTP routes, shared SSE consumer, and real Begin / VariableAssigner / Message execution. PostgreSQL and Redis ran in dedicated containers. The backend included `bb2431f59e8ed15c627514f069a0c14403c9e496` and `768fd2f5384ece46e9d4b2103d017f90605a8e5c`; its inspected HEAD was `9bf2c4d7a797c1ed14ad35db3b2a69e1c850dca6`.

Passed: current A/B request IDs; residual ID with `isNew`; create-ID promotion and continued sends using one creation; delayed create followed by B or repeated New; B history loading without A messages or Composer; sending immediately after history arrival without losing history; bilingual history failure and retry; cached A-B-A; draft and Begin input isolation; obsolete run delivery while B runs; stop then send; unmount; duplicate-send disabling; real missing-session 404/102 and recovery; and real Message component error feedback.

Browser acceptance exposed a second defect: a fast new-session run saved a real answer in SQL, while URL promotion left the page RUNNING with a blank answer. Queued view updates now rely on the current request owner and carry its promoted selection. The actual browser then displayed the answer, completed, and continued on the same session ID. The added StrictMode/data-router regression covers this path; the exact failing timing was reproduced in the browser, not by the old-guard Vitest comparison.

Transport controls held genuine HTTP responses after the server executed, deliberately ignored the transport AbortSignal, or injected a history failure. Foreign-only testing rewrote IDs in genuine SSE and appended DONE. Server audit preserves the original responses; these injected behaviors are contract-fault tests. Real current streams ended with `message_end`; failure ended with `error`. ID-free, spoofed-ID, user-input and other terminal combinations additionally have formal Hook/shared-SSE regressions.

Independent SQL readback checked session owner, messages, DSL, variable definitions and runtime globals. Array, object, string, number and boolean defaults, including explicit false / 0 / empty values, were preserved. Existing sessions accumulated their own values; new sessions started from configured defaults. The original 6 Canvas rows, 10 versions and 6 Redis replicas remained unchanged. The historical `variables: []` template ran through the browser and remained serialized as `[]`. Begin outputs independently held A and new-session parameter values; the canceled B input produced no run.

The workflow used deterministic actual components with no remote model calls, retrieval, attachment parsing or sandbox execution. Other local infrastructure connections used existing configuration. Client stop was tested against an already executed response held at the transport boundary; this does not establish cancellation of a long-running server workflow. Initial fixture construction mistakes (missing `sys.conversation_turns`, then duplicate title) are retained in the audit and excluded from accepted scenario results.

Cleanup independently verified 71 SQL tables with zero rows, Redis DB 1/2 with zero keys, and the deleted user's JWT rejected with 401. Both dedicated containers and the PostgreSQL anonymous volume were removed; all four dedicated listeners closed. The temporary Web entry, credentials and scratch directory were deleted; browser local/session storage had zero keys before closing the tab.

Evidence: [local acceptance report](/Users/xldu/.codex/visualizations/2026/09/27/01a0e29f-d9be-73e2-ab9b-7e11f071915c/4f-acceptance/report.md), original HTTP/SSE audit, before/after readback, verification and cleanup JSON, gate logs, and 31 screenshots reviewed through four annotated contact sheets. This acceptance covers the current Explore workflow; production deployment and complete model-driven templates were not tested.

## Current Task cancellation (488)

Stop now uses the current SSE `task_id` with `POST /api/v1/tasks/{id}/cancel` through the shared typed client. No current ID means local output detach only. Literal business 0 / data true displays request submission or no-op; failure is visible with fixed bilingual copy. Old cancellation replies cannot overwrite a new run or an A → B → A selection, and abort handling retains the owned feedback. See [Task cancellation contract](../features/runtime-workbench/README.md) for formal regressions, real cross-end acceptance and its worker/provider boundaries.
