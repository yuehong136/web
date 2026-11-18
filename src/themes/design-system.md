# 色彩令牌 2.0

六套配色方案和一套由品牌色生成的自定义方案共用同一份语义令牌。组件只引用语义角色，颜色由种子在构建期生成，并在每种组合下通过 WCAG 2.2 AA 合同测试。用法细则见 [开发指南](./development-guide.md)，旧名迁移见 [迁移指南](./migration-guide.md)。

## 四层结构

| 层          | 源文件               | 内容                                                                                                              |
| ----------- | -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| L0 种子     | `color-schemes.ts`   | 每套方案 5 个输入：中性色调 `{h, c}`、强调色、AI 渐变三色相、主操作风格（墨色或强调色）、浅色工作面（纯白或暖纸） |
| L1 色阶     | `color-scales.ts`    | gray / accent / ai / success / warning / danger / info 各 12 阶 OKLCH，CSS 变量 `--scale-<名>-<阶>`               |
| L2 语义角色 | `semantic-tokens.ts` | 128 个角色，CSS 变量 `--color-<角色>`，Tailwind 工具类 `bg-surface`、`text-fg`、`border-line` …                   |
| L3 组件别名 | 按需，目前没有       | 组件直接用角色；确有偏离时才建别名，值只能是 `var(--color-<角色>)`。2.0 之前的 443 个组件令牌已全部收敛并删除     |

生成物：`light.css`、`dark.css`（每套方案一个基础块，加高对比与主操作覆盖块）、`token-values.generated.ts`（给 canvas、图表、Monaco 的 hex / rgba 值）、`tailwind-tokens-*.generated.css`（`@theme inline` 映射）。修改任何种子或角色后运行 `npm run build:themes` 并提交生成物。

### 色阶阶号

沿用 Radix Colors：1–2 应用背景，3–5 组件底（静止 / 悬停 / 按下），6–8 边框，9–10 实色，11–12 文字。第 11 阶对第 4 阶求解（标准 ≥ 4.6:1，高对比 ≥ 7:1），所以强调色文字在浅底和悬停底上都达标；实色上的文字（`*-on-solid`）也是求解出来的，色相 55°–125° 的强调色（琥珀、黄）自动用深色字。

## 六套方案

| 方案             | 中性 h / c  | 强调 h / c | 主操作 | 适用                                           |
| ---------------- | ----------- | ---------- | ------ | ---------------------------------------------- |
| `ink` 墨（默认） | 265 / 0.004 | 264 / 0.20 | 墨色   | 日常工作；强调色只出现在选中、焦点、链接与引用 |
| `mist` 雾蓝      | 240 / 0.011 | 245 / 0.13 | 强调色 | 延续 2.0 之前的默认风格                        |
| `celadon` 青瓷   | 185 / 0.007 | 190 / 0.10 | 强调色 | 检索与阅读                                     |
| `clay` 陶土      | 70 / 0.010  | 48 / 0.13  | 墨色   | 写作与研究；暖纸工作面，长回答用衬线字体       |
| `iris` 鸢尾      | 290 / 0.008 | 290 / 0.19 | 强调色 | Agent 编排与创作                               |
| `amber` 琥珀     | 250 / 0.006 | 72 / 0.155 | 墨色   | 运维、数据与开发；实色用深色字                 |

与强调色相近的状态色按方案挪开：陶土的 danger 移到 20°，琥珀的 warning 移到 52°。状态色仍不是唯一信号，配图标或文字。

### 自定义方案（品牌色）

`custom` 方案从用户选的品牌色（OKLCH 色相与彩度）和底色色调生成，生成器在浏览器里运行，产出与内置方案相同的全部角色、高对比与主操作变体。CSS 以 constructable stylesheet 安装（严格 CSP 允许），并缓存给 `public/theme-init.js` 在首帧前装上；`getTokenValue(…, 'custom')` 返回生成值。与品牌色相差不足 25° 的状态色相自动挪开 30°。种子保存在本机的 `appearance.custom`，彩度 0.04–0.22、底色色调 0–0.03，超出范围会被夹回到测试覆盖的区间。

2.0 之前的偏好自动迁移：`studio`、`graphite` → `ink`，`paper` → `clay`，`ocean` → `celadon`（`appearance.ts` 与 `public/theme-init.js` 同一规则）。

### 外观维度

`appearance` 偏好在原有的 `preset`、`mode`、`density`、`textScale`、`motion` 之外新增：

- `contrast`：`standard` | `high`。高对比加深次要文字、描边、焦点环与语法色，生成器直接产出，同样经过合同测试。
- `action`：`scheme` | `ink` | `accent`。主按钮与发送按钮用墨色还是强调色，`scheme` 跟随方案默认。

根节点与 `ScopedTheme` 容器同时写 `data-preset`、`data-theme`、`data-contrast`、`data-action`。只带 `data-theme` 的门户内容（菜单、对话框）通过后代选择器继承最近的方案。

## 语义角色

### 表面 · 填充 · 文字 · 线

| 角色                                                           | 用途                                                       |
| -------------------------------------------------------------- | ---------------------------------------------------------- |
| `canvas`                                                       | 应用底色：导航轨、侧栏、工作卡外沿                         |
| `surface`                                                      | 主工作面：对话、列表、编辑器、输入框                       |
| `raised` / `raised-hover`                                      | 浮起的卡片、画布节点、证据卡及其悬停                       |
| `overlay`                                                      | 菜单、Popover、对话框                                      |
| `sunken`                                                       | 代码块、工具调用、分段控件底                               |
| `inverse` · `fg-inverse`                                       | Tooltip、Toast                                             |
| `scrim`                                                        | 模态遮罩                                                   |
| `fill-hover` / `fill-pressed` / `fill-selected` / `fill-muted` | 半透明交互底，可叠在任何表面上；中性选中用 `fill-selected` |
| `fg` / `fg-muted` / `fg-subtle` / `fg-disabled`                | 正文、次要说明、元信息与占位符（仍 ≥ 4.5:1）、禁用         |
| `line-subtle` / `line` / `line-strong` / `line-focus`          | 分隔线、控件描边、强调描边、键盘焦点环（≥ 3:1）            |
| `knob`                                                         | 开关与滑块的拨钮                                           |
| `action-bg` / `action-bg-hover` / `action-fg`                  | 主按钮、发送按钮                                           |

浅色方案的工作面是纯白（陶土为暖纸），深色方案逐级提亮；侧栏所在的 `canvas` 始终退后于工作卡。深色阴影以顶部高光代替投影（`--elevation-*`，按方案中性色调着色）。

### 意图 × 角色

7 个意图共用 7 个后缀，共 49 个令牌：

- 意图：`accent`、`ai`、`neutral`、`success`、`warning`、`danger`、`info`。
- 后缀：`-solid`、`-solid-hover`、`-on-solid`、`-fg`、`-soft`、`-soft-hover`、`-line`。

| 用法             | 组合                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| 文字、图标、指示 | `text-danger-fg`                                                       |
| 浅色块           | `bg-danger-soft border-danger-line text-danger-fg`，悬停 `-soft-hover` |
| 实色块           | `bg-danger-solid text-danger-on-solid hover:bg-danger-solid-hover`     |

- 不要给 `*-fg` 配白字（深色主题下它是浅色）；
- 不要给角色加透明度来造浅色（`bg-danger-solid/10`），浅色用 `-soft`。

强调色的角色分工：

- `accent-solid`：选中的控件；
- `accent-soft` + `accent-fg`：选中行、选中标签；
- `accent-fg`：链接与强调文字；
- 主操作走 `action-*`，两者可以是同一色相，但语义不混用。

### AI 内容

| 角色                                                                | 用途                                                                                                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ai-from` / `ai-via` / `ai-to` / `ai-glow`                          | AI 时刻的渐变与光晕，只经由 `bg-ai-tide`、`ai-glow`、`ai-halo` 使用（输入框聚焦、思考与检索中、运行中的 Agent、首页问候） |
| `ai-*`（意图矩阵）                                                  | 运行中的任务、深度研究开关、AI 生成标记                                                                                   |
| `reasoning-fg` / `reasoning-line`                                   | 思考过程正文与引线                                                                                                        |
| `tool-bg` / `tool-line`                                             | 工具调用卡                                                                                                                |
| `citation-bg` / `citation-fg` / `citation-bg-hover`                 | 引用角标                                                                                                                  |
| `highlight-bg` / `highlight-fg`                                     | 检索命中（`<em>` / `<mark>`）                                                                                             |
| `caret`                                                             | 流式输出光标                                                                                                              |
| `run-queued` / `-running` / `-succeeded` / `-failed` / `-cancelled` | 运行状态点、连线与进度；`-cancelled` 配删除线                                                                             |

AI 感靠动效与结构（shimmer、可折叠思考、引用芯片）表达，不给普通内容上色；普通按钮、卡片、标签不使用 AI 渐变（`design-guard/no-raw-visual-values` 拦截不含 `ai-from/via/to` 的渐变）。

### 代码 · 数据可视化 · 身份

- `code-bg`、`code-fg`、`syntax-keyword`（随强调色）、`syntax-function`、`syntax-type`、`syntax-string`、`syntax-number`、`syntax-comment`：Shiki 使用 CSS 变量主题直接读取，Monaco 主题由 `getTokenValue` 生成。
- `viz-1..10`：分类色，身份稳定，不随方案换色相（知识图谱实体、思维导图层级、多序列图表），对表面 ≥ 3:1；`viz-axis` 是图表基线。分类色不能单独承载语义，配合标签或文案。
- `avatar-1..8-bg` / `-fg`：头像、知识库、文件类型、模型供应商的身份色，同一实体按 id 稳定取色，字色对底色 ≥ 4.6:1。文件类型映射见 `identity.ts`。

## 合同测试

`npm run test:design-tokens` 覆盖：

- 每套方案 × 明暗 × 对比度 × 主操作风格下，文字对五种表面、意图前景对 `-soft` / `-soft-hover` / 表面、`-on-solid` 对实色及悬停、引用、高亮、语法色、身份色达到 4.5:1；焦点环、运行状态、分类色达到 3:1；品牌色方案对 24 个色相 × 3 档彩度 × 2 档底色色调同样校验（`semantic-contract.test.ts`）；
- 每个方案基础块声明全部角色、品牌种子的取值范围、偏好迁移规则（`appearance-presets.test.ts`）；
- 提交的 CSS / JS 与生成器一致（`categorical-palette.test.ts`）；
- 源码里的工具类与 `var(--color-*)` 只引用已定义的令牌，意图矩阵以外的每个角色都有消费方（`token-closure.test.ts`）。

门槛按 WCAG 2.2 AA 计算。APCA 目前不在 WCAG 3 草案中，只作参考。
