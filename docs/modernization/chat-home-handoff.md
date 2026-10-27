# C2 / A6 / D2 Home 与共享聊天展示交接

基线：`f7767371e87ce59208a28b5e8ee2761f7e741fa1`。共享 checkout；未暂存、提交或推送。C1 请求/运行合同另见 [run-semantics-handoff.md](run-semantics-handoff.md)。

## 最终行为

- Home 欢迎页与进行中的对话使用同一个领域输入适配器 `home-composer.tsx`，应用、工具与模型选择仍来自现有 store、Query 和配置。提示建议只写入草稿；选中的应用不会被默认模型 effect 覆盖。
- 共享 `ChatComposer` 使用已有 Ant Design X Sender，支持组合 slot；编辑草稿、Enter 提交、Shift+Enter 换行、IME 组合输入、准备中禁止发送、运行中停止接收。准备/运行期间可保留下一条草稿，配置变更由 Home 原有生命周期约束。输入组件不接管身份、会话、网络或草稿持久化。
- `ChatTranscript` 负责稳定消息行，`MessageParts` 统一正文、思考、检索、工具事件、Markdown、图片与真实引用。Home 原有请求归属、身份隔离、历史草稿、滚动视口和消息操作保留。
- `RunTimeline` 只显示已观察到的事件。原生 disclosure 保留用户展开选择；终态仍未收到工具结果时显示“未确认”，不继续旋转，也不合成成功或进度。合法 `0` / `false` 结果可见；replay、冲突终态、缺失结果、不同 call-id 均有回归。
- Home 旧状态通过纯函数 `getHomeMessagePhase` 映射共享 `RunPhase`；Studio 预览迁移共享输入和 `AppChatAnswer → MessageParts`，用户停止对应 locallyStopped，保留已收到正文。
- Markdown、代码与 Mermaid 读取最近 appearance scope 的 preset / mode / textScale。代码块使用共享字号/字体 token；图表维持 strict 安全配置。消息操作保留真实复制、朗读、重新生成能力。
- `chat.runTimeline.*` 与 `chat.markdownArtifact.*` 都归共享聊天资源；仅加载 chat 的中英文隔离测试已通过，避免 Studio / Explore / Search / Knowledge 依赖 Home 或 Agent catalog。

## 共享接口与文件

新增共享组件：

- `src/components/chat/chat-composer.tsx`：`ComposerState = ready | blocked { reason? } | running { stop }`；受控 `value/onChange/onSubmit`，`slots = context / attachments / leading / configuration / hint`，沿用 Sender autoSize / pasteFile / ref。
- `src/components/chat/chat-transcript.tsx`：语义消息行；现有 viewport 继续拥有 live region 和滚动行为。
- `src/components/chat/message-parts.tsx`：`run: { phase: RunPhase; steps?: AgentTimelineNode[] }`、原始正文/思考/引用、固定 notice、`onViewReference`。
- `src/components/chat/run-timeline.tsx`：实际事件与当前阶段投影；导出纯函数 `getToolStepStatus`。

共享适配与样式：`app-chat-answer.tsx`、`app-chat-composer.css`、`app-chat-message.css`、`CodeBlock.tsx`、`code-block.css`、`MarkdownCodeBlock.tsx`、`MarkdownArtifact.tsx`、`MessageActionsFooter.tsx`。`AppChatAnswer` 仍有 Studio / Explore 活动消费者，保留为薄适配器。

Home：`HomePage.tsx`；`components/{ChatSection,ChatInputBox,WelcomeSection,RecommendCards}.tsx`、新增 `home-composer.tsx`、`components/index.ts`；`constants/recommend-cards.ts`；`utils/{answer-status,index}.ts`；`src/locales/{en-US,zh-CN}/{home,chat}.ts`。

Studio：`src/pages/studio/create-app/components/preview-pane.tsx`。`preview-answer.tsx` 的现有 AppChatAnswer re-export 无需修改；预览引用测试补充 Node 环境 Shiki mock。

Streaming 补强：`src/lib/streaming/{agent-timeline,agent-timeline-events}.ts` 与 `__tests__/agent-timeline.test.ts`。第一终态不再被迟到 complete/error 改写；工具缺失结果不再默认成功，未知 call-id 不匹配同名其他工具。

已删除无活动消费者的旧展示：`src/components/chat/AgentThoughtChain.tsx`；Home 的 `WaveText.tsx`、`chat-markdown-renderers.tsx`、`home-chat-styles.tsx`、`utils/keyboard.ts`；对应 barrel 导出和无消费者的 home.agentTimeline 资源已移除。Home `useAtTrigger.ts` / `index.ts` 的无关格式化已还原，未留下改动。

来源详情相关文件由主 agent 独占，本任务沿用接口；没有修改 ReferencePanel / ReferenceDetailSheet / source-metadata / reference-meta 的内容。

## 实际验证

| 验证                                                                                                                   | 实际结果                                                    |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `npm run test:streaming`（最终源码）                                                                                   | exit 0，71 Node + 3 Vitest tests                            |
| `npx vitest run` 下列最终核心 10 文件                                                                                  | exit 0，43 tests                                            |
| Home 三组 stream / outcome / draft hook、answer-status-notice、LaTeX、process-disclosure、tool-json-rendering 定向回归 | exit 0，7 files / 71 tests                                  |
| `npx tsx --tsconfig tsconfig.app.json --test src/pages/home/utils/__tests__/answer-status.test.ts`                     | exit 0，9 tests                                             |
| `npx tsx --tsconfig tsconfig.app.json --test src/components/chat/__tests__/markdown-artifact.test.ts`                  | exit 0，18 tests                                            |
| 定向 ESLint：新增共享组件/测试、Home、Studio preview、agent timeline、两语 home/chat catalog                           | exit 0，0 errors；16 条已有 React import / a11y warnings    |
| `npm run verify:test-inventory`                                                                                        | exit 0，251 files；新增测试纳入 source-node / source-vitest |
| `git diff --check`                                                                                                     | exit 0                                                      |

最终核心命令：

```sh
npx vitest run \
  src/components/chat/__tests__/chat-composer.test.tsx \
  src/components/chat/__tests__/run-timeline.test.tsx \
  src/components/chat/__tests__/message-parts.test.tsx \
  src/components/chat/__tests__/markdown-diagram-appearance.test.tsx \
  src/components/chat/__tests__/markdown-artifact-locale.test.tsx \
  src/pages/home/components/__tests__/chat-input-box-lock.test.tsx \
  src/pages/home/components/__tests__/eng-6-capabilities.test.tsx \
  src/pages/home/__tests__/home-page-drafts.test.tsx \
  src/pages/studio/create-app/__tests__/preview-citations.test.tsx \
  src/pages/studio/create-app/components/__tests__/preview-pane.test.tsx
```

覆盖正常/修饰键 Enter、IME 229 / Process、组合期间按钮、准备/运行锁定、语言切换不丢编辑器 DOM / 焦点 / 选择 / 中文草稿、部分正文、微小正文更新、真实来源、工具未确认、零值、scope 代码与图表配置、chat-only catalog。新样式仍需主 agent 在真实浏览器检验布局与视觉；Mermaid 测试核对传入库的安全配置/appearance 参数，Node 测试使用图表适配 mock，不等于浏览器图表截图验收。

## 集成验收与最少 fixture

- 主 agent 统一运行完整类型、lint、test:ci、build、bundle / platform 门禁；本任务按分工未另跑全量命令。
- 浏览器验 Home 欢迎建议填草稿、进入对话、@ 模型/应用配置、流中继续编辑下一条草稿、停止后保留部分正文、中英文切换与 IME；Studio 验输入键盘与引用详情焦点。
- 明暗/preset/textScale 验 Markdown 代码、表格、引用、工具详情和 Mermaid；focus / reduced-motion 依赖全局 token 与 appearance provider。
- 受控 SSE 可直接复用 `src/lib/streaming/__tests__/fixtures/structured-chat.ts` 的 encodeSSE / completed / partial / failed。实际 MCP endpoint 为 `/v1/llm/enhanced_chat_sse`；去掉服务端完成帧测 EOF，在 partial 后保持连接测停止。真实工具 call/result 里使用 `0` / `false`，不能把仅 tool_end 当作工具成功。
- 引用 fixture 必须包含真实合同字段，例如 chunk 的 `id`、`dataset_id`、`document_id`、`document_name`、`content`；正文使用已有 `[ID:0]` 标记，最终引用包仍走现有消费链。无需新增测试路由或改运行时 store。
- 未证明真实模型、真实工具或服务端取消。停止 UI 只声称停止接收。来源、步骤、产物均取实际数据，不生成演示业务进度。

最终文件体积供主 agent 收紧基线：ChatSection 642 → 200 行，APIClient 586 → 570 行，MCPChatPage 1554 → 1359 行，DataInput 736 → 694 行；新增共享展示文件均少于 600 行。
