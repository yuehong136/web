# 第二轮 AI 工作区交付与验收

2026-10-24，Asia/Shanghai。输入为用户提供的第二轮增量研究报告及「调研改造前端」会话。实施基线为 `2da13553338fd8862b4b197ea16ff8192e882f27`，初始工作区干净；分支为 `codex/ai-workspace-round2`。本页记录本地代码、实验与实际验收，未推送或部署。

## 交付

最终产品与验证工具提交为 `091d1f4418fac283080d93a0f76dca9aca1f90ed`；后续仅提交本页、审查/测量记录、截图及路线图。最终门禁的输入清单覆盖 2,376 个源码/配置/验证工具文件，SHA-256 为 `ddcd8b60b99968699d10855153657a6a43fe4f20e3f7f8291293e34624acf5ad`。

精确字节、测试计数、浏览器阶段和 staging 源码绑定见[机器可读验收摘要](evidence/round2-verification.json)。门禁前后重新计算输入散列，结果相同。

| 范围       | 已实现行为                                                                                                                                                            | 实现入口                                                                                                                                                                 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 请求身份   | JSON、响应头与领域 body reader 均检查请求 epoch；旧 401、旧登录响应或旧 body 不修改新身份；当前身份 401 仍处理                                                        | [APIClient](../../src/api/client.ts)                                                                                                                                     |
| 运行结局   | Explore 每条 assistant 消息记录真实终态；EOF 是 interrupted，本地停止与远端取消分开，失败保留正文，首个终态胜出；未知历史不显示完成                                   | [Explore send](../../src/pages/explore/hooks/use-explore-send.ts)、[终态映射](../../src/pages/explore/hooks/explore-stream.ts)                                           |
| 提交上下文 | Home 在请求前冻结真实应用继承配置或本轮 MCP 选择，user/assistant 共用快照；仅显示 selected/submitted，不显示“模型已使用”；身份变化同步撤销旧请求                      | [上下文快照](../../src/pages/home/utils/home-context.ts)、[scope](../../src/pages/home/hooks/use-home-scope.ts)                                                          |
| 工作区     | Home/Explore/Search 共用稳定主区与资源槽；宽屏 dock 可继续输入，实际容器不足时使用 Sheet；保留草稿节点、所选资源、tab 阅读位置、调整后的宽度和最新入口焦点            | [AiWorkspace](../../src/components/layout/ai-workspace.tsx)、[ChatWorkspace](../../src/components/chat/chat-workspace.tsx)                                               |
| 证据       | 消息内引用和 Sources 进入同一详情内容；合法 0 分保留，未知/非法分数不显示为 0；原文能力缺失有说明，技术字段默认折叠                                                   | [引用详情](../../src/components/chat/reference-detail-panel.tsx)、[引用入口](../../src/components/chat/ReferenceMarker.tsx)                                              |
| 成果       | 现有 artifact endpoint 的鉴权只读预览与下载；稳定消息内 ID、未知/准备/就绪/权限/失效/失败状态；HTML 清洗、无脚本 sandbox/CSP；关闭或 scope 变化 abort 并释放 blob URL | [成果卡片](../../src/components/chat/artifact-card.tsx)、[资源生命周期](../../src/components/chat/use-artifact-resource.ts)                                              |
| 导航       | Home 未选应用时隐藏空二级栏；绑定应用后显示真实最近会话和已有会话入口，不创建伪任务中心                                                                               | [导航可用性](../../src/components/layout/workbench-navigation.tsx)、[最近会话](../../src/pages/home/components/recent-app-conversations.tsx)                             |
| 主题与语言 | 沿用四预设和动态 i18next；移除外网字体依赖，Ant 字体/交互状态映射语义 token；窄范围 typed keys、必需插值与复数合同由现有 catalog AST 生成，保留同一运行时             | [主题适配](../../src/lib/antd-theme.ts)、[typed hook](../../src/locales/use-typed-translation.ts)、[生成器](../../scripts/generate-i18n-types.mjs)                       |
| 高亮与质量 | 保留全部现有语言 loader，仅打包两套实际使用的高亮主题与 JS engine；增加生产浏览器 lane、路由闭包统计和 CI 证据上传；Desktop 严格验证后排除 Vite 分析清单              | [高亮 registry](../../src/components/chat/code-highlighter.ts)、[浏览器 runner](../../scripts/browser/verify-ai-workspace.mjs)、[staging](../../desktop/build/stage.mjs) |

显示合同只放在 [ai-workspace/contracts.ts](../../src/lib/ai-workspace/contracts.ts)，没有另建全局消息 store。Explore 从 1,690 行缩到 1,311 行并收紧唯一体积基线。跨路径 owner、串并行依赖及能力边界见[实施计划](round2-plan.md)。

成果卡片接入 Home/Explore 的共享回答链路；Search 摘要继续使用现有成果链接，本轮接入引用详情资源槽。Agent 冷加载截图发现的右侧栏固定中文也已单独移入中英资源，业务内容与运行状态语义保留。

## 实际验证

所有下列结果均为本机执行，不代表远端 CI。正式 inventory 为 277 个测试文件，四个 runner 无重复归属。

| 检查                                                    | 结果                                                                                                                |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `npm run test:ci`                                       | exit 0；source Node 907、Vitest 862、Desktop 93、tooling 21，共 1,883 项通过，无失败/跳过                           |
| `npm run build`                                         | exit 0，包含完整 Web 类型检查                                                                                       |
| `npm run lint`、`lint:typed`、`typecheck:agent-strict`  | exit 0；lint 保留存量 warning，不宣称 warning 清零                                                                  |
| `npm run lint:all`                                      | exit 0；0 error、1,319 warning，包含已有 a11y/类型提示；生成的本机浏览器证据不作为源码 lint 输入                    |
| `lint:file-size`、`lint:i18n-agent`、`check:i18n-types` | exit 0；没有新增 catalog/key/插值问题，文件体积未放宽                                                               |
| `npm run build:themes`                                  | exit 0；三份生成物无 diff，设计令牌验证通过                                                                         |
| `npm run check:bundle-size`、`profile:routes`           | exit 0，原预算不变；计量方法见下节                                                                                  |
| `npm run test:browser:production`                       | exit 0；Chrome 155.0.8059.85，14 条受控 HTTP/SSE 路径通过，pageErrors 为空                                          |
| Desktop lint/typecheck/build/stage/verify               | exit 0；staging 1,108 文件，生成清单未进入产物                                                                      |
| 依赖与格式                                              | `npm ls --depth=0`、`npm ci --dry-run --ignore-scripts`、本轮文件 Prettier、diff 检查通过；dry-run 不是重新安装验证 |

MCP 原 ownership 测试改为等待 Query/View 的可观察结果，保留旧响应污染断言，未 skip 或加入任意 sleep。独立连续八次进程运行通过，随后进入上面的全量测试。集成审查确认的四项缺陷已修复；生产浏览器另发现并修复“已打开面板切资源后仍归还旧入口焦点”。具体触发、红绿复现和证据强度见[独立审查](round2-review.md)。

本机原始日志与 trace 留在 ignored `output/playwright/round2/`；浏览器 runner 自行启动临时端口并在结束时关闭 browser/server。重放命令：

```bash
npm ci
npx playwright install chromium
npm run test:ci
npm run build
npm run check:bundle-size
npm run profile:routes
npm run test:browser:production
npm run desktop:build
npm run desktop:stage
npm run desktop:verify:stage
```

macOS 默认使用已安装的 Chrome；Linux 使用 Playwright Chromium，CI 的依赖安装包含 `--with-deps`。本地 Chrome 结果不能写成 Linux CI 已执行。`npm run test:browser` 的开发模式另写入 `browser-dev/`，避免覆盖生产证据；本轮 DEV 的 14 项检查同样通过。Vite 依赖扫描只从产品 `index.html` 进入，实验 HTML 不会让主开发服务解析未安装的候选依赖。

## 浏览器读回

生产产物使用受控账号与 HTTP/SSE fixture，未连接 provider。实际断言包含：同一 textarea 跨语言/主题与资源面板继续编辑；真实提交 payload 的快照；HTML sandbox/CSP 与本地下载；TS/Python 高亮及复制；资源 tab 不重发下载、保持预览/滚动；关闭及切会话释放 blob；403/404/500 不覆盖正文；引用按钮与最新 opener 的焦点恢复；窄屏 Sheet 焦点约束；Explore 正常完成、无终帧及错误帧。

IME 为模拟 composition 事件。缩放压力为 960px CSS viewport 加 1.25 reading scale，未伪称真实 200% 浏览器缩放或实体输入法验收。中英源内容保持原文。

| 生产构建样例                              | 截图                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------- |
| 明亮模式：答案、草稿和只读成果并排        | [Home light](screenshots/round2/home-artifact-light-en.png)          |
| 深色模式：相同报告与代码高亮              | [Home dark](screenshots/round2/home-artifact-html-dark-en.png)       |
| 宽屏：证据详情打开时继续输入，0% 分数保留 | [Search dock](screenshots/round2/search-evidence-dark-en.png)        |
| 窄屏：证据 Sheet 与可见焦点               | [Search mobile](screenshots/round2/search-evidence-mobile-en.png)    |
| 中文界面与原始资料内容                    | [Search 中文](screenshots/round2/search-mobile-zh.png)               |
| Agent 英文侧栏与真实 Begin 画布           | [Agent canvas](screenshots/round2/cold-agent.png)                    |
| EOF 保留正文并显示结果未确认              | [Explore interrupted](screenshots/round2/explore-interrupted-en.png) |

## 体积与性能分母

最终构建总 JS raw 为 24.32 MiB / 26.13 MiB，671 个 chunk；入口 gzip 31 KiB / 120 KiB，最大 chunk gzip 726 KiB / 739 KiB。没有提高原预算。这是分发产物的大小，不能写成首页下载量、首屏延迟或体验提升百分比。

[profile-route-bundles.mjs](../../scripts/profile-route-bundles.mjs) 从 Vite manifest 计算入口与目标路由静态 JS/CSS 闭包，逐文件 gzip 求和；引用的图片/字体另列，动态资源与实际传输由浏览器测量。

| 路由   | 静态 JS/CSS 文件 | raw bytes | gzip bytes |
| ------ | ---------------: | --------: | ---------: |
| Home   |               87 | 4,625,967 |  1,332,578 |
| Search |              108 | 6,162,535 |  1,776,492 |
| Agent  |              160 | 8,668,715 |  2,875,917 |

Home 当前为入口静态依赖，报告明确标记 `entryBound`。静态 URL 引用不等于浏览器已下载图片。工作区回归中的 `networks.Home` 包含语言/主题切换，`networks.Search` 来自已有会话导航，不能作为冷启动；独立新 context 的路由及首次打开增量另见[路由性能记录](round2-route-performance.md)。这些记录没有历史同条件对照，不作提速结论。

## 实验裁决

| 实验                                 | 实际结果                                                                                                                                                                  | 本轮决定                                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| E1 自有 catalog / json-render / A2UI | 三条真实 SDK/本地路径完成同题校验、action 白名单、未知类型回退、更新顺序与销毁检查；发现 json-render 原生 catalog 校验不足以替代 props 校验；缺真实 action 接收与授权合同 | 不接入生产，保留隔离源码、精确锁及[比较记录](round2-experiments.md)                             |
| E2 当前 XMarkdown / Streamdown       | 三轮、48 样本；候选改善一项 CJK 粗体，括号数学未满足现有语法，未重复测得整体性能优势                                                                                      | 保留 XMarkdown，候选不进入生产导入图；保留[语料、证据与退出原因](round2-renderer-experiment.md) |
| E3 assistant-ui 门面                 | 本轮优先 E1/E2；尚无降低重复同步成本的证据                                                                                                                                | 未启动，不增加第二历史或会话所有者                                                              |

E2 测的是冻结快照与已加载 DEV 实验页，不是最终生产高亮实现的 FCP/INP。当前 `这是**重点结论。**AI` 语料的粗体缺口仍在，已如实记录；不能把候选退出写成现有渲染在所有中文语料上均通过。

## 能力与验收边界

成果保存、版本、协作编辑、服务端导出、审批、queue/steer、durable Run 与跨端恢复均需实际后端合同，本轮 capability 保持关闭。没有使用模型按钮绕过授权，也没有把下载当持久保存、把客户端选择当模型实际使用、把本地停止当服务端取消确认。

本轮未验证：真实登录/应用/MCP/provider 链路及权限回执，真实服务器终态与取消，三条全业务黄金 E2E、长期 flake/覆盖率、实体 IME/手机键盘/触摸拖拽/屏读器、Firefox/Safari、Windows 安装包/签名/桌面原生 E2E，以及远端 CI、发布和生产切换。四预设状态映射有自动回归，浏览器只检查代表组合，没有声称完成所有页面的主题截图网格。

工程债状态更新在[唯一路线图](../engineering-modernization-roadmap.md) 的 ARCH-7、ARCH-8、ENG-2、ENG-3 对应记录中；部分完成项继续保持原状态。
