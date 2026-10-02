# 指令与技术栈评估 · 2026-10-02

本文是有日期的选型依据，不是每次任务的必读规则，也不替代[工程路线图](../engineering-modernization-roadmap.md)的进度账本。版本来自本次 package/lock、已安装依赖和 npm registry 的检查；执行升级时需重新核实。

## 结论

继续采用 React + Vite SPA、TanStack Query、Zustand、Radix + 语义化 token、现有领域 API/SSE 运行时。它们适合当前独立后端、Web、iframe/widget 和共享 Desktop Renderer 的边界。当前主要成本在于规则重复、编译反馈、消息渲染分叉、运行生命周期和真实流程验收；换成另一套全栈框架不会自动解决这些问题。

推荐顺序：指令单一来源与兼容性清理 → 编译器/依赖分组升级 → Run 与消息渲染合同收口、浏览器 E2E 和性能观测 → Tailwind 4 等大迁移。现有暂停的安全工作仍按原账本约束，不因本评估自动恢复。

## 指令层：已实施与依据

| 问题                                                       | 本次调整                                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| AGENTS/CLAUDE 双语整份复制，冲突时“更严格者优先”会不断加码 | AGENTS 为唯一入口，CLAUDE 内容只有 `@AGENTS.md`，不保留英文专题副本 |
| 根文件包含整套技术细则，任意任务都要加载                   | 保留范围、合同、完成标准和任务导航；前端/运行时/验证分为按需专题    |
| 版本表、组件数量、历史目录易漂移                           | 版本指向 package/lock；历史统计留在有日期的评估，不写成永久规则     |
| 为所有 mutation/表单规定具体 React API                     | 改为状态所有权、失败恢复、对账和异步生命周期要求；沿用可靠实现      |
| “启用 Compiler 就移除记忆化”、Activity 一概实验态          | 改为局部测量、安装版本与生命周期验证                                |
| SSE 一概走普通 APIClient；abort 被混同服务端停止           | 保留领域传输边界，区分连接清理、退订和经后端确认的任务取消          |
| i18n `_plural` 与命名导出懒加载示例过时                    | 使用 JSON v4 复数类别；引用现有 `lazyNamed`                         |
| 所有改动都扩大验证范围                                     | 按行为与影响面选择检查，CI 保留完整门禁；完成后不无理由重复验收     |

Claude Code 支持 `@path` 导入；普通文字“请读 AGENTS.md”不是同等强度的加载机制。入口文件保持普通文本导入行；不要把所有专题也写成 `@` 导入，否则又变成启动时全部加载。参见 [Claude Code memory](https://code.claude.com/docs/en/memory)。

[OpenAI 的文章](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)倡导精确触发、渐进加载、明确完成条件。开源对照也体现类似原则：[Dify 的 web/AGENTS.md](https://github.com/langgenius/dify/blob/main/web/AGENTS.md)把规则链接到所属组件/测试文档，仅相关任务读取；[LobeHub 的 AGENTS.md](https://github.com/lobehub/lobehub/blob/main/AGENTS.md)把详细规则放 skill，并区分静态检查与产品验收。这些是可借鉴的工程实践，不代表它们的框架、数据库或发布流程适用于本仓。

## 依赖分组评估

以下“候选”是本次查询的版本，不是已升级版本。本次没有修改 package.json 或锁文件，也没有把 outdated 数量当作漏洞数量。

| 领域                      | 已安装 → 候选                               | 决策与迁移条件                                                                                                    |
| ------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| React / Vite              | 19.2.8 → 19.3.0；8.2.1 → 8.3.2              | 保留主干；分别核查 release/peer 和回归，不与样式或消息协议重写合并                                                |
| TypeScript                | 5.8.3 → 7.0.2                               | 优先试点原生编译器；本次 src 类型检查已通过。仍需完整 project references、Agent/Desktop、编辑器和 lint 工具链验证 |
| React hooks lint / ESLint | 5.2.0 → 7.1.1；9.39.5 → 10.11.0             | 先升级 hooks lint 并分类新增诊断；ESLint 大版本单独核对插件。不能通过整体关规则消除迁移错误                       |
| Query / Zustand           | 5.101.4 → 5.104.0；5.0.6 → 5.0.15           | 维持选型，作为低耦合维护批次；回归 mutation、认证切换缓存与 selector 行为                                         |
| Ant Design X              | x/card/sdk 2.7.0 → 2.9.0；markdown 已 2.9.0 | 按 peer/功能兼容性成组处理。x 2.9 要求 antd ^6.1.1，当前 6.0.1；x-card 补丁必须移植或证明上游已等效修复           |
| Tailwind                  | 3.4.19 → 4.3.3                              | 独立迁移；先解决 Firefox 支持基线，再处理 token 生成、scoped theme、插件与视觉回归                                |
| Vitest                    | 4.1.10 → 4.1.11 / 5.0.3                     | 可先维护 4.x；5.x 需核对 Node/CI 环境与配置。更迫切的是关键路径浏览器验收，不是再次替换全部 runner                |
| Lexical / 分栏组件        | 0.40.0 → 0.52.0；2.1.9 → 4.14.1             | 分成独立迁移，验证编辑器序列化/输入法和分栏持久化/键盘交互；0.x 不能按无破坏小版本处理                            |

版本查询可通过 `npm outdated --json` 与 `npm view <package>@<version> peerDependencies engines` 重现；前者有更新时退出码为 1。实施时以当时 registry 和锁文件为准。

### TypeScript：已有可验证的前置改动

TS 7 首次检查被 `baseUrl` 已移除和 paths 非相对路径阻断。本次删除 `tsconfig.app.json` 的 `baseUrl`，把 `@/*` 目标改成 `./src/*`；现有 TS 5.8 的 Web build 和隔离 TS 7 src 检查均通过。

TS 7.0 没有旧 JavaScript Compiler API，不能仅把当前 `typescript` 依赖替换成 7 就宣称迁移完成。依赖 Compiler API 的工具可按官方方式与 TypeScript 6 兼容包并存，再核对 typescript-eslint 等消费者。见 [TypeScript 7 公告与并存方案](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)。本次未测性能收益，不把官方速度数字当成本仓实测。

### Tailwind：有实际支持范围冲突

当前 `package.json` 声明 Firefox >= 114；[Tailwind 4 兼容说明](https://tailwindcss.com/docs/compatibility)要求 Firefox >= 128。是否提升浏览器最低版本是产品支持范围决策，不能升级时静默修改。Vite 中还存在 X Markdown 高亮 CSS 的适配，token 生成和 scoped-theme 也需一起验收。保留 ARCH-5 独立评估。

### Ant Design X：补丁就是合同

`patches/@ant-design+x-card+2.7.0.patch` 让 A2UI action 带上 `sourceComponentId` 和 `timestamp`，同时改运行代码和声明。升级需验证这些字段的来源、类型和值仍符合下游需要，不能为了让 postinstall 通过删除补丁。之后再验证工具卡片事件、流式 Markdown、引用、代码高亮和安全渲染。

## 结构优化比全量换框架更有价值

1. **运行时先统一合同（ARCH-7、Client Platform）**：明确创建/订阅/取消/交互/终态；断网重连与重新执行分开，UI 状态不能证明服务端完成。只消费后端实际合同。工作区已有取消相关未提交改动，本次未修改，也未据此宣称整项完成。
2. **生成式 UI 与 Markdown 收口（ARCH-8、ENG-11）**：已有 `streaming-x-markdown.tsx`，同时仍有 markdown-it 的 `MarkdownRenderer.tsx` 和 react-shiki 的 `CodeBlock.tsx`。先列出调用面及数学、mermaid、附件、引用、净化合同，再决定可合并的路径。单凭 package 列表不能认定某渲染器无用。
3. **契约生成试点（ARCH-2）**：从后端真实 OpenAPI/事件 schema 生成类型，选一个稳定领域试点；在跨信任边界增加必要运行时验证。避免把已有陈旧 OpenAPI 自动生成成另一套错误合同。Dify 的生成客户端实践值得参考，但不能照搬其 DTO。
4. **浏览器验收与观测（ENG-2、ENG-10）**：保留现有正式测试 inventory，补发送→流式→取消/恢复、知识库导入→检索、share/widget 隔离等黄金链路。指标优先关注首个 token、流中断、取消确认、长任务及错误 trace；默认不采集 prompt、工具原始内容或凭证。
5. **真实路由性能（ENG-11）**：本次 build 的入口 gzip 已用预算 99.6%，总 JS 用 98.5%。先追踪聊天/登录/widget 路由实际加载成本，再收敛重型依赖和渲染路径。现有 JS 预算通过不等于首屏体验已达标。
6. **React Compiler 局部试点**：优先选高频消息列表，采用[渐进启用](https://react.dev/learn/react-compiler/incremental-adoption)，比较输入响应、提交次数、长任务与包体；没有测量收益不做全局迁移。

本仓暂不需要因同类项目使用 Next.js/SWR/tRPC 就替换 Vite/Query/既有后端。AI SDK 也不是通用 SSE 的即插即用替代品：[其 UI Message 流协议](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)有专门事件与响应约定。若试用，应在适配层证明现有消息/工具/取消合同可映射，再比较维护成本；不并行维护第二套 Run 所有权。

## 本次验证边界

- 修改前 TS 5.8 src 类型检查通过。
- 修改后 `npm run build` 通过；存在既有大 chunk 警告。
- `npm exec --yes --package=typescript@7.0.2 -- tsc -p tsconfig.app.json --noEmit --incremental false --pretty false` 通过；只验证 Web src，不代表 TS 7 全工具链迁移完成。
- `npm run check:bundle-size` 通过：总 JS 25.73/26.13 MB、入口 gzip 120/120 KB（精确占比 99.6%）、最大 chunk gzip 725/739 KB。
- `npm run lint:typed` 退出成功：0 errors、84 warnings；未扩大为警告清理。8 份文档的 41 个本地链接/锚点、31 个 npm 脚本引用、Prettier 与 diff 检查通过；22 个原有非本任务文件的哈希保持不变。
- 本次变更为指令文档与等价路径别名配置；未改变产品运行行为，未新增浏览器验收或全业务测试。不宣称 Desktop 打包或生产验收通过。
