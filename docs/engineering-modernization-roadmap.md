# 工程现代化路线图（Engineering Modernization Roadmap）

> 本文档是一次全仓批判性审计的产物与后续整改的**唯一进度账本**。
> 审计日期：2026-06-10，基准提交：`030a3b2`，审计者：Claude（Fable 5）+ 仓库 owner 确认。
> 最新复核：2026-08-13，基准提交：`01b5b0e`；新增当前排序、工作量估算与运行态证据，原始基线保留用于比较。
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

## 2026-08-13 复核快照与当前执行队列

> 本节是当前待办的排序入口；各工作包的完整问题、方案与验收仍记录在对应稳定 ID 条目中。只登记未完成、部分完成或需要重开的工作，不把已经落地的共享 StreamingXMarkdown、Query key factory、认证边界 cache isolation、SafeHtml、路由懒加载、文件/Bundle 棘轮重复算作遗留问题。

### 优先级与工作量口径

- **P0**：已确认的凭证泄漏或注入路径，立即止血；不用于泛指“重要”。
- **P1**：影响业务正确性、用户信任、核心 AI 运行可靠性或生产诊断能力，进入最近两个迭代。
- **P2**：影响规模化质量、性能、可维护性或体验一致性，按季度持续偿还。
- **P3**：战略性产品/工具链升级，收益依赖前置条件，不得挤占可靠性治理资源。
- **工作量**：前端主导人日，`1 人日 ≈ 6 小时有效工程时间`，包含实现、单元/契约测试、评审修正和必要文档；不包含产品决策等待、后端实现和 CSP 灰度观察期。`XS ≤ 1`、`S = 1–2`、`M = 3–5`、`L = 6–10`、`XL = 11–25`、`XXL = 25–45` 人日。
- **估算使用方式**：范围是排期基线，不是承诺工期。跨端条目分别列出前端和外部投入；开工时必须重新核实接口、数据量和现有测试，拆成可独立合并的 PR。

### 复核基线

| 指标                |                                                                  2026-08-13 实测 | 结论                                                                          |
| ------------------- | -------------------------------------------------------------------------------: | ----------------------------------------------------------------------------- |
| `src` 下 `.ts/.tsx` |                                                                          1420 个 | ENG-7 新增路由恢复、mutation 错误策略与 focused 测试                          |
| 测试文件            |                                                75 个（`src` 74 + ESLint 规则 1） | 正式六个脚本直接纳入 32 个；文件数不等于语句覆盖率                            |
| lint                |                                           0 errors / 1460 warnings（355 个文件） | `no-explicit-any` 与可访问性警告仍为主要存量                                  |
| 文件体积债务        |                                                                    32 个在册文件 | 棘轮通过；EnvironmentDetail 从 989 收紧至 985 行，巨型文件仍需继续拆分        |
| Bundle 三预算       |           总 JS 25.68/26.13 MB；入口 gzip 114/120 KB；最大 chunk gzip 723/739 KB | 预算使用率均超过 95%，且只覆盖 `dist/js`                                      |
| 测试实跑            | API 99、Agent 72、Product UI 3+23、Streaming 43+2、Design Token 11、Security 2+1 | 本轮通过；没有真实 Playwright E2E                                             |
| 生产依赖            |                                                    79 个直接依赖落后；audit 5 项 | 1 critical/1 high/3 moderate 均需先做可达性校准，不能按工具等级直接定业务等级 |

### 当前排序总表

|   # | ID     | 工作包                                                                                               | 优先级 |      前端工作量 | 类型 / 主要依赖                                   | 状态     |
| --: | ------ | ---------------------------------------------------------------------------------------------------- | :----: | --------------: | ------------------------------------------------- | -------- |
|   1 | ENG-8  | 忘记密码、发布、导出、API Key 测试等正式业务闭环                                                     |   P1   |    L，5–10 人日 | 跨前后端；需接口、权限和状态机契约                | 未开始   |
|   2 | ENG-9  | 修正 Studio 分页 KPI、Memory 硬编码统计等数据口径                                                    |   P1   |   M–L，3–6 人日 | 跨前后端；优先服务端聚合字段                      | 未开始   |
|   3 | ARCH-7 | 统一 SSE 终态、Abort/timeout、REST/SSE 401 与意外 EOF 语义                                           |   P1   |    L，6–10 人日 | 前端主导；最好先约定服务端完成帧                  | 未开始   |
|   4 | SEC-1  | 会话凭证迁移至 HttpOnly/Secure/SameSite refresh cookie 或 BFF                                        |   P1   |     L，5–8 人日 | 后端另约 5–10 人日；含 CSRF/跨标签页设计          | 未开始   |
|   5 | SEC-2  | CSP Report-Only、nonce/hash、违规监控与强制模式                                                      |   P1   |     M，3–5 人日 | 前端/部署；另需约 1 周观察期                      | 未开始   |
|   6 | ENG-10 | 错误、Web Vitals、LLM TTFT、流中断率、取消率和 Trace ID 可观测性                                     |   P1   |     L，5–8 人日 | 平台另约 2–4 人日；先定义隐私边界                 | 未开始   |
|   7 | ENG-2  | 统一 `test:unit`/CI，并增加三条 Playwright 黄金链路                                                  |   P1   | L–XL，9–14 人日 | 需稳定测试账号、数据和接口；依赖 ENG-6～9、ARCH-7 | 部分完成 |
|   8 | HYG-2  | 对 5 个生产依赖告警做可达性验证，分批升级并引入依赖自动化                                            |   P1   |   S–M，2–5 人日 | 若证实浏览器生产路径可利用，对应项升 P0           | 部分完成 |
|   9 | ARCH-2 | auth/Agent run/Knowledge 试点 OpenAPI codegen + Zod；收口绕过 API/Query 边界的旧页面                 |   P2   | L–XL，8–15 人日 | 后端另约 4–8 人日；需稳定 OpenAPI                 | 部分完成 |
|  10 | ENG-11 | Bundle 门禁扩展到真实路由 preload、全部 `dist` 和静态资产，并优化登录图/超大 SVG/Monaco/Ant Design X |   P2   |   M–L，4–7 人日 | 最好先有 ENG-10 RUM 基线                          | 未开始   |
|  11 | ENG-3  | a11y 棘轮、核心模板小屏降级、i18n/route locale 收口、虚拟化和 mutation UX                            |   P2   | XXL，28–45 人日 | 拆成 4–6 个独立 PR；需产品确认移动端范围          | 未开始   |
|  12 | HYG-3  | 修正文档版本表、环境变量登记和路线图状态漂移                                                         |   P2   |   S–M，2–4 人日 | AGENTS.md/CLAUDE.md 双语同提交                    | 未开始   |
|  13 | ARCH-8 | 共享 Chat Workbench：composer、附件、滚动、停止/重试、工具调用、反馈和可访问状态                     |   P2   |  XL，15–25 人日 | 依赖 ARCH-7、ENG-2；需稳定消息/工具协议           | 未开始   |
|  14 | ENG-12 | 按活跃度拆 ApiKeys、Provider modal、MCPChat、Explore，并收紧文件棘轮                                 |   P2   | XXL，25–40 人日 | 先修业务正确性，避免重构错误行为                  | 未开始   |
|  15 | ARCH-9 | 试点 Projects/Spaces + Assets 信息架构，整合聊天、文件、知识、指令与 Studio                          |   P3   | XXL，25–45 人日 | 跨产品/前后端；需数据模型、权限和迁移方案         | 未开始   |
|  16 | ARCH-5 | Tailwind 4 评估与设计令牌内部简化                                                                    |   P3   |    L，8–12 人日 | 可靠性、体验和 Bundle 工作稳定后再做              | 未开始   |

### 推荐执行波次

1. **信任与恢复（已完成）**：ENG-6/ENG-7 已完成，能力真实性、路由恢复和 mutation 安全反馈均有正式门禁。
2. **核心可靠性（未来 2～4 周）**：#1～#8，约 38–66 前端人日，建议 2～3 人并行；跨后端事项先冻结契约再实施。
3. **工程规模化（1～2 个季度）**：#9～#14，按模块持续偿还，不做全仓机械迁移。
4. **产品架构试点**：#15 先做单一 Project/Space，不直接重构全部导航。
5. **工具链尾项**：#16 不得排在安全、运行闭环、E2E 和观测之前。

---

## SEC — 安全级（最高优先）

### SEC-1 认证凭证存 localStorage（含 refresh token）

- **状态**：未开始
- **优先级 / 工作量**：P1 / L，5–8 前端人日；后端另约 5–10 人日
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
- **优先级 / 工作量**：P1 / M，3–5 前端人日；另需部署配合与约 1 周 Report-Only 观察期
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

### SEC-4 已停用的 channel 会被另一个人的保存操作静默重新启用

- **状态**：已完成（2026-08-05，残余亚秒竞态已接受）
- **问题**：`src/pages/settings/channels/components/channel-form-sheet.tsx:131` 把 `bindingEnabled: currentChannel?.binding?.enabled ?? false` 交给 `src/api/channel.ts:176`，而 `currentChannel` 来自 `useFetchChannelDetail`，未覆写 `staleTime`，继承 `src/lib/query-client.ts` 的 5 分钟。PATCH 请求体里没有任何并发令牌（`ChannelUpdateWriteRequest` 无 generation/version 字段），后端 `update_channel` 直接按请求覆写 `binding.enabled` 并 bump generation。场景：管理员 A 打开编辑面板，期间 B（或另一个标签页、或运维脚本）调 `/disable` 停掉渠道；A 只改了个渠道名点保存，payload 里 `enabled` 仍是缓存快照里的 `true` → 渠道被静默重新启用、worker 重新拉起，页面无任何提示。反向亦然。**「停用」作为 kill switch 因此不可靠**，这是把它列为 SEC 而非 ENG 的理由。
- **方案**：提交前 `queryClient.fetchQuery(channelKeys.detail(id))` 拿新鲜的 `binding.enabled`，不用缓存值。**刻意不选**另外两条：省略 `enabled` 会让老后端读到 `ChannelBindingUpsertRequest.enabled` 的 `False` 默认值 → 静默*停用*渠道（更坏的半态）；加后端并发令牌会为一个亚秒级竞态制造硬跨仓部署顺序约束。refetch 是纯前端、对任何后端版本都安全，把窗口从 5 分钟压到一次往返；残余竞态已知并接受。
- **验收**：`npm run test:api` 新增断言——update payload 的 `binding.enabled` 取自 refetch 结果而非 prop。
- **对应后端条目**：`MultiRAG:docs/channel-program/PROGRESS.md` 的 `CHN-U6`（纯前端，无跨仓顺序约束）。
- **状态与进展记录**：

| 日期       | 动作                                                                          | 提交     | 备注                                                                                                                                                                                                             |
| ---------- | ----------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-05 | 立项（channel 子系统跨三仓审计发现）                                          | 8cbaf3a  | —                                                                                                                                                                                                                |
| 2026-08-05 | 落地：提交前 `fetchQuery` 拿新鲜的 `binding.enabled`，不再回传 5 分钟旧缓存值 | 本次提交 | 刻意不选另外两条：省略字段会让老后端读 `enabled` 的 False 默认值从而静默*停用*渠道（更坏的半态），加后端并发令牌会为一个亚秒级竞态制造硬跨仓部署顺序约束。残余竞态已知并接受。验证：`npm run test:api` 61 passed |

### SEC-5 认证响应与 Token 写入浏览器日志

- **状态**：已完成（2026-08-13）
- **优先级 / 工作量**：P0 / XS，0.5–1 前端人日
- **问题与证据**：`src/stores/auth.ts` 的登录与注册流程在非 DEV 条件下输出完整响应、用户对象和 access token。生产构建未配置统一的 console 剔除；浏览器扩展、远程调试、录屏或日志采集都可能扩大泄漏面。
- **方案**：删除敏感日志；仅允许统一 logger 输出脱敏后的 trace/build 标识；增加静态检查或单测，拒绝 `token`、`password`、完整 auth response 进入 `console.*`。
- **验收**：登录、注册、刷新、登出流程中没有凭证或用户详情日志；生产 bundle 精确搜索敏感日志文案零命中；认证契约测试继续通过。
- **状态与进展记录**：

| 日期       | 动作                                                                                                                                              | 提交      | 备注                                                                                                                                                                 |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | 复核立项                                                                                                                                          | —         | 已确认活跃登录路径可达，列为第一顺位止血项                                                                                                                           |
| 2026-08-13 | 落地：删除 auth store 的登录/注册/登出事件敏感日志；认证 store/API 边界启用 `no-console`；增加 `security/no-sensitive-data-in-console` 和规则测试 | `3fe7d43` | 保留 `queryClient.clear()`、登出本地先隔离和后端 best-effort 撤销语义。验证：API 91/定向 auth 6、Security 2+1、lint 0 errors、build 通过；生产产物敏感日志签名零命中 |

### SEC-6 imperative `innerHTML` toast 注入链

- **状态**：已完成（2026-08-13）
- **优先级 / 工作量**：P0 / S，1–2 前端人日
- **问题与证据**：`src/lib/toast.ts` 把 message 原样插入 `toast.innerHTML`；MCP SSE 的远端错误文本可经 `MCPChatPage` 的 `Error.message` 到达该 sink。现有 `security/no-raw-dangerously-set-inner-html` 只覆盖 React `dangerouslySetInnerHTML`，拦不住直接 DOM 属性赋值。生产环境中远端字段的攻击者可控程度仍需后端验证，但危险 sink 与前端传播链已经成立。
- **方案**：删除自制 DOM toast，统一到 sonner/React 文本节点；全局 Toaster 放到 App 根，覆盖鉴权内外路由；新增 `security/no-imperative-html` 规则覆盖 `.innerHTML`、`.outerHTML`、`insertAdjacentHTML` 与 `document.write*`，仅允许 `innerHTML = ''` 清空第三方预览容器。
- **验收**：业务代码无直接 DOM HTML 写入；恶意错误字符串按纯文本显示；MCP 错误、上传失败、文档预览错误等既有调用面回归通过；lint 单测覆盖各危险 sink 和空容器清理例外。
- **状态与进展记录**：

| 日期       | 动作                                                                                                                                                                                      | 提交      | 备注                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-08-13 | 复核立项                                                                                                                                                                                  | —         | 与 SEC-3 的 SafeHtml 成果分开记账；SEC-3 不回退为未完成                                                                                    |
| 2026-08-13 | 落地：`@/lib/toast` 改为 sonner 适配层，Toaster 移到 App 根，删除内联 HTML/onclick 实现；Templates 头像 fallback 改为 React state；增加 imperative HTML lint 与真实 sonner/jsdom 注入回归 | `3fe7d43` | 验证：恶意 `<img onerror>` / `<script>` 完整作为文本显示，无 DOM 元素或 marker 执行；Security 2+1、lint 0 errors、build 与 bundle 预算通过 |

---

## ARCH — 架构级

### ARCH-1 统一 streaming/chat runtime（最大架构收益）

- **状态**：已完成（2026-06-12，范围于 2026-08-13 订正）——解析 transport、9 个读取面迁移与 EnhancedSSEParser 删除已完成；流终态、Abort/timeout、401 和续传语义不属于本条已完成范围，转 ARCH-7。
- **问题**：全仓至少 **8 套并行流式实现**，各自维护 transport、解析、abort、状态：
  `src/pages/home/hooks/useHomeChat.ts`、`src/pages/home/utils/mcp-agent-stream.ts`、`src/pages/agent/form/html-report/designer/report-sse.ts`、`src/pages/agent/features/runtime-workbench/runtime-stream.ts`、`src/pages/studio/create-app/hooks/use-create-app-preview.ts`、`src/pages/explore/ExplorePage.tsx`（内联）、`src/pages/search/detail/hooks/useSearchExecution.ts`、`src/pages/agent/share/use-shared-agent-runner.ts`。
  另有 `src/components/chat/EnhancedSSEParser.ts` 是**手写 SSE 解析器**（不依赖 eventsource-parser），直接违反 CLAUDE.md 流式规则第 3 条。后果：abort/重连/token 统计行为在各面上不一致，每加一个聊天面就 fork 一份逻辑。
  **补记（2026-06-11 实扫）**：另发现第 9 个流式读取面 `src/pages/agent/features/pipeline-workbench/hooks/use-pipeline-workbench.ts`（手动 `split(/\r?\n/)` + `data:` 前缀剥离提取 message_id），归入迁移清单；`conversationAPI.completion` 此前不接收 AbortSignal，fetch 发起阶段无法取消（阶段 1 已补）。
- **主流对照**：Vercel AI SDK（useChat + 统一 stream protocol + typed parts）、assistant-ui、@ant-design/x-sdk（已安装未充分利用）。共同点：单一 transport + 单一消息状态机，渲染层只消费 typed parts。
- **方案**（建议分三步，每步可独立合并）：
  1. 抽 `src/lib/streaming/`：transport（fetch+eventsource-parser+AbortController 生命周期）、事件 envelope 类型（合并 EnhancedSSEParser 的消息类型定义）、chunk-merge reducer（纯函数，必须配测试）。
  2. 把 8 个实现逐个迁移到该 runtime（每个一个 PR，回归点明确）。
  3. 删除 EnhancedSSEParser 与各处手写解析。
- **验收**：~~`grep -rn "new TextDecoder\|split('\\n\\n')" src` 在流式场景零命中~~（口径修正 2026-06-11：原模式会子串误命中合法的 `new TextDecoderStream()`，且漏掉 `split('\n')` / `split(/\r?\n/)` 形态的手写解析）。改为分阶段验收：每个已迁移面 `grep -n "EventSourceParserStream\|TextDecoderStream\|JSON.parse"` 零命中（解析样板收口到 `@/lib/streaming`）；终态用精确模式（`new TextDecoder(`、`split('\n')`、`split(/\r?\n/)` 限流式读循环）扫描零命中；reducer 有单测。2026-08-13 复核确认，旧文案中的“所有流式入口共享同一 abort/重连语义”并未完成，已从本条验收移出并由 ARCH-7 承接。
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

- **状态**：部分完成（2026-08-05 复核订正）——契约测试已进 CI（`test:api`，`src/api/__tests__/` 下 10 个文件），codegen 与 zod 边界校验仍未开始
- **优先级 / 工作量**：P2 / L–XL，8–15 前端人日；后端 spec 修正另约 4–8 人日
- **问题**：`types/api.ts`（1604 行）+ `types/index.ts`（2075 行）全部手写；API 边界零 zod 校验；`: any` 246 处。后端改字段前端编译照样绿，错误在运行时爆。
- **主流对照**：OpenAPI → `openapi-typescript` / orval 生成类型与 TanStack Query hooks；或无 spec 时在边界 `z.parse()`。
- **方案**：先确认后端是否有 OpenAPI/Swagger spec。有 → 引入 openapi-typescript，生成物替换手写类型（渐进式：先新接口用生成物，旧的逐域迁移）；无 → 推动后端补 spec，短期对高风险接口（auth、agent run、知识库）加 zod 边界校验。
- **验收**：新增接口不再手写类型；CI 里有 spec 同步检查（生成物 diff 为空）。
- **状态与进展记录**：

| 日期       | 动作                                                                                                                                                                                                                                                                                                                                                             | 提交                                                   | 备注                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | 立项，待确认后端 spec 现状                                                                                                                                                                                                                                                                                                                                       | —                                                      | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 2026-08-05 | **复核订正**：本条目此前一直标「未开始」，与实际不符。`npm run test:api` 已存在并进 CI（`.github/workflows/ci.yml` checks job 第 8 步），`src/api/__tests__/` 下已有 10 个契约测试（channel / client / datasource / knowledge-rest / mcp / metadata-config / system / team / agent / normalize-dataset），锁住端点路径、信封归一化与载荷形状。状态改「部分完成」 | d676360 `test(api): gate src/api contract tests in CI` | 后端 spec 现状也已确认：MultiRAG 是 FastAPI + Pydantic，`/openapi.json` 是白送的产物（本仓 `public/openapi.json` 是它的一份静态快照，被 `ApiKeysPage.tsx:1170` 运行时 fetch 用于文档 UI，**不是** codegen 输入，且其中 grep 不到任何 channel 端点）。所以「有没有 spec」这个开工前提已解除，剩下的是要不要引入 openapi-typescript/orval 的决策。**注意**：channel 的 `config` 字段按定义是运行时多态（见 ARCH-6），静态 codegen 会把它生成成 `FeishuConfigInput`，等于用生成器的形式把飞书硬编码请回来——那个字段应显式排除在 codegen 之外 |

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

- **状态**：已完成（2026-06-22）——store 总行数 3498→1714（−51%）；任一 store 不再持有"列表+loading+error"三件套；服务器读取 100% 走 React Query；store 内无 fetch-effect / `await loadX()`。终态验收见进展表末两行。
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

| 日期       | 动作                                                                                         | 提交    | 备注                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | -------------------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | 立项                                                                                         | —       | —                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 2026-06-22 | 盘点：13 store 三分类 + 死代码判定 + 风险升序执行顺序，状态置进行中                          | 7eeffb7 | model/knowledge/memory/environment 迁移，conversation/chat 删除，auth 归 SEC-1，5 个纯客户端 store 不动                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-22 | 前置修复：44c3b14 引入的 file-size 棘轮回归（拆 use-create-app-save、删 DialogTemplateFile） | 96c1637 | 见 ENG-1 进展表；ARCH-4 在绿门禁基线上推进                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2026-06-22 | Step 1：删死 store conversation.ts（227 行）                                                 | bc6ad19 | 0 运行时消费（仅 stores/index.ts barrel + resetAllStores）；删 barrel/type/重置引用；api/conversation.ts（conversationAPI）不动。lint 0 err、build 通过                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 2026-06-22 | Step 2：删死 store chat.ts（348 行）                                                         | ac45c5f | 死代码（旧 SSE + 服务器副本）；唯一消费 ExplorePage 仅 clearChat()，其 handleTopicsClick 已就地重置局部态（setMessages([]) 等），删除零行为变更；ExplorePage 减行 → 棘轮收紧                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2026-06-22 | Step 3：memory.ts 拆桥（355→230）                                                            | 0329570 | use-memory.ts 的 RQ→store 桥接写入全为死写（两个消费页早已读 `data?.memory_list/message_list`，无人读 store.memories/currentMemory/messages）→ 删 7 服务器字段 + 11 server action + setMemories/setMessages 等桥接；mutation 删手动数组改写、仅靠 invalidate；useUpdateMessageState 的"乐观"store 写本就不可见，按零漂移删除（不改 setQueryData，避免无中生有的乐观态）；store 仅留 UI 态（filter/page/view/选择/消息筛选/弹窗）。消费页零改动                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2026-06-22 | Step 4：整删 knowledge.ts（443）→ 已有领域 hook                                              | b3edef2 | 9 消费方迁 `useFetchKnowledgeList/Detail`+`useCreate/Update/DeleteKnowledge`：list 页删 fetch-effect、searchQuery 转局部 state；详情布局/子页改 `useFetchKnowledgeDetail(id)`（同 key 缓存，无重复请求）；tag-item 自取 list 不再依赖别页填 store。store 的 page_size 兜底重试移入 useFetchKnowledgeList（零漂移）；mock 假数据兜底与"出错仍本地删/改"两处错误掩盖 bug 刻意丢弃（错误改为正常上抛+提示）。KnowledgeSettingsPage 因 hook import 涨到 605>601，抽 `buildKnowledgeSettingsFormValues` 到 settings/ 子模块降到 572 并移出棘轮基线。lint 0 err、build 通过                                                                                                                                                                                                                                                                                                                                       |
| 2026-06-22 | Step 5：environmentStore 瘦身（276→27）+ 新建 use-environment-request.ts                     | 61f3546 | 新 hook 文件：environmentKeys + 3 query（list/detail/global，list 内 effect 承接原"自动选默认环境"）+ 4 环境 mutation + 组合 `useEnvironmentVariableMutations`（位置参数包装，消费方零改调用）/`useEnvironmentResolver`（选中环境+绑定 resolveText/getVariableMap，ApiKeysPage 解构形态不变）。迁 6 消费方；store 仅留 selectedEnvironmentId（persist 不变）+ selectEnvironment。setDefault/batchUpdate/validateReferences 无消费方→删。**prettier 棘轮地雷**：EnvironmentDetail/EnvironmentVariablesTable 为未格式化在册文件，提交时整文件重排胀大超基线→抽 `CreateModeVariablesTable`/`SortableRow` 子组件回到基线下（EnvDetail 998→989、EnvVarTable 615→491 移出基线、ApiKeysPage 4037→4031）。lint 0 err、build 通过                                                                                                                                                                                    |
| 2026-06-22 | Step 6：model.ts 删 store 半（751→364，保留助手/类型模块）                                   | 423d804 | **关键修正**：现有 llmAPI 的 mutation 与 store 工作实现分叉（setApiKey 用 provider 而非 llm_factory、addLLM→/llm/add、deleteFactory→DELETE /llm/{id}，且无 verify/source_fid），原计划低估；这些 hook 当前 0 消费，故按 store 工作调用重写 api/llm.ts（llm_factory、/llm/add_llm、POST /llm/delete_factory、SILICONFLOW source_fid、verify→ModelVerifyResult）并新增 enableLlm。use-llm-request 新增 useEnableLLM、useSetApiKey/useAddLLM 改位置参数包装且 verify 返回 ModelVerifyResult。迁 14 消费方（12 只读切 useFetchMyLLMs/useFetchFactories、删 loadMyLLMs effect；model-providers/index 接 4 mutation hook）。getter/selectedProvider 零消费→删；删死页 ModelProvidersPage.tsx 桩。query/option hooks 与 6 个 agent 消费方不变。门禁：lint 0 err、lint:typed 0 err、typecheck:agent-strict 通过、test:agent-t1 48 pass、build 通过；MCPChatPage 1581→1573、ExplorePage 2338→2332、model.ts 移出基线 |
| 2026-06-22 | Step 7：纯客户端 store 审计 + auth 例外声明                                                  | 本提交  | `ui`/`studio`/`home`/`team`/`search` 审计为纯客户端态（无服务器副本、服务器数据已各自走 use-\*-request），不迁；`auth.ts` 审计后状态 "audited, deferred to SEC-1/AUTH bootstrap"——`auth-storage` 仍持久化 token/user/tenant/isAuthenticated 属 SEC-1 已知例外，本任务未触碰 login/register（ARCH-2 契约），不宣称把所有 persist store 变 UI-only                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 2026-06-22 | Step 8：终态验收，状态置已完成                                                               | 本提交  | store 总行数 3498→1714（−1784，−51%）；精确 grep：`isLoading` 仅存于 auth（会话态）与 ui（globalLoading），无 store 持有"列表+loading+error"三件套、无 `loadX()` fetch-effect、无 useModelStore/useKnowledgeStore/useConversationStore/useChatStore 残留。全量门禁绿：lint 0err、lint:file-size（33 在册）、lint:typed 0err、typecheck:agent-strict、test:agent-t1 48 pass、test:streaming、test:design-tokens、build、check:bundle-size（raw 24.85/26.13MB、入口 gzip 114/120KB、最大 chunk gzip 708/739KB）。未 push，待 owner 指示                                                                                                                                                                                                                                                                                                                                                                       |

### ARCH-5 设计令牌治理 + Tailwind 4 评估

- **状态**：未开始
- **优先级 / 工作量**：P3 / L，8–12 前端人日；只做用量治理和 go/no-go 评估，实际迁移另估
- **问题**：1472 个 token、`theme-generator.ts` 2206 行；`components-*` 粒度 token 随组件数线性增长，对比主流（shadcn/Radix Themes 30–60 个语义变量）成本过高。Tailwind 停在 3.4，落后主流一个大版本；Tailwind 4 的 CSS-first `@theme` 与 build:themes 管线天然同构，迁移可能反而删管线。
- **方案**：(a) 先做 token 用量统计（哪些 token 全仓 0 引用 → 删）；(b) 新组件默认复用语义层 token，`components-*` 新增需 review 说明理由；(c) 单独立项评估 Tailwind 4 迁移（eslint-plugin-tailwindcss 兼容性、@theme 映射 PoC）。
- **验收**：0 引用 token 清零；token 新增有治理流程；Tailwind 4 评估有结论文档。
- **状态与进展记录**：

| 日期       | 动作 | 提交 | 备注 |
| ---------- | ---- | ---- | ---- |
| 2026-06-10 | 立项 | —    | —    |

### ARCH-6 channel 管理页：provider 知识散落在客户端，三处独立断裂

- **状态**：前端三步已完成（CHN-P5/P6/P7），等后端钉钉落地做零改动验收
- **问题**：这个页面号称由服务端 `config_schema` 驱动，实际是「飞书特例 + 通用回退」双轨，且回退那条路走不通。三处独立断裂，修好任一条都不够：
  1. **渲染断裂**：`src/pages/settings/channels/form-model.ts:148` 按 `manifest.provider === 'feishu'` 分支，唯一的 `$ref` 解析器（`:106-114`）只在飞书分支里被调用；`:153` 把 required 硬编码成 `new Set(['app_id','app_secret'])`；`:186-188` 对 `app_id` 特判。第二个 provider 走通用分支拿到的是根级 `{credential: {$ref}}`，会渲染出**一个明文输入框**，凭据字段一个都不出现。
  2. **序列化断裂**：`src/api/channel.ts:143-179 buildChannelMutationPayload` 只读 `app_id`/`app_secret`/`domain`/`allowed_open_ids` 四个键，`:88-96` 的出参类型也把 `config.credential` 钉死成这两个字段。第二个 provider 填的凭据**一个字节都不会进 POST 体**。
  3. **死表单**：`components/channel-form-sheet.tsx:70-78` 用 `providers[0]` 的 manifest 构造 zod schema，而 `:94-96`/`:263-266` 渲染 `selectedManifest`。选中第二个 provider 时，zod 在未挂载的字段上产生 issue、对应 `<FormMessage/>` 不在 DOM 里 → `handleSubmit` 的 success 分支永不执行，点保存**没有任何反应、不报错、不提交**。
     另有三条今天就在生产里发生的：`index.tsx:67-69,78-80` 与 `channel-form-sheet.tsx:140-142` 三处裸 `catch { toast.error(通用文案) }`，把后端分档的 `retcode` + `safe_message` 全部丢弃（版本过期 / 密钥没配 / 密钥库不可用 / 越权压成一句话）；locale 里 12 个 runtime state 中有 6 个服务端永不上报，`utils.ts:10-13` 的 `isRuntimeHealthy` 4 个值里 3 个不可达；`channel-form-sheet.tsx:89-92` 的 effect 依赖 `currentChannel` 对象引用，一次 `refetchOnReconnect` 就会 `form.reset` 静默清空已输入的 App Secret。
     **根因在后端表达力**：实测 `FeishuConfigInput.model_json_schema()` 根级与 `$defs` 里**都没有 `required` 数组**（所有字段带默认值以支持 PATCH merge），`format:"password"` 埋在 `anyOf[0]`。前端硬编码不是偷懒，是在补服务端的缺口——而且补的方式是撒谎。
- **主流对照**：服务端拥有表单描述已是共识（Airbyte `connectionSpecification` + `airbyte_secret`/`order`/`group`、Backstage scaffolder、n8n `INodeProperties` 的 `displayOptions`、Zapier `inputFields`）。分界线是「前端能不能养一个 schema 引擎」：养得起的用 JSON Schema + 厂商扩展 + RJSF；养不起的用服务端拍平的有序描述符。本仓属后者——无 ajv/@rjsf/formily 依赖，表单栈被 AGENTS.md 钉死为 react-hook-form + zod，且 600 行文件棘轮塞不下一个自研 `$ref`/`oneOf` 求值器。顺带一提，Airbyte 自己的 webapp 也没用 rjsf。
- **方案**：后端展平出有序 FieldSpec（`manifest.form.fields`，含 `path`/`kind`/`required`/`secret`/`i18n_key`），前端**不解析 JSON Schema**，只做排序、按 `visible_when` 过滤、按 bucket 分桶。分四步落地，每步都能独立发布：(a) 错误码接线 + providers 失败不再清空整页；(b) 状态词表收紧到服务端的 6 个 + 表单重置守卫 + invalidate 替代 setQueryData；(c) 新增 `form-spec.ts` 纯函数（`resolveFormFields` 有 `form` 用 `form`、没有回落到既有飞书编译分支）+ UI 接线 + 修死表单；(d) 删除客户端兜底 manifest 与飞书编译分支——**这一步是全程序唯一一条真跨仓依赖**，必须在后端 `manifest.form` 已部署之后，且 `listProviders()` 要丢弃缺 `form` 的 manifest，让老后端降级成「provider 不可用」横幅而不是渲染出零字段却可点保存的表单。
- **验收**：后端注册第二个 provider（钉钉）后，**本条目最后一次构建出来的前端不重新部署**就能渲染它的表单并保存成功；`git diff --stat` 里零个 `web/` 路径。`rg "provider === 'feishu'" src/pages/settings/channels` → 空；`rg 'FALLBACK_MANIFEST' src/` → 空。
- **对应后端条目**：`MultiRAG:docs/channel-program/PROGRESS.md` 的 `CHN-U1`（错误码透出，后端先）、`CHN-P2`（发 `manifest.form`，后端先）、`CHN-P5/P6/P7`（前端三步）。契约见 `MultiRAG:docs/channel-program/CONTRACT.md`。
- **状态与进展记录**：

| 日期       | 动作                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | 提交                        | 备注                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-05 | **补记**：channel 管理页此前的三次落地未记账（本表建立前）                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | 9ee3c1e / 6f0e5bd / 162fb1f | `feat(settings): add managed channel configuration` / `feat(settings): keep channel bindings intact and fix portal select` / `fix(settings): label the runtime states the server can actually report`。其中 162fb1f 只补了 3 条缺失的状态标签（+9 行、零代码），没删 6 个幽灵状态、没修 `isRuntimeHealthy`、没收紧 `ChannelRuntime.state` 类型——根因原封未动，本条目 (b) 步接手                                                             |
| 2026-08-05 | 立项（channel 子系统跨三仓审计）                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 8cbaf3a                     | 与 MultiRAG 侧 `docs/channel-program/` 账本配套；本条目起 channel 相关提交 scope 由 `settings` 改为 `channel`，并双标 CHN ID                                                                                                                                                                                                                                                                                                                |
| 2026-08-05 | 落地 (a)(b) 两步：错误码接线（三处裸 catch → `channelErrorMessageKey` 按 code 映射，对任何后端版本都安全降级）、providers 失败改内联横幅不再清空整页、运行时状态词表从 12 条删到服务端真实的 6 条、`isRuntimeHealthy` 按真实词表重写、表单重置守卫（ref + `isDirty`，不用 eslint-disable）、`setQueryData` 改 `invalidateQueries`、绑定下拉改服务端搜索                                                                                                                                                                           | 本次提交                    | 对应后端 CHN-U1~U7。测试落在 `src/api/__tests__/channel.test.ts`（唯一进 CI 的路径），新增 4 条共 61 passed；eslint 0 errors；build + check:bundle-size 三档全过。(c)(d)(e) 三步（form-spec 纯函数 / UI 接线 / 删兜底 manifest）仍待做                                                                                                                                                                                                      |
| 2026-08-05 | 落地 (c)：服务端 `manifest.form.fields` 驱动的纯函数层 `form-spec.ts`（`assembleConfig` 按点号路径组装嵌套 config，空 secret 字段整个省略）。`buildChannelMutationPayload` 不再提任何 provider 字段名——它过去只读四个飞书键，第二个 provider 的凭据会被表单收上来再被它默默丢掉                                                                                                                                                                                                                                                   | `c294088`                   | 对应 `CHN-P5`。放在纯函数层是因为只有 `src/api/__tests__/*.ts` 进 CI 门禁                                                                                                                                                                                                                                                                                                                                                                   |
| 2026-08-05 | 落地 (d)(e) 两步：UI 接到 spec，**死表单修掉**（schema 与渲染统一 key 在 `activeManifest`）；`provider-fields.tsx` 按 `field.kind` 渲染，**未知 kind 渲染成 disabled 而不抛错**；删掉客户端兜底 manifest 与飞书编译分支（`form-model.ts` 262 → 111 行）；`listProviders()` 丢弃缺 `form` 的 manifest 并把类型收窄成 `RenderableProviderManifest`                                                                                                                                                                                  | 本次提交                    | 对应 `CHN-P6`/`CHN-P7`。老后端半态：providers 为空 → 横幅 + 禁用新建，列表/启停/删除照常。**至此前端已具备零改动接纳第二个 provider 的能力，等后端 `CHN-P10` 做验收**                                                                                                                                                                                                                                                                       |
| 2026-08-06 | **落地 `CHN-O13`（`CHN-O6` 的前端半边）**：`channelAPI.verify(id)`（无请求体）、五个新 error code 进 `CHANNEL_ERROR_CODES` + 两份 locale、编辑抽屉页脚加「测试连接」（只对已保存渠道出现）、`useVerifyChannel` 带 10 秒冷却禁用。核心是 `channelVerifyFailure`——把「凭据被拒」和「没查成」分成两种结局，两条文案措辞刻意不同：把超时说成密钥错，会让人去重填一个本来正确的密钥。纯逻辑（端点路径、无 body、失败分类、冷却常量与服务端一致）放在 `src/api/__tests__/channel.test.ts`，那是唯一被门禁覆盖的位置；按钮本身靠人工验证 | 本次提交                    | 门禁：`test:api` 83 pass、`lint` 0 error、`typecheck:agent-strict` 通过、`lint:file-size` 通过、`build` + `check:bundle-size` 通过、两个棘轮 JSON 无 diff。**`lint:typed` 在 Windows 上跑不了**（`ESLINT_TYPED=true` 是 bash 语法，cmd 不认），它只覆盖 `src/lib/agent.ts` 与 agent operators/adapters，本次一个都没碰                                                                                                                      |
| 2026-08-06 | **后端进展，本仓尚未动工**：`POST /chat-channels/{id}/verify` 已上线（后端 `CHN-O6`）。它用**已存**凭据向 provider 打一次真实认证，把「填错 App Secret」的反馈环从数十秒压到一次往返——今天这个页面唯一一处「用户做对了事却要等很久才知道」的地方                                                                                                                                                                                                                                                                                  | —（后端 `CHN-O6`）          | 接的时候三个要点，都在后端 `docs/channel-program/CONTRACT.md` §1/§4.1：① **请求体为空**，凭据不从前端发；② `CHANNEL_CREDENTIAL_REJECTED`（凭据错，去改）与 `CHANNEL_VERIFICATION_UNAVAILABLE`（没查成，凭据可能没问题）**必须分开渲染**，混成一句会让人去重填一个正确的密钥；③ 有每渠道 10 秒冷却，超出返回 `CHANNEL_VERIFICATION_THROTTLED`（retcode 107），按钮要据此禁用。新增五个 error code 需要进 `CHANNEL_ERROR_CODES` + 两份 locale |

### ARCH-7 流式终态、Abort/timeout 与认证语义统一

- **状态**：未开始
- **优先级 / 工作量**：P1 / L，6–10 前端人日；如需新增服务端完成帧、幂等续传或 Last-Event-ID，后端另估
- **依赖**：沿用 ARCH-1 已完成的 parser/transport 基础；与 ENG-2 黄金 E2E 联动
- **问题与证据**：共享 `readSSEStream` 遇到任意 EOF 都正常返回，`structured-chat-stream` 在没有服务端 complete 帧时合成完成；APIClient 覆盖调用方 signal 并把所有 AbortError 归类为 timeout；REST 401 会清理会话而 SSE 401 只抛普通 Error。用户取消、超时、鉴权失效和网络截断因此会被不同页面解释成不同结果，部分路径把截断显示成成功。
- **方案**：定义 `completed / aborted / timed_out / interrupted / unauthorized` 类型化终态；组合调用方 signal 与 timeout signal；统一 raw/stream request 的 base URL、auth、401 和 APIError；无 complete 帧默认 interrupted；只有服务端支持幂等续传时才自动带 Last-Event-ID。
- **验收**：共享 transport/reducer 单测覆盖五种终态；Home、MCP、Agent share、Studio、Search 都使用相同状态与提示；意外 EOF 不再写成功结果；组件卸载和用户停止都能确认服务端连接取消。
- **状态与进展记录**：

| 日期       | 动作                     | 提交 | 备注                                 |
| ---------- | ------------------------ | ---- | ------------------------------------ |
| 2026-08-13 | 从 ARCH-1 完成范围中拆出 | —    | 解析收口成果保留，本条只处理运行语义 |

### ARCH-8 共享 Chat Workbench 产品与运行合同

- **状态**：未开始
- **优先级 / 工作量**：P2 / XL，15–25 前端人日
- **依赖**：ARCH-7 终态协议、ENG-2 E2E；需冻结消息、附件与工具调用协议
- **问题与证据**：Home、MCP、Explore、Agent runtime、Studio preview、Search 分别组装 composer、消息列表、自动滚动、停止/重试和工具状态。Home 强制滚底而 MCP 尊重用户上滚；流式 `aria-live/aria-busy`、附件反馈和错误恢复也不一致。
- **方案**：抽共享 headless controller + 展示 pattern，统一 composer、附件、滚动锚点、停止/重试、工具调用、引用、反馈、成本与可访问状态；各业务面只注入 transport adapter 和能力配置。
- **验收**：至少 Home、MCP、Agent runtime 三个高流量面迁移；相同流事件产生相同 UI 终态；用户上滚不被抢回底部；键盘、屏读器和 burst streaming E2E 通过。
- **状态与进展记录**：

| 日期       | 动作     | 提交 | 备注                                                  |
| ---------- | -------- | ---- | ----------------------------------------------------- |
| 2026-08-13 | 复核立项 | —    | 不重复实现 StreamingXMarkdown；它继续作为共享渲染边界 |

### ARCH-9 Projects/Spaces + Assets 信息架构试点

- **状态**：未开始
- **优先级 / 工作量**：P3 / XXL，25–45 前端人日；后端与产品另估
- **依赖**：项目/空间数据模型、权限、资产关联、迁移方案；ARCH-8 稳定后再扩大
- **问题与证据**：一级导航主要按实现模块拆分（Explore、Search、Knowledge、Memory、Agents、Studio、Tools、MCP），用户需要理解内部能力边界。主流 AI 产品逐渐以长期任务空间组织聊天、文件、知识、指令和产物，并把 Studio/管理能力放到次级工作区。
- **方案**：先试点单一 Project/Space：聚合聊天、知识/文件、项目指令和产物引用；Assets 提供统一搜索与复用；Studio、Agents、Tools/MCP、Settings 保留为构建/管理区。先验证数据模型和迁移，不直接重做全部导航。
- **验收**：试点空间能创建、迁入对话、关联资产、配置项目指令并保持权限隔离；现有深链接不失效；埋点能比较任务完成率与跨模块跳转成本。
- **状态与进展记录**：

| 日期       | 动作     | 提交 | 备注                                     |
| ---------- | -------- | ---- | ---------------------------------------- |
| 2026-08-13 | 复核立项 | —    | 战略性试点，不能排在安全与可靠性工作之前 |

### ARCH-10 Client Platform：Web/Desktop 共享产品与 durable Run

- **状态**：F0 文档基线已完成（2026-08-13）；产品实现未开始，当前仓库仍是纯 Web
- **执行账本**：稳定任务 ID、依赖、工程量与退出门禁统一维护在 `docs/client-platform/ROADMAP.md` 的 `CLP-*` 账本；本条只保留工程现代化入口，禁止复制第二套状态。
- **问题与证据**：直接把当前页面包进桌面壳，无法解决认证、Run 生命周期、断线/重载恢复、平台能力隔离、签名更新与本地高权限边界；同时重写原生 UI 会复制现有 React/Vite 的复杂业务面。
- **方案**：先完成 Web 正确性与认证，再建设 MultiRAG 云端 durable Run Service v2 和 Web/Desktop Shared Client；其后用 Electron stable 提供薄壳。MVP 不依赖 Rust Host；PTY、Git、workspace 文件系统、本地进程和本地 MCP 仅在 MVP 验证后的 Beta 独立评估。
- **固定合同**：`PlatformPort` 仅含 `capabilities/auth/openExternal/downloads/notifications/updates/runs`；`RunClient` 仅含 `createRun/getRun/subscribe/cancelRun/submitInteraction`。远程 schema 的唯一真源在 MultiRAG 后端，本仓不复制手写版本。
- **工程量**：F0 4–6、P0 35–50、Run Service v2 47–70、Shared Client 28–43、Desktop 32–48、发布质量 42–67 人日；原始 188–284，人力风险缓冲后 230–340 人日，5 人团队 MVP 约 16–22 周。Beta Rust Host 另计 130–200 人日（含 25% 风险）/ 12–18 周，整体约 7–10 个月。
- **验收**：安全、性能、固定负载、恢复、packaging 与 Alpha→10%→50%→100% 灰度门槛统一以 `docs/client-platform/TESTING_SECURITY.md` 为准；不能用开发态启动、未签名包或外部产品营销数字替代。
- **状态与进展记录**：

| 日期       | 动作                      | 提交         | 备注                                                                                                                |
| ---------- | ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| 2026-08-13 | F0 架构与执行文档基线落地 | 当前文档提交 | 只含文档、导航与规则；相对链接、Prettier 与 `git diff --check` 已通过，不新增依赖、Electron/Rust 代码或生产能力声明 |

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

- **状态**：部分完成（2026-08-13 复核）——专项单测与 API 契约门禁已有明显进展；统一测试入口、覆盖率基线和真实 E2E 仍未开始
- **优先级 / 工作量**：P1 / L–XL，9–14 前端人日
- **问题**：仓库现有 64 个 `*.test/spec.ts(x)`，四个正式脚本直接纳入约 21 个，另约 43 个没有进入常规 CI；这是文件匹配统计，不代表语句覆盖率。Streaming reducer/transport、API 契约、Agent serializer 已有测试，但登录、真实流式停止/重试、知识库上传检索、Studio 发布没有 Playwright/Cypress E2E。
- **方案**：(a) 建 `test:unit` 收口全部可在 Node/Vitest 运行的测试，保留专项脚本供局部快速反馈；(b) 建覆盖率基线和 ratchet，不追求一次性高百分比；(c) 引入 Playwright，按依赖顺序落三条黄金链路：登录→流式对话→停止/重试、知识库上传→检索、Studio 保存→预览→发布；(d) 测试数据可重建、账号权限固定、失败保留 trace/screenshot。
- **验收**：现有测试文件不存在“写了但 CI 永远不跑”的状态；CI 有稳定 E2E job；三条链路覆盖成功、权限/错误和恢复路径；flake 率可见且有 owner。
- **状态与进展记录**：

| 日期       | 动作               | 提交 | 备注                                                                                                      |
| ---------- | ------------------ | ---- | --------------------------------------------------------------------------------------------------------- |
| 2026-06-10 | 立项               | —    | —                                                                                                         |
| 2026-08-13 | 复核订正为部分完成 | —    | API 91、Agent 70、Streaming 43+2、Design Token 11 本轮通过；64 个测试文件中约 21 个进入正式脚本，仍无 E2E |

### ENG-3 "空头支票"规则落地（虚拟化 / a11y / mutation 错误 / i18n 分包）

- **状态**：未开始
- **优先级 / 工作量**：P2 / XXL，28–45 前端人日；必须拆成 4–6 个独立 PR 和独立棘轮，不能作为一个大改合并
- **问题**：四条文档规则与现实相反：
  1. 文档强制 >200 行列表虚拟化，但**仓库未安装任何虚拟化库**（无 @tanstack/react-virtual / react-window）。
  2. 文档称 a11y "强制"，eslint 里 jsx-a11y 全量降为 warn（`eslint.config.js` 的 `jsxA11yWarningRules`）。
  3. 文档要求 mutation 错误走 sonner toast，实际全局 `mutations.onError` 只有 `console.error`（`lib/query-client.ts:23`）。
  4. 文档要求 locale 按语言分包，实际 zh+en 全部随主包打（仅 knowledge 命名空间 2700+ 行），且 locale 是 .ts 不是 JSON（翻译平台无法处理）；`ensureLocaleLoaded()` 预留未实现。
  5. 2026-08-13 复核：lint 仍有 1490 warnings，其中 400+ 是主要 a11y 问题；Home/Agent/Studio/Search 的流式区缺 `aria-live/aria-busy`，多个图标按钮、菜单、可点击 div 缺名称和键盘语义。
  6. List、Settings rail、Studio 三栏和 Search rail 缺小屏降级合同；route locale override 缺卸载恢复，公开 share/widget 可能把临时语言带回主应用。
- **方案**：1) 大列表改服务端检索/分页或 @tanstack/react-virtual，日志导出改服务端任务/流式下载；2) a11y warning 建基线并逐批升 error，先修共享组件、菜单/焦点、流式状态；3) 全局 mutation onError 接 sonner（带去重），业务可恢复错误保留局部处理；4) locale 动态 import 当前语言，补 route locale cleanup 与 RTL direction；5) 核心页面模板定义 desktop/tablet/mobile 降级（drawer、tabs 或逐层导航）。
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

### ENG-6 假成功与无行为入口止血

- **状态**：已完成（2026-08-13）
- **优先级 / 工作量**：P1 / S–M，2–4 前端人日
- **依赖**：当前开放范围已按可验证接口/状态机冻结；正式新增能力转 ENG-8，不以 UI 模拟代替后端契约
- **问题与证据**：Agent 设置保存只 console.log 后关闭；API Key 编辑等待后关闭，“API 测试”随机生成 200/耗时/request ID；Studio 发布无 handler；Search 导出仅提示“即将支持”；首页附件/灵感按钮和推荐卡呈现可点击但没有完整行为。
- **方案**：有现成真实契约的 Agent 基础设置接通 PUT mutation；无接口/状态机的入口隐藏或由集中 capability policy 禁用并说明原因；推荐卡改为整卡原生按钮；删除随机响应、人工延时和 console-close 实现。
- **验收**：目标活跃路由中不存在“点击后静默”“随机成功”“console.log 后关闭”或仅靠 hover 才暴露的主操作；`test:product-ui` 与 Agent/API 契约测试进入 CI；正式开放能力必须先更新契约和能力测试。

#### 2026-08-13 capability 冻结记录

| 表面 / 活跃路由                                 | 当前决定                     | 代码与契约依据                                                                                                                                                                            |
| ----------------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent 基础设置 `/agent/:id`、`/agent/:id/embed` | 开放并接通真实保存           | 复用 `useUpdateAgentSetting` / PUT `/api/v1/agents/{id}`；回显当前名称/描述且只提交可编辑字段，避免旧 avatar/permission 并发覆盖；成功才关闭，失败保留输入；同步 Query cache 与本地 title |
| API Key 编辑 `/settings/api-keys`               | 移除入口                     | 当前 token API 只有 GET/POST/DELETE，无 PATCH/PUT；禁止用 delete+create 冒充编辑                                                                                                          |
| API 在线调试、保存用例/环境                     | disabled，明确“未开放”       | 集中 `apiKeysCapabilities`；随机 200、人工 delay 与伪 request ID 已物理删除；后端 runner 尚需 SSRF/凭证外发边界设计                                                                       |
| Studio 发布 `/studio/create-app`                | 隐藏                         | 只有真实保存链，没有发布版本/权限/分享契约；正式实现转 ENG-8                                                                                                                              |
| Search 导出 `/search/:id`                       | 移除入口                     | 无导出 API；占位 toast 与 prop 链已删除，导出范围/格式/敏感数据规则转 ENG-8                                                                                                               |
| Home 附件、灵感                                 | handler 存在才渲染；当前隐藏 | Home 请求尚未传附件，灵感无面板/数据源；避免仅补视觉 click handler                                                                                                                        |
| Home 功能标签                                   | 删除                         | 旧实现只切换高亮，不改变筛选、输入或导航                                                                                                                                                  |
| Home 推荐卡                                     | 保留并修复                   | 原有真实行为是预填输入；改整卡原生 button，触屏/键盘可达且不自动发送                                                                                                                      |

- **状态与进展记录**：

| 日期       | 动作       | 提交      | 备注                                                                                      |
| ---------- | ---------- | --------- | ----------------------------------------------------------------------------------------- |
| 2026-08-13 | 复核立项   | —         | 确认 Agent 设置存在真实更新契约；其余目标入口缺少后端闭环                                 |
| 2026-08-13 | 实现与验收 | `a6aa84b` | 真实接通 Agent 设置；其余入口隐藏/禁用；新增 7 个测试文件和正式 `test:product-ui` CI 门禁 |

### ENG-7 路由恢复、根错误边界与统一 mutation 错误反馈

- **状态**：已完成（2026-08-13）
- **优先级 / 工作量**：P1 / M，3–5 前端人日
- **问题与证据**：`/auth/forgot-password` 指向不存在的路由，运行态进入 React Router 开发者 404；路由无根 `errorElement`/catch-all；现有 ErrorBoundary 只在局部使用；Query mutation 全局错误仅 console.error。
- **实际实现**：React 根组件边界与无 `path` 的顶层路由 `ErrorFallback` 共同覆盖 provider、后代路由和局部渲染错误，并补显式产品化 `*` 404；401/403/5xx、未知异常和 lazy/render 失败使用固定中英文安全文案及可访问恢复动作，不把原始 message/details/stack 写入 DOM 或 console；AuthGuard 保留完整深链并拒绝外部及认证页循环跳转，未实现的忘记密码入口暂时隐藏；QueryClient MutationCache 以 `Global` / `Local` / `Silent` 明确反馈归属，全局及本次纳入 ownership 的局部错误均改为固定、去重的 i18n 安全文案。
- **验收**：真实 `appRoutes` 未知路由、lazy/render 失败不泄露敏感字符串、401/403/5xx 分类、根 reload/局部重试、恢复动作与焦点、登录深链/open redirect、mutation 安全文案和归属均有 focused 测试；`route-recovery` 已接入正式 `test:product-ui` CI 门禁，QueryClient 合同由 `test:api` 执行。生产错误聚合、Web Vitals 和 Trace ID 关联仍归 ENG-10；未触及的存量局部 raw-message 反馈归 ENG-3 的 mutation UX 棘轮继续清退。
- **状态与进展记录**：

| 日期       | 动作       | 提交     | 备注                                                                                       |
| ---------- | ---------- | -------- | ------------------------------------------------------------------------------------------ |
| 2026-08-13 | 复核立项   | —        | 运行态已复现忘记密码开发者 404                                                             |
| 2026-08-13 | 实现与验收 | 本次提交 | 根恢复边界、产品 404、安全 mutation 反馈、深链恢复、i18n 与正式测试门禁完成；观测转 ENG-10 |

### ENG-8 用户可见业务闭环

- **状态**：未开始
- **优先级 / 工作量**：P1 / L，5–10 前端人日；后端另估
- **依赖**：忘记密码、Studio 发布/版本、Search 导出、API Key 验证等接口及权限/状态机契约
- **问题**：ENG-6 已停止目标入口误导，但不能代替正式业务交付。忘记密码、Studio 发布、Search 导出、API 在线调试/用例/环境保存仍缺接口和状态机；API Key “重新生成”当前为 DELETE 后 POST，第二步失败会永久丢失旧 key。Documents/Workflow/Knowledge Import 等占位面也仍需逐一确认正式导航策略。
- **方案**：按使用价值逐项确定“实现 / 保持 disabled / 移出正式导航”；实现项必须定义请求、幂等、权限、进行中、成功、失败、重试、审计和回滚状态；有副作用的发布/工具调用补确认与结果可追踪性。
- **验收**：每个保留的主操作都有真实接口和状态机，不以延时或随机数模拟；黄金 E2E 覆盖 Studio 保存→预览→发布，其他闭环至少有契约测试。
- **状态与进展记录**：

| 日期       | 动作     | 提交 | 备注                   |
| ---------- | -------- | ---- | ---------------------- |
| 2026-08-13 | 复核立项 | —    | 待产品和后端拆分子任务 |

### ENG-9 统计与筛选数据口径正确性

- **状态**：未开始
- **优先级 / 工作量**：P1 / M–L，3–6 前端人日；后端聚合字段另估
- **问题与证据**：Studio 的发布/草稿/最近更新 KPI、状态筛选和排序基于当前分页 `dialogApps`，却与服务端全集 total 同屏；Memory 使用 `1280`、`45.6 MB`、`total * 0.8` 等硬编码/推导统计。企业租户数据量增大时会显示“总数很多但筛选为空”或错误 KPI。
- **方案**：服务端返回全量聚合和排序/筛选结果；前端只展示有来源、口径和更新时间的数据。暂时拿不到真实字段时删除卡片或标记“当前页”，不能猜算全局值。
- **验收**：跨页数据下 KPI、筛选、排序与服务端查询一致；统计响应有契约测试；页面不再含伪造常量或基于当前页冒充全量的计算。
- **状态与进展记录**：

| 日期       | 动作     | 提交 | 备注           |
| ---------- | -------- | ---- | -------------- |
| 2026-08-13 | 复核立项 | —    | 待接口口径确认 |

### ENG-10 产品级错误与性能可观测性

- **状态**：未开始
- **优先级 / 工作量**：P1 / L，5–8 前端人日；平台接入另约 2–4 人日
- **依赖**：先定义隐私边界与采样策略；禁止上传 prompt、对话、token 和工具结果原文
- **问题与证据**：无 Sentry/Datadog/OpenTelemetry/Web Vitals 集成，根错误边界缺失；源码仍有大量 console；API/SSE 失败、LLM TTFT、stream interrupted/abort、重试和真实路由性能不可观测。Vite 已注入版本/commit/build time，可直接作为 release 元数据。
- **方案**：接入统一错误与性能 SDK；只记录 release、route、API code/status、trace ID、TTFT、duration、terminal state、Core Web Vitals 和脱敏标签；source map 私有上传并确认部署产物不公开；建立告警阈值和 owner。
- **验收**：能回答“哪个版本、哪条路由、哪类错误、影响多少会话”；流完成/中断/取消率和 TTFT 有仪表盘；敏感字段自动脱敏并有测试。
- **状态与进展记录**：

| 日期       | 动作     | 提交 | 备注                     |
| ---------- | -------- | ---- | ------------------------ |
| 2026-08-13 | 复核立项 | —    | 待平台选型与隐私边界确认 |

### ENG-11 真实路由与全资产性能预算

- **状态**：未开始
- **优先级 / 工作量**：P2 / M–L，4–7 前端人日
- **依赖**：最好先有 ENG-10 RUM 基线；保留 ENG-4 已完成的 `dist/js` 三预算
- **问题与证据**：当前预算使用已达 96%～98%，脚本不覆盖 `dist/vs`、图片、字体、SVG 和 HTML modulepreload 闭包；登录页静态导入三张大图，存在约 11.2 MB SVG，Monaco worker/editor 与 Ant Design X 形成大块依赖。单入口 chunk 通过不代表 `/auth/login`、`/home`、share/widget 的真实首次加载合理。
- **方案**：增加 route manifest/无头浏览器采集，分别限制初始请求数、preload gzip、CSS/字体/图片和解析耗时；压缩/转换登录资产与超大 SVG；拆 antd 与 XMarkdown/XSDK；share/widget 独立验证重型依赖未进入初始闭包。
- **验收**：四条关键路由预算进入 CI；优化后收紧而非放宽预算；线上 LCP/INP/资源错误率没有回归。
- **状态与进展记录**：

| 日期       | 动作     | 提交 | 备注                     |
| ---------- | -------- | ---- | ------------------------ |
| 2026-08-13 | 复核立项 | —    | ENG-4 历史状态保持已完成 |

### ENG-12 巨型活跃模块的分层拆分

- **状态**：未开始
- **优先级 / 工作量**：P2 / XXL，25–40 前端人日，按模块分批
- **依赖**：先完成对应业务正确性、API 契约和 E2E；不得在未知行为上重构
- **问题与证据**：文件棘轮防止继续膨胀，但仍有 32 个在册债务文件；ApiKeysPage 约 4021 行、ExplorePage 约 2321 行、provider API key modal 约 1761 行、MCPChatPage 约 1573 行。Provider modal 以 40+ state 和厂商分支同时承担验证、序列化与 UI。
- **方案**：按活跃度和变更频率排序：ApiKeys/provider modal → MCPChat → Explore；先抽 hooks，再抽子组件/类型/常量；provider 改 schema/adapter registry + 通用表单壳；每次减债同步运行 `lint:file-size:update` 收紧基线。
- **验收**：目标页面容器只做编排；厂商新增不再修改巨型 switch/组件；核心模块有行为测试；基线单调下降，无全文件格式化噪音。
- **状态与进展记录**：

| 日期       | 动作     | 提交 | 备注                           |
| ---------- | -------- | ---- | ------------------------------ |
| 2026-08-13 | 复核立项 | —    | 待按活跃度和业务风险拆分子任务 |

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

- **状态**：部分完成（2026-08-13 复核）——根目录临时报告已清理、路线图已跟踪、低风险依赖维护做过一轮；本地配置、依赖自动化和剩余告警治理未完成
- **优先级 / 工作量**：P1（剩余生产依赖告警校准）+ P2（一般卫生）/ S–M，2–5 前端人日
- **问题**：(a) `.claude/settings.local.json` 仍被提交；(b) 无 Dependabot/Renovate；(c) `patch-package` 补丁使 Ant Design X 等升级必须先核对上游与真实流式回归；(d) 2026-08-13 实测 79 个直接依赖落后、`npm audit --omit=dev` 仍有 5 项（1 critical/1 high/3 moderate），但 optional tar 与 pptx-preview 链未证明在浏览器生产路径可利用，不能照搬工具等级；(e) 其余 docs 是否应入库仍缺明确分类。
- **方案**：(a) 将个人配置移出 Git；(b) 先做 5 项告警的 source-to-sink/实际 API 使用校准，再分批升级，禁止 `npm audit fix --force`；(c) 加周更的 Renovate/Dependabot，低风险小版本分组，major/0.x 和 patch-package 依赖单独 PR；(d) 建补丁台账与“上游已合并/可删除”条件；(e) 将可共享工程文档解除忽略，敏感/本机资料保持忽略。
- **状态与进展记录**：

| 日期       | 动作                                        | 提交           | 备注                                                                                       |
| ---------- | ------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------ |
| 2026-06-10 | 立项                                        | —              | —                                                                                          |
| 2026-06-10 | 发现 docs/ 整体未被跟踪；豁免并提交本路线图 | （见 git log） | 其余 docs 入库与否待 owner 决策                                                            |
| 2026-08-10 | 低风险依赖维护与 auth cache isolation       | 见 git log     | audit 31→5；补丁敏感和 breaking 升级保留为独立工作                                         |
| 2026-08-13 | 复核订正为部分完成                          | —              | 根目录两个临时报告已不存在；settings.local 仍 tracked；无依赖机器人；剩余 5 项需可达性校准 |

### HYG-3 规范、环境变量与进度账本漂移

- **状态**：未开始
- **优先级 / 工作量**：P2 / S–M，2–4 前端人日
- **问题与证据**：AGENTS.md/CLAUDE.md 版本表仍写 React 19.1、Vite 8.0、Router 7.7、Query 5.83，实际已是 19.2.8/8.2.1/7.18.2/5.101.4；`VITE_ADMIN_API_BASE_URL`、`VITE_ANALYZE`、`VITE_COMMIT_SHA` 已使用但未全部登记到 `.env.example`，部分已声明变量又无消费；`public/openapi.json` 的 `UpdateAgentRequest` 仍只有旧的 title/dsl，而当前后端已支持 description/avatar/permission 等局部更新；本路线图此前存在 SEC-4、ARCH-1、ENG-2 状态漂移。
- **方案**：增加轻量校验：版本表从 package.json 生成或 CI 比对；`import.meta.env` 使用面与 `.env.example`/类型声明双向核对；路线图状态变更纳入 PR checklist；AGENTS.md 与 CLAUDE.md 保持同提交镜像。
- **验收**：版本和环境变量清单无双向漂移；新增 `VITE_*` 未登记会失败；完成条目的代码、状态和进展表一致。
- **状态与进展记录**：

| 日期       | 动作             | 提交      | 备注                                                    |
| ---------- | ---------------- | --------- | ------------------------------------------------------- |
| 2026-08-13 | 纠正账本状态漂移 | `3fe7d43` | SEC-4、ARCH-1、ENG-2 已订正；自动校验和规范同步仍待实现 |

---

## 当前攻坚顺序

唯一逐项顺序见本文顶部“2026-08-13 复核快照与当前执行队列”。这里仅保留可用于排期的波次，避免两张排序表再次漂移。

| 波次          | 条目                                       | 进入条件                     | 退出条件                                                                   |
| ------------- | ------------------------------------------ | ---------------------------- | -------------------------------------------------------------------------- |
| 0：安全止血   | SEC-5、SEC-6                               | 无                           | 已完成（2026-08-13）：敏感日志和 imperative HTML sink 清零，防回归门禁落地 |
| 1：信任与恢复 | ENG-6、ENG-7                               | 已完成                       | 已完成（2026-08-13）：能力真实性、路由恢复和 mutation 安全反馈门禁已落地   |
| 2：核心可靠性 | ENG-8、ENG-9、ARCH-7、SEC-1、SEC-2、ENG-10 | 后端/部署契约冻结            | 业务闭环、数据口径、流终态、会话安全和观测均可验收                         |
| 3：质量门禁   | ENG-2、HYG-2、ARCH-2、ENG-11               | 波次 1/2 的关键路径稳定      | 单元测试全收口，三条 E2E 稳定，依赖与路由性能有门禁                        |
| 4：规模化偿债 | ENG-3、HYG-3、ARCH-8、ENG-12               | 有 RUM/E2E 基线              | a11y/响应式/i18n/大文件与共享 Chat 合同按棘轮持续下降                      |
| 5：战略试点   | ARCH-9、ARCH-5                             | 前四波稳定且有明确产品 owner | 单一 Project/Space 试点得出数据；Tailwind 4 有 go/no-go 结论               |

### 已完成历史（不占当前排序）

| 条目   | 完成状态                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| SEC-3  | SafeHtml/DOMPurify 与 React `dangerouslySetInnerHTML` lint 已完成；SEC-6 是新的直接 DOM sink，不回退本条状态 |
| SEC-4  | 2026-08-05 已完成；提交前 refetch 最新 `binding.enabled`，残余亚秒竞态已接受                                 |
| SEC-5  | 2026-08-13 已完成；认证链路零 console，敏感日志启发式规则与定向认证边界 `no-console` 已进 CI                 |
| SEC-6  | 2026-08-13 已完成；Toast 改为全局 sonner/React 出口，imperative HTML lint 与恶意字符串回归已进 CI            |
| ENG-6  | 2026-08-13 已完成；Agent 设置接真实 PUT，其余假成功/死入口按 capability 隐藏或禁用，产品 UI 合同测试已进 CI  |
| ENG-7  | 2026-08-13 已完成；根路由恢复、产品 404、安全 mutation 反馈、深链恢复与 focused 测试已进入正式 CI 门禁       |
| ARCH-1 | parser/transport、9 个读取面迁移和 EnhancedSSEParser 删除已完成；运行终态转 ARCH-7                           |
| ARCH-3 | 领域 query key factory 收口完成                                                                              |
| ARCH-4 | Zustand 服务器状态清退完成                                                                                   |
| ENG-1  | 文件体积棘轮完成，债务数量仍由 ENG-12 偿还                                                                   |
| ENG-4  | `dist/js` 三预算门禁完成，真实路由/全资产覆盖转 ENG-11                                                       |
| HYG-1  | LICENSE、CHANGELOG、版本 tag 流程完成                                                                        |
