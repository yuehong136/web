# Explore 会话选择与请求归属

## Current experience structure (2026-10-03)

Explore is a conversation workspace for one Agent. A single compact toolbar and `WorkspacePageTemplate` frame the centered conversation and composer. Opening without a session ID shows a local draft immediately; no server session is created until the first submission. Draft configuration must load before sending so task mode and required Begin parameters cannot be bypassed.

History is compact navigation: single-line titles grouped by the selected timestamp, with dates and sorting in a popover. Search opens on demand and debounces requests; it searches backend message content, not conversation names. Non-default saved names are preserved. Default/empty names use the first plain user text as a display-only title, without rewriting stored data or calling a model. Invalid or missing timestamps stay in an undated group; name sorting preserves the backend order without date headings.

The current MultiRAG Agent REST API supports list, create, detail and delete, but has no rename/update endpoint. Ordinary Chat session PATCH uses a different service and table and cannot be reused. Each saved conversation offers a scoped link and confirmed deletion. Time, derived message count, recorded version, error feedback, execution logs and raw data stay in details. Tokens, duration, pinning and favorites are not presented as supported capabilities.

New conversations select draft debug or published execution from the toolbar or details. Saved conversations retain their server snapshot. History, source and details toggles preserve the composer and current stream; deletion resolves against the current selection when the response arrives. Stop confirms output detachment, with cancellation request feedback displayed separately.

Official source references, rechecked on 2026-10-03:

- [Open WebUI: date-grouped history](https://github.com/open-webui/open-webui/blob/8bd8b4fac5e059578ac0c74b3c18d11139f88b7d/src/lib/components/layout/Sidebar.svelte#L1618) and [direct first-screen composer](https://github.com/open-webui/open-webui/blob/8bd8b4fac5e059578ac0c74b3c18d11139f88b7d/src/lib/components/chat/Placeholder.svelte#L241).
- [Dify: compact conversation navigation](https://github.com/langgenius/dify/blob/43af5082d3c4ab8a96067370d2f86f214e3c85ae/web/app/components/base/chat/chat-with-history/sidebar/item.tsx#L27).
- [RAGFlow: Explore delete menu](https://github.com/infiniflow/ragflow/blob/98b48a085786fb9e14be8753b5a9a9ea02230ccf/web/src/pages/agent/explore/components/session-dropdown.tsx#L53).

This revision has actual authenticated-page rendering and read-only history/detail/search checks against the configured MultiRAG backend, plus controlled transport regressions for creation, streaming, cancellation and deletion. Browser confirmation was canceled without deleting user history. It does not establish new model/retrieval/attachment-parsing E2E acceptance. Historical acceptance records below remain bound to their stated revisions and environments.

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

## Current execution source and authorization feedback

New sessions select draft debug or published execution. Resumes retain the original server snapshot, and Begin inputs prefer the session DSL. Authorization failures share typed errors and fixed bilingual feedback. See the [Agent runtime contract](../runtime-contract.md) for requests, share boundaries and browser acceptance.

### Answers followed by a Wait prompt

Studio, Explore, shared chat and Widget project a completed answer and its following
`user_inputs` event as two display rows. Splitting requires nonempty answer content
and a preceding `message_end`; stopping a stream alone does not imply completion.
The prompt retains the real SSE `message_id` and an explicit local source ID, so
trace lookup and form clearing never infer identity by trimming an ID suffix.
References, reasoning and downloads remain on the answer. A pending form disables
the normal composer; submitting it preserves the trusted agent/session/run mode.

History assistant rows may carry `runtime_pause: { inputs, tips, answer_completed }`.
Explore restores the form only on the final row; earlier prompts and the Studio
history transcript remain readable without presenting an active historical form.
The backend emits the committed pause terminals in their original Canvas order.

## 第二入口合同核对（W0，2026-10-08）

为[跟进方案](../../../../docs/workbench-interaction-follow-up.md) W5 做的只读核对，基线为 Web `1b42f590`、MultiRAG `dd6549a0`（后端工作区另有检索分值的未提交改动，与本节无关）。只读代码，未改行为；标“推导”的结论未运行验证。

### 生产消费者

- 路由 `/agent/:id/explore`（`AGENT_EXPLORE`，`src/lib/router.tsx` 懒加载，位于 Layout 下）。URL 参数 `sessionId`、`isNew=true`、`runMode=published`；旧参数 `session` 自动改写为 `sessionId`。
- 入口：编辑器侧栏与发布弹窗（`src/pages/agent/index.tsx`）、运行台头部带 `sessionId` 的链接（`runtime-header.tsx`）、Agent 日志页（`/agents/log`，仍用旧参数 `session`）、embed 的 `navigate-request`。Agent 列表页、分享页和 widget 没有入口。

### 请求 owner 与订阅生命周期

- `use-explore-request-owner`：每次页面选择（canvasId、sessionId、isNew、revision、mode）是独立身份，A → B → A 也不同。`begin()` 同步占有，已有活动请求时返回 null；选择变化（新建会话的 URL 晋升除外）和卸载都会 abort 当前 controller；`owns()` 同时校验挂载、最新请求和当前选择；`finish()` 只清自己的占有。
- `use-explore-run-request`：先建会话，再用该请求的 fetch signal 运行 `POST /api/v1/agents/chat/completions`（`requestAgentCompletion` 是带 token 的裸 fetch）。`consumeRuntimeStream` 不把 signal 交给 `readSSEStream`，停止靠 fetch 的 AbortError 进入 STOPPED。所有视图写入经 owner 校验；结束后只失效本次会话的 `agentQueryKeys.session`，本地消息在重新选择前不被历史覆盖。
- 发送闸门：各入口先检查 `!canSend || owner.active.current`；历史未载入、执行来源加载中或失败时 `canSend` 为 false，Composer 不渲染。

### 协议终态与 ARCH-7 差距

- 后端 session 路径（Explore 总带 `session_id`）只转发 `node_finished`、`message`、`message_end`、`a2ui_command`，成功以 `data:[DONE]` 结束；失败发 `event: "error"`（code 100）后结束，不发 `[DONE]`（`agent_api.py` 840–866）。`node_started`、`user_inputs`、`workflow_finished` 被过滤。
- 前端：`message` 累积正文（`final` 也按增量）；`message_end` 写引用并结束该消息的流式；`event: "error"` 或 code 非 0 进入 ERROR，只显示固定文案。`[DONE]` 不是 JSON，在默认 `ignore` 模式下被跳过；EOF 时只要没进入 ERROR 就标 SUCCESS。
- 差距：无终态 EOF（既无 `message_end` 也无 `[DONE]`）被当成成功，ARCH-7 要求记为未确认；transport 返回的 `eof` / `aborted` 被丢弃；401 只给固定文案，与 REST 401 的会话处理未统一；失败时消息内错误与 toast 并存，消息内错误没有状态语义。

### 服务端取消、查询与持久历史

- 停止先本地 abort 并显示“已停止接收本次运行的输出。”；有当前 `task_id` 时再 `POST /api/v1/tasks/{id}/cancel`。`retcode 0` 且 `data: true` 只表示取消请求已提交或为空操作，界面写“已请求取消，正在等待任务响应。”，不判定任务已停止。后端不提供公共 Task 查询 API（`task_api.py`），前端不能读回终态。
- 历史：会话列表、详情、删除和按消息内容搜索，没有改名接口。后端在会话落库成功后才补发 `message_end`；本地中止后该轮是否落库由后端决定，前端不推断。
- SSE 帧的 `message_id`（canvas 生成）与落库消息 id 不是同一个值，不能用帧 id 关联历史消息。

### 引用格式

- `message_end.reference` 为 `{chunks, doc_aggs}`：`chunks` 是以 `hash_str2int(chunk_id, 500)`（0–499）为键的 map，正文 `[ID:n]` 用同一编号；`doc_aggs` 以文档名为键。共享 `extractReferencesFromSSEData` 把键记为 `reference_key`、数值记为 `reference_index`，角标按编号精确查找。
- 显示号：角标与来源面板直接显示 `reference_index`（即哈希编号），图片列表显示 `Fig. 编号+1`。是否改为按出现顺序重新编号需产品决定。
- 历史引用：后端只在读取时由 `_normalize_agent_session` 把会话级 `reference` 配给助手消息；会话级只存最后一轮，且遍历 map 形态的 `chunks` 得到的是键，推导结果为空列表。`RuntimeChatMessageList` 只在有引用时转换 `[ID:n]`，所以历史正文会显示协议原文（Home 已改为不可交互上标）。

### 草稿、附件、Begin inputs、A2UI、人工输入与执行来源

- 草稿归页面（W5b）：`useExploreDrafts` 包装共享 `useChatDrafts`，按身份、租户、Agent 与会话存在内存，换会话互不污染，新会话拿到 id 时随之迁移；SessionChat 重挂载不丢草稿。运行中可继续编写，只在空闲时发送；最后一条消息等待人工输入时 Composer 由 `disabled` 锁定。`useExploreRunRequest` 占有请求成功即视为接纳，只清掉提交的那份草稿：被锁拒绝或转去 Begin inputs 弹窗时原样保留，接纳后写下的新内容不受影响，之后的运行失败也不回填。IME 拦 `isComposing`、keyCode 229 与 `Process`。
- 附件用 `FileUploadDirectUpload` 上传；Explore 没传 `onDownloadAttachment`，助手附件不能下载（运行面板与分享页可以）。
- Begin inputs：本选择未提交参数时先暂存请求并打开参数弹窗，确认后带值发送；来源优先取会话 DSL。
- A2UI：`a2ui_command` 写入 xCard，动作经 `handleXCardAction` 以 `a2ui` / `metadata` 发起新一轮。
- 人工输入：`user_inputs` 写入 `awaitingInputs`，在最后一条消息上渲染表单；session 路径目前不下发该事件。
- 执行来源：新会话选草稿调试或已发布（建会话时转为 `release`）；已保存会话保留服务端快照，运行只带 `session_id`。

### 共享组件合同

`src/pages/agent/components/runtime-chat/` 下的两个组件，props 接口均未导出。

- `RuntimeChatMessageList`：`canvasId`、`messages`、`status`、`onSubmitAwaitingInputs` 必填；`density`（默认 `comfortable`）、`className`、`onXCardAction`、`onDownloadAttachment` 可选。组件只靠 `Bubble.List autoScroll` 滚动，自身没有 `role="log"`、`aria-live`、`aria-busy`；错误是普通红字段落。消费方：
  1. Explore `session-chat.tsx`：不传 `density`、`onDownloadAttachment`；`aria-live` / `aria-busy` 加在 ScrollArea 外层。
  2. `share/share-message-list.tsx`：`density="flush"`，传下载；`/agent/share` 与 `/chats/widget` 使用。
  3. `features/log-detail/components/transcript.tsx`：`canvasId=""`、`status=IDLE`、`density="compact"`、空的 `onSubmitAwaitingInputs`；只在编辑器运行台 live 模式的终态渲染。
  4. `runtime-chat-panel.tsx`：编辑器 `/agent/:id` 与 `/agent/:id/embed` 的运行面板，传下载。
- `RuntimeChatComposer`：`status`、`onSend`、`onStop` 必填；`canvasId`、`disabled`、`isTaskMode`、`density`、`placeholder`、`className`、`contentClassName`、`draft` / `onDraftChange` 可选。`onSend` 收到草稿本身，返回 `false` 表示未接纳。传 `draft` 为受控模式，由所有者在接纳后清除；不传时 Composer 自存草稿，`onSend` 未返回 `false` 即清掉提交的那份。消费方是 Explore `session-chat.tsx`（受控）与 `runtime-chat-panel.tsx`（非受控，placeholder 为硬编码中文）；分享页用自己的 `ShareComposer`。
- 改共享 props 或容器合同时以上消费方都要回归；目前没有真实渲染 MessageList 的测试，Explore 页面测试真实渲染 Composer。

### W5 开工前的差距

相对 Home 的 W1–W4：运行中输入与按接纳清空草稿已由 W5b 对齐；仍差滚动不分跟随与阅读；无终态 EOF 判成功；消息内错误无状态语义；历史引用为空且正文显示 `[ID:n]`；keyed 显示号未定。其中依赖后端的项（session 路径下发 `user_inputs` / `workflow_finished`、历史引用嵌入、帧 id 与落库 id 对齐）不由前端猜测补齐。
