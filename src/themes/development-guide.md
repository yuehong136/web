# 设计令牌开发指南

体系与角色清单见 [色彩令牌 2.0](./design-system.md)。本文只讲日常怎么用、怎么改。业务代码的强制约束以 [Frontend · UI](../../docs/agent-guidance/frontend.md#ui) 为准，这里不再维护第二份清单。

## 在组件里用颜色

Tailwind 工具类直接写语义角色，前缀即类别：

```tsx
<section className="border border-line-subtle bg-surface text-fg">
  <p className="text-fg-muted">次要说明</p>
  <button className="bg-action-bg text-action-fg hover:bg-action-bg-hover">
    保存
  </button>
  <span className="border border-danger-line bg-danger-soft text-danger-fg">
    解析失败
  </span>
  <li className="hover:bg-fill-hover aria-selected:bg-accent-soft">…</li>
</section>
```

- 交互底优先用半透明的 `fill-*`，它们在任何表面上都成立；
- 选中态用 `accent-soft` + `accent-fg`，中性选中用 `fill-selected`；
- 焦点环一律 `ring-line-focus` / `outline-line-focus`；
- 透明度修饰（`bg-accent-solid/15`）编译为 `color-mix()`，可以用于装饰，但浅色块请用 `-soft` 角色，它的对比度经过测试；
- 独立 CSS 文件用 `var(--color-<角色>)`，需要 `@apply` 时 `@reference` 到 `src/index.css`。

不要写 Tailwind 原色板、任意色值或 `dark:` 前缀（`design-guard/no-raw-visual-values` 会拦截），也不要在页面里按方案写分支。所有方案、明暗、对比度变化都由同一组角色承接。

## 在 JavaScript 里取色（canvas、图表、Monaco）

```ts
import { getTokenValue, getCategoricalPalette } from '@/lib/design-tokens'
import { useResolvedAppearance } from '@/themes'

const { preset, resolvedMode } = useResolvedAppearance()
const text = getTokenValue('fg', resolvedMode, preset) // hex
const series = getCategoricalPalette(resolvedMode, 10, preset)
```

值来自生成的 `token-values.generated.ts`（hex / rgba，图表库与 canvas 都能解析）。缓存或 effect 必须同时依赖 `preset` 与 `resolvedMode`。JS 取值是方案的标准对比度、默认主操作值；需要跟随高对比或主操作覆盖的表面，请用 CSS 变量。`readCssVar` 只留给 scoped-theme / 嵌入子树。

## 修改颜色

| 想改什么                      | 改哪里                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 某套方案的色调、强调色、AI 色 | `color-schemes.ts` 的种子                                                                                                |
| 新增一套方案                  | `color-schemes.ts` 增加种子；`appearance` 与 `public/theme-init.js` 的方案列表；中英文案                                 |
| 阶的明度曲线或求解目标        | `color-scales.ts`                                                                                                        |
| 某个角色取哪一阶              | `semantic-tokens.ts`                                                                                                     |
| 新增角色                      | `semantic-tokens.ts` 的 `SEMANTIC_TOKENS` 与赋值；和第一个消费方一起提交，`token-closure` 拒绝零引用角色（意图矩阵除外） |

改完运行：

```bash
npm run build:themes        # 重新生成 CSS / JS / Tailwind 映射，一起提交
npm run test:design-tokens  # 合同测试：所有方案 × 明暗 × 对比度 × 主操作
```

合同测试失败时调种子或求解目标，不要放宽阈值。

## 自定义方案

`setAppearance({ preset: 'custom', custom: { accentHue, accentChroma, neutralChroma } })` 选用品牌色方案。`appearance.ts` 在选中时调用 `installCustomScheme`，外观设置页挂载时也会装上，以便预览卡显示。生成规则见 `customSchemeSeed`（`color-schemes.ts`）；改动后 `semantic-contract.test.ts` 的品牌色网格必须仍然全部通过。

## 作用域与嵌入

`ScopedTheme` 可以覆盖 `theme`、`preset`、`density`、`textScale`、`motion`、`contrast`、`action`，未覆盖的维度继承父级（品牌种子全局只有一份，作用域里选 `custom` 时用的是同一个品牌色）。门户内容用 `usePortalContainer()` 挂到作用域容器里。嵌入组件（Agent 分享挂件）在 `pages/agent/share/widget-theme.css` 里把宿主颜色赋给语义角色，不新增令牌名。

## 第三方样式

- `@tailwindcss/forms` 给原生文本框、文本域、下拉框和选择控件的白底、灰边、灰色占位文字和 blue-600 焦点环，由 `styles/selection-controls.css` 在 base 层改为语义角色；组件自己的工具类仍然优先。
- 第三方 CSS 如果也用 `--color-` 前缀（例如 Markdown 编辑器自带的 GitHub Primer 变量），在它的局部样式里桥接到语义角色，同名的角色写 `inherit`（见 `pages/studio/create-app/components/editor.css`）。`token-closure.test.ts` 会检查这类冲突是否都已处理。
- 文档内容本身（PDF 页、PPT 幻灯片、Excel 表格页）保持纸面原色，外围的查看器界面走令牌。纸面上的标记（PDF 高亮、文字选区、框选）在两种模式下都落在白纸上，所以用 `accent-solid` 的半透明混色，不用 `accent-soft`、`highlight-bg` 这类暗色模式下变深的表面角色（见 `pdf-preview.css`）。
- React Flow 自己绘制的颜色都先读 `--xy-<名称>`、再回退到 `--xy-<名称>-default`，在画布的 `overrides.css` 里给 `--xy-*` 赋语义角色即可（框选、拖出的连线已接入）。

## 外观偏好 API

```ts
setAppearance({ preset: 'clay', contrast: 'high' }) // 只合并提供的维度
getAppearance() // Readonly<Appearance>；值不变时引用不变
useAppearance()
useResolvedAppearance() // 额外给出 resolvedMode 与 reducedMotion
```

`appearance` 是完整偏好的持久化来源；`theme` 键保留模式镜像以兼容旧入口。主题和字号切换不得给应用根节点加 `key` 或重挂 Provider。
