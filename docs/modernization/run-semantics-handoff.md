# C1 请求取消与 AI 运行结果交接

基线：`f7767371e87ce59208a28b5e8ee2761f7e741fa1`；共享 checkout，未单独提交或推送。

## 行为与边界

- 普通 JSON 请求将调用方 AbortSignal 连接到实际 fetch，并覆盖响应 JSON 消费。已取消请求不发网络；自定义取消 reason 归一为 AbortError；真正的超时仍为 APIError(408, TIMEOUT)。结束后移除调用方 listener、清除 timer。
- Query 默认策略和 mutation 固定反馈识别预期取消：取消不重试、不显示通用错误；认证与其他错误的现有重试语义保持。
- 结构化 SSE 必须收到服务端终帧才完成。正常 EOF、断连、用户停止均保留部分正文与工具数据；不再合成 complete。第一次终态决定结果，重复终帧和迟到的内容/错误不覆盖结果。
- MCP 页面由 `useMcpChatRun` 独占请求和 session 归属，停止/切会话保留已收到内容与结果分类；卸载关闭订阅；旧请求不能覆盖新请求。未收到 tool_result 的工具不会因 tool_end/EOF/整体完成被标成功；0/false 结果保留。
- AI Fill 仅在 completed 且模型输出为字符串值 JSON 对象时覆盖字段。完整外观的 JSON 在 EOF 中断后仍仅保留预览；失效/卸载请求不能应用迟到结果。默认模型提示词与现有字符串表单合同同步。
- `/v1/llm/enhanced_chat_sse` 当前没有任务 ID 或服务端取消端点；MCP 停止只证明 locallyStopped。共享 Run 事件分类不等于接入了 durable Run 服务。

## 共享接口

`src/lib/streaming/index.ts` 导出：

- `RunPhase`：running、completed、failed、interrupted、locallyStopped、cancelRequested、serverCancelled。
- `isRunTerminal`、`transitionRunPhase`：cancelRequested 非终态；终态不再转移。
- `getServerRunPhase`：仅显式 run.cancelled 事件映射 serverCancelled；取消 HTTP ack 的调用方只能进入 cancelRequested。
- `getRunPhaseNotice`：固定中英文 chat.stream.\* 文案 key，不保留原始错误。
- `StructuredChatState.phase`、`finalizeStructuredChatState(state, reason)`。

`streamStructuredChat` 返回 `Promise<StructuredChatState>`；`onState` 接收增量及最终状态，包括抛出 HTTP/传输错误前的状态。`onMessage` 不再收到 EOF 伪造终帧。领域 fetch 已移入 `api/mcp-chat-service.ts`。

## 文件归属

API：`src/api/client.ts`、`request-abort.ts`、`mcp-chat-service.ts`；`src/lib/query-client.ts`、`mutation-error-feedback.ts`；对应 `src/api/__tests__/request-cancellation.test.ts` 与 `query-client-mutation-errors.test.ts`。

Streaming：`src/lib/streaming/{run-lifecycle,structured-chat-reducer,types,index}.ts`；`__tests__/structured-chat-reducer.test.ts`、`structured-chat-stream.test.ts`、`fixtures/structured-chat.ts`；`src/components/chat/structured-chat-stream.ts`。

消费者：`src/pages/mcp-chat/use-mcp-chat-run.ts` 及其测试、`src/pages/MCPChatPage.tsx`；`src/pages/ai-tools/ref/use-structured-ai-fill.ts`、`DataInput.tsx` 及其测试；`src/components/chat/ToolCallRenderer.tsx`、`__tests__/tool-json-rendering.test.tsx`；`src/types/mcp.ts`；`src/locales/{en-US,zh-CN}/chat.ts`。

## 已执行验证

| 命令                                                                                                                                                                                                                                       | 结果                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `npm run test:api`                                                                                                                                                                                                                         | exit 0，252 tests passed                                   |
| `npm run test:streaming`                                                                                                                                                                                                                   | exit 0，67 Node tests + 3 Vitest tests passed              |
| `npx vitest run src/pages/mcp-chat/__tests__/mcp-chat-run.test.tsx src/pages/ai-tools/ref/__tests__/structured-ai-fill.test.tsx src/components/chat/__tests__/tool-json-rendering.test.tsx src/hooks/__tests__/attachment-upload.test.tsx` | exit 0，4 files / 29 tests passed                          |
| `npm run verify:test-inventory`                                                                                                                                                                                                            | exit 0；新增测试进入 source-node/source-vitest lane        |
| 定向 ESLint                                                                                                                                                                                                                                | exit 0，零 error；既有 any/legacy React/a11y warnings 保留 |

Fixtures 根据当前后端 `api/apps/llm_app.py` 的实际 SSE 包装和工具事件形状编写；Run 取消事件名核对 `api/run_platform/events.py`。覆盖成功、EOF、错误、用户停止、取消请求/确认、重复终态、迟到响应和合法零值。它们是受控协议回归证据，不证明真实模型、服务端取消或生产运行。

完整 Web 类型/构建、全量测试及浏览器明暗主题验收由主 agent 的集成门禁执行。主 agent 需收紧文件体积基线：MCPChatPage 1554 → 1359 行，DataInput 736 → 694 行（以后续格式化最终行数为准）。

C2 的实际工具步骤展示继续补充了终态、重复 call/result、缺失结果和 call-id 匹配回归；最终 `npm run test:streaming` exit 0，共 71 Node + 3 Vitest tests。C2 展示及验证另见 `chat-home-handoff.md`。
