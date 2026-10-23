# 前端重构交付与验收

2026-10-24。本轮在 `codex/frontend-modernization` 本地完成；起点 `f776737` 的既有提交保留，未推送、未部署。

实现提交：`0adad9cc67201c5150f27cea89510c880895bf5f`。范围依据可读的引用会话与当前源码；原会话报告/ZIP 未通过接口返回，因此不宣称附件中原始 28 项任务或 44 项标准已经逐项完成。

## 实际交付

- **外观与偏好**：Studio / Paper / Graphite / Ocean 四套明暗配色；模式、密度、文字缩放、减少动效分别持久化，支持系统偏好。旧 UI store 主题迁移保留；完整外观快照驱动 Radix / Ant / 图表 / 代码展示，局部预览的 Portal 留在来源作用域。新增真实外观设置页，切换保留挂载子树和草稿。
- **语言**：保留 i18next，改为语言 × namespace 动态加载；明确产品偏好与 route/share/widget 临时语言的归属，异步失败恢复、最后请求生效、入口卸载恢复。补齐中英 catalog，新增 UI 文案与 key/插值/复数/空译文质量检查接入 CI，处理大型生成文件对检查器的影响。
- **共享组件与壳层**：重做 Button / Input / Textarea / ThemeSwitcher，新增 PreferenceChoiceGroup、ContextPanel、AssetListControls；导航支持宽屏停靠、中屏覆盖、手机抽屉和焦点归还。创建/导入五个入口采用原生 modal，关联标题/描述；Studio 两步创建关闭后归还稳定触发器。
- **聊天与运行**：Home / Studio 复用 Composer、Transcript、MessageParts、RunTimeline；删除重复展示与装饰，保留领域请求归属、草稿、输入法与阅读跟随。普通请求组合 caller signal / timeout；结构化流必须有真实终帧才完成，MCP / AI Fill 保留未确认内容，工具 0 / false 有效。
- **领域交互**：Studio / Agents 的真实分页、筛选、列表/网格、菜单和失败重试；Search 的输入、结果、来源过滤、设置与思维导图面板；设置事务隔离应用/租户和晚到响应，已保存配置与新草稿分开。上传按实际确认逐文件反馈，保留失败项重试；默认模型改为显式保存，false / 缺失 ack 不视作成功。
- **可靠性收尾**：分享 401 不清除产品会话；模型变更同步失效可用列表；图表绘制、resize、命令与销毁按实例归属串行处理，快速关闭不再留下迟到绘制错误，有效失败可重试。大文件基线收紧四处，未放宽文件或体积预算。

细分接口及历史专项结果见 [外观](appearance-handoff.md)、[语言](localization-handoff.md)、[运行](run-semantics-handoff.md)、[导航](shell-handoff.md)、[聊天](chat-home-handoff.md)、[Studio/Agents](studio-agent-handoff.md)、[上传/默认模型](domains-handoff.md)。[独立审查](search-review.md) 记录四类缺陷、五个由失败转为通过的独立场景；本文件中的最终门禁优先于交接时的历史计数。

## 最终自动化验证

所有以下命令实际执行并查看结果；完整 CI 以最终修复后的源码运行。

| 检查                                                                  | 结果                                                                                                 |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `npm run test:ci`                                                     | exit 0；260 文件，Node 854 + Vitest 788 + Desktop 81 + tooling 19，共 **1742 测试通过**              |
| `npm run lint`                                                        | exit 0；0 error / 1300 既有及遗留 warnings，未把 warn 说成清零                                       |
| `npm run lint:typed`                                                  | exit 0；0 error / 84 warnings                                                                        |
| `npm run typecheck:agent-strict`、`desktop:typecheck`、`lint:desktop` | 均 exit 0                                                                                            |
| `npm run build`                                                       | exit 0；完整 Web 类型检查与 Vite 生产构建，保留大 chunk 提醒                                         |
| `npm run check:bundle-size`                                           | exit 0；729 JS chunks，总量 27,398,171 / 27,400,000 B；入口 gzip 30,404 B，最大 chunk gzip 743,692 B |
| `npm run lint:file-size` / `verify:test-inventory`                    | exit 0；22 在册债务文件未增长，全部测试归属唯一正式 lane                                             |
| `npm run lint:i18n-agent`                                             | exit 0；新增问题 0；330 是起点的历史 catalog 基线计数，并非当前剩余问题                              |
| `node scripts/check-agent-i18n-hardcoded.mjs --all --catalogs-only`   | exit 0；当前 catalog 全量问题 0                                                                      |
| `npm run test:client-platform`                                        | exit 0；11 文件 / 44 测试；完整 CI 中也覆盖这些文件                                                  |
| `build:themes` 与 `test:design-tokens`                                | 重复生成 light/dark/TS/Tailwind 哈希一致；40 测试通过，完整 CI 再覆盖                                |
| `desktop:build` → `desktop:stage` → `desktop:verify:stage`            | 均 exit 0；最终 Web 产物重新 stage，1165 文件通过 allowlist/manifest 校验                            |
| Prettier / diff / 路径检查                                            | 按本轮文件执行，提交前再次读回                                                                       |

体积预算仅余 **1829 B**，后续功能需先减重；本轮通过共享 token 键表、值字典与主题组合编码减少约 156 KB，未调整预算。产物总 JS 包含所有按需语言、图表和文档预览 chunk，不能当作首页下载量。

最终源码清单包含 2318 文件，SHA-256：`8e1ed60aef9c2bbf79cafcc16ed97627eab06b5840b0a9f2ca2f61ecb8257222`。本地命令日志与逐文件清单保存在忽略目录 `output/playwright/`；构建、测试与交付前检查清单无漂移。后续仅编辑交付文档与拷贝截图。

## 浏览器验收

使用独立 Chrome 会话与本机 5174 服务，HTTP / SSE 由固定 fixture 接管，不使用真实凭证或付费模型。实际点击、键盘、截图及 DOM/存储读回分别验证：

- 四预设 × 明暗共八组英文桌面截图；密度、1.25 文字缩放（小节标题实测 17.5px）、减少动效、刷新恢复；系统/手动模式与系统偏好切换；390×844 中文手机无横向溢出。
- Home 中英往返与明暗切换后仍为同一 textarea，中文草稿保留；移动导航 Enter 打开、Escape 关闭后回到打开按钮。
- Search 通过明确 `data:true` 完成 fixture；来源详情保留 0% 相关度并正确归还焦点；设置面板、真实绘制的思维导图与三次快速开关无 pageerror；手机无横向溢出。
- Studio 项目类型 → 创建 App 的两步流程：原生 `:modal` 生效、初始焦点在内容内，Tab 不聚焦背景控件；切到浏览器工具栏时 `document.hasFocus()=false`，不误当作背景焦点。Escape 关闭后回到原 New project 按钮；列表/选择与 Agents 页面实际渲染。
- 默认模型选择阶段没有写请求；false ack 后保留草稿，显式重试的 true ack 才保存；上传两个原生文件、只返回一个匹配确认时，面板保留未确认文件和重试入口，并保持打开。

代表性截图随文档保存，中英与明暗用于本地评审：

| 页面            | 截图                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 外观设置        | [浅色](screenshots/appearance-studio-light-en.png) · [深色](screenshots/appearance-studio-dark-en.png)                        |
| Home            | [中文浅色桌面](screenshots/home-studio-light-zh-desktop.png) · [英文深色手机](screenshots/home-studio-dark-en-mobile.png)     |
| Search          | [来源详情](screenshots/search-source-studio-dark-en.png) · [思维导图](screenshots/search-map-studio-dark-en.png)              |
| Studio / Agents | [创建 App](screenshots/studio-create-studio-dark-en.png) · [Agents](screenshots/agents-studio-dark-en-desktop.png)            |
| 上传 / 模型     | [部分确认](screenshots/upload-partial-studio-dark-en.png) · [失败保留选择](screenshots/models-save-failed-studio-dark-en.png) |

## 验证边界

本轮没有执行真实后端/存储/解析 worker/模型 provider 联调、付费探测、远端 CI、生产切换、原生输入法实机输入、手机真实软键盘或 Windows 安装包/签名 E2E。JSDOM 输入法和 VisualViewport 回归、受控 SSE、Desktop staging 分别属于对应证据层。

停止接收与本地 abort 不等同于服务端取消。上传仍通过忽略旧 session 响应处理归属，没有取消已经发出的 HTTP 或服务端处理。完整共享 Chat 向所有 MCP / Agent runtime 的迁移、全仓 a11y warning 棘轮和黄金 E2E 继续保留在唯一 [工程路线图](../engineering-modernization-roadmap.md)；ARCH-7、ARCH-8、ENG-3 均保持进行中。
