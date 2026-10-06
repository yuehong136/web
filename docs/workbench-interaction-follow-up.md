# Web 交互整改跟进方案

制定日期：2026-10-05。本文把原分析报告转成可独立实施、验证和提交的工作包，供产品、前后端、测试与编码代理使用。

**建议先交付主页的阅读、草稿、请求归属、错误保留和引用修复，再用 Agent Explore 验证共享工作台行为；持久任务、人工决策与成果版本等待对应服务端能力。** 保留现有技术栈、AppShell、页面模板和 Markdown 渲染边界。

本文维护实施范围、依赖和验收设计；进度、实现提交与实际验证只记录到[工程现代化路线图](./engineering-modernization-roadmap.md)，客户端与后端专项继续使用各自账本。下面的工作包编号只用于派工，不是新建一套完成状态。

## 1. 依据与当前基线

- 原对话：[分析前后端交互整改方案](chatgpt-conversation://6ac37a64-cae4-83e9-9793-e84405ebbf89)。已读取完整回复及本机下载的 `MultiRAG_Web_Modernization_2026-10-05.md`，包括 12 项发现、8 张任务卡和附录未验证项。
- 原报告审查基线：Web `6d2decea194ba7c5ab0ae140b7c0dc836857ed47`；MultiRAG `2e336d330c5a19f00c7f6b58a3046177d72a3563`。
- 本轮静态复核：Web `5e1cf88be03eda8ae413b4d13c22bea2bb3081e1`，开工时工作区干净；MultiRAG 初次核对为 `d765d16a`，交付前已推进到 `b3250cb30c30216bfd192308ffa5b227e7ca76ad`。新增两项提交修复图片缺失语义与布尔 metadata schema，Run/EIM 关键账本及模型未变；仍有 Channel 等未提交工作。后端工作树内容不能当作已合并或已部署能力。
- Web 后续四个提交涉及检索过滤与状态、知识配置合同、旧入口治理、分块图片替换。原报告定位的主页与共享引用缺口仍有代码依据；知识检索和图片处理应直接复用当前实现。
- 本轮完成的是源码、文档、调用链与 Git 差异复核；没有启动浏览器、跑业务测试或联调真实后端。以下验收要求均是实施完成条件，不是本次已通过的结果。

### 1.1 原报告建议的处置

| 原发现                      | 当前判断                                                    | 本轮安排 / 既有账本               |
| --------------------------- | ----------------------------------------------------------- | --------------------------------- |
| UX-01 滚动抢夺              | effect 与 Bubble.List 两处自动滚动仍存在                    | W1；ARCH-8 / ENG-3                |
| UX-02 草稿禁用              | 仍存在；还需修发送拒绝后清空草稿                            | W1；ARCH-8                        |
| UX-03 错误覆盖输出          | 应用与 MCP 分支仍覆盖正文，MCP 还显示原始错误               | W3；ARCH-7 / ENG-3                |
| UX-04 EOF / 取消 / 业务完成 | transport 返回 void，主页缺少业务终态核实                   | W3；ARCH-7                        |
| UX-05 引用评分与键盘        | 三个引用展示面将缺失评分当 0；内联 sup 缺按钮语义           | W4；ENG-3 / ARCH-8                |
| UX-06 引用增量              | Home 比较遗漏 metadata、评分、位置等字段                    | W4；ARCH-8                        |
| UX-07 历史切换              | 加载期间跳过新选择，响应提交缺目标校验；需 fixture 复现     | W2；ARCH-8                        |
| UX-08 流归属                | 应用按最后 assistant 更新；旧 finally 没有 owner 校验       | W2；ARCH-7                        |
| UX-09 近期工作与范围        | 当前标签已存在；应用历史范围与无应用模式解释仍需收口        | W5；ARCH-8                        |
| UX-10 旧 ChatInput          | 当前 src 内无实际消费者，仅保留导出                         | W5 做废弃边界；不作为主页迁移前置 |
| UX-11 提前承诺后台能力      | Run 服务/API 尚未交付；已有状态机和桌面基础不能证明恢复可用 | W7；ARCH-10 / CLP / RUN           |
| UX-12 文档与能力漂移        | 必须按当前命令、二进制、接口和部署复核                      | W0 与各工作包；HYG-3 / ENG-10     |

### 1.2 已有能力与报告中需要修正的判断

引用 metadata 的开关、全部字段、显式空列表、所选字段及多个展示位置已在 `6d2dece` 实现；本轮补的是增量一致性和阅读交互。图片已有认证、Blob lease、预览及替换失效链；新证据面板继续消费它。Agent Explore 已有会话导航、执行来源和请求 owner，第二条路径应扩展这些基础。

原报告仅凭 `typescript` 的 Compiler API alias 推断编译链可能未迁移，证据不足。当前 `node_modules/.bin/tsc` 指向 `@typescript/native/bin/tsc`，[验证专题](./agent-guidance/verification.md#toolchain)也明确区分原生构建编译器和 Compiler API。跟进项是保持事实入口一致，不再安排一次 TypeScript 迁移。`test:unit`、`test:ci` 和 inventory 入口已存在；剩余 E2E 与覆盖率工作应按实际差距安排。

## 2. 交付波次与退出条件

工作量 S 表示局部行为，M 表示一条业务路径，L 表示跨入口或跨仓合同；它们不是日历承诺。W1–W6 是本轮体验范围，W7–W8 是依赖服务端的后续范围。

| 波次          | 范围与主责                 | 前置条件                                                 | 可交付结果 / 退出条件                                                      |
| ------------- | -------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| S0 基线       | W0；前端 + 测试            | 当前测试账号与受控数据                                   | 有真实页面基线、协议样本、调用方和故障 fixture；未知项明确记录             |
| S1 主页修复   | W1–W4；前端主导            | S0；确认各 v1 协议的完成标记                             | 生成中能阅读和写草稿；切会话不串位；断流保留内容；引用正确更新并可键盘访问 |
| S2 共享工作台 | W5–W6；前端 + 产品         | Home 行为稳定，第二入口合同已核对                        | Home 与 Agent Explore 共享行为；一个上下文面板；活动和成果只呈现真实数据   |
| S3 持久执行   | W7；后端平台 + 身份 + 前端 | RUN 服务与授权 API、交互资源、部署 capability 和联调证据 | 接受后故障可查询；事件可重放；取消与审批竞态通过；无重复执行 fallback      |
| S4 成果资源   | W8；产品 + 前后端          | 资源 ID、版本、ACL、导出与迁移合同                       | 旧版本可追溯；权限撤回有效；分享与删除有真实服务端规则                     |

S1 是局部切片，不等于 ARCH-7 全部消费面完成。S2 两入口证明抽象有效，也不等于 ARCH-8 完成：该条仍需至少 Home、MCP、Agent runtime 的完整验收。固定日历排期应在 W0 结束后依据复现和接口结果确定。

现有暂停项保持原决策：本方案不恢复 SEC-7、CHN-X14/EIM-F5 等队列，也不将本轮体验任务扩大为认证、安全或上游全量移植。

## 3. 可独立实施的工作包

### W0 基线、样本与能力清点

**主责：**前端与测试；规模 S；对应原任务卡 8 的前置部分。

在当前 HEAD 启动真实 Home、Agent Explore 和引用详情，记录明暗主题及窄屏基线。核对 Home 应用模式与无应用 MCP 模式、历史接口、完成标记和停止行为。用可重建测试数据建立长正文、图片增高、metadata-only、score-only、历史乱序、部分内容后断流样本。

为每个入口记录：生产消费者、协议终态、订阅 owner、服务端取消/查询/持久历史能力、关键共享组件。fixture 验证代码行为；真实服务验收验证部署合同，两者分别记录。协议未给出的字段不由前端猜测补齐。

**退出条件：**每项已知缺口有复现或 fixture；原报告条件性风险没有被直接写成生产故障；所有后续任务知道该改哪个活跃入口。

### W1 主页阅读与草稿

**主责：**前端 A；规模 M；原任务卡 1；ARCH-8 / ENG-3。

**入口：**[ChatSection](../src/pages/home/components/ChatSection.tsx)、[ChatInputBox](../src/pages/home/components/ChatInputBox.tsx)、[HomePage](../src/pages/home/HomePage.tsx)及发送接纳边界。

统一滚动所有者，显式区分跟随与阅读状态；上滚后接收内容但不跳底，提供新内容提示与回到底部。首次进入、主动发送、图片或表格高度变化分别定义锚点行为；分页保锚只在入口支持分页时实现。

输入始终可编辑；发送与停止分开。接纳时同步占有请求，会话创建、历史准备与流式运行期间均拒绝第二次提交，不能仅依赖稍后更新的 React isStreaming。运行中 Enter 不发送也不清草稿；保留 IME、模型锁定，并锁定当前应用/MCP 的选择和标签移除。请求使用接纳时的范围快照；下一轮范围编辑后续在 W5 单独定义。

发送接口明确接纳/拒绝，只有本次草稿被接纳才清空对应快照；缺模型、加载历史等拒绝路径保留输入。草稿按身份、租户、会话隔离在内存中，切换身份清理。

**验收：**长输出上滚后不跳底；恢复跟随后继续滚动；运行中输入、IME、空草稿和停止均正确；会话准备阶段快速双击/连续 Enter 不重复执行；发送拒绝不丢草稿；运行中范围不能被标签移除改变；窄屏软键盘下输入与停止可达。已有附件/灵感等能力门控继续保留。

**拆分要求：**ChatSection 在 630 行基线中，不直接增长；提取必要 viewport/pattern 后再实现。此包不增加队列、steer 或并行请求能力。

### W2 请求归属与历史隔离

**主责：**前端 A；规模 M；原任务卡 4 与任务卡 2 的消息归属部分；ARCH-7 / ARCH-8。

**入口：**[useHomeChat](../src/pages/home/hooks/useHomeChat.ts)及其历史与流消费逻辑。W1 的发送接纳边界稳定后实施，作为后续正文/状态更新的共同前置。

捕获 app、conversation、request、assistant message 身份；应用模式也按目标消息 ID 更新。历史使用请求代次和目标键，最后一次选择生效；新建、应用切换、卸载与身份变化使旧响应失效。旧 delta、catch、finally 均检查 owner，不能清掉新请求状态。按既有规则清理订阅，清理本身不宣称服务端取消成功。

**验收：**A 慢 B 快、A→B→A、加载中开新会话、停止后马上新发、晚到正文/错误/finally 均不串位；标题、消息、选中项一致。保留 MCP 已有 message ID 更新能力。

### W3 部分输出、错误与终态

**主责：**前端 A + 协议 owner；规模 M–L；原任务卡 2；ARCH-7 / ENG-3。

**入口：**[transport](../src/lib/streaming/transport.ts)、[streaming 入口](../src/lib/streaming/index.ts)、Home 业务 adapter 与消息状态展示。

先以兼容方式暴露 transport 结束原因，再由各 adapter 判定业务完成；不全局改变 `[DONE]` 的容错行为，不将任意 EOF 合成成功。明确本地 abort、timeout、网络截断、HTTP 鉴权/限流/服务错误和业务错误帧。正常终态、无终态 EOF、终态后晚到事件各有 fixture。

正文、引用与已收到活动保留，状态和安全 i18n 错误独立显示。没有权威查询时提示“执行结果未确认”；没有幂等保证时不自动重发。当前 Home 停止仅有本地 abort，文案应体现实际能力；后续真正取消必须读回权威结果。

**验收：**部分正文后错误仍能复制与查看引用；无完成帧不显示成功；401、业务错误和取消有准确分类；错误不暴露原始 message/响应体；协议终态与可用恢复动作一致。

**完成边界：**本包先交付 Home；ARCH-7 的普通 APIClient request signal/timeout、REST/SSE 401、MCP、Share、Studio、Search 等余项继续留在原账本，按消费面推进，不能一次把 ARCH-7 标完成。binary readResponse 已组合 caller signal，应复用而非重复修复。

### W4 引用展示与增量一致性

**主责：**前端 B 负责展示，前端 A 负责 Home 合并；规模 M；原任务卡 3；ENG-3 / ARCH-8。

**入口：**[ReferenceMarker](../src/components/chat/ReferenceMarker.tsx)、[ReferencePanel](../src/components/chat/ReferencePanel.tsx)、[ReferenceDetailSheet](../src/components/chat/ReferenceDetailSheet.tsx)、[reference-meta](../src/components/chat/reference-meta.tsx)、[Home 引用 helper](../src/pages/home/utils/chat-reference-helpers.ts)、[共享 reference-replacer](../src/utils/reference-replacer.ts)。

所有展示面区分缺失/无效数值、真实 0 和有效评分；不再将缺失值显示为 0% 或低相关。评分称为检索匹配评分，移入诊断层。已解析引用使用真实 button、可访问名称和焦点恢复；无法解析的引用保留文本语义。

复用共享数组/keyed map 提取及 reference_index/reference_key 合同。稳定引用身份下 metadata、评分、名称、位置、图片变化均更新；相同快照避免无效刷新。区分帧未提供引用与协议明确提供空引用；是否清空由协议定义，不能凭空数组猜测。核对编号顺序与预览定位合同。

**验收：**缺失、0、有效值、非法值；metadata-only / score-only；keyed chunks；编号缺失、重复、乱序与同文档多段；Tab/Enter/Space/Escape 与返回焦点；无权限、无定位和图片失效。SafeHtml 白名单、认证图片 lease 和已选 metadata 配置不回归。

展示子项可与 W1 并行；Home 合并须在 W2–W3 的 hook 修改窗口结束后，由同一 owner 收口。

### W5 共享行为与第二条迁移

**主责：**前端 A/B + 产品；规模 L；原任务卡 4 的导航部分与任务卡 5；ARCH-8。

从 W1–W4 的稳定行为抽取 headless controller 与展示 pattern，业务 adapter 保留各自 API 和历史模型。固定草稿、提交、停止、错误、引用、附件与状态所有权；UI 能力由协议、权限和当前状态共同决定。未知能力默认关闭。

完善 Home 当前应用/MCP 范围与真实历史说明。已存在的 SelectedTags 增加类型/可访问名称，规定运行时修改标签影响下一轮还是被锁定；不从缓存拼“全量近期工作”。旧 ChatInput 当前无消费者，收口废弃导出/禁止新引用即可，不迁移到它。

第二条路径选 [Agent Explore](../src/pages/agent/explore/index.tsx)。复用现有 owner 与 runtime 组件，保留 Begin inputs、附件、A2UI、人工输入、草稿/已发布/session 执行来源和取消合同。RuntimeChatMessageList 还供 Share、Log transcript、运行面板使用，Composer 也供运行面板使用；共享 props/容器合同改变后回归这些调用方。

**验收：**两条路径同类状态产生同类动作；会话切换与草稿互不污染；不存在新的 server-state 副本或平行 renderer；既有 Explore 选择、执行来源与 owner 测试通过。之后按真实使用与风险迁移 MCP/Agent runtime，达到 ARCH-8 原验收范围。

### W6 证据、活动与只读成果工作区

**主责：**产品 + 前端 B；规模 M；原任务卡 7 的只读部分；ARCH-8，资源化部分后续归 ARCH-9。

在现有工作区内组合一个主要上下文面板，切换来源、活动、本轮上下文及已存在成果。同一时刻不叠加多个主要抽屉；关闭后回到原消息、阅读位置和触发焦点。Studio 保留专业布局，只统一运行语言与交互状态。

活动来自真实事件，仅展示允许公开的摘要、耗时和参数；不编造进度，不展示敏感工具原文。只读成果必须有真实数据来源、会话/消息归属与生成状态；没有成果协议的入口先交付证据和活动。已有文件沿用受保护预览/下载，未知 MIME 安全降级；动态 HTML 按现有沙箱合同处理。

**验收：**长报告/表格阅读与输入可并行；部分成果失败仍保留；预览与下载指向相同成果；权限撤回有效；未知类型无执行能力。编辑、版本、分享和项目关系不在此包中提前开放。

### W7 持久 Run 与人工决策

**主责：**后端平台 + 身份/工具 owner + 前端；规模 L，单独项目排期；原任务卡 6；ARCH-10 / CLP / RUN / EIM / CHN。

后端 Run 账本当前仅 RUN-F0 完成、RUN-F1a 进行中；RUN-F2 ledger、F3 dispatcher、F4 worker、F5 API/replay/cancel 尚未开始。按既有依赖推进持久接受、事件与 outbox、派发、worker lease/fencing、授权 API 及恢复。原账本 Run Service v2 的 47–70 人日与 Shared Client 的 28–43 人日是历史估算，需平台 owner 重估；不能压缩为本轮一个短期 UI 工作包。

Web 使用[客户端平台合同](./client-platform/CONTRACTS.md)中的 createRun/getRun/subscribe/cancelRun/submitInteraction；远程 schema 真源留在后端，以生成物与 fixture 消费，不在前端重写 envelope。区分服务端 Run 状态、连接状态与人工决策状态。

Agent runtime 已有正式 Task 取消 API、授权检查及“取消已请求”的 UI，CLP-P0 也已有 task ID 和 passive detach 切片，应直接复用。当前取消 ACK 只证明提交/无操作，不证明任务进入 cancelled；当前没有公共 Task inspection API，不能要求此路径读回未提供的终态。Home 的本地 abort、现有取消请求、未来 v2 的权威查询/恢复分别验收。

EIM-U14 已有持久待输入 InteractionSession、revision、幂等与恢复前重授权；U15 原生表单适配有实现，但默认关闭且不等于生产部署。待输入补参不等于敏感写审批。敏感写依赖尚未开始的 EIM-M1/M2，以及 M3 Confirmation Store 的动作参数摘要/操作者绑定、M4 业务幂等与 unknown outcome 恢复；之后完成 M5 sandbox 和 O1/O2 开放门禁。仅以聊天 UI 或 U14 表单不能跳过这些阶段。

Channel 已有内部执行/幂等边界；必须核对已部署的浏览器可用接口、feature gate 与角色权限。内部 workload 凭证和执行接口不提供给浏览器。审批绑定持久 interaction ID、动作与参数版本、有效期、允许动作和幂等结果，不从聊天文字制造批准事实。

**开放门槛：**接受前后故障、提交结果丢失、跨实例查询、重复/缺口事件、游标过期、慢消费者、取消与完成竞争、审批过期/重复/参数变更、租户切换均有实际联调证据。v2 已接受后不 fallback 到 v1 重复执行。满足门槛后再开放任务列表、重连、通知；enqueue/steer 各自另验收。

### W8 成果版本与项目试点

**主责：**产品 + 前后端；规模 L；原任务卡 7 的资源化部分；ARCH-9。

先选择一个真实场景，例如制度分析报告，定义 artifact ID、来源执行、证据版本、编辑生成新版本、预览/导出一致性及权限撤回。再决定团队分享、评论和项目关联；Projects 必须有成员、资源移动、继承、删除、迁移与深链接合同。

**退出条件：**旧答案指向旧版本且可辨认；访问检查与导出一致；分享范围可审阅；撤权、删除、迁移、回滚有测试。W6 的只读面板完成不意味着本包完成。

## 4. 依赖、并行窗口与提交安排

首批推荐顺序：**W0 → W1 → W2 → W3 → W4 Home 合并**。相比原报告将历史隔离放后面，本方案把 owner/目标身份提前：错误、终态和引用更新都依赖它，且共用同一个 hook。

| 工作窗口 | 前端 A                    | 前端 B                            | 后端 / 测试                            |
| -------- | ------------------------- | --------------------------------- | -------------------------------------- |
| 基线     | Home 调用链与协议清点     | 引用和第二入口清点                | 受控账号、数据、故障样本；平台能力核对 |
| 首批     | W1 的滚动/草稿与发送接纳  | W4 的评分/按钮语义                | 验收样本与浏览器回归资产               |
| 稳定身份 | W2 → W3，独占 useHomeChat | 只读工作区设计，避免修改共享 hook | 核对各 completion 的终态和取消合同     |
| 引用收口 | W4 的 Home 增量/快照      | 引用跨消费者验收                  | metadata/编号/权限与原文定位样本       |
| 第二入口 | W5 Agent Explore adapter  | W6 上下文面板                     | 黄金路径、运行协议与后续平台实施       |

`useHomeChat.ts`、共享 locale、file-size 基线和唯一账本有一个整合 owner；多个代理不同时改同一个 hook。新能力先修业务正确性，再做必要提取；不先重构所有聊天页面。共享 runtime 组件修改应先列消费方，再决定 props/组合边界。

每个独立单元完成实现、相关检查和真实 UI 验收后提交，Conventional Commits 标注现有账本 ID，只暂存该单元文件。W3 可拆为兼容 transport、Home 终态/错误两个提交；W4 可拆为展示语义、增量合并两个提交。无法验证的外部依赖明确写入交付记录，不以截图或 HTTP 200 代替业务成功。部署与发布另按授权执行。

## 5. 验收与度量

### 5.1 首批必须通过的场景

| 场景                                     | 必须观察到的结果                                   |
| ---------------------------------------- | -------------------------------------------------- |
| 长回答 + 用户上滚 + 图片/表格增高        | 阅读锚点稳定；新内容可见提示；点击回底恢复跟随     |
| 输出中写下一条 + IME + Enter             | 草稿保留；不发送第二次执行；停止仍可操作           |
| 发送被 busy/缺模型/历史加载拒绝          | 草稿不被清空；反馈与按钮能力一致                   |
| A 慢 B 快 / 开新会话 / 旧 finally        | 最后选择生效；旧消息和状态不污染新目标             |
| 部分正文后 error / EOF / 401 / abort     | 正文与引用保留；安全错误分类；没有假完成或自动重发 |
| 缺失/0 评分 + metadata-only / keyed 引用 | 缺失不是 0；真实 0 保留；编号稳定且增量可见        |
| 引用 → 原文 → 关闭                       | 键盘可达；焦点和阅读点恢复；权限与无定位状态准确   |
| 明暗、中英、窄屏和软键盘                 | 关键动作可达；长标题/正文无遮挡；状态不只靠颜色    |

实现检查沿用[验证矩阵](./agent-guidance/verification.md#scope)：受影响行为测试、streaming/API/security/product-ui 专项按范围取并集；类型/导出/拆分变化运行 build 与 file-size；Agent adapter 变更加 typed/strict 与既有 Agent 合同测试。新增测试进入正式 inventory，按专题要求运行 inventory/test:ci；无需为无关范围反复扩大测试。专项脚本不一定覆盖新文件，交付时检查实际匹配范围。

真实 UI 留明暗截图及关键操作证据。协议故障用稳定 fixture；真实后端另验证业务码、终态与独立读回。上传旅程后续验收必须区分上传、处理完成、chunks 与可检索结果，不把上传成功作为知识可用。

### 5.2 观测作为横向工作

W0 先固定设备、正文规模与输出速率采基线；W3 定义状态分类；W5/W6 在 ENG-10 的隐私边界内接入真实观测。仅记录 release、route、trace ID、安全 code/status、耗时、终态和经授权的脱敏用量，排除访问凭证、prompt、对话和工具原文。

首批质量目标是：有部分内容的失败样本不丢结果；无权威完成不报成功；会话不串位；有效且有权限的引用能抵达证据。性能比较采用输入/滚动延迟、长任务和 TTFT，先报告改造前后数据，再确定预算；不预先宣称提升百分比。任务继续率只在 durable 能力开放后统计。

## 6. 开放与回滚条件

S1 先在受控环境验收；S2 的工作区组合可按已有功能开关小范围开放。新 `VITE_ENABLE_*` 开关沿用仓库入口规范并登记 `.env.example`；能力开放仍受正式接口和权限约束。

串会话、正文被错误抹掉、无终态报成功、重复审批执行、权限越界或关键操作键盘不可达，均阻止对应功能开放。只读面板可回退到既有消息/引用展示；共享行为逐入口迁移可分别回退；已经接受的 Run 必须继续可查询，不因关闭 UI 删除或重复执行。涉及数据库迁移时先交付恢复方案。

## 7. 可复制派工提示词

### 首个实施单元

```text
在当前 web HEAD 实施 docs/workbench-interaction-follow-up.md 的 W1，映射 ARCH-8/ENG-3。
先读 AGENTS 与相关专题，保留工作树改动，核对 HomePage、ChatSection、ChatInputBox、发送接纳及现有测试。
统一滚动所有者：上滚停止跟随，有新内容提示和回到底部，动态高度不抢阅读位置。
接纳时同步锁定请求，覆盖会话创建、历史准备与流式期间，快速双击/Enter不能重复执行。
生成中允许写草稿，但 Enter/按钮不得新发；发送拒绝不得清草稿，接纳后仅清对应草稿快照。
保留 IME、停止、模型与应用/MCP选择和移除锁定、i18n及能力门控；请求用接纳时范围快照，草稿只留会话内存。
ChatSection 在册文件不得增长，做必要提取；不改后端协议、不增加队列、不换 renderer/AppShell。
完成匹配验证矩阵的检查与明暗主题、键盘、窄屏真实渲染验收，记录实际结果和限制。
更新唯一工程账本本切片记录；只暂存该单元，验证后提交，不推送或部署。
```

### 可并行的引用展示单元

```text
在当前 web HEAD 实施 W4 的展示子项，映射 ENG-3/ARCH-8，避开 useHomeChat 与 Home 引用合并逻辑。
核对 ReferenceMarker、ReferencePanel、ReferenceDetailSheet 和 reference-meta 的消费者与已有 metadata/图片测试。
统一缺失、真实0、有效评分；缺失不显示0%或低相关；引用用有名称的按钮且保留上标外观。
验证 Tab、Enter、Space、Escape 和返回焦点；未知引用不做空操作按钮；中英文同步。
保留 SafeHtml、metadata配置与认证Blob图片链；与整合owner协调共享locale和基线文件。
完成受影响检查与真实明暗主题/键盘验收，更新唯一账本，只提交该单元，不推送或部署。
```

### 请求归属与终态接续单元

```text
接续 W1，先实施 W2 并独立验证提交，再实施 W3；映射 ARCH-7/ARCH-8。
同一owner负责 useHomeChat 的历史代次、捕获消息身份、晚到事件和finally保护；不得并行覆盖此hook。
W3复用共享SSE层，以兼容方式暴露结束原因，各业务adapter识别终态；保留正文/引用，错误单独安全呈现。
覆盖乱序历史、旧finally、部分内容后错误、EOF无终态、sentinel、401、abort与终态后delta。
不自动重发，不用本地abort宣称服务端已取消；未迁移消费面保留在ARCH-7账本，不标整条完成。
按验证矩阵完成检查与真实UI故障验收，每个可独立交付单元验证后提交，不推送或部署。
```

## 8. 当前证据与权威入口

以下行号对应本轮复核的 Web HEAD，仅供定位；实施时重新核对。

| 证据                              | 定位                                                                      |
| --------------------------------- | ------------------------------------------------------------------------- |
| 主页滚动双所有者                  | ChatSection 100–104、568–571                                              |
| 禁用草稿、快捷键、发送后清空      | ChatInputBox 119、155–187；ChatSection 156–168；HomePage 50–55            |
| 历史 guard / 提交缺 owner         | useHomeChat 99–156                                                        |
| 应用更新最后 assistant / 引用比较 | useHomeChat 327–365                                                       |
| 应用/MCP 覆盖错误正文             | useHomeChat 369–391、488–528                                              |
| Home 停止仅本地 abort             | useHomeChat 547–563                                                       |
| EOF 与 abort 正常返回             | transport 57–69、84–88                                                    |
| 评分缺失默认 0 / sup 触发器       | ReferenceMarker 86、94；ReferencePanel 200；ReferenceDetailSheet 200、503 |
| 共享 keyed 引用提取               | reference-replacer 127 起；Home helper 16 起                              |
| 第二入口已有 owner                | use-explore-session-chat 158 起；session-chat 149 起                      |
| 第二入口仍禁用输入/自动滚动       | RuntimeChatComposer 58–70、165；RuntimeChatMessageList 380                |

前端权威入口：[工程账本](./engineering-modernization-roadmap.md)、[客户端账本](./client-platform/ROADMAP.md)、[运行与安全专题](./agent-guidance/runtime.md)、[验证专题](./agent-guidance/verification.md)。

后端权威入口：[Run ROADMAP](https://github.com/yuehong136/MultiRAG/blob/d765d16a01fc32baa3734172db90ec5b178b8c64/docs/run-platform/ROADMAP.md)、[Run schema](https://github.com/yuehong136/MultiRAG/blob/d765d16a01fc32baa3734172db90ec5b178b8c64/api/run_platform/schemas.py)、[EIM 入口](https://github.com/yuehong136/MultiRAG/blob/d765d16a01fc32baa3734172db90ec5b178b8c64/docs/enterprise-identity-mcp/README.md)、[Channel CONTRACT](https://github.com/yuehong136/MultiRAG/blob/d765d16a01fc32baa3734172db90ec5b178b8c64/docs/channel-program/CONTRACT.md)、[Channel PROGRESS](https://github.com/yuehong136/MultiRAG/blob/d765d16a01fc32baa3734172db90ec5b178b8c64/docs/channel-program/PROGRESS.md)。固定链接证明已提交基线；本地后续 WIP 和正式部署需分别重新验证。
