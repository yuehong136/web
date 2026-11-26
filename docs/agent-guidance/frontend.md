# 前端专题规则

仅在修改对应前端能力时读取相关节。通用工作边界见 [AGENTS.md](../../AGENTS.md)。

## Organization

### 文件组织（强制）

#### 文件大小

| 行数    | 状态    | 操作     |
| ------- | ------- | -------- |
| < 300   | ✅ 理想 | —        |
| 300–400 | ⚠️ 警告 | 计划拆分 |
| 400–600 | 🔶 注意 | 排期重构 |
| > 600   | ❌ 禁止 | 必须拆分 |

**文件体积棘轮**：以 `scripts/file-size-baseline.json` 为准；在册文件不得膨胀，新源文件不得超过 600 行。偿还债务后在同一 PR 运行 `npm run lint:file-size:update` 收紧基线，禁止放宽。参考 `src/pages/studio/create-app/`。

#### 命名

| 类型 | 文件                                       | 导出           |
| ---- | ------------------------------------------ | -------------- |
| 组件 | `kebab-case.tsx` 或 `kebab-case/index.tsx` | `PascalCase`   |
| Hook | `use-*.ts`                                 | `useCamelCase` |
| 类型 | `types.ts`                                 | 命名导出       |
| 常量 | `constants.ts`                             | 命名导出       |
| 工具 | `utils.ts`                                 | 命名导出       |

**默认使用命名导出**。仅在已有遗留页面文件保留原默认导出。新文件不得新增 default export。

新增路由沿用 `src/lib/router.tsx` 的 `lazyNamed` 适配命名导出；`React.lazy` 本身需要模块的 `default`，不要直接把仅含命名导出的模块传给它。

#### Hook 命名

| 用途     | 模式                                              |
| -------- | ------------------------------------------------- |
| 查询     | `useFetch*`、`useGet*`（`useFetchKnowledgeList`） |
| 变更     | `useCreate*`、`useUpdate*`、`useDelete*`          |
| UI 状态  | `useSet*`、`useShow*`、`useToggle*`               |
| 领域编排 | `use<Feature>`（`useCreateAppPage`）              |

#### 常量

状态与协议常量复用项目枚举，不使用魔法字符串。

#### 模块拆分

按职责拆出 hooks、子组件、类型和常量；仅在确有跨页复用时抬升到平台层。无需为行数机械创建空模块。

## UI

### 组件架构

#### 展示组件 vs 容器组件（强制）

**展示组件**（`src/components/ui/`、`src/components/patterns/`）：

- 纯展示，只接收 props
- ❌ 禁止：业务态 `useState`、加载数据的 `useEffect`、API 调用、读 store
- 局部 UI 态（开/关、hover）允许

**容器组件**（`src/pages/`、feature 组件）：

- 拥有 hooks、queries、mutations、store 访问
- 组合展示组件

#### 共享 UI 组件变更边界

- 仅为单页或单个 feature 调整外观、交互时，优先使用 `src/components/ui/` 现有组件的 props / `className`，或在 feature 层包装、组合；不要把局部特例写进共享组件的默认样式或行为。
- 共享组件自身的缺陷、无障碍或设计令牌问题，以及明确跨 feature 复用的基础能力，可以直接在 `src/components/ui/` 修复或新增；检查现有调用方的兼容性，并验证受影响的行为。业务编排仍留在容器层。

#### 页面骨架分层（强制）

| 层  | 目录                             | 职责         |
| --- | -------------------------------- | ------------ |
| L1  | `src/components/ui/`             | 仅原子组件   |
| L2  | `src/components/patterns/`       | 页面结构块   |
| L3  | `src/components/page-templates/` | 完整页面骨架 |
| L4  | `src/pages/`                     | 仅业务编排   |

规则：

- 新页面**必须**优先选 `page-template`，不得自定义新整页壳层
- 页面级 header/toolbar/loading/empty/error **必须**复用 `patterns/`
- `Layout` 是路由入口壳，紧贴 `AppShell`，**不得**再造第二根布局（`/settings/*` 的历史回归是反例，不要重蹈）
- Web 的一级图标栏保持固定，仅二级面板折叠。路由通过 `useRegisterSecondaryNavigation` 或 `ManagedSecondaryNavigation` 提供内容，由 `AppShell` 统一呈现常驻面板、悬浮预览和移动端抽屉；不再叠加页面自己的侧栏。没有该 provider 的独立或 Desktop 布局保留本地导航。
- 交给壳层的二级内容须通过 props 携带详情 ID 等页面参数，不能依赖原页面 Outlet 的路由上下文；悬浮打开状态不持久化。
- 跨 feature 复用面（如 `studio-panel-shell`、`stat-grid`）放 `patterns/`，不放 pages

#### 页面模板选择（强制）

| 场景         | 模板                        | 适用                              |
| ------------ | --------------------------- | --------------------------------- |
| Console      | `ConsolePageTemplate`       | 设置、系统、资源管理、列表        |
| Workspace    | `WorkspacePageTemplate`     | 首页、聊天、搜索工作区            |
| Studio       | `StudioPageTemplate`        | Agent Canvas、Prompt Studio、编排 |
| Studio 三栏  | `StudioTriPanePageTemplate` | 左 + 中 + 右轨的 Studio           |
| Split Detail | `SplitDetailPageTemplate`   | 列表/详情、检索工作台             |
| List         | `ListPageTemplate`          | 可筛选资源列表                    |

#### 页面状态组件（强制）

统一从 `patterns/page-states.tsx` 导出：

- `PageLoadingState`
- `PageEmptyState`
- `PageErrorState`

不得再写"spinner + text-gray-\*"临时空态块。

#### 对话界面（强制）

- 首页、探索、应用预览、Agent 运行与分享对话、搜索共用一套：消息列表 `components/chat/chat-transcript.tsx`（基于 `patterns/chat/message.tsx`），输入框 `components/chat/chat-composer.tsx`（基于 `patterns/chat/prompt-input.tsx`，附件托盘 `prompt-input-attachments.tsx`），滚动 `patterns/chat/chat-scroll-viewport.tsx`（发送后锚定新问题、流式期间不追底），会话列表 `patterns/conversation-list.tsx`。`@ant-design/x` 与 `x-sdk` 已移除，不要再引入；保留的是 `@ant-design/x-markdown`（经 `StreamingXMarkdown` 门面）与 `x-card`（A2UI）。
- `message.tsx`、`prompt-input.tsx` 改编自 Vercel AI Elements（Apache-2.0），保留文件头的来源、许可证与修改说明；不引入 AI SDK 运行时。
- 回答正文继续用 XMarkdown；Mermaid 用 `components/chat/mermaid-diagram.tsx`，代码高亮统一走 Shiki（`CodeBlock`）。

#### 实体头像（强制）

应用、Agent、知识库、搜索应用、记忆库、用户、团队成员和聊天角色统一用 `patterns/entity-avatar.tsx` 的 `EntityAvatar`：有图片时显示图片（兼容后端返回的裸 base64），加载失败或没有图片时显示单字头像，底色取身份色 `avatar-{1..8}-*`（OKLCH 生成、单字对比度达 AA，不随配色方案换色相）。

- `seed` 传实体 id，同一实体在列表、详情、选择器、聊天里颜色一致；省略时按名称取色。
- 物件用默认圆角方块，人和聊天角色用 `shape="circle"`；匿名访客、未命名助手用 `tone="neutral"` 加图标。
- 当前登录用户用 `useCurrentUserAvatar()` 取头像参数；助手显示应用或 Agent 自己的身份，不再用 "AI"/"U" 文字块。
- 不得再写渐变底 + 白字首字母、页面内的哈希配色或自造的头像令牌。
- 没有图片时，按类型显示用 `kind`（对话、Agent、知识库、搜索、记忆、技能等的图形），列表卡片需要说明类型时用 `badge` 角标；按类型统一取色用 `tone="kind"`。类型、图形和色位定义在 `patterns/entity-kind.ts`。
- 由 `design-guard/no-letter-avatar`（error，仅 `.tsx`）把关：`.charAt(0)`、`[0]`、`.at(0)`、`.slice(0, 1)`、`.substring(0, 1)`、`Array.from(x)[0]` 紧接 `.toUpperCase()` / `.toLocaleUpperCase()` 即报错（`entity-avatar.tsx` 除外）。单词首字母大写这类非 UI 处理放进 `.ts` 工具模块。

#### 身份与 AI 时刻（强制）

- 厂商、模型供应商的标识统一用 `patterns/provider-logo.tsx` 的 `ProviderLogo`（底层为自有 SVG 与 `@lobehub/icons-static-svg`），彩色标识保留原色，单色标识跟随文字色；不得把品牌标识画成界面图标或首字母块。
- 文件在列表、引用芯片、来源条中统一用 `patterns/file-kind-tile.tsx` 的 `FileKindTile`；文件图标与上传卡片取 `components/ui/file-tones.ts`。两者都映射到身份色 `avatar-*`。
- 潮光渐变 `bg-ai-tide`、聚焦光晕 `ai-glow`、顶部光晕 `ai-halo`、流光文字 `text-shimmer` 只用于 AI 时刻：聚焦的输入框、思考和检索中、运行中的 Agent、首页问候。普通按钮、卡片和标签不使用。
- AI 原生内容用专用角色：思考过程 `reasoning-*`，工具调用 `tool-*`，引用角标 `citation-*`，检索命中 `highlight-*`，流式光标 `caret`，运行状态 `run-*`（运行中同时用 `ai-*` 意图）。
- 以上由 `design-guard/no-raw-visual-values`（error）把关：禁止 Tailwind 原色板（`bg-blue-500` 等）、任意颜色值（`bg-[#…]`、`text-[rgb(…)]`）、不含 `ai-from` / `ai-via` / `ai-to` 的渐变，以及 JSX 文本里的 emoji 图标。生成的报告 HTML 除外。
- 集合页在用户未选择视图且数量不超过 12 时默认卡片网格（`src/stores/collection-view.ts`）；首次空状态用 `EmptyStart` 给出真实可用的起步路径，筛选为空仍用 `PageEmptyState`。
- 应用壳内只有一行页面头部：页面模板与 `ChatThreadHeader` 通过 `useWorkbenchHeader` 把标题和操作放进工作台顶栏，壳外（嵌入、独立页）自动回到页内。

### 设计令牌（强制 — 禁止任意值）

颜色只用语义角色。角色由 `src/themes/semantic-tokens.ts` 从配色方案种子（`color-schemes.ts`）生成，CSS 与 JS 通过 `npm run build:themes` 生成；体系与角色清单见 [色彩令牌 2.0](../../src/themes/design-system.md)。明暗、配色方案、对比度、主操作风格都由同一组角色承接，**业务代码禁止使用 `dark:` 前缀**，也不按方案写分支。

| 类别       | ✅ 使用                                                                             | ❌ 禁止                                              |
| ---------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 表面       | `bg-canvas`（壳层）、`bg-surface`（工作面）、`bg-raised`、`bg-overlay`、`bg-sunken` | `bg-white`、`bg-[#1a73e8]`、`bg-blue-600`            |
| 交互底     | `hover:bg-fill-hover`、`bg-fill-selected`、`bg-fill-muted`                          | 自写半透明黑白                                       |
| 文字       | `text-fg`、`text-fg-muted`、`text-fg-subtle`                                        | `text-gray-*`、`text-black`                          |
| 边框与焦点 | `border-line`、`border-line-subtle`、`ring-line-focus`                              | `border-gray-*`                                      |
| 主操作     | `bg-action-bg text-action-fg hover:bg-action-bg-hover`                              | 用强调色或黑色手写主按钮                             |
| 意图色     | `text-danger-fg`、`bg-success-soft`、`bg-warning-solid text-warning-on-solid`       | `text-green-500`、`bg-red-100`、`bg-danger-solid/10` |
| 间距       | `p-space-base`、`gap-space-md`                                                      | `p-4`、`p-[20px]`                                    |
| 圆角       | `rounded-radius-lg`                                                                 | `rounded-lg`、`rounded-[12px]`                       |
| 阴影       | `shadow-elevation-low/medium/high`（内联样式用 `var(--elevation-*)`）               | `shadow-md`、`shadow-sm`、阴影值放进 `--color-*`     |
| 图标尺寸   | `size-icon-sm/md/lg/xl/2xl`                                                         | `w-4 h-4`                                            |

允许的非 token Tailwind 类：布局（`flex`、`grid`、`absolute`）、尺寸（`w-full`、`h-screen`、`max-w-*`）、状态前缀（`hover:`、`focus:`、`disabled:`、`sm:`、`md:`）。

##### 意图 × 角色（强制）

`accent`、`ai`、`neutral`、`success`、`warning`、`danger`、`info` 七个意图共用同一组后缀：

- `-fg`：文字、图标、指示点、控件错误提示。不要给 `-fg` 配白字，深色主题下它是浅色。
- `-soft` / `-soft-hover` 加 `-line`：浅色提示条、标签、选中行与它们的描边。
- `-solid` / `-solid-hover` 加 `-on-solid`：实心按钮、徽标、计数胶囊，三者成套使用。
- 不要给角色加透明度修饰来造浅色（`bg-danger-solid/10`），浅色用 `-soft`；透明度修饰只用于装饰。

选中、焦点与链接用 `accent`：选中的控件是 `accent-solid`，选中行是 `accent-soft` 加 `accent-fg`，中性选中用 `fill-selected`。反馈色不能是唯一信号，配图标或文字。`design-tokens/no-feedback-state-token` 继续拦截已删除的 `state-{success,warning,error,info}` 形式。

##### JS/画布代码取 token（G6、图表、mindmap、知识图谱、Monaco）—— 强制

- 默认路径是**按主题静态取值**：从 `@/lib/design-tokens` 用 `getTokenValue(name, mode, preset)` / `getCategoricalPalette(mode, count, preset)`，`mode` 与 `preset` 来自 `useResolvedAppearance()`（React 外用 `getResolvedAppearance()`）；缓存、图表 effect 必须同时依赖二者。值来自生成的 `token-values.generated.ts`（hex / rgba），`custom` 方案按用户的品牌色种子在运行时生成。
- 分类色用 `viz-1..10`（身份稳定，不随方案换色相），轴线用 `viz-axis`；图表状态色用意图的 `-fg` / `-soft` 或 `run-*`。
- `readCssVar` / 运行时 `getComputedStyle` 只保留给 scoped-theme/embed 表面。**禁止硬编码 hex**。
- 页面里的数据图表用 Recharts，经 `@/components/charts`：`TimeSeriesChart`（时间序列柱/面积）、`Sparkline`（指标卡趋势）、`ChartTooltipCard`（悬停浮层）、`useChartTheme`（按上面的规则取色）。不要再用 div 或手写 SVG 拼坐标轴、刻度和浮层；缺的图形先补进这一层。ECharts 只留给 Agent 的 HTML 报告。

#### 令牌闭环（强制）

`npm run test:design-tokens` 包含 `token-closure.test.ts`：源码里的 `var(--color-*)` 和令牌类名必须指向已定义的令牌或 Tailwind 别名；`--color-*` 只放颜色（阴影走 `elevation`，渐变和模糊不进令牌）；只有主题生成器可以声明 `--color-*`（嵌入挂件在 `widget-theme.css` 里重指已有角色除外）。写错的令牌名在 Tailwind 里会静默生成空样式，这条测试是唯一的拦截点。意图矩阵以外的每个角色都必须有消费方，零引用会直接失败；新增角色要和它的第一个消费方一起提交。`semantic-contract.test.ts` 对全部方案、明暗、对比度、主操作风格以及一组品牌色种子校验 WCAG 2.2 AA。

#### `src/pages/**` 禁止项

- ❌ 新增 `bg-white`、`text-gray-*`、`border-gray-*`
- ❌ 新增原生 `<input>` / `<textarea>`（用 `@/components/ui/input` / `textarea`） — 例外必须写注释说明 UI 层无能力
- ❌ 用 `style={{ color, backgroundColor, … }}` 表达普通视觉语义（仅允许动画、进度比例等动态计算值）
- ❌ 第二套全屏页壳、独立白卡容器、备用根布局
- ✅ 优先级：`@/components/ui/*` → `@/components/patterns/*` → `@/components/page-templates/*`
- ❌ 引入 `antd`（含 `antd/*` 子路径）：antd 已从依赖中移除，控件用 `src/components/ui/**`（水印用 `ui/watermark`）；`@ant-design/x-markdown`、`x-card` 不受限。由 `design-guard/no-direct-antd-import`（error，全 `src`）把关，防止重新引入。

#### 作用域主题

嵌入式表面（agent share widget、外部 embed）通过 `src/themes/scoped-theme.tsx` 把 token 限定到子树，**不得**用 `dark:` 或内联 `style` 覆盖嵌入视觉。

### React 能力选择

- 乐观反馈必须有明确的状态所有者、失败恢复和服务端对账。已有 TanStack Query mutation 可使用 variables 或 `onMutate`；采用 `useOptimistic` 时在 Action/Transition 内更新并等待异步操作，不为同一数据再维护一份乐观缓存。
- 表单沿用 react-hook-form + zod；需要 React Action 的 pending/提交模型时可用 `useActionState`，不强制改写已有可靠表单。
- `use()` 只读取稳定来源的 promise/context；服务器数据沿用 Query，不在 render 中创建请求 promise。
- React Compiler 尚未启用。手写记忆化以实际收益为依据；引入 Compiler 时先在局部试点并比较渲染表现，不批量删除既有 `memo` / `useMemo` / `useCallback`。
- Activity 自 React 19.2 起可用；引入时验证隐藏期间 Effect 清理与流订阅生命周期。ViewTransition 等能力按仓库实际安装版本、浏览器支持和降级行为评估，不依赖长期不更新的“实验态”标签。

### 性能

- 重型依赖（Lexical、Monaco、mermaid、react-pdf-highlighter、docx/pptx-preview）**必须**在路由或 feature 边界懒加载。
- 中英资源通过 `ensureLocaleLoaded(locale, namespaces)` 按语言与业务域动态加载；新增入口同步 `route-locales.ts`，不在页面另起加载机制。
- 分栏布局用 `react-resizable-panels`，**不要**自己算像素。
- 列表 > 200 行用虚拟滚动（TanStack Table 虚拟化或手写虚拟列表），**不得**全量渲染 DOM。

### 可访问性

- 所有交互元素键盘可达，禁止鼠标专用交互。
- 焦点：
  - Modal/Dialog/Sheet 用 Radix 自带 trap，不要覆盖
  - 流式 UI 在 `aria-busy="true"` 时**禁止**抢焦点
- 屏读器：流式文字 `aria-live="polite"`；仅紧急错误用 `aria-live="assertive"`
- 状态色不能是唯一信号 — 配图标或文字

## i18n

### 国际化（强制）

- 所有用户可见字符串走 `react-i18next`。locale 在 `src/locales/<locale>/`，支持的语言清单统一登记在 `src/locales/locale-registry.ts`。
- 按 feature 拆 namespace（`common`、`datasource`、`flow`…）。新 namespace 单独建，不要塞 `common`。
- 产品界面语言只有一个统一来源：`src/locales/locale-registry.ts` 维护 `localeRegistry`，并自动推导 `ProductLocale`、`supportedLocales`、初始化 resources；`src/locales/i18n.ts` 暴露语言事务与入口 scope：`getProductLanguage()` 是保存偏好，`getCurrentLanguage()` 是当前有效语言，`subscribeProductLanguage` 只同步产品偏好到 `useUIStore.language`。`setProductLanguage` 成功加载后才提交偏好，失败保留原状态。不要用 `languageChanged` 把临时语言写回偏好，也不要在组件、页面或业务 hook 里维护第二套语言状态。
- 新增语言时只允许通过 `localeRegistry` 加语言元数据和资源入口；不要在侧边栏、弹窗或 share/embed 页面额外写死语言列表。`localeRegistry` 为每种语言登记显式 namespace loader，`ensureLocaleLoaded(locale, namespaces)` 实际动态加载。`RouteLocaleBoundary` 按 `route-locales.ts` 加载业务域，已挂载页面切语言前先准备资源，不按 locale key 重挂。新增路由消费域或共享组件文案后同步 namespace 映射，避免漏 key 或为少量共享文案加载整个大业务域。测试预加载只放 `test-bootstrap.ts`，不得被生产入口导入。
- 默认语言由 `i18next-browser-languagedetector` 检测；**禁止**在组件里硬写 `lng`。所有进入 i18n 的语言码必须先经 `normalizeLocale` 归一到 registry 支持的 `ProductLocale`。
- `src/locales/i18n.ts` 中不要随意启用 `supportedLngs`、`cleanCode`、`nonExplicitSupportedLngs`。本项目资源键由 `localeRegistry` 登记，错误组合会导致 i18next 把合法语言判为 unsupported，表现为侧边栏语言与 `t()` 的回退语言不一致。若必须调整配置，先用浏览器控制台确认没有 `rejecting language code not found in supportedLngs`。
- 侧边栏语言切换是产品级设置，只写本地偏好，不调用后端 `/setting`；Chat/Agent 模型回复语言、检索跨语言、工具参数 `language` 不得与产品界面语言混用。
- `/agent/share`、`/chats/widget`、embed `set-locale` 使用 `useRouteLocale` / `createRouteLocaleScope` 做可释放的临时覆盖，卸载必须 dispose；独立 Widget 使用 `IsolatedLocaleBoundary` 自有实例和 Provider，不写宿主偏好或 document。兼容的 `applyRouteLocale` 调用必须配对清理，**不得**覆盖用户本地产品语言偏好。
- 切换语言必须同步 `document.documentElement.lang` 和 `dir`；日期、相对时间、数字格式化统一从 `getCurrentLanguage()` 派生，不要硬写 `toLocaleString('zh-CN')`。
- Agent/画布节点的协议字段、operator id、DSL 字段、后端枚举、第三方语言选项值不翻译；只翻译 UI label/description。节点自定义名称按用户数据展示，缺省名称才可走 i18n fallback。
- 复数与插值用 i18next API（`{{count}}`、`count` 参数及 JSON v4 的 `_one` / `_other` 等语言复数类别），不新增旧 `_plural` 后缀，不用字符串拼接。
- 接触 `src/components/layout`、`src/pages/agent`、`src/pages/agents` 的用户可见文案后，至少跑 `npm run lint:i18n-agent`；触碰 locale 服务再补 `npm run build`。

新增文案使用稳定语义 key，复用同义 key，中英资源同 PR 更新；fallback 不替代资源。组件使用 `useTranslation()` / `t()`，不按语言分支拼接文案。新增语言先补齐 namespace 再注册。文案改动验证所改表面的中英切换、无 missingKey；语言服务或 share/widget 改动另验证刷新持久化、路由语言隔离及无 unsupported-language 警告。

`chat.aiWorkspace` 等已登记的窄范围类型合同使用 `useTypedTranslation(scope)`，复用同一个 i18n 实例。调整这些 catalog 后运行 `npm run i18n:types` 并提交生成物；`check:i18n-types` 检查漂移，`i18n:review` 提供双语审核清单。不要把试点扩成全仓泛型重写或第二套资源加载器。
