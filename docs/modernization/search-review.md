# Search 与来源改造独立审查

审查基线：`f776737`。输入为 `output/playwright/search-review-manifest.json` 的 62 个文件；开始与复现结束时 SHA-256 均为 62/62 一致。本审查阶段只读生产源码，仅按后续授权新增正式回归与本报告，未提交。审查范围为 Search 工作区、检索/流/思维导图生命周期、来源详情与共享 API 接入，并追踪其直接依赖。

## 已复现的缺陷

### P1：分享请求缺少入口 auth 时会清除产品会话

位置：`src/api/search.ts:120`，共享 client 的 401 处理见 `src/api/client.ts:75`。

复现：已登录的产品会话中打开包含 `shared_id`、但缺少或留空 `auth` 的搜索 URL，调用 `mindmapShare`，分享端点返回 401。`skipAuth: Boolean(searchAuth)` 此时为 false，共享 client 注入产品 token，并执行产品会话清理。独立测试读回 `auth_token` 从固定测试值变为 null；这次分享失败会退出正常产品登录。原实现的独立 fetch 不执行产品会话清理，所以这是迁入共享 client 后新增的副作用。现有 API 测试只覆盖非空入口 auth 的分支。

最小建议：分享端点始终使用 `skipAuth: true`，由该入口明确提供凭证；如兼容性要求保留产品 token 回退，也应显式传 header，并保持分享请求的 401 与产品注销分离。补充 auth 缺失、空值、非空三类回归，断言产品 token 与注销事件。

### P1：设置保存结果没有应用与草稿归属，会覆盖新状态

位置：`src/pages/search/detail/hooks/useSearchSettings.ts:141`；新设置面板继续调用此 hook，且保存中表单控件仍可编辑。该 hook 在基线已存在，本轮将其作为当前改造继续暴露的真实行为缺陷报告，**不归因于新增代码**。

两个最小场景均复现：

- A 应用设置提交 pending，切换到 B；A 完成后，B 的 `config.kb_ids` 从 `['kb-B']` 变成 `['kb-A']`，其后检索可使用错误知识库。
- 同一应用提交 `top_k=11`，等待期间改为 22；成功返回后被 `setConfig(normalizedConfig)` 覆盖回 11，并将草稿视为已保存。

最小建议：保存事务记录 tenant/app scope 与请求 revision，失去归属后的结果及提示不再写当前状态。成功只推进对应提交的 saved 快照，保留提交后产生的草稿；若暂不支持并发编辑，保存期间统一禁用编辑，仍须保留切换/卸载归属守卫。Query 后台刷新也应按 scope 与草稿 dirty 状态合并，避免整个 `searchApp` 对象变动直接重置编辑。

### P2：新可用模型 Query 未纳入模型写入失效协议

位置：`src/pages/search/detail/hooks/use-search-models.ts:100`，对照 `src/hooks/use-llm-request.ts` 中 `useEnableLLM` 等 mutation 的 `llmKeys.myLLMs()` 失效。

复现：打开搜索设置完成可用模型查询 → 关闭 → 模型设置禁用一个模型 → 五分钟内重开。新 `llmKeys.available()` 仍是 fresh，已禁用模型继续作为选项；新增模型同样不会及时出现。独立 hook 集成使用真实 QueryClient 与 `useEnableLLM`，读回 list 调用仅 1 次，未执行预期刷新。旧版每次 open 直接 list，不存在这次新增缓存带来的窗口。

最小建议：模型写入统一失效 `llmKeys.all`，或显式失效 `myLLMs` 与 `available`；也可复用已有模型 Query 并用 select 做 Search 视图转换。增加关闭、修改模型、重开的集成用例。

### P2：根入口初始化会丢失仅保存在旧 UI store 中的主题

位置：`src/themes/appearance.ts` 的 `initTheme` 与 `src/stores/ui.ts` 的 version 2 migration；实际入口导入顺序见 `src/entrypoints/mount-application.tsx`。

在结束 Search 审查后，按主 agent 后续授权补查 Provider/store 组合时确认：只存在 `ui-storage` version 1 的 `state.theme='dark'`、没有独立 `theme` / `appearance` key，先 import UI store（实际 ESM 导入 App 时发生），再执行入口 `initTheme`。store 创建时能读到 dark，但其 v2 migration 移除了旧 theme；`initTheme` 再次读取存储时将这个已读取的偏好重置成 system。

独立 fresh-module 复现读回为 dark → system，`output/playwright/provider-review-repros.log` exit 1。最小建议是在 UI store 丢弃旧字段前迁移至新持久化 owner，或让首次 `initTheme` 保留已初始化的 appearance 快照；仅调整入口函数体顺序不能改变 ESM import 的先执行事实。主 agent 已派 appearance owner 修复及补正式 fresh-module 测试；本轮随后停止扩审。

## 独立复现证据

仅运行新增场景，未重复全量门禁。测试文件与配置在忽略目录，不进入交付清单：

```sh
npx vitest run --config output/playwright/search-review-vitest.config.ts output/playwright/search-review-repros.test.tsx
```

本轮 exit 1，4/4 契约断言失败，分别是产品 token 被清空、B 被 A 覆盖、22 被 11 覆盖、模型列表未刷新。日志：`output/playwright/search-review-repros.log`。使用固定虚构凭证及内存传输，无真实外部请求。这是缺陷复现结果，不能写成通过。

已读取主 agent 的 `output/playwright/root-focused-tests.log`（6 文件 / 21 测试通过）及新增 workspace / mindmap / API 测试源码；这些历史结果与本轮独立复现分开记录。

## 修复后读回

主 agent 修复了分享鉴权与模型失效；本审查者只新增正式回归，没有编辑生产源码：

| 正式回归/检查                                                                                | 实际结果                                                                                                                        |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `npx tsx --tsconfig tsconfig.app.json --test src/api/__tests__/search-share-session.test.ts` | exit 0，1 测试覆盖 auth 缺失/空/非空三分支；401 保留 auth、refresh、user，未派发注销；入口 header 和兼容的产品 token 回退均正确 |
| `npx vitest run src/pages/search/detail/hooks/__tests__/search-models.test.tsx`              | exit 0，1 测试；关闭 Search 设置、禁用模型、重开后请求第二次 list，禁用选项已消失                                               |
| 对上面两个新测试执行 ESLint                                                                  | exit 0，无警告                                                                                                                  |
| `npm run verify:test-inventory`                                                              | exit 0，256 文件，两个新测试均进入其对应 runner                                                                                 |
| `git diff --check`                                                                           | exit 0                                                                                                                          |

日志为 `output/playwright/search-share-session-readback.log`、`output/playwright/search-models-readback.log`。正式测试使用内存 fixture。主 agent 将 share 请求固定为 `skipAuth:true`，保留显式 header 回退；模型写入统一失效 myLLMs 与 available，验证分支不失效。修补后 manifest 的 `src/api/search.ts` 出现预期漂移，其余 61 个冻结文件当时仍一致。

设置事务与旧主题迁移由对应 owner 修复。本审查者随后只重跑原始独立场景：

```sh
npx vitest run --config output/playwright/search-review-vitest.config.ts output/playwright/search-review-repros.test.tsx -t 'pending settings save|edits made during'
npx vitest run --config output/playwright/search-review-vitest.config.ts output/playwright/provider-review-repros.test.tsx
```

两命令均 exit 0：设置 2 通过 / 另外 2 跳过，迁移 1 通过；A 的旧保存不再覆盖 B，保存期间 22 的新草稿不被提交快照 11 覆盖且仍为 dirty，旧 dark 偏好迁移保留。日志为 `output/playwright/search-settings-review-readback.log`、`output/playwright/provider-review-readback.log`。另已读取 appearance owner 的正式 `src/themes/__tests__/appearance-store-migration.test.ts`，其断言包含稳定快照、UI store、DOM 与新 storage 读回；没有重复该 owner 的完整专项。

修复后的输入另存于 `output/playwright/search-review-readback-manifest.json`，共 71 个文件，保留原 62 文件与额外直接依赖、新正式回归的 SHA-256，原冻结 manifest 未覆盖。最终原范围预期漂移为 `src/api/search.ts`、`src/pages/search/detail/hooks/useSearchSettings.ts` 两个修复文件。全量 build、浏览器验收及跨平台检查由主 agent 执行，本审查没有借 focused 结果扩张结论。

## 审查中确认的有效改进

- `null` 表示全部来源，`[]` 表示显式清空；来源列表分页限制一次渲染 100 条，未混淆空筛选。
- 手动停止与流意外中断有独立终态；不再将配置的 rerank/总结开关描述为已执行成功。旧请求 revision、AbortController 与流帧清理阻止旧结果追加到新检索。
- 思维导图使用真实请求 pending 与失败/空结果状态，取消传到共享 client，移除了虚构进度。来源回退图有明确说明。
- 来源详情用 `SafeHtml` 明确允许标签及属性；错误显示固定本地化文案；相似度合法零值保留，无效/越界值显示不可用；相关片段同时按 dataset 与 document 限定。
- Search 与公共来源文案归域资源；路由 namespace 包含 Search、chat、knowledge、settings 与 sources。分享/Widget 的 sources 作用域已在本批 locale 交接记录。

## 范围与限制

本轮是源码追踪和受控 jsdom/QueryClient 复现，不是浏览器布局、真实分享后端或生产验收。窄屏布局、明暗主题截图、真实焦点交互以主 agent 的浏览器验收为准。没有将未验证的假想风险列为缺陷。设置保存 hook 为已存在依赖，因此单独标明历史归属。

补充依赖快照（不在 62 文件 manifest 中，本轮读取时）：

| 路径                                        | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `src/api/client.ts`                         | `19da92efa2701979e4bb47b641d79ad0d57a448c07761de9fdbff879cf858978` |
| `src/api/request-abort.ts`                  | `ae4ebc81f5ffc62de0bf4fbecd6aea0e667bc6a4e9117169a6a54f429b7eb906` |
| `src/App.tsx`                               | `9d0094ceefabcb301c27de1b39b426b2571e4c42711f35f44aad31988cc5b037` |
| `src/themes/application-style-provider.tsx` | `777e5a5f6feed1624720437f92d894bdd7102e1dca9a864ee9e0fc22c2b12e42` |
| `src/components/ui/portal-theme.ts`         | `7cedf6ad67b3e04aa12c48c08df804041e434198be43c56cce9749cdb9369658` |
| `src/stores/ui.ts`                          | `9c1261c48b4cab4b5d50a34e362e01cf5d44599418dc2282284ec5b6931d09c2` |
