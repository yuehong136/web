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

**展示组件**（`src/components/ui/`、`src/components/vendor/`、`src/components/patterns/`）：

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

#### 实体头像（强制）

应用、Agent、知识库、搜索应用、记忆库、用户、团队成员和聊天角色统一用 `patterns/entity-avatar.tsx` 的 `EntityAvatar`：有图片时显示图片（兼容后端返回的裸 base64），加载失败或没有图片时显示单字头像，底色取 `components-avatar-{1..8}-*`（OKLCH 生成、单字对比度达 AA）。

- `seed` 传实体 id，同一实体在列表、详情、选择器、聊天里颜色一致；省略时按名称取色。
- 物件用默认圆角方块，人和聊天角色用 `shape="circle"`；匿名访客、未命名助手用 `tone="neutral"` 加图标。
- 当前登录用户用 `useCurrentUserAvatar()` 取头像参数；助手显示应用或 Agent 自己的身份，不再用 "AI"/"U" 文字块。
- 不得再写渐变底 + 白字首字母、页面内的哈希配色或 `components-avatar-gradient-*` 之类的头像令牌。

### 设计令牌（强制 — 禁止任意值）

`src/themes/tokens.ts` 定义设计令牌。明暗调色板在 `theme-generator.ts`，CSS 通过 `npm run build:themes` 生成。深色模式自动适配，**业务代码禁止使用 `dark:` 前缀**。

| 类别         | ✅ 使用                                                                  | ❌ 禁止                                              |
| ------------ | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| 表面         | `bg-background-surface`、`bg-background-subtle`                          | `bg-white`、`bg-[#1a73e8]`、`bg-blue-600`            |
| 文字         | `text-text-primary`、`text-text-secondary`、`text-text-caption`          | `text-gray-*`、`text-black`                          |
| 边框         | `border-border-default`、`border-border-subtle`                          | `border-gray-*`                                      |
| 状态（反馈） | `text-status-success`、`bg-status-error-subtle`、`bg-status-error-solid` | `text-green-500`、`bg-red-100`、`bg-status-error/10` |
| 间距         | `p-space-base`、`gap-space-md`                                           | `p-4`、`p-[20px]`                                    |
| 圆角         | `rounded-radius-lg`                                                      | `rounded-lg`、`rounded-[12px]`                       |
| 阴影         | `shadow-elevation-low/medium/high`（内联样式用 `var(--elevation-*)`）    | `shadow-md`、`shadow-sm`、阴影值放进 `--color-*`     |
| 图标尺寸     | `size-icon-sm/md/lg/xl/2xl`                                              | `w-4 h-4`                                            |

允许的非 token Tailwind 类：布局（`flex`、`grid`、`absolute`）、尺寸（`w-full`、`h-screen`、`max-w-*`）、状态前缀（`hover:`、`focus:`、`disabled:`、`sm:`、`md:`）。

##### 状态色：反馈态（`status-*`）与交互态（`state-*`）—— 强制

这是两条不同的语义轴，不要混用：

- **反馈态**（success / warning / error / info）→ **`status-*`**，按角色取用（每个意图同一套后缀）：
  - `status-X`：文字、图标、指示点、进度条、图表标记，以及输入框等控件的错误边框。
  - `status-X-solid` / `status-X-solid-hover` + `status-X-on-solid`：实心按钮、徽标、计数胶囊，三者成套使用，不要再给 `status-X` 配白字。
  - `status-X-subtle` / `status-X-subtle-hover`：浅色提示条、标签、行高亮；悬停用 `-subtle-hover`。
  - `status-X-border`：浅色提示条、标签和卡片的描边；粗的强调条、控件边界可以用 `status-X`。
  - 不要给状态色加透明度修饰（`bg-status-error/10`、`border-status-info/30`、`text-status-success/80`），透明度由角色本身决定。
  - 色阶由 `src/themes/status-palette.ts` 在 OKLCH 中生成：每个意图每套主题 12 阶，前景与实心标签按 WCAG AA 求解。`categorical-palette.test.ts` 的状态角色契约覆盖前景对各类底色、对自身浅色底、实心标签对实心底，旧的 500 色阶会被判失败。
  - alert、badge、task-status、system-health/status、HTTP 方法 GET/PUT/DELETE、步骤条、画布节点状态、系统图表这些组件状态族由 `status-component-tokens.ts` 从同一色阶派生，不要在生成器里手写 hex。
- **交互态**（hover / active / focus / disabled / selected）→ **`state-*`**：`state-hover`、`state-active`、`state-focus`、`state-disabled`、`state-selected`（及 `state-selected-text`/`state-selected-bg`、`state-focus-10`/`state-focus-subtle`）。它们不是反馈色，**不要**迁移到 `status-*`。
- `state-{success,warning,error,info}`（含 `-10`/`-subtle`）曾是 `status-*` 反馈 token 的 legacy alias；全仓迁移已完成，这 12 个 alias 已**物理删除**（tokens/theme/CSS）。**反馈态一律用 `status-*`** —— `error` 级 lint 规则 `design-tokens/no-feedback-state-token` 现在拦截任何反馈态 `state-*` 形式（class 含 `from-/via-/to-` 渐变档位、`var(--color-state-*)`、裸字符串 / `readCssVar()` / 拼接）。详见 `docs/design-tokens/2026-05-20-feedback-state-alias-deprecate-summary.md`。分类/层级 data-viz 着色（如搜索 mindmap）用 `data-viz-categorical-1..10`（色盲友好 OKLCH 色阶；用 `node scripts/gen-categorical-oklch.mjs` 重新生成）。

##### JS/画布代码取 token（G6、图表、mindmap、知识图谱）—— 强制

- 默认路径是**按主题静态取值**：从 `@/lib/design-tokens` 用 `getTokenValue(name, theme)` / `getCategoricalPalette(theme, count?)`，颜色由 `useResolvedAppearance()` 的 `resolvedMode` / `preset` 解析（React 外用 `getResolvedAppearance()`）。`getTokenValue(name, mode, preset)` / `getCategoricalPalette(mode, count, preset)` 的 preset 可省略以兼容旧消费面；缓存、图表 effect 必须同时依赖 mode 和 preset，避免只换预设时停留旧颜色。取值来源是生成的 `token-values.generated.ts`。
- `readCssVar` / 运行时 `getComputedStyle` 只保留给 scoped-theme/embed 表面。**禁止硬编码 hex**。
- 图表语义状态色用 `components-system-chart-*`。

#### 场景 token（壳层 / 模板 / 状态块强制）

`tokens.ts` 中确认存在的前缀：

- `components-app-shell-bg`
- `components-main-workbench-{bg,surface,border}`
- `components-page-header-{bg,border,title,description}`
- `components-page-toolbar-{bg,border,text}`
- `components-page-state-{icon-bg,icon,title,description}`
- `components-settings-rail-{bg,border,title}`
- `components-console-{bg,surface,border}`
- `components-workspace-{bg,surface,border}`
- `components-studio-{bg,surface,border}`
- `components-split-pane-{bg,border}`

加上更细粒度的 `components-button-*`、`components-input-*`、`components-card-*` 等。

#### 令牌闭环（强制）

`npm run test:design-tokens` 包含 `token-closure.test.ts`：源码里的 `var(--color-*)` 和令牌类名必须指向已定义的令牌或 Tailwind 别名；`--color-*` 只放颜色（阴影走 `elevation`，渐变和模糊不进令牌）；只有主题生成器可以声明 `--color-*`。写错的令牌名在 Tailwind 里会静默生成空样式，这条测试是唯一的拦截点。新增令牌必须同时有消费方，零引用令牌按 ARCH-5 删除。

#### `src/pages/**` 禁止项

- ❌ 新增 `bg-white`、`text-gray-*`、`border-gray-*`
- ❌ 新增原生 `<input>` / `<textarea>`（用 `@/components/ui/input` / `textarea`） — 例外必须写注释说明 UI 层无能力
- ❌ 用 `style={{ color, backgroundColor, … }}` 表达普通视觉语义（仅允许动画、进度比例等动态计算值）
- ❌ 第二套全屏页壳、独立白卡容器、备用根布局
- ✅ 优先级：`@/components/ui/*` → `@/components/patterns/*` → `@/components/page-templates/*`

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

- 所有用户可见字符串走 `react-i18next`。locale 在 `src/locales/{en-US,zh-CN}/`，语言清单统一登记在 `src/locales/locale-registry.ts`。
- 按 feature 拆 namespace（`common`、`datasource`、`flow`…）。新 namespace 单独建，不要塞 `common`。
- 产品界面语言只有一个统一来源：`src/locales/locale-registry.ts` 维护 `localeRegistry`，并自动推导 `ProductLocale`、`supportedLocales`、初始化 resources；`src/locales/i18n.ts` 暴露语言事务与入口 scope：`getProductLanguage()` 是保存偏好，`getCurrentLanguage()` 是当前有效语言，`subscribeProductLanguage` 只同步产品偏好到 `useUIStore.language`。`setProductLanguage` 成功加载后才提交偏好，失败保留原状态。不要用 `languageChanged` 把临时语言写回偏好，也不要在组件、页面或业务 hook 里维护第二套语言状态。
- 新增语言时只允许通过 `localeRegistry` 加语言元数据和资源入口；不要在侧边栏、弹窗或 share/embed 页面额外写死语言列表。`localeRegistry` 为每种语言登记显式 namespace loader，`ensureLocaleLoaded(locale, namespaces)` 实际动态加载。`RouteLocaleBoundary` 按 `route-locales.ts` 加载业务域，已挂载页面切语言前先准备资源，不按 locale key 重挂。新增路由消费域或共享组件文案后同步 namespace 映射，避免漏 key 或为少量共享文案加载整个大业务域。测试预加载只放 `test-bootstrap.ts`，不得被生产入口导入。
- 默认语言由 `i18next-browser-languagedetector` 检测；**禁止**在组件里硬写 `lng`。所有进入 i18n 的语言码必须先经 `normalizeLocale` 归一到 `zh-CN` / `en-US`。
- `src/locales/i18n.ts` 中不要随意启用 `supportedLngs`、`cleanCode`、`nonExplicitSupportedLngs`。本项目资源键是 `zh-CN` / `en-US`，错误组合会导致 i18next 把合法语言判为 unsupported，表现为侧边栏显示 English 但 `t()` 仍回退中文。若必须调整配置，先用浏览器控制台确认没有 `rejecting language code not found in supportedLngs`。
- 侧边栏语言切换是产品级设置，只写本地偏好，不调用后端 `/setting`；Chat/Agent 模型回复语言、检索跨语言、工具参数 `language` 不得与产品界面语言混用。
- `/agent/share`、`/chats/widget`、embed `set-locale` 使用 `useRouteLocale` / `createRouteLocaleScope` 做可释放的临时覆盖，卸载必须 dispose；独立 Widget 使用 `IsolatedLocaleBoundary` 自有实例和 Provider，不写宿主偏好或 document。兼容的 `applyRouteLocale` 调用必须配对清理，**不得**覆盖用户本地产品语言偏好。
- 切换语言必须同步 `document.documentElement.lang` 和 `dir`；日期、相对时间、数字格式化统一从 `getCurrentLanguage()` 派生，不要硬写 `toLocaleString('zh-CN')`。
- Agent/画布节点的协议字段、operator id、DSL 字段、后端枚举、第三方语言选项值不翻译；只翻译 UI label/description。节点自定义名称按用户数据展示，缺省名称才可走 i18n fallback。
- 复数与插值用 i18next API（`{{count}}`、`count` 参数及 JSON v4 的 `_one` / `_other` 等语言复数类别），不新增旧 `_plural` 后缀，不用字符串拼接。
- 接触 `src/components/layout`、`src/pages/agent`、`src/pages/agents` 的用户可见文案后，至少跑 `npm run lint:i18n-agent`；触碰 locale 服务再补 `npm run build`。

新增文案使用稳定语义 key，复用同义 key，中英资源同 PR 更新；fallback 不替代资源。组件使用 `useTranslation()` / `t()`，不按语言分支拼接文案。新增语言先补齐 namespace 再注册。文案改动验证所改表面的中英切换、无 missingKey；语言服务或 share/widget 改动另验证刷新持久化、路由语言隔离及无 unsupported-language 警告。

`chat.aiWorkspace` 等已登记的窄范围类型合同使用 `useTypedTranslation(scope)`，复用同一个 i18n 实例。调整这些 catalog 后运行 `npm run i18n:types` 并提交生成物；`check:i18n-types` 检查漂移，`i18n:review` 提供双语审核清单。不要把试点扩成全仓泛型重写或第二套资源加载器。
