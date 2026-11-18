# 从旧令牌迁到语义角色

2.0 之前的 443 个令牌名（`text-*`、`background-*`、`border-*`、`state-*`、`status-*`、`surface-*`、`chat-*`、`components-*`、`data-viz-categorical-*`）已由一次 codemod 全部改成语义角色，随后别名删除，旧名不再生成。还停在 2.0 之前的分支合并时，按下表改名；`token-closure.test.ts` 会把残留的旧名报为未定义令牌。

## 常用对照

| 旧名                                                                        | 角色                                                               |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `text-primary`                                                              | `fg`                                                               |
| `text-secondary`                                                            | `fg-muted`                                                         |
| `text-tertiary` · `text-muted` · `text-caption`                             | `fg-subtle`                                                        |
| `text-disabled`                                                             | `fg-disabled`                                                      |
| `text-accent` · `state-selected-text`                                       | `accent-fg`                                                        |
| `text-inverted`                                                             | `fg-inverse`                                                       |
| `background-surface` · `surface-primary` · `background-body`                | `surface`                                                          |
| `background-default` · `surface-tertiary` · `components-app-shell-bg`       | `canvas`                                                           |
| `background-subtle` · `surface-secondary`                                   | `sunken`                                                           |
| `background-overlay`                                                        | `scrim`                                                            |
| `components-card-bg`                                                        | `raised`                                                           |
| `components-dropdown-bg` · `components-popover-bg` · `components-dialog-bg` | `overlay`                                                          |
| `border-default` · `border-primary`                                         | `line`                                                             |
| `border-subtle`                                                             | `line-subtle`                                                      |
| `border-strong` · `border-hover`                                            | `line-strong`                                                      |
| `state-focus` · `border-focus` · `border-accent`                            | `line-focus`                                                       |
| `state-hover`                                                               | `fill-hover`                                                       |
| `state-active`                                                              | `fill-pressed`                                                     |
| `state-selected`                                                            | `accent-solid`                                                     |
| `state-selected-bg` · `state-focus-10`                                      | `accent-soft`                                                      |
| `components-sidebar-item-bg-active`                                         | `fill-selected`                                                    |
| `components-button-primary-*`                                               | `action-*`                                                         |
| `status-<意图>` / `-subtle` / `-border` / `-solid` …                        | `<意图>-fg` / `-soft` / `-line` / `-solid` …（`error` → `danger`） |
| `components-task-status-running-*`                                          | `ai-*`、`run-running`                                              |
| `components-task-status-cancelled-*`                                        | `neutral-*`、`run-cancelled`                                       |
| `components-ai-from/via/to/glow`                                            | `ai-from/via/to/glow`                                              |
| `components-avatar-N-bg` / `-text`                                          | `avatar-N-bg` / `-fg`                                              |
| `components-file-<类型>-*`                                                  | 身份色 `avatar-N-*`（见 `identity.ts`）                            |
| `data-viz-categorical-N`                                                    | `viz-N`                                                            |

完整映射见引入 2.0 的提交里的 `legacy-tokens.ts`（之后已删除）。几处语义有意调整：

- 取消态从琥珀改为中性灰加删除线；
- 运行中从选中色改为 AI 色；
- 分页当前页从主操作实色改为中性选中；
- 菜单项文字从次要色改为正文色；
- 行内代码从红字改为正文色配 `fill-muted` 底。

## 配色方案改名

外观偏好里的旧方案自动迁移：`studio`、`graphite` → `ink`，`paper` → `clay`，`ocean` → `celadon`，`mist` 保留。
