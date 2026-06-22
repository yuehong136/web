# 工程现代化路线图（Engineering Modernization Roadmap）

> 本文档是一次全仓批判性审计的产物与后续整改的**唯一进度账本**。
> 审计日期：2026-06-10，基准提交：`030a3b2`，审计者：Claude（Fable 5）+ 仓库 owner 确认。
> 对照系：2026 年主流 AI 前端/全栈项目实践（Vercel AI SDK、assistant-ui、shadcn 生态、TanStack 官方范式、OpenAPI codegen 工作流等）。

## 维护协议（MANDATORY — 任何处理本文档条目的 agent 必须遵守）

1. **开工前**：通读目标条目的全部小节（问题/证据/方案/验收），并用当前代码**重新核实证据**——本文档是时点快照，行数、文件名可能已漂移；以实际为准，发现漂移先更新证据再动手。
2. **完工后**：必须更新该条目的「状态与进展记录」表：填日期、提交哈希、实际做了什么、如何验证、遗留问题。状态枚举：`未开始` / `进行中` / `已完成` / `部分完成` / `已否决（写明原因）`。
3. **范围变化**：发现新问题 → 按现有 ID 规则追加新条目（不要塞进无关条目）；发现某条目不再成立 → 标记 `已否决` 并写明原因，**不要删除条目**（保留决策历史）。
4. **同步义务**：条目完成若改变了开发流程（新脚本、新门禁、新目录），必须同步 `CLAUDE.md` 与 `AGENTS.md`（双语镜像，同一提交）。
5. 本文档用**稳定 ID** 引用条目（SEC-x / ARCH-x / ENG-x / HYG-x），提交信息和 PR 里也用这些 ID。

## 审计方法与基线指标（2026-06-10 实测）

所有数字均为实际命令输出，非估算：

| 指标                                              | 实测值                                        | 测法                                              |
| ------------------------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| src 源文件数                                      | 1308 个 `.ts/.tsx`                            | `find src -name "*.ts" -o -name "*.tsx" \| wc -l` |
| 测试文件数                                        | 40（覆盖率约 3%）                             | 同上加 `.test.` 过滤                              |
| `: any` 出现次数                                  | 246                                           | grep                                              |
| lint 现状                                         | 0 errors / ~1580 warnings                     | `npm run lint`                                    |
| 超 600 行的源文件（排除 locales/generated/tests） | 36 个                                         | 见 `scripts/file-size-baseline.json`              |
| JS 产物总量（不含 sourcemap）                     | 24.9 MB                                       | `find dist/js -name "*.js" ! -name "*.map"` 求和  |
| 最大 chunk                                        | vendor-graph-antv 1.4MB（gzip 387KB）         | build 输出 + gzip 实测                            |
| Zustand stores                                    | 13 个共 3498 行（model.ts 751）               | `wc -l src/stores/*`                              |
| 手写 API 类型                                     | types/api.ts 1604 行 + types/index.ts 2075 行 | `wc -l`                                           |
| API 边界 zod 校验                                 | 0 处（zod 仅用于表单）                        | `grep -rln "z\." src/api` 为空                    |

---

## SEC — 安全级（最高优先）

### SEC-1 认证凭证存 localStorage（含 refresh token）

- **状态**：未开始
- **问题**：`auth_token` 与 `refresh_token` 均持久化在 localStorage（`src/api/client.ts:119`、`src/constants/index.ts:45-46`）。本产品大量渲染 LLM/工具输出，XSS 攻击面真实存在（prompt injection → XSS 升级链已被 ESLint 规则部分拦截，但拦不住全部）。一旦 XSS，攻击者拿走 refresh token = **永久账号接管**。
- **主流对照**：refresh token 放 httpOnly + Secure + SameSite cookie；access token 只活在内存（页面刷新用 refresh cookie 静默换取）。
- **方案**：需要后端配合改造登录/刷新接口（Set-Cookie）。前端侧：`APIClient` 去掉 localStorage 读写，token 改内存字段；401 时静默 refresh（已有 `_isRetry` 重试骨架可复用）；登出调后端清 cookie。过渡期可先做"refresh token 进 cookie、access token 仍短时 localStorage"的折中。
- **验收**：localStorage 中无任何 token 键；刷新页面会话不丢；XSS PoC（在控制台执行脚本）拿不到可换长期凭证的东西。
- **状态与进展记录**：

| 日期       | 动作             | 提交 | 备注 |
| ---------- | ---------------- | ---- | ---- |
| 2026-06-10 | 立项，待后端排期 | —    | —    |

### SEC-2 全站无 Content-Security-Policy

- **状态**：未开始
- **问题**：`index.html`、`docker/`、`deploy/` 中均无 CSP 配置。对渲染模型输出的产品，CSP 是第一道防线，DOMPurify 只是第二道。
- **方案**：在 nginx/部署层下发 CSP 响应头（meta 标签为降级方案）。起步策略建议：`default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`，配合 report-only 模式灰度一周收集违例再收紧。注意已知的合法外联：API/WS 域名（`VITE_API_BASE_URL`）、模型头像/附件代理域。sandbox iframe 的 `srcdoc` 内容受嵌入页 CSP 约束，需验证 html-report 渲染不被误杀（可能需要 `frame-src data:` 或单独的 frame CSP）。
- **验收**：生产响应头含 CSP；html-report、文档预览、agent share embed 三个高危面功能正常；report-only 期无误杀后切 enforce。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### SEC-3 dangerouslySetInnerHTML 净化缺口审计

- **状态**：已完成（2026-06-10）
- **问题**：`dangerouslySetInnerHTML` 出现在 9 个文件，引用 DOMPurify 的只有 7 个文件。差值文件需逐处审计（文件级粗测，可能有同文件内净化但跨文件传入未净化的情况）。
- **当时命中的 9 个文件**：chat/ReferenceMarker、chat/MarkdownRenderer、chat/ReferenceDetailSheet、knowledge/HighlightText、knowledge/document-preview/docx-preview、settings/ApiKeysPage、studio/create-app/utils、search/detail/search-chunk-list、knowledge/document-chunks/chunk-list-row。
- **方案**：逐处确认 `__html` 的数据来源与净化链路；不可信来源（模型输出、文档内容、用户输入）必须净化；封装一个 `SafeHtml` 组件统一走 DOMPurify，逐步替换裸用法；考虑加自定义 lint 规则强制 `__html` 只能来自净化函数。
- **验收**：9 处全部有结论（安全来源说明 or 已修复）；新增 lint 防回归。
- **审计结论（9/9 全部有结论）**：
  - **已修复（原裸渲染模型输出，实锤 XSS 缺口）**：chat/MarkdownRenderer（聊天消息经 markdown-it `html:true` 直渲）、studio/create-app/utils（预览消息同样直渲）。两处改走 `SafeHtml`（`ADD_ATTR: ['target','rel']` 保留外链属性，DOMPurify 默认白名单不含 target）。
  - **已净化、迁移到 SafeHtml 统一出口**：chat/ReferenceMarker、chat/ReferenceDetailSheet、knowledge/HighlightText、knowledge/document-preview/docx-preview、search/detail/search-chunk-list、knowledge/document-chunks/chunk-list-row（数据来源均为文档解析/检索高亮，不可信但原已过 DOMPurify；白名单提为模块常量经 `options` 传入）。
  - **安全来源（静态可信常量）**：settings/ApiKeysPage 的内联 `<style>` 滚动条 CSS（模板字面量、无插值）。已移入 `api-keys-page.css` 并改用 `components-scrollbar-*` 语义令牌，文件净减 31 行（棘轮基线同步收紧 4068 → 4037）。
- **落地物**：`src/components/ui/safe-html.tsx`（唯一 HTML 渲染出口，内部 DOMPurify）；`eslint-rules/no-raw-dangerously-set-inner-html.js`（error 级，仅放行 SafeHtml 自身实现与 `__html` 为 `sanitize(...)` 调用字面量的形式；已用临时违例 fixture 实测命中后删除）；CLAUDE.md / AGENTS.md 安全章节同步。
- **验证**：`npm run lint`（0 errors）、`npm run lint:file-size`、`npm run build`、`npm run check:bundle-size`、`npm run test:agent-t1`（47 pass）、`npm run test:design-tokens`（11 pass）、`npm run lint:i18n-agent` 全部通过。
- **遗留**：lint 规则的 `sanitize*` 调用放行是静态启发（不验证函数体确实走 DOMPurify），由 code review 把关；迁移后全仓已无该形式的使用。
- **状态与进展记录**：

| 日期       | 动作                                                       | 提交    | 备注                                                                                                                                                               |
| ---------- | ---------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-06-10 | 立项                                                       | —       | —                                                                                                                                                                  |
| 2026-06-10 | 新增 SafeHtml 统一净化出口                                 | 4ed8f89 | `src/components/ui/safe-html.tsx`                                                                                                                                  |
| 2026-06-10 | 修复 2 处未净化 + 迁移 6 处 + ApiKeysPage 内联 style 迁出  | 1dd6c3f | 9/9 命中处全部收口；棘轮基线收紧                                                                                                                                   |
| 2026-06-10 | 上线 `security/no-raw-dangerously-set-inner-html`（error） | a2c66a7 | 含 CLAUDE.md / AGENTS.md 同步；全仓 lint 0 errors                                                                                                                  |
| 2026-06-11 | 修复 CI 棘轮红：拆出 `reference-meta.tsx` 共享辅助         | 38ef444 | Prettier 提交时重排版使 ReferenceDetailSheet.tsx 涨到 630 行；抽出与 ReferenceMarker 重复的 doc-type/相似度辅助后降到 529 行（按格式化后形态实测），全门禁复跑通过 |

---

## ARCH — 架构级

### ARCH-1 统一 streaming/chat runtime（最大架构收益）

- **状态**：已完成（2026-06-12）——阶段 1 lib 落地、阶段 2 全部 9 面迁移、阶段 3 删除 EnhancedSSEParser；终态精确 grep 零命中（见进展表末行）
- **问题**：全仓至少 **8 套并行流式实现**，各自维护 transport、解析、abort、状态：
  `src/pages/home/hooks/useHomeChat.ts`、`src/pages/home/utils/mcp-agent-stream.ts`、`src/pages/agent/form/html-report/designer/report-sse.ts`、`src/pages/agent/features/runtime-workbench/runtime-stream.ts`、`src/pages/studio/create-app/hooks/use-create-app-preview.ts`、`src/pages/explore/ExplorePage.tsx`（内联）、`src/pages/search/detail/hooks/useSearchExecution.ts`、`src/pages/agent/share/use-shared-agent-runner.ts`。
  另有 `src/components/chat/EnhancedSSEParser.ts` 是**手写 SSE 解析器**（不依赖 eventsource-parser），直接违反 CLAUDE.md 流式规则第 3 条。后果：abort/重连/token 统计行为在各面上不一致，每加一个聊天面就 fork 一份逻辑。
  **补记（2026-06-11 实扫）**：另发现第 9 个流式读取面 `src/pages/agent/features/pipeline-workbench/hooks/use-pipeline-workbench.ts`（手动 `split(/\r?\n/)` + `data:` 前缀剥离提取 message_id），归入迁移清单；`conversationAPI.completion` 此前不接收 AbortSignal，fetch 发起阶段无法取消（阶段 1 已补）。
- **主流对照**：Vercel AI SDK（useChat + 统一 stream protocol + typed parts）、assistant-ui、@ant-design/x-sdk（已安装未充分利用）。共同点：单一 transport + 单一消息状态机，渲染层只消费 typed parts。
- **方案**（建议分三步，每步可独立合并）：
  1. 抽 `src/lib/streaming/`：transport（fetch+eventsource-parser+AbortController 生命周期）、事件 envelope 类型（合并 EnhancedSSEParser 的消息类型定义）、chunk-merge reducer（纯函数，必须配测试）。
  2. 把 8 个实现逐个迁移到该 runtime（每个一个 PR，回归点明确）。
  3. 删除 EnhancedSSEParser 与各处手写解析。
- **验收**：~~`grep -rn "new TextDecoder\|split('\\n\\n')" src` 在流式场景零命中~~（口径修正 2026-06-11：原模式会子串误命中合法的 `new TextDecoderStream()`，且漏掉 `split('\n')` / `split(/\r?\n/)` 形态的手写解析）。改为分阶段验收：每个已迁移面 `grep -n "EventSourceParserStream\|TextDecoderStream\|JSON.parse"` 零命中（解析样板收口到 `@/lib/streaming`）；终态用精确模式（`new TextDecoder(`、`split('\n')`、`split(/\r?\n/)` 限流式读循环）扫描零命中。所有流式入口共享同一 abort/重连语义；reducer 有单测。详见 `docs/streaming-runtime-design.md` 第 4 节。
- **状态与进展记录**：

| 日期       | 动作                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 提交           | 备注                                                                                                                                                                                                                                                                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | 立项；动手前先出设计稿放 `docs/streaming-runtime-design.md`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | —              | —                                                                                                                                                                                                                                                                                                                                                                      |
| 2026-06-11 | 设计稿落地；实扫补记第 9 个面 pipeline-workbench；验收 grep 口径修正                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 5a8126c        | 见 `docs/streaming-runtime-design.md`                                                                                                                                                                                                                                                                                                                                  |
| 2026-06-11 | `src/lib/streaming/` 落地（transport / types / answer-reducer + 25 个单测）；`test:streaming` 进 CI；reducer 自 `src/utils/streaming-answer.ts` 物理搬迁（原址留 shim，存量面零改动）；EnhancedSSEParser 消息类型归一到 lib；`conversationAPI.completion` 补 `{ signal }`；CLAUDE.md/AGENTS.md 同步                                                                                                                                                                                                                                                                                                                                                                                                                                         | cf52f88        | 验证：`npm run test:streaming`（25 pass）+ 全量门禁                                                                                                                                                                                                                                                                                                                    |
| 2026-06-11 | 试点迁移 `use-create-app-preview.ts` 到共享 runtime（1/9）；abort 现贯穿 fetch 发起阶段；该面解析样板 grep（`EventSourceParserStream\|TextDecoderStream\|JSON.parse` 与 `new TextDecoder\|split('\n\n')` 双口径）零命中                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | 6914acc        | 遗留迁移顺序见 `docs/streaming-runtime-design.md` 第 5 节：runtime-stream → report-sse → mcp-agent-stream（parseErrorMode: 'throw'，接管死测试 agent-timeline.test.ts）→ pipeline-workbench → useHomeChat → use-shared-agent-runner → useSearchExecution（保 rAF 批处理）→ ExplorePage 内联（随拆文件）；阶段 3 迁 MCPChatPage/DataInput 后删 EnhancedSSEParser 运行时 |
| 2026-06-11 | 阶段 2 启动：迁移 `runtime-stream.ts`（2/9），改为委托 `@/lib/streaming` 的薄模块（61→18 行），删除无引用的 `assertRuntimeStreamResponse`；两个调用方（runtime-workbench / explore-session-chat）零改动                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | （见 git log） | 刻意不传 signal 给 `readSSEStream`：调用方依赖 AbortError 向外传播进入 STOPPED 态；解析样板 grep 零命中                                                                                                                                                                                                                                                                |
| 2026-06-11 | 迁移 `report-sse.ts`（3/9）：读循环换 `readSSEStream<SSEEnvelope>`（88→68 行），域逻辑（done 帧/收尾标记/进度帧/错误帧）原样保留；两个调用方（use-run-fill / use-generate-skeleton）零改动                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | c36d946        | 同 runtime-stream：signal 只留 fetch，不传 readSSEStream，保 AbortError 静默退出语义；HTTP 错误文案升级为 assertSSEResponse 的 retmsg 提取                                                                                                                                                                                                                             |
| 2026-06-11 | 迁移 `mcp-agent-stream.ts`（4/9）：`parseErrorMode: 'throw'` 保「坏帧即抛错」；timeline reducer 两文件照 answer-reducer 模式搬入 lib + 原址 shim（4 个既有导入方零改动）；死测试 `agent-timeline.test.ts` 随迁进 `test:streaming` 门禁                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | a3f778d        | 此面 signal 传给了 readSSEStream：调用方 useHomeChat 在 catch 里查 `signal.aborted` 而非依赖 AbortError，干净退出即原代码 `signal.aborted → reader.cancel()` 本意                                                                                                                                                                                                      |
| 2026-06-11 | 迁移 `use-pipeline-workbench.ts`（5/9，实扫补记面）：手写 `split(/\r?\n/)` + `data:` 剥离换 `readSSEStream` + Promise 早返回；拿到 message_id 后流转后台排空、不 cancel 连接（运行由服务端继续，停止另走 cancelDataflow）；本面手写的 !ok/!body 检查换 assertSSEResponse                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | 66b55d8        | 不传 signal 给 readSSEStream，保 AbortError → STOPPED；`extractMessageIdFromChunk` util 零改动（吃 rawData）；解析样板 grep 零命中                                                                                                                                                                                                                                     |
| 2026-06-11 | 迁移 `useHomeChat.ts` app 模式（6/9）：读循环换 `readSSEStream<SSEEnvelope>`（598→583 行），completion 挂 signal；catch 改判局部 `abortController.signal.aborted`（修复迁移会引入的回归：stopStreaming 先 abort 后置 null ref，旧 ref 判空在挂 signal 后会把用户中止误报成错误）。引用合并/内容更新逻辑逐行原样                                                                                                                                                                                                                                                                                                                                                                                                                             | 46b659c        | 迁移前 app 模式停止按钮实际失效（fetch 无 signal + ref 竞态使循环 break 永不触发，仅 UI 停止）；迁移后停止真正断流。MCP 模式 catch 的同型 ref 竞态随后按 owner 指示修复（见下一行）                                                                                                                                                                                    |
| 2026-06-11 | 修复 `useHomeChat.ts` MCP 模式 catch 的 ref 竞态（owner 指示）：AbortController 改局部捕获，catch 判 `abortController.signal.aborted` 而非可空 ref——此前用户在 fetch 阶段点停止会被误报「发送消息失败」toast                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | （见 git log） | 全仓 `abortControllerRef.current?.signal.aborted` 形式的判断已清零（grep 验证）                                                                                                                                                                                                                                                                                        |
| 2026-06-12 | 迁移 `use-shared-agent-runner.ts`（7/9，外部 share/widget embed 面）：手写 HTTP 检查 + 读循环换 `assertSSEResponse` + `readSSEStream`；事件状态机（normalizeRuntimeEvent / handleNormalizedEvent / messageStateRef）逐行原样；不传 signal 给 readSSEStream——catch 依赖 AbortError（DOMException）进「已停止当前运行」分支；parseErrorMode 缺省 'ignore' 保坏帧静默跳过                                                                                                                                                                                                                                                                                                                                                                      | a60563d        | 验证：lint / lint:file-size / test:streaming / build 全绿；该面解析样板 grep 零命中；行为差异仅 !body 文案（'公共运行接口…' → lib 统一文案）与 HTTP 错误体提取顺序一致；scoped-theme / postMessage（lib/agent/embed/）零触碰                                                                                                                                           |
| 2026-06-12 | 迁移 `useSearchExecution.ts`（8/9，搜索详情 SUMMARIZING 段）：读循环换 `assertSSEResponse` + `readSSEStream<SSEEnvelope>`；signal 传给 readSSEStream——原循环自带 `signal.aborted → reader.cancel()`，catch 查 `signal.aborted` 布尔（局部 const）；rAF 批处理与 6 阶段状态机一行未动；parseErrorMode 缺省 'ignore' 对应原 JSON.parse catch-continue；onEvent 内流错误帧即 throw 语义不变                                                                                                                                                                                                                                                                                                                                                    | b347b39        | 验证：lint / lint:file-size / test:streaming / build 全绿；该面解析样板 grep 零命中；行为差异仅 HTTP 错误文案（`HTTP <status>` → assertSSEResponse 的 retmsg 提取）；allSettled 后与 catch 内的 aborted 检查保留（B 型干净 resolve 与 fetch 阶段 abort 各自依赖）；检索/相关问题非 SSE 路径零触碰                                                                      |
| 2026-06-12 | 迁移 `ExplorePage.tsx` 内联两段（9/9，阶段 2 完成）：app completion 与 chat_service_sse 兜底循环均换 `assertSSEResponse` + `readSSEStream<SSEEnvelope>`，onEvent 逻辑逐行原样；signal 补接 completion/fetch 并传 readSSEStream，controller 局部捕获，catch 开头判 aborted 短路（owner 点名照 46b659c：迁移前停止按钮实际失效——signal 从未接线，流后台继续消费；fetch 挂 signal 后不短路会把用户停止误报为发送失败并回滚消息）；parseErrorMode 两段缺省 'ignore'；只迁流式不拆文件                                                                                                                                                                                                                                                           | 22b8495        | 验证：lint / lint:file-size / test:streaming / build 全绿；该面解析样板 grep 零命中；行为差异：HTTP 错误文案统一 + 停止按钮由失效变为真正断流（声明的必要修正）；棘轮基线收紧 2369 → 2343（`lint:file-size:update` 同提交）                                                                                                                                            |
| 2026-06-12 | 阶段 3 启动：EnhancedSSEParser 的消息状态机逐行移植为纯 reducer `src/lib/streaming/structured-chat-reducer.ts`（handleMessage / processStructuredMessage / processLegacyMessage / think 标记注入 / legacy `<tool_call>` 正则解析 / `name:args:result` 签名去重 / call_id 生命周期 / 合成 complete 抑制全部保留，含「缺省 result 记 success」原怪癖）；`createSyntheticCompleteMessage` 复刻 connect() 流尽合成 complete；index.ts 命名导出；新增 10 个单测进 `test:streaming`（glob 已覆盖，npm script 零改动）                                                                                                                                                                                                                             | 4ed009c        | 验证：test:streaming 43 pass（33+10）；lint / lint:file-size / build 全绿；EnhancedSSEParser 运行时尚未删除（待 MCPChatPage / DataInput 迁移后）                                                                                                                                                                                                                       |
| 2026-06-12 | 迁移 `MCPChatPage.tsx`（阶段 3 之 2）：`new EnhancedSSEParser().connect(...)` 换共享薄助手 `components/chat/structured-chat-stream.ts`（fetch 同款头 + assertSSEResponse + readSSEStream + structured-chat-reducer + 合成 complete，错误改为向调用方传播）；onMessage switch 逐行原样（`(message, parserState)` 形态保留）；`sseParserRef` → `abortControllerRef`，四处 disconnect 改 abort+置 null；signal 只挂 fetch 不传 readSSEStream——原 connect 的 catch 依赖 `error.name === 'AbortError'` 静默（A 型），abort 时 AbortError 中断读取、合成 complete 天然跳过；页内 try/catch 复刻原 onError（console.error + toast '连接出错'，error 帧 throw 同路径）；parseErrorMode 'ignore' + onParseError console.error 保原「坏帧打日志跳过」 | 7aab123        | 验证：lint / lint:file-size / test:streaming（43 pass）/ build 全绿；该面解析样板 grep 零命中；行为差异仅 HTTP/!body 错误文案统一到 assertSSEResponse；棘轮基线收紧 1583 → 1581                                                                                                                                                                                        |
| 2026-06-12 | 迁移 `DataInput.tsx` + 删除 `EnhancedSSEParser.ts` 本体（阶段 3 之 3，ARCH-1 收尾）：DataInput 换同一薄助手 `structured-chat-stream`，错误直接传播到原外层 catch（等价原 onError throw）；原无 abort/卸载清理，未新增（零漂移）；ToolCallRenderer / pages/home/types.ts 类型导入改 `@/lib/streaming`（StreamToolCallInfo 别名）；终态精确 grep 零命中（`new TextDecoder(` 0；`split('\n')` 仅展示类非流式上下文；`split(/\r?\n/)` 仅设计稿第 1 节豁免的 runtime-workbench NDJSON 分类；lib 外 EventSourceParserStream/TextDecoderStream 0）                                                                                                                                                                                                 | bc98056        | 验证：lint / lint:file-size / test:streaming（43 pass）/ build + 全量门禁（test:agent-t1 / test:design-tokens / check:bundle-size / lint:typed / typecheck:agent-strict，结果见下一行）                                                                                                                                                                                |
| 2026-06-12 | ARCH-1 收尾验收：全量门禁实跑全绿——lint（0 errors）/ lint:file-size / lint:typed（0 errors）/ typecheck:agent-strict / test:streaming（43 pass）/ test:agent-t1（47 pass）/ test:design-tokens（11 pass）/ build / check:bundle-size（24.85MB/26.13MB）/ lint:i18n-agent；终态精确 grep：`new TextDecoder(` 全仓 0 命中；`split('\n')` 命中仅展示/构建脚本类非流式上下文（MarkdownCodeBlock 行号、trace-json-viewer、share-output-block、build-themes、prompt-editor、ApiKeysPage 等）；`split(/\r?\n/)` 仅 runtime-workbench/utils.ts:95（NDJSON 分类，本设计稿第 1 节第 3 条豁免）；`EventSourceParserStream\|TextDecoderStream` 在 src/lib/streaming/ 之外 0 命中；状态置已完成                                                          | —              | 棘轮累计收紧：ExplorePage 2369 → 2343、MCPChatPage 1583 → 1581；阶段 2/3 提交序列：6914acc → （runtime-stream，见 git log）→ c36d946 → a3f778d → 66b55d8 → 46b659c → 97c1edf → a60563d → b347b39 → 22b8495 → 4ed009c → 7aab123 → bc98056                                                                                                                               |
| 2026-06-12 | 修复 CI 棘轮红（push 后 #11 失败）：bc98056 对 DataInput.tsx 的 prettier 全文件重排版使其 1061 → 1314（+253）越过基线——本地验收时 `lint:file-size \| tail -1` 截断输出且管道退出码掩盖失败，误报为通过（与 SEC-3 2026-06-11 红灯同型坑，教训再次确认：必须看完整输出/退出码）。修复照 38ef444 先例拆分债务文件：「用户输入」区块拆出 `data-input-user-input-section.tsx`（177 行）+ `data-input-data-source-panel.tsx`（466 行），全部状态仍留 DataInput 持有（设置弹窗关闭卸载子树不丢已上传文件/数据源），JSX 逐行原样搬移；DataInput 1314 → 751，基线收紧 1061 → 751                                                                                                                                                                     | cb5d5f8        | 验证：lint（0 errors）/ lint:file-size（完整输出确认 ✅）/ test:streaming（43 pass）/ build 全绿后推送，CI 复跑已通过（owner 确认）                                                                                                                                                                                                                                    |

### ARCH-2 API 契约零保证 → 代码生成或边界校验

- **状态**：未开始
- **问题**：`types/api.ts`（1604 行）+ `types/index.ts`（2075 行）全部手写；API 边界零 zod 校验；`: any` 246 处。后端改字段前端编译照样绿，错误在运行时爆。
- **主流对照**：OpenAPI → `openapi-typescript` / orval 生成类型与 TanStack Query hooks；或无 spec 时在边界 `z.parse()`。
- **方案**：先确认后端是否有 OpenAPI/Swagger spec。有 → 引入 openapi-typescript，生成物替换手写类型（渐进式：先新接口用生成物，旧的逐域迁移）；无 → 推动后端补 spec，短期对高风险接口（auth、agent run、知识库）加 zod 边界校验。
- **验收**：新增接口不再手写类型；CI 里有 spec 同步检查（生成物 diff 为空）。
- **状态与进展记录**：

| 日期       | 动作                       | 提交 | 备注 |
| ---------- | -------------------------- | ---- | ---- |
| 2026-06-10 | 立项，待确认后端 spec 现状 | —    | —    |

### ARCH-3 两套 query key 工厂并存

- **状态**：已完成（2026-06-12）——中央 `queryKeys` 已删除，全仓 query key 100% 走领域工厂；终态 grep 三项零命中（见末「终态验收」）
- **问题**：`src/lib/query-client.ts:34` 有中央 `queryKeys`（user/conversations/knowledgeBases…），同时 hooks 里有 10 个领域工厂（`datasourceKeys`、`memoryKeys`、`llmKeys`、`documentKeys`、`chatKeys`、`generateKeys`、`teamKeys`、`agentQueryKeys`、`mcpQueryKeys` 等）。两套 key 空间不互通，invalidate 命中与否靠运气。CLAUDE.md 已把领域工厂定为规范（2026-06-10 起）。
- **方案**：盘点中央 `queryKeys` 的全部引用 → 逐域迁到对应领域工厂（无对应领域的先建）→ 删除中央对象。注意 key 形状变化会导致一次性缓存失效，属可接受。
- **验收**：`lib/query-client.ts` 只剩 QueryClient 配置；全仓 queryKey 引用 100% 走领域工厂。
- **实扫盘点（2026-06-12，基准 ec24e4b；迁移以本清单划线）**：
  - **中央 `queryKeys` / `invalidateQueries` 消费方仅 5 个文件**：
    1. `src/hooks/use-auth.ts`（`user.info()` setQueryData×3 + useQuery×1；另有内联 `['auth','channels']`）——**死文件**：全部导出全仓零导入。
    2. `src/hooks/use-conversations.ts`（`conversations.*` 全套 + `invalidateQueries.conversations()`；内联 `['conversation','stats',timeRange]`）——**死文件**：全部导出全仓零导入；同名 `useCreate/Update/DeleteConversation` 实际来自 `use-chat-request.ts`。
    3. `src/hooks/use-chat-settings.ts`（`dialogApps.detail` query:189 + invalidate:207、`invalidateQueries.dialogApps()`:209；内联 `['knowledgeBases']`:233）。
    4. `src/hooks/use-dialog-apps.ts`（`dialogApps.list/detail`：useQuery×2、setQueryData×2、removeQueries×1；`invalidateQueries.dialogApps()`×5）。
    5. `src/hooks/use-metadata.ts`（`metadata.summary/all`、`knowledgeBases.detail` 失效:184、`invalidateQueries.documents()`×3）。
  - **内联字面量 key 13 处**（立项时点数 18 已漂移）：`use-profile.ts:97,203 ['userProfile']`（同文件成对）；`use-system-status.ts:17,37 [QUERY_KEYS.SYSTEM_STATUS/VERSION]`；`use-memory.ts:243 ['message-content',…]`；`use-chat-settings.ts:233 ['knowledgeBases']`；`pipeline-workbench/hooks/use-pipeline-workbench.ts:71 ['pipeline-trace',…]`；`agent/components/TemplatesPage.tsx:77 ['agentTemplates']`；`agent/hooks/use-agent-delivery-token.ts:4 ['agent','delivery-token']`（模块 const）；`knowledge/KnowledgeChunksLayout.tsx:33 ['documentDetail',…]`；`knowledge/document-chunks/hooks/use-chunk-list-state.ts:38 ['documentChunks',…]`；`knowledge/logs/hooks/use-log-list-state.ts:27 [('fileLogs'|'datasetLogs'),…]`；`knowledge/logs/hooks/use-log-stats.ts:17 ['logStats',…]`；`explore/ExplorePage.tsx:351 ['dialogConversations',…]`；`settings/admin/hooks/use-admin-users.ts:5 ['admin','users']`（模块 const）。除 use-profile / use-admin-users 同文件成对外，其余均无失效方/写入方配对（形状变化仅一次性缓存失效）。豁免：`search-workbench/hooks/use-fetch-rerank-llms.ts:7` 的 `rerankLLMsQueryKey` 已是命名导出单 key 工厂形态，保持原样。
  - **缺工厂域**：dialogApps、metadata、profile、system、admin、knowledge-logs（6 个新建）；agent/memory/document/knowledge/chat 工厂需扩展方法。
  - **关键等价性事实**：`invalidateQueries.documents()` → `['documents']` 与领域工厂 `documentKeys.all` 逐元素相等（意外根碰撞使 metadata 变更今天确实刷新文档列表），迁移形状零变化。
  - **既有缺陷（owner 已点名顺手修，单独 fix 提交）**：`use-metadata.ts:184` 失效 `['knowledgeBases','detail',kbId]` 今天命中空集——活的 KB 详情查询走 `knowledgeKeys`（根 `'knowledge'`），全仓无查询以 `['knowledgeBases','detail']` 开头；表现为保存 KB 元数据模板后详情不刷新。修法：改 `knowledgeKeys.detail(kb_id)`。
  - **owner 决策（2026-06-12）**：死文件 `use-auth.ts` / `use-conversations.ts` 整文件删除（不为死代码建工厂）；上述死失效顺手修。
  - **迁移方针**：保形状优先（新工厂方法产出与旧字面量逐元素相等 → 零失效漂移、零缓存丢失）；无配对的 key 归一到工厂根时在提交信息声明一次性缓存失效；查询配置（staleTime/enabled/select）一行不动。
- **状态与进展记录**：

| 日期       | 动作                                                                                                                                                                                                                                                                                                                                                                                                               | 提交    | 备注                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- | ---------------------------------------------------------------------------- |
| 2026-06-10 | 立项                                                                                                                                                                                                                                                                                                                                                                                                               | —       | —                                                                            |
| 2026-06-12 | 开工实扫盘点（消费方 5 文件、内联 key 13 处、缺口 6 工厂）写入本条目；状态改进行中                                                                                                                                                                                                                                                                                                                                 | 270d114 | 含两项 owner 决策：死文件整删、knowledgeBases.detail 死失效顺手修            |
| 2026-06-12 | 删除死文件 `use-auth.ts`（196 行）+ `use-conversations.ts`（299 行）——中央 user/conversations 两域的唯一消费方，连带消灭内联 `['auth','channels']`、`['conversation','stats',timeRange]`                                                                                                                                                                                                                           | 5730594 | 删除前复扫全部导出零导入；行为零漂移（无人引用）                             |
| 2026-06-12 | system 域：新建 `systemKeys`（use-system-status.ts），`['systemStatus']`/`['systemVersion']` 形状逐元素不变；整删 `constants/index.ts` 的 `QUERY_KEYS`（14 键中仅 SYSTEM\_\* 两键被消费，其余 12 个死键）                                                                                                                                                                                                          | 759ff3b | 形状无变化、该域无失效方/写入方配对；查询配置零改动                          |
| 2026-06-12 | profile 域：新建 `profileKeys`（use-profile.ts），`['userProfile']` 形状不变；同文件 query+invalidate 成对同步迁移                                                                                                                                                                                                                                                                                                 | 3d7f016 | 形状无变化；写入/失效配对均在同文件、同提交迁移                              |
| 2026-06-12 | admin 域：新建 `adminKeys`（settings/admin/hooks/use-admin-users.ts），`['admin','users']` 形状不变；同文件 1 query + 5 invalidate 成对迁移                                                                                                                                                                                                                                                                        | 773f323 | 形状无变化；配对均在同文件、同提交迁移                                       |
| 2026-06-12 | memory 域：`memoryKeys` 新增 `messageContent(memoryId,messageId)`，`['message-content',…]` 形状不变（刻意不挂 messages 前缀：行 275/314 的消息状态/删除失效不应连带重取消息原文）                                                                                                                                                                                                                                  | b32803b | 形状无变化；该 key 无失效方/写入方配对                                       |
| 2026-06-12 | agent 域：`agentQueryKeys` 新增 `deliveryToken()`（=原 `['agent','delivery-token']`）、`pipelineTrace()`（保独立根 `['pipeline-trace',…]`）、`templatesRaw()`（保 `['agentTemplates']`，缓存为未适配 IFlow[]，禁止与 `templates()` 合 key）、`sessionsByCanvas()`（收编 use-agent-mutation 两处 `[...all,'sessions',canvasId]` 展开，`sessions()` 改由其派生）；4 个消费文件迁移                                   | e184655 | 全部形状逐元素不变；sessions 失效→sessionsByCanvas 前缀关系保持              |
| 2026-06-12 | knowledge-logs 域：新建 `knowledgeLogKeys`（pages/knowledge/logs/constants.ts），`list(tab,…)`（LogTabType 枚举值即原 'fileLogs'/'datasetLogs' 前缀）与 `stats(kbId)` 形状均不变；use-log-list-state / use-log-stats 迁移                                                                                                                                                                                          | 84e4877 | 形状无变化；两 key 均无失效方/写入方配对（refetch 手动）                     |
| 2026-06-12 | documents 页面 key：`documentKeys` 新增 `standaloneDetail(docId)`（=原 `['documentDetail',…]`）与 `chunkList(...)`（=原 `['documentChunks',…]`），均保独立根——刻意不并入 `['documents']` 前缀，避免 metadata 域对该前缀的失效新增命中；KnowledgeChunksLayout / use-chunk-list-state 迁移                                                                                                                           | dde8e36 | 形状无变化；两 key 均无失效方/写入方配对                                     |
| 2026-06-12 | explore 域：`chatKeys` 新增 `dialogConversations(dialogId)`（=原 ExplorePage 内联 `['dialogConversations',…]`，形状不变）；与 `conversationsByDialog` 同 API 但查询配置不同，刻意不共 key（共 key 属未来可选归并，记备注）                                                                                                                                                                                         | d795af1 | 形状无变化；无失效方配对（refetchConversations 手动）                        |
| 2026-06-12 | knowledge 域：`knowledgeKeys` 新增 `graph(id)`（收编 use-knowledge-request:186 的 `[...detail(id),'graph']` 展开，形状不变）与 `simpleList()`（=原 use-chat-settings 内联 `['knowledgeBases']`，缓存为 kbs 数组与 `list()` 分页形态不同，刻意不共 key）                                                                                                                                                            | b74f801 | 形状均无变化；`['knowledgeBases']` 无失效方（中央同名 helper 无人调用）      |
| 2026-06-12 | dialogApps 域：新建 `dialogKeys`（use-dialog-apps.ts，all/lists/list/details/detail 逐元素复刻中央 `queryKeys.dialogApps`）；use-dialog-apps（query×2、setQueryData×2、removeQueries×1、整域失效×5）与 use-chat-settings（detail query+invalidate、整域失效×1）同提交迁移，`invalidateQueries.dialogApps()` → `dialogKeys.all`；useImportDialogApps 补 `useQueryClient()`（原走全局实例 helper，同一 QueryClient） | 385b5b0 | 形状全部无变化；写入/失效两文件共享同根故必须同提交（防写入/失效分裂中间态） |
| 2026-06-12 | metadata 域：新建 `metadataKeys`（use-metadata.ts，all/summary 逐元素复刻中央，含 `docIds?.join(',') ?? 'all'` 尾段）；跨域 `invalidateQueries.documents()`×3 → `documentKeys.all`（`['documents']` 逐元素相等，metadata 变更继续命中文档列表）；useUpdateDocumentMetadataSettings 补 `useQueryClient()`；行 193 的 `queryKeys.knowledgeBases.detail` 死失效留待下一 fix 提交                                      | ab620db | 形状全部无变化；跨域 documents 失效经实证根相等                              |
| 2026-06-12 | fix：useUpdateKBMetadataSettings 的死失效 `['knowledgeBases','detail',kbId]` → `knowledgeKeys.detail(kb_id)`（owner 2026-06-12 点名顺手修）。行为变化声明：原失效命中空集，现保存 KB 元数据模板后 KB 详情（`['knowledge','detail',kbId]`）真正失效重取                                                                                                                                                             | 5ec6233 | 中央 queryKeys 的最后一个消费引用随本提交消失                                |
| 2026-06-12 | 删除中央 `queryKeys` + `invalidateQueries` 帮助对象（lib/query-client.ts 164→31 行，只剩 QueryClient 配置）；删除前 grep 确认仅 App.tsx 导入 `queryClient` 本体                                                                                                                                                                                                                                                    | 07e2ca5 | ARCH-3 验收第 1 条达成                                                       |
| 2026-06-12 | 终态验收 + 状态置已完成：全量门禁实跑全绿；验收 grep 三项零命中（详见下「终态验收」）                                                                                                                                                                                                                                                                                                                              | 待回填  | 攻坚顺序表 ARCH-3 拆出独立行标记完成                                         |

- **新建工厂清单（6 个）**：`dialogKeys`（use-dialog-apps.ts）、`metadataKeys`（use-metadata.ts）、`profileKeys`（use-profile.ts）、`systemKeys`（use-system-status.ts）、`adminKeys`（settings/admin/hooks/use-admin-users.ts）、`knowledgeLogKeys`（pages/knowledge/logs/constants.ts）。**扩展现有工厂**：`agentQueryKeys` +`deliveryToken/pipelineTrace/templatesRaw/sessionsByCanvas`、`memoryKeys` +`messageContent`、`documentKeys` +`standaloneDetail/chunkList`、`knowledgeKeys` +`graph/simpleList`、`chatKeys` +`dialogConversations`。**删除**：`use-auth.ts`、`use-conversations.ts`（死文件）、`constants/index.ts` 的 `QUERY_KEYS`、`lib/query-client.ts` 的中央 `queryKeys`+`invalidateQueries`。
- **终态验收（2026-06-12 实测）**：
  - `lib/query-client.ts` 31 行，只剩 QueryClient 配置（无 queryKeys/invalidateQueries 导出）。
  - `grep -rn "queryKeys" src`：仅 2 处命中，均为 dialogKeys/metadataKeys 工厂上方注释里提及「复刻原中央 queryKeys」字样（无代码引用）；领域工厂自身命名 `agentQueryKeys`/`mcpQueryKeys` 正常存在。
  - `grep -rn "queryKey: \[" src`：0 命中（所有内联数组字面量已消灭）。
  - `grep -rnE "(invalidateQueries|removeQueries|cancelQueries|setQueryData|getQueryData|prefetchQuery)\(\s*\{?\s*queryKey:\s*\["` + `setQueryData(\[`：0 命中。
  - 残留 `mutationKey: ['saveProfile'|'changePassword']`（use-profile.ts）非本任务范围（mutation key 不参与失效匹配），保留。
  - 门禁全绿：lint（0 errors / 1537 warnings）、lint:file-size（36 在册文件未膨胀，ExplorePage 基线 2343→2341 收紧）、lint:typed（0 errors）、typecheck:agent-strict（pass）、test:agent-t1（47 pass）、test:streaming（43 pass）、test:design-tokens（11 pass）、build（pass）、check:bundle-size（raw 24.86/26.13MB、入口 gzip 114/120KB、最大 chunk gzip 703/739KB 全通过）。
- **遗留/未来可选归并（均已在对应提交声明，本任务刻意不做以保零漂移）**：`documentKeys.standaloneDetail/chunkList` 与 `chatKeys.dialogConversations`、`knowledgeKeys.simpleList`、`agentQueryKeys.pipelineTrace/templatesRaw` 保留各自独立根，未并入领域主根——并入会改变 invalidate 命中集或混淆缓存形态，需单独评估。

### ARCH-4 Zustand store 中的服务器状态清退

- **状态**：进行中
- **问题**：13 个 store 共 3498 行。`model.ts`（751 行）、`knowledge.ts`（443 行）等明显持有服务器数据副本，与 React Query 领域重叠（违反自家规范）；`chat`/`conversation` + dialog 页职责交叉。
- **方案**：逐 store 三分类审计——服务器数据（列表/详情 + loading + error）→ 迁 React Query；流式临时态 → 保留；UI/选择/偏好 → 保留。执行顺序按风险升序（先删死 store，最后动最大面 `model.ts`），每 store 一个原子提交、全绿再下一个、不 push 等 owner 指示。复用 ARCH-3 已落地的领域 `*Keys` 工厂 + `use-*-request` hook，多数为「删 store 副本、改用已有 hook」。
- **验收**：store 总行数显著下降；任一 store 不再有"列表数据 + loading + error"三件套字段；全仓服务器读取 100% 走 React Query 领域 hook；store 内无手写 fetch-effect / `await loadX()` 手动重取。
- **不扩 scope**：不动 ARCH-2 API 契约、ARCH-5 token；`auth.ts` token/refresh-token 的 localStorage 安全改造归 SEC-1（本任务审计后显式 defer，不宣称把所有 persist store 变 UI-only）。
- **库存清单（实扫 2026-06-18，复核 2026-06-22 行数零漂移）**：

| store                            | 行数   | 三分类结论                                                                                                                                                                                                       | 动作                                                                                                                                                             |
| -------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| model.ts                         | 751    | 服务器：myLLMs/factories/isLoading + mutation；UI：selectedProvider（0 消费）；助手/常量/类型（1-364，外部大量 import）                                                                                          | 迁移：补 `enableLlm` api+hook、增强 `setApiKey/addLLM`（source_fid+verify）、迁 14 消费方 → 删 store 半，留助手/类型模块（在册→收紧棘轮）                        |
| knowledge.ts                     | 443    | 服务器：knowledgeBases/documents/total/isLoading/currentKnowledgeBase + 全 CRUD；UI：searchQuery                                                                                                                 | 迁移：9 消费方切已有 hook，currentKB→`useFetchKnowledgeDetail(id)`，searchQuery→局部 state → 整 store 删；mock 假数据兜底刻意丢弃                                |
| memory.ts                        | 355    | 服务器：memories/total/currentMemory/messages/...（RQ→store 桥接死写，消费方早已读 query data）；UI：filter/page/view/模态                                                                                       | 迁移：拆桥（query 只 return data）→ 删服务器字段，零页面改动                                                                                                     |
| environmentStore.ts              | 276    | 服务器：environments/currentEnvironment/globalEnvironments/isLoading + 13 mutation（多处 await loadX 手动重取）；UI：selectedEnvironmentId（persist 正确）；纯工具 resolveText/getVariableMap/validateReferences | 迁移：新建 `use-environment-request.ts`（environmentKeys + query/mutation）→ 迁 6 消费方（ApiKeysPage 4037 在册谨慎）→ store 仅留 selectedEnvironmentId + 纯工具 |
| conversation.ts                  | 227    | 死 store：仅 `stores/index.ts` barrel + resetAllStores 引用，0 运行时消费                                                                                                                                        | 删除（verify-then-remove）                                                                                                                                       |
| chat.ts                          | 348    | 死 store：服务器副本 + 旧 SSE 全为死代码，唯一消费 ExplorePage 仅 `clearChat()`（其真实流式是局部态）                                                                                                            | 删除（删 ExplorePage 3 行；在册→收紧棘轮）                                                                                                                       |
| auth.ts                          | 265    | 会话身份快照 + 认证态，与 SEC-1（token localStorage）+ 启动时序强耦合，非三件套                                                                                                                                  | 审计后不迁，状态 "audited, deferred to SEC-1/AUTH bootstrap"                                                                                                     |
| ui/studio/home/team/search/index | 19–203 | 纯客户端态（已无服务器副本，服务器数据已走各自 use-\*-request）                                                                                                                                                  | 审计后不迁                                                                                                                                                       |

- **复核要点（2026-06-22）**：① `client.ts:146-148` 自动补 `/v1` 前缀，model.ts `/llm/*` 与 llm.ts `/v1/llm/*` 同 URL，无版本契约问题；② model.ts 的 addProvider/removeProvider/updateProviderConfig 0 消费 → 随 store 删，不建 hook；现有 `useSetApiKey/llmAPI.setApiKey` 未复制 SILICONFLOW `source_fid` 分支与 `verify→ModelVerifyResult` 返回，迁移须补；③ memory 两个消费页早已读 `data?.memory_list/total_count`，store 桥接为死写，迁移近零页面改动。
- **状态与进展记录**：

| 日期       | 动作                                                                                         | 提交    | 备注                                                                                                                                                    |
| ---------- | -------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | 立项                                                                                         | —       | —                                                                                                                                                       |
| 2026-06-22 | 盘点：13 store 三分类 + 死代码判定 + 风险升序执行顺序，状态置进行中                          | 7eeffb7 | model/knowledge/memory/environment 迁移，conversation/chat 删除，auth 归 SEC-1，5 个纯客户端 store 不动                                                 |
| 2026-06-22 | 前置修复：44c3b14 引入的 file-size 棘轮回归（拆 use-create-app-save、删 DialogTemplateFile） | 96c1637 | 见 ENG-1 进展表；ARCH-4 在绿门禁基线上推进                                                                                                              |
| 2026-06-22 | Step 1：删死 store conversation.ts（227 行）                                                 | 待回填  | 0 运行时消费（仅 stores/index.ts barrel + resetAllStores）；删 barrel/type/重置引用；api/conversation.ts（conversationAPI）不动。lint 0 err、build 通过 |

### ARCH-5 设计令牌治理 + Tailwind 4 评估

- **状态**：未开始
- **问题**：1472 个 token、`theme-generator.ts` 2206 行；`components-*` 粒度 token 随组件数线性增长，对比主流（shadcn/Radix Themes 30–60 个语义变量）成本过高。Tailwind 停在 3.4，落后主流一个大版本；Tailwind 4 的 CSS-first `@theme` 与 build:themes 管线天然同构，迁移可能反而删管线。
- **方案**：(a) 先做 token 用量统计（哪些 token 全仓 0 引用 → 删）；(b) 新组件默认复用语义层 token，`components-*` 新增需 review 说明理由；(c) 单独立项评估 Tailwind 4 迁移（eslint-plugin-tailwindcss 兼容性、@theme 映射 PoC）。
- **验收**：0 引用 token 清零；token 新增有治理流程；Tailwind 4 评估有结论文档。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

---

## ENG — 工程执行

### ENG-1 文件体积棘轮（ratchet）门禁

- **状态**：已完成（2026-06-10）
- **问题**：CLAUDE.md 规定 >600 行禁止、债务文件"只许减不许增"，但**零 enforcement**，实测全在涨：ApiKeysPage 3293→4068（+775）、ExplorePage 2279→2369、api-key-modal 1757→1917、MCPChatPage 1409→1583。结论：没有门禁的规范等于装饰。
- **方案**：棘轮机制——`scripts/check-file-size-ratchet.mjs` + 基线 `scripts/file-size-baseline.json`（36 个超标文件的当前行数快照）。规则：超 600 行的文件必须在基线内且不得超过记录值；新文件不得超 600；缩减后跑 `npm run lint:file-size:update` 收紧基线（只降不升）。CI `checks` job 执行 `npm run lint:file-size`。排除：`src/locales/**`、`*.generated.ts`、`__tests__/`、`*.test.*`、`__dev__/`。
- **验收**：CI 上任何债务文件 +1 行即红；基线只能单调收紧。
- **状态与进展记录**：

| 日期       | 动作                                                                                                     | 提交                           | 备注                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | 脚本+基线+CI 接入完成，本地验证通过                                                                      | （见 git log `feat(tooling)`） | 基线 36 个文件；后续每偿还一个债务文件要同步收紧基线并更新本表                                                                                                                              |
| 2026-06-22 | 修复 44c3b14（dialog 迁移）引入的棘轮回归：新文件 use-create-app-page.ts 682>600、types/api.ts 1604→1606 | 96c1637                        | ARCH-4 开工前发现 master 门禁已红。拆 `handleSave`→`use-create-app-save.ts`（682→557）；删未使用的 `DialogTemplateFile`（types/api.ts 1606→1599，基线收紧 1604→1599）。零行为变更，门禁回绿 |

### ENG-2 测试覆盖结构性失衡 + 零 E2E

- **状态**：未开始
- **问题**：40/1308 文件有测试（约 3%），全部集中 agent 序列化层；流式 reducer、stores、APIClient 零测试；零 E2E（登录、聊天流式、知识库主链路无任何冒烟）。
- **方案**：(a) ARCH-1 落地时强制 streaming reducer 带单测；(b) 引入 Playwright，先写 1 条冒烟（登录 → 发消息 → 收到流式回复），进 CI（可用 mock 后端或 staging）；(c) 聚合 `npm test` 脚本统一入口。
- **验收**：CI 有 E2E job；流式 reducer 覆盖率可见。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### ENG-3 "空头支票"规则落地（虚拟化 / a11y / mutation 错误 / i18n 分包）

- **状态**：未开始
- **问题**：四条文档规则与现实相反：
  1. 文档强制 >200 行列表虚拟化，但**仓库未安装任何虚拟化库**（无 @tanstack/react-virtual / react-window）。
  2. 文档称 a11y "强制"，eslint 里 jsx-a11y 全量降为 warn（`eslint.config.js` 的 `jsxA11yWarningRules`）。
  3. 文档要求 mutation 错误走 sonner toast，实际全局 `mutations.onError` 只有 `console.error`（`lib/query-client.ts:23`）。
  4. 文档要求 locale 按语言分包，实际 zh+en 全部随主包打（仅 knowledge 命名空间 2700+ 行），且 locale 是 .ts 不是 JSON（翻译平台无法处理）；`ensureLocaleLoaded()` 预留未实现。
- **方案**：1) 装 @tanstack/react-virtual，对最大的两个列表页先落地；2) 挑致命子集（alt-text、aria-props、role 系列）升 error；3) 全局 onError 接 sonner（带去重）；4) locale 迁 JSON + i18next 动态加载，实现 ensureLocaleLoaded。四项可拆四个独立 PR。
- **验收**：每条对应文档规则与代码一致；不一致的规则要么落地要么从文档删除。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### ENG-4 Bundle 体积预算门禁

- **状态**：已完成（2026-06-10）
- **问题**：JS 产物 24.9MB（未压缩、含全部懒加载 chunk）、最大 chunk vendor-graph-antv 1.4MB（gzip 387KB）、入口 index ~396KB raw，无任何体积门禁；widget embed 的"必须懒加载重型依赖"只靠人工看。
- **方案**：零依赖脚本 `scripts/check-bundle-size.mjs` + 预算 `scripts/bundle-size-budget.json`（总量 / 入口 gzip / 最大 chunk gzip 三道闸，预算=当前值+5% 余量，只许下调）。CI `build` job 在 build 后执行 `npm run check:bundle-size`。
- **验收**：CI 上体积超预算即红；预算单调收紧。
- **状态与进展记录**：

| 日期       | 动作                                | 提交                           | 备注                                                |
| ---------- | ----------------------------------- | ------------------------------ | --------------------------------------------------- |
| 2026-06-10 | 脚本+预算+CI 接入完成，本地验证通过 | （见 git log `feat(tooling)`） | 预算基于当日实测+5%；优化产物后应下调预算并更新本表 |

### ENG-5 mutation 全局错误兜底静默（并入 ENG-3 第 3 条执行）

- **状态**：未开始（执行归 ENG-3）
- 单列存档：`lib/query-client.ts` 全局 `onError: console.error` 与文档"sonner toast"冲突，用户侧表现为操作失败无感知。

---

## HYG — 仓库卫生

### HYG-1 LICENSE / CHANGELOG / 版本 tag

- **状态**：已完成（2026-06-10）
- **问题**：公开 GitHub 仓库（yuehong136/web）无 LICENSE（法律上=保留所有权利）、无 CHANGELOG、零 git tag（版本 0.9.8 只活在 package.json）。
- **决策**：owner 选定 **Apache-2.0**（2026-06-10，与 RAGFlow 生态一致）。发布流程采用轻量方案：Keep a Changelog 格式的 `CHANGELOG.md` + 手动 tag（`vX.Y.Z`）；changesets/release-please 对非发布型应用属过度工程，已否决（可在开源协作者变多后重评）。
- **发布流程（自本日起）**：改 `package.json` version → `CHANGELOG.md` 把 Unreleased 段落归档为版本段 → `git tag -a vX.Y.Z` → push with tags。
- **状态与进展记录**：

| 日期       | 动作                                          | 提交                            | 备注                                         |
| ---------- | --------------------------------------------- | ------------------------------- | -------------------------------------------- |
| 2026-06-10 | LICENSE(Apache-2.0)+CHANGELOG+v0.9.8 tag 完成 | （见 git log `chore(release)`） | tag 打在当日 HEAD，作为既有 0.9.8 的基线 tag |

### HYG-2 仓库杂物与依赖治理

- **状态**：未开始（(d) 部分豁免已于 2026-06-10 处理）
- **问题**：(a) `.claude/settings.local.json` 被提交（"local" 语义即不该入库）；(b) 根目录工作区残留 `agent-ops-center-demo.html`、`project-contribution-report.html`（未跟踪）；(c) 无 Dependabot/Renovate，`patch-package` 的 4 个补丁在依赖升级时是隐性回归源；(d) **重大：整个 `docs/` 目录被 .gitignore 忽略，0 个文档被 git 跟踪**——CLAUDE.md「拿不准时去看」指引的全部 agent-t\* 总结、设计令牌文档、rewrite plan 只存在于单机工作区，fresh clone 和 CI 中的 agent 全部看不到，且无任何备份。
- **方案**：(a) `git rm --cached` + 加 .gitignore；(b) 删除或挪 docs；(c) 加 `.github/dependabot.yml`（npm 周更、分组小版本），patch 对应的依赖锁死并注释原因；(d) owner 决策哪些 docs 应入库——若无敏感内容建议整目录解除忽略并提交（这是团队知识库）；已先行豁免本路线图文件（`.gitignore` 改为 `docs/*` + `!docs/engineering-modernization-roadmap.md`），因为它必须对无上下文的后续 agent 可见。
- **状态与进展记录**：

| 日期       | 动作                                        | 提交           | 备注                            |
| ---------- | ------------------------------------------- | -------------- | ------------------------------- |
| 2026-06-10 | 立项                                        | —              | —                               |
| 2026-06-10 | 发现 docs/ 整体未被跟踪；豁免并提交本路线图 | （见 git log） | 其余 docs 入库与否待 owner 决策 |

---

## 攻坚顺序（建议）

| #   | 条目                                    | 状态                 |
| --- | --------------------------------------- | -------------------- |
| 1   | SEC-1 token 出 localStorage + SEC-2 CSP | 未开始（需后端）     |
| 2   | ENG-1 ratchet + ENG-4 bundle 预算       | ✅ 已完成 2026-06-10 |
| 3   | ARCH-1 统一 streaming runtime           | ✅ 已完成 2026-06-12 |
| 4   | ARCH-2 API 契约代码生成                 | 未开始               |
| 5   | ARCH-3 删中央 queryKeys                 | ✅ 已完成 2026-06-12 |
| 5b  | ARCH-4 store 清退                       | 未开始               |
| 6   | ENG-2 流式单测 + Playwright 冒烟        | 未开始               |
| 7   | ENG-3 空头支票四件套                    | 未开始               |
| 8   | HYG-1 LICENSE/tag/CHANGELOG             | ✅ 已完成 2026-06-10 |
| 9   | ARCH-5 Tailwind 4 / token 治理 + HYG-2  | 未开始               |
