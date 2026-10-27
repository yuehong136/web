# Appearance 核心交接

2026-10-24。本文件记录本轮主题 owner 的本地验证；全应用类型/build、路由与浏览器验收由主 agent 集成完成。

## 实现与文件

- `src/themes/appearance.ts`：独立 preset × mode × density × textScale × motion 状态；合法化、稳定快照、系统主题/减少动效监听生命周期、storage 同步、SSR/拒绝 storage 降级。首次读取的快照保留历史模式，初始化时以该快照持久化迁移，避免 UI store 已重写 v2 后二次读取而丢失模式。
- `src/themes/use-appearance.ts`、`use-system-preference.ts`、`index.ts`：统一 React 外部 store 订阅与兼容入口。
- `preset-palettes.ts`、`preset-tokens.ts`、`theme-artifact-generator.ts`、`theme-generator.ts`、`theme-css-generator.ts`、`build-themes.ts`：studio 中性工作台、paper 暖纸阅读、graphite 冷灰工具、ocean 海蓝探索的八套语义值。`light.css` / `dark.css` / `token-values.generated.ts` 同源生成，每套 742 个 token。生成器验证失败会退出失败。
- `appearance.css`、`tailwind.css`：实际消费密度、文字缩放、圆角、字体与 motion；`development-guide.md` 增补现行消费合同。
- `scoped-theme.tsx`：局部维度覆盖、继承父 scope、真实 Portal 容器、Ant Design popup scope；不会重挂业务子树。
- `src/lib/design-tokens/{token-values,categorical-palette}.ts`、`src/lib/antd-theme.ts`：静态按 preset 取值与 vendor 控件所有外观维度。
- `public/theme-init.js`：CSS/React 前的外部脚本；同样合法化五维偏好、迁移 legacy、保留 share/widget URL 明暗覆盖，无 inline style / eval。
- 新回归：`src/themes/__tests__/{appearance,appearance-bootstrap,scoped-appearance}.test.*`、`src/lib/design-tokens/__tests__/appearance-presets.test.ts`；现有 categorical-palette 回归同步适配多 preset CSS。

## API

`@/themes` 导出 `Appearance`、`ResolvedAppearance`、`APPEARANCE_PRESETS`、`DEFAULT_APPEARANCE`、`normalizeAppearance`。

```ts
setAppearance({ preset: 'ocean', density: 'compact' }) // 仅合并提供的维度
getAppearance() // Readonly<Appearance>；值不变时引用不变
useAppearance()
subscribeAppearance(listener) // 返回 cleanup
getResolvedAppearance() // 额外 resolvedMode、reducedMotion
useResolvedAppearance()
initAppearance() // 与 initTheme 兼容；返回幂等 cleanup
```

默认值是 `{ preset: 'studio', mode: 'system', density: 'comfortable', textScale: 1, motion: 'system' }`。
`appearance` 是完整持久化源；兼容 `theme` 模式镜像，迁移读取优先级为 appearance → theme → ui-storage.state.theme。
原 `Theme`、`setTheme`、`getTheme`、`getResolvedTheme`、`subscribeTheme`、`useIsDarkTheme` 保留。
`useIsDarkTheme` 订阅完整快照，因此同 mode 只换 preset 也会重渲染；组件自己的 memo/effect 仍须加入 preset 依赖。

```ts
getTokenValue(name, resolvedMode, preset?)
getCategoricalPalette(resolvedMode, count?, preset?)
buildAntdTheme(isDark, preset?, appearance?)
```

静态 getter 省略 preset 时读取全局当前 preset；局部 canvas/chart 要显式传 scope preset。AntD appearance 参数支持解析后的 reducedMotion。

`ScopedTheme` 支持 `theme`（旧 light/dark 接口）、preset、density、textScale、motion。
`useThemeScope(): { container: HTMLElement | null; appearance: Readonly<ResolvedAppearance> } | null` 供 Portal wrapper 挂载。
局部 motion=system 会独立跟随系统，即使根偏好是 reduced。

根 DOM 与 scoped DOM 同步 data-theme、data-preset、data-density、data-text-scale、data-motion；data-motion 是解析后的 reduced/system。
控件合同为 `--control-height-sm` / `--control-height` / `--control-height-lg`、`--control-padding-x-sm` / `--control-padding-x` / `--control-padding-x-lg`、`--control-gap`。
控件高度与 Tailwind text-xs…9xl 均已消费 `--text-scale`，调用方不要再重复乘系数。根 `html[data-preset]` 恢复 `font-size:100%`，覆盖 vendor reset 的 14px 并尊重浏览器默认字号；textScale=1.25 时 text-sm=17.5px、comfortable control=50px。

## 实际验证

以下均 exit 0：

- `npm run build:themes`：八套 CSS/JS，明暗各 2968 个声明，生成无 validation error。
- `npm run test:design-tokens`：40/40；完整 token 覆盖、八套 CSS/JS/源值一致、文字/焦点/主要操作对比度、静态 getter 切 preset、vendor 缩放/密度/减少动效。
- `npx vitest run src/themes/__tests__/appearance.test.ts src/themes/__tests__/appearance-store-migration.test.ts src/themes/__tests__/scoped-appearance.test.tsx src/components/ui/__tests__/theme-subscriptions.test.tsx`：17/17；系统→手动→系统、重复 init/cleanup、旧配置迁移、storage denied、跨标签页、局部 Portal/不重挂/独立 motion。新增 fresh-module 回归通过真实 UI store 的 v1→v2 hydration，再执行 initTheme，证明仅 ui-storage 的 dark 不被重置为 system，且随后持久化到 appearance。
- `npx tsx --tsconfig tsconfig.app.json --test src/themes/__tests__/appearance-bootstrap.test.ts src/themes/__tests__/tailwind-migration.test.ts`：14/14；首屏与 runtime 合同、原生 Tailwind 消费和样式层。
- `npx tsx --tsconfig tsconfig.app.json --test src/themes/__tests__/application-style-provider.test.tsx`：6/6；原 vendor layer/selection/action 合同。
- 本任务源码与测试的 targeted ESLint、`npm run verify:test-inventory`、`npm run lint:file-size`、`git diff --check` 均通过。

主 agent 一次集成类型预检指出测试 EventTarget override 修饰符缺失；已修正并重跑对应 Vitest/ESLint。owner 未独立运行全量 build/test。
早先误把 node:test 的 application-style-provider 测试交给 Vitest，因第三方 ESM 路径解析失败；随后正确 tsx lane 6/6 通过，不构成产品失败。

## 待集成与兼容边界

- 根 Provider、UI store、设置页、全局 Portal wrappers 和图表 memo 依赖由主 agent owner 维护，本文件不把其集成/browser 验收记为本 owner 已完成。
- 保留历史组件 token key 的迁移映射；语义反馈色、categorical 数据色保持独立角色，不随 preset 改变语义。遗留显式 neutral 色值、特殊组件 tint/gradient 仍需按消费者逐步收口。
- 分类色仍是既有明暗两套 OKLCH 安全色阶；preset 改变轴线/表面等语义值，不改变分类身份。
- `theme-generator.ts` 从基线 2039 行降到 1998 行，主 agent 统一收紧 file-size 基线。
- 本 owner 未 git add/commit/push。共享 checkout 的其他改动未纳入本交接验证。

主 agent 浏览器复核发现 AntD reset 将 html 改成 14px，已补 `html[data-preset]{font-size:100%}` 与一项 CSS 根字号回归，bootstrap + Tailwind 合计 14/14 通过。主 agent 继续统一记录真实浏览器计算值。

## 产物体积收口

主 agent 完整 Web build 类型通过后，JS raw 预算超额 151,923 字节。本 owner 仅改 `theme-artifact-generator.ts` 与再生成的 `token-values.generated.ts`：复用已存在的 defaultTokens 名称表，共享 507 个值和跨八主题的 337 种组合；相邻字符串只保存共同前缀长度与字面后缀。模块同步构建全部冻结对象，无新增依赖、网络或异步读取。导出类型、静态 getter 和完整 CSS 均保持一致。

相同 Rolldown minified 模块图（均保留原本已进入产物的 defaultTokens / cssVariables）实测从 194,748 降至 38,814 字节，净省 155,934 字节；生成 TS 从 195,027 降至 18,194 字节。当前旧 dist 总额据此投影为 27,395,989 字节，低于 27,400,000 预算 4,011 字节；这是定向图测量，完整 Web 重建与门禁结果仍由主 agent 记录。

本次 `npm run build:themes` 连续生成两次，light.css / dark.css / token-values.generated.ts / tailwind.css 哈希一致；`npm run test:design-tokens` 40/40、两个文件 targeted ESLint 与 `git diff --check` 均 exit 0。八套各 742 个 token 的 CSS/JS/源值严格相等，未修改 UI 或预算。
