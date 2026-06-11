# 统一 Streaming Runtime 设计稿（ARCH-1）

> 状态：阶段 1 实施中。本稿是 `docs/engineering-modernization-roadmap.md` ARCH-1 要求的动工前设计文档。

## 1. 问题与库存核实（2026-06-11 实扫）

路线图 ARCH-1 列出 8 个并行流式实现。实扫核实结果：

1. 8 个调用面全部存在、路径无漂移（见路线图 ARCH-1 清单）。
2. **清单补漏**：`src/pages/agent/features/pipeline-workbench/hooks/use-pipeline-workbench.ts`（约 233-260 行）是第 9 个流式读取面——`TextDecoderStream` + 手动 `split(/\r?\n/)` + `data:` 前缀剥离，用于从运行流提取 message_id。已按路线图维护协议补记入账。
3. `src/pages/agent/features/runtime-workbench/utils.ts` 中的 `split(/\r?\n/)` 是对已聚合文本做 NDJSON 分类判断，不是流式 transport，不入清单。
4. 9 个面中 4 个（useHomeChat、use-create-app-preview、ExplorePage、useSearchExecution）已共用纯 reducer `src/utils/streaming-answer.ts`。**真正被复制的是 transport 读循环**：`pipeThrough(TextDecoderStream) → pipeThrough(EventSourceParserStream) → getReader() → while + abort 检查 + JSON.parse(value.data)`。
5. `src/utils/__tests__/streaming-answer.test.ts` 存在且可跑，但不被任何 npm script / CI 覆盖（死测试）。同类问题：`src/utils/__tests__/agent-timeline.test.ts`（归 mcp-agent-stream 迁移阶段接管）。
6. `src/components/chat/EnhancedSSEParser.ts`（手写 TextDecoder + `split('\n')` 解析，违反 CLAUDE.md 流式规则第 3 条）不被 9 个流式面使用；使用者为 MCPChatPage.tsx、DataInput.tsx，另有 ToolCallRenderer.tsx 与 pages/home/types.ts 仅导入类型。
7. abort 缺口：`conversationAPI.completion` 此前不接收 AbortSignal——调用面的「停止」只能跳出读循环；fetch 未返回 Response 阶段无法取消连接。

## 2. 模块边界

```
src/lib/streaming/
├── types.ts            # SSEEnvelope<TData> + StructuredStreamMessage 判别联合（类型单源）
├── transport.ts        # assertSSEResponse + readSSEStream（fetch Response → 类型化事件）
├── answer-reducer.ts   # chunk-merge 纯 reducer（自 src/utils/streaming-answer.ts 物理搬迁）
├── index.ts            # 命名再导出
└── __tests__/
    ├── answer-reducer.test.ts
    └── transport.test.ts
```

职责切分：

- **transport（怎么读）**：只接收 `Response`，负责 `TextDecoderStream → EventSourceParserStream → 读循环 → JSON.parse → onEvent`，以及 abort 即时生效（signal listener 触发 `reader.cancel()`，cancel 沿 pipe 链传播关闭连接）。不持有 fetch：各面的 fetch 所有权不同（API client / 裸 fetch / 各自鉴权头），按 CLAUDE.md 流式规则 2，AbortController 生命周期归调用方；**但 signal 必须贯穿 fetch 发起 → Response → 读循环全程**，因此流式 API 方法（如 `conversationAPI.completion`）须接收可选 `{ signal }` 透传给 fetch。
- **types（读出来是什么）**：通用后端 envelope `SSEEnvelope<TData>`（`retcode/code/retmsg/data/start_to_think/end_to_think`，`data === true` 为终止帧）；以及自 EnhancedSSEParser 收编的结构化消息判别联合（text / tool_call / tool_result / tool_start / tool_end / error / complete / metadata + ToolCallInfo），`any` 一律收紧为 `unknown`。EnhancedSSEParser 改为从本模块导入并 re-export 这些类型（类型单源，运行时本体待删除阶段处理）。
- **reducer（读完怎么合并）**：`consumeStreamingAnswerChunk` 等纯函数，零依赖、可单测。原 `src/utils/streaming-answer.ts` 保留为 re-export shim，存量导入面零改动。

### parse error 策略（显式化）

各存量面对坏帧行为不一致：use-create-app-preview / runtime-stream 静默跳过；mcp-agent-stream 直接抛错。因此 `readSSEStream` 提供 `parseErrorMode: 'ignore' | 'throw'`（缺省 `'ignore'`）+ `onParseError` 观测钩子。**迁移每个面时必须按其原行为显式选择**，不允许被缺省值悄悄改变语义。

### 各面将来如何接入

| 面                                                                         | 接入方式                                                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 收到 Response 的面（completion / askStream / runExternalAgent / runAgent） | `assertSSEResponse(response)` + `readSSEStream<SSEEnvelope<T>>(response, { signal, onEvent })`，事件交各自 reducer |
| 自有 fetch 的面（mcp-agent-stream、report-sse）                            | fetch 照旧自持（鉴权头不动），Response 交 `readSSEStream`；mcp-agent-stream 用 `parseErrorMode: 'throw'`           |
| runtime-stream.ts                                                          | 已是薄封装，整体替换为 re-export 或直接删除改引 lib                                                                |
| pipeline-workbench（提取 message_id 即停）                                 | `readSSEStream` + onEvent 中拿到 id 后 abort 自己的 controller                                                     |
| ExplorePage 内联两段                                                       | 与拆文件（棘轮在册债务）一并迁移                                                                                   |

事件类型扩展方式：按面实例化 transport 泛型（如 `readSSEStream<SSEEnvelope<ReportProgress>>`），不做全局 mega-union——agent runtime 与 report 帧形状互不相关。

## 3. 公共 API

```ts
// transport.ts
export async function assertSSEResponse(response: Response): Promise<void>
// !ok → 取 clone().json() 的 .message/.retmsg，兜底 `HTTP <status>: <statusText>`；!body → throw

export interface ReadSSEStreamOptions<T> {
  signal?: AbortSignal
  onEvent: (event: T, rawData: string) => void
  parseErrorMode?: 'ignore' | 'throw' // 缺省 'ignore'
  onParseError?: (rawData: string, error: unknown) => void
}
export async function readSSEStream<T = unknown>(
  response: Response,
  options: ReadSSEStreamOptions<T>,
): Promise<void>
```

本阶段刻意不做的：React hook 封装、fetch-owning 变体、重连/Last-Event-ID。均可在不破坏此 API 的前提下后续叠加（重连语义按 CLAUDE.md 流式规则 4：标记 interrupted + retry affordance，不静默重拉）。

## 4. 验收口径修正

路线图原验收 grep `new TextDecoder\|split('\n\n')` 不可靠：`new TextDecoder` 会子串误命中合法的 `new TextDecoderStream()`；且漏掉 EnhancedSSEParser 实际使用的 `split('\n')` 与 pipeline-workbench 的 `split(/\r?\n/)`。修正为分阶段验收：

- **每迁移一个面**：该面文件 `grep -n "EventSourceParserStream\|TextDecoderStream\|JSON.parse"` 零命中（解析样板全部收口到 lib）。
- **终态（阶段 3 完成）**：用精确模式扫描流式入口——`new TextDecoder(`、`split('\n')`、`split(/\r?\n/)`（限流式读循环上下文）零命中；全部流式入口 import 自 `@/lib/streaming`。

## 5. 迁移顺序建议（阶段 2，每面一个 PR）

按风险升序：

1. ~~`runtime-stream.ts`~~（✅ 2026-06-11 已迁移：改为委托 lib 的薄模块，61→18 行；刻意不向 `readSSEStream` 传 signal——两个调用方依赖 AbortError 向外传播进入 STOPPED 态）
2. ~~`report-sse.ts`~~（✅ 2026-06-11 已迁移：读循环换 `readSSEStream<SSEEnvelope>`，88→68 行；同样不传 signal——调用方依赖 AbortError 静默退出，干净 resolve 会误抛「ended without a result」）
3. ~~`mcp-agent-stream.ts`~~（✅ 2026-06-11 已迁移：`parseErrorMode: 'throw'` 保「坏帧即抛错」原行为；timeline reducer（agent-timeline.ts + agent-timeline-events.ts）照 answer-reducer 模式物理搬入 lib + 原址 shim，死测试 agent-timeline.test.ts 随迁进 `test:streaming` 门禁；此面把 signal 传给了 readSSEStream——调用方 useHomeChat 在 catch 里直接查 `signal.aborted` 而非依赖 AbortError 类型，干净退出正是原代码 `signal.aborted → reader.cancel()` 的本意）
4. ~~`use-pipeline-workbench.ts`~~（✅ 2026-06-11 已迁移：手写 `split(/\r?\n/)` 解析换 `readSSEStream` + Promise 早返回——拿到 message_id 即继续，流在后台排空、不 cancel 连接（运行由服务端继续，停止另走 cancelDataflow）；不传 signal，保 AbortError → STOPPED 语义；`extractMessageIdFromChunk` util 零改动，吃 rawData）
5. ~~`use-create-app-preview.ts`~~（✅ 本阶段试点已迁移）
6. ~~`useHomeChat.ts`~~（✅ 2026-06-11 已迁移：app 模式读循环换 `readSSEStream<SSEEnvelope>`，completion 挂上 signal（迁移前停止按钮在 app 模式实际失效——fetch 无 signal 且 stopStreaming 先 abort 后置 null ref，循环判 ref 永 falsy）；catch 改判局部 `abortController.signal.aborted` 防 ref 竞态。MCP 模式经 mcp-agent-stream 已在 lib 上，其 catch 的 ref 竞态随后按 owner 指示一并修复）
7. `use-shared-agent-runner.ts`（事件状态机较重，外部 embed 面，回归点多）
8. `useSearchExecution.ts`（多阶段 + rAF 批处理，迁移时不得破坏批处理节奏）
9. `ExplorePage.tsx` 内联两段（棘轮在册 2369 行，建议与文件拆分一起做）

阶段 3：迁移 MCPChatPage / DataInput 两个 EnhancedSSEParser 使用者到 lib + 各自 reducer，然后删除 EnhancedSSEParser 运行时（类型已在阶段 1 归一到 `@/lib/streaming`）。

## 6. 测试与门禁

- `npm run test:streaming`：`tsx --tsconfig tsconfig.app.json --test src/lib/streaming/__tests__/*.ts`，进 `.github/workflows/ci.yml` checks job。
- reducer 测试：chunk 合并逻辑（增量/累计 merge、think 标记注入、终止帧、错误码、finalize 分割），不测网络。
- transport 测试：合成 `Response(new ReadableStream)` 注入 SSE 字节，覆盖多帧有序、帧跨 chunk 边界、坏帧 ignore/throw 两模式、空 data 跳过、流中 abort 即停、assertSSEResponse 三分支。
