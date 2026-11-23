# AI 工作台 UI 现代化审计与方案（2026-11-23）

> **范围**：`src/` 下全部产品面（外壳、对话、Agent/Studio、知识库/检索/记忆、设置/目录、分享/浮窗、桌面壳），以及设计系统和技术选型。
>
> **方法**：8 个代码维度各一名审计者，另有一路联网调研（截至 2026-11-23 的头部 AI 产品与开源项目）。每条发现都由独立核验者对照代码、git 历史和 MultiRAG 后端复查，最后由查漏者补审没覆盖到的面。共保留 111 条（高 29 / 中 60 / 低 22）。核验阶段没有推翻任何一条，但约三分之一带有修正（行号、计数、后端范围），附录 A 照录修正后的版本。正文写成后又分 5 段逐条核对（约 430 条陈述），按确认的 89 处问题修正了措辞、计数、后端依赖，以及与既有计划和安全门槛的关系。
>
> **界面观察**：来自仓库 Playwright mock 夹具（`scripts/browser/workspace-fixtures.mjs`），在 1440×900 下截取 20 个页面的暗色紧凑和亮色视图。数据是假的，模型选择器加载失败这类现象可能由夹具造成，没有连真实后端复核。
>
> **账本**：本方案在 [工程现代化路线图](../engineering-modernization-roadmap.md) 登记为 ARCH-11；与 ARCH-7、ARCH-8、ENG-3、ENG-8、ENG-9、ENG-11、ENG-12 重叠的项，进展记在原条目（见 §7.1）。上一轮审计 [ui-ux-modernization-audit-2026-10-05.md](./ui-ux-modernization-audit-2026-10-05.md) 已关闭的项不再重复，仍未关闭的旧编号在正文和附录中标出。图示里的符号只是占位，实际界面用 lucide 图标、ProviderLogo 和实体头像。

## 1. 结论

1. **技术栈不老，旧的是用法和几块遗留资产。** React 19.3、Vite 8 + Rolldown、TS 7 原生编译器、Tailwind 4.3、xyflow 13、motion 14、Electron 45，整体不旧于 LibreChat（React 18、Vite 8、Tailwind 4.3）、RAGFlow（React 18、Vite 7、Tailwind 3）、Langflow（React 19.2、Vite 7、Tailwind 3.4）和 Flowise（React 18、Vite 5），不需要换框架。差距在两处。一是 React 19.3、Router 7、Query 5 的新能力几乎没用：ViewTransition、Activity、useOptimistic、route.lazy + loader、useBlocker、乐观更新的使用数都是 0。二是还留着几块旧资产：RAGFlow 时代 220 KB 的 iconfont.js（每页同步加载）、rc 版 PDF 高亮库、只服务 3 个小编辑器的 14 MB Monaco、1.4 MB 的 G6、已无引用的 x-sdk；长会话和主要资源列表（会话、文档、切片）没有虚拟化，也没有 content-visibility，只有表格列配置在超过 200 列时用了手写窗口化。
2. **最大的差距是交互范式。** 2026 年下半年的主流已经从"聊天框"变成"Agent 工作台"：单一可折叠 Trace、逐工具审批、计划清单、后台运行与通知、运行中插话和排队、生成式 UI（MCP Apps）、活的 Artifact。其中逐工具审批、持久的后台运行与通知、插话和排队归 [跟进方案](../workbench-interaction-follow-up.md) W7（ARCH-10 / RUN / EIM），要等后端 RUN-F2–F5 和 EIM-M1–M5 落地并通过开放门槛；Artifact 的版本和分享归跟进方案 W8 / ARCH-9。本方案在前端能做的是切页不中断的本地保活、Trace 统一和只读成果呈现，不等于交付了这些能力。本仓在基本盘上也有缺口：首页直连模型的对话不落库，刷新就丢；切到别的页面会直接中断正在生成的回答；没有全局最近对话，也没有活动中心；首页和 Agent 运行对话不能重新生成，全端都不能编辑后重发；点赞点踩在首页、Explore、Studio 预览和 Agent 运行对话四处都关着。
3. **设计系统底座扎实，最后一公里断了。** 色彩令牌 2.0 在同类开源项目里少见，但弹层出入场动画类全部失效（没装 tw-animate-css），也没有动效令牌。深色模式的强调文字和语法色按刚好达标求解，看起来发灰。没有语义字阶，全局隐藏了滚动条。AI 身份是 lucide 的 Waves 加蓝紫粉渐变，思考和页面加载共用一个转圈。
4. **RAG 的差异化没有兑现。** 点引用"查看原文"只打开 PDF 第 1 页，不定位也不高亮。搜索应用答案页还用旧引用组件，来源在一屏里出现三遍。建库向导写死 naive 解析器，看不到真实分段预览，而后端 `/preview_chunks` 早已就绪；已有的 Ingestion pipeline 也没有接进建库流程。知识库详情页不能直接提问。
5. **Agent 编辑器是新皮肤、旧内核。** 没有撤销重做、节点搜索、连线插入、Inspector、发布前预检和节点"上次运行"，右栏是常驻的资产统计。后端早已提供 `/v1/llm/fine_prompt`，前端却没有"AI 优化提示词"。行业正转向"描述即搭建"（OpenAI 的纯画布 Agent Builder 于 2026-11-30 关停）。本仓还没有让 AI 搭建工作流的入口：画布和创建流程里都没有 AI 助手，只有 HTML 报告设计器里的"AI 生成骨架"，它只作用于单个节点的报告版式。

## 2. 外部基线（2026 下半年）

只列影响本方案的范式，来源和置信度见附录 B。

| 范式                                                      | 代表产品                                                  | 本仓现状                                                                                                                                                                                          |
| --------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 输入框即能力路由：一个 + 菜单承载附件、知识、连接器、模式 | ChatGPT Atlas、Codex app、Gemini Chat/Task、Claude Cowork | @ 是手写弹层，不能 @知识库，没有 / 命令，Home 与 Explore 能力不一致                                                                                                                               |
| 选力度而不是选模型：自动 / 快 / 深，模型名退到二级        | ChatGPT 思考时长档、Cursor 模式、DeepSeek Instant/Expert  | 一级就是模型下拉，加载和报错文字直接写进输入框                                                                                                                                                    |
| 单一可折叠 Trace：摘要一行，展开为步骤树                  | shadcn Trace（2026-10）、Claude Code 三档详略             | 已有思考折叠和步骤时间线；深度研究是一段英文原始日志，Agent 运行另用一套旧组件                                                                                                                    |
| 工具卡、逐工具审批、内联澄清提问                          | AI SDK 6、LibreChat 0.8.9、Gemini Tasks                   | 没有逐工具审批卡（敏感写审批要等跟进方案 W7 的 EIM-M1–M5）；Agent 运行的"等待输入"已能在对话流里内联出表单（运行面板、Agent Explore、分享页、浮窗），但样式还是调试表单；首页和应用对话没有澄清卡 |
| 后台运行、活动中心、通知                                  | LibreChat Background Responses、Codex、Open WebUI 收件箱  | 切页即中断；解析、索引、运行只在各自页面里轮询                                                                                                                                                    |
| 生成式 UI：MCP Apps（2026-01-26 稳定）、A2UI 1.0          | Claude、ChatGPT、VS Code、LibreChat、assistant-ui         | Agent 运行已用 x-card 渲染 A2UI v0.9 卡片（运行面板、Agent Explore、分享页和浮窗）；对话里的 HTML Artifact 被 `sandbox=""` 冻结，后端把 MCP 工具结果压平，没有 MCP Apps 宿主                      |
| Artifact 是活文档：预览/代码切换、版本、分享、数据刷新    | Claude Artifacts、ChatGPT Space、Kimi                     | 只读面板，Markdown 显示源码，代码不高亮                                                                                                                                                           |
| 引用是可交互的证据链：悬停看片段，点击定位高亮            | Perplexity、NotebookLM、shadcn Inline Citation            | 有悬停卡和证据侧栏，打开原文却不定位                                                                                                                                                              |
| 知识摄取管道可视化、可逐步试运行                          | Dify Knowledge Pipeline、RAGFlow 0.25                     | 已有 Ingestion pipeline 画布（Agent 中心可建，带试运行、输出面板和数据流时间线），知识库设置和文档的切片方法也能改用流水线；但建库向导写死 naive，建库时选不了流水线，也看不到真实分段预览        |
| 描述即搭建：用自然语言生成 Agent，画布退为高级视图        | n8n Agents、LobeHub Agent Builder                         | 只有空白、模板、导入三条路                                                                                                                                                                        |
| 连接器目录、技能标准 SKILL.md                             | Claude Connectors、Agent Skills 标准                      | MCP 没有连接器目录和预设，新建只有空白表单和 JSON 批量导入；"技能"在 Home 指 MCP，与技能库撞名                                                                                                    |

## 3. 已经做好、必须保留的

方案建立在这些之上，不推倒：

- **外壳骨架**：icon rail + 二级面板 + 浮起的圆角主卡片、hover flyout、⌘K（分组、范围切换、实体搜索）、页头 portal、移动端 sheet。与 Codex 桌面版同向，继续沿用。
- **色彩令牌 2.0**：OKLCH 种子 → 12 阶色阶 → 128 个语义角色。六套方案 × 明暗 × 对比度 × 主操作风格都有 WCAG 合同测试，还有在浏览器里运行的品牌色生成器。
- **对话底座**：Home、Explore、Studio 共用改写自 AI Elements 的 ChatTranscript 和 ChatComposer。已有的能力包括：流式 Markdown 按句淡入加 2px 光标；发送后锚定问题、回到最新、轮次导航；"思考 N 秒"自动折叠；只报告实际执行的步骤时间线；文档名引用芯片、悬停卡、证据侧栏；表格和 Mermaid 工具条；回答头显示 ProviderLogo 和模型名。
- **生成式卡片**：Agent 运行已用 x-card 渲染 A2UI v0.9 卡片；html-report 已有 `allow-scripts` 的沙箱 iframe。
- **代码高亮**：Shiki 4 用 JS 正则引擎和单一 CSS 变量主题，换配色不用重新高亮；Monaco 主题也从令牌生成。
- **Agent 画布**：Tide 运行光环和流动边；OperatorTile 加分类色身份，画布、菜单和日志共用；Trace 工作台有 span 树和耗时条；Ingestion pipeline 画布带试运行和数据流时间线。
- **模型网关**：Key 只显示一次，有作用域、限额、首字延迟日志和 KPI 概览，模型 Tab 已是可搜索、可筛选的目录，是全仓最接近 OpenRouter、Vercel AI Gateway 水准的页面。
- **丰富空态**：Agents、Memory 的幽灵卡片 + 插画 + 行动卡；外观页带方案实时预览。
- **草稿与即时上屏**：未发送的草稿按会话保留在内存里，并按用户和租户隔离（首页和 Agent Explore 都有；不落存储，刷新或离开所在页面即丢）；发送时用户气泡先于请求上屏。

## 4. 问题全景

按用户能感知的主题归并，括号里是附录 A 的编号。

### 4.1 运行与会话：AI 产品的基本盘

- 首页直连模型和 MCP 的对话只在内存里，刷新就丢，没有 URL，也进不了历史（chat-01，需后端）。默认模式下首页二级面板是"选择一个应用"的空态，没有跨应用的最近对话（shell-01，需后端：跨应用分页会话路由、置顶字段和自由模式持久化都没有；过渡期只能在前端并发拉取最近几个应用的会话）。
- 切换分区会卸载首页，并 abort 正在生成的回答（`useHomeChat.ts` 的卸载 effect，这是跟进方案 W2 请求归属规则的一部分）。外壳上也看不到"有回答在后台"（shell-02）。要做到切页不中断，只能把请求归属移到外壳级注册表，并保留 W2 的失效规则（身份切换、新请求接管时仍要 abort）。这只覆盖同一标签页内的导航，刷新或关闭标签页后仍会丢；真正的后台运行、重连与通知归跟进方案 W7（ARCH-10 / RUN）。
- 长任务（解析、图谱和 RAPTOR 索引、Agent 运行）没有全局活动中心，也没有完成通知（shell-05，需后端：没有租户级任务聚合接口）。解析和索引状态已由服务端持久化，可以先在前端汇总；Agent 运行的任务列表、重连和通知，按跟进方案 W7 要等 durable Run（ARCH-10 / RUN）开放。当前也没有公共 Task 查询 API，读不回终态。
- 新对话快捷键 ⌘/Ctrl+N 在浏览器里被拦截。人在首页自由模式时，面板按钮和 ⌘K 的"新对话"是空操作。离开首页后，面板里没有新对话按钮，只能用 ⌘K，或在面板折叠时悬停首页图标打开 flyout（shell-03）。
- Explore 和首页读同一份会话，却用两套缓存和两套 UI，一边改名后另一边最多 2 分钟不同步（shell-07）。

### 4.2 输入框与模型选择

- @ 只是手写弹层：打开就把焦点抢到面板搜索框，列表只能 Tab 逐项移动，没有 ↑↓ 选择和 Esc 关闭；不能 @知识库或文档（需后端：首页直连走的 `enhanced_chat_sse` 请求没有 `kb_ids`，不做知识库检索，也不回传引用）；也没有 / 命令（chat-04）。
- Home 与 Explore 能力不一致：深度研究和联网开关只在 Explore 有（Home 直连的联网要后端改成服务端持有密钥）；语音听写两边都没有，只在搜索页；图片附件两边都只显示文件类型图标，没有缩略图；两边都没有 Esc 停止（chat-05）。
- 截图观察：首页输入框同时挤着应用芯片、"Turn context"行、模型选择器（带"正在加载模型…"和报错文字，可能由夹具造成）、并列的两个添加入口（+ 选技能/应用，回形针加附件），模型选择器的位置也别扭。
- "技能"在 Home 指 MCP 服务器，在技能库指 SKILL.md 资产，概念冲突（settings-05）。

### 4.3 回答之后

- 操作栏残缺且各面不一致：反馈全部关闭，首页和 Agent 运行对话不能重新生成，哪一端都不能编辑重发（chat-02，旧 chat-11 / contract-08 未关闭）。这些属于 ARCH-8（共享 Chat Workbench）尚未完成的重试与反馈部分，进度记在 ARCH-8 下，不另立项。
- 失败或中断、又没有正文的回答，连操作栏和重试都没有（chat-03）。
- 回答后没有追问建议；后端的相关问题接口只在搜索页用到（chat-10）。
- 元信息只有模型和时间。应用对话的后端（dialog_service）算了分段耗时和 token/s，却只拼进 prompt 字符串；首页直连和 MCP 对话走 `enhanced_chat_sse`，没有任何计时或用量输出，同样需要后端补（chat-11）。终帧还把整段 prompt 随 SSE 下发到浏览器，已登记为 SEC-9，由后端在流式和非流式补全中剔除。
- 标题直接截取首问，会话头部没有重命名、导出、分享（chat-12，部分需后端：自动标题和只读分享链接都没有后端接口，分享的权限与撤回规则跟跟进方案 W8 一起定义；导出纯前端可做）；全站没有打印样式（gaps-08）。
- 截图观察："Turn context · Submitted with this turn"在用户和助手两侧重复出现；助手头部用等宽字体显示时间戳；Artifact 卡片全宽、很高、纵向堆叠。

### 4.4 过程透明：Trace、深度研究、Agent 运行

- 深度研究和检索过程只是 `max-h-64` 盒子里的一段英文原始日志（chat-06；前端可以先按句式解析成逐行步骤，但每步命中了哪些文档、并发分支怎么配对，需要后端改发结构化事件）。
- Agent 运行对话（RuntimeChatMessageList，同时供运行面板、分享页、日志 transcript 和 Agent Explore 使用）还在用 ThinkWrapper、ReferencePanel 等旧组件，形成第二套对话语法（chat-09）。这是 ARCH-8 验收要求的 Agent runtime 迁移，按跟进方案 W5 的顺序推进（先 Agent Explore，再按风险迁移 Agent runtime），改动共享 props 后要回归上述调用方，进度记在 ARCH-8。
- 等待态是通用转圈加"思考中"，看不出 AI 正在做什么（chat-13、design-06）。

### 4.5 证据链（RAG 差异化）

- 引用"查看原文"只拼出 `/document/:id/preview?name=`，在新标签页打开第 1 页，不定位也不高亮（knowledge-01）。
- 搜索应用答案页用旧的 ReferenceMarker、ReferencePanel 和大量 `!important` 内联样式（knowledge-03）。截图里来源在回答卡、右栏和证据面板各出现一遍。
- 切片内容有 7 处各自声明的净化白名单（去重后 5 种），表格切片在切片页和检索测试里被压成一串文字（knowledge-04）。
- PDF 预览依赖 `react-pdf-highlighter 8.0.0-rc.0`（锁定 pdfjs 4.4），所有页都按第 1 页的尺寸换算高亮坐标，没有页码、缩放、查找和缩略图（stack-08、knowledge-06）。

### 4.6 生成式 UI 与产出物

- 对话里的 HTML Artifact 用 `sandbox=""` 冻成静态页面；md、json、csv、py 一律按纯文本显示（chat-07、stack-09）。
- 没有通用的沙箱 iframe 宿主（html-report 有一个专用的），无法承载 MCP Apps；后端又把 MCP 工具结果压平，`_meta.ui` 传不过来（stack-09，需后端）。
- 代码块头部只有语言名和复制按钮，和表格、Mermaid 的完整工具条不一致（chat-08）。

### 4.7 Agent / Studio 编辑器

- **布局**：右侧常驻 320px 的资产统计 rail，节点配置和运行面板用 `top-20` 加魔法数偏移的 Sheet 盖在画布上（agent-01）。截图里开始节点的字号明显过大。
- **编辑手感**：没有撤销重做、快捷键和多选复制，节点右键菜单弹不出来（agent-02）。添加节点是 300px 宽的手风琴硬编码列表，不能搜索，也不能在连线上插入（agent-03）。没有 MiniMap、自动布局和吸附（agent-09）。
- **调试**：单步调试有两套保存语义，一个入口先保存，另一个直接用库里的旧配置；非 Code 节点的结果是原始 JSON；Trace 不能定位到画布节点（agent-04）。
- **发布**：没有预检清单，节点也没有"配置不完整"的错误态（现在只有运行失败态，以及失效 LLM 的个例红态）（agent-05）；"保存中 / 有未发布修改"不可见，发布说明只进了 toast、没有入库（需后端小改：PUT 没有把 description 传给 save_or_replace_latest），版本只能看不能恢复（agent-08）。
- **AI 参与**：后端 `fine_prompt` 已就绪，前端零调用（agent-06）；没有"描述即搭建"（agent-07，需后端）。
- **其他**：两套提示词编辑器（Lexical 和 md-editor）语义不一（agent-12、stack-02）；7 个搜索类工具共用一个 Search 图标（agent-10）；模板卡看不出"里面有什么"（agent-13）；Studio 应用和 Agent 是两套创建对话框，Studio 还强制填描述（agent-14）；全局 mousemove 和内联 Context 值让所有节点逐帧重渲染（agent-11）。

### 4.8 知识库、检索与记忆

- 建库向导写死 `parser_id:'naive'`，解析器选择只有静态 SVG，建库时选不了流水线，也看不到真实分段（knowledge-02，旧 knowledge-01 未关闭）。
- 检索测试台的参数藏在覆盖层里；权重有三处入口（混合模式的向量/稀疏、融合模式的文本/向量、高级区的 vector_similarity_weight），前两者控制召回融合，后者是最终打分权重，界面没有说明区别；结果醒目地显示 chunk ID，也跳不到原切片（knowledge-05）。
- 知识库卡片看不出索引健康，没上传头像的库全是同一个书本图标（knowledge-07）。
- 上传绑在弹窗里，进度只有 0 和 100 两档，上传和解析没有连成一条进度（knowledge-08）。
- 知识库详情没有"问答"入口（knowledge-09，需后端：`/chat/completions` 不带 chat_id 时不读 dataset_ids）。过渡期可提供"用搜索应用提问"，用已有的 `POST /searches` 创建只绑定本库的搜索应用；长期形态与 ARCH-9 Projects/Spaces 试点一起规划。
- Memory 像数据库控制台：`#id` 排在第一行，卡片平铺不分组（knowledge-10）。以下几项需后端：更正记忆内容（UpdateMessageRequest 只能改 status）；召回测试显示分数（`/messages/search` 不返回相似度，结果按 valid_at 倒序）；在对话里显示用了哪些记忆（Agent 运行流没有结构化的记忆读取或写入事件）。
- 设置页的解析器名称写死英文，保存时不提示重新解析，也没有未保存提醒（knowledge-11）。

### 4.9 设置、模型与目录

- "模型"分散在模型提供商（默认、供应商两个 Tab）和模型网关两个入口，"可连接的供应商"实现了两遍；网关模型 Tab 已是可搜索、可筛选的目录，但只服务网关。模型行看不到上下文窗口（租户模型已有 max_tokens，可纯前端展示）；价格、单模型延迟和错误率需后端（settings-01、02、11）。
- 连接测试只显示有效或无效：后端已返回探测模型名和归类好的失败原因，前端 onVerify 只回 isValid，失败又被空 catch 吞掉；已保存的连接无法复测，需后端（`/connection` 只接受带明文 api_key 的候选连接）（settings-03）。
- MCP 没有连接器目录、品牌 Logo、真实健康状态和工具级开关；MCP 同时出现在设置和工具分区（settings-04、shell-07）。目录和 Logo 可纯前端做；工具开关的状态已能持久化，但运行时不过滤 enabled=false 的工具，后端补上之前开关就是 ENG-6 禁止的无行为入口；测试结果跨会话持久化和 OAuth 也需后端。
- Explore 的"应用市场"是假的：按钮没有 onClick，"已添加"按 `status==='1'` 判断，而这个字段其实表示"有效"（settings-06）。
- 两套 API Key 分在两个分组，工作区 Key 列表仍返回明文（settings-07，旧 settings-03 未关闭；归 ENG-8 的 API Key 轮换，需后端）。前提是先把 SDK 密钥和 Agent 分享用的 beta token 拆成两类资源：分享凭证目前固定取 `tokens[0].beta`，直接改成"只显示一次"会让已发布链接失效。
- 设置内没有搜索，⌘K 只能跳到设置首页（settings-08）；没有工作区就绪度总览（settings-09）；管理组对所有人可见，用户管理还要二次 admin 登录，token 存在 localStorage（settings-10）；没有个性化设置（settings-12）。

### 4.10 外壳与信息架构

- 路由没有元数据：全站没有逐页的 document.title，分区靠路径前缀推断，面包屑各页手写（截图里 `>` 和 `/` 混用）。错误边界只挂在根路由，任一页面崩溃，导航也会一起丢（shell-06、quality-05、quality-09）。
- ⌘K 是封闭的 8 条命令加 3 类实体，没有路由级命令、最近访问和"问 Cairvo"兜底（shell-04）。
- rail 只有 4 个一级入口；"搜索"一词同时指搜索应用和 ⌘K（shell-07）。
- 桌面端仍用系统标题栏，形成双层标题，导航清单也与 Web 分叉（shell-09）。
- 快捷键少，也没有速查面板（shell-08）；账户菜单单薄（shell-11）；Web 二级面板宽度固定（shell-12）；页面切换和导航没有过渡，motion 库只在首页 composer 使用（shell-10）。
- 截图观察：二级面板的选中态是饱和蓝块，和中性的 rail 不协调。Studio 页脚的"状态筛选与更新时间排序作用于当前页。"是 ENG-9 要求的口径说明，不是泄露的实现细节；只要还在用当前页筛选就不能删，只能调整位置和措辞（例如收进筛选器旁的说明提示）。根本做法按 ENG-9：不再把 Dialog 的 status（有效/软删除标志）当作"已发布/草稿"，移除这组筛选和 KPI；等服务端提供全量筛选和排序后，再去掉口径说明。

### 4.11 视觉系统

- **弹层出入场**：8 个文件（7 个 ui 原语加 code-script-editor）写了 `animate-in`，但没装 tw-animate-css，全部不生效；也没有时长和缓动令牌（design-03、quality-01，旧 design-24）。
- **深色对比度**：求解器按刚好达标（4.6:1）取文字阶，ink 深色强调文字对 surface 约 5.5:1，语法色约 4.6:1，所以链接和代码发闷（design-02）。
- **字阶**：没有语义字阶，页面标题在 15–30px 之间各写各的；中文里的引号和省略号由 Geist 渲染；深色模式全局加了字距（design-04）。
- **AI 身份**：品牌标是 lucide `Waves`，思考态是 LoaderCircle，ink 的 AI 渐变色相 255→290→330 正是蓝紫粉（design-06）。
- **密度**：只缩控件不缩行，紧凑档控件 28px，小于 DreamJira 的 32px（design-05）。
- **滚动条与阶梯**：全局隐藏滚动条，Windows 上看不出区域能滚动（design-08，旧 design-13）；圆角、层级、图标尺寸各有一套写法，焦点环有 4 种画法（design-09、design-13）；Badge 按色相命名（design-12）。
- **身份与数据呈现**：实体头像缺省是首字母平涂，产品代码里 65 处 `<EntityAvatar>`（另有 4 处在测试）只有约 21 处传了 kind 或 icon（design-07）；用量图是手写的 div 柱，没有共享图表原语（design-10）；全局 Markdown 正文用次要色（design-11）。
- **Mist 取值**：Mist 方案与 DreamJira Mist 取值不一致，也没有 DreamJira 令牌词汇的映射层（design-01）。

### 4.12 体验质量

- **感知速度**：默认加载态是居中转圈卡片，骨架屏只在 3 个文件里用到；约 30 处 `isLoading: isFetching` 让翻页和搜索时整页闪一下（quality-03）；路由没有意图预取和进度条（quality-04）。
- **容错**：没有未保存离开保护（quality-06，旧 interaction-08）；101 个 mutation 零乐观更新，删除不能撤销（stack-05、quality-07）；列表状态不进 URL，返回时丢页码和滚动位置，名称是按钮不是链接（quality-08）。乐观更新与撤销不在 ENG-3 范围内（ENG-3 只管 mutation 错误反馈），由本方案跟踪。
- **无障碍**：jsx-a11y 规则全部降为 warn，实测 157 条告警，列表不能用键盘导航（quality-10）；路由切换不播报（quality-09）；JS 驱动的动效不受应用内"减少动效"控制（quality-02）。a11y 棘轮和 4.14 的长会话虚拟化属于 ENG-3（进行中），进展记在 ENG-3。
- **登录注册**：只有一张卡片；注册页不做校验（quality-11）。忘记密码入口按 SEC-7 暂停期要求继续隐藏：后端重置流程尚未满足一次性授权、原子消费和旧会话失效，SEC-7 完成前不做找回密码界面。
- **响应式**：按视口断点写，主面板宽度变化时组件不跟着调整（quality-12）。

### 4.13 公开分享、浮窗与发布

- 匿名访客会看到 shared_id、beta token、Begin inputs 这类开发者文案；开场白一屏出现两次；消息里的助手是中性的 Bot 图标；刷新就丢会话（gaps-01；恢复会话需后端提供凭 beta token 读取消息的接口，按 runtime 规则不能把消息写进 localStorage，前端最多只保存 sessionId 这类恢复元数据）。
- 只有 Agent 能发布，Studio 对话应用和搜索应用不能公开分享或嵌入（gaps-02）。后端 `/chatbots`、`/searchbots` 公共接口已经存在，但开放前要过账本的两道门槛。一是 SEC-8：跨租户授权验证完成前，Studio 发布/分享入口继续隐藏（MultiRAG `5fa829ec` 已让 `/chatbots` 经 `validate_iframe_access` 绑定 token 租户，仍要按 SEC-8 完成授权验证后关闭该条）。二是 ENG-8：要先有不可变 publication、草稿 revision、幂等发布与回滚，以及绑定应用、可撤销的分享 token。另外，当前分享凭证固定取第一条 Token 的 beta（旧 settings-01 未关闭），而且是租户级凭证：持链人能访问同租户全部有效的 Agent、对话应用和搜索应用。
- 浮窗深色主题被浅色默认值覆盖，所有表面压成同一种颜色（gaps-03）。发布后看不到会话、访客、token 和点赞数据（gaps-04，需后端）：`/system/stats` 只有会话数、访客、平均轮次是真实数据，token、速度、点赞从未写入；Agent 的公开会话因内连接 Dialog 被过滤，也不能按单个应用过滤。
- 自动填表的文案要求用户手写 `{{字段名}}`，其实后端 process_docx 已能自动识别空单元格和下划线；前端只收 .docx，后端的 xlsx_marker 和 docx_marker 定位结构没用上（gaps-05）。AI 填写一键覆盖，不能逐项审阅（gaps-06）；不能安装为 PWA（gaps-07）；桌面端没有全局快捷键唤起（gaps-09）。

### 4.14 性能

- 任何路由首次访问都要下载约 750 KB gzip 的静态闭包（73 个 chunk，含 KaTeX、jsencrypt、x-card 和整条消息渲染链），登录页和嵌在第三方站点的 widget 也不例外。现有门禁（ENG-4）只限制 JS 总量、入口 chunk（约 77 KB）和最大单 chunk，首屏静态闭包没有 CI 门禁（stack-01）。这个缺口已登记在 ENG-11（2026-11-17 记录首屏约 731 KB），login、home、share/widget 的路由级预算放在 ENG-11 下推进。
- 长会话全量渲染，每个流式 chunk 都让所有历史消息重新执行 MessageParts，没有 content-visibility，也没有虚拟化（stack-07、chat-14）。

## 5. 技术选型裁决

"保持"指不动；"用起来"指已经装了但没用好；"替换""删除""引入"都是建议的变更。

| 领域           | 现状                                                                                                                                                   | 裁决                                | 理由与做法                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 框架与构建     | React 19.3.1、Vite 8.3 + Rolldown、TS 7、Tailwind 4.3                                                                                                  | 保持                                | 整体不旧于主要开源竞品；Vite+ 只观察                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| React 19.3 API | ViewTransition、Activity、useOptimistic、useEffectEvent 零采用                                                                                         | 用起来                              | Activity 保留首页滚动位置、Studio 未保存表单和 Agent 画布视口。hidden 时 effect 会被清理，所以要先做两处改动：首页先把 detachRequest、resetConversation 移出卸载 effect，改由外壳级 chat-run-registry 管理，否则隐藏时仍会 abort 并清空会话；Agent 画布隐藏时 autosave 的定时器会被清掉，要在隐藏或离开时主动保存一次。ViewTransition 做主卡片切换和 Artifact 展开；useOptimistic 配合 mutation                                                                                                                                                                                                             |
| React Compiler | 未开启，手写 useMemo/useCallback 调用约 1,140 处（非测试代码）                                                                                         | 试点                                | 先用 annotation 模式覆盖对话和画布，用 Profiler 对比后再扩大                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 路由           | react-router-dom 7，只当路由表用                                                                                                                       | 先用好，再升 8                      | route.lazy + loader 预取、useNavigation 进度条、useBlocker、handle 元数据；v8 对 React、Node、Vite 的要求都已满足。不换 TanStack Router                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 原语           | 21 个分散的 @radix-ui 包，33 个文件用 forwardRef                                                                                                       | 收敛，新增走 Base UI                | 合并为 radix-ui 单包；Combobox、Autocomplete、Drawer、带过滤的菜单、模型选择器用 Base UI；不做全量迁移                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 组件来源       | 没有 components.json                                                                                                                                   | 引入 shadcn registry                | 拉取 Trace、Plan、Queue、Confirmation、Context、Inline Citation、Questionnaire 作结构参考，用本仓令牌重写后放进 patterns                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| AI 组件        | Ant Design X 的 x-sdk、x-markdown、x-card                                                                                                              | 删 x-sdk，保留 x-markdown 与 x-card | x-sdk 在 src 中零引用；删除时同步去掉 package.json 依赖和 vite.config.ts 的分包条目，并修改 docs/agent-guidance/frontend.md、eslint.config.js 注释和团队手册里"保留 x-sdk"的说法；x-card 继续承载 A2UI，只拆出首屏；x-markdown 留在 StreamingXMarkdown 门面后，用真实回放与 Streamdown 做基准，有卡顿再换                                                                                                                                                                                                                                                                                                   |
| 流式消息模型   | SSE 解析与传输已统一在 src/lib/streaming（ARCH-1）；分歧在各域的事件映射与 reducer，Home MCP 流仍在页面层直接 fetch、自己读 token                      | 统一为 parts 模型                   | 前端 adapter 把各路流映射为 text、reasoning、tool、source、approval、plan 等 part（参照 AG-UI 事件和 AI SDK parts），Trace 和审批卡只认 part；Home MCP 流迁回领域传输。approval 和 plan part 只在后端提供对应事件后启用，审批依赖跟进方案 W7 的 EIM 阶段。后端是 Python，不引入 AI SDK 或 TanStack AI 运行时                                                                                                                                                                                                                                                                                                |
| 生成式 UI      | 已有 A2UI 卡片（x-card + 自定义 catalog）和 html-report 的 allow-scripts 沙箱；Artifact 面板是 `sandbox=""` 静态预览，没有通用宿主；MCP 结果被后端压平 | 补通用宿主                          | 把 report-frame 的沙箱写法抽成 SandboxFrame，Artifact 与 html-report 共用；MCP Apps 用 @mcp-ui/client 的 AppRenderer 承载，前提是后端透传 `_meta.ui` 并代理 resources/read（需后端，列入 AW5）；A2UI 继续用现有 x-card 渲染器，A2UI 1.0 官方 React 渲染器只评估                                                                                                                                                                                                                                                                                                                                             |
| Markdown 编辑  | @uiw/react-md-editor，已退化成 textarea                                                                                                                | 替换                                | 抽出现有 Lexical prompt-editor 内核，提示词编辑器和 composer 共用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 代码编辑       | Monaco 0.52（作为 peer 自动安装，产物 14 MB），只服务 3 个小编辑器                                                                                     | 替换                                | CodeMirror 6 + lang-json/python + JSON Schema 校验，配色读 code 和 syntax 角色                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| PDF            | react-pdf-highlighter 8.0.0-rc.0 + pdfjs 4.4                                                                                                           | 替换                                | react-pdf-highlighter-extended，或 react-pdf 10 + 自建高亮层，再对 EmbedPDF 做一次 spike；升级到 pdfjs 5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 图可视化       | G6 单块 1.4 MB，同时承担知识图谱和搜索思维导图                                                                                                         | 拆分                                | 思维导图改用 xyflow + d3-hierarchy 或 elkjs；知识图谱暂留 G6，节点多时评估 sigma.js                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 画布能力       | 没有自动布局和编辑历史                                                                                                                                 | 引入                                | 懒加载 elkjs（支持迭代容器）；zundo 2 的 temporal 中间件或 immer patches 做撤销重做                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 列表虚拟化     | 长会话和主要资源列表没有（只有表格列配置的手写窗口化）                                                                                                 | 引入                                | 先上 content-visibility；长会话和日志再上 virtua（支持反向和动态高度）或 TanStack Virtual。归 ENG-3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 图表           | ECharts 只用于沙箱报告，用量图手写 div                                                                                                                 | 新建原语                            | ChartFrame + 纯 SVG Sparkline；复杂图懒加载 echarts/core                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 图标           | RAGFlow 的 iconfont.js 220 KB 同步加载，A2UI、Note 算子显示为空白                                                                                      | 删除（先迁走厂商图标）              | resolveProviderLogo 只认 provider-icon.tsx 里 import.meta.glob 列出的 34 个本地 SVG，IconMap 中其余约 50 个 sprite 名（OpenAI、DeepSeek、Anthropic、Ollama、通义千问、火山引擎、文心一言、MiniMax 等）只靠 iconfont.js 显示。先把 src/assets/svg/llm 下已有的文件加入 glob 或修正 IconMap 名称，其余映射到 @lobehub/icons-static-svg 单图标，没有对应图标的补本地 SVG，并加测试确认 IconMap 每一项都解析为图片而不是 sprite；算子图标改为 Lucide 优先；最后删除 index.html 的脚本、public/iconfont.js 和 icon-font.tsx，同步修改 desktop/build/staging-policy.mjs 与 desktop/tests/packaging/stage.test.mjs |
| 动效           | motion 14；弹层 animate-in 类失效                                                                                                                      | 保持并修复                          | 加动效令牌；用 tw-animate-css 或自写 keyframes；MotionConfig 接入应用内"减少动效"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 首屏           | KaTeX、jsencrypt 静态进入首屏                                                                                                                          | 懒加载                              | 有公式才加载 KaTeX；登录提交时再 import jsencrypt；widget 和 share 评估独立入口；按路由统计闭包的预算归 ENG-11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 数据层         | TanStack Query 5，没有 queryOptions 工厂，零乐观更新                                                                                                   | 用起来                              | queryOptions 和 mutationOptions 工厂、onMutate 回滚、keepPreviousData；TanStack DB 只评估                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| CSS 平台       | browserslist 下限 Chrome 111 / Safari 16.4                                                                                                             | 渐进增强                            | field-sizing、anchor positioning、scroll-driven 动画放在 @supports 下，Electron 壳内可直接用；container queries 现在就用                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Lint           | ESLint 10 + 自定义规则                                                                                                                                 | Oxlint 作前置                       | Oxlint 只做快速前置检查，安全和无障碍规则留在 ESLint；不引入 Biome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 协议           | MCP 管理页不显示协议版本                                                                                                                               | 跟进 2026-07-28 修订（需后端）      | MultiRAG 的 MCP 客户端先跟进 2026-07-28 修订，并在 MCP 服务器详情或测试接口中返回 protocol_version 和 capabilities；前端再显示协议版本和扩展协商结果（ui、tasks）。技能导入导出兼容 SKILL.md。列入 AW5 的"依赖后端"                                                                                                                                                                                                                                                                                                                                                                                         |

不建议的方向：换成 Next.js 或 TanStack Start（SPA + Electron 形态不受益）、把 Radix 全量迁到 Base UI、现在就把 x-markdown 换成 Streamdown、引入 Biome、引入 AI SDK 或 TanStack AI 的运行时。

## 6. UI 方案

### 6.1 设计原则

1. **一个工作台，三种模式。** 对话（问答）、任务（Agent 执行）、构建（编排与配置）共用同一个 composer、同一套 Trace、同一套证据组件，不再每个页面各有一套对话语法。
2. **输入框是能力路由。** 知识库、连接器、技能、联网、深度研究、模式和力度，都从 composer 的 + 菜单、@ 和 / 进入，以可移除的芯片呈现；后端还不支持的项显示为禁用并说明原因。
3. **过程可审计，默认安静。** 回答上方只有一行摘要（思考 12s · 检索 3 次 · 引用 8 段 · 2 个工具），展开后才是步骤树。
4. **证据是一等公民。** 回答 → 引用 → 原文定位高亮是一条不中断的路径，这是企业 RAG 相对通用聊天产品的差异化。
5. **运行可追踪。** 解析和索引在服务端执行，离开页面后仍可在活动中心查看进度。回答和 Agent 运行仍是请求绑定的 v1 流：被动卸载或刷新只断开本地连接，不保证服务端继续计算。接入外壳运行注册表后，它们只在当前标签页内切页不中断，刷新或关闭标签页即中断。刷新后恢复、跨设备回到现场、持久任务列表和系统通知，要等跟进方案 W7 的持久 Run（RUN-F2–F5、ARCH-10）达到开放门槛后再提供。
6. **丰富，但不重复。** 保留 Logo、头像、身份色和插画空态。要删的是重复的元信息（重复的 Turn context、三遍来源、两处 MCP 入口），不是身份和颜色。
7. **快的感觉。** 贴合版式的骨架、乐观更新加撤销、悬停预取、克制的视图过渡。
8. **AI 有自己的样子。** 自有图形「承」和状态动画，单侧的"潮汐"渐变（青 → 蓝 → 强调色），只出现在 AI 时刻。产品中英文都叫 Cairvo，不另设 AI 角色名（2026-11-23 已定，见 §8）。

约束沿用已批准的方向：保留 rail + 二级面板 + 浮动主卡片；控件 32px、行高 36/44、圆角 4/6/12；默认方案是 2026-11-18 批准的 ink；所有依赖后端的设计都标"需后端"。

### 6.2 外壳

```
┌──┬────────────────┬──────────────────────────────────────────────┐
│◉ │ 对话            │ 会话标题 · 面包屑（来自路由 handle）     [⋯] │
│✎ │ ⌕ 筛选对话       │━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│ ← 2px 进度条
│  │ 应用            │                                              │
│◐•│  ▣ 产品手册助手   │        主卡片（页面级错误边界）                │
│◇ │ 今天            │                                              │
│▤ │  ▣ 合同条款对比   │                                              │
│⚒ │  ◈ 直连模型对话   │                                              │
│⌁ │ 昨天 …          │                                              │
│⚡3│                 │                                              │
│◯ │                 │                                              │
└──┴────────────────┴──────────────────────────────────────────────┘
```

- **rail**：从上到下是品牌图形「承」、常驻"新对话"（Web ⌘⇧O，桌面 ⌘N）、五组（对话、探索、知识、构建、连接）、底部"活动"（运行中计数和完成未读点）、头像菜单。五组以桌面端已有分组（`src/components/layout/desktop/desktop-navigation.ts` 中的 WORK/DISCOVER/KNOWLEDGE/BUILD/TOOLS）为基础，新抽出共享清单 `navigation-manifest.ts`，Web rail、移动 sheet、桌面 rail、⌘K 和面包屑都从它派生；"连接"组承接现有"工具"组（AI 工具与 MCP）。有回答在当前标签页后台运行时，"对话"图标显示主色呼吸点。
- **首页二级面板**：分为应用（彩色头像，可展开）和按日期分组的跨应用最近对话，行首是应用头像或 ProviderLogo。置顶需后端（会话表没有 pinned 字段），落地前不做，或明确标注"仅本机"。跨应用列表在后端提供分页聚合接口前，用 useQueries 并发拉取最近更新的 N 个应用的会话过渡，终态需后端。顶部是 32px 筛选框，⋯ 菜单首批只做重命名和删除。直连模型的对话要等后端落库后才能出现在这里（chat-01）。面板宽度 220–360px 可拖，拖到下限即折叠。
- **主卡片**：路由 `handle: { section, titleKey, crumb }` 统一派生标签页标题、面包屑和分区。Layout 下加页面级 errorElement，崩溃只替换主卡片，根级边界保留；这会改变 runtime.md「错误处理」里"由无 path 顶层分支统一声明 ErrorFallback"的合同，需在同一提交中更新该专题，并补 ENG-7 route-recovery 测试，分别覆盖页面级和根级的恢复、重试与焦点。懒加载时保留旧页面，顶部显示 2px 进度条；切换用 120ms 交叉淡入。
- **活动中心**：360px 宽的 Popover，分两组。"进行中"包括按知识库聚合的解析进度、图谱和 RAPTOR 索引、本标签页内的后台回答；"最近完成 / 失败"里，失败项可以重试或跳到日志。第一阶段只跟踪本次会话里用户自己发起的任务；跨会话聚合需后端接口；Agent 运行的任务列表和通知等跟进方案 W7。
- **⌘K**：增加路由级命令（如"上传文档到当前库"）和最近访问；实体扩展到智能体、搜索应用、记忆、技能、连接器；支持设置子页深链；末尾固定一条"问 {brandName}：…"。
- **头像菜单**：团队名和角色、配色方案与密度、键盘快捷键（⌘/ 打开速查面板）、API 文档、更新日志与版本号。
- **桌面端**：本轮保留系统原生标题栏，双层标题暂不处理。CLP-DX1 把 frameless/自绘标题栏、多窗口、通知列为非目标，CLP-DESK 的范围也不含自绘标题栏。`titleBarStyle: 'hidden'`、titleBarOverlay，以及全局快捷键唤起的 Quick Ask 浮窗（PlatformPort 目前没有全局快捷键或多窗口能力），都要先在 docs/client-platform/DECISIONS.md 新增 CP 决策，再在 ROADMAP 立 CLP 条目，不并入本轮 UI 波次。

### 6.3 对话（Home、Explore、Studio 预览、分享页共用）

输入框：

```
┌──────────────────────────────────────────────────────────────┐
│ [▣ 产品手册 ×] [⌁ GitHub ×] [◎ 联网 ×]                         │ ← 范围芯片
│ 向 Cairvo 提问，@ 引用知识库或应用，/ 使用命令               │
│                                                              │
│ [+]  [⚡ 自动 ▾]                                [🎙]  [↑]     │
└──────────────────────────────────────────────────────────────┘
```

- **+、@、/ 是同一个 cmdk 菜单的三个入口**：附件、知识库、应用、连接器、技能、联网、深度研究、命令，按能力门控。菜单锚定在光标处，可以用键盘操作，焦点始终留在草稿里。@知识库需要后端让 `enhanced_chat_sse` 接收 `kb_ids` 并回传引用（chat-04）。"联网"在应用对话里走现有 internet 开关；Home 直连模式只能由客户端传 tavily_api_key，违反"密钥只留服务端"，需后端改成服务端持有密钥的开关，在此之前显示为禁用并加 Tooltip。"深度研究"只在有检索源的应用对话中出现。"技能"目前没有对话接口消费，v1 只做浏览和跳转，注入对话需后端。
- **不放"对话 / 任务"切换**：Home 目前不能运行 Agent，Agent 执行仍从 Agent Explore（或 Agent 分享页）进入。通用"任务"模式需后端提供无需预选 Agent 的执行入口，并满足跟进方案 W7 的持久 Run 开放门槛，在此之前不出现。
- **模型选择改为"力度 + 模型"**：一级是自动、快速、深度思考。后端没有自动路由；应用对话只接受 llm_id，Home 直连只接受 llm_name，两条接口都不支持推理强度参数。三档先定义为前端到具体模型的可见映射："自动"＝租户默认对话模型，"快速"和"深度思考"对应的模型由用户在设置中指定；租户模型还没有 features.thinking 这类推理能力标记，不能自动识别。真正的自动路由和推理强度需后端。二级展开供应商和模型，带 ProviderLogo 和上下文长度（租户模型已有 max_tokens）；价格需后端（settings-02）。加载失败不在输入框里写字，改为芯片上的警示点加 Tooltip。
- **上下文占用环**：现有 ContextManifest 只记录本轮选了哪些资源，没有 token 数；应用对话的系统提示和检索片段只在服务端拼装，前端算不出占用。需后端在终帧返回结构化 usage（prompt_tokens），再配合 max_tokens 计算，在此之前不显示。运行中发送键变成停止键；按 Esc 停止；草稿为空时按 ↑ 编辑上一条。
- **范围只显示一次**：在用户气泡下用小芯片显示，不再在两侧重复"Turn context"。

回答：

```
◉ Cairvo · DeepSeek ▾                                4.2s · 首字 0.8s
▸ 思考 12s · 检索 3 次 · 引用 8 段 · 调用 2 个工具
正文…………………………………………[1]……………[2]
来源：▤ 合同模板.pdf  ▤ 采购制度.docx  +3
[复制] [重新生成 ▾] [赞] [踩] [朗读] [⋯]
↳ 违约金上限怎么计算？   ↳ 和去年的条款有什么不同？
```

- **头部一行**：品牌图形「承」（空闲、思考、输出、完成四态）+ 模型药丸 + 前端测得的耗时和首字延迟。token 和 tok/s 等后端在终帧给出结构化 usage 后，放进悬停卡。头部的等宽时间戳改为悬停显示。
- **Trace**：一行摘要，展开为步骤树，包括思考、检索（查询词、命中数、耗时）、工具卡（入参、出参、耗时、状态）和子 Agent。深度研究日志先由前端解析成步骤（v1）：按到达顺序逐行显示查询、命中条数与耗时、充分性检查和下一步问题，不把命中数配对到具体查询（并发分支的日志会交错），也不显示命中文档；按查询分组、每步来源图标等结构化事件要等后端（v2）。
- **Agent 运行对话迁移**：按跟进方案 W5 执行，第二条路径为 Agent Explore，保留 Begin inputs、附件、A2UI、人工输入、草稿/已发布/session 执行来源和取消合同，并回归 Share、Log transcript、运行面板等 RuntimeChatMessageList 调用方。ThinkWrapper、ReferencePanel 等旧组件要等 Agent 运行对话和搜索答案页（search-summary-card）都迁走后再删。进度记在 ARCH-8。
- **失败态**：ChatAnswerStatus 增加"重试""换个模型重试""重新登录"，没有正文也渲染操作栏。
- **操作栏各面一致**：复制、重新生成（可换模型）、点赞点踩（点踩可选原因，调 `PUT …/messages/{msg_id}/feedback`）、朗读（配置了 TTS 时）、⋯ 删除此轮。反馈和服务端删除只对有会话的应用对话可用；Home 直连模型和 MCP 对话在 chat-01 落库前隐藏点赞点踩，"删除此轮"只删除本地内存中的轮次（服务端删除需后端）。用户消息可以原位编辑后截断重发。
- **追问芯片**：v1 复用 `/chat/recommendation`。它只根据问题生成改写式的相关问题，不读回答，用租户默认模型，所以芯片按"相关问题"呈现，不做"生成对比表"这类动作芯片。最新一条回答完成后懒加载 3 条，失败时静默不显示。基于回答上下文的追问需后端给 `/chat/recommendation` 增加 follow-up 模式。
- **会话头 ⋯**：重命名、导出（Markdown、打印 / PDF、Word）、复制全文、删除（应用会话已有 PATCH 和 DELETE）。固定（会话表没有 pinned 字段）、分享（后端没有会话分享接口）和首轮完成后异步生成标题都需后端。Home 直连对话的重命名和删除要等 chat-01 落库。
- **切页不中断**：外壳级的 chat-run-registry 保存 AbortController 和已收到的内容，路由卸载时只退订、不 abort；身份切换和新请求接管时仍按跟进方案 W2 的规则 abort。首页用 `<Activity>` 保住滚动位置。这只覆盖同一标签页。
- **长会话**：先给历史轮次加 `content-visibility: auto`，超过约 80 轮再上 virtua（归 ENG-3）。
- **后续（需后端，归跟进方案 W7）**：工具审批卡只提供"允许一次 / 拒绝并说明原因"，不提供"始终允许"（有副作用的 MCP 调用必须每次二次确认）。审批绑定持久 interaction ID、动作与参数版本、有效期，依赖 EIM-M1–M5 和 O1/O2 门禁。内联澄清提问卡复用 EIM-U14 的待输入 InteractionSession，并用于 MCP elicitation。运行中插话与排队在 RUN 开放门槛满足后各自验收。标注用到了哪些记忆需后端。

### 6.4 证据链

- 保留引用芯片的悬停卡。点击后在证据侧栏里打开 SourceViewer，不再新开标签页：PDF 跳到对应页并高亮 positions，"引用 2/5"的上一处、下一处平滑滚动。数据来自已有的单切片接口。
- 文本类预览（txt、md、docx、表格）没有切片锚点。DocumentPreview 的 props 虽声明了 selectedChunkId，组件内部并未使用，只有 PdfPreview 消费 highlights。文本类定位要按切片正文在预览文本中匹配并高亮，匹配不到时退回显示切片原文，不承诺精确定位。
- 替换 PDF 阅读器后补上工具条：页码 n/N、缩放与适合宽度、Ctrl+F 查找、缩略图和大纲；高亮按每页的实际尺寸换算。
- 搜索应用答案页迁到共享部件：AnswerIdentity（搜索应用头像 + 模型 Logo）、CitationChip、SourceStrip、RunTimeline。用"答案 / 来源 / 思维导图"三个标签页，来源只出现一次；删掉内联 `<style>`，改用 `.prose`。
- 来源提前显示需后端：目前对话和搜索在生成期间 reference 恒为空对象，引用只随终帧到达，所以 SourceStrip 在回答结束后才出现。"检索完成即显示来源"要后端在检索结束时先下发引用（或在检索完成事件中附 doc_aggs）。
- 统一 ChunkContent：一份净化策略，表格按 markdown-table 渲染，图片切片用 DocumentImage。

### 6.5 生成式 UI 与产出物

- **SandboxFrame**：新建 `patterns/sandbox-frame.tsx`，把 html-report 的 report-frame 写法抽出来共用。sandbox 只给 `allow-scripts`，不加 allow-same-origin、allow-popups、allow-top-navigation、allow-forms。内联 CSP 以现有产物面板为底线：`default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; connect-src 'none'; form-action 'none'; base-uri 'none'`，只放开内联脚本。srcdoc 继承宿主页 CSP，SEC-2 落地 `script-src 'self'` 后内联脚本会被拦截，需与 SEC-2 一起定方案（独立沙箱源或专用 frame 策略）。postMessage JSON-RPC 桥按 `event.source === iframe.contentWindow` 校验（不透明源的 origin 为 'null'），只接受白名单方法；高度自适应；注入主题令牌。
- **Artifact 面板**：按跟进方案 W6 实施，作为现有证据面板（来源 / 片段 / 产物）中"产物"标签的升级，不另开第二个主抽屉。分段控件切换"预览 / 代码"，右侧放复制、下载、全屏。md 渲染为正文，代码高亮带行号，csv 用表格网格，json 用可折叠树。只读，编辑、版本、分享按跟进方案 W8 另行开放。消息里的产物卡改成紧凑横条（类型 tile + 名称 + 状态），多个产物横向排列或收进一组。
- **MCP Apps**：工具结果带 `_meta.ui.resourceUri` 时渲染为内联卡片，可展开到 Artifact 面板；必须提供纯文本降级。前提：后端不再压平 MCP 结果并透传 `_meta.ui`，后端代理读取 `ui://` 资源（mcp_api 目前没有 resources/read），并为 UI 发起的工具调用提供带会话和授权的调用通道。审批卡按跟进方案 W7 的 EIM 确认合同落地，在此之前 MCP Apps 只读展示，禁止 UI 发起工具调用。
- **内联可视化**：统计、对比类回答用共享的 ChartFrame 内联出图。数据只接受模型回答中约定格式、经白名单校验的 JSON（图表类型、系列、数值、标签），不接受模型给的 formatter、富文本或 HTML；复杂或需要脚本的图表放进 SandboxFrame。"提升为 Artifact"需要成果 ID、来源执行和版本（跟进方案 W8），在此之前只提供"在面板中查看"和下载 SVG/PNG。

### 6.6 Agent 编辑器

```
┌ ← 客服分流 Agent   ✓ 已保存 · 有未发布修改     [检查 2 ⚠] [▶ 运行] [发布 ▾] ┐
├──────────┬─────────────────────────────────────────┬──────────────────┤
│ ⌕ 节点…   │                                         │ 设置┆上次运行┆输出 │
│ 最近      │     ○ 开始 ──▶ ◆ 检索 ──▶ ◆ LLM           │                  │
│ 检索与知识 │                   ╲                     │ 未选中：工作流概览  │
│ 模型      │                    ▶ ◆ 工具  [+]         │ 选中：节点配置      │
│ 工具      │                                         │ 运行中：运行页签    │
│ 逻辑      │ [↶ ↷ ┆ − 100% + ┆ ⤢ ┆ 布局 ┆ 小地图]  ◉助手 │ 助手：计划与图补丁  │
│ 大纲      │                              [MiniMap]  │                  │
└──────────┴─────────────────────────────────────────┴──────────────────┘
```

- **布局**：左侧是可折叠的"节点库 / 大纲"，中间画布，右侧停靠 Inspector（复用 `patterns/inspector.tsx`：宽屏停靠、窄屏变 Sheet、宽度持久化）。原 rail 上的头像、类型、节点数、最近运行和交付入口移进 Inspector 的"工作流概览"，信息不减少。
- **编辑**：撤销重做、Ctrl+C/V/D 复制子图、Ctrl+S，修好右键菜单。NodePicker 用 cmdk 实现，支持中英文名和别名搜索、最近使用、预览卡，在 handle 的 +、拖线落空、连线中点 +、左侧节点库四处复用。再加 MiniMap、吸附、对齐线，以及 elkjs 自动布局（作为一次可撤销操作）。
- **调试**：Inspector 的"上次运行"页签展示 inputs、outputs、error 和耗时。单步调试只保留"运行此节点"一个入口，统一先保存再运行。节点卡底部加结果条，Trace 行可以"在画布中定位"。
- **发布**：节点加"配置不完整"错误态，头部"检查 N"弹出问题清单，点击跳到对应节点和字段。SaveStateChip 显示保存中、已保存、有未发布修改，旁边是发布分体按钮。版本历史可以预览、恢复和按节点对比，离开页面有保护。发布说明入库需后端小改。
- **AI 参与**：提示词工具栏加"AI 生成 / 优化"，接已有的 `/v1/llm/fine_prompt`，结果用并排 diff 展示，可替换或插入，保留变量 chip。创建入口的第一条路径是"用一句话描述"；画布右下角的助手返回"计划清单 + 图补丁"，画布上用绿、黄、红虚框预览差异，用户逐项接受（需后端提供 NL→DSL）。
- **提示词编辑器**：统一为 Lexical 内核。变量 chip 带来源节点 tile 和类型角标；引用失效时显示红色虚线框，并给出"替换 / 移除"；底部显示约 N tokens 和缺失变量数。
- **模板卡**：顶部 96px 流程缩略图（用 DSL 坐标画成静态 SVG），底部"包含"行列出 OperatorTile 和 ProviderLogo（超出显示 +N）。点击先预览，再决定使用。
- **创建**：Studio 应用、Agent、流水线合并为一个 CreateAssetDialog，提供一句话描述（需后端）、空白、模板、导入四条起步路径，加类型卡和图标选择器；描述改为可选。
- **发布弹层统一**：公开链接、嵌入网站（左侧实时预览浮窗，右侧代码）、API 三项，shared_id 等细节收进"高级"。首批只接已有分享链路的 Agent。Studio 对话应用的发布/分享入口按 SEC-8 继续隐藏，需后端提供 Studio 发布状态机（ENG-8），并完成 SEC-8 的授权验证、回写账本。搜索应用后端已有 searchbots 接口，但 Web 还没有分享页，接入前同样要核对授权范围。现有 beta token 是租户级凭证（前端取 `tokens[0].beta`；agentbots、chatbots、searchbots 只校验租户或成员关系），持链人能访问同租户全部有效的 Agent、对话应用和搜索应用。按应用签发、可单独撤销的分享令牌需后端，落地前弹层要明示链接凭证在整个租户范围内有效。

### 6.7 知识库、检索、记忆

- **问答入口**：知识库详情的第一个分区改为"问答"。顶部是概览卡（头像、描述、文档类型分布、索引健康），下面是共享对话组件，范围固定为本库。后端提供知识库直问接口之前，过渡方案是"用搜索应用提问"：`/searches/{id}/completions` 只接收 question，没有会话历史，所以过渡期只做单轮问答加引用。创建只绑定本库的搜索应用要由用户确认，创建后在搜索应用列表中可见、可删除，不静默创建。概览卡的"建议问题"需后端，先不做。
- **建库三步向导**：基本信息 → 解析方式 → 导入。解析方式用解析器卡片网格（含已有的 Ingestion pipeline 选项），选中后用样例文件调 `/v1/document/preview_chunks` 显示真实分段；ChunkMethodModal 复用同一个预览。
- **列表卡片**：加分段的索引健康条（完成、运行、失败、未解析）和"解析中 3 · 失败 1"，失败数可以点击直达筛选。没有头像时按 id 取身份色底加图标；分组按真实解析状态。
- **上传**：关掉弹窗后继续在后台上传，右下角 IngestTray 显示逐文件进度（并发 3），上传完自动切换为解析进度，可以取消、只重试失败的，并登记到活动中心。
- **检索测试台**：左侧常驻参数栏，包括检索方式分段控件、一根"语义 ↔ 关键词"召回滑块、高级区的打分权重（附说明它和召回权重的区别）、阈值旁实时显示低于阈值的条数；参数变化后防抖自动重跑。结果卡显示排名、文件类型 tile、文档名和分数条，点开定位到原切片；保留本页的运行记录。
- **Memory**：卡片先写内容，再写来源（Agent 头像、会话、相对时间），`#id` 收进溢出菜单；按语义、情景、程序分组；停用和遗忘可以撤销。编辑内容、召回分数和对话中显示"使用了 3 条记忆"需要后端支持。

### 6.8 设置与目录

- **概览**：`/settings` 落到"概览"页，用就绪度卡片引导（默认对话与向量模型、已连接供应商、网关数据面、组件健康）；导航项带 warning、error 状态点。连接器健康要等后端持久化 MCP 测试结果。
- **模型**：一个全局"模型目录"（以网关现有的模型目录为基础，按连接分组或平铺，列出上下文；价格、7 天错误率、p50 首字延迟需后端，见 settings-02），加一个主从布局的"供应商"页（左列已连接供应商，右栏连接卡和模型表，"+ 连接供应商"打开 Logo 目录）。ConnectionCheck 成功时显示"已通过 {model} 验证 · 412 ms"（model_name 已由 verifyConnection 解出，耗时由前端计时）。失败原因后端已经分类（超时、无法连接、Key 被拒、权限或区域、模型不可用、限流、配额），但只放在 400 的英文消息里；前端先按已知前缀映射为本地化文案，匹配不到时显示通用文案，不渲染原始消息；稳定的 error_code 需后端。已保存连接的复测需后端（`/connection` 只接受带明文 api_key 的候选）。模型、MCP、数据源共用这个组件。
- **连接器（MCP）**：对外统一叫"连接器"，Home 面板改为"工具与连接器 / 应用"两段。提供连接器目录（Logo 卡片，点卡片进入预填表单），按 URL host 匹配品牌 Logo，健康点显示上次测试结果和时间。工具级开关要等后端在运行时按 enabled 过滤工具后再上线，否则是无行为入口（ENG-6）。删掉工具分区里的重复入口。
- **开发者分组**：API 密钥（工作区和模型网关两类，用同一套行设计）。网关 Key 已是创建时一次性返回；工作区 Key 列表仍返回完整 token，一次性展示和不可回显需后端改为哈希存储（旧 settings-03，归 ENG-8），且要先把分享用的 beta token 拆出去。API 文档用 Scalar 渲染现有 OpenAPI 规格，先关闭"试一试"，或只允许同源直连、不经第三方代理，按 ENG-6/ENG-8 决策后再开放。另有接入指南。
- **设置注册表**：`settings-registry.ts` 一份数据同时驱动导航、面包屑、⌘K 的"设置"分组和设置内搜索框。
- **管理分组**：只对超级管理员显示。中期由主会话授权 admin API，去掉二次登录和 localStorage 里的 token。
- **个性化**：先做发送快捷键、个人默认模型和记忆入口；称呼、职业、回答风格等要等后端增加字段。

### 6.9 视觉系统

- **动效令牌**：`--motion-fast 120ms`、`--motion-menu 160ms`、`--motion-panel 200ms`、`--motion-page 280ms`，缓动 `--ease-out cubic-bezier(0.2,0,0,1)` 等，减少动效时全部为 0。修好弹层出入场；新增的裸写时长和缓动用棘轮拦截。
- **深色对比度**：把求解目标和底线分开，深色的强调文字和语法色取 7:1 左右；合同测试的 4.5:1 不变，再加一条"不更暗"回归。
- **字阶**：display、title、heading、body、caption 五级语义类；界面 14px，阅读 15px（clay 16px）。中文标点字体别名先只在阅读区启用；去掉深色模式的全局字距。
- **AI 身份**：用品牌图形「承」的四态替换 LoaderCircle（按钮 loading 除外）。ink 的 AI 渐变从 255→290→330 改为约 204→234→264 的潮汐色，custom 方案的规则同步改为单侧。图形和各方案色相已于 2026-11-23 定稿，见 §8。
- **密度**：两档控件都是 32px，紧凑档只收间距和行高。新增 `--row-height`（36/44）、`--row-height-sm`、`--input-height`，表格、资源行、会话列表、导航项统一读取；触屏下可点区域至少 44px。
- **其他**：滚动条细而可见（另有静止时透明的 `.scroll-quiet` 变体）；圆角收敛到 4/6/12，统一 z-index 和图标尺寸阶梯；新增 `focus-ring` 工具类；Badge 改为 tone × variant 两维，StatusDot 提升为共享组件；新建 ChartFrame 和 Sparkline；全局阅读排版（正文用 fg、行内代码用芯片）；IconTilePicker（lucide 图标 + 8 个身份色 + 上传，是否提供 emoji 待确认）；生成 DreamJira 令牌别名层。

### 6.10 体验质量合同

在模板和原语层补齐，而不是每页各写一遍：

- **骨架**：ResourceListSkeletonRow 按 44/36px 行高重写，保留彩色图标块的位置；集合页统一 `placeholderData: keepPreviousData`。
- **反馈四级**：静默乐观更新 → 带撤销的 toast（删除先隐藏，5 秒后提交，离开页面时立即提交）→ 带影响摘要的确认 → 键入名称确认。Toaster 改读语义令牌；新增 CopyButton 原语，替换约 17 处复制实现。
- **离开保护**：`useUnsavedChangesGuard`（useBlocker + beforeunload + 三按钮确认）；SettingsTemplate 和 DetailTemplate 增加浮起的 SaveBar。
- **URL 状态**：`useCollectionParams` 把 q、page、sort、group 写进 URL；名称渲染为 `<Link>`，同时作为预取的挂载点；返回时恢复滚动位置。
- **标题与播报**：用 React 19 的 `<title>`；sr-only 的 aria-live 区域播报新页面，并把焦点移到 h1。
- **无障碍**：jsx-a11y 的关键规则按目录棘轮升为 error；Playwright 加 axe 冒烟测试；列表和表格支持方向键。归 ENG-3。
- **登录**：宽屏左右分栏，左侧是品牌图形「承」、ai-halo 和能力轮播，右侧是表单；注册页加校验。找回密码入口按 SEC-7 继续隐藏，SEC-7 按 reset grant 新合同交付后，再按新接口做找回流程。
- **容器查询**：MainSurface、Inspector、Sheet 标为命名容器，StatGrid、DataTable、FilterBar 和表单行改用容器断点。
- **其他**：打印样式、PWA manifest、随方案变化的 theme-color。

### 6.11 分享页与浮窗

- **分享页**：访客欢迎区（应用头像、名称、只出现一次的开场白）和 44px 紧凑顶栏加"新对话"；开发者细节放到 `?debug=1`；内联错误卡带重试。浏览器存储只保存 sessionId 这类最小恢复元数据（按 agentId 加访客键，读写包 try/catch，不存消息内容）；刷新后回放历史需后端新增凭 beta token 读取会话消息的接口，在此之前刷新后显示"继续上次会话"的空态。欢迎区的建议问题需后端（`/agentbots/{id}/inputs` 不返回开场问题）。
- **浮窗**：配色由一个强调色经 `customSchemeSeed` 派生出明暗两套角色，只写进浮窗作用域；启动器用品牌图形「承」或应用头像。
- **发布效果**：Agents 和 Studio 的二级面板加"概览"页，按 7/30/90 天展示会话、访客、平均轮次、token、输出速度和点赞。后端需要：修正 Agent 来源（source='agent' 连不上 Dialog），增加 dialog_id/canvas_id 过滤；在 agent_completion 和 iframe_completion 中写入 tokens 和 duration；新增公开会话的点赞接口。后端就绪前只展示会话、访客、平均轮次，其余显示"暂无数据"，不画全 0 的图。

## 7. 路线图

波次用 AW（AI Workbench）前缀编号，与账本 ARCH-11 一致，避开 [跟进方案](../workbench-interaction-follow-up.md) 已用的 W0–W8（W6 证据、活动与只读成果工作区，W7 持久 Run 与人工决策，W8 成果版本与项目试点）和上一轮审计的 W0–W5。每一波都是可以独立交付和验证的切片；"依赖后端"一列只列需要 MultiRAG 改动的项；规模按前端人日计（1 人日约 6 小时，与账本口径一致），AW1 按附录工作量折算（S=1–2、M=3–5 人日），其余各波开工前按同一口径估算。

### 7.1 与既有计划和账本的关系

- **账本**：本方案登记为 ARCH-11（波次级进展），终帧下发 prompt 的问题登记为 SEC-9（独立安全项，不随波次排期，可立即修复）。与既有条目重叠的项，进展记在原条目：Home 与 Explore 能力对齐、操作栏、Agent 运行迁移归 ARCH-8（Agent 运行迁移同时按跟进方案 W5 的顺序）；Artifact 只读面板归跟进方案 W6；按路由预算归 ENG-11；虚拟化与无障碍归 ENG-3；Studio 发布、API Key 轮换归 ENG-8；Studio 状态口径归 ENG-9。
- **上一轮审计（2026-10-05）**：其 W0 已完成；W1–W5 中仍未关闭的项（例如旧 design-13、design-24、studio 编辑器各项、knowledge-01、settings-03、settings-14）在本轮重新核验，并入 AW 波次，以本方案的排序为准。
- **跟进方案 W6–W8**：AW2 的"切页不中断"只是标签页内的运行注册表，不等于持久 Run。跨设备恢复、任务列表、通知、插话与排队，以及工具审批，仍以跟进方案 W7 和 ARCH-10 的 RUN/EIM 阶段为前提，不能只靠聊天 UI 先行开放。成果版本、分享与项目归属属于跟进方案 W8 和 ARCH-9。
- **安全门槛**：Studio 对话应用与搜索应用的公开发布要等 SEC-8 授权验证并关闭、ENG-8 发布状态机落地；找回密码界面要等 SEC-7 完成，在此之前保持隐藏；SandboxFrame 的内联脚本与 SEC-2 的 CSP 方案一起定。
- **桌面端**：自绘标题栏、全局快捷键和 Quick Ask 不在本轮 UI 波次，按 CLP 流程先立决策和条目。

### 7.2 波次

| 波次                 | 目标                                     | 纯前端可交付                                                                                                                                                                                                                                                                                                                                                                                                                                                       | 依赖后端                                                                                                                                                                                                                                                                                                                                                       | 规模                                     |
| -------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| AW1 地基修复         | 补上已经坏掉或缺失的基础，用户立刻有感知 | 动效令牌与弹层动画；滚动条；页面级错误边界（同步更新 runtime.md 合同与 ENG-7 测试）、路由元数据、标题播报；深色对比度；删除 x-sdk；先把厂商图标迁出 sprite，再删除 iconfont.js；KaTeX、jsencrypt 懒加载（按路由预算记在 ENG-11）；失败重试；代码块工具条；骨架与 keepPreviousData；新对话入口；"连接器"术语；AI 优化提示词（接已有 fine_prompt）；切片渲染统一；焦点环与 Badge                                                                                     | 无                                                                                                                                                                                                                                                                                                                                                             | 约 32–57 前端人日（两条线并行约 3–6 周） |
| AW2 对话即工作台     | 补齐 AI 产品基本盘和过程透明             | 标签页内切页不中断与后台指示；操作栏（重新生成、编辑重发；反馈只对应用对话）；+ / @ / 命令菜单（后端未支持的项如 @知识库、@技能、直连联网显示禁用并附 Tooltip）；Home 与 Explore 能力对齐；模型选择器改版（ProviderLogo、加载失败改为警示点，力度档先做前端映射）；Trace 统一（深度研究 v1 解析、Agent 运行迁移）；等待态身份；相关问题芯片；前端测得的耗时；会话菜单与导出（重命名、删除、导出、复制全文）；SandboxFrame 与只读 Artifact 面板；content-visibility | Home 对话落库与最近对话；@知识库；结构化 usage 与 timing（应用对话改 dialog_service 的终帧，直连和 MCP 对话在 enhanced_chat_sse 中新增）；自动标题；力度档（登记模型时保存 features.thinking；"自动"档的模型路由与推理强度参数）；@技能（ChatRequest 增加 skill 字段）；直连模式联网改为服务端持有密钥；会话 pinned 字段；对话只读分享端点；检索完成即下发引用 | 开工前估算                               |
| AW3 证据链与知识     | 兑现 RAG 差异化                          | 引用定位高亮与 SourceViewer；替换 PDF 阅读器；搜索页迁到共享部件；建库向导（含流水线选项）与真实分段预览；检索测试台；索引健康；上传队列与活动中心第一阶段；知识库问答（单轮过渡方案）；Memory 卡片                                                                                                                                                                                                                                                                | 知识库直问接口；记忆编辑、召回分数与记忆事件；活动聚合接口；Explore 起始问题与知识库建议问题                                                                                                                                                                                                                                                                   | 开工前估算                               |
| AW4 Agent 构建器内核 | 编辑器手感与发布闭环                     | 三栏布局与 Inspector；撤销重做与快捷键；NodePicker；MiniMap 与自动布局；上次运行与画布定位；预检清单；保存、发布与版本；提示词编辑器统一；工具品牌图标；模板缩略图；统一创建对话框；统一发布弹层（先只接 Agent；Studio 与搜索的发布和分享入口在 SEC-8、ENG-8 收口前继续隐藏）；分享页与浮窗                                                                                                                                                                        | NL→DSL（描述即搭建、画布助手）；发布说明入库；Studio 对话应用公开发布（先按 SEC-8 完成授权验证并关闭该条，再按 ENG-8 提供发布快照、revision 和绑定应用的专用分享 token）；搜索应用公开发布（专用分享 token）；凭分享令牌读取会话消息的接口；stats 修复                                                                                                         | 开工前估算                               |
| AW5 设置、目录与平台 | 管理面与平台能力                         | 模型目录与供应商主从布局；ConnectionCheck；连接器目录；开发者分组；设置注册表与搜索；⌘K 扩展；就绪度概览；管理分组按角色显示；个性化第一步；统一导航清单；快捷键速查；账户菜单；登录页分栏与注册校验                                                                                                                                                                                                                                                               | 价格、延迟、错误率；已保存连接复测接口（用已存凭证探测，可另补稳定的 error_code）；MCP 绑定工具时按 enabled 过滤；MCP 最近一次测试结果持久化；MCP 协议版本与扩展协商、`_meta.ui` 透传与 resources/read 代理；工作区 Key 哈希与作用域；admin 由主会话授权；个性化字段；找回密码依赖 SEC-7                                                                       | 开工前估算                               |

按棘轮持续推进的横切项：乐观更新与撤销、离开保护、URL 状态、无障碍规则升级、容器查询、字阶、密度令牌、圆角与层级收敛、图表原语、阅读排版、图标选择器、forwardRef codemod 与 radix-ui 单包、React Compiler 试点、Router 数据 API 与升级 v8、Monaco 换 CodeMirror 6、思维导图迁到 xyflow、虚拟化、PWA、打印。

每一波的验收沿用 [验证与构建](../agent-guidance/verification.md)：UI 改动查看实际渲染和受影响的交互，附明暗主题截图；体积用按路由的预算和 `profile-route-loads` 做前后对比；完成的工程债条目回写 [工程现代化路线图](../engineering-modernization-roadmap.md)。

## 8. 待确认事项

1. **Mist 方案的锚点。** 默认配色已于 2026-11-18 批准为 ink（账本 ARCH-5），不再待确认。待确认的是：mist 方案是否按 DreamJira 锚点（#29669a / #91c2eb，深色用浅底深字）生成，以及是否加一层 DreamJira 令牌别名。
2. **品牌图形与 AI 渐变（2026-11-23 已定）。** 依据改进稿（https://claude.ai/artifact/LgkBBe2HfpAvkm53vL28EJ ，第 2 版，SVG 和 CSS 源码在第 07 节）：
   - 图形用「承」：画在 45° 八角网格上的 C 形托架（描边 4，圆角端点和转角，取 currentColor），托着一枚填 AI 渐变的圆角菱形核心。核心不用圆形，避免读成 ©。品牌块用墨色 #1f2023 底配全白图形，不需要渐变色块。
   - 四态：空闲时静止；思考时核心用 1600ms 转 90°；输出时按事件让核心轻推一下（280ms，最多每 280ms 一次）；完成时核心 200ms 弹出，渐变再用 280ms 淡出。减少动效时，思考态显示空心核心。
   - AI 渐变全部改为单侧、收于各自强调色：ink 从 255→290→330 改为「潮汐」204→234→264；mist 从 205→240→275 改为 185→215→245；iris 从 275→315→355 改为 230→260→290。celadon、clay、amber 不变。custom 从靠近 200° 的一侧起步，强调色在 15–110° 时步长 20°，其余 30°。
   - 组件用中性名（例如沿用 `BrandMark`，加状态和着色属性），不再叫 TideGlyph。
3. **命名（2026-11-23 已定）。** 产品中英文都叫 Cairvo，没有中文名，也不设单独的 AI 角色名：回答身份行和思考行写 Cairvo，⌘K 写"问 Cairvo"，浮窗页脚写"由 Cairvo 提供"。定位句是"The data foundation for AI."，中文副句"连接企业数据，组织知识与记忆，为 AI 提供上下文"。落地时 `layout.brandName`、index.html 的标题和 PWA manifest 名称改为 Cairvo；MultiRAG 仍是后端仓库名，指向后端的引用不改；桌面安装包和任务栏名称（`DESKTOP_PRODUCT_NAME`）改名会牵动安装路径和用户数据目录，按 CLP 流程另行评估。商标和域名检索还没做（已知同名的有一家英国护理公司和一个 Docker Hub 镜像）。同日上午曾定为"MultiRAG + Tide +「月潮」"，已被本条取代。附录 A 中写"沧溟 AI""Tide"或"应改用 brandName"的现状与核验，记录的是审计时的状态，以本条为准。
4. **图标选择器是否提供 emoji。** DreamJira 写明"不用 emoji"。
5. **后端排期。** §7.2"依赖后端"一列的 MultiRAG 改动，尤其是 Home 对话落库、@知识库、结构化 usage、NL→DSL。SEC-9 已单独登记，不在此排期。
6. **起始波次。** 建议从 AW1（原 W6）开始：全部纯前端，按附录工作量约 32–57 前端人日，两条线并行约 3–6 周；滚动条、焦点环、深色对比度这类 S 级项第一周就能看到变化。

## 附录 A：核验后的发现（111 条）

每条依次给出现状、证据、方案、对标和核验结论。核验结论里的修正（行号、计数、后端范围）优先于前面的原始描述。严重度：高 / 中 / 低；工作量：S / M / L / XL。

### 索引

- **chat-01**（高 · L · 需后端改动）Home 的模型和 MCP 对话不落库，刷新即丢，没有历史和 URL
- **chat-02**（高 · M · 后端已有接口）消息操作栏能力残缺且各面不一致：没有反馈、Home 不能重新生成、全端不能编辑重发（审计 chat-11 和 contract-08 仍未关闭）
- **chat-03**（高 · S · 后端已有接口）失败或中断的回答没有内联重试，无正文时连操作栏都不出现
- **chat-04**（高 · L · 需后端改动）Composer 的 @ 是手写弹层：不能 @知识库或文档，没有 / 命令和提示词库，键盘不可操作
- **chat-05**（中 · M · 后端已有接口）Home 与 Explore 的 Composer 能力不一致：模式开关、语音输入、图片缩略图和快捷键缺位
- **chat-06**（中 · M · 需后端改动）深度研究和检索过程只是一段英文原始日志，缺少活动流可视化
- **chat-07**（中 · L · 后端已有接口）产物面板只读且简陋：HTML 不能运行，没有预览与代码切换，文本不高亮，Markdown 显示源码
- **chat-08**（中 · S · 不需要后端）代码块工具条薄弱，与表格和 Mermaid 的完整工具条不一致
- **chat-09**（中 · M · 不需要后端）Agent 运行对话仍使用旧一套引用、思考、检索组件，形成第二种对话语法
- **chat-10**（中 · S · 后端已有接口）回答后没有追问建议，后端相关问题接口只在搜索页使用
- **chat-11**（中 · S · 需后端改动）回答元信息只有模型和时间，没有耗时、首字延迟、Token 和速度；后端已计算却只塞进 prompt 文本
- **chat-12**（中 · M · 需后端改动）会话级操作缺失：标题直接截取首问，头部没有重命名、导出、分享
- **chat-13**（中 · S · 不需要后端）等待与生成状态缺少 Tide 存在感：通用转圈加“思考中”
- **chat-14**（低 · M · 不需要后端）流式期间每个 chunk 都让全部历史消息重新执行 MessageParts，长对话没有虚拟化
- **shell-01**（高 · L · 需后端改动）没有全局「最近对话」：默认模式下首页面板是空的，历史只按单个应用列出，也不能管理
- **shell-02**（高 · M · 不需要后端）切到别的页面就中断正在生成的回答，外壳也没有后台运行或运行中的状态
- **shell-03**（中 · S · 不需要后端）新对话入口：⌘/Ctrl+N 在浏览器里会被拦截，自由模式下大概率是空操作，离开首页就找不到入口
- **shell-04**（中 · M · 后端已有接口）⌘K 覆盖面窄：封闭的 8 条命令，没有路由级动作、最近访问和「问 Tide」兜底，Web 上入口也不显眼
- **shell-05**（中 · M · 需后端改动）缺少活动中心：文档解析、索引、Agent 运行这类长任务只在各自页面内轮询
- **shell-06**（中 · M · 不需要后端）路由没有元数据：全站没有 document.title，分区靠前缀推断，面包屑各页手写，错误边界只挂在根路由
- **shell-07**（中 · M · 后端已有接口）导航分组和命名混乱：一半目的地藏在「更多」里，「搜索」重名，MCP 会跳进设置，同一个应用有两处对话入口
- **shell-08**（低 · S · 不需要后端）快捷键体系太薄，没有速查面板，rail 的 tooltip 也不提示快捷键
- **shell-09**（中 · M · 不需要后端）桌面端仍用系统标题栏，形成双层标题；导航清单、图标、品牌和账户入口都与 Web 分叉
- **shell-10**（低 · S · 不需要后端）页面切换和导航动效几乎为零：动画库只在首页 composer 使用
- **shell-11**（低 · S · 需后端改动）账户菜单单薄：没有团队上下文、配色方案、快捷键、帮助和版本入口
- **shell-12**（低 · S · 不需要后端）Web 二级面板宽度固定，与桌面端和右侧详情面板的可调宽行为不一致
- **knowledge-01**（高 · M · 后端已有接口）点引用打开原文时不定位、不高亮：答案和原文之间断开
- **knowledge-02**（高 · L · 后端已有接口）建库仍写死 naive 解析，看不到真实分段预览；/preview_chunks 一直没接（knowledge-01 仍未关闭）
- **knowledge-03**（中 · M · 不需要后端）搜索应用答案页仍用旧的引用组件和内联样式，和共享会话的 Tide 证据体系不一致
- **knowledge-04**（中 · S · 不需要后端）切片内容有 5 套净化白名单，表格切片在切片页和检索测试里被压成一串文字
- **knowledge-05**（中 · L · 后端已有接口）检索测试台：参数藏在覆盖层里，权重概念有两处入口，结果醒目显示 chunk ID，也跳不到原切片（knowledge-09 仍未关闭）
- **knowledge-06**（中 · L · 不需要后端）文档预览技术栈偏旧：PDF 用 rc 版 react-pdf-highlighter + pdfjs 4.4，没有阅读工具栏；旧版 Office 交给不兼容的渲染器；HTML/EML 不能预览
- **knowledge-07**（中 · M · 后端已有接口）知识库卡片看不出索引健康，未上传头像的知识库全部一个样子
- **knowledge-08**（中 · M · 后端已有接口）上传绑在弹窗里，进度只有两档，上传和解析没有连成一条进度
- **knowledge-09**（中 · L · 需后端改动）知识库详情里没有“问答/概览”：知识库只能维护，不能直接提问
- **knowledge-10**（中 · M · 需后端改动）Memory 像数据库控制台：原始 #id 排在最前，计数只算本页，不能编辑内容，聊天里也看不到记忆
- **knowledge-11**（低 · M · 后端已有接口）知识库设置：解析器名称没有 i18n，固定 w-1/4 标签栅格，保存时不提示重新解析，也没有未保存提醒（knowledge-12/13/14 仍未关闭）
- **agent-01**（高 · L · 不需要后端）编辑器布局：常驻仪表盘 rail 和固定 Sheet 叠层，应改为画布内停靠的 Inspector 和运行面板
- **agent-02**（高 · L · 不需要后端）画布编辑手感：缺撤销/重做、快捷键和多选复制粘贴，右键菜单失效
- **agent-03**（高 · M · 不需要后端）添加节点：300px 手风琴硬编码列表，不能搜索，不能在连线上插入，也没有可拖入的节点库
- **agent-04**（高 · L · 后端已有接口）运行与调试：节点没有“上次运行”，单步调试语义不一，Trace 与画布互不联动，缺 token
- **agent-05**（高 · M · 不需要后端）没有发布前预检 checklist，节点也没有配置错误态
- **agent-06**（高 · M · 后端已有接口）AI 提示词生成/优化：后端 fine_prompt 已就绪但前端零调用
- **agent-07**（高 · XL · 需后端改动）没有“用自然语言搭建”的工作流 Copilot，创建流程也没有“描述即起步”
- **agent-08**（高 · M · 后端已有接口）保存、草稿、发布三态不可见：自动保存不显示状态，发布藏在 rail，发布说明被丢弃，版本只读
- **agent-09**（中 · M · 不需要后端）画布视觉工具不完整：没有 MiniMap、自动布局、吸附对齐、缩放比例，分支连线没有标签
- **agent-10**（中 · S · 不需要后端）工具节点缺品牌身份：7 个搜索类工具共用 Search 图标，图标仍以 iconfont 优先
- **agent-11**（中 · M · 不需要后端）画布渲染：全局 mousemove 加内联 Context 值，导致所有节点和边逐帧重渲染
- **agent-12**（中 · M · 不需要后端）两套提示词编辑器语义不一；变量引用缺少生命周期和错误态
- **agent-13**（中 · M · 后端已有接口）模板库缺“里面有什么”：没有画布缩略图，也没有算子、模型、工具清单
- **agent-14**（低 · M · 不需要后端）创建流程分裂且有不必要的阻力：Studio 应用与 Agent 是两套对话框，Studio 强制填描述
- **settings-01**（高 · L · 后端已有接口）"模型"被拆成三处重复呈现，缺少主从式供应商页和统一模型目录
- **settings-02**（高 · M · 需后端改动）模型行缺少上下文窗口、价格、延迟和错误率等规格与健康信息
- **settings-03**（中 · M · 需后端改动）连接测试只返回"有效/无效"，已保存的连接无法复测
- **settings-04**（高 · L · 需后端改动）MCP 管理缺连接器目录、品牌标识、真实健康状态和工具级开关
- **settings-05**（中 · S · 不需要后端）"技能"一词在 Home 指 MCP 服务器，在技能库指 SKILL.md 资产，概念冲突
- **settings-06**（中 · M · 后端已有接口）Explore"应用市场"是伪市场：主按钮没有行为，"已添加"的判断依据错误
- **settings-07**（中 · M · 需后端改动）两套 API Key 分散在两个分组，工作区 Key 仍返回明文且缺作用域（settings-03 仍未关闭），API 文档为自研
- **settings-08**（中 · M · 不需要后端）设置区没有搜索，命令面板只能跳到设置首页，页面元数据硬编码
- **settings-09**（中 · M · 需后端改动）缺少"工作区就绪度 / AI 依赖健康"总览，导航没有状态信号
- **settings-10**（中 · M · 需后端改动）管理分组对所有用户可见，用户管理仍需二次 admin 登录（settings-14 仍未关闭）
- **settings-11**（低 · S · 需后端改动）能力标签和供应商身份在各页呈现不一致，缺少"推理"等前沿能力词汇
- **settings-12**（低 · M · 需后端改动）账户设置缺个性化（关于我、回复偏好、记忆入口），与主流 AI 产品差距明显
- **design-01**（中 · M · 不需要后端）Mist 方案与 DreamJira Mist 取值不一致（深色品牌色尤甚），且没有 DreamJira 令牌词汇的映射层
- **design-02**（高 · S · 不需要后端）色阶求解器把深色模式的强调文字和语法色压在 AA 下限，深色下发灰发闷
- **design-03**（高 · M · 不需要后端）弹层进出场动效类全部失效，也没有动效时长和缓动令牌（旧 design-24 仍未关闭）
- **design-04**（高 · M · 不需要后端）没有语义字阶，标题层级在 15–30px 之间；中文里的引号、省略号由 Geist 渲染，深色模式还全局加字距
- **design-05**（中 · M · 不需要后端）密度只缩控件不缩行；紧凑档控件 28px 小于 DreamJira 的 32px，桌面导航轨不读密度令牌
- **design-06**（高 · M · 不需要后端）AI 身份仍是图标库图形加通用转圈：品牌标是 lucide Waves，思考态是 LoaderCircle，默认 AI 渐变是蓝紫粉
- **design-07**（中 · M · 后端已有接口）实体头像缺省是首字母加平涂色块，没有图标或 emoji 加颜色的选择器
- **design-08**（中 · S · 不需要后端）全局隐藏滚动条仍未处理（旧 design-13），Windows 上看不出区域能滚动
- **design-09**（中 · M · 不需要后端）圆角、阴影、层级、图标尺寸各有一套写法：四级圆角加原生类混用，z-index 随手写
- **design-10**（中 · M · 后端已有接口）有分类色令牌却没有共享图表原语：用量图是手写的 div 柱，StatCard 没有趋势和对比
- **design-11**（中 · S · 不需要后端）全局 Markdown 排版正文用次要色，行内代码底色与页面相同，只有聊天区单独修正
- **design-12**（低 · S · 不需要后端）Badge 按色相命名（blue/orange/purple/green），缺少 accent、ai、info 和圆点状态等语义变体
- **design-13**（低 · S · 不需要后端）焦点环仍有四种画法，偏移带颜色固定为 surface
- **design-14**（低 · M · 不需要后端）原语层写法停留在 React 18 时代：33 个文件用 forwardRef，Radix 分包按区间声明，data-slot 只覆盖 5 个文件
- **quality-01**（中 · M · 不需要后端）浮层出入场动效类全部失效，动效缺少时长/缓动令牌
- **quality-02**（低 · S · 不需要后端）应用内“减少动效”偏好管不住 JS 驱动的动效
- **quality-03**（中 · M · 不需要后端）加载态是居中转圈卡片，骨架没有贴合版式；翻页和搜索时整页闪烁
- **quality-04**（中 · M · 不需要后端）路由切换和首屏偏慢：整页转圈兜底、没有意图预取、iconfont 同步加载
- **quality-05**（高 · M · 后端已有接口）缺少错误隔离和诊断：页面一崩溃导航也没了，错误态没法自助排查
- **quality-06**（高 · M · 不需要后端）没有未保存离开保护（审计 interaction-08 仍开放）
- **quality-07**（中 · M · 不需要后端）操作反馈没有分级：没有乐观更新和撤销，成功 toast 太多，确认强度不按风险区分
- **quality-08**（中 · M · 不需要后端）列表状态不进 URL，返回时位置丢失；名称是按钮不是链接
- **quality-09**（中 · S · 不需要后端）没有逐页标签标题，路由切换也不播报（审计 shell-12 仍开放）
- **quality-10**（中 · M · 不需要后端）无障碍门禁仍是 warn，列表和表格不能用键盘导航
- **quality-11**（高 · M · 后端已有接口）登录注册页单薄：后端已有的找回密码没有界面，注册页不做校验
- **quality-12**（低 · M · 不需要后端）响应式按视口断点写，主面宽度变化时组件不跟着调整（容器查询只有 13 处）
- **stack-01**（高 · M · 不需要后端）首屏静态闭包约 750KB gzip：KaTeX、jsencrypt 和 x-card 随登录页、首页、widget 一起加载，预算却只统计入口文件
- **stack-02**（中 · L · 后端已有接口）编辑器路线落后：系统提示词用 md-editor 退化成 textarea，聊天输入框是 textarea 加 @ 符号拼凑，没有行内 mention chip 和 / 命令
- **stack-03**（中 · M · 不需要后端）React 19.3 新能力零采用，React Compiler 仍未试点（手写 useMemo/useCallback 共 1,574 处）
- **stack-04**（中 · M · 不需要后端）React Router 7 数据路由只当路由表用：没有 route.lazy/loader 并行预取、导航进度、离开拦截和视图过渡
- **stack-05**（中 · M · 后端已有接口）乐观更新为零：101 个 mutation、108 处 invalidate；重命名和删除都要等服务器返回，删除也不能撤销（旧审计 stack-12/18 仍未解决）
- **stack-06**（中 · M · 不需要后端）RAGFlow 时代的 iconfont.js（220KB、118 个 symbol）仍在每页同步加载，A2UI 和 Note 算子图标渲染为空白
- **stack-07**（中 · M · 不需要后端）长会话没有任何虚拟化或 content-visibility，每条历史消息都会挂载 XMarkdown、Shiki 和 Mermaid
- **stack-08**（中 · M · 后端已有接口）PDF 预览依赖 react-pdf-highlighter 8.0.0-rc.0（锁定 pdfjs 4.4，需要 Vite 特殊处理），缺少缩放、页码、搜索、缩略图和引用跳转
- **stack-09**（中 · L · 需后端改动）缺少生成式 UI 宿主：HTML Artifact 被 sandbox="" 冻结为静态，文本和代码类 Artifact 以原始文本显示，MCP 工具结果在后端被压平，无法承载 MCP Apps
- **stack-10**（低 · M · 不需要后端）Monaco 没有声明为直接依赖（0.52.2 作为 peer 被自动安装），14MB 的 AMD /vs 目录拷入产物，只服务 3 个 JSON/代码小编辑器
- **stack-11**（低 · M · 不需要后端）G6 单块 1.4MB 且无法拆分，同时承担知识图谱和搜索思维导图；思维导图可以并入已有的 xyflow
- **stack-12**（低 · S · 不需要后端）Ant Design X 残留：x-sdk 零引用但文档仍称“保留”；x-card 与 x-markdown 绑在同一 chunk 进入首屏；XMarkdown 需要 rAF 补丁
- **stack-13**（低 · S · 不需要后端）没有 shadcn components.json，Radix 仍是 21 个分散包，无法直接从 AI Elements 等 registry 拉取组件源码
- **gaps-01**（高 · M · 需后端改动）公开分享页和浮窗把开发者文案直接给匿名访客，缺少开场引导和 Agent 身份，刷新就丢会话
- **gaps-02**（高 · L · 后端已有接口）只有 Agent 能发布：Studio 对话应用和搜索应用不能公开分享或嵌入，分享对话框是开发者配置面板
- **gaps-03**（中 · M · 不需要后端）浮窗主题与身份：深色主题被浅色默认色盖掉，各层表面压成同一种颜色，启动器是通用气泡图标
- **gaps-04**（中 · M · 需后端改动）发布之后看不到效果：后端已有按天统计的会话、访客、token、速度、点赞，前端没有任何地方使用
- **gaps-05**（低 · M · 后端已有接口）自动填表只认手工标记 {{占位符}} 的 .docx，后端的自动识别和 Excel 能力没用上
- **gaps-06**（中 · L · 后端已有接口）AI 填写是一键覆盖的黑盒：不能逐项审阅，资料只能是纯文本，填写中的预览看不到结果
- **gaps-07**（低 · S · 不需要后端）无法安装为应用，移动端浏览器外观不跟随配色：没有 PWA manifest、theme-color 和应用图标
- **gaps-08**（低 · M · 不需要后端）打印与导出：全站没有打印样式，搜索答案只能导出 Markdown
- **gaps-09**（低 · L · 不需要后端）桌面端缺少 AI 桌面应用的原生入口：全局快捷键唤起、系统通知、托盘

### chat：对话体验

**维度结论**：对话底座在 10 月审计后已大幅现代化：Home、Explore、Studio 共用基于 Vercel AI Elements 改写的 ChatTranscript 和 ChatComposer；流式 Markdown 按句淡入并带 2px 光标；发送后锚定问题、提供回到最新和轮次导航；“思考 N 秒”自动折叠；只报告实际执行的步骤时间线；文档名引用芯片、悬停卡片和证据侧栏完整；表格和 Mermaid 工具条齐全；每条回答上方显示供应商 Logo 和模型名。这些都已达到 2026 年主流水准，应原样保留。

差距集中在“回答之后”的交互和“输入之前”的范围表达，具体有六处。

1. Home 的模型和 MCP 对话不落库，刷新即丢失，这是与 ChatGPT、Claude、LobeHub 最大的产品级落差，需要后端支持。
2. 消息操作仍是审计 chat-11 和 contract-08 的遗留问题：反馈全端关闭，Home 不能重新生成，全端不能编辑后重发；失败且无正文的回答连重试入口都没有。
3. Composer 的 @ 只是一个手写弹层，不能 @知识库，没有 / 命令，Home 与 Explore 的模式开关也不一致。
4. 深度研究过程只是一段英文原始日志；产物面板只读，禁止脚本，没有预览与代码切换；代码块只有复制功能。
5. Agent 运行对话仍使用旧的引用、思考、检索组件，形成第二套语法。
6. 没有追问建议、耗时与 Token 元信息、会话分享与导出、自动标题。

改造方向是：在现有共享组件上补齐 ActionBar 能力注入、cmdk 内联提及菜单、ComposerModeBar、活动流式检索步骤、可预览的产物面板和 Tide 存在感组件。全程保留 Logo、头像、彩色图标块和丰富空态，不做减法。

**已做好、应保留**：

- 一套共享对话底座：src/components/chat/chat-transcript.tsx 与 chat-composer.tsx 基于 patterns/chat/message.tsx、prompt-input.tsx（改写自 Vercel AI Elements）。prompt-input.tsx:127-130 处理 IME 安全回车，:94-103 与 :216-222 支持拖放和粘贴文件，:170-188 实现自适应高度。Home、Explore、Studio 共用（commit 3342be06）。
- 流式渲染手法已到位：MarkdownCodeBlock.tsx:336-343 按句 200ms 淡入，带 2px 光标尾巴，补全未闭合 Markdown 并增量解析；streaming-x-markdown.tsx:13-43 用 rAF 合并 SSE 突发；KaTeX 公式和 Shiki 令牌化配色随主题切换（code-block.css:8-36）。
- 滚动体验成熟：chat-scroll-viewport.tsx 发送后把问题锚定在顶部，读者上翻时不追底，“回到最新”按钮会提示有新内容；turn-rail.tsx 在长对话右侧提供轮次刻度，悬停可预览问题、点击跳转；Home 支持阅读宽和全宽切换（local-threads.tsx:105-120）。
- 思考展示对齐 DeepSeek 和 Claude：reasoning-disclosure.tsx:22-61 在思考时展开、结束约 1 秒后折叠成“思考了 N 秒”，用户手动选择优先，流式时内部框滚到最新一行。
- 步骤时间线诚实而紧凑：run-timeline.tsx:70-234 用状态点、工具名代码芯片、结果数和耗时组成一行，参数和结果用 Shiki JSON 展示在折叠区；文档明确不伪造审批（:290-296）。
- 引用核查链路完整：citation-chip.tsx:193-276 以文档名芯片配 SourceTile，相邻引用显示“+N”；悬停卡片含相关度、片段、上一条和下一条、复制、原文链接和“在面板中查看”。source-strip.tsx 用堆叠图标显示“N 个来源”；evidence-panel.tsx 提供来源、片段、产物三个标签，放在可调宽侧栏（chat-workspace.tsx）。
- 富内容块有工具条：markdown-table.tsx:68-91 支持复制、CSV 和全屏，宽表在自身框内横向滚动（commit 1a10527a）；mermaid-diagram.tsx 支持图与源码切换、缩放平移、SVG 下载。
- 模型身份清晰：answer-identity.tsx:17-47 在每条回答上方显示 ProviderLogo 加模型名药丸；模型选择器按供应商分组并显示能力图标（model-select-options.tsx:16-21、model-capabilities.tsx）。
- 终态处理正确：answer-status.ts:78-98 停止或失败时保留已收到的正文、引用和步骤，未完成步骤标为中止；chat-answer-status.tsx 只显示固定分类文案，不显示后端原文。
- 欢迎页有 Tide 存在感且不简陋：home-greeting.tsx 用潮汐芯片显示时段和工作区资源数；tide-composer.css 只在聚焦时显示 AI 光晕；home-starters.tsx 是彩色图标起始卡；还有最近工作和应用会话卡；发送与停止按钮用 motion 形变。
- 上下文可见：SelectedTags.tsx 用带头像和图标的可移除芯片表示本轮用到的应用和 MCP，ContextManifestSummary 在问答两侧标注使用了哪些上下文。
- 输入法安全的回车提交：prompt-input.tsx:127-131、207-214 在合成期间（isComposing、keyCode 229、Process）不提交，对中文用户很关键
- 草稿按会话保存在内存、不落存储，切换用户或租户即清空（use-home-drafts.ts:6-10）；Explore 草稿同样按会话保留（d332b9e9）
- 终态分类合同三端共享（lib/chat/answer-status）；ChatAnswerStatus 作为 polite 日志内的状态，不用 alert role 打断阅读，图标是装饰，文案承载状态，无障碍处理到位（chat-answer-status.tsx:22-28）
- 附件托盘支持粘贴和拖放，失败文件可以逐个重试或移除，点击文字区也能重试（home-attachments.tsx:54、prompt-input-attachments.tsx:124-131）
- 安全基线已静态化：eslint-rules/no-unsafe-iframe-sandbox.js 等 error 级规则；src/pages/agent/form/html-report/report-frame.tsx:76 已有 allow-scripts 沙箱 iframe 模式，可直接复用到产物预览
- 后端分支历史已就绪：chat_api.py:1359-1363 在 pass_all_history_messages 时用提交的分支历史整体替换会话，并按消息 id 保留引用，前端 toBranchHistory（conversation.ts:115-126）已对齐，编辑后重发只差 UI
- 按消息的流式朗读支持加载、播放、暂停和继续三态，并且与文本流独立（MessageActionsFooter.tsx:61-67、87-104；提交 688703a5）
- 桌面二级会话面板的空态带图标、说明和“选择应用”按钮，不是空白（desktop/context-panel.tsx:23-41），符合不做减法的方向

#### chat-01 Home 的模型和 MCP 对话不落库，刷新即丢，没有历史和 URL

高 · 工作量 L · 需后端改动 · missing-pattern

**现状**：Home 的模型和 MCP 对话经 /v1/llm/enhanced_chat_sse 发送，只保存在页面内存，最多 20 个，Home 卸载即丢。应用对话虽有服务端会话，但 Home 也不把会话 id 写进 URL。没选应用时，二级面板只有空态，没有任何历史。

**证据**：

- src/pages/home/hooks/use-home-local-threads.ts:38-42 — 注释写明 Model and MCP conversations are not saved by the service，只在本次访问内存中保留，Home 卸载即消失
- src/pages/home/hooks/use-home-local-threads.ts:34 — 最多保留 20 个本地线程
- src/pages/home/components/local-threads.tsx:83-166 — 会话头只有“本次访问的其他对话”下拉和新建，没有可持久的历史入口
- E:/project/MultiRAG/api/apps/restful_apis/chat_api.py:1300 — 无 chat_id 时直连 LLM，使用“临时默认 dialog，不落库”
- E:/project/MultiRAG/api/apps/restful_apis/chat_api.py:555-572 — \_build_default_completion_dialog 每次构造临时 Dialog，kb_ids=[]

**方案**：后端：让 enhanced_chat_sse 接受 session_id，在用户级隐藏的“Tide 默认助手”Dialog 下建会话并落库，MCP 的 timelineNodes 一并保存；或者把直连对话迁到一个支持 MCP 的统一入口。列表、改名、删除复用 chat_api.py:1004-1209。前端：1）Home 路由改为 /home/c/:sessionId，应用会话同样写入 URL，用 replaceState；2）DesktopConversationPanel 在没选应用时显示“最近对话”分组，替代纯空态，每行用 ProviderLogo 或应用头像，加标题和相对时间，保留现有丰富空态作为无数据时的兜底；3）mcp-agent-stream 迁到领域 API，改用 APIClient 传输；4）use-home-local-threads 保留为内存兜底，不写 storage。

**对标**：ChatGPT、Claude.ai、Gemini 的每次对话都有 /c/:id 这类稳定 URL，侧栏历史可搜索、重命名、固定和归档。LobeHub、Open WebUI、LibreChat、Cherry Studio 同样默认持久化所有对话。“对话有稳定 URL、首条消息即建会话”是 10 月审计 2.1 表里的基线项。

**核验**：核心成立：use-home-local-threads.ts:37-42 注释写明模型与 MCP 对话不由服务保存；local-threads.tsx:87-166 只有“本次访问”下拉和新建。后端证据引错了路径：Home 的模型和 MCP 对话走 src/pages/home/utils/mcp-agent-stream.ts:31-32 → /v1/llm/enhanced_chat_sse（MultiRAG api/apps/llm_app.py:2669；其 ChatRequest 在 llm_app.py:730-747，没有 chat_id 和 session_id 字段，全程不落库），并不走 chat_api.py:1300 的无 chat_id completion 分支（useHomeChat.ts:281 只在应用模式调用 completion）。所以“给无 chat_id 的 completion 加 persist 标志”覆盖不到 MCP 对话。补充两点：1）选了应用的 Home 会话也没有稳定 URL，会话 id 只存在 useHomeStore（stores/home.ts:25），二级面板选中会话后执行 navigate(ROUTES.HOME)（desktop/context-panel.tsx:50-53）；没选应用时，二级面板只显示“选择应用”空态（context-panel.tsx:23-41）。2）mcp-agent-stream.ts:30-43 用裸 fetch，从 localStorage 读 auth_token，并硬编码 localhost 回退，绕过了共享 APIClient，违背 AGENTS.md 中“HTTP 归领域 API”的规定。

#### chat-02 消息操作栏能力残缺且各面不一致：没有反馈、Home 不能重新生成、全端不能编辑重发（审计 chat-11 和 contract-08 仍未关闭）

高 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：回答下方只有复制、朗读，Explore 多一个重新生成，没有任何反馈入口。用户消息不能编辑后重发。重新生成不能换模型。朗读对禁用 TTS 的应用也显示。各页面通过布尔开关各自拼装，能力因页面而异。

**证据**：

- src/pages/home/components/ChatSection.tsx:162-172 — Home 回答操作 showRegenerate={false}、showFeedback={false}，用户消息只有复制
- src/pages/explore/components/explore-thread.tsx:77-88 — Explore 只有重新生成，showFeedback={false}
- src/pages/studio/create-app/components/preview-thread.tsx:104-105、src/pages/agent/components/runtime-chat/runtime-chat-message-list.tsx:355-356 — Studio 和 Agent 同样关闭反馈
- src/components/chat/MessageActionsFooter.tsx:59-72 — 点赞状态只是组件本地 useState，没有提交
- src/components/patterns/chat/message.tsx:8-9 — 注释说明 branches are left out
- src/pages/home/components/ChatSection.tsx:168、explore-thread.tsx:84 — 朗读按钮对所有回答显示，不受应用 prompt_config.tts 开关控制
- E:/project/MultiRAG/api/apps/restful_apis/chat_api.py:1252-1290 — PUT /chats/{chat_id}/sessions/{session_id}/messages/{msg_id}/feedback 已实现，并接 ChunkFeedback 权重学习
- E:/project/MultiRAG/api/apps/restful_apis/chat_api.py:1209-1249 — 删除单条消息接口已存在
- src/api/conversation.ts:199-213 — regenerate 已经映射到 pass_all_history_messages，可承载“截断后重发”

**方案**：沿用原方案：能力注入式 MessageActionBar、模型分体重试、用户消息原位编辑后截断重发、点踩原因 Popover 调 PUT feedback、“⋯”菜单删除此轮，消息树等 Run v2 Turn 落地后再做。第 4 项改为：应用对话按 prompt_config.tts 显示朗读；直连对话按租户是否配置默认 TTS 模型显示，未配置时隐藏，或在 Tooltip 中引导去模型设置。重新加载时用服务端消息上的 thumbup 恢复点赞状态。

**对标**：ChatGPT：用户消息悬停显示编辑和复制，编辑后生成 ‹1/2› 版本；回答有复制、朗读、点赞点踩（点踩弹原因）、重新生成（可选“换个模型”）、分享。Claude.ai：Retry 可选模型，用户消息可编辑，有版本箭头，点踩弹出反馈框。assistant-ui 的 ActionBar（Copy、Reload、Edit）和 BranchPicker，以及 Vercel AI Elements 的 Actions 和 Branch，都把这些当默认部件。Dify 和 RAGFlow 上游都把点赞点踩按消息 ID 落库。

**核验**：证据全部核实：ChatSection.tsx:163-170 的 showRegenerate 和 showFeedback 都是 false；explore-thread.tsx:78-86、preview-thread.tsx:103-105、runtime-chat-message-list.tsx:355-356 都关闭了反馈；MessageActionsFooter.tsx:59 的点赞状态只是本地 useState；message.tsx:8-9 写明 branches are left out；src/components/chat 中没有 Pencil 或 onEdit 实现。后端反馈接口在 chat_api.py:1252-1290，并接入 apply_feedback_to_session_payload 的 chunk 反馈（chat_api.py:235）；删除消息接口在 chat_api.py:1209；conversation_service.py:109 回填 message_id。chat_api.py:1359-1363 在 pass_all_history_messages 时用提交的分支历史整体替换 conv.message，确实能承载“截断后重发”。需修正的是第 4 项：Home 直连对话没有 prompt_config，而 /chat/audio/speech 读取的是租户默认 TTS 模型（chat_api.py:806），按 prompt_config.tts 判断会把 Home 的朗读全部隐藏，或者在未配置 TTS 模型时点击直接失败。另外，Home 直连对话的重新生成和编辑完全由客户端持有历史（走 enhanced_chat_sse），不依赖 chat-01。

#### chat-03 失败或中断的回答没有内联重试，无正文时连操作栏都不出现

高 · 工作量 S · 后端已有接口 · interaction

**现状**：网络、超时、限流或服务端错误发生时，用户只看到一段说明。如果模型一个字都没吐出来，回答下方完全没有按钮，用户只能手动把问题再粘贴发送一次。

**证据**：

- src/pages/home/components/ChatSection.tsx:162-163 — actions 只在 !active && content.trim() 时渲染，失败且无正文的回答没有任何按钮
- src/pages/explore/components/explore-thread.tsx:77-78 — 同样以 !content.trim() 隐藏操作栏
- src/components/patterns/chat/chat-answer-status.tsx:6-24 — ChatAnswerStatus 只有图标、标题和说明，不接收动作
- src/pages/explore/components/explore-run-notice.tsx:3-13 — Explore 的失败提示是一行纯文本 output
- src/pages/home/utils/answer-status.ts:22-32 — 已经把失败分类为 network、timeout、rate_limited、unauthorized 等，但分类不驱动任何动作

**方案**：给 ChatAnswerStatus 增加 actions 插槽。network、timeout、server_error、failed、stopped、unconfirmed 显示主按钮“重试”和次按钮“换个模型重试”（与 chat-02 共用模型分体按钮）。rate_limited 只显示“稍后重试”按钮和固定说明，等后端或网关透出 Retry-After 后再加倒计时。unauthorized 显示“重新登录”。把 ExploreRunNotice 合并进 ChatAnswerStatus，三端一致。终态无正文时仍渲染操作栏，只隐藏复制和朗读。控件高 32px、radius 6。应用对话的重试用 regenerate（pass_all_history_messages），Home 直连对话由客户端重发同一历史。

**对标**：ChatGPT 出错时在回答位置显示 “Something went wrong” 和 Retry 按钮；Claude.ai 显示内联 Retry；Gemini 也提供重试。assistant-ui 的 MessagePrimitive.Error 配合 ActionBar.Reload 是标准组合。

**核验**：核心成立：ChatSection.tsx:163 和 explore-thread.tsx:78 都在正文为空时不渲染操作栏；ChatAnswerStatus（chat-answer-status.tsx:14-48）只接收 kind、title、detail，没有动作插槽；ExploreRunNotice（explore-run-notice.tsx:9-12）是一行纯文本 output；在 home、explore 和 components/chat 中 grep 不到任何回答级重试。lib/chat/answer-status 已有的失败分类没有驱动任何动作。需修正的是：前端和 API 层 grep 不到 Retry-After 或 retryAfter，rate_limited 的“倒计时”没有数据来源，会变成编造的数字。

#### chat-04 Composer 的 @ 是手写弹层：不能 @知识库或文档，没有 / 命令和提示词库，键盘不可操作

高 · 工作量 L · 需后端改动 · missing-pattern

**现状**：想让 Tide 基于某个知识库回答，必须先去 Studio 建应用再 @ 应用。@ 打开的是一个独立搜索面板，不是光标处的内联补全。没有 / 命令可以快速切换模式、调用技能或插入常用提示词。欢迎语写着“N 个知识库可用”（home-greeting.tsx），但 Composer 用不了它们。

**证据**：

- src/pages/home/hooks/useAtTrigger.ts:15-43 — 只检测新输入的 @ 并打开面板，@ 后继续输入的文字不参与过滤
- src/pages/home/components/SkillPanel/SkillPanel.tsx:110-118 — 面板内另有一个 autoFocus 搜索框，打开即把焦点从草稿抢走
- src/pages/home/components/SkillPanel/SkillPanel.tsx:52-71 — 手写 mousedown 判断点击外部关闭，没有用 Radix 或 cmdk
- src/pages/home/components/SkillPanel/SkillPanel.tsx:124-158 — 只有 MCP 技能和应用两个标签，标签按钮缺少 type 和 role=tab
- src/pages/home/components/SkillPanel/SkillList.tsx:74-80 — 列表项是普通按钮，没有 ↑↓ 和 aria-activedescendant 导航
- src/pages/home/components/InputToolbar.tsx:35-51 — 工具栏只有一个“+”打开同一面板
- E:/project/MultiRAG/api/apps/restful_apis/chat_api.py:572 — 直连对话的 kb_ids 固定为 []，不能临时指定知识库
- package.json:116 与 src/components/ui/command.tsx — cmdk 已安装并封装，但 Composer 没有使用

**方案**：沿用原方案：用 cmdk 加 Radix Popover 做光标锚定的 ComposerMentionMenu，替换 SkillPanel 和 useAtTrigger；@ 打开分组列表（知识库、应用、MCP、技能），每行用 EntityAvatar 或彩色图标块；输入即过滤，支持 ↑↓、Enter、Esc，焦点始终留在草稿；选中项进入芯片，知识库芯片显示文档数；/ 打开命令；“+”是同一菜单的入口。后端依赖改为：enhanced_chat_sse 接收 kb_ids，按用户权限鉴权，检索后在 SSE 中回传 reference，前端才能复用引用芯片和证据侧栏；技能分组接 skill_api 的 /spaces/{id}/skills；提示词库需要新增后端，否则 v1 先不做。

**对标**：Cursor 的 @ 内联补全可提及文件、文档和网页，选中后变成可删除的 chip。Claude.ai 的“+”菜单含附件、项目知识和连接器。Open WebUI 用 # 选文档或知识库、/ 选提示词、@ 选模型。LobeHub 和 Cherry Studio 支持在输入框内 @ 助手或知识库。腾讯 ima 和元宝的“@知识库”提问是中文场景常态（审计 2.1 表已列）。

**核验**：前端证据成立：useAtTrigger.ts:15-43 只检测新输入的 @；SkillPanel.tsx:118 的 autoFocus 搜索框会抢走焦点，52-71 手写 mousedown 判断外部点击，124-158 的标签按钮没有 type 和 role=tab；SkillList.tsx:74-80 是普通按钮列表；cmdk 已在 package.json:116 并由 ui/command.tsx 封装（KnowledgeBaseSelector、command-palette 等在用），Composer 没有用。两处需要修正：1）所谓“MCP 技能”标签实际列的是 MCP servers（SkillPanel.tsx:43 的 serverData.mcp_servers），skill_api 的技能空间（skill_api.py:146）根本没有进入 Home 面板。2）后端证据引错路径：Home 直连对话走 enhanced_chat_sse，其 ChatRequest（llm_app.py:730-747）没有 kb_ids，prepare_knowledge_context（llm_app.py:618-644）只做 Tavily 联网检索。所以挂载知识库要改的是 enhanced_chat_sse，加上 kb_ids、鉴权、检索和引用回传，而不是 \_build_default_completion_dialog（那条路径 Home 根本不用）。提示词库在后端没有对应实现。

#### chat-05 Home 与 Explore 的 Composer 能力不一致：模式开关、语音输入、图片缩略图和快捷键缺位

中 · 工作量 M · 后端已有接口 · consistency

**现状**：同一个 Tide，在 Home 选中应用对话时没有“深度研究、联网”，到 Explore 却有。两个页面各自拼装 leading 插槽。图片附件看不到预览。语音只能在搜索页用。没有键盘停止。

**证据**：

- src/pages/explore/components/explore-composer.tsx:174-193 — Explore 有“深度研究”和“联网搜索”开关芯片
- src/pages/home/components/ChatInputBox.tsx:130-145 — Home 只有“+”、附件和 MCP 选项，选中应用时也没有深度研究或联网开关
- src/components/patterns/chat/prompt-input-attachments.tsx:120 — 粘贴的图片在托盘里只显示文件类型图标，没有缩略图
- src/pages/search/detail/hooks/use-search-dictation.ts:21-25 — 语音听写只在搜索页，且走浏览器 SpeechRecognition（Chrome 会上传到云端，审计 chat-20）
- E:/project/MultiRAG/api/apps/restful_apis/chat_api.py:836 — 后端已有 /chat/audio/transcription
- E:/project/MultiRAG/api/db/services/dialog_service.py:884 — reasoning kwarg 驱动 DeepResearcher，但没有推理强度参数
- src/components/chat/composer-send-button.tsx 与 chat-composer.tsx — 没有 Esc 停止、↑ 编辑上一条等快捷键（grep 'Escape' 无结果）

**方案**：沿用共享 ComposerModeBar 的方案：“+”菜单与 chat-04 共用；启用的模式显示为带彩色图标块的可移除芯片；能力不可用时用 Tooltip 说明；右侧依次是模型、麦克风、发送和停止；image/\* 附件显示 48px 缩略图；运行中按 Esc 停止，草稿为空时按 ↑ 编辑上一条。补充以下限制：麦克风只在租户配置了默认语音识别模型时显示；Home 直连模式的“联网”等后端提供服务端开关后再开放，在此之前按 Explore 的做法显示禁用和 Tooltip；深度研究只在应用对话（有检索源）中显示。

**对标**：ChatGPT 的输入框有“+”菜单（照片与文件、深度研究、联网、画布）、听写麦克风和语音模式，图片附件即时显示缩略图。Claude.ai 在“搜索与工具”菜单里开关 Research、Web search 和 Extended thinking。DeepSeek 和 Kimi 在输入框下有“深度思考 / 联网搜索”芯片。Gemini 有 Deep Research 和 Canvas 芯片。

**核验**：前端证据成立：explore-composer.tsx:174-193 有深度研究和联网芯片；ChatInputBox.tsx:130-145 只有 InputToolbar 和模型选择；在 src/pages/home 中 grep 不到 reasoning 或 internet；prompt-input-attachments.tsx:121 只显示 FileKindTile；语音听写只在 use-search-dictation.ts；prompt-input.tsx:207-214 只处理 Enter，components/chat 中 grep 不到 Escape。后端说明需要补充：1）/chat/audio/transcription 依赖租户默认 SPEECH2TEXT 模型（chat_api.py:860），麦克风要按是否配置该模型显示。2）internet 字段只存在于应用对话的 SessionCompletionRequest（chat_api.py:137）；Home 直连对话走 enhanced_chat_sse，联网只能由客户端传 tavily_api_key（llm_app.py:739），与“密钥只留服务端”冲突，因此直连模式的“联网”芯片需要后端改成服务端持有密钥的开关。3）深度研究依赖 has_retrieval_source（dialog_service.py:880-884），这一点原结论正确。

#### chat-06 深度研究和检索过程只是一段英文原始日志，缺少活动流可视化

中 · 工作量 M · 需后端改动 · missing-pattern

**现状**：开启“深度研究”后，用户看到“检索中”一行，展开后是中英混杂的原始日志，子问题、命中数和耗时都埋在文本里。来源只有回答结束后才在 SourceStrip 出现。

**证据**：

- src/components/chat/message-parts.tsx:147-159 — retrievalContent 只把 \<br> 换成换行后当纯文本传给 RunTimeline
- src/components/chat/run-timeline.tsx:282-284 — RetrievalStep 把整段日志放进 max-h-64 的 whitespace-pre-wrap 盒子
- E:/project/MultiRAG/core/advanced_rag/tree_structured_query_decomposition_retrieval.py:110-128 — 回调写死英文：Searching by `query`...、Retrieval %d results in %.1fms、Checking the sufficiency...、Next step is to search for the following questions
- E:/project/MultiRAG/api/db/services/dialog_service.py:172-179 — 这些文本被包进 \<retrieving> 标签作为 answer 增量下发

**方案**：v1 纯前端：parseDeepResearchLog 把已知句式解析为查询、命中数和耗时、充分性检查、下一步问题，按到达顺序逐行渲染（查询词放在代码芯片里，“12 条 · 85ms”放在同一行），不强行配对并发分支；进行中的行用 text-shimmer，完成后折叠为“深度研究 · N 次检索 · M 个片段 · 耗时”；所有文案走 i18n。v2 需要后端：在 \_deep_research_event_payload 中改发带 step_id、parent_id、query、hits、ms 和命中 doc 摘要的结构化事件，前端再加上每步的 SourceTile 堆叠和树形缩进。

**对标**：Perplexity Pro Search 把每个子查询显示为一步，并附带该步找到的来源站点图标。ChatGPT 深度研究在侧边显示活动流和已阅读来源数。Gemini Deep Research 先给可编辑计划再显示实时进度。Vercel AI Elements 的 ChainOfThought 和 Task 组件就是为这种“搜索→结果→下一步”活动流设计的。

**核验**：核心成立：message-parts.tsx:147-159 只把 \<br> 换成换行；run-timeline.tsx:282-284 把整段日志放进 max-h-64、whitespace-pre-wrap 的盒子；tree_structured_query_decomposition_retrieval.py:110-128 的回调是写死的英文句式；dialog_service.py:173-179 把它们包进 \<retrieving> 作为 answer 增量下发；showSources 只在流式结束后为真（message-parts.tsx:160）。提案有两处高估了数据：1）日志里只有命中条数，没有命中了哪些文档，所以“每步用 SourceTile 小图标堆叠”在前端解析阶段做不到。2）子问题通过 asyncio.gather 并发执行（同文件 129-133 行），多个分支的“Searching by…”和“Retrieval N results…”会交错输出，按句式解析无法可靠地把命中数配对到对应查询。

#### chat-07 产物面板只读且简陋：HTML 不能运行，没有预览与代码切换，文本不高亮，Markdown 显示源码

中 · 工作量 L · 后端已有接口 · missing-pattern

**现状**：Agent 生成的报告、HTML、代码文件只能看静态快照或源码文本。模型在回答中直接写出的 HTML 或 SVG 只显示为代码。没有“预览 / 代码”切换，没有全屏，没有版本。

**证据**：

- src/components/chat/artifact-detail-panel.tsx:19-33 — HTML 去掉 script 并用 CSP default-src 'none'
- src/components/chat/artifact-detail-panel.tsx:182 — iframe sandbox=""，交互式 HTML 和图表无法运行
- src/components/chat/artifact-detail-panel.tsx:193 — 代码和文本产物用普通 \<pre> 渲染，没有 Shiki 高亮和行号
- src/components/chat/artifact-kind.ts:4-32 — md、json、csv、py 一律归为 'text'，Markdown 不渲染，CSV 不成表
- src/components/chat/artifact-card.tsx:43-64 — 产物卡是通用图标加“只读·状态”，没有缩略预览
- src/components/chat/CodeBlock.tsx:74-95 — 回答里的 html 或 svg 代码块没有“在面板中预览”的入口
- docs/agent-guidance/runtime.md:89,92 — 规则允许在沙箱 iframe 中执行，只要求 allow-scripts 与 allow-same-origin 不同时开启

**方案**：重做 ArtifactDetailPanel：顶部用分段控件切换“预览 / 代码”，右侧放复制、下载和全屏。全屏使用 Dialog，内部是同一个沙箱 iframe，不提供 blob URL 新窗口打开。HTML 预览复用 report-frame.tsx 的 sandbox="allow-scripts"（不加 allow-same-origin），CSP 允许 inline script，但设置 connect-src 'none'、form-action 'none'。代码和文本走 CodeBlock（Shiki）并带行号；md 走 XMarkdown；csv 用 MarkdownTable 网格；json 用可折叠树。回答里的 html 和 svg 代码块头部加“预览”，作为前端虚拟产物经 ChatWorkspace.viewArtifact 打开。ArtifactCard 改为带首行摘要或缩略图的卡片，用 FileKindTile 按类型着色。版本切换等后端支持。

**对标**：Claude Artifacts 在侧栏提供 Preview 和 Code 切换，HTML 和 React 在沙箱 iframe 中运行，并有版本切换和复制下载。ChatGPT Canvas 与 Gemini Canvas 可以在侧栏预览和迭代。Open WebUI 会把回答中的 HTML 和 SVG 代码块渲染到 Artifacts 面板。Vercel AI Elements 提供 Artifact 和 WebPreview 组件。LobeHub 也有 Artifacts 侧栏。

**核验**：证据成立：artifact-detail-panel.tsx:19-33 用 FORBID script 加 default-src 'none'；182 行 sandbox=""；193 行是普通 pre；artifact-kind.ts 把 md、json、csv、py 一律归为 text；artifact-card.tsx:51-63 是通用图标加“只读 · 状态”；CodeBlock.tsx:74-95 没有预览入口。但提案里“在新窗口打开（blob URL）”有安全缺陷：应用创建的 blob: 文档继承应用源，在新窗口打开模型 HTML 会以应用源执行脚本，而 mcp-agent-stream.ts:30 表明 auth_token 就存在 localStorage，这等于直接给 prompt injection 开了 XSS 通道，违反 runtime.md 的 Security 节。另外，仓库已有现成的 allow-scripts 沙箱模式可复用：src/pages/agent/form/html-report/report-frame.tsx:76，lint 规则 eslint-rules/no-unsafe-iframe-sandbox.js 也指向它。

#### chat-08 代码块工具条薄弱，与表格和 Mermaid 的完整工具条不一致

中 · 工作量 S · 不需要后端 · visual

**现状**：几百行的代码会撑开整条回答，长行只能横向滚动，不能下载为文件或全屏查看。代码块头部会随内容一起滚出视野。

**证据**：

- src/components/chat/CodeBlock.tsx:74-95 — 头部只有语言名和“复制”
- src/components/chat/code-block.css:38-45 — 只有 overflow-x:auto，没有换行开关和长代码折叠
- src/components/chat/markdown-table.tsx:68-91 — 表格有复制、CSV 下载、全屏
- src/components/chat/mermaid-diagram.tsx:48-50 — Mermaid 有源码切换、缩放平移、SVG 下载和复制

**方案**：扩展 CodeBlock 头部，复用 MessageAction 图标按钮，与表格保持一致。1）头部在长代码中吸顶（position: sticky）。2）按钮依次为：自动换行开关、下载（按语言映射扩展名）、全屏 Dialog、复制；html 和 svg 额外有“预览”，见 chat-07。3）超过 30 行默认折叠，底部渐隐，显示“展开其余 N 行”。4）流式输出时头部显示语言和实时行数，结束后再显示工具按钮，与 markdown-table.css 在流式时隐藏按钮的策略一致。不建议在前端执行模型代码（runtime.md:92 只允许在沙箱 iframe 中执行）。

**对标**：LobeHub 的代码块支持换行切换、下载、展开全屏和折叠。Open WebUI 的代码块支持复制、保存，以及在 Pyodide 中运行 Python。ChatGPT 代码块头部吸顶并提供复制和编辑（Canvas）。Vercel AI Elements 的 CodeBlock 支持行号与复制。

**核验**：核实：CodeBlock.tsx:74-95 的头部只有语言名和复制；code-block.css:38-45 只有 .shiki overflow-x:auto；markdown-table.tsx:68-91 有复制、CSV 和全屏；mermaid-diagram.tsx:48-50 的注释列出了缩放、下载和复制。MarkdownCodeBlock 把所有普通代码块路由到这个 CodeBlock，提交历史中也没有相关增强。实现提示：外层容器带 overflow-hidden（CodeBlock.tsx:70），会成为 sticky 的滚动容器，导致头部吸顶失效，需要改成 overflow-clip，或者把圆角裁切放到内层。

#### chat-09 Agent 运行对话仍使用旧一套引用、思考、检索组件，形成第二种对话语法

中 · 工作量 M · 不需要后端 · consistency

**现状**：Home 和 Explore 走 MessageParts 的新语法（模型身份、步骤时间线、思考折叠、引用芯片、证据侧栏），Agent 运行和分享对话却走旧组件，同一用户会看到两套引用和思考样式。旧组件和一个未使用的 SDK 也增加了维护面。

**证据**：

- src/pages/agent/components/runtime-chat/runtime-chat-message-list.tsx:3-16 — 导入 ReferenceMarker、ReferencePanel、ReferenceDetailSheet、ThinkWrapper、RetrievalProgress、TypingText
- src/pages/agent/components/runtime-chat/runtime-chat-message-list.tsx:276-277 — ThinkWrapper 内用 whitespace-pre-wrap 纯文本显示思考，没有 Markdown 和计时
- src/pages/agent/components/runtime-chat/runtime-chat-message-list.tsx:309 — 引用用旧 ReferencePanel 列表，没有内联文档名芯片和 SourceStrip
- src/pages/agent/components/runtime-chat/runtime-chat-message-list.tsx:391 — 引用详情用模态 ReferenceDetailSheet，不进 EvidencePanel 侧栏
- src/pages/agent/components/runtime-chat/runtime-chat-message-list.tsx:341-343 — 错误显示为 text-xs 纯文本，没有 ChatAnswerStatus
- src/pages/studio/create-app/components/preview-pane.tsx:17 — Studio 预览也仍用 ReferenceDetailSheet
- package.json:70、vite.config.ts:319 — @ant-design/x-sdk 仍在依赖和分包里，但 src 内没有任何 import

**方案**：为 MessageParts 增加插槽：beforeText（RuntimeTracePanel 节点映射为 RunTimeline）、afterText（AgentXCardRenderer、附件、等待输入表单 DebugContent）。Agent 运行面包一层 ChatWorkspace，使引用芯片打开 EvidencePanel 侧栏；回答头部用 AnswerIdentity 显示 Agent 头像和模型；思考改用 ReasoningDisclosure，检索改用 RunTimeline 的检索步骤，错误改用 ChatAnswerStatus。Studio 预览同样切换到证据侧栏。迁移完成后删除 ThinkWrapper、ReferencePanel、ReferenceMarker、ReferenceDetailSheet、retrieval-progress（搜索页 search-summary-card.tsx 需同步迁移），并移除未使用的 @ant-design/x-sdk 依赖和 vite 分包项。

**对标**：Claude.ai 与 ChatGPT 在普通对话、项目和 Agent 任务里使用同一套消息部件语法。assistant-ui 和 Vercel AI Elements 的设计核心就是一个 parts 渲染器服务所有入口。

**核验**：核实：runtime-chat-message-list.tsx:3-18 导入了 ReferenceDetailSheet、ReferenceMarker、ReferencePanel、RetrievalProgress、ThinkWrapper 和 TypingText；271-282 行把思考作为 whitespace-pre-wrap 纯文本放进 ThinkWrapper；306-313 行用 ReferencePanel 显示引用；341-343 行把错误显示为 text-xs 纯文本；389 行用模态 ReferenceDetailSheet；preview-pane.tsx:17 也仍在使用 ReferenceDetailSheet。@ant-design/x-sdk 仍在 package.json:70 和 vite.config.ts:319，src 中 grep 不到任何 import（提交 2c6c0af1 声称“drop the package”，但依赖条目还在）。迁移范围要比原文大：RuntimeChatMessageList 还被 agent/share/share-message-list.tsx、agent/features/log-detail/components/transcript.tsx 和 agent/explore/components/session-chat.tsx 使用，搜索页的 search-summary-card.tsx 也引用这些旧组件，都要一起切换。

#### chat-10 回答后没有追问建议，后端相关问题接口只在搜索页使用

中 · 工作量 S · 后端已有接口 · missing-pattern

**现状**：回答结束后，对话就停在那里，用户要自己想下一步问什么。Explore 的起始建议是固定的 i18n 文案（explore-empty.tsx:9、95），与具体应用无关。

**证据**：

- src/api/conversation.ts:240-262 — generateRelatedQuestions 已封装
- src/pages/search/detail/hooks/useSearchExecution.ts:401-408 — 唯一调用方是搜索页
- src/pages/home/components/ChatSection.tsx:111-198 与 src/pages/explore/components/explore-thread.tsx:41-92 — 对话里回答下方只有来源条和操作栏
- E:/project/MultiRAG/api/apps/restful_apis/chat_api.py:927-1000 — /chat/recommendation 无 search_id 时用租户默认模型，用 related_question 提示词只基于问题生成相关搜索词

**方案**：v1：在最新一条已完成回答的 SourceStrip 下方显示最多 3 个追问芯片，用幽灵药丸样式，前置 CornerDownRight 图标，悬停出现 ai 色描边，点击即发送。用 TanStack Query 按 messageId 在完成后懒加载，失败时静默不显示，流式中和历史回答不显示。Explore 起始建议仍用通用 STARTERS 并保留彩色图标块；有 prologue 时作为欢迎语展示。v2 需要后端：/chat/recommendation 增加结合回答上下文的 follow-up 模式；prompt_config 增加 suggested_questions 开关和预设问题列表，Studio 再提供对应设置。

**对标**：Perplexity 在每个回答下列出 Related 追问。Dify 的应用功能里有“回答后的下一步问题建议”开关（suggested questions after answer）。豆包、Kimi 等中文助手常在回答后给 2 到 3 个追问芯片。Vercel AI Elements 提供专门的 Suggestion 组件。

**核验**：核心成立：conversation.ts:240-262 封装了 generateRelatedQuestions，唯一调用方是 useSearchExecution.ts:401；对话页回答下方没有追问；chat_api.py:927-1000 无 search_id 时用租户默认模型，提示词只基于问题关键词生成“Related search terms”。需修正的是：提案中“Explore 起始建议优先用应用的预设问题”在后端没有对应字段，Dialog 只有 prologue（chat_api.py:74-82），grep 不到 preset 或 suggested_questions。“Studio 增加回答后建议追问开关”同样需要在 prompt_config 中约定新键，由后端读取。

#### chat-11 回答元信息只有模型和时间，没有耗时、首字延迟、Token 和速度；后端已计算却只塞进 prompt 文本

中 · 工作量 S · 需后端改动 · missing-pattern

**现状**：用户和应用开发者都看不到“这次回答花了多久、检索占多少、生成多快”。在企业 RAG 平台里，这些是调优和对比模型的核心信号。后端终帧还把整段系统提示词带给了客户端。

**证据**：

- src/components/chat/answer-identity.tsx:17-47 — 只有 ProviderLogo、模型名药丸和时间
- E:/project/MultiRAG/api/db/services/dialog_service.py:1040-1062 — 已计算总耗时、检索、改写、生成各段 ms，以及生成 token 和 token/s，但只拼进 prompt 字符串
- E:/project/MultiRAG/api/db/services/dialog_service.py:1080 — 终帧返回 {answer, reference, prompt, created_at}，prompt 含系统提示词和检索知识并随 SSE 下发到浏览器
- src/components/chat/reasoning-disclosure.tsx:22-42 — 思考秒数是前端本地测量的，说明前端已有计时先例

**方案**：在消息 meta 行用等宽低对比字体显示“4.2s · 首字 0.8s”。这两个值三端都由前端测量（发送到首个正文帧、到终帧），不依赖后端。Token 和 tok/s 以及改写、检索、生成的分段 Popover，等后端在终帧输出结构化 usage 和 timing 后显示：应用对话改 dialog_service.py:1080；直连和 MCP 对话需在 enhanced_chat_sse 中新增。终帧不再下发 prompt 字段。用户偏好可切换紧凑显示或隐藏。

**对标**：Open WebUI 每条回答有信息图标，悬停显示 tokens/s 和总耗时。Cherry Studio 在消息下方显示 Token 用量和速度（具体字段以其当前版本为准）。LobeHub 显示消息 token 用量。ChatGPT 和 Claude.ai 消费端不显示，但本产品面向构建者，更接近 Open WebUI 和 Cherry Studio 的定位。

**核验**：核实：answer-identity.tsx:17-47 只有 Logo、模型药丸和时间；dialog_service.py:1040-1062 计算了分段耗时和 token/s，但只拼进 prompt 字符串；1080 行的终帧带着 prompt，chat_api.py:1395-1416 的 \_format_answer 和 structure_answer 没有剥离它，会随 SSE 下发到浏览器；reasoning-disclosure.tsx:18-42 的思考秒数在前端测量。需修正的范围：这些后端计时只存在于应用对话（/chat/completions → dialog_service）。Home 的模型和 MCP 对话走 enhanced_chat_sse（llm_app.py:2669），没有任何计时或 usage 输出，需要单独补。

#### chat-12 会话级操作缺失：标题直接截取首问，头部没有重命名、导出、分享

中 · 工作量 M · 需后端改动 · missing-pattern

**现状**：标题经常是“帮我看一下这个……”这种截断长句。重命名只能在 Explore 侧栏菜单里做，Home 不能改。对话不能导出成 Markdown 或 PDF，不能生成只读分享链接，也不能固定或归档。

**证据**：

- src/pages/home/components/ChatSection.tsx:206 — 会话标题等于第一条问题原文
- src/pages/explore/hooks/use-explore-send.ts:86 — Explore 会话名取首问前 50 字加 ...
- src/pages/explore/ExplorePage.tsx:436-450 — 会话头 actions 只有“对话设置”按钮
- src/pages/home/components/local-threads.tsx:87-166 — Home 头部只有宽度、本次访问历史和新建
- src/pages/search/detail/export/search-session-export.ts:1-15 — 导出 Markdown 只在搜索页实现

**方案**：在 ChatThreadHeader 的 actions 增加统一的 ConversationMenu（⋯）。1）标题可原位编辑：双击或菜单中重命名。2）导出 Markdown 或 JSON，复用 search-session-export 的转义与脚注方式，引用转为脚注，模型身份写进 front-matter。3）复制整段对话。4）删除、固定。5）分享：生成只读链接，带预览卡（应用头像、标题、轮数）。标题由后端在首轮完成后异步生成，前端收到后以 200ms 淡入替换，失败时保留首问截断作为兜底。

**对标**：ChatGPT 和 Claude.ai 会在首轮后由 LLM 生成简短标题并以打字效果出现；头部有 Share 按钮和 ⋯ 菜单（重命名、固定、归档、删除）。Open WebUI 支持把对话下载为 txt、PDF、JSON。LobeHub 支持导出 Markdown、JSON 和截图分享。Gemini 可以导出到 Docs。

**核验**：核实：ChatSection.tsx:206 的标题等于首问原文；use-explore-send.ts:86 截取前 50 字加 ...；ExplorePage.tsx:436-450 的头部 actions 只有对话设置；local-threads.tsx:87-166 只有宽度、本次访问历史和新建；SidebarConversations.tsx（共 154 行，Home 的二级面板使用）没有改名和删除，改名只在 explore-sidebar.tsx 的菜单里。导出只在 search-session-export.ts。后端 grep 不到自动标题生成，改名接口在 chat_api.py:1111，与原文一致。分享需要公开只读端点，属于 needs-backend，判断正确。

#### chat-13 等待与生成状态缺少 Tide 存在感：通用转圈加“思考中”

中 · 工作量 S · 不需要后端 · visual

**现状**：新的 Tide 身份只出现在欢迎页芯片。真正生成时，用户看到的是任何后台都会有的转圈，没有当前阶段（准备上下文、检索哪些知识库、阅读片段、撰写），也没有计时。这正是“AI 存在感弱”的观感来源。

**证据**：

- src/components/chat/ChatBubbleLoading.tsx:14-18 — LoaderCircle 通用旋转图标加 text-shimmer“思考中”
- src/components/chat/reasoning-disclosure.tsx:97-100 — 思考行用的是通用 Sparkles 图标
- src/components/layout/brand-mark.tsx:6-28 — TideMark 已有 xs、sm、md 尺寸，但没有动态状态，对话流中也从未出现
- src/components/chat/answer-identity.tsx:26-38 — 回答头只显示模型，看不出“Tide 正在工作”这一主体

**方案**：新增 TidePresence，用于 ChatBubbleLoading 和运行中回答的身份行。TideMark 波纹由 motion 驱动，prefers-reduced-motion 时改为静态渐变。状态文本只用可观测阶段：准备中（发送到首帧）；深度研究中（收到 \<retrieving> 时，可接 chat-06 的步数）；思考中（收到 think 帧）；撰写中（首个正文帧）；MCP 模式用 timelineNodes 的当前工具名。Home 可以用 ContextManifest 显示“范围：N 个知识库”，作为范围说明而非进度。右侧显示等宽计时。完成后收拢为静态 TideMark 加模型药丸，与 AnswerIdentity 合为一行。普通检索的细粒度阶段需要后端新增 stage 事件后再加。

**对标**：Claude.ai 生成时有专属的动态 Claude 标志和状态文本。ChatGPT 在思考和搜索时显示带品牌感的脉动点，并轮换状态（如 Searching the web）。Claude Code 和 Codex 一类编码 Agent 显示工作中状态和已用时长。Perplexity 逐步显示“正在搜索、正在阅读 N 个来源”。

**核验**：核实：ChatBubbleLoading.tsx:14-18 是 LoaderCircle 加 text-shimmer；reasoning-disclosure.tsx:97-100 用 Sparkles；brand-mark.tsx 的 TideMark 是静态的；回答头只显示模型。需修正两处：1）TideMark 不只出现在欢迎页，还在 activity-rail.tsx 和 Sidebar.tsx 中作为品牌块；原文“对话流中从未出现”的说法成立。2）提案中的“检索 N 个知识库 → 阅读 M 个片段”在流式中观测不到：普通检索不发进度事件，只有深度研究会发 \<retrieving>（dialog_service.py:909、1328），引用随终帧才到（message-parts.tsx:91-93 的注释）。按原方案做会变成假进度。

#### chat-14 流式期间每个 chunk 都让全部历史消息重新执行 MessageParts，长对话没有虚拟化

低 · 工作量 M · 不需要后端 · performance

**现状**：对话变长后（几十轮且带引用），流式每个 token 都会让所有历史回答重跑正文处理，主线程开销随历史长度线性增长。StreamingXMarkdown 自身有 memo，所以历史 Markdown 大多不会重解析，但外围的正则和组件树仍会重跑。

**证据**：

- src/pages/home/hooks/useHomeChat.ts:319-345 — 每个 SSE 帧替换一次 messages 数组
- src/pages/home/components/ChatSection.tsx:111-198 — items 的 useMemo 依赖 messages，每帧重建全部条目
- src/pages/home/components/ChatSection.tsx:128-137、156-157 — 每条消息每次都新建 identity 对象、run={{ phase, steps }} 字面量和 notice 元素，使 memo 失效
- src/pages/explore/components/explore-thread.tsx:74 — identity={message.modelIdentity ?? {}} 每次新建空对象
- src/components/chat/message-parts.tsx:52-120 — memo 组件内每次执行 extractThinkContent、getCitedChunks、convertReferencesToSup、groupAdjacentCitations 等全文正则
- package.json — 未启用 React Compiler，也没有虚拟列表依赖

**方案**：1）把 identity、run、notice 在消息层用按消息 id 缓存的选择器生成；或在 Home 对话 store 中按 id 存消息，ChatTranscript 每行订阅自己那条，活跃消息之外的行引用保持稳定。2）在 hook 层把 updateMessages 合并到 rAF，与 streaming-x-markdown 的节流对齐。3）评估启用 React Compiler（babel-plugin-react-compiler），自动稳定这些字面量。4）对超过约 80 轮的线程引入虚拟化（virtua 或 @tanstack/react-virtual）。需注意与 ChatScrollViewport 的锚定、TurnRail 的 IntersectionObserver 兼容；审计也认为无分页的长列表才值得虚拟化，对话正属此类。

**对标**：assistant-ui 让每条消息按 id 订阅外部 store，只有活跃消息重渲染。Vercel AI SDK 的 useChat 提供 experimental_throttle。LobeHub 对长会话使用虚拟列表。

**核验**：核实：useHomeChat.ts:318-345 每个 SSE 帧通过 updateMessages 替换数组，仅在内容和引用都没变时跳过；ChatSection.tsx:111-198 的 useMemo 依赖 messages，每帧重建全部条目；128-137 行的 identity 和 156-157 行的 run={{ phase, steps }}、notice 元素每次都新建，使 MessageParts 的 memo 失效；explore-thread.tsx:74 的 identity={message.modelIdentity ?? {}} 每次新建空对象；message-parts.tsx:66-118 每次执行 extractThinkContent、getCitedChunks、convertReferencesToSup、groupAdjacentCitations。package.json 和 vite.config 中没有 react-compiler 或虚拟列表依赖，只有 streaming-x-markdown.tsx:35 做了 rAF 节流。严重度定为 low 合理。

### shell：外壳、导航与信息架构

**维度结论**：外壳的骨架已经现代化：icon rail、二级面板、浮起的圆角主卡片、token 化配色、hover flyout、cmdk 命令面板（带分组、范围切换和实体搜索）、页头 portal、移动端 sheet，这些都已具备，与 Codex 桌面版的方向一致。真正落后于 ChatGPT、Claude.ai、Codex 和 Linear 的，是 AI 原生的全局能力。一是没有全局的「最近对话」：默认的自由模式下，首页面板只有「选择一个应用」的空态；模型和 MCP 对话不落库，离开首页就丢。二是离开首页会直接中断正在生成的回答，也没有后台运行或运行中的状态提示。三是长任务（解析、索引、Agent 运行）没有全局的活动中心。四是 ⌘K 仍是封闭的 8 条静态命令加 3 类实体，没有路由级命令，没有「最近」，也没有「问 Tide」兜底。五是路由没有元数据：全站没有 document.title，分区靠路径前缀推断，错误边界只挂在根路由。六是桌面端仍用系统标题栏，并且维护着第二份导航清单。新对话快捷键 ⌘/Ctrl+N 在浏览器里会被拦截，自由模式下全局「新对话」大概率仍是空操作。旧审计的 shell-01/02/05/08/12/13/14/20 都还没关闭。方案应在 rail 加面板的框架内补上这几项：全局最近对话（置顶、应用分组、身份头像）、后台运行注册表、活动中心、可扩展的 ⌘K、路由 handle 元数据、桌面无边框标题栏，同时在 rail 和面板上增加 Tide 的 AI 存在感（新对话入口、运行中指示），不做减法。

**已做好、应保留**：

- rail、二级面板与浮起主卡片的结构已经成型：主卡片带圆角、细边框和低阴影（src/components/layout/app-shell.tsx:114），导航坐在 shell 底色上，与 Codex 桌面版及 DreamJira 的语言一致。应保留。
- rail 的键盘可达性做得细：上下、Home、End 在导航项间移动（src/components/layout/Sidebar.tsx:90-113）；面板折叠后 hover 展开 flyout 预览，按 ArrowRight 也能打开并接管焦点（src/components/patterns/navigation-flyout.tsx:198-240）；有 skip link（app-shell.tsx:72-78）。
- 页面模板通过 portal 把标题行和操作区交给外壳页头（src/components/layout/workbench-header.tsx:206-249），Web 与桌面共用，避免了双层页头。DetailTemplate 的 crumbs 也进了页头（src/components/page-templates/detail-template.tsx:48-55）。
- ⌘K 基于 cmdk 1.1.1，带分组、范围切换（按 Tab 循环）、命中高亮、底部键位提示和读屏播报（src/lib/commands/command-palette.tsx:156-264），实体结果用 EntityAvatar 保留身份（palette-entity-items.tsx:131-163），知识库搜索走服务端 keywords 并做了防抖。
- 快捷键处理考虑了中文输入法：组字期间不触发（command-provider.tsx:187）；编辑器自己消费的按键不抢（keyboard.ts:24-31）；键帽按平台显示 ⌘ 或 Ctrl，并带 aria-keyshortcuts（workbench-quick-actions.tsx:51-55）。
- 首页面板的会话列表按日期分组、分组标题吸顶，每行有应用头像和相对时间（src/components/layout/SidebarConversations.tsx:91-143），比纯文字列表更有身份感，可以作为全局最近对话的视觉基础。
- 右侧详情面板 AiWorkspace 可拖拽调宽并持久化，手机上降级为 sheet（src/components/layout/ai-workspace.tsx:18-38）；桌面端上下文面板同样可调宽并持久化（desktop/desktop-workbench.tsx:41-53）。
- 设置页导航已分组，带待处理数量徽标、面包屑和 returnTo 返回工作区（src/pages/settings/SettingsLayout.tsx:47-55、62-155、182-212）。
- 移动端 sheet 已经重做：44px 行高、触控版快捷操作和账户区（src/components/layout/mobile-sidebar-sheet.tsx:54-194），并处理了 visualViewport 高度（use-workbench-viewport.ts）。
- 桌面端已有 5 组信息架构（work/discover/knowledge/build/tools），见 src/components/layout/desktop/desktop-navigation.ts:24-92 与 src/lib/commands/navigation.ts，正好是 shell-07 想给 Web 做的分组，可以直接作为单一导航清单的种子。
- 命令系统已经具备扩展基础：src/lib/commands/registry.ts 支持动态 register/dispose 和 revision 订阅，src/lib/commands/types.ts:19-22 已定义 CommandScope.ROUTE，路由级命令只差一个通过 context 暴露的 hook。
- 首页主区已有丰富的「继续」入口：src/pages/home/components/home-recent-work.tsx 列出最近应用和知识库（带 ModelChip 和头像），local-threads.tsx 列出本次访问的模型对话，recent-app-conversations.tsx 列出选中应用的会话，不是一个空的欢迎页。
- 首页的请求、草稿和本地线程都按 user.id:tenant_id 身份隔离；src/pages/home/hooks/use-home-scope.ts:33-43 订阅 auth store，身份变化时同步撤销请求。后续的运行注册表应沿用这套隔离。
- 外壳的无障碍做得扎实：跳到主任务区的 skip link（app-shell.tsx:72-78）、rail 的方向键漫游（Sidebar.tsx:90-113）、aria-keyshortcuts 与平台化键帽（workbench-quick-actions.tsx:50-54）、aria-current，以及移动 sheet 用 data-nav-row 把行放大到触控尺寸。
- 共享的 ConversationList pattern（src/components/patterns/conversation-list.tsx）已经支持日期分组和每行的 ActionMenu，SidebarConversations 的行也已有 EntityAvatar、相对时间和吸顶的日期分组，统一成一套实现的基础已经具备。
- 二级面板的默认导航会按分区自动收拢 navItems（workbench-navigation.tsx:193-202），所以「更多」里的目的地在各自分区的面板里也能找到。

#### shell-01 没有全局「最近对话」：默认模式下首页面板是空的，历史只按单个应用列出，也不能管理

高 · 工作量 L · 需后端改动 · missing-pattern

**现状**：二级面板最重要的位置是首页的「对话」分区，但默认的自由模式下这里只有一段空态提示。选了应用后，也只显示这一个应用的会话。模型和 MCP 对话只活在本次访问的内存里。会话行不能重命名、删除、置顶或筛选。探索页又有一份带菜单的独立会话列表，缓存 key 也分叉了。

**证据**：

- src/components/layout/workbench-navigation.tsx:117-133 — HomeConversations 只读 selectedApps[0]；没选应用时面板只渲染「选择一个应用，开始对话」和「浏览应用」
- src/components/layout/SidebarConversations.tsx:44,103-143 — 只按单个 dialog 拉取会话；行只能点击，没有重命名、删除、置顶菜单，也没有筛选框
- src/pages/home/hooks/use-home-local-threads.ts:37-42 — 注释写明模型和 MCP 对话不由服务端保存，Home 卸载后列表就消失
- src/pages/explore/components/explore-sidebar.tsx:255-305 — Explore 用另一套 ConversationList，支持重命名和删除，与首页是两套实现
- src/hooks/use-chat-request.ts:22-25 — Explore 刻意使用独立的 dialogConversations 缓存 key（旧 shell-08 仍未关闭）
- src/lib/commands/palette-entity-items.tsx:28-34,57-59 — ⌘K 明说没有跨应用会话列表，只能搜已经在缓存里的 byDialog 列表
- MultiRAG/api/apps/restful_apis/chat_api.py:1047,1111,1158 — 每个应用的会话 list、PATCH name（重命名）和 DELETE 已经存在
- MultiRAG/api/apps/llm_app.py:2669 — enhanced_chat_sse（首页自由模式）不落库；MultiRAG/api/db/db_models.py:3279-3287 — 会话表没有 pinned 字段

**方案**：保持原方案的三段结构：置顶、应用（EntityAvatar 彩色方块，可展开）、按日期分组的跨应用会话（行左侧是应用头像，后接标题和相对时间），并扩展 patterns/conversation-list.tsx 的 avatar/meta/pinned 槽位，作为唯一实现；Explore 的缓存并入 chatKeys.conversationsByDialog。修正四点。第一，32px 筛选框先只在本地过滤已加载的会话；服务端模糊搜索需要后端给 list_sessions 加 keywords/contains（现有 name 是精确匹配）。第二，⋯ 菜单首批只做「重命名」和「删除」（PATCH/DELETE 已有）；Home 支持 ?app=&conversation= 或 /chat/:id 深链后再加「复制链接」，应用会话的深链纯前端就能做。第三，过渡期 useQueries 并发拉取最近更新的 N 个 dialog 时传 page_size≈10、orderby=update_time、desc=true，不复用 page_size:0 的封装。第四，后端 pinned 字段落地前不做置顶，或者明确标注「仅本机」，按身份存入 localStorage，不进 ui store。主区已有的「继续」卡片和本地线程卡片保留，不做减法。终态请后端提供：跨应用的分页会话路由（可复用 get_all_conversation_by_dialog_ids）、pinned 字段、自由模式的持久化。

**对标**：ChatGPT 侧栏常驻「新聊天 / 搜索聊天 / 项目 / 历史」，历史跨 GPT 混排，每行 ⋯ 菜单里有重命名、归档、删除、分享。Claude.ai 有 Recents、Starred（置顶）和 Projects。Codex 桌面版在侧栏按项目分组列出线程。LobeHub 按助手分组列出话题，支持置顶和搜索。

**核验**：核心属实：workbench-navigation.tsx:117-133 在未选应用时只渲染空态；SidebarConversations.tsx:44 只拉单个 dialog，行（:107-143）没有菜单和筛选；use-home-local-threads.ts:37-42 注释确认自由模式对话只在内存；Explore 用 patterns/conversation-list.tsx 带重命名/删除（explore-sidebar.tsx:255-316）；chatKeys.dialogConversations 独立 key（use-chat-request.ts:22-25）；后端 chat_api.py:1047/1111/1158 存在，db_models.py Conversation 无 pinned，enhanced_chat_sse（llm_app.py:2669）不落库。需要修正的细节：(1) 服务端 name 参数是精确匹配（MultiRAG/api/db/services/conversation_service.py:56-57 `name == name`），不能作为「补查」搜索；(2) 会话目前没有 URL（Home 由 store 驱动），⋯ 菜单里的「复制链接」须先有 /chat/:id 或 ?app=&c= 深链；(3) 过渡期并发拉取不能沿用 getConversationsByDialog 的 page_size:0（src/api/conversation.ts:136-139，拉全部），应传小 page_size 并用 orderby=update_time（get_list 接受任意模型字段，conversation_service.py:60-63）；(4) 置顶属于用户数据而不是 UI 偏好，存进 ui store 违背「仅持久化 UI 偏好」且不能跨设备；(5) 审计漏掉了主区已有的「继续」入口：home-recent-work.tsx 列出最近应用/知识库，local-threads.tsx 列出本次访问的模型对话，recent-app-conversations.tsx 列出选中应用的会话。后端补充：ConversationService.get_all_conversation_by_dialog_ids（conversation_service.py:73）已能跨 dialog 查询，但只用于账户删除（user_account_service.py:297），所以新增跨应用路由的工作量较小。git log 自 2026-10-05 以来没有修复。

#### shell-02 切到别的页面就中断正在生成的回答，外壳也没有后台运行或运行中的状态

高 · 工作量 M · 不需要后端 · interaction

**现状**：在首页发起一个较长的 RAG 或 MCP 回答后，只要点 rail 去看知识库，本地流就被 abort，会话被重置。自由模式的对话会直接丢失。外壳上看不到任何「还在生成」的信号。

**证据**：

- src/pages/home/hooks/useHomeChat.ts:212-218 — 卸载时调用 detachRequest() 和 resetConversation()
- src/pages/home/hooks/useHomeChat.ts:127-133 — detachRequest 会 abort 本地流并清空流式状态
- src/lib/router.tsx:323-324 — HomePage 是普通子路由，点 rail 上任何一项都会卸载它
- src/pages/home/hooks/use-home-local-threads.ts:37-42 — 本次访问里的模型对话列表随 Home 卸载一起消失
- src/components/layout/SidebarConversations.tsx:103-143、src/components/layout/Sidebar.tsx:116-123 — 会话行和 rail 图标都没有运行中或完成未读的状态
- node_modules/react 19.3.1：node 运行时验证 typeof React.Activity === 'symbol'（已可用）

**方案**：新增一个外壳级的 chat-run-registry：普通模块加 Zustand，按会话或线程 id 保存 AbortController、已收到的内容和状态，流式 chunk 不进 Query cache。HomePage 只通过 useSyncExternalStore 订阅这个注册表；路由卸载时只退订，不再 abort，只有显式停止、身份切换或新回答接管时才 abort。可以再用 React 19 的 \<Activity> 包住首页，保留滚动位置和草稿。注意 Activity 处于 hidden 时会清理 effect，所以 abort 不能留在 effect cleanup 里。外壳上的表现：后台有回答时，rail 的「对话」图标显示主色的呼吸点，对应会话行显示 spinner；完成后会话行出现未读点。如果用户不在该会话，弹一个 sonner toast「Tide 已回答 · 查看」，桌面端走系统通知。

**对标**：Codex 桌面版的任务在后台运行，侧栏线程会显示进行中的状态；Cursor 的 Background Agents 有运行列表。据我所知，ChatGPT 和 Claude.ai 生成过程中切走，回答会在服务端继续，回来后能看到（服务端行为我没有逐一核实）。

**核验**：属实。useHomeChat.ts:212-218 的卸载 effect 调用 detachRequest() 和 resetConversation()；:128-146 的 detachRequest 会 controller.abort() 并清空流式状态。router.tsx:323-324 的 HomePage 是 Layout 下的普通子路由，切换分区就会卸载。src/stores 下没有任何运行注册表，Sidebar.tsx:116-121、SidebarConversations.tsx:103-143 也没有运行中或未读状态。已验证 react 19.3.1 中 typeof React.Activity === 'symbol'。方案把 chunk 放在 store 的临时字段、不进 Query cache，符合 docs/agent-guidance/runtime.md:21,52 的约定；auditor 也正确指出 Activity 处于 hidden 时会执行 effect cleanup。补充两点。一，注册表必须保留现有的身份隔离：use-home-scope.ts:33-43 在 auth store 身份变化时会同步撤销请求，换身份时仍须 abort。二，toast 文案「Tide 已回答」里的 Tide 并不是用户可见的名称：locale 里只有 layout.brandName「沧溟 AI」，TideMark 是一个没有文字的波浪标记（brand-mark.tsx:16-34），文案应改用 brandName。自 2026-10-05 以来没有相关修复。

#### shell-03 新对话入口：⌘/Ctrl+N 在浏览器里会被拦截，自由模式下大概率是空操作，离开首页就找不到入口

中 · 工作量 S · 不需要后端 · interaction

**现状**：Chrome 和 Edge 保留 Ctrl+N，Web 上显示的 Ctrl N 键帽无效；焦点在输入框时这个快捷键也被跳过。面板展开时，只有首页分区顶部有「新对话」；面板折叠时，要 hover 首页图标打开 flyout 才能看到；另外可以通过 ⌘K 进入。人已经在首页自由模式时，面板按钮和 ⌘K 触发的全局「新对话」一定是空操作（store 值没有变化，作用域同步不会重跑）。只有对话区自带的 startNewChat 能真正新建，于是新建对话有两条行为不同的路径。

**证据**：

- src/lib/commands/keyboard.ts:17-22 — 新对话绑定 ⌘/Ctrl+N
- src/components/layout/workbench-quick-actions.tsx:60-74 — 面板按钮显示「Ctrl N」键帽
- src/lib/commands/keyboard.ts:29-31 — 只有 ⌘K 允许在输入框内触发
- src/components/layout/app-shell.tsx:105 — 只有 home 分区显示「新对话」按钮
- src/lib/commands/command-provider.tsx:95-98、src/stores/home.ts:126-129、src/pages/home/hooks/use-home-scope.ts:45-47 — 全局命令只把 selectedConversationId 置为 null；自由模式下它本来就是 null，effect 不会重新执行，当前显示的模型对话不会被清空（旧 shell-02 仍未关闭）
- src/pages/home/HomePage.tsx:152 — 自由模式的「新对话」走 ChatSection 自己的 startNewChat，新建对话因此有两条行为不同的路径

**方案**：沿用原方案。Web 端改为 ⌘/Ctrl+Shift+O 并加入 editableShortcuts；桌面原生菜单继续用 ⌘N，键帽按平台显示。NEW_CONVERSATION 统一调用首页提供的 startNewChat（经 home store 的 newChatNonce，或者 shell-02 的运行注册表），自由模式和应用模式都会先收起当前对话、清空，再聚焦 composer。rail 的品牌标记下方加一个常驻的 SquarePen「新对话」按钮，面板顶部原有按钮和折叠时的 flyout 入口都保留。

**对标**：ChatGPT Web 用 Ctrl/⌘+Shift+O 新建对话（在它的快捷键面板里列出）；ChatGPT 侧栏折叠后，rail 上仍保留「新聊天」和「搜索」两个图标。Codex 桌面版侧栏顶部常驻新线程按钮。

**核验**：大部分属实：keyboard.ts:17-22 绑定 Ctrl/⌘+N；:29-31 只允许 ⌘K 在输入框内触发；app-shell.tsx:105 的面板只在 home 分区显示按钮；command-provider.tsx:95-98 只调用 startNewConversation。需要修正三处。(1) 自由模式下的空操作是确定的，不是「大概率」：home.ts:126-129 只把本来就是 null 的 selectedConversationId 再置为 null，选择器值不变；use-home-scope.ts:45-47 的同步判断直接 return。所以在首页上点面板的「新对话」或用 ⌘K 都清不掉当前的模型对话。从其他分区触发时 HomePage 会重新挂载，本来就是新对话。(2) 面板折叠时并不是没有入口：Sidebar.tsx:142-145 的 hover flyout 对首页图标会渲染「新对话」；⌘K 的命令组里也有「新对话」。(3) 两条路径的说法成立：HomePage.tsx:152 的自由模式走 useHomeLocalThreads 的 startNewChat，它会把当前对话收进本地线程。ChatGPT 的 Ctrl/⌘+Shift+O 快捷键属实，Chrome 确实不让网页拦截 Ctrl+N。

#### shell-04 ⌘K 覆盖面窄：封闭的 8 条命令，没有路由级动作、最近访问和「问 Tide」兜底，Web 上入口也不显眼

中 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：面板已经能跳转和搜三类实体，体验比旧审计时好很多（旧 shell-07 部分修复）。但它仍是一个全局静态列表：不知道当前在哪个页面，不能对当前对象执行动作，空查询时没有「最近」，查不到时也没有 AI 兜底。

**证据**：

- src/lib/commands/types.ts:1-10 — ProductCommandId 是封闭 enum，共 8 条
- src/lib/commands/command-provider.tsx:78-157 — 命令全部在 provider 内静态注册，没有路由级的 useRegisterCommand
- src/lib/commands/palette-items.tsx:143-155 — 目的地只来自 navItems 的 10 项，设置子页（模型供应商、模型网关、API Key、MCP、外观）不可达
- src/lib/commands/palette-entity-items.tsx:35-49 — 实体只有会话、知识库、对话应用三类，没有智能体、搜索应用、记忆、技能、MCP 服务
- src/lib/commands/palette-items.tsx:156-172 — 主题只有明、暗、系统三项，切不了六套配色和密度
- src/components/layout/app-top-bar.tsx:116-141 — Web 顶栏没有搜索或 ⌘K 按钮；面板折叠时只能在 hover flyout 里找到
- MultiRAG/api/apps/restful_apis/agent_api.py:1570、search_api.py:223、memory_api.py:128、mcp_api.py:123 — 智能体、搜索应用、记忆、MCP 服务都已有列表接口

**方案**：(1) 复用现有 CommandRegistry，通过 context 暴露 useRegisterCommands(commands, deps)，用 CommandScope.ROUTE 标记；路由命令的 id 用命名空间字符串（如 'kb.upload'），ProductCommandId 只留给全局命令和桌面原生菜单。首批路由命令沿用原方案。(2) 实体组增加智能体、搜索应用、记忆、技能、MCP 服务，每组 6 条，用 EntityAvatar 或 ProviderLogo 保留彩色身份；目的地补上设置子页。(3) 空查询时显示「最近」组，按身份存 localStorage，属于单个查看者的便利项。(4) 末尾固定一条「问 {brandName}：\<query>」，带品牌标记，回车即在首页新对话里发送。(5) 主题项扩展为 6 套配色加 custom，再加 compact/comfortable 密度。(6) Web 顶栏加一个紧凑的搜索按钮（⌘K 键帽）。

**对标**：Dify 1.17 的 Go to Anything 能跳到应用、知识和插件，并支持斜杠命令。Linear 的 ⌘K 随当前上下文给出动作（如修改当前 issue 的状态），空查询时显示最近访问。Raycast 和 Notion 在搜索无结果时提供「Ask AI」兜底。Vercel 控制台的 ⌘K 覆盖项目、团队和设置子页。

**核验**：核心属实。types.ts:1-10 的 ProductCommandId 是封闭的 8 项枚举，command-provider.tsx:78-157 全部静态注册。palette-items.tsx:143-155 的目的地只来自 navItems，不含设置子页；:156-172 只有明、暗、系统三个主题。palette-entity-items.tsx 的实体只有会话、知识库、应用三类。app-top-bar.tsx 的 Web 顶栏没有搜索按钮。后端 agent_api.py:1570、search_api.py:223、memory_api.py:128、mcp_api.py:123 都已核实存在，技能另有 skill_api.py:146 的 /spaces/{id}/skills。需要修正：(1) 「没有路由级注册」只说对了一半。CommandRegistry（src/lib/commands/registry.ts）已支持动态 register/dispose 和 revision 订阅，CommandScope.ROUTE 也已定义但没有使用（types.ts:19-22），缺的只是通过 context 暴露的 hook，以及放宽 id 类型；isProductCommandId 仍需保留给桌面原生菜单的 commandSource（command-provider.tsx:176-182）。(2) 「问 Tide」会给界面引入一个从未出现过的名字，应使用 layout.brandName（沧溟 AI）。(3) Dify「1.17」这个版本号无法核实；Goto Anything（⌘K，支持 @ 实体和斜杠命令）在 Dify 1.x 中较早就已推出，引用时应去掉具体版本号。其余对标（Linear 上下文动作和最近、Raycast/Notion 的 Ask AI、Vercel ⌘K）都可信。

#### shell-05 缺少活动中心：文档解析、索引、Agent 运行这类长任务只在各自页面内轮询

中 · 工作量 M · 需后端改动 · missing-pattern

**现状**：上传几百个文档后离开知识库页，就看不到解析还剩多少、哪些失败了。图谱索引、流水线、Agent 运行完成后也没有任何提示。对一个 RAG 平台来说，这正是最需要让 AI「在后台为你工作」可见的地方。

**证据**：

- src/hooks/use-document-request.ts:131-138 — 解析进度只在文档列表页挂载时轮询
- src/hooks/use-generate-task.ts:97-102 — 图谱和 RAPTOR 任务的轮询同样只在页面内
- src/components/layout/sidebar-utilities.tsx:108-119 — 外壳上唯一的提醒信号是头像上的团队邀请小圆点
- src/platform/contracts/platform.ts:10、src/platform/desktop/index.ts:45 — 桌面端声明了 notifications 能力，但 grep 显示渲染层没有任何调用
- MultiRAG/api/apps/restful_apis/dataset_api.py:365（每个数据集的摄取概览）、:492（索引任务追踪）、document_api.py:494 与 api/db/services/document_service.py:340（文档列表支持按 run 状态过滤）、agent_api.py:1760（Agent 会话）、task_api.py:36（取消任务）

**方案**：在 rail 底部、头像上方加一个「活动」图标（lucide Activity），带运行中计数徽标和完成未读点。点开是 360px 宽的 Popover，用 36px 行，分两组。「进行中」：解析中的文档按知识库聚合，带知识库头像和进度条；图谱和 RAPTOR 索引；智能体和流水线运行；首页的后台回答（来自 shell-02）。「最近完成 / 失败」：失败项可一键重试或跳到日志。数据层新增 useActivityFeed：第一阶段只跟踪本次会话里用户自己发起的任务，在上传、解析、索引、运行的 mutation 成功后登记，用现有的单数据集接口轮询；任务完成时弹 sonner toast，桌面端再发系统通知。第二阶段请后端提供租户级的聚合接口（例如 GET /tasks?status=running,recent），或改为 SSE 推送，届时替换为单一数据源。

**对标**：ChatGPT 的 Tasks（定时任务）有集中列表和完成通知；Codex 桌面版和 Cursor 的 Background Agents 有运行中任务列表和完成提醒；Linear 有 Inbox；Onyx 等企业 RAG 产品提供连接器同步状态视图。

**核验**：属实。use-document-request.ts:131-138 的解析轮询只在文档列表查询挂载时进行；use-generate-task.ts:97-102 的图谱/RAPTOR trace 也只在页面内轮询。sidebar-utilities.tsx:108-119 头像上唯一的圆点是团队邀请。platform.ts:10 和 desktop/index.ts:45 声明了 notifications 能力，但 src 里没有任何调用（grep 只命中 locale 文案键）。后端 dataset_api.py:365（ingestions/summary）、:492（index trace）、document_api.py:494 加 document_service.py:340（run_status 过滤）、agent_api.py:1760、task_api.py:36（cancel）都已核实。没有找到租户级的任务聚合接口，所以 needs-backend 判断正确。sonner 已安装（package.json:145），方案可行，也不违反 rail 加面板的约束。

#### shell-06 路由没有元数据：全站没有 document.title，分区靠前缀推断，面包屑各页手写，错误边界只挂在根路由

中 · 工作量 M · 不需要后端 · information-architecture

**现状**：浏览器标签页和历史记录永远显示「沧溟 AI」，开了多个标签页就分不清。桌面窗口加载前显示 MultiRAG，加载后跟随 document.title，同样是固定的「沧溟 AI」。分区高亮靠路径前缀猜测，/document/:id/preview 这类页面会高亮首页并显示首页会话面板。errorElement 只挂在根路由，页面一崩，rail 和面板会整体消失。

**证据**：

- src/lib/router.tsx:314-584 — 所有路由都没有 handle；errorElement 只在 :580，`*` 在 :582，位于 Layout 之外
- 全仓 grep 没有页面级的 document.title（只出现在弹窗和报告构建代码里）；index.html:9 的标题固定为「沧溟 AI」
- src/components/layout/workbench-navigation.tsx:92-112 — getWorkbenchSection 用 startsWith 推断分区，兜底是 home，所以 /document/:docId/preview 会高亮「首页」并显示首页的会话面板
- src/pages/settings/SettingsLayout.tsx:162-212 — 设置页自己计算 currentTitle 和面包屑；src/components/page-templates/detail-template.tsx:20-21 — crumbs 由各页面手动传入
- desktop/electron/main/windows/main-window.ts:85 — 桌面窗口标题固定为 'MultiRAG'

**方案**：给路由加 handle: { section, titleKey, crumb?, immersive? }，新增 useRouteMeta()，基于 useMatches 统一派生分区（替换 getWorkbenchSection）、面包屑（模板默认读取，页面可用实体名覆盖）和标签页标题。标题格式为「<实体> · <分区> · {brandName}」，用 React 19 的组件内 \<title>。桌面端依靠 Electron 默认的 page-title-updated 行为自动同步，不需要额外的 IPC。在 Layout 下加一个无 path 的子路由挂 errorElement；`*` 移进 Layout 的 children。

**对标**：ChatGPT 的标签页标题是会话标题；Linear 和 Vercel 的标签页标题随当前实体变化（例如「Issue 标题 · Linear」）。React Router 7 官方推荐用 handle 加 useMatches 派生标题和面包屑。

**核验**：核心属实。router.tsx:314-584 的所有路由都没有 handle；errorElement 只在 :580；`*` 在 :582，位于 Layout 之外。全仓没有页面级的 document.title，也没有 useMatches；index.html:9 固定为「沧溟 AI」。getWorkbenchSection（workbench-navigation.tsx:92-112）用 startsWith 推断分区，兜底为 home，所以 /document/:docId/preview 会落到首页分区。SettingsLayout.tsx:162-212 自己计算标题和面包屑，detail-template.tsx:20-21 的 crumbs 由页面传入。Layout.tsx 内也没有 ErrorBoundary。需要修正：main-window.ts:85 的 title:'MultiRAG' 只是加载前的初始标题。全仓没有 page-title-updated 处理，Electron 默认会让窗口标题跟随 document.title，加载后显示「沧溟 AI」。所以 Web 端补上路由标题后，桌面窗口会自动跟随，preload 同步不是必需的。

#### shell-07 导航分组和命名混乱：一半目的地藏在「更多」里，「搜索」重名，MCP 会跳进设置，同一个应用有两处对话入口

中 · 工作量 M · 后端已有接口 · information-architecture

**现状**：rail 只有 4 个一级入口，搜索应用、技能库、记忆库、工作室、工具箱、MCP 要从「更多」进入，或者先进对应分区再从二级面板进入，都需要两步。「搜索」一词同时指搜索应用页和 ⌘K。MCP 一会儿跳进设置，一会儿是指向首页的「实验场」。首页和 Explore 读的是同一份后端会话，但用两套缓存和两套 UI，一处改名或删除后，另一处可能最多 2 分钟不同步。管理组对所有人可见。

**证据**：

- src/components/layout/Sidebar.tsx:27-34 — rail 只放了首页、探索、知识库、智能体，搜索、技能库、记忆库、工作室、工具箱、MCP 共 6 项都在「更多」菜单里
- src/components/layout/sidebar-config.ts:40-44 与 src/locales/zh-CN/layout.ts:23,47 — 一级目的地「搜索」（/search，搜索应用）与面板里的「搜索」（打开 ⌘K）同名
- src/components/layout/sidebar-config.ts:75-79 与 src/lib/router.tsx:468-470 — 「更多 → MCP」会重定向到 /settings/mcp，从工作区跳进设置布局
- src/components/layout/workbench-navigation.tsx:203-208 — 工具分区里的「MCP 实验场」实际链接到 /home
- src/pages/explore/components/explore-sidebar.tsx:111-115 对比 workbench-navigation.tsx:134-151 — 探索和首页都能和应用对话，各有一份会话历史
- src/pages/settings/SettingsLayout.tsx:126-155 — 设置的「管理」组对所有人可见；src/types/api.ts:251 有 is_superuser 字段但没有使用（旧 shell-14 仍未关闭）

**方案**：在 rail 加面板的框架内，以桌面端已有的 5 组活动（对话/工作、探索、知识、构建、连接/工具）为单一导航清单（见 shell-09），Web rail 直接渲染这 5 组，每组保留图标身份。搜索应用改名为「AI 搜索」，与 ⌘K 区分。MCP 列表直接在连接分区内渲染（复用设置页的 MCP 组件）。删除「MCP 实验场 → /home」这类伪链接，改为在 composer 的 MCP chip 上说明用法。Explore 的对话改为打开首页的同一会话（?app= 深链），短期先合并缓存 key，消除不同步。管理组按 is_superuser 和团队角色过滤。分区快捷键在桌面端用 ⌘1–⌘5；Web 端为了不与浏览器切换标签冲突，改用 G 加字母的序列（不在输入框内触发）。

**对标**：Dify 顶部是 Explore、Studio、Knowledge、Tools 四个区；Claude.ai 一级只有 Chats、Projects、Artifacts；ChatGPT 把 GPTs、项目、库作为一级名词；Codex 桌面版一级以线程为中心。

**核验**：部分属实：Sidebar.tsx:27-34 的 rail 只放了 4 项，其余 6 项都进了「更多」；sidebar-config.ts:40-44 与 zh-CN/layout.ts:23,47 的「搜索」重名；sidebar-config.ts:75-79 的 MCP 指向 /mcp-servers，router.tsx:468-470 再把它重定向到 /settings/mcp；workbench-navigation.tsx:203-208 的「MCP 实验场」链接到 /home；SettingsLayout.tsx:126-155 的管理组没有权限过滤，src 里 is_superuser 只出现在类型定义中。需要修正：(1) 「更多」里的项目并不是只能从「更多」进入。workbench-navigation.tsx:193-202 会把 navItems 按分区填进各分区的默认二级面板：知识分区列出知识库、技能库、记忆库；智能体分区列出智能体、工作室；探索分区列出探索、搜索；工具分区列出工具箱和 MCP。所以工作室可以从「智能体 → 面板 → 工作室」两步到达，问题在于 rail 上没有一级入口，而不是被藏起来了。不过 Explore、知识库详情等路由注册的面板会覆盖默认面板。(2) 首页和 Explore 用的是同一个后端会话接口（两处都调用 conversation.ts:130 的 getConversationsByDialog），并不是两份历史；问题是两套缓存 key 加两套 UI。Explore 改名或删除后只 refetch 自己的列表，首页的 byDialog 缓存（staleTime 2 分钟，use-chat-request.ts:39）会过期但不刷新。(3) ⌘1–⌘5 在 Web 上与浏览器的 Ctrl/⌘+数字切换标签页冲突。(4) 审计漏掉的一点：桌面端已经采用 5 组信息架构（work/discover/knowledge/build/tools，见 desktop-navigation.ts:24-92 和 commands/navigation.ts），与方案高度一致，应以它为单一清单统一 Web 端。

#### shell-08 快捷键体系太薄，没有速查面板，rail 的 tooltip 也不提示快捷键

低 · 工作量 S · 不需要后端 · missing-pattern

**现状**：进阶用户没法发现、也没法记住快捷键。键帽只出现在面板的两个按钮和 ⌘K 里。

**证据**：

- src/lib/commands/keyboard.ts:17-22,54-62 — 只有 4 个修饰键快捷键，外加前进和后退
- 全仓 grep 没有快捷键速查或帮助对话框（没有 shortcuts dialog，也没有 '?' 键处理）
- src/components/layout/Sidebar.tsx:155-165 — rail 的 tooltip 只显示名称
- src/components/layout/sidebar-utilities.tsx:132-243 — 账户菜单里没有「键盘快捷键」入口

**方案**：新增 ShortcutsDialog（ui/dialog 加 KbdShortcut），按「通用 / 导航 / 对话 / 编辑」分组，数据来自 keyboard.ts 的绑定表和 command registry，不另写一份。用 ⌘/ 打开，在输入框内也能触发；账户菜单和 ⌘K 的「命令」组各放一个入口。新增快捷键：⌘⇧O 新对话（见 shell-03）；分区切换在桌面端用 ⌘1–⌘5，在 Web 端用 G 加 H/E/K/B/C 序列。rail 的 tooltip 改为「名称 + KbdShortcut」。

**对标**：ChatGPT 按 Ctrl/⌘+/ 打开快捷键面板；Linear 按 ? 打开快捷键列表，tooltip 里直接带快捷键；GitHub 也用 ? 键；Slack 用 ⌘/。

**核验**：现状属实。keyboard.ts:17-22 只有 4 个修饰键快捷键，加上 :54-62 的前进和后退。全仓没有快捷键速查对话框，grep 命中的 '?' 都是 URL 查询处理，不是按键。Sidebar.tsx:155-165 的 tooltip 只显示名称。账户菜单（sidebar-utilities.tsx）没有快捷键入口。对标都可信：ChatGPT 用 Ctrl/⌘+/，Linear 和 GitHub 用 ?，Slack 用 ⌘/。需要修正方案：⌘1–⌘5 在 Web 上会抢占浏览器的标签页切换，应只用于桌面端，Web 端用 G 加字母的序列；速查面板的数据应读 command registry 和 keyboard.ts 里的 modifierShortcuts（command 对象里的 shortcut 字段只是展示字符串，真正的绑定在 keyboard.ts）。

#### shell-09 桌面端仍用系统标题栏，形成双层标题；导航清单、图标、品牌和账户入口都与 Web 分叉

中 · 工作量 M · 不需要后端 · consistency

**现状**：桌面版顶部是系统标题栏，下面又有一条应用 toolbar，形成双层标题。导航用的是独立清单，缺少技能库，图标与 Web 不一致。头像点下去直接进设置，没有账户菜单。产品在网页和窗口里叫「沧溟 AI」，在安装包和任务栏里叫「MultiRAG」。启动闪深色已被 ready-to-show 基本规避，但硬编码的深色背景仍会在缩放时露出。

**证据**：

- desktop/electron/main/windows/main-window.ts:78-90 — BrowserWindow 没设 titleBarStyle 或 titleBarOverlay，用系统默认标题栏；title 为 'MultiRAG'；backgroundColor 硬编码为 '#0f172a'，浅色主题启动时会先闪深色
- src/components/layout/desktop/desktop-toolbar.tsx:60-63 — 应用内 toolbar 再占一行（min-h-12），grep 全仓没有 app-region 拖拽区
- src/components/layout/desktop/desktop-navigation.ts:24-92 — 桌面有一份独立的导航清单，Knowledge 下没有 Skills（旧 shell-05 仍未关闭）；同文件 :94-103 的图标（Sparkles、Database、Bot）与 Web 的 sidebar-config.ts（Home、BookOpen、Workflow）不一致
- src/lib/commands/navigation.ts:4-12 — 第三份分区映射
- src/components/layout/desktop/activity-rail.tsx:69-88 — 设置按钮和头像按钮都执行 NAVIGATE_SETTINGS，桌面端没有账户菜单
- src/locales/zh-CN/layout.ts:3、index.html:9 — 产品叫「沧溟 AI」，rail 上是 Tide 标记，窗口标题又是 MultiRAG

**方案**：(1) BrowserWindow 改为 titleBarStyle:'hidden'；Windows 加 titleBarOverlay，主题切换时通过 IPC 调 setTitleBarOverlay 更新颜色；macOS 设置 trafficLightPosition。DesktopToolbar 设为拖拽区，按钮设为 no-drag，并给交通灯留位。backgroundColor 改为按启动时解析的主题 token 取值。(2) 新建单一的 navigation-manifest.ts（以桌面现有的 5 组为基础，补上技能库，图标统一），Web rail、移动 sheet、桌面 activity rail、⌘K 和面包屑都从它派生。(3) 桌面头像复用 SidebarUtilities 的账户菜单。(4) 品牌统一成一份配置，layout.brandName、index.html 和 DESKTOP_PRODUCT_NAME 都读它，不再把 Tide 当作产品名对外显示。

**对标**：Codex 桌面版（macOS）、Claude 桌面版、ChatGPT 桌面版、Cursor、Linear 桌面版都隐藏了系统标题栏，让侧栏和工具栏延伸到窗口顶端，macOS 交通灯内嵌，Windows 用叠加的窗口控件。Cherry Studio（Electron）同样自绘标题栏。

**核验**：核心属实。main-window.ts:78-90 没有设置 titleBarStyle 或 titleBarOverlay，所以保留系统标题栏；desktop-toolbar.tsx:60-63 又占了一行 min-h-12；全仓没有 app-region。desktop-navigation.ts:24-92 是独立的导航清单，没有技能库，图标（Sparkles、Database、Bot）也与 Web 不同；commands/navigation.ts 是第三份分区映射；activity-rail.tsx:69-88 的设置按钮和头像都执行 NAVIGATE_SETTINGS。需要修正：(1) 窗口是 show:false，在 ready-to-show 之后才显示（main-window.ts:81,99），theme-init.js 也会预置主题，浅色主题启动时闪深色基本已被规避；硬编码的 #0f172a 主要会在缩放、重绘露底时出现。(2) 窗口标题 'MultiRAG' 只是初始值，加载后跟随 document.title 显示「沧溟 AI」。(3) 用户可见的名称只有两个：「沧溟 AI」（index.html:9、layout.brandName）和「MultiRAG」（desktop/build/constants.mjs:3 的 DESKTOP_PRODUCT_NAME，用于安装包和任务栏）。Tide 只是没有文字的波浪标记，locale 里没有 Tide 文案，所以「三个名字」的说法夸大了。

#### shell-10 页面切换和导航动效几乎为零：动画库只在首页 composer 使用

低 · 工作量 S · 不需要后端 · visual

**现状**：在分区之间切换是硬切，懒加载时主卡片先变成 loading 块，再出现内容。rail 的选中态没有连续感，整体动态质感明显不如首页 composer 的入场动画。

**证据**：

- grep：motion/react 只在 src/pages/home/components/composer-entrance.tsx:7 和 home/motion-features.ts 中使用；全仓没有 viewTransition 或 startViewTransition
- src/components/layout/Sidebar.tsx:116-121 — rail 的激活态只是背景色瞬间切换
- src/lib/router.tsx:27-45 — 懒加载期间用一整块 PageLoadingState 替换内容区
- 运行时验证：react 19.3.1 导出了 ViewTransition；react-router-dom 7.18.5 支持 Link 和 navigate 的 viewTransition 选项

**方案**：(1) rail 的激活底块用 motion 的 layoutId 做共享布局动画，150ms，prefers-reduced-motion 下关闭。(2) 路由切换用 React Router 的 viewTransition 配合 React 19 的 \<ViewTransition>，只给主卡片内容区（view-transition-name: main-task）做 120ms 交叉淡入，rail 和面板保持静止。(3) 懒加载时保留旧页面（transition 导航），在主卡片顶部显示一条 2px 主色进度条，不再整块替换成 loading。保持克制，以平稳为主。

**对标**：Linear 和 Vercel 控制台切页几乎不出现白屏，侧栏选中态平滑移动；ChatGPT 新对话时 composer 从中间移到底部（本仓首页已经实现，可作为基调）。

**核验**：属实。motion/react 只在 src/pages/home/components/composer-entrance.tsx:7 和 home/motion-features.ts:3 中使用，全仓没有 viewTransition 或 startViewTransition。Sidebar.tsx:116-121 只有 transition-colors。router.tsx:27-45 的 withLoading 给每个路由单独包一层 Suspense，新挂载的边界即使在 transition 中也会先显示 fallback，所以确实是整块替换。已验证 react 19.3.1 中 typeof ViewTransition === 'symbol'，react-router-dom 版本为 7.18.5。补充一点：方案 (3) 要保留旧页面，需要把 Suspense 提到 Layout 的 Outlet 外层作为单一边界，单靠 transition 导航不够。

#### shell-11 账户菜单单薄：没有团队上下文、配色方案、快捷键、帮助和版本入口

低 · 工作量 S · 需后端改动 · missing-pattern

**现状**：菜单只有设置、团队邀请、外观与语言（明/暗/系统）、退出，看不出当前团队和角色。生成的六套配色（ink/mist/celadon/clay/iris/amber）、custom 品牌方案以及密度，都只能进设置页修改。没有快捷键、帮助和版本入口。

**证据**：

- src/components/layout/sidebar-utilities.tsx:132-243 — 菜单只有设置、团队邀请、外观与语言、退出
- src/components/layout/sidebar-utilities.tsx:195-211 — 只能切明、暗、系统三种主题
- src/themes/color-schemes.ts:8 — 六套配色方案已经存在（用户自己用 studio 方案加 compact 密度），但菜单里切不了
- package.json:4（version 0.9.8）、CHANGELOG.md — 界面上没有「新功能 / 版本」入口
- MultiRAG/api/apps/restful_apis/tenant_api.py:116 — 已有「已加入的租户」列表接口；api/utils/api_utils.py:412-427 — 当前租户取自 JWT，没有切换机制

**方案**：菜单头部显示用户名、当前团队名和角色徽标（来自 /tenants）。新增「配色方案」子菜单，用色块预览六套方案加 custom，再加 compact/comfortable 密度单选，直接调用现有的 appearance API。另加三项：「键盘快捷键 ⌘/」（见 shell-08）、「API 文档」（/settings/api/docs）、「更新日志 v0.9.8」（构建期注入 CHANGELOG 摘要）。多团队切换要等后端支持按请求选择租户后再做。

**对标**：Linear 左上角的工作区菜单里有切换工作区、邀请成员、快捷键；Claude.ai 和 ChatGPT 的账户菜单里有设置、帮助、快捷键和更新说明；Vercel 有团队切换器。

**核验**：现状属实。账户菜单（sidebar-utilities.tsx:130-245）只有设置、登录、团队邀请、外观与语言（只能切明/暗/系统）、退出。CHANGELOG.md 和 package.json:4（0.9.8）都存在，但界面上没有入口。tenant_api.py:116 的 /tenants 存在；async_current_tenant_id（api_utils.py:416-445）把租户固定为 JWT 中的用户本人，没有切换机制。需要修正配色细节：color-schemes.ts:8-15 的六套方案是 ink、mist、celadon、clay、iris、amber；另外还有 custom 品牌方案（appearance.ts:22-23）以及对比度、字号维度。用户原来的「studio」在 2.0 之后已经作为旧预设迁移到 ink（appearance.ts:28-29），不再是一个独立方案。

#### shell-12 Web 二级面板宽度固定，与桌面端和右侧详情面板的可调宽行为不一致

低 · 工作量 S · 不需要后端 · interaction

**现状**：会话标题较长、跨应用历史混排之后（shell-01），256px 的面板会频繁截断标题，而且无法拖宽。同一个产品，桌面端能调宽，Web 端不能。

**证据**：

- src/components/layout/app-shell.tsx:95 — Web 面板宽度固定为 16rem，最大 28vw
- src/components/layout/desktop/desktop-workbench.tsx:41-53 — 桌面端已用 react-resizable-panels 4.24 持久化宽度
- src/components/layout/ai-workspace.tsx:18,31-38 — 右侧详情面板的宽度已持久化
- src/stores/ui.ts:42-46 — Web 端只持久化了折叠状态（布尔值）

**方案**：Web 面板改用 ui/resizable，宽度范围 220–360px，用像素约束。与桌面端共享持久化时，先把两端统一为像素（或者保留 desktopSidebarWidth 的百分比、Web 单独存一个像素字段），不要直接混用。拖到最小宽度以下即折叠，与 ⌘B 共用 sidebarCollapsed；双击分隔条复位。会话标题被截断时，hover 显示完整标题的 tooltip。

**对标**：Linear、VS Code 和 Cursor 的侧栏都可以拖拽调宽；VS Code 和 Cursor 双击分隔条可以复位。

**核验**：现状属实。app-shell.tsx:95 的 Web 面板固定为 calc(16rem\*text-scale)，最大 28vw；desktop-workbench.tsx:41-53 用 react-resizable-panels 4.24.0 并持久化宽度；ai-workspace.tsx:18,31-38 用 localStorage 持久化右侧面板宽度；ui.ts:42-46 的 Web 端只持久化 sidebarCollapsed；src/components/ui/resizable.tsx 已存在。需要修正方案：desktopSidebarWidth 存的是百分比（minSize 16%、maxSize 30%，desktop-workbench.tsx:46-48），而方案的 Web 目标是 220–360px，直接「合并为同一个持久化字段」会混用单位，要先统一单位或者保留两个字段。

### knowledge：知识库、检索、文档与记忆

**维度结论**：2026-10-05 审计以来，知识域改动很多（约 100 个提交）：Memory 写死的统计、列表搜索防抖、上传部分成功的对账、嵌入模型兼容检查、Pipeline 选择器都已修好。文档页换成了 DataTable，加了 Inspector、解析步骤、拖拽上传和状态汇总；切片页有可调宽的原文对照和 PDF 坐标高亮；检索分数条能区分“不可用”和 0；搜索、Memory 也接入了 Tide 身份。这些不再重复提。

还差的地方集中在三处。

1. 知识域的 AI 能力没有接通，各段之间断开。引用点“查看原文”只打开第 1 页，不定位、不高亮；搜索应用的答案仍在用旧的 ReferenceMarker/ReferencePanel 和内联 !important 样式，没有用 Home/Explore/Studio 已经统一的 CitationChip/SourceStrip/RunTimeline/AnswerIdentity；知识库详情里没有“问答/概览”入口。同类产品 NotebookLM、Perplexity、RAGFlow 都把“问答 → 引用 → 原文定位”做成一条连续路径。
2. 进入知识库这一步还停在 2024 年的形态。建库时把 parser_id 写死为 naive，分块配置只能看静态 SVG 示意，后端现成的 /preview_chunks 前端从未调用；上传绑在弹窗里，进度只有 0 和 100 两档。卡片只显示文档数和切片数，看不出索引健康，没上传头像的知识库全是同一个图标、同一个底色。
3. 底层组件一致性和技术选型。切片内容在 5 处各用一套净化白名单，表格切片在切片页和检索测试里被压成一串文字；PDF 预览用的是 react-pdf-highlighter 8.0.0-rc.0，锁定 pdfjs-dist 4.4.168，没有缩放、翻页、查找，高亮只支持 PDF；.doc/.xls/.ppt 被交给只认 OOXML 的渲染器；HTML、EML 没有预览。检索测试的参数仍藏在覆盖层里，向量/关键词权重有两处入口，结果卡醒目显示原始 chunk ID，也没有跳到切片的入口（knowledge-09 仍未关闭）。Memory 更像数据库控制台，不像 ChatGPT/Claude 那样告诉用户“AI 记住了什么”。

方案保持现有的二级导航、卡片网格、ProviderLogo、彩色起始卡片和 Tide 视觉，重点补上：可定位的原文查看器、带实时分段预览的建库向导、改用共享部件的 Perplexity 式搜索结果页、显示索引健康的知识库卡片、全局的上传与解析托盘、常驻参数栏的检索测试台，以及知识库级的问答入口。

**已做好、应保留**：

- 知识库列表沿用 CollectionTemplate：数量少时默认网格，有 ResourceCreateCard 和 EmptyStart 双路径（上传 / 连接数据源，带彩色图标块），筛选为空、加载失败、首次使用分成不同状态（src/pages/knowledge/KnowledgeListPage.tsx:29-106）。
- 嵌入模型身份在卡片、二级面板、选择器里一致：EmbeddingModelChip / EmbeddingModelLabel 走 ProviderLogo（src/components/knowledge/knowledge-identity.tsx:79-121）；KnowledgeBaseSelector 用 cmdk 做命令式选择，带头像和模型（src/components/knowledge/KnowledgeBaseSelector.tsx:8-101）。
- 文档页已经现代化：DataTable 支持行选择和激活行，有 Inspector（解析步骤时间线、切片预览、属性、元数据），可拖拽上传，有 BulkActionToolbar，RAPTOR/图谱任务有 GenerateTaskDock（src/pages/knowledge/documents/KnowledgeDocumentsPage.tsx:123-270）。
- 解析中状态体现了 AI 存在感：百分比文字用 text-shimmer，下面是 bg-ai-tide 细进度条；失败时可在行内重试（src/pages/knowledge/documents/document-status-cell.tsx:66-117）。解析日志拆成逐步时间线，完整日志放在折叠区里（src/pages/knowledge/documents/components/document-parse-steps.tsx:77-143）。文档列表只在有任务运行时轮询，并用 placeholderData 防止闪烁（src/hooks/use-document-request.ts:131-141）。
- 切片工作区：react-resizable-panels 可调宽对照，窄屏退化为 Sheet，PDF 用 positions 高亮，切片卡展示关键词/问题标签和图片缩略图（src/pages/knowledge/document-chunks/components/document-chunks-shell.tsx:18-85、chunk-list-row.tsx:192-254）。
- 检索分数条把缺失值显示为虚线的“不可用”，不会当作 0（src/pages/knowledge/search-workbench/result-card.tsx:21-72）；结果卡有 FileKindTile 文件身份。
- 搜索应用已复用共享的 ChatComposer（Tide composer + 听写），起始页有彩色起始卡片，有思维导图抽屉和 Markdown 导出；摘要卡有 ai-tide 顶边，生成时有 ai-glow（src/pages/search/detail/components/search-composer.tsx:5-11、search-starter-view.tsx:18-35、search-summary-card.tsx:101-130）。
- Memory 详情：Tide 身份头部，“记忆 / 来源”双视图，启用/停用/遗忘三种生命周期，召回测试 Sheet，Inspector 关闭后焦点回到触发处（src/pages/memory/MemoryMessagesPage.tsx:128-286）。
- 文档预览：FileKindTile 文件身份、水印、按错误类别显示本地化文案（不泄露后端原文）、Office 渲染器懒加载（src/pages/document-preview/index.tsx:97-190、src/components/knowledge/document-preview/index.tsx:117-125）。
- 检索测试结果卡已经用 ScoreBar 分别展示综合/向量/关键词三种分数（result-card.tsx:105-121，提交 90ab74e5），配合 FileKindTile，是 RAGFlow 式三分数展示的基础，阈值刻度和权重组成只需在此基础上叠加。
- 检索模式的权重滑块已配 ReadonlyWeightBar 显示互补值（search-mode-section.tsx:222-226,256-260），离双色‘语义 ↔ 关键词’滑块只差合并视觉。
- use-search-execution.ts 用请求序号丢弃过期响应，并在按文档筛选时保留更大的 doc 选项集（149-163 行），避免零结果把用户困在隐藏的筛选里，这个细节是对的。
- 文档表已有按文档修改分块方式的 ChunkMethodModal，以及批量开始/停止解析、启用/停用的浮动 BulkActionBar（KnowledgeDocumentsPage.tsx:260-268），重试和改解析器的批量能力已经具备，缺的是快捷入口和预览。
- Memory 页对计数口径如实标注‘本页’，并用说明弹层解释生命周期（MemoryMessagesPage.tsx:340-372），没有把页内数字冒充为总数，诚实度优于很多同类控制台。
- 切片页 PDF 高亮在选中后会自动滚动到第一个高亮（pdf-preview.tsx:77-88），并用 data-pdf-highlight-focus 标出焦点，知识域定位能力的基础已经有了。
- 聊天证据面板 evidence-source-detail.tsx 已有 EvidenceScoreBars、水印和命中词高亮，并对网页来源和文档来源分别处理（reference-meta.tsx:167-176），SourceViewer 可以直接挂在这里。
- 后端 /datasets 列表的 include_parsing_status、/ingestions/summary、chunk list 的 id 参数都已就绪，知识域多数改进确实只需前端接入，审计在这一点上判断准确。

#### knowledge-01 点引用打开原文时不定位、不高亮：答案和原文之间断开

高 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：Home/Explore/Studio 和搜索应用里点引用，只能看到切片原文；点“查看原文”会新开标签页，从第 1 页开始，看不到被引用的段落在哪。切片页虽然能高亮 PDF，但不支持 ?chunk= 深链，从其他页面没法直接定位过去。

**证据**：

- src/components/chat/reference-meta.tsx:177-184 — 原文链接只拼 /document/:id/preview?name=，不带 chunk id、positions 或页码
- src/components/chat/evidence-source-detail.tsx:121-131 — 证据面板里的“查看原文”在新标签页打开上面的链接
- src/pages/document-preview/index.tsx:82-84 — 预览页只读 name 和 extension 两个参数
- src/pages/document-preview/index.tsx:184-189 — 渲染 DocumentPreview 时不传 highlights
- src/components/knowledge/document-preview/index.tsx:96-104 — 组件不解构 selectedChunkId（调用方传了但被忽略）
- src/components/knowledge/document-preview/index.tsx:139-145 — 只有 PdfPreview 接收 highlights
- src/pages/knowledge/document-chunks/components/document-chunks-shell.tsx:70-81 — 切片页已能把 positions 转成高亮，说明能力存在但没有对外开放
- src/pages/search/detail/search-reference-chunk.ts:9-23 — 引用块本身带有 positions 和 dataset_id
- MultiRAG/api/apps/restful_apis/chunk_api.py:234 — 后端有按 id 获取单个切片的接口（含 positions）

**方案**：同原方案，修正第 3 步：pages/document-preview 读取 chunk/kb 参数后，调 GET /datasets/{kb}/documents/{doc}/chunks?id=\<chunk>（返回规范化 positions），或调单切片 GET 并把 position_int 映射为高亮；DocumentPreview 同时开始消费 selectedChunkId，为文本类预览做定位。证据面板（Home/Explore/Studio 已是侧栏）内建议用‘原文’视图或加宽面板原地展示 SourceViewer，不再嵌套 Sheet；新标签页降为次要操作。保留水印、FileKindTile。

**对标**：NotebookLM 点引用后，左侧打开来源并滚动到被引用的句子，高亮显示；RAGFlow 聊天里点引用的文档，会弹出 PDF 预览并高亮对应切片；Vercel AI Elements 的 InlineCitation 用悬浮卡展示来源，可以逐条切换。

**核验**：核心成立。reference-meta.tsx:167-184 的 getOriginalSourceLink 只拼 /document/:id/preview?name=；evidence-source-detail.tsx:121-131 以 target=\_blank 打开；pages/document-preview/index.tsx:82-84 只读 name/extension，184-189 渲染 DocumentPreview 不传 highlights；components/knowledge/document-preview/index.tsx:96-104 不解构 selectedChunkId（types.ts:21 声明了，document-chunks-shell.tsx:74 传入后被丢弃）；只有 PdfPreview 收 highlights（index.tsx:139-145）。全仓 grep 不到任何 ?chunk= 深链处理。src/components/chat 下没有任何 DocumentPreview 消费方，聊天侧确实无法原地看原文。2026-10-05 以来这些文件的提交（f54ac7b8、e1c9bcbe、114c4167 等）均未补定位。后端细节需修正：GET /datasets/{ds}/documents/{doc}/chunks/{chunk_id}（chunk_api.py:234-249）经 \_strip_chunk_runtime_fields 返回原始字段名 position_int，并非 positions；而 list 接口带 id 参数（chunk_api.py:190,201-207）走 \_chunk_payload，返回规范化的 positions（chunk_api.py:137）。预览页定位应调 list?id= 或在前端映射 position_int。基准（NotebookLM 定位高亮、RAGFlow 聊天里的 PDF 抽屉高亮、AI Elements InlineCitation）可信。

#### knowledge-02 建库仍写死 naive 解析，看不到真实分段预览；/preview_chunks 一直没接（knowledge-01 仍未关闭）

高 · 工作量 L · 后端已有接口 · missing-pattern

**现状**：建库时固定为 naive，没有分块步骤；上传、解析完成后才知道切分是否合适。可以在设置页改知识库默认解析器，或在文档表里用 ChunkMethodModal 改单个文档的分块方式，但两处都只有静态示意图或参数表单，看不到真实切片，只能改完重新解析再看，来回多次。

**证据**：

- src/pages/knowledge/create/use-create-knowledge.ts:100-107 — 创建请求写死 parser_id: 'naive'
- src/pages/knowledge/KnowledgeCreatePage.tsx:10 — 步骤只有 details 和 import 两步，没有分块步骤
- src/pages/knowledge/create/create-knowledge-form.tsx:93-218 — 表单只有名称、描述、语言、嵌入模型、权限五项
- src/pages/knowledge/settings/ParserVisualizationPanel.tsx:10-21 — 右侧“预览”是按解析器 glob 加载的静态 SVG 示意图
- src/pages/knowledge/KnowledgeSettingsPage.tsx:72-77 — 解析器用纯文本下拉 SelectWithSearch，名字来自英文常量
- src/types/document-parser.ts:19-35 — DOCUMENT_PARSER_TYPE_LABELS 是写死的英文（General、Q&A、Laws…），中文界面也直接显示
- MultiRAG/api/apps/document_app.py:1860 — 后端有 POST /preview_chunks：只做解析和切片，不向量化，支持直传文件和批次
- 前端 grep preview_chunks/previewChunks 没有任何结果

**方案**：同原方案（三步向导 + ParserCardGrid + ChunkPreviewPane，名称说明走 i18n，SVG 降级为卡片缩略图）。补充：previewChunks 封装在 src/api/knowledge-document-parser.ts，调用 /v1/document/preview_chunks（multipart：request=JSON 字符串，file=样例文件），TanStack Query 带 signal、参数防抖；ChunkMethodModal 也复用同一个 ChunkPreviewPane，对当前文档直接预览。

**对标**：Dify 创建知识库分三步：选数据源 → 分段与清洗（右侧对真实文件“预览分段”）→ 处理并显示逐文件进度；FastGPT 导入也是“选文件 → 数据处理 → 分段预览 → 上传”；RAGFlow 用插图示意解析方式（本仓现有 SVG 就是这个思路），但调参时没有真实预览。

**核验**：核心成立：use-create-knowledge.ts:100-107 写死 parser_id:'naive'；KnowledgeCreatePage.tsx:10 只有 details/import 两步；ParserVisualizationPanel.tsx:10-21 按 glob 加载静态 SVG；KnowledgeSettingsPage.tsx:72-77 选项 label 用英文常量 DOCUMENT_PARSER_TYPE_LABELS（document-parser.ts:19-35）；前端 grep preview_chunks/previewChunks 无结果。需修正两点：(1) ‘只能去设置页改解析器’偏重——文档表已有按文档改分块方式的 ChunkMethodModal（components/knowledge/ChunkMethodModal.tsx，经 parser-method-cell.tsx 打开），只是同样没有真实预览；(2) /preview_chunks 在旧式 document_app.py:1860，经 api/apps/\__init_\_.py:420-426 的 register_page 挂在 /v1/document/preview_chunks（非 /api/v1 REST 体系），依赖 Depends(manager) 会话认证，multipart 时 JSON 放在 request 表单字段、文件放 file 字段。前端已有其他 /v1/ 旧路由在用（src/api/agent.ts:379），可接但应在 knowledge-document-parser 领域 API 封装并注明路由归属。Dify/FastGPT 的分段预览基准可信。

#### knowledge-03 搜索应用答案页仍用旧的引用组件和内联样式，和共享会话的 Tide 证据体系不一致

中 · 工作量 M · 不需要后端 · consistency

**现状**：搜索结果页的问题标题、摘要卡、文档筛选栏、切片列表、相关问题都是自己搭的，引用标记和来源面板跟主会话长得不一样；生成过程中看不到来源，答案也没有标出由哪个模型生成。

**证据**：

- src/pages/search/detail/components/search-summary-card.tsx:9-13 — 引入的是 ReferenceImageList、ReferenceMarker、ReferencePanel、RetrievalProgress、ThinkWrapper 这一套旧组件
- src/components/chat/message-parts.tsx:8-12 — Home/Explore/Studio 已统一为 citation-chip、source-strip、run-timeline、answer-identity
- src/pages/search/detail/components/search-summary-card.tsx:146-191 — 组件内写 \<style> 块，用 !important 覆盖表格、代码、链接颜色，绕开了 src/styles/markdown-prose.css
- src/pages/search/detail/components/search-summary-card.tsx:202 — 来源面板要等流式结束（!isStreaming）才出现
- src/pages/search/detail/components/search-turn-item.tsx:84-141 — 每轮头部是“第 N 轮 / 当前 / 问题”的控制台式标签
- src/pages/search/detail/components/search-turn-item.tsx:66 — 开启摘要后，切片列表默认折叠在“显示切片”按钮后面
- src/pages/search/detail/components/search-turn-item.tsx:155-170 — 右侧固定一列 16rem 的勾选式文档筛选栏
- src/pages/search/detail/components/search-starter-view.tsx:19-35 — 起始问题是写死的 summarize/locate/compare 三条文案
- src/pages/search/detail/components/search-detail-header.tsx:106-109 — 只显示“N 个知识库”，不展示检索的是哪些库

**方案**：同原方案（共享部件重写 search-turn-item、AnswerIdentity 显示搜索应用头像和模型 ProviderLogo、Tabs 答案/来源/思维导图、删内联 \<style> 改用 .prose + markdown-table、相关问题改‘继续追问’、起始页列出 KnowledgeAvatar 检索范围）。来源提前显示作为对共享 message-parts 的单独改动：检索阶段完成（retrievalStatus=complete）后就显示 SourceStrip，Home/Explore/Studio 一起受益，不在搜索页单独分叉。迁移清单加上 runtime-chat-message-list.tsx，完成后删除 ReferenceMarker/ReferencePanel。

**对标**：Perplexity 在答案上方先给出来源卡（序号 + 站点或文件 + 标题），答案流式生成时带编号引用和悬浮卡，结尾是可点的“Related”追问；ChatGPT 搜索用“Sources”按钮打开侧栏列出引用；Vercel AI Elements 提供 Sources / InlineCitation / Reasoning 等标准组件。

**核验**：大体成立：search-summary-card.tsx:9-13 引旧的 ReferenceImageList/ReferenceMarker/ReferencePanel/RetrievalProgress/ThinkWrapper；146-191 内联 \<style> 大量 !important，绕开 styles/markdown-prose.css；search-turn-item.tsx:84-141 的‘第 N 轮/当前/问题’头部、66 行开摘要后切片默认折叠、155-170 的 16rem 文档筛选栏、search-detail-header.tsx:106-109 只显示‘N 个知识库’均属实；Home/Explore 走 message-parts.tsx:8-12 的 CitationChip/SourceStrip/RunTimeline/AnswerIdentity。需修正：‘流式结束前看不到来源’不是搜索独有——共享 message-parts.tsx:160 同样是 showSources = references.length>0 && !isStreaming，所以换成共享部件本身不会让来源提前出现，要做 Perplexity 式‘检索返回即显示来源’，得改共享 message-parts，而这会同时影响 Home/Explore/Studio。另外旧 ReferenceMarker 还有 agent/components/runtime-chat/runtime-chat-message-list.tsx 在用，迁移范围应一并列出。起始卡（search-starter-view.tsx:19-35）走 i18n、带彩色图标块，问题在于它是通用文案、不按所选知识库生成，并非硬编码字符串。这是一致性和体验债，不阻断使用，严重度降为 medium。

#### knowledge-04 切片内容有 5 套净化白名单，表格切片在切片页和检索测试里被压成一串文字

中 · 工作量 S · 不需要后端 · consistency

**现状**：同一个表格切片：在聊天引用里显示成表格；在切片编辑页、文档 Inspector、检索测试、搜索切片列表里，变成单元格文字拼在一起，正好是最需要核对内容的地方读不了。

**证据**：

- src/pages/knowledge/document-chunks/components/chunk-list-row.tsx:12-15 — 白名单只有 em/strong/b/i/br
- src/pages/knowledge/document-chunks/components/chunk-list-row.tsx:91,223-230 — 能识别出 table 类型并标“表格”，但正文按上面的白名单渲染，表格结构被去掉
- src/components/knowledge/HighlightText.tsx:7-10 — 检索测试结果只允许 em
- src/pages/knowledge/documents/components/document-chunk-preview.tsx:9 — 又一套 em/strong/b/i/br
- src/pages/search/detail/components/search-chunk-list.tsx:20-33 — 再一套，含 mark/p/span/code/pre，没有 table
- src/components/chat/citation-chip.tsx:35 — 聊天引用允许 table/thead/tbody/tr/th/td
- MultiRAG/deepdoc/vision/table_structure_recognizer.py:360 — 后端把表格切片输出为 HTML \<table>

**方案**：新建 src/components/knowledge/chunk-content.tsx，以 reference-meta.tsx 已导出的 CHUNK_CONTENT_PURIFY_OPTIONS 为基础，加上 mark 和 code，收敛成一份策略。表格复用 components/chat/markdown-table 样式（横向滚动、表头吸顶），图片切片用 DocumentImage，支持 clamp 和命中高亮。替换上述 7 处，删掉各自的白名单；切片元信息行加类型图标，表格切片默认多展开几行。

**对标**：RAGFlow 的切片卡把表格切片渲染成 HTML 表格；Dify 的分段按 Markdown 渲染，表格可读。

**核验**：核心成立，但实际不止 5 套，grep ALLOWED_TAGS 共 7 处：citation-chip.tsx:35、reference-meta.tsx:12（导出的 CHUNK_CONTENT_PURIFY_OPTIONS，含 table/列表/p/div，供 evidence-source-detail.tsx:103-108 使用）、ReferenceMarker.tsx:45、HighlightText.tsx:8（仅 em）、chunk-list-row.tsx:13、document-chunk-preview.tsx:9、search-chunk-list.tsx:21（无 table）。所以聊天证据面板和引用悬浮卡能显示表格，切片编辑页（chunk-list-row.tsx:223-230 还叠加 whitespace-pre-wrap）、文档 Inspector 预览、检索测试 result-card（经 HighlightText）、搜索切片列表会把表格压成连续文字，与描述一致。后端 table_structure_recognizer.py:352-360 确实输出 \<table> HTML。近期提交（fec91e8b、8a7a32d2）未统一。

#### knowledge-05 检索测试台：参数藏在覆盖层里，权重概念有两处入口，结果醒目显示 chunk ID，也跳不到原切片（knowledge-09 仍未关闭）

中 · 工作量 L · 后端已有接口 · interaction

**现状**：调一次参数要“打开覆盖层 → 调 → 应用 → 看结果 → 再打开”；相似度阈值和结果分数之间看不出关系；看到可疑的命中也没法一键到切片页去修改。

**证据**：

- src/pages/knowledge/KnowledgeSearchPage.tsx:150-163 — 420px 宽的左栏只放了 SearchPanel
- src/pages/knowledge/search-workbench/search-panel.tsx:66-78 — 固定 200px 高的输入框
- src/pages/knowledge/search-workbench/search-panel.tsx:117-130 — 参数只以徽章展示，要点“设置”才能改
- src/pages/knowledge/KnowledgeSearchPage.tsx:193-210 — ConfigPanelSheet 盖在结果上，改完要“应用”
- src/pages/knowledge/search-workbench/config-panel/advanced-params-section.tsx:105-121 — vector_similarity_weight 一个滑块
- src/pages/knowledge/search-workbench/config-panel/search-mode-section.tsx:230-263 — fusion 模式下文本/向量权重又是一组滑块，概念重复
- src/pages/knowledge/search-workbench/result-card.tsx:101-103 — 排名旁边显示原始 resultId
- src/pages/knowledge/search-workbench/result-card.tsx:144-167 — 来源只有文件名和“来自文档”，没有页码，也没有定位入口
- src/pages/knowledge/search-workbench/result-preview-panel.tsx:43-46,62 — 详情里还是 ID，另加一个“Beta”徽章
- src/pages/knowledge/search-workbench/hooks/use-search-execution.ts:149-181 — 手写的请求序号状态机，没有 AbortSignal，也没有历史记录

**方案**：左栏改成常驻参数栏，去掉 ConfigPanelSheet；查询输入自动增高 3-6 行；检索方式分段控件（全文/混合/融合，向量模式按 DISABLED_SEARCH_MODES 标为不可用）。权重分两层：主区只放一根与所选模式绑定的双色‘召回：语义 ↔ 关键词’滑块；‘打分权重 vector_similarity_weight’放进‘高级’折叠区，附一句说明它影响结果排序分数，默认与召回权重联动，可解除联动。阈值滑块旁实时显示‘当前结果中有 n 条低于阈值’。阈值、Top-K、权重变化后防抖自动重跑；rerank、关键词抽取、知识图谱开关改动后只标‘待运行’，由用户点运行。本页会话内保留‘记录’列表。结果卡显示排名、FileKindTile、文档名和页码（来自 positions）；分数条加阈值刻度线；ID 收进溢出菜单的‘复制 ID’，删掉 Beta 徽章；加‘在文档中定位’按钮，跳 /knowledge/:kb/documents/:doc/chunks?chunk=\<id>（接 knowledge-01）。请求改用 useMutation 带 AbortController，新请求取消旧请求。

**对标**：RAGFlow 的检索测试左侧是常驻参数表单（阈值、关键词权重、rerank、知识图谱、测试文本），右侧是结果，并列出混合/关键词/向量三种相似度；Dify 的召回测试左侧有输入框和“记录”历史表，混合检索权重用一根“语义 0.7 / 关键词 0.3”的双色滑块表示。

**核验**：布局问题属实：KnowledgeSearchPage.tsx:150-163 左栏 420px 只有 SearchPanel；search-panel.tsx:77 输入框固定 h-[200px]，117-130 参数只以徽章展示，要点‘设置’；193-210 ConfigPanelSheet 覆盖结果，需要‘应用’；result-card.tsx:101-103 显示 resultId，144-167 只有文件名和‘来自文档’，没有页码（types.ts:18 已有 positions 却未展示），也没有跳切片入口；result-preview-panel.tsx:43-46,62 有 ID 和 Beta 徽章；use-search-execution.ts:149-181 用请求序号防竞态，没有 AbortSignal，也没有历史。需修正权重部分：入口其实有 3 处——advanced-params-section.tsx:105-121 的 vector_similarity_weight，search-mode-section.tsx:192-226 的 hybrid 向量/稀疏，230-263 的 fusion 文本/向量（每组都配 ReadonlyWeightBar 显示互补值，已是半个‘双色条’）。而且这几处不是同一个概念：search_mode 的权重控制召回候选融合，vector_similarity_weight 是最终打分/重排权重（MultiRAG core/nlp/search.py:927 rerank_by_model(1-w, w)）；显式传 search_mode 时后端两者都会用（dataset_search_service.py:130-147）。原方案‘合并成一根滑块’会丢失语义。参数变动就自动重跑也要区分代价：rerank、keyword（会调 LLM 抽关键词，dataset_search_service.py:126-128）、知识图谱都很贵。RAGFlow/Dify 的基准可信。

#### knowledge-06 文档预览技术栈偏旧：PDF 用 rc 版 react-pdf-highlighter + pdfjs 4.4，没有阅读工具栏；旧版 Office 交给不兼容的渲染器；HTML/EML 不能预览

中 · 工作量 L · 不需要后端 · tech-choice

**现状**：大 PDF 只能滚动浏览，不能缩放、跳页或查找；横版页或页面尺寸不一的 PDF，高亮可能偏位；.doc/.xls/.ppt 会进入渲染失败状态；网页导入的 HTML 和邮件没法预览；Word/Markdown 来源在切片对照时无法定位。

**证据**：

- package.json:139 — "react-pdf-highlighter": "^8.0.0-rc.0"；npm ls 显示它锁定 pdfjs-dist@4.4.168
- src/components/knowledge/document-preview/components/pdf-preview.tsx:51-75 — 只取第 1 页的 viewport，用它换算所有页的高亮坐标
- src/components/knowledge/document-preview/components/pdf-preview.tsx:94-144 — 直接渲染 PdfHighlighter，没有缩放、页码、查找、缩略图、大纲
- src/lib/knowledge/preview-resource.ts:9-19 — FileType 里没有 html/eml/audio
- src/lib/knowledge/preview-resource.ts:106-108 — doc/xls/ppt 分别映射到 docx-preview、@js-preview/excel、pptx-preview 这三个只支持 OOXML 的渲染器
- src/components/knowledge/document-preview/index.tsx:139-194 — 只有 PDF 收到 highlights，其余格式都不能定位

**方案**：把 PDF 层换成维护中的方案：首选 react-pdf-highlighter-extended，或者 react-pdf v10 + 自建高亮层，对 EmbedPDF 做一次 spike 比较。升级到 pdfjs 5，worker 和 cMap 路径保持不变。新增 DocumentViewerToolbar（components/knowledge/document-preview/components/viewer-toolbar.tsx）：页码 x/y、适合宽度/缩放、查找（Ctrl+F）、缩略图/大纲侧栏、在多个高亮之间上一个/下一个。按每页实际尺寸换算高亮坐标。文本类预览（md/txt/csv/docx 输出的 DOM）接受 highlights，按文本定位（与 knowledge-01 共用 use-source-locator）。新增 html 预览（按 AGENTS 规则放进沙箱 iframe）和 eml 预览（头信息卡片 + 正文）。.doc/.xls/.ppt 直接进入 UnsupportedPreview，提供下载并说明原因，不再尝试渲染后报错。

**对标**：据我所知，pdf.js 主线已到 5.x；wojtekmaj 的 react-pdf v10 已基于 pdfjs 5；react-pdf-highlighter-extended 是仍在维护的分支；EmbedPDF（PDFium WASM）以插件方式提供缩放、查找、缩略图、标注。Glean 和 NotebookLM 的来源查看器都支持在原文中定位段落。

**核验**：属实。package.json:139 是 react-pdf-highlighter ^8.0.0-rc.0，node_modules 里它 pin 了 pdfjs-dist 4.4.168（顶层 pdfjs-dist 也是 4.4.168）；pdf-preview.tsx:51-75 只取 getPage(1) 的 viewport，用它换算所有页的高亮坐标，94-144 直接渲染 PdfHighlighter，没有缩放、页码、查找、缩略图（grep zoom/toolbar 无结果）；preview-resource.ts:9-19 的 FileType 没有 html/eml/audio，106-108 把 doc/xls/ppt 交给只支持 OOXML 的 docx-preview、@js-preview/excel、pptx-preview；index.tsx:139-194 只有 PDF 收 highlights。2026-10-05 以来这些文件只有主题色、antd 移除和样式加载改动，没有升级。基准：react-pdf v10 基于 pdfjs 5、react-pdf-highlighter-extended 仍在维护、EmbedPDF 基于 PDFium WASM，均可信，原文已用‘据我所知’软化。后端：MultiRAG 无 LibreOffice 转换，旧 Office 在线预览需要后端，方案已注明。HTML 预览按 AGENTS 规则放沙箱 iframe，符合约束。

#### knowledge-07 知识库卡片看不出索引健康，未上传头像的知识库全部一个样子

中 · 工作量 M · 后端已有接口 · visual

**现状**：十个知识库并排时，图标和底色全都一样；哪个库在解析、哪个有失败文档、哪个还是空的，都要点进去才知道。

**证据**：

- src/components/knowledge/knowledge-identity.tsx:23-31 — knowledgeAvatar 固定 kind:'knowledge' + tone:'kind'
- src/components/patterns/entity-avatar.tsx:136-142 — tone 'kind' 时所有实例用同一种底色，seed 不起作用
- src/pages/knowledge/list/types.ts:3-7 — 注释写明列表请求没有带 include_parsing_status
- src/pages/knowledge/list/knowledge-item-parts.tsx:124-145 — 卡片标签只有嵌入模型、文档数、切片数
- src/pages/knowledge/KnowledgeListPage.tsx:107-129 + src/pages/knowledge/list/utils.ts:78-88 — 底部统计是本页求和
- src/pages/knowledge/list/knowledge-list-filter-bar.tsx:64-73 — 仍有常驻的“时间格式”显示菜单（knowledge-21 未关闭）
- MultiRAG/api/apps/restful_apis/dataset_api.py:257 — 列表接口支持 include_parsing_status
- MultiRAG/api/apps/services/dataset_api_service.py:389-401 — 按库返回 unstart/running/cancel/done/fail 五个计数

**方案**：列表请求带 include_parsing_status=true 并补类型。卡片底部加分段的‘索引健康’细条（完成/运行/失败/未解析，用 success/info/danger/fill 语义色），旁边写‘解析中 3 · 失败 1’；运行中文字用 text-shimmer；有失败时显示可点标签，跳到 /knowledge/:id/documents?run=4。knowledgeAvatar 改为 seed 底色（monogram 或图标）+ knowledge 角标，与搜索应用一致。groupBy=content 的分组扩展为按真实解析状态：有失败 / 解析中 / 未解析 / 已就绪 / 空库。时间格式菜单改为固定相对时间，悬停显示完整时间。底部‘本页统计’保留，可加一项‘本页解析中/失败’，等后端有租户级汇总再换成全局数字。

**对标**：Linear 的项目卡用健康状态（On track / At risk）和进度环让人一眼看到状态；Vercel 项目卡用状态点显示最近一次部署；Onyx 管理后台按连接器列出索引状态和失败数；本仓的搜索应用卡已经用 seed 色 + badge 区分（src/pages/search/components/search-collection.tsx:301）。

**核验**：核心成立：knowledge-identity.tsx:23-31 固定 kind:'knowledge' + tone:'kind'，entity-avatar.tsx:136-142 在 tone=kind 时忽略 seed；list/types.ts:3-7 注释写明列表未带 include_parsing_status；knowledge-item-parts.tsx:124-145 卡片只有嵌入模型、文档数、切片数；knowledge-list-filter-bar.tsx:64-73 仍有时间格式菜单。后端 dataset_api.py:257 的 include_parsing_status 和 document_service.py:501-531 的 unstart/running/cancel/done/fail 五个计数都已存在。需修正：(1) 同色图标是 64427e8e（2026-11-17）有意统一为‘knowledge 图标 + knowledge 底色’，改动应保留 knowledge 角标、只把底色改为按 seed 生成，与搜索应用卡（search-collection.tsx / search-detail-header.tsx:87-90 用 seed + badge）一致；(2) 没有‘需要关注’分组，现有 groupBy=content（zh 文案‘按文档状态’）只有 empty/hasDocuments 两组（zh-CN/knowledge.ts:63-71）；(3) 底部统计已明确标为‘本页知识库/本页文档/本页分块’（zh-CN/knowledge.ts:75-80），并不误导，结合用户‘不要做减法’的偏好，建议改造而不是撤掉。

#### knowledge-08 上传绑在弹窗里，进度只有两档，上传和解析没有连成一条进度

中 · 工作量 M · 后端已有接口 · interaction

**现状**：拖进 30 个文件后只能在弹窗里看转圈，不知道传到哪个文件，上传中也关不掉弹窗；传完弹窗关闭，要到表格里逐行看解析进度。失败文档要手动筛选、全选，再用批量栏‘开始解析’重试，状态汇总本身不能点。

**证据**：

- src/pages/knowledge/documents/document-upload-modal.tsx:205-208 — 普通文件一次 multipart 请求全部发出
- src/pages/knowledge/documents/document-upload-modal.tsx:189-195,239-246 — 每个文件只有 progress 0 和 100 两种状态
- src/pages/knowledge/documents/document-upload-modal.tsx:327-331 — 上传中不能关闭弹窗，用户被挡在弹窗里
- src/api/client.ts:534-541 — 已有 uploadWithProgress（src/api/conversation-upload.ts:33 在用），知识库上传没用
- src/pages/knowledge/documents/components/document-status-summary.tsx:31-48 — 状态汇总是不能点的纯文本
- grep retryAllFailed/reparseFailed 没有结果：没有“重试全部失败”入口
- src/pages/knowledge/documents/KnowledgeDocumentsPage.tsx:184-195 — RAPTOR/图谱任务已有 GenerateTaskDock，可以借用这个停靠样式

**方案**：同原方案（Zustand 只放 UI 状态的上传队列，逐文件 apiClient.uploadWithProgress，并发 3；入队后关闭弹窗；右下角 IngestTray 沿用 GenerateTaskDock 视觉，上传完成后切换为解析进度，支持取消和只重试失败的）。DocumentStatusSummary 改成 FilterChip：点‘失败 2’即筛 run=4，旁边提供‘重试 2 个失败’按钮，复用现有的批量解析动作（handleBatchStartParse → /datasets/{id}/documents/parse）。

**对标**：Dify 建库第三步逐个文件显示嵌入进度条；Google Drive 和 ChatGPT Projects 的上传在页面角落的托盘里逐个文件显示进度，可以继续操作别的内容；Onyx 的连接器页提供“重试失败”类批量操作。

**核验**：上传部分属实：document-upload-modal.tsx:205-208 普通文件一次 multipart 全部发出，189-195、239-246 每个文件只有 progress 0/100；327-331 handleClose 在 uploading 时不关闭；client.ts:534-541 的 uploadWithProgress 只有 conversation-upload.ts:33 在用；document-status-summary.tsx:31-48 是不可点的 \<ul>。需修正：‘失败的文档要逐个重试’偏重——BulkActionToolbar 已有 onStartParse（KnowledgeDocumentsPage.tsx:260-268），用户可以筛选失败、全选后批量开始解析，缺的是一键‘重试全部失败’的捷径和可点的状态汇总。基准里 ChatGPT Projects 并没有角落上传托盘，应改为 Google Drive / Dropbox 的上传托盘；Dify 第三步逐文件嵌入进度可信。另外，逐文件上传后，8d292eba 为批次部分成功写的对账逻辑（reconcileDocumentUploads）可以简化，表格列配置文件本来就是单文件请求，可直接并入队列。

#### knowledge-09 知识库详情里没有“问答/概览”：知识库只能维护，不能直接提问

中 · 工作量 L · 需后端改动 · information-architecture

**现状**：想验证“这个库能不能答好某个问题”，要么用只返回切片的检索测试，要么先去建一个搜索应用或聊天应用，再绑定这个库。

**证据**：

- src/pages/knowledge/components/knowledge-sections.ts:2-8 — 分区只有 documents、graph、search（检索测试）、logs、settings
- src/pages/knowledge/components/knowledge-navigation-panel.tsx:63-88 — 身份区只有描述、计数和嵌入模型，没有 AI 入口
- src/pages/home/utils/home-context.ts:54-67 — Home 只能通过“应用”间接带上知识库，不能直接选一个库
- MultiRAG/api/apps/restful_apis/chat_api.py:1292-1320 — /chat/completions 不带 chat_id 时直接调 LLM，不接受 dataset_ids
- MultiRAG/api/apps/restful_apis/search_api.py:299 — /searches/{id}/completions 必须先有搜索应用
- MultiRAG/api/apps/restful_apis/chat_api.py:897-910 — /chat/mindmap 已经直接接受 kb_ids

**方案**：在 KNOWLEDGE_SECTIONS 最前面加 ask（问答）：顶部是“知识库概览”卡（头像、描述、文档类型分布、索引健康、可点的建议问题标签）；下面复用共享的 chat-transcript + ChatComposer，上下文标签固定为当前库（KnowledgeAvatar）；答案用 CitationChip，点了进入 SourceViewer（knowledge-01）。二级面板身份区下方加主按钮“向这个库提问”。过渡方案（不改后端）：按钮“用搜索应用提问”自动创建或打开一个只绑定本库的搜索应用（POST /searches 已存在）。

**对标**：NotebookLM 打开笔记本即可对来源提问，每个来源有“来源指南”（摘要 + 关键主题 + 建议问题）；Perplexity Spaces 和 Claude Projects 都在同一个空间里放文件和对话；Notion AI Q&A 可以直接对工作区提问。

**核验**：属实。knowledge-sections.ts:2-8 只有 documents/graph/search/logs/settings；knowledge-navigation-panel.tsx:63-88 身份区只有头像、描述、计数和嵌入模型；home-context.ts:54-67 只能经应用间接带上知识库。后端确认：chat_api.py:1292 的 /chat/completions 在没有 chat_id 时用 \_build_default_completion_dialog（chat_api.py:555-580，kb_ids=[]），async_chat（dialog_service.py:1145 起）只从 dialog.kb_ids 取库，kwargs 只认 doc_ids/internet 等，请求里传 dataset_ids 不生效，所以 needs-backend 判断正确；/searches/{id}/completions（search_api.py:299）必须先有搜索应用，POST /searches（search_api.py:209）可作过渡；/chat/mindmap（chat_api.py:897）接受 kb_ids；/chat/recommendation（chat_api.py:927）需要传 question。在二级面板里加一个分区，符合 Codex 式二级导航约束。NotebookLM 来源指南、Claude Projects、Perplexity Spaces 的基准可信。

#### knowledge-10 Memory 像数据库控制台：原始 #id 排在最前，计数只算本页，不能编辑内容，聊天里也看不到记忆

中 · 工作量 M · 需后端改动 · missing-pattern

**现状**：记忆卡片以 #id、类型和三态开关开头，平铺不分组，看起来像记录表；数量和状态筛选已标明只针对本页。召回测试结果没有分数和命中原因；记错的内容只能停用或遗忘，不能更正；对话里看不到本次用了哪些记忆、写入了什么。

**证据**：

- src/pages/memory/detail/memory-entry-list.tsx:118-123 — 每张卡第一行先是 #message_id，再是类型和状态
- src/pages/memory/detail/memory-entry-list.tsx:101-112 — 平铺列表，不按类型、Agent 或时间分组
- src/pages/memory/MemoryMessagesPage.tsx:100-108,205-213 — 记忆数、启用数、状态计数都从当前页的 sources 算出
- src/components/memory/memory-recall-panel.tsx:168-186 — 召回结果只有序号和类型，没有分数，也没有命中原因
- MultiRAG/api/apps/restful_apis/memory_api.py:207-210 — UpdateMessageRequest 只能改 status，不能改内容
- MultiRAG/api/apps/restful_apis/memory_api.py:213-233 — 新增记忆必须传 user_input + agent_response 一对
- src/components/chat 下 grep memory 无结果；MultiRAG/agent/component/message.py:546 的 \_save_to_memory 写入记忆时不给前端发事件

**方案**：前端可先做：卡片先写陈述内容，下一行是来源（Agent 头像 + 会话 + 相对时间 + 查看来源对话），#id 收进溢出菜单；按类型分组（语义/情景/程序，各自带彩色图标块）；状态筛选改 FilterChip，保留现有‘本页’口径说明；停用或遗忘后弹可撤销的 toast；召回结果加排名和分数条（复用 EvidenceScoreBars，需先确认 /messages/search 是否带 similarity）并高亮命中词。需要后端：PUT /messages/{memory_id}:{message_id} 支持改内容；Agent 运行流发出 memory_used / memory_saved 事件，会话里才能显示‘使用了 3 条记忆 / 记忆已更新’标签。

**对标**：ChatGPT 的“管理记忆”是一条条自然语言事实，可以逐条删除，对话里出现“记忆已更新”提示；Claude 可以查看和编辑记忆摘要；Mem0 平台按类别和 user/agent 维度浏览记忆。

**核验**：部分成立：memory-entry-list.tsx:118-123 卡片第一行是 #message_id，101-112 平铺不分组；memory-recall-panel.tsx:168-186 召回结果只有序号和类型，没有分数；memory_api.py:207-210 的 UpdateMessageRequest 只能改 status，213-233 新增必须传 user_input + agent_response；src/components/chat 下 grep memory 无结果；agent/component/message.py:254,294 调 \_save_to_memory 写入时不向前端发事件。需修正：‘计数只算本页’已经如实标注——状态筛选写的是‘筛选本页状态’，概览是‘本页 N 条来源 · M 条提取记忆’，并有说明弹层（MemoryMessagesPage.tsx:165-183,340-372；zh-CN/memory.ts:195-213），方案里‘拿不到总数就写本页’已经做到；页面描述也已是‘看清 AI 记住了什么’（memory.ts:200），问题在于呈现方式还像记录表，而不是缺这个定位。召回分数：/messages/search（memory_api.py:279-302）是否返回 similarity 需另行确认。

#### knowledge-11 知识库设置：解析器名称没有 i18n，固定 w-1/4 标签栅格，保存时不提示重新解析，也没有未保存提醒（knowledge-12/13/14 仍未关闭）

低 · 工作量 M · 后端已有接口 · consistency

**现状**：中文界面里出现 General、Laws、Q&A；在窄的浮动主面板里，左侧标签列占掉四分之一宽度；改了分块参数保存成功后，已有文档仍按旧规则切分，用户并不知道。

**证据**：

- src/types/document-parser.ts:19-35 — 解析器名称写死为英文
- src/pages/knowledge/documents/parser-method-cell.tsx:20 — 文档表的解析方式列直接显示英文
- src/components/knowledge/document-parser/selectors.tsx:66 — 解析器选择器同样用英文常量
- src/pages/knowledge/KnowledgeSettingsPage.tsx:312,359 — FormLabel 固定 w-1/4
- src/components/forms/KnowledgeFormFields.tsx — 735 行，含 9 处 w-1/4
- src/pages/knowledge/KnowledgeSettingsPage.tsx:158-206 — handleSubmit 改了 parser_id 或 parser_config 后，不提示现有文档需要重新解析
- src/pages/knowledge/KnowledgeSettingsPage.tsx:249-266 — 保存和取消按钮始终可点，没有脏状态，离开页面也不提醒

**方案**：解析器名称和说明全部改成 locale key（knowledge.parsers.\<id>.name/description），DOCUMENT_PARSER_TYPE_LABELS 只保留 key。标签栅格改成共享的 form-row（用 container query，窄宽度时标签在上）。表单用 react-hook-form 的 isDirty 控制保存/放弃按钮，有修改时显示粘性“有未保存的更改”提示条；离开页面用 react-router 的 useBlocker（应用已是 data router，见 src/lib/router.tsx）。保存时对比 parser_id/parser_config，若 doc_num>0，弹出 ReparseConfirmModal，选项为“重新解析全部 N 个文档 / 仅对新文档生效”。

**对标**：Vercel 项目设置每一节单独保存，未改动时保存按钮置灰；GitHub 和 Linear 在有未保存修改时提示；Dify 修改分段设置后会提示对已有文档重新处理。

**核验**：属实。document-parser.ts:19-35 名称写死英文；parser-method-cell.tsx:20 对 naive 还另外硬编码返回 'General'；selectors.tsx:66 和 KnowledgeSettingsPage.tsx:72-77 都用英文常量；KnowledgeSettingsPage.tsx 和 KnowledgeFormFields.tsx 合计 12 处 w-1/4（后者 735 行，已在 file-size-baseline.json:8 登记，拆分时只能收紧基线）；handleSubmit（KnowledgeSettingsPage.tsx:158-206）改 parser 后不提示重新解析；249-266 的保存/取消不看脏状态，页面只在 140 行用到一次 isDirty（embd_id 默认值），也没有 useBlocker。应用已是 createBrowserRouter（router.tsx:586），useBlocker 可用。小修正：解析器说明已走 i18n（knowledge.settings.parserDescription.details.\<id>.description，KnowledgeSettingsPage.tsx:216-221），需要补的只是名称 key，方案‘名称和说明全部改’中的说明部分已存在。

### agent：Agent 编排与 Studio

**维度结论**：Agent/工作流编辑器和 Studio 的“皮肤”已经跟上：@xyflow/react 13.0.1，Tide 运行光环和流动边，节点按类别着色，模型卡片带厂商 Logo，Trace 工作台有 span 树和耗时条，Studio 编辑/预览可调分栏，模板与空状态内容充足。落后的是“编辑器内核”和“AI 参与搭建”这两层。2026-10-05 审计里的 studio-01/02/03/07/08/09/10/11/12/13/22 在代码里大多仍未关闭：

- 布局：常驻 320px 仪表盘 rail，节点配置和运行面板用 `top-20` 加魔法数偏移的固定 Sheet 叠在画布上；
- 编辑：没有撤销/重做、快捷键和多选复制；节点右键菜单按 Radix 实现推断仍弹不出；添加节点不能搜索，也不能在连线上插入；
- 运行：单步调试有两套保存语义，非 Code 节点的结果是原始 JSON，Trace 不能定位到画布节点，也没有 token；
- 配置检查与发布：没有预检 checklist 和节点配置错误态；发布说明被丢弃，版本只能看不能恢复或对比；
- 性能：全局 mousemove 加内联 Context 值，导致所有节点逐帧重渲染。
  与 Dify、n8n、OpenAI Agent Builder、Coze 相比，最大的代差是“AI 参与搭建”：后端已有 `/v1/llm/fine_prompt` 提示词优化接口，前端零调用；自然语言生成工作流、从描述起步完全没有。建议按以下顺序推进：先做“停靠式 Inspector + 命令/历史内核 + 可搜索节点库”打地基；再做“上次运行 / Trace↔画布联动 + 预检 checklist + 发布三态与版本恢复”；最后加“提示词生成器 + 工作流 Copilot”。同时补上 MiniMap、自动布局、工具品牌 Logo 和模板画布缩略图，增强辨识度和 AI 存在感。

**已做好、应保留**：

- 已在最新的 @xyflow/react 13.0.1（package.json），固定 forceColorMode，控件 aria 文案走 i18n（src/pages/agent/canvas/index.tsx:114-123、352-360），无需换画布引擎。
- Tide 运行可视化有 AI 感且克制：运行中节点有 ai-glow 呼吸光环，正在供数的边是流动虚线，Spotlight 只在运行时出现，并尊重 prefers-reduced-motion（canvas/overrides.css、node-wrapper.tsx:31-44、edge/index.tsx:41-53、canvas/index.tsx:363-366）。
- 节点卡片身份感强：OperatorTile 按类别着色（operator-icon.constants.ts:184-194）；状态点加耗时，颜色不是唯一信号（node-wrapper.tsx:95-115）；模型卡片带 ProviderLogo，模型失效时显示红态（canvas/node/card.tsx:28-65）。
- 从 handle 拖线到空白处会弹出“下一步”节点菜单并放占位节点（use-connection-drag + placeholder），与 Dify 的拖出即加节点一致。
- Trace 工作台信息架构成熟：span 树、按类别着色的耗时条、payload/context/output/raw/errors 五个页签、最慢节点摘要（features/trace-workbench/index.tsx、trace-summary-strip.tsx）。运行时间线自动展开运行中和出错的步骤，并列出思考、输入、输出与错误（runtime-thought-chain.tsx）。
- Studio 应用编辑器：可调宽度并持久化的编辑/预览分栏，窄屏切换，保存状态、脏数据和旧配置提示齐全（studio/create-app/components/editor-workspace.tsx、preview-pane.tsx）；预览复用基于 AI Elements 的 ChatTranscript/ChatComposer。
- Lexical 提示词编辑器用“/”唤起变量菜单：按上游节点分组、支持嵌套子菜单、过滤延迟执行（components/prompt-editor/variable-picker-plugin.tsx）。
- 已有可直接复用的基础：operators/registry.ts + serializers.ts 的算子清单，components/patterns/inspector.tsx 停靠/抽屉自适应的 Inspector，lib/commands 的命令注册表，cmdk 和 react-resizable-panels 4.24。HTML 报告设计器已实现撤销/重做和后端 SSE 驱动的“AI 生成骨架”（form/html-report/designer），是现成范式。
- 模板库与空状态内容充足：分类侧栏、精选区、类别色 tile 加类型角标、节点数（agents/templates.tsx、template-tile.tsx）；空列表提供创建、模板、导入三条起步路径（agent-empty-state.tsx）。Studio 列表下方有“从模板开始”一行。
- src/components/patterns/inspector.tsx 已实现“宽屏停靠、窄屏变 Sheet”的 Inspector：基于 AiWorkspace，共用并记住宽度，并管理焦点进出和 Esc 关闭。agent-01 的停靠式 Inspector 有现成地基，不需要从零写。
- src/lib/commands 已有 registry.ts、keyboard.ts、command-palette.tsx 一整套命令和快捷键基础设施，agent-02 的画布快捷键可直接注册进去，复用 Cmd+K。
- 后端 node_finished（agent/canvas.py:521-534）已带 component_type、inputs、outputs、error、elapsed_time；前端 adapters/trace.ts:301-319 也读取了 component_type。“上次运行”页签和 span 图标所需的数据大部分已经在前端手里。
- 后端 save_or_replace_latest 在保存草稿时会保护已发布内容（user_canvas_version.py:134-141）；版本列表区分 release，VersionDialog 有已发布徽标，发布成功后还给出复制分享链接、Webhook、Explore 三个后续动作。版本语义的后端基础是健全的。
- Trace 工作台不只有 span 树：还有 TraceIssue 严重级别洞察（trace-insight-panel）、摘要条、错误面板、原始数据面板和“复制调试信息”动作（trace-debug-actions），并已用于 agents 日志详情页（features/log-detail/index.tsx:274）。
- 运行态的 AI 视觉克制得当：Spotlight 光晕只在 railSendLoading 时出现（canvas/index.tsx:363-366）；流动边的虚线动画放在 overrides.css，遵守 reduced-motion；节点状态用“细边框 + 圆点”，不只靠颜色表达（node-wrapper.tsx:32-44）。
- Studio 已有 CreateProjectModal 类型选择步骤，Agent 创建对话框带类型卡，创建流程有统一的雏形。

#### agent-01 编辑器布局：常驻仪表盘 rail 和固定 Sheet 叠层，应改为画布内停靠的 Inspector 和运行面板

高 · 工作量 L · 不需要后端 · information-architecture

**现状**：画布右侧固定挂着 320px 统计 rail。点节点时，600px 的配置 Sheet 以 fixed 定位浮在视口上；点运行，再叠一个 36vw 的运行 Sheet，两者靠 right-[620px] / right-1/3 互相避让；单步调试还有第三层。这些 Sheet 用 top-20 直接贴视口，脱离了 Codex 式悬浮圆角主表面。中等宽度屏幕上，配置、运行和 rail 同时出现时画布所剩无几（2026-10-05 审计 studio-09/21 仍未关闭）。

**证据**：

- src/components/page-templates/studio-page-template.tsx:25-29 — 编辑器右侧常驻 aside w-80（320px）
- src/pages/agent/index.tsx:297-311 — sidePanel 是 EditorRuntimeRail
- src/pages/agent/components/editor-runtime-rail.tsx:84-340 — rail 内容是资产信息、节点数和边数、运行摘要、交付按钮、最近活动等统计卡，没有节点库或大纲
- src/pages/agent/features/form-sheet/index.tsx:43-48 — 节点配置是 fixed Sheet：top-20、w-[600px]
- src/pages/agent/hooks/use-calculate-sheet-right.ts:19 — 靠 right-[620px] / right-1/3 魔法数避让运行面板
- src/pages/agent/features/runtime-workbench/index.tsx:36-43 — 运行面板是 top-20 的 fixed Sheet，宽 36vw
- src/pages/agent/features/form-sheet/components/single-step-debug-sheet.tsx:470-474 — 单步调试又一层 top-20 Sheet

**方案**：把 StudioPageTemplate 的 sidePanel 换成主表面内基于 react-resizable-panels 的三段式：左侧可折叠的“节点库 / 大纲”，见 agent-03；中间画布；右侧停靠 Inspector，复用 components/patterns/inspector.tsx：宽屏停靠、窄屏变 Sheet，宽度持久化。Inspector 按选择状态切换内容：

- 未选中节点：显示“工作流概览”，承接 EditorRuntimeRail 现有的头像、类型、节点数和边数、最近运行、交付入口，保留丰富信息；
- 选中节点：显示节点配置；
- 运行中：切到“运行”页签，原 RuntimeWorkbench 的 RUN/对话/日志三个页签移入。
  FormSheet、RuntimeWorkbench、SingleStepDebugSheet、GlobalVariableSheet 不再用 fixed top-20，删除 use-calculate-sheet-right。

**对标**：Dify 工作流：选中节点后，配置面板停靠在画布区内右侧，可拖宽；“运行”面板同样停靠在右侧。OpenAI Agent Builder：左侧节点面板，右侧选中节点的属性面板，Preview 面板与画布并列。n8n 用独立的 NDV（输入 | 参数 | 输出）。都没有常驻的统计 rail。

**核验**：属实。src/components/page-templates/studio-page-template.tsx:25-29 是常驻 aside w-80；src/pages/agent/index.tsx:297-311 把 EditorRuntimeRail 作为 sidePanel，rail（editor-runtime-rail.tsx:85-352）是四张 SectionCard（当前资产、运行、交付、最近活动），没有节点库或大纲。fixed top-20 的 Sheet 比审计列的还多：form-sheet/index.tsx:46（w-[600px]）、runtime-workbench/index.tsx:41（w-[36vw]）、single-step-debug-sheet.tsx:473、pipeline-workbench/index.tsx:53、global-variable-sheet/index.tsx:48、webhook-sheet/index.tsx:196。use-calculate-sheet-right.ts:19 的 right-[620px]/right-1/3 魔法数经 form-sheet/hooks.ts:20 生效。自 2026-10-05 以来 3527fc6f、e449f6b3 只改了视觉，没动布局。方案可行：react-resizable-panels 4.24.0 已安装；patterns/inspector.tsx 已实现“宽屏停靠、窄屏 Sheet、记住宽度”。方案把 rail 的头像、类型、统计迁到“工作流概览”，没有做减法，也没动 Codex 式两级导航。

#### agent-02 画布编辑手感：缺撤销/重做、快捷键和多选复制粘贴，右键菜单失效

高 · 工作量 L · 不需要后端 · interaction

**现状**：误删节点或连线无法撤销。复制只能逐个点 Duplicate，不能框选后 Ctrl+C/V，不能跨画布粘贴，没有 Ctrl+S、Ctrl+D 或 Ctrl+Enter 运行。节点右键菜单形同虚设，空白处也没有右键菜单。工具条调试入口依赖 DOM 探测（审计 studio-02/08 仍未关闭）。

**证据**：

- src/pages/agent/store.ts:1-40 — graph store 只有 zustand + immer，没有 history/temporal；全仓 src/pages/agent 中 grep undo/redo/zundo/temporal 无结果
- src/pages/agent/canvas/index.tsx:70、357 — 唯一的键盘绑定是 deleteKeyCode=['Delete','Backspace']
- src/pages/agent/canvas/context-menu/index.tsx:57-63 — ContextMenuTrigger 是 pointer-events-none 的全屏空 div，且 onNodeContextMenu 已 preventDefault（canvas/index.tsx:195-206）；按 Radix 实现推断菜单仍不会弹出（审计 studio-08 未修）
- src/pages/agent/canvas/context-menu/index.tsx:43-48 — 菜单的“删除”直接调用 deleteNodeById，绕过 onBeforeDelete 的 Begin 保护
- src/pages/agent/canvas/node/toolbar.tsx:80-84 — 调试按钮没有 onClick，靠 Play 图标的 data-play 被 use-show-drawer.tsx:77-83 的 DOM dataset 探测；点到按钮内边距会打开配置而不是调试
- src/pages/agent/form/html-report/designer/index.tsx:138-147 — 同仓库的报告设计器已有 undo/redo 先例

**方案**：1）给 graph store 加历史层：用 zundo 2.x 的 temporal 中间件（支持 zustand 5），或基于仓库已装 immer 11 的 produceWithPatches 自建命令栈。只记录 nodes/edges/form，剔除 selected/measured/dragging；拖拽只在 dragStop 时入栈。
2）新增 use-canvas-shortcuts，用 xyflow 的 useKeyPress 或现有 lib/commands/keyboard 实现：Ctrl+Z/Shift+Z、Ctrl+C/V/D（多选子图复制时重映射 id，保留子图内部连线，序列化为 DSL 片段写入剪贴板）、Ctrl+S、Ctrl+Enter 运行、Tab 打开节点库、F2 重命名、Shift+1 适配视图、? 打开快捷键面板。同时把这些命令注册进 lib/commands，让 Cmd+K 也能调用。
3）右键菜单改为受控：用 DropdownMenu 定位到鼠标坐标，或用 ContextMenu 包住 ReactFlow 本身。节点菜单含复制、副本、调试、禁用、删除，删除统一走 handleBeforeDelete；空白处菜单含“在此添加节点、粘贴、自动布局、添加笔记”。
4）工具条 Play 改为显式 onClick 打开单步调试，移除 data-play 探测。

**对标**：Dify：Ctrl+Z/Ctrl+Y 撤销重做，带操作历史弹层；Ctrl+C/V 复制粘贴节点，Ctrl+D 复制。n8n：多选复制会把工作流 JSON 放进剪贴板，可跨工作流粘贴；Tab 打开节点面板，Ctrl+Enter 执行，F2 重命名，右键菜单齐全。Figma/Linear 式的“?”快捷键面板已是工具类产品标配。

**核验**：属实。store.ts:16-17 只有 zustand+immer。按词边界 grep undo/redo/zundo/temporal，src/pages/agent 下只有 html-report/designer/index.tsx:138-147 命中。canvas/index.tsx:70、357 只有 deleteKeyCode。右键菜单：context-menu/index.tsx:57-60 的 Trigger 是 pointer-events-none，ContextMenu 根组件没传 open，只靠 {open && \<ContextMenuContent>} 控制。已核对 node_modules 中 @radix-ui/react-context-menu 2.4.1 的源码，Content 由根组件的内部 open 状态控制，所以菜单确实弹不出。另外，即使改成受控 open，锚点也来自 Trigger 的 contextmenu 事件；源码有警告，未交互就设 open 会定位到左上角。因此方案建议改用 DropdownMenu 虚拟锚点，或用 ContextMenu 包住 ReactFlow，这是对的。context-menu/index.tsx:44-48 调用 deleteNodeById。store.ts:438-455 的 deleteNodeById 既不保护 Begin，也不级联删除 Iteration/Loop 子节点，绕过了 use-before-delete.ts:23-48。toolbar.tsx:83 的 Play 只有 data-play，由 use-show-drawer.tsx:77-83 做 dataset 探测，属实。lib/commands（registry.ts、keyboard.ts、command-palette.tsx）已存在，方案可复用。

#### agent-03 添加节点：300px 手风琴硬编码列表，不能搜索，不能在连线上插入，也没有可拖入的节点库

高 · 工作量 M · 不需要后端 · interaction

**现状**：添加节点只有两个入口：点 handle 的“+”，或拖线到空白处。弹出的手风琴默认全部展开，长列表靠滚动查找，不能输入搜索，也不能用方向键选择。不能在已有连线中间插入节点，不能从侧栏把节点拖进画布或迭代容器（审计 studio-07 已改成 button，但搜索、插入、拖入仍缺）。

**证据**：

- src/pages/agent/canvas/node/dropdown/accordion-operators.tsx:43-140 — 五个分组和 30 多个算子硬编码在 JSX 里，没有搜索框
- src/pages/agent/canvas/node/dropdown/next-step-dropdown.tsx:37 — 固定 w-[300px] 下拉，max-h-[45vh]
- src/pages/agent/operator-icon.constants.ts:184-194 + operators/registry.ts — 已有算子类别和清单，但菜单分组没有消费它
- src/pages/agent/canvas/edge/index.tsx:92-94、134-149 — 悬停连线只出现删除 X，没有“+ 插入节点”
- src/pages/agent/canvas/node/iteration-node.tsx:114-118 + src/locales/zh-CN/flow.ts:1300 — 迭代容器空态提示“从右侧面板添加子节点”，但右侧 rail 里没有任何节点面板
- src/pages/agent/form/agent/tool-command.tsx — 同产品的工具选择器已经用 cmdk 实现

**方案**：做一个 NodePicker（cmdk），菜单分组、描述、图标统一取自 operators/registry 和 getOperatorCategory，不再在 JSX 里硬编码：

- 搜索支持中英文名、描述和别名；
- 顶部“最近使用”；
- 方向键加回车选择；右侧预览卡显示算子描述、输入输出和示例。
  同一个组件在四处复用：handle 的“+”、拖线落空、连线中点悬停出现的“+ 插入节点”（ButtonEdge 中点，插入后拆成两条边并重新校验连线）、左侧节点库面板（见 agent-01，支持 HTML5 拖拽到画布或迭代容器内，xyflow 的 screenToFlowPosition 落点）。迭代容器空态的文案改成指向节点库。

**对标**：Dify 的 Block 选择器有搜索框和“节点 / 工具”页签，连线悬停出现“+”可在中间插入。n8n 的节点面板支持全文搜索和分类钻取，按 Tab 唤起。OpenAI Agent Builder 左侧常驻节点面板（Core / Tools / Logic / Data），可直接拖入画布。Langflow 左侧组件栏带搜索，可拖拽。

**核验**：属实。accordion-operators.tsx:43-46 的五个分组默认全部展开（defaultValue item-1..5），算子在 JSX 里硬编码，没有搜索。next-step-dropdown.tsx:36 固定 w-[300px]，max-h-[45vh] 在 accordion-operators.tsx:45。edge/index.tsx:92-94、134-149 的连线悬停只有删除 X。iteration-node.tsx:114-117 和 zh-CN/flow.ts:1300 的“从右侧面板添加子节点”所指面板并不存在。form/agent/tool-command.tsx 已用 cmdk（cmdk 1.1.1 已安装）。顺带：AccordionOperators 用 useGraphStore((state)=>state) 订阅了整个 store。竞品描述（Dify 的 Block 搜索和连线插入、n8n 的 Tab 节点面板、Agent Builder 左侧节点面板）大体可信。

#### agent-04 运行与调试：节点没有“上次运行”，单步调试语义不一，Trace 与画布互不联动，缺 token

高 · 工作量 L · 后端已有接口 · missing-pattern

**现状**：一次运行结束后，节点只留下状态点和耗时。要看某节点的输入输出，得去运行面板的时间线里找，再手动对照画布。单步调试两个入口的保存行为不一致，可能用旧 DSL 调试，结果是裸 JSON。历史会话的 Trace（agents/log）不能回放到画布上，也看不到 LLM 节点的模型、token 和成本（审计 studio-10 仍未关闭）。

**证据**：

- src/pages/agent/features/form-sheet/components/single-step-debug-trigger.tsx:38 — 从表单头进入调试会先 saveGraph
- src/pages/agent/canvas/index.tsx:131-133、455 — 从画布工具条或右键进入，直接 setSingleDebugNodeId，不保存
- E:/project/MultiRAG/api/apps/restful_apis/agent_api.py:1406-1409 — 后端 debug 读取库里存的 DSL，所以未保存时会用旧配置调试
- src/pages/agent/features/form-sheet/components/single-step-debug-sheet.tsx:519-527 — 非 Code 节点的结果只是 \<pre> 原始 JSON
- src/pages/agent/features/form-sheet/index.tsx:76-81 — 节点配置面板只有表单，没有“上次运行 / 输出”页签
- src/pages/agent 全目录 grep setCenter/fitView(/useReactFlow 无结果 — 时间线和 Trace span 都不能定位到画布节点
- src/pages/agent/features/trace-workbench/components/trace-span-row.tsx:56-71 — span 图标靠名称包含 'agent'/'message' 之类的启发式猜测
- src/pages/agent/adapters/trace-types.ts:44-59 — span 视图模型没有 model、tokens、cost 字段
- E:/project/MultiRAG/agent/canvas.py:521-534 — node_finished 事件已带 inputs/outputs/error/elapsed_time，但没有 token usage
- src/pages/agent/features/runtime-workbench/components/runtime-thought-chain.tsx:150-160 — 时间线页脚直接显示 eventName 和 componentId 等开发者字段

**方案**：1）Inspector 增加“设置 | 上次运行 | 输出”三个页签。“上次运行”取当前会话 node_finished 事件里的 inputs、outputs、error、elapsed_time，用 trace-workbench 已有的 TraceIoPanel / trace-json-viewer 渲染成可折叠的 JSON 树，长文本用 Markdown 预览。单步调试只保留一个入口：Inspector 的“运行此节点”，统一先保存再调用 debug，结果写进“上次运行”。
2）运行后，节点卡片底部加一条结果条：耗时、输出摘要、错误首行；点击打开“上次运行”。
3）时间线和 Trace 的 span 行加“在画布中定位”：调用 useReactFlow().fitView({ nodes: [{ id }], duration })，选中节点并打开 Inspector；span 图标改用 componentId 查 graph 中的算子类型，不再猜名称。
4）agents/log 的会话详情加“在编辑器中回放”：载入该 message 的 trace，给节点着色。
5）时间线页脚的 eventName 和 componentId 收进“原始数据”折叠区。
6）token 和成本：后端在 node_finished 和 trace 中补 usage，前端在 span 行和节点结果条显示 tokens · 耗时。

**对标**：Dify 1.5 起节点面板有 Last run 页签，并有 Variable Inspect 面板查看和编辑各节点输出。n8n 的执行结果直接标在节点上（条目数、绿勾），NDV 左右并排显示输入和输出；Executions 列表可“Debug in editor”，把历史执行数据载回画布；还有 Pin data。Coze 试运行后每个节点都能查看输入输出。LangSmith / Langfuse 的 span 树显示 token 与成本；Vellum 显示节点级延迟与成本。

**核验**：属实。single-step-debug-trigger.tsx:38 先 saveGraph；canvas/index.tsx:131-133 和 455 的工具条、右键入口直接 setSingleDebugNodeId，不保存。后端 agent_api.py:1406-1409 从库里的 cvs.dsl 构建 Canvas，所以未保存时会用旧配置调试。single-step-debug-sheet.tsx:519-527 对非 Code 节点只输出 \<pre> JSON。src/pages/agent 下 grep setCenter、fitView(、useReactFlow 无结果。trace-types.ts:44-59 没有 model、tokens、cost 字段。runtime-thought-chain.tsx:157-164 的页脚直接显示 eventName 和 componentId。后端 agent/canvas.py:521-534 的 node_finished 没有 token usage，这部分实际需要后端补（backendNote 已写明）。需要补充一点：node_finished 已带 component_type，前端 adapters/trace.ts:301-319 也读取了它来算 kind，只是没放进 TraceSpanViewModel。所以 span 图标的修法更简单：把 componentType 保留进视图模型，trace-span-row.tsx:54-69 不必再按名称猜，也不必回查画布 graph（历史 trace 的画布可能已改过）。

#### agent-05 没有发布前预检 checklist，节点也没有配置错误态

高 · 工作量 M · 不需要后端 · missing-pattern

**现状**：没选模型的 Agent、空提示词、引用了已删除上游变量的节点、孤立节点、缺 API Key 的工具，在画布上看起来都“正常”。用户只能在运行失败后从日志里倒查。发布也不拦截这些问题（审计 studio-12 仍未关闭）。

**证据**：

- src/pages/agent 全目录 grep checklist/preflight/validateGraph/nodeIssues 无结果
- src/pages/agent/canvas/node/node-wrapper.tsx:7、31-44 — 节点状态只有运行态 idle/running/success/error，没有“配置不完整”态
- src/pages/agent/canvas/node/card.tsx:39-56 — 只有 LLM 失效会显示红色，属于个例
- src/components/prompt-editor/index.tsx:265-268、323-327 — 缺失变量只在编辑器下方以硬编码英文“Missing variables:”提示，节点和画布层面看不到
- src/pages/agent/index.tsx:177-220 — 发布前不做任何检查，直接 saveGraph({release:true})
- src/pages/agent/hooks/use-validate-connection.ts:57-74 — 只校验连线合法性

**方案**：在 operators/registry 中为每个算子声明 validate(form, graph) 规则，或复用各表单已有的 zod schema。新增 useGraphIssues，用 useMemo 加选择器计算，产出 { nodeId, severity, message, field }，覆盖：必填项缺失、模型或工具凭证失效、变量引用断裂（复用 extractMissingVariableReferences）、无入边或无出边的孤立节点、Begin 之外的不可达节点。展示分三层：

- NodeWrapper 增加 data-issue 态：右上角琥珀或红色三角，加一圈细边框；
- 头部加“检查 N”按钮，弹出 Popover 列出问题，点击用 fitView 定位并打开 Inspector 聚焦对应字段；
- 存在 error 时，发布按钮禁用，并给出原因提示。
  PromptEditor 的缺失变量提示改走 i18n，并把对应 chip 渲染成红色断链态。

**对标**：Dify 头部有 Checklist 徽标，数字是问题数，展开列出每个未配置节点，点击跳到节点；节点右上角显示警告图标；存在问题时阻止发布。n8n 对缺必填参数或凭证的节点显示红色警告三角。OpenAI Agent Builder 发布前也会校验节点配置。

**核验**：属实。src/pages/agent 和 src/pages/studio 下 grep checklist、preflight、validateGraph、nodeIssues、graphIssues 无结果。node-wrapper.tsx:7、32-44 只有 idle/running/success/error 四种运行态。card.tsx:36-45 只对失效 LLM 显示 danger 态。prompt-editor/index.tsx:323-327 用模板字符串硬编码“Missing variables:”，这是 i18n 漏网（55b6fda6 的硬编码检查没覆盖模板字符串）。index.tsx:177-189 发布前直接 saveGraph({release:true})。use-validate-connection.ts:57-74 只校验连线。各表单的 zod 校验只在打开表单时生效，画布层面看不到。方案复用 extractMissingVariableReferences 合理。

#### agent-06 AI 提示词生成/优化：后端 fine_prompt 已就绪但前端零调用

高 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：写系统提示词完全靠手工。Agent 节点和 Studio 应用这两处最核心的“写提示词”场景，都没有任何 AI 辅助，平台作为 AI 产品在搭建环节看不到 AI。

**证据**：

- E:/project/MultiRAG/api/apps/llm_app.py:2235-2324 — POST /fine_prompt（优化提示词，内置 META_PROMPT，可指定 llm_name），已实现
- src/ 全目录 grep fine_prompt/finePrompt 无结果 — 前端未接入
- src/components/prompt-editor/index.tsx:147-186 — Agent 节点的提示词编辑器工具栏只有“合并路径”开关和“插入变量”按钮
- src/pages/studio/create-app/components/prompt-pane.tsx:84-120 — Studio 提示词面板工具栏只有变量、格式、预览、全屏
- src/pages/agent/form/html-report/designer/ai-skeleton/use-generate-skeleton.ts:1-16 — 仓库已有“AI 生成 + 进度 + 取消”的前端范式

**方案**：新增共享组件 PromptAssist（放在 components/patterns），作为 PromptEditor 工具栏和 Studio PromptPane 工具栏上带 Sparkles 图标的“AI 生成/优化”按钮。点击打开 Popover 或侧滑面板：

- 输入任务描述，留空则优化当前提示词；
- 选模型，复用现有 ModelSelect 和 ProviderLogo；
- 调用 /v1/llm/fine_prompt，结果以并排 diff 展示（左旧右新，逐段高亮），提供“替换 / 插入到光标 / 再生成 / 取消”；
- 生成中用 Tide 的 ai-glow 微光，保留 AI 身份感；
- 写回前保留变量 chip：在 META_PROMPT 外层要求模型保留 {xxx@yyy} 占位符，前端回写时校验占位符没有丢失。
  后续可扩展“生成结构化输出 schema”和“生成测试输入”。

**对标**：Dify 的 LLM 节点和应用编排都有“自动生成 / Prompt Generator”：输入任务描述，选模型，生成后可预览再应用。OpenAI Playground 的系统消息有“Generate”和优化按钮。Anthropic Console 有 Prompt generator 和 Prompt improver。Vellum 的 Prompt Sandbox 也提供 AI 改写。

**核验**：属实。MultiRAG api/apps/llm_app.py:2235 的 POST fine_prompt 由 api/apps/\__init_\_.py:423-426 按文件名挂载为 /v1/llm/fine_prompt；src 下 grep fine_prompt、finePrompt 无结果。prompt-editor/index.tsx:159-186 的工具栏只有“合并路径”开关和插入变量；prompt-pane.tsx 的工具栏是变量、格式、预览、全屏。实现时注意：FinePromptRequest（llm_app.py:800-803）的 gen_conf 是必填 dict，前端要传 {}；接口同步返回字符串，推理模型可能带思考内容，前端需要清洗。META_PROMPT 本身已要求“Keep any … variables, or placeholders”，但前端回写时仍应按方案校验 {xxx@yyy} 占位符没有丢失。HTTP 应按仓库约定封装进领域 API 并走 APIClient。use-generate-skeleton.ts 的范式确实存在。

#### agent-07 没有“用自然语言搭建”的工作流 Copilot，创建流程也没有“描述即起步”

高 · 工作量 XL · 需后端改动 · missing-pattern

**现状**：从空白画布开始，用户要自己知道该用哪些算子、怎么连线。平台有完整的算子清单和 DSL，却没有用 AI 把“我想要一个……的客服 Agent”转成工作流草稿，也不能对现有画布说“在检索后加一个重排和引用校验”。

**证据**：

- src/pages/agents/components/create-agent-dialog.tsx:128-196 — 创建只有“类型单选 + 名称”
- src/pages/agents/components/agent-empty-state.tsx:44-60 — 起步路径只有新建、模板、导入
- src/pages/agent/canvas/index.tsx:329-386 — 画布内没有任何 AI 助手入口
- E:/project/MultiRAG/api/apps/restful_apis/agent_api.py:249-2716 — agent 路由中没有 NL→DSL 生成接口；MultiRAG 全库 grep generate_workflow/nl2dsl/text_to_workflow 无结果
- src/pages/agent/operators/registry.ts + serializers.ts — 已有算子清单和 DSL 序列化，可作为生成目标的 schema

**方案**：分两步：
1）创建入口：CreateAgentDialog 和 agents 空状态增加第一条路径“用一句话描述”，用大号 PromptInput，复用 patterns/chat/prompt-input，附几个示例 chip。提交后流式生成 DSL，创建并打开画布，节点按生成顺序依次“落位”（motion 的 stagger），每个新节点短暂带 ai-glow 高亮。
2）画布 Copilot：主表面右下角放一个 Tide 头像浮钮，打开 Inspector 内的“助手”页签，与 agent-01 合并。对话内容是对当前图的修改指令；助手返回“计划清单 + 图补丁”（新增、删除、修改的节点和边），画布上用绿/黄/红虚框预览差异，用户逐项或一次性接受，接受后入撤销栈（依赖 agent-02）。
生成时以 operators/registry 导出的算子 JSON schema 作为约束，结果再经 agent-05 的预检规则校验后才落盘。

**对标**：据公开资料：n8n 2025 年推出 AI Workflow Builder（beta），可用自然语言生成并修改工作流；Zapier Copilot 用对话搭建 Zap；Flowise Agentflow 提供用提示生成流程的入口。Cursor 和 Claude Code 的“先给计划、再以 diff 应用”已成为 AI 改动的主流交互。具体细节因版本而异，以上为方向性参考。

**核验**：属实。create-agent-dialog.tsx 只有 RadioGroup 类型卡和名称 Input。agent-empty-state.tsx:44-65 的起步路径是新建、模板、导入。canvas/index.tsx:329-386 没有 AI 入口。MultiRAG 全库（排除 .venv）grep generate_workflow、nl2dsl、text_to_workflow、generate_dsl、copilot 无业务结果；agent_api.py 的路由清单里也没有 NL→DSL 接口。需要后端，判断正确。可参照的 /v1/report/skeleton 存在（report_app.py:136，SSE）。竞品部分审计已作方向性措辞，可接受。方案依赖 agent-02 的撤销栈和 agent-05 的预检，顺序合理。

#### agent-08 保存、草稿、发布三态不可见：自动保存不显示状态，发布藏在 rail，发布说明被丢弃，版本只读

高 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：头部只用一行小字显示“自动保存 · 相对时间”，没有“保存中 / 有未保存修改”的脏态，也看不出与线上版本是否一致。自动保存因依赖 flowDetail 会周期性重复写库，也没有离开保护。发布入口藏在 rail 的“发布”按钮后面的版本对话框里，发布说明只出现在 toast 里，没有入库。历史版本只能看标题、时间和发布徽标，不能预览、恢复或对比。

**证据**：

- src/pages/agent/hooks/use-watch-agent-change.ts:37-62 — 20 秒定时器依赖 flowDetail，每次保存后 invalidate 和 refetch 又会重新计时，编辑器开着就周期性写库；没有脏标记（审计 studio-01 仍未关闭）
- src/pages/agent 与 src/pages/studio 中 grep beforeunload/useBlocker 无结果 — 没有离开保护
- src/pages/agent/components/agent-editor-header.tsx:76-98 — 头部只有运行状态点、保存、运行，看不到“草稿 / 已发布 / 有未发布修改”，也没有发布按钮
- src/pages/agent/components/editor-runtime-rail.tsx:270-276 — 发布入口藏在 rail 的“交付”卡片里
- src/pages/agent/index.tsx:177-212 — handlePublish 的 note 只进了 toast，没有传给 saveGraph
- src/pages/agent/version-dialog/index.tsx:181-222 — 版本列表只读，没有预览、恢复、对比
- src/hooks/use-agent-query.ts:191 — useFetchVersion 已实现但没有调用方
- E:/project/MultiRAG/api/apps/restful_apis/agent_api.py:1468、1516 — 版本列表和单版本详情（含 DSL）接口已存在
- E:/project/MultiRAG/api/apps/restful_apis/agent_api.py:442-451 + api/db/services/user_canvas_version.py:134-141 — save_or_replace_latest 支持 description，但 PUT 没有把发布说明传进去

**方案**：同原方案：头部换成 SaveStateChip 和发布分体按钮，并显示“草稿 / 已发布 vN · 有未发布修改”；自动保存改为基于 DSL 内容哈希的去抖调度，不再依赖 flowDetail，并配合 useBlocker 和 beforeunload 做离开保护；版本历史接上 useFetchVersion，提供只读预览、恢复和节点级对比；发布说明入库需要后端小改。

**对标**：Dify 头部显示“自动保存 · 时间”和“已发布 / 未发布修改”；发布是下拉按钮，内含“发布更新、运行应用、嵌入、访问 API”；版本历史面板可命名版本、写说明，并一键恢复。OpenAI Agent Builder 区分 Draft 和已发布版本，可回看历史版本。n8n 的工作流历史可预览旧版本画布并恢复。

**核验**：核心成立，但“自动保存不显示状态”说过头了：agent-editor-header.tsx:78-81 的 description 会显示“ID: xxx · 自动保存 {time}”（zh-CN/agent.ts:128），rail 里也有 autosaveLabel。真正缺的是“保存中 / 有未保存修改 / 与已发布版本是否一致”的状态。其余属实：use-watch-agent-change.ts:37-62 的 effect 依赖 flowDetail，use-agent-mutation.ts:47-52 在保存后 invalidate detail，refetch 得到新的 update_time 后又会重新计时，于是编辑器开着就周期性写库；src 下 grep beforeunload、useBlocker 无结果；发布入口是 rail 里标为“发布”的按钮（editor-runtime-rail.tsx:280-283），点开后才是 VersionDialog；index.tsx:177-212 的 note 只进了 toast；version-dialog/index.tsx:181-222 只读；useFetchVersion（use-agent-query.ts:191）没有调用方。后端 agent_api.py:442-451 调用 save_or_replace_latest 时没传 description，而 user_canvas_version.py:134-141 支持这个参数，属实。

#### agent-09 画布视觉工具不完整：没有 MiniMap、自动布局、吸附对齐、缩放比例，分支连线没有标签

中 · 工作量 M · 不需要后端 · visual

**现状**：节点一多就会迷路：没有缩略导航，拖乱后只能手工逐个摆放，节点对不齐，看不出缩放比例。条件分支的连线不标注 case 名，读图要回到节点里对照 handle。

**证据**：

- src/pages/agent/canvas/index.tsx:329-386 — ReactFlow 只挂了 Background 和 Controls；没有 MiniMap、snapToGrid、helper lines
- src/pages/agent/canvas/index.tsx:367-385 — Controls 是缩放三件套加一个笔记按钮，没有撤销、自动布局、缩放百分比、全屏
- package.json — 没有 @dagrejs/dagre 或 elkjs；src/pages/agent 中 grep autoLayout/dagre/elk 无结果
- src/pages/agent/canvas/node/use-build-switch-handle-positions.ts、use-build-categorize-handle-positions.ts — 分支 handle 位置按魔法数计算（审计 studio-22 仍未关闭）
- src/pages/agent/canvas/edge/index.tsx:59-66 — 所有边都是无标签的 Bezier，Switch 和 Categorize 的分支在连线上看不出走的是哪个 case
- src/components/canvas/background.tsx:13-21 — 点阵间距 gap=20，可直接用作吸附网格

**方案**：1）加入 xyflow 内置的 \<MiniMap>：pannable、zoomable，按 OPERATOR_CATEGORY_TONE 着色节点，运行中节点用 run-running 色，样式沿用 controlsClassName 的悬浮卡片，可在控件里切换显示。
2）控件栏改成悬浮工具条：撤销/重做 | 缩放 − 100% + | 适配 | 自动布局 | 笔记 | 小地图开关。
3）自动布局：按需懒加载 elkjs（支持复合节点，能正确处理 iteration/loop 容器），输出动画过渡到新位置，并作为一次可撤销操作。
4）snapToGrid，snapGrid=[20,20]，与点阵对齐；拖拽时显示 helper lines 对齐线（参照 xyflow 示例实现）。
5）Switch/Categorize 的出边用 EdgeLabelRenderer 显示 case 或类别名的小 pill，颜色与分支一致；handle 位置改为由 DOM 测量（useUpdateNodeInternals），替代魔法数。

**对标**：Dify 画布左下角有 MiniMap 和缩放百分比，控件里有“整理节点”（自动布局）。n8n 有 Tidy up（Shift+Alt+T）自动整理，分支连线标 true/false 或输出名。xyflow 官方示例提供 MiniMap、dagre/elk 自动布局、Helper Lines 对齐线。

**核验**：属实。canvas/index.tsx:329-386 只挂了 AgentBackground、运行时的 Spotlight 和 Controls；src 下 grep MiniMap、snapToGrid、HelperLines 无结果。package.json 没有直接依赖 dagre 或 elkjs；package-lock 里的 dagre 来自 @antv/layout 的传递依赖，不能当作已有能力。小细节：Controls 默认是放大、缩小、适配、锁定四个按钮（ariaLabelConfig 中有 controls.interactive）再加笔记，不是“三件套”。use-build-switch-handle-positions.ts:29-35 用 53、10+14+16+16、26 这类魔法数算 top，已经调用了 useUpdateNodeInternals；方案应理解为“用 ref 测量每个 case 行的 offsetTop，再调用 updateNodeInternals”。edge/index.tsx:59-66 统一用 Bezier，没有标签。background.tsx 的 gap=20 属实。

#### agent-10 工具节点缺品牌身份：7 个搜索类工具共用 Search 图标，图标仍以 iconfont 优先

中 · 工作量 S · 不需要后端 · visual

**现状**：画布、节点菜单和 Trace 里，Tavily、Google、Bing、SearXNG 长得一模一样，只能靠文字区分。MCP 服务器条目也没有标识。和同屏模型卡片上的 ProviderLogo 相比，工具一侧显得单薄。这正是用户嫌“简陋”的那类问题。

**证据**：

- src/pages/agent/operator-icon.constants.ts:69-80 — DuckDuckGo、Google、Bing、GoogleScholar、SearXNG、TavilySearch、WenCai 都映射为 lucide Search；GitHub 用 Code；YahooFinance 用 Settings2
- src/pages/agent/operator-icon.constants.ts:32-50 + operator-icon.tsx:41-61 — 17 个算子仍优先走 iconfont，lucide 只是兜底（审计 studio-18 仍未关闭）
- node_modules/@lobehub/icons-static-svg/icons — 已安装的 1.102.0 内含 tavily、searxng、google、bing、github、brave、exa、jina、firecrawl、perplexity、mcp 等品牌图标
- src/components/ui/provider-icon.tsx:10-38 — ProviderIcon 已从 @lobehub/icons-static-svg 逐个引入品牌 Logo
- src/pages/agent/canvas/node/tool-node.tsx:105-110 — 工具汇总节点头部固定用 Wrench

**方案**：在 operator-icon 增加 OPERATOR_BRAND 映射，有品牌图标的工具（tavily、searxng、google、bing、github、mcp 等）走 ProviderLogo，同时扩展 ProviderIcon 的映射；没有品牌图标的工具（duckduckgo、wikipedia、arxiv、pubmed、yahoo、wencai、googlescholar）用类别色 tile 加 monogram，或单独引入可信的品牌 SVG。算子的 iconfont 映射全部换成 lucide。若要删除 index.html 中同步加载的 iconfont.js，需要另立一项，把 ProviderIcon 的 sprite 源和 moxing-default 一并迁到 SVG。NodeHeader、NodePicker、TraceSpanRow、tool-node 统一使用 OperatorTile。

**对标**：n8n 每个集成节点都显示对应服务的品牌 Logo；Dify 的工具节点和工具选择器显示工具提供方图标；Langflow 组件栏和组件卡片使用品牌图标。

**核验**：图标映射的问题属实：operator-icon.constants.ts:69-80 中 7 个搜索类工具都映射为 Search，GitHub→Code，YahooFinance→Settings2；OperatorIconFontMap（32-50）恰好 17 项；operator-icon.tsx:41-61 优先走 iconfont；tool-node.tsx:105-106 固定用 Wrench；@lobehub/icons-static-svg 1.102.0 里确有 tavily、searxng、google、bing、github、brave、exa、jina、firecrawl、perplexity、mcp。需要修正两点：1）index.html:14 用同步 \<script src="/iconfont.js"> 加载图标字体，但它不只被算子使用：provider-icon.tsx:284-290、381-384、406-410 的 sprite 源和默认模型图标 moxing-default 也依赖它。只改算子图标去不掉这个全局脚本，要同时把 ProviderIcon 的 sprite 条目迁走。2）lobehub 里没有 duckduckgo、wikipedia、arxiv、pubmed、yahoo、googlescholar（只有 google），这些也要走类别色 tile 加 monogram，不只是 wencai、pubmed、arxiv。

#### agent-11 画布渲染：全局 mousemove 加内联 Context 值，导致所有节点和边逐帧重渲染

中 · 工作量 M · 不需要后端 · performance

**现状**：鼠标在画布上移动、拖拽节点、运行中状态刷新时，所有 NodeWrapper、ButtonEdge、CommonHandle、ToolBar 都会重渲染。几十个节点时拖拽和流式运行着色会掉帧，与“冷静、高级”的观感相违背。

**证据**：

- src/pages/agent/hooks/use-move-note.ts:20-29 — 始终监听 window mousemove 并 setMouse，不只在放置笔记时
- src/pages/agent/canvas/index.tsx:149 — useMoveNote 位于画布根组件 AgentCanvasInner，每次鼠标移动都让整个画布根重渲染
- src/pages/agent/canvas/index.tsx:317-328 — AgentInstanceContext.Provider 的 value 是内联新对象，每次渲染都变
- src/pages/agent/canvas/node/node-wrapper.tsx:54-61、src/pages/agent/canvas/edge/index.tsx:37-41 — 每个节点和每条边都 useContext 这个 value
- src/pages/agent/canvas/edge/index.tsx:33-35、node/handle.tsx:62-64、node/toolbar.tsx:43-44、context-menu/index.tsx:30 — 逐边、逐 handle、逐工具条订阅整个 graph store（审计 studio-03 仍未关闭）

**方案**：1）笔记放置光标抽成独立的 NotePlacementCursor 组件，仅在 imgVisible 时挂载监听，并用 ref 直接改 style.transform，不触发 setState。
2）把运行状态从 Context 移到一个小型 zustand slice（runtime-status store），按节点订阅：useNodeRunStatus(id) 只订阅自己的状态和耗时；边用 useEdgeFlowing(source, target)。Context 只保留稳定的回调，并用 useMemo 包裹。
3）ButtonEdge、CommonHandle、ToolBar、ContextMenu 改为细粒度选择器加 useShallow。
4）用 React Profiler 在 50 节点的示例 DSL 上设定回归基线（拖拽每帧重渲染的节点数应为 1）。

**对标**：xyflow 官方性能指南要求节点和边组件 memo 化，并用选择器订阅最小状态，避免在画布根组件放高频 state。Dify 和 n8n 在上百节点的画布上拖拽仍然流畅。

**核验**：属实。use-move-note.ts:20-29 无条件监听 window mousemove 并 setMouse（每次都是新对象）。canvas/index.tsx:149 在画布根组件 AgentCanvasInner 中调用它，所以每次鼠标移动都会重渲染根组件。canvas/index.tsx:317-328 的 Provider value 是内联对象，node-wrapper.tsx:54-61 和 edge/index.tsx:37-41 都 useContext 它，memo 拦不住 context 变化。edge/index.tsx:33-35、handle.tsx:62-64、accordion-operators.tsx:31-33 用 (state)=>state，toolbar.tsx:43-44 和 context-menu/index.tsx:30 用不带选择器的 useGraphStore()，都订阅了整个 store。方案中用 ref 直接改 transform、拆出按节点订阅的运行态 slice、加 useShallow，方向正确。

#### agent-12 两套提示词编辑器语义不一；变量引用缺少生命周期和错误态

中 · 工作量 M · 不需要后端 · consistency

**现状**：同一平台里写提示词有两种手感：Agent 里是带 chip 的富编辑器，Studio 里是 Markdown textarea 加手打花括号。上游节点被删除后，变量只在编辑器底部出现一行英文警告，chip 本身没有错误态，也没有一键修复。两处都没有 token 计数，也不能用样例值预览渲染后的提示词。

**证据**：

- src/components/prompt-editor/index.tsx:1-35 — Agent 节点用 Lexical PromptEditor：“/”唤起变量菜单，变量显示为 chip
- src/pages/studio/create-app/components/prompt-pane.tsx:3、28、84-120 — Studio 应用用 @uiw/react-md-editor（textarea 型 Markdown 编辑器），变量通过 Braces 弹层以纯文本 {key} 插入，没有自动补全和 chip
- src/components/prompt-editor/index.tsx:323-327 — 缺失变量提示硬编码英文“Missing variables: …”，显示内部 id
- src/components/prompt-editor/index.tsx:19 — components/prompt-editor 反向依赖 @/pages/agent/hooks/use-get-begin-query
- src/components/prompt-editor/variable-node.tsx:1-8 — VariableNode 依赖 pages/agent 的 BeginId，没有“断链”态（审计 studio-11 仍未关闭）

**方案**：把 PromptEditor 提升为与领域无关的 patterns/prompt-editor：变量来源通过 props 或 context 注入，切断对 pages/agent 的依赖。Studio PromptPane 换用它，Markdown 预览保留为页签。
变量 chip 的样式：来源节点的 OperatorTile 或品牌 Logo + 变量名 + 类型角标；引用失效时显示红色虚线框和断链图标，悬停提示“上游已删除”，并给出“替换为… / 移除”。
底部状态栏（i18n）显示约 N tokens、缺失变量数和“预览”。预览用 Begin 或 Studio 参数的样例值渲染最终提示词。agent-06 的 AI 生成按钮放在同一工具栏。

**对标**：Dify 的提示词编辑器统一用“{”或“/”插入变量，chip 带来源节点图标，引用失效时 chip 变红。OpenAI Playground 和 Vellum 的提示词编辑器显示 token 数，并支持用样例变量预览。

**核验**：属实。prompt-editor/index.tsx 基于 Lexical，带变量 chip；prompt-pane.tsx:3、28 用 @uiw/react-md-editor，变量在 Braces 弹层里以纯文本 insert(`{${parameter.key}}`) 插入。prompt-editor/index.tsx:19 反向依赖 @/pages/agent/hooks/use-get-begin-query；variable-node.tsx:1 依赖 pages/agent 的 BeginId；decorate() 只有一种 accent 样式，没有断链态。prompt-editor/index.tsx:323-327 硬编码英文。两处 grep tokenCount、countTokens、estimateTokens 都无结果。方案把 PromptEditor 提升到 patterns 并注入变量源，与 AGENTS.md 的分层规则一致。

#### agent-13 模板库缺“里面有什么”：没有画布缩略图，也没有算子、模型、工具清单

中 · 工作量 M · 后端已有接口 · visual

**现状**：用户只能凭标题和一句描述猜模板做什么、用了哪些模型和工具、复杂度如何。选错模板后需要删除重建。模板卡片相比同页丰富的品牌和身份元素显得单调（审计 studio-19 的预览部分仍未完成）。

**证据**：

- src/pages/agents/templates.tsx:52-100 — ResourceCard 只显示 tile、描述、类别 chip、节点数
- src/pages/agents/components/template-create-dialog.tsx:58-71 — 点“使用”直接进入命名对话框，无法先预览
- src/pages/studio/components/template-start-row.tsx:55-95 — Studio 的模板行同样只有 tile、名称、描述
- E:/project/MultiRAG/api/apps/restful_apis/agent_api.py:249 — GET /agents/templates 已返回包含 dsl.graph 的完整模板（前端 TemplateCreateDialog 直接用 template.dsl 创建）

**方案**：1）卡片顶部加 96px 高的 FlowThumbnail：用模板 DSL 的节点坐标直接画成静态 SVG。节点是按类别色填充的小圆角矩形，边是细线，自动适配包围盒；不为每张卡实例化 ReactFlow，保证网格性能。卡片底部加“包含”行：最多 5 个 OperatorTile 或品牌 Logo（模型用 ProviderLogo），超出显示 +N。
2）点击卡片打开 TemplatePreviewDialog：左侧是只读 ReactFlow 画布，可缩放；右侧列出说明、节点清单、所需模型和工具凭证，并检查当前租户是否已配置；底部放“使用此模板”。
3）Studio 模板行复用同一缩略图。

**对标**：n8n 模板站对每个模板都展示可交互的工作流画布预览，并列出用到的集成 Logo。Coze 的模板商店有详情页和流程预览。Langflow 的 Templates 弹窗用插画卡片加分类。Dify 的模板卡片带图标和用途说明，可查看详情。

**核验**：属实。agents/templates.tsx:57-100 的 ResourceCard 只有 TemplateTile、描述、类别 chip 和节点数。template-create-dialog.tsx:58-71 点击后直接进入命名对话框（CreateAgentDialog，allowKindChange=false），不能先预览。studio/components/template-start-row.tsx:62-95 只有 tile、名称、描述和“使用”。后端 agent_api.py:249-275 的 GET /agents/templates 返回含 dsl 的完整模板，缩略图和清单都能在前端推导，后端判断正确。方案用静态 SVG 缩略图、不为每张卡实例化 ReactFlow，兼顾了性能，也是加法，符合“丰富而非减法”。

#### agent-14 创建流程分裂且有不必要的阻力：Studio 应用与 Agent 是两套对话框，Studio 强制填描述

低 · 工作量 M · 不需要后端 · interaction

**现状**：Studio 的新建流程是 CreateProjectModal 选类型，选 app 打开 CreateAppModal（名称、必填描述、上传图标），选 agent 则跳到 /agents?create=1 打开另一个 CreateAgentDialog（类型卡和名称）。两种表单之间要跨页面跳转；对话应用的描述必填只是前端限制，后端会自动填默认值；Agent 创建时不能选图标或色调；两处都没有 AI 起步。

**证据**：

- src/pages/studio/components/CreateAppModal.tsx:20-27、95 — 创建对话应用要求名称、必填描述和图标上传，未填描述会报 descriptionRequired
- src/pages/agents/components/create-agent-dialog.tsx:128-196 — 创建 Agent/Pipeline 是另一套对话框，只有类型和名称
- src/pages/studio/components/ImportTemplateDialog.tsx、src/pages/agents/components/import-agent-dialog.tsx — 导入也是两套
- src/components/patterns/entity-avatar.tsx — 已有按 seed 生成色调的头像，但创建时不能选图标或配色，只能上传图片

**方案**：把 CreateProjectModal、CreateAppModal、CreateAgentDialog 合并成一个 CreateAssetDialog：顶部是四条起步路径（一句话描述，需后端，见 agent-07；空白；从模板；导入）；下面是类型卡（对话应用 / 智能体 / 数据流水线），带插画；名称必填，描述可选，直接去掉前端的 descriptionRequired 校验；图标用 IconTilePicker，提供 lucide 图标或 emoji 加 avatar 色调，同时保留上传。Studio 和 Agents 的“新建”都打开这个对话框，不再跨页面跳转。

**对标**：Dify 的“创建应用”是一个对话框：先选类型卡（聊天助手 / Agent / 工作流 / Chatflow 等），再填名称，图标用 emoji 加背景色，描述可选；同处并列“从模板创建”和“导入 DSL”。OpenAI GPTs 和 Claude Projects 的创建也只要求最少信息，其余后补。

**核验**：部分属实：CreateAppModal.tsx:94-95 在前端强制填描述（descriptionRequired），Agent 和 Studio 的导入也确是两套。需要修正两点：1）Studio 并非完全没有类型选择。StudioPage.tsx:243-249 有 CreateProjectModal 作为类型选择步骤：选 app 打开 CreateAppModal，选 agent 跳到 /agents?create=1 打开 CreateAgentDialog。问题是这一步跨了页面、换了表单，而不是根本没有选类型。2）后端不要求描述：MultiRAG api/apps/restful_apis/chat_api.py:436 有 req.setdefault("description", "A helpful Assistant")。所以描述必填完全是前端限制，删掉即可，不需要后端放宽，backendNote 中的疑问可以去掉。

### settings：设置、模型网关、MCP、技能、团队与探索

**维度结论**：设置、管理与目录面已经从 RAGFlow 时代的遗留代码升级到较新的基线。模型网关是全仓最接近 OpenRouter、Vercel AI Gateway 水准的页面：Key 只显示一次、有作用域和限额、日志带首字延迟、概览有 KPI。数据源和渠道都有带 Logo 的目录，外观页有方案预览和自定义品牌色，MCP 已合并为单页加侧栏。剩余差距集中在三处。一是"模型"这件事被拆到三处页面重复呈现，缺一个统一的模型目录：看不到上下文窗口、价格、延迟和错误率，连接测试只返回有效或无效，已保存的连接无法复测。二是"连接器 / 技能 / 应用"三类目录的成熟度差距很大：MCP 没有目录、品牌标识和工具级开关；Home 把 MCP 叫作"技能"，和技能库撞名；Explore 的"应用市场"是假的，"添加到工作区"按钮没有任何行为。三是设置整体缺少 AI 产品常见的元能力：设置内搜索和命令面板深链、工作区就绪度与健康总览、按角色显示管理分组、个性化。旧审计中仍未关闭的有：settings-03（工作区 Key 列表返回明文、没有作用域）、settings-14（admin 二次登录，JWT 存在 localStorage）、settings-15（路由标题硬编码，数据源详情用 query 参数）。多数改进只需前端；价格、单模型延迟、已保存连接复测、MCP OAuth 和注册表需要后端少量配合。后端已经依赖 litellm，可以直接复用它自带的价格与上下文表。

**已做好、应保留**：

- 模型网关（a4316aab 及后续提交）达到一线水准，重构时应保留。key-created-dialog.tsx:50-247 只在创建时显示一次明文 Key，同屏给出 Base URL、可调用模型、env/Python/curl 示例、.env 下载，并在轮换后提供撤销旧 Key；Key 有作用域树、限额、到期和最近使用，日志带 first_token_ms，概览有 KPI、请求曲线和最近失败（图表用原生元素实现，没有引入图表库）。
- 供应商品牌标识体系完整。ProviderLogo（src/components/patterns/provider-logo.tsx）统一带底板，缺失时回落到 @lobehub/icons-static-svg 1.102.0（共 994 个图标，含 github、notion、figma、cloudflare、mcp）。能力胶囊 ModelCapabilities（src/components/models/model-capabilities.tsx:85-112）同时带图标和固定色调。
- 数据源目录（datasource/components/connector-catalog.tsx:86-122）按存储、协作、代码库等分组展示 Logo 卡片；渠道目录（channels/components/provider-gallery.tsx:7-17）完全由服务端 manifest 驱动。两者都是"先看能连什么，再填表"的现代模式。
- 外观页（appearance-page.tsx）有实时预览，ScopedTheme 渲染六套方案的迷你工作台缩略图，支持从种子色生成自定义品牌方案，还有密度、字号、动效、对比度、主按钮风格和语言，覆盖面超过 ChatGPT 和 Claude.ai 的外观设置。
- 模型发现对话框（model-discovery-dialog.tsx）直接从供应商 API 拉取候选模型批量登记；默认模型行会提示"缺失"和"不可用"（f79a08b0），信息密度和 Cherry Studio 的"管理模型"相当。
- 设置区统一用 SettingsTemplate、CollectionTemplate 和 Inspector 侧栏，通过 useRegisterSecondaryNavigation 接入两级导航（SettingsLayout.tsx:213-227）。Tab 和选中项写进 URL（?tab=、?server=），可以深链。
- 旧审计中的 settings-09（MCP 拆成 4 个路由）和 settings-08 中 STDIO 的问题已修复：MCP 合并为单页加 Inspector，传输协议只保留 sse/streamable-http（src/types/mcp.ts:146）。AI 工具页的假评分已删除，Auto-fill 带 Tide 身份和流光效果。
- 团队页（TeamPage.tsx）有卡片/列表视图切换、角色徽章、邀请卡，侧栏显示待处理邀请的计数徽章；系统状态页按组件逐行展示健康色块、延迟火花线和执行器心跳。
- MCP 侧栏已有完整的测试 Tab，会记录每次测试的耗时、时间戳和本次会话内的历史（src/pages/settings/mcp/mcp-test-panel.tsx:24、:87、:222-271）。工具运行对话框也显示耗时（mcp-tool-run-dialog.tsx:150-154）。另有 JSON 批量导入（mcp-batch-panel.tsx）。审计只提到行内快速测试只弹 toast。
- 网关模型 Tab 已经是可搜索、可按能力分段、可按供应商筛选的统一目录（src/pages/settings/model-gateway/components/models/models-panel.tsx:83-118）。连接卡带 ProviderLogo、调用前缀徽章、"全部开放"开关和跳回供应商页的深链（connection-card.tsx:62-104），适合直接升格为全局模型目录。
- 后端连接验证已经做了安全的失败分类：超时、网络、401、403、404、429 和配额/计费，而且不回显密钥和 URL（MultiRAG/api/db/services/provider_verification.py:24-49）。前端只要不吞掉错误，就能得到接近 OpenRouter 和 Cherry Studio 的诊断体验。
- API Key 页用 api-keys-capabilities.ts 显式登记"真实可用的能力"，不做假成功或模拟响应（ENG-6 门禁）。这是"诚实 UI"的好做法，后续 MCP 工具开关等功能也应沿用这个约束。
- 命令面板已有主题切换命令，以及会话、知识库、应用的实体搜索（src/lib/commands/palette-items.tsx:158-172；commit 09b004b6），设置深链可以直接加在这套框架上。
- verifyConnection 用 zod 严格解码后端响应（src/api/llm-providers.ts:150-157）；model-providers 的 onVerify 用 apiClient.captureOwner() 防止串号或过期写入（index.tsx:137-147）。数据层的健壮性好于多数开源 AI 前端。
- 后端已有企业级 MCP 委托授权和工具策略（MultiRAG/api/identity/mcp_delegation/README.md：按 effect/replay_mode 过滤工具、每次调用签发短期 bearer），前端还没有展示。将来做"工具级允许/需确认/禁用"时可以直接对接这套 canonical tool policy。

#### settings-01 "模型"被拆成三处重复呈现，缺少主从式供应商页和统一模型目录

高 · 工作量 L · 后端已有接口 · information-architecture

**现状**：想弄清"我有哪些模型、能做什么、是否已开放"，要在"模型提供商·默认""模型提供商·供应商"和"模型网关·模型"之间来回切换。可连接供应商目录有两份实现（瓦片网格和行列表）。已配置供应商的每个连接都把全部模型无折叠地纵向堆叠，只能用 ?provider= 滚动定位。网关模型 Tab 已经有搜索、能力和供应商筛选，但它挂在网关页下面，又按连接分卡，没有成为全局的模型目录。

**证据**：

- src/pages/settings/SettingsLayout.tsx:78-91 — "模型"组下有"模型提供商"和"模型网关"两个入口，两处都列出全部模型
- src/pages/settings/model-providers/index.tsx:110-123 — "默认"Tab 同时渲染 SystemSetting、ConnectedProviders 卡片和 ProviderCatalog；"供应商"Tab 渲染 UsedModels 和 AvailableModels
- src/pages/settings/model-providers/components/provider-catalog.tsx:9-17 与 available-models.tsx:28,70 — "可连接的供应商"在两个 Tab 各实现一遍（瓦片网格和行列表）
- src/pages/settings/model-providers/components/used-models.tsx:102-153 — 每个供应商的所有连接、所有模型都展开成长卡片纵向堆叠；index.tsx:38-39 只能用 ?provider= 滚动定位
- src/pages/settings/model-gateway/components/models/models-panel.tsx:143-156 — 网关"模型"Tab 又按连接把同一批模型渲染成 ConnectionCard 表格

**方案**：继续沿用 rail + 二级面板 + 浮动主面，把"模型"组重组为四项。① 模型目录：直接把现有的 model-gateway/components/models/models-panel.tsx（已有搜索、能力和供应商筛选）升格为全局目录，提供"按连接分组 / 平铺表"两种视图，补上 ProviderLogo、统一的 ModelCapabilities、上下文和 7 天请求列；网关开放开关、别名和限额保留在行内。② 供应商：做成主从布局。左列是已连接供应商（ProviderLogo、连接数、模型数、状态点）和搜索框；右栏是选中供应商的连接卡和模型表，模型过多时折叠或分页。"+ 连接供应商"打开 Sheet 形式的 Logo 目录，把 provider-catalog 和 available-models 合成一个组件。③ 默认模型：保留 SystemSetting。④ 模型网关：只保留概览、Key、日志。"在对话中试用"需要给 Home 增加 ?model= 或 location.state 入口（纯前端）。品牌 Logo 和卡片都保留。

**对标**：Cherry Studio 和 LobeHub 的"AI 服务商"设置都是主从式：左侧是可搜索的供应商列表（Logo、启用开关、状态），右侧是该供应商的 Key、API 地址、检查按钮和按能力分组的模型列表。OpenRouter 的 /models 和 Vercel AI Gateway 的模型页都只有一个统一的模型目录，可按能力和供应商筛选、排序。

**核验**：核心成立。SettingsLayout.tsx:78-91 的"模型"组下有两个入口；model-providers/index.tsx:110-123 的默认 Tab 同时渲染 SystemSetting、ConnectedProviders 和 ProviderCatalog，供应商 Tab 渲染 UsedModels 和 AvailableModels。provider-catalog.tsx:17-36 与 available-models.tsx:28-55 都基于 availableModelFilters，把"可连接供应商"实现了两遍。used-models.tsx:102-156 加上 provider-instance.tsx 会把每个连接的全部模型无折叠地展开，index.tsx:38-39 只能靠 ?provider= 滚动定位。不过"三处重复"说得偏重：网关模型 Tab（models-panel.tsx:83-118）已经是带搜索、能力分段、供应商 FilterChip 的统一目录；connection-card.tsx:62 有 ProviderLogo，:88-93 有跳回供应商页的"管理"深链。它回答的是"网关开放哪些模型"，并不是又一份冗余列表。git log 显示 10-05 之后只有 bb67c110、a4316aab 和配色令牌改动，主从视图仍未实现（旧审计 docs/design-reviews/ui-ux-modernization-audit-2026-10-05.md:483 的条目仍然有效）。后端接口确实已有（provider_api.py:106-280、model_gateway_api.py:75-93）。

#### settings-02 模型行缺少上下文窗口、价格、延迟和错误率等规格与健康信息

高 · 工作量 M · 需后端改动 · missing-pattern

**现状**：模型呈现停留在"名称+能力"。用户无法在设置里判断哪个模型有 1M 上下文、哪个更便宜、哪个最近经常报错或变慢。网关概览只有全局的 p50 首字延迟，没有按模型拆分；也没有任何花费估算。

**证据**：

- src/pages/settings/model-providers/components/instance-model-row.tsx:28-33 — 每行只有名称和能力胶囊，但 tenantModelSchema 已经带 max_tokens（src/api/llm-provider-types.ts:51）
- src/pages/settings/model-gateway/components/models/model-row.tsx:88-104 — 网关模型行只有纯文字 Badge、上游名、限额和 requests_7d
- src/api/model-gateway.ts:42-64 — GatewayCatalogModel 没有 context、price、latency、errors 字段
- src/pages/settings/model-providers/components/connected-providers.tsx:56-57 — 代码注释写明"The backend cannot check provider latency"
- MultiRAG/configs/llm_factories.json:12-15 — 后端目录已为每个模型提供 max_tokens（如 gpt-6.1-sol 为 1050000）和 tags
- MultiRAG/pyproject.toml:83 — litellm 是直接依赖，.venv 内的 litellm 自带 model_prices_and_context_window_backup.json 和 cost_calculator.py
- MultiRAG/api/model_gateway/management.py:76 与 :344 — 已有按 upstream_model_id 分组统计请求数，以及 percentile_cont 计算 p50 首字延迟的写法

**方案**：新增共享组件 src/components/models/model-spec.tsx：在能力胶囊后追加上下文胶囊（"128K""1M"，由 max_tokens 格式化）、推理胶囊和价格胶囊（"\$2.5 / \$10 每百万"），用在模型目录、供应商右栏和模型选择器下拉项上。网关模型目录加四列：上下文、输入/输出价格、7 天错误率（小号红点加百分比）、p50 首字延迟（附迷你火花线）。概览 KPI 增加"估算花费"，按 Key 和模型拆分，价格未知时显示"—"并给出说明。这一步前端可以先做：max_tokens 已在租户模型上，可以按 model_id 与网关目录 join。

**对标**：OpenRouter 的模型列表和详情页展示上下文长度、每百万 token 的输入/输出价格，以及各上游的延迟、吞吐和可用率。Vercel AI Gateway 的模型目录列出上下文和输入/输出价格，并在用量页按花费汇总。LiteLLM Admin UI 的 Models 页展示每 token 成本和 max tokens，并提供模型健康检查（据我所知，UI 细节可能随版本变化）。

**核验**：成立。instance-model-row.tsx:28-33 只渲染名称和 ModelCapabilities；tenantModelSchema 已有 max_tokens（llm-provider-types.ts:51），但没有展示。model-row.tsx:88-104 的能力是纯文字 secondary Badge，后面只有上游名、限额和 requests_7d。GatewayCatalogModel（model-gateway.ts:42-64）没有上下文、价格、延迟、错误率字段。connected-providers.tsx:56-57 的注释原文如此。后端方面：llm_factories.json:12-15 有 max_tokens=1050000 和 "1.05M" 标签；pyproject.toml:83 直接依赖 litellm，.venv 里有 model_prices_and_context_window_backup.json 和 cost_calculator.py；management.py:76 有按 upstream_model_id 分组计数，:344 有 percentile_cont 求 p50。后端 api/ 下没有任何价格或成本计算代码，所以标为 needs-backend 是对的。需要注意：litellm 价格表的键是上游模型名，自定义模型或别名可能查不到，提案里"未知显示 —"的兜底是必要的。基准描述基本属实，并已带了限定语。

#### settings-03 连接测试只返回"有效/无效"，已保存的连接无法复测

中 · 工作量 M · 需后端改动 · interaction

**现状**：点"验证"后只显示成功或失败。后端已经返回了探测模型名，失败时也给出了归类好的原因（超时、网络、Key 被拒、权限或区域、模型不可用、限流、配额），但前端全部丢弃，用户不知道探测的是哪个模型、为什么失败。连接保存以后没有任何复测入口。

**证据**：

- src/pages/settings/model-providers/components/api-key-modal.tsx:100-119 — 结果只有 valid/invalid 一行文字和一句范围说明
- src/pages/settings/model-providers/index.tsx:136-149 — onVerify 丢弃了后端返回的 model_name/model_type，只返回 { isValid: true, logs: '' }
- src/api/llm-providers.ts:140-157 — verifyConnection 实际解码出了 verified、model_name、model_type
- src/pages/settings/model-providers/components/provider-instance.tsx:81-134 — 已保存连接只有启停、添加模型、编辑、删除四个操作，没有"测试"
- MultiRAG/api/db/model_contract.py:50-51 与 provider_api.py:191-198 — /connection 只接受带明文 api_key 的候选连接，不能用已保存的凭证测试

**方案**：抽出 ConnectionCheck 组件（放在 patterns 层），模型连接、MCP 和数据源共用。它只显示一个"测试中"状态，不做假的分步进度。成功时显示"已通过 {model_name} 验证 · 412 ms"（耗时由前端计时）；失败时把后端归类好的原因直接映射为本地化文案（可按消息前缀匹配，或推动后端补一个稳定的 error_code），并附可复制的原始消息。use-provider-form-actions.ts 不再吞掉错误。provider-instance.tsx 的每个已保存连接加"测试"按钮、上次检查时间和状态点，结果只存在 Query cache 里，不持久化。

**对标**：Cherry Studio 的供应商 Key 旁有"检测"按钮，可以选择用哪个模型探测，结果就地显示。LobeHub 的"连通性检查"同样先选模型再检查，失败时展开错误详情。Vercel 和 Supabase 的集成卡片都提供"重新测试"并显示上次检查时间。

**核验**：前端部分成立：index.tsx:136-149 的 onVerify 丢弃了 verifyConnection（llm-providers.ts:140-157）解码出的 model_name 和 model_type；api-key-modal.tsx:100-119 只显示有效或无效。另外 use-provider-form-actions.ts:74-76 用空 catch 吞掉了错误，只调用 setVerified(false)。provider-instance.tsx:81-134 的已保存连接没有"测试"操作。后端 /connection（provider_api.py:191-198）只接受带明文 api_key 的 ConnectionCandidate（model_contract.py:50-51；model_provider_service.py:262 使用 request.api_key），确实不能用已存的凭证复测。审计漏掉了一点：后端已经对失败做了分类，provider_verification.py:24-49 的 \_failure_message 会区分超时、无法连接、401 Key 被拒、403 权限或区域、404 模型不可用、429 限流以及配额/计费，并通过 400 的错误消息返回。问题出在前端丢弃了这些信息，并不需要前端按 HTTP 状态重新归类（我们自己的 API 对这类失败一律返回 400）。后端是单次探测调用，没有"鉴权 → 探测"两个阶段，提案里的两步进度会是伪进度。基准中"Vercel 和 Supabase 的集成卡片提供重新测试和上次检查时间"缺乏依据，应删去；Cherry Studio 和 LobeHub 的"先选模型再检查"描述属实。

#### settings-04 MCP 管理缺连接器目录、品牌标识、真实健康状态和工具级开关

高 · 工作量 L · 需后端改动 · missing-pattern

**现状**：MCP 页是一张数据表：通用头像，没有目录或预设（只有空白表单和 JSON 批量导入）。绿点只代表缓存过工具，不代表在线。侧栏测试 Tab 虽然记录了耗时和本次会话的历史，但列表上看不到，刷新后也会丢失。工具不能逐个停用，而且后端运行时本来就不读 enabled 标记。调试工具要手写 JSON。凭证 Header 在 detail 和导出接口里明文回显。

**证据**：

- src/pages/settings/mcp/mcp-page.tsx:164-170 — 每个服务器都用通用 EntityAvatar kind="mcp"，GitHub、Notion 等也看不出品牌
- src/pages/settings/mcp/mcp-page.tsx:262-270 — "新建"只打开空白表单，没有目录或预设
- src/pages/settings/mcp/mcp-page.tsx:227-248 与 src/hooks/use-mcp-request.ts:218-221 — 绿点表示"有缓存工具"，并不代表连接健康
- src/pages/settings/mcp/mcp-page.tsx:126-143 — 快速测试只弹 toast，不记录结果、耗时和检查时间
- src/pages/settings/mcp/mcp-tools-panel.tsx:135-158 — 工具行只有"运行"，没有启用开关；而后端会读取每个工具的 enabled 标记（MultiRAG/api/utils/api_utils.py:925）
- src/pages/settings/mcp/mcp-tool-run-dialog.tsx:110 与 :159 — 参数靠手写 JSON Textarea，结果用 JSON.stringify 原样输出
- src/pages/settings/datasource/components/connector-catalog.tsx:86-122、channels/components/provider-gallery.tsx:7-17 — 同属"集成"组的另外两页都有 Logo 目录
- MultiRAG/api/apps/restful_apis/mcp_api.py:88-121 — 导出和详情接口明文返回 authorization_token 和 headers；路由表（:123-507）中没有 OAuth

**方案**：① 连接器目录（mcp-catalog-sheet.tsx，本地 JSON 预设，Logo 优先用 @lobehub/icons-static-svg，没有的回退到 connector-logo），点卡片进入预填表单。② 列表行：按 URL host 匹配品牌 Logo（回退 mcp.svg），健康点改为"上次测试结果、耗时、检查时间"，先复用 mcp-test-panel 的结果写入 Query cache，跨会话持久化需要后端。③ 工具 Tab：每个工具一个 Switch，通过 PUT /mcp/servers/{id}/tools 写回 enabled；前提是后端在 llm_app.py:\_prepare_mcp_config 和 agent_with_tools.py:141 过滤掉 enabled=false 的工具，否则不上线开关。同时显示 readOnlyHint、destructiveHint 等注解徽章；参数表单由 inputSchema 生成（复用 src/components/dynamic-form）；结果按内容块渲染（文本用 Markdown，图片直接显示，JSON 用 shiki）。④ "在对话中试用"跳到 Home 并预选该服务器。⑤ 凭证只写不回显（需要后端返回 has_value 或掩码）。

**对标**：Claude.ai 的 Connectors 目录用 Logo 卡片展示，可一键添加远程 MCP 并走 OAuth，也能通过 URL 添加自定义连接器，每个工具可单独设为允许、需确认或禁用。ChatGPT 有按分类浏览的 Apps/连接器目录。Cursor 的 MCP 设置给每个服务器一个红/绿/黄状态点（附错误），工具可逐个开关。Cherry Studio 和 LobeHub 内置 MCP 市场。官方 MCP Registry（registry.modelcontextprotocol.io）提供可检索的服务器元数据。

**核验**：大部分成立：mcp-page.tsx:164-170 统一使用 EntityAvatar kind="mcp"；:262-270 的新建只打开空白表单；:236-243 的绿点只表示"有缓存工具"（use-mcp-request.ts:218-221 同样把有工具视为活跃）；mcp-tools-panel.tsx:135-158 的工具行只有"运行"；mcp-tool-run-dialog.tsx:110-124 是手写 JSON 的 Textarea，:157-160 用 JSON.stringify 输出结果；mcp_api.py:88-121 的导出和 detail 明文返回 authorization_token 和 headers，路由表里没有 OAuth。需要修正的地方有三点。(1) 审计漏了已有能力：侧栏有测试 Tab，会记录耗时、时间戳和本次会话内的历史（mcp-test-panel.tsx:24、:87、:222-271）；工具运行对话框显示耗时（mcp-tool-run-dialog.tsx:150-154）；还有批量导入（mcp-batch-panel.tsx）。真正缺的是列表上看不到这些信息，而且它们没有持久化。(2) backendNote 说"工具 enabled 的持久化和读取已存在"并不完整。PUT /tools（mcp_api.py:507-530）确实会整体保存 variables.tools，api_utils.py:925 在列表时也会读 enabled，但运行时不认这个标记：Home 对话走 llm_app.py:257-259 的 \_prepare_mcp_config，把全部缓存工具传给 Agent；agent_with_tools.py:141-154 绑定每个工具时也不检查 enabled。只做前端开关，就是 ENG-6 禁止的"无行为入口"，必须由后端在绑定时过滤。(3) @lobehub/icons-static-svg 1.102.0 已安装，github、notion、figma、cloudflare、vercel、mcp 的 svg 都在，但没有 linear、sentry、atlassian，提案里"其余复用 connector-logo"的回退是对的。基准描述属实。

#### settings-05 "技能"一词在 Home 指 MCP 服务器，在技能库指 SKILL.md 资产，概念冲突

中 · 工作量 S · 不需要后端 · information-architecture

**现状**：用户在 Home 选的"技能"其实是 MCP 工具服务器，而侧栏的"技能库"是另一类不会自动执行的 SKILL.md 资产。两个同名概念指向完全不同的东西，设置里又用协议名"MCP"，非技术用户无法建立心智模型。

**证据**：

- src/locales/zh-CN/home.ts:77-83 — Home 输入框面板 skillPanel 的标题和空状态都叫"技能"
- src/pages/home/components/SkillPanel/SkillList.tsx:10-16 — 该"技能"列表的数据其实是 servers: MCPServer[]，空状态链接到 MCP_PATH（:49-60）
- src/locales/zh-CN/skills.ts:51-52 — 技能库页标题为"技能库"，副标题说"管理技能资产与版本，不会自动执行技能"
- src/pages/settings/SettingsLayout.tsx:96-101 — 设置导航直接写协议名"MCP"

**方案**：统一术语：MCP 对外叫"连接器"（导航显示"连接器 · MCP"，沿用 Plug 图标），SKILL.md 保留"技能"。Home 输入框面板改为"工具与连接器 / 应用"两段，将来技能能在对话中调用时再加"技能"段，图标与技能库一致。同步修改 zh-CN/en-US 的 home、mcp、settings 文案，路由不变。

**对标**：Claude.ai 把 MCP 叫"Connectors"，把 SKILL.md 叫"Skills"，二者在设置和输入框的"+"菜单里分开呈现。ChatGPT 把外部服务叫"Apps/连接器"，和 GPTs 区分开。Cursor 把 MCP Tools 和 Rules 放在不同的设置分区。

**核验**：成立。src/locales/zh-CN/home.ts:77-83 的 skillPanel 标题和空状态都叫"技能"。SkillList.tsx:10-16 的数据是 servers: MCPServer[]，:57-63 的空状态链接到 MCP_PATH。skills.ts:51-52 的技能库是"管理技能资产与版本，不会自动执行技能"。settings.ts:721 的导航文案就是"MCP"（SettingsLayout.tsx:96-101）。Claude.ai 区分 Connectors 和 Skills、ChatGPT 区分 Apps 和 GPTs，这些基准属实。改名只涉及 i18n 和组件文案，不需要后端。

#### settings-06 Explore"应用市场"是伪市场：主按钮没有行为，"已添加"的判断依据错误

中 · 工作量 M · 后端已有接口 · interaction

**现状**：有效的应用都显示"已添加"，按钮被禁用；万一出现非 '1' 状态的应用，"添加"按钮点了也没有反应。页面挂着"市场"的名字，却没有分类、来源、作者、热度，也没有真正的添加动作。空对话的建议对所有应用都一样，削弱了应用的个性。

**证据**：

- src/pages/explore/components/explore-market.tsx:40 — 用 const added = app.status === '1' 判断是否"已添加"
- MultiRAG/api/db/db_models.py:3154 — Dialog.status 的文档写明"1: validate"，表示记录有效、未删除，并非"已添加到工作区"
- src/pages/explore/components/explore-market.tsx:51-62 — 未添加时的"添加到工作区"Button 没有 onClick；:64 只有已添加的卡片可以点开
- src/hooks/use-dialog-apps.ts:81-85 — 所谓"市场"的数据就是当前用户可见的对话应用列表（前 100 个）
- src/locales/zh-CN/explore.ts:46,52-54 — 文案为"应用市场""添加到工作区""已添加"
- src/pages/explore/components/explore-empty.tsx:9-30 — 起始建议固定为"解释/代码/总结/翻译"，与当前应用无关

**方案**：后端支持发布之前，诚实地改名为"发现"，分成"我的应用"和"团队共享"两段（利用 /chats 的 owner_ids 按团队分组，卡片角标显示团队头像）。主按钮统一为"开始对话"，拥有者额外看到"在 Studio 中编辑"；卡片补知识库数量和最近使用时间。删除假的"添加到工作区"和 status==='1' 判断。ExploreEmpty 有开场白时优先显示开场白；起始建议可以由前端用应用 description 和关联知识库名称生成通用提示，或者由后端在 prompt_config 里新增可配置的"起始问题"字段（属于后端小改动）。不要拿 /chat/recommendation 硬凑。真正的公开市场（发布、复制、订阅）需要后端新建。

**对标**：ChatGPT 的 GPT 商店按分类、精选、热门展示，卡片带作者和对话数，主按钮是"开始聊天"。Dify Explore 按分类展示模板，"添加到工作区"会真实复制应用。LobeHub Discover 的助手卡片带头像、标签和作者，点"添加助手"会真正加入会话列表。

**核验**：核心成立：explore-market.tsx:40 用 status==='1' 判断"已添加"，而 db_models.py:3154 写明 Dialog.status 表示"0 作废 / 1 有效"。:51-62 的按钮没有 onClick，:64 只有"已添加"的卡片能打开。实际效果是所有有效应用都显示一个禁用的"已添加"按钮。use-dialog-apps.ts:81-85 取的就是当前用户可见的前 100 个对话应用；explore.ts:46、:52-54 的文案是"应用市场""添加到工作区"；explore-empty.tsx:9-30 的起始建议是固定四项。我把严重度降为 medium：卡片点击仍能正常开始对话，问题在于误导性文案和一个永远禁用的按钮，并没有阻断主流程。提案有一处要修正：/chat/recommendation（chat_api.py:927-936）要求传入非空 question，设计用途是根据用户问题生成相关问题（并可绑定 search_id），不适合空对话的起始建议。Dialog 表也没有"建议问题"字段。owner_ids 跨团队列出属实（chat_api.py:631-646；前端 src/api/dialog.ts:21、:96 已支持）。

#### settings-07 两套 API Key 分散在两个分组，工作区 Key 仍返回明文且缺作用域（settings-03 仍未关闭），API 文档为自研

中 · 工作量 M · 需后端改动 · information-architecture

**现状**：开发者要找 Key，得先分清是"RAG API 密钥"还是"模型网关"。两种 Key 的安全模型和交互差距很大：前者明文可反复复制，没有作用域、最近使用和到期；后者全都有。API 文档是自研的只读页，不能试调，还背着一整套环境管理子系统。

**证据**：

- src/pages/settings/SettingsLayout.tsx:86-90 与 :113-122 — 网关 Key 放在"模型"组，"RAG API 密钥"和"API 文档"放在"集成"组
- src/pages/settings/api-keys/api-keys-page.tsx:186-209 — 页面单独用一张卡列出"作用域不可用""不可编辑"等能力缺失
- src/pages/settings/api-keys-capabilities.ts:28-46 — copy 声明为 available，理由是列表接口返回完整 token
- src/pages/settings/api-keys/api-key-rows.tsx:13-17,66-82 — 遮罩只在前端做，复制按钮随时能拿到明文
- MultiRAG/api/apps/restful_apis/system_api.py:223-241 — /system/tokens 列表返回完整 token
- src/pages/settings/model-gateway/components/key-created-dialog.tsx:50-247 — 同一产品内的网关 Key 已经是"只显示一次"、带作用域和示例的现代做法
- src/pages/settings/api-docs/api-docs-page.tsx:15,258 — 自研文档页挂着 NewEnvironmentManager（src/components/environment/\*.tsx 共约 2,361 行），只为得到 base URL；package.json 中没有 Scalar 或 Swagger UI

**方案**：新增"开发者"分组，下设三项。① API 密钥：一个页面，用分段控件切换"工作区 API / 模型网关（OpenAI 兼容）"，两边共用网关 key-row 的行设计（前缀、作用域胶囊、最近使用、7 天用量火花线、到期），创建后都走 KeyCreatedDialog 式的一次性展示。② API 文档：用 @scalar/api-reference-react 渲染现有的 OpenAPI 规格（采用时锁定精确版本）。"试一试"直接从浏览器用当前用户的 Key 请求同源 API，不需要服务端 runner；需在 ENG-6/ENG-8 中重新评估此前"禁用 runner"的决定。环境子系统只保留 base URL 常量。③ 接入指南：网关 endpoint-card 和代码示例。删除"能力不可用"说明卡，改成带 tooltip 的禁用控件。

**对标**：OpenAI 平台的 API Keys 只在创建时显示一次，有 All/Restricted/Read-only 权限和项目归属，列表显示最近使用时间。Anthropic Console 的 Key 按 workspace 归属并显示最近使用。OpenRouter 的 Key 可设额度并查看用量。Scalar API Reference 和 Mintlify 的 API 文档自带交互式调试面板。

**核验**：成立。SettingsLayout.tsx:86-90 的网关 Key 在"模型"组，:113-122 的 RAG API 密钥和 API 文档在"集成"组。api-keys-page.tsx:186-209 单独用一张卡列出作用域和编辑不可用。api-keys-capabilities.ts:29-30 的注释写明"列表返回完整 token，可再次复制"。api-key-rows.tsx:13-17 只在前端做遮罩，:66-82 的复制直接拿 apiKey.token。system_api.py:223-241 的列表返回 to_dict() 的完整 token，还会顺带补 beta。网关 Key 已有"列表不含明文、创建时一次性返回、PATCH 作用域和有效期、撤销"（model_gateway_api.py:103-121）。src/components/environment 下的顶层 tsx 共 2,361 行，除了 environmentStore 之外只被 api-docs-page.tsx:14-15、:258 使用。package.json 里没有 Scalar 或 Swagger。后端已提供 /openapi_filter/openapi-filtered（src/api/system.ts:118），可以作为 Scalar 的规格来源。旧审计 settings-03（audit-2026-10-05.md:476）仍未关闭，归属 ENG-8。基准属实。引入 Scalar 时要锁定精确版本，"试一试"需要按提案在 ENG-6/ENG-8 中重新决策。

#### settings-08 设置区没有搜索，命令面板只能跳到设置首页，页面元数据硬编码

中 · 工作量 M · 不需要后端 · missing-pattern

**现状**：想改"紧凑密度"或找"MCP"，用户只能在 15 个导航项里逐个找；⌘K 搜"密钥""外观""网关"都没有结果。设置项越来越多，这个问题会越来越明显。

**证据**：

- src/pages/settings/SettingsLayout.tsx:61-158 — 4 组共 15 个设置项，导航中没有搜索框
- src/lib/commands/palette-items.tsx:93-107 — 面板里与设置相关的只有 NAVIGATE_SETTINGS 一条命令
- src/lib/commands/palette-items.tsx:143-155 — 目的地只取顶层 navItems，没有任何设置子页，也没有"创建网关 Key""连接供应商"这类动作
- src/pages/settings/SettingsLayout.tsx:166-174 — 标题和父级关系仍靠 pageTitles 字典和路径判断，datasource-detail 仍用 query 参数（旧审计 settings-15 仍未关闭）
- package.json:116 — cmdk ^1.1.1 已经安装

**方案**：新建 src/pages/settings/settings-registry.ts，作为设置项的唯一来源，每项包含路由、标题键、关键词（中英同义词，如"密钥/key/token"）、分组、图标、可见条件和常用动作。它同时驱动 ContextRail、面包屑（替换 pageTitles 字典）和命令面板新增的"设置"分组，例如"前往：模型网关""新建网关 Key""连接模型供应商""切换紧凑密度"。设置二级面板顶部加 32px 搜索框，实时过滤导航项，并显示匹配的分区锚点。datasource-detail 改为 /settings/datasource/:id，旧路径重定向。

**对标**：VS Code / Cursor 的设置顶部有搜索框，会高亮匹配项。macOS 系统设置可以全局搜索。Linear 的 ⌘K 可以直接跳到具体设置页，或执行切换主题这类偏好动作。Vercel 控制台的 ⌘K 能搜到项目设置子页。

**核验**：成立。SettingsLayout.tsx:61-158 共 4 组 13 项（账户 2、模型 2、集成 5、管理 4），不是 15 项，但结论不受影响；导航里没有搜索框。palette-items.tsx:103-107 与设置相关的只有 NAVIGATE_SETTINGS，:143-155 的目的地只取顶层 navItems。不过面板里已有"切换到浅色/深色/跟随系统主题"命令（palette-items.tsx:158-172），以及会话、知识库、应用的实体搜索（commit 09b004b6），只是搜"外观""密钥""网关"确实没有结果。SettingsLayout.tsx:166-174 的 pageTitles 字典和 datasource-detail 的 query 参数（router.tsx:504、connected-sources.tsx:12、LinkDataSource.tsx:305）都还在，旧审计 settings-15 仍未关闭。cmdk ^1.1.1 已安装（package.json:116）。实现时要注意：在受管导航模式下，二级面板由 src/components/patterns/secondary-navigation-content.tsx 渲染，不是 ContextRail，搜索框和 registry 要同时覆盖这两条路径。

#### settings-09 缺少"工作区就绪度 / AI 依赖健康"总览，导航没有状态信号

中 · 工作量 M · 需后端改动 · missing-pattern

**现状**：一个 AI 工作区能不能正常回答，取决于是否设置了默认对话和向量模型、供应商是否可用、连接器是否在线、网关数据面是否运行、沙箱是否可用。这些信号散落在 5 个页面，系统状态页反而看不到其中任何一项。导航也不会提醒"默认模型缺失"或"组件降级"。

**证据**：

- src/pages/settings/SettingsLayout.tsx:37-40 — /settings 直接重定向到个人资料
- src/components/patterns/context-rail.tsx:27-28,120-125 — 导航项只支持数字徽章，不支持状态点
- src/pages/system/system-status-page.tsx:48-54 — 系统状态只覆盖 database、pool、doc_engine、redis、storage 等基础设施
- src/pages/system/use-latency-history.ts:4-7 — 延迟趋势只在页面打开期间轮询累积，没有历史
- src/pages/settings/model-gateway/components/overview/endpoint-card.tsx:45 — 网关数据面的 up/down 状态只在网关页内可见
- MultiRAG/api/apps/restful_apis/system_api.py:75-115 — /system/status 只返回基础设施组件

**方案**：/settings 改为落到新的"概览"页，用就绪度卡片引导用户。可以立即用现有接口做的有：默认对话和向量模型（SystemSetting 的数据）、已连接供应商（Logo 叠放和数量）、网关数据面的 up/down 和 base URL、系统组件健康汇总。连接器健康、沙箱可用性（admin 接口）、供应商连通性历史等后端提供持久化或聚合接口后再接入，在此之前用"去检查"按钮引导。ContextRailItem 和 secondary-navigation-content.tsx 的导航项都增加 status: 'warning' | 'error'。系统状态页新增"AI 依赖"分区。

**对标**：Supabase Studio 的项目首页集中展示各服务健康和入门清单。Dify 在未配置模型供应商时全局横幅提示。Vercel 项目总览直接显示部署和集成状态。OpenRouter 为每个上游提供可用率历史。

**核验**：现状描述成立：SettingsLayout.tsx:37-40 把 /settings 重定向到个人资料；ContextRailItem 只有数字 badge（context-rail.tsx:27-28、:120-125），受管模式下的 secondary-navigation-content.tsx:122 同样只支持数字；system-status-page.tsx:48-54 只覆盖基础设施；use-latency-history.ts:4-7 只在页面打开期间累积；网关 data_plane 只在 endpoint-card.tsx:45 显示；system_api.py:75-115 也只返回基础设施组件。主流程里只有 ChatModelSelector.tsx:63 会跳转到模型设置，没有全局的"缺默认模型"提示。backendNote 需要修正：沙箱 providers 走的是 admin 接口（src/api/admin.ts:240 adminRequest → MultiRAG/admin/server），普通成员拿不到 available 状态；MCP 测试结果没有持久化（mcp-test-panel 只保存在会话内），概览要显示"正常 n / 失败 m"，要么每次加载时并发探测全部服务器（代价高），要么需要后端持久化最近一次测试。所以概览页里只有默认模型、已连接供应商和网关 overview 可以立即用现有接口实现。

#### settings-10 管理分组对所有用户可见，用户管理仍需二次 admin 登录（settings-14 仍未关闭）

中 · 工作量 M · 需后端改动 · information-architecture

**现状**：普通成员也能在导航里看到"用户管理""沙箱""系统状态"，点进去才遇到第二个登录框。这既是安全风险（旧审计已经指出），也让设置结构显得杂乱，不像成熟的 SaaS 后台。

**证据**：

- src/pages/settings/SettingsLayout.tsx:125-155 — "管理"组（用户管理、沙箱、系统状态）无条件渲染
- src/pages/settings/admin/index.tsx:357-379 — 没有 admin token 时整页换成 AdminLoginForm，要求再登录一次
- src/api/admin.ts:43,111-122 — admin JWT 存在 localStorage['admin_auth_token']
- src/types/api.ts:251 — 当前用户对象已有 is_superuser 字段，导航却没有使用

**方案**：导航按 is_superuser 和团队角色过滤，"管理"组只对超级管理员显示，组名旁加"管理员"徽章。"团队"移到"账户与团队"组。中期后端改为用主会话加 is_superuser 授权 admin API，然后删除 AdminLoginForm 和 localStorage 存储；在此之前，所有登出路径都要清除 admin token。

**对标**：Linear、Vercel、Slack 的设置都按角色裁剪：管理员才看到工作区管理分区，并且全程只有一个会话，不会二次登录。

**核验**：成立。SettingsLayout.tsx:125-155 的"管理"组（团队、用户管理、沙箱、系统状态）无条件渲染。admin/index.tsx:357-379 没有 admin token 时整页换成 AdminLoginForm。admin.ts:43、:111-122 把 token 存在 localStorage['admin_auth_token']。types/api.ts:251 已有 is_superuser，前端却没有任何导航使用它（全仓只在类型定义里出现）。清除 admin token 的位置只有 admin.ts:192（401 时）和 admin/index.tsx:365、:371，主会话登出路径仍然不清除，旧审计 settings-14（audit-2026-10-05.md:473）未关闭。补充一点：/settings/system 对应的后端只要求登录（旧审计 :1176），所以前端隐藏"系统状态"只是 UX，不是权限控制，提案里也已经写明这一点。

#### settings-11 能力标签和供应商身份在各页呈现不一致，缺少"推理"等前沿能力词汇

低 · 工作量 S · 需后端改动 · consistency

**现状**：同一组"对话/向量"能力，网关行里是纯文字 Badge，供应商页里是带图标的胶囊。网关行内和一次性 Key 对话框的模型名没有 Logo（网关卡头有）。推理模型只有在添加时的发现列表里能看出来，登记之后就丢了这个信息。沙箱执行环境只是一排文字分段按钮。

**证据**：

- src/pages/settings/model-gateway/components/models/model-row.tsx:88-94 — 网关的能力是纯文字 secondary Badge
- src/components/models/model-capabilities.tsx:85-112 — 供应商页用的是带图标、带色调的胶囊
- src/pages/settings/model-gateway/components/key-created-dialog.tsx:141-147 — 模型名用等宽灰块，不带供应商 Logo
- src/components/models/model-capabilities.tsx:16-24 — 能力枚举里没有推理/思考
- MultiRAG/api/db/model_contract.py:45 — 后端发现接口的 features 已包含 "thinking"
- src/pages/settings/admin/sandbox/sandbox-page.tsx:82-94 — 沙箱 provider 只是一排文字分段按钮，而后端提供了 description 和 tags（MultiRAG/admin/server/sandbox_service.py:25）

**方案**：所有模型展示统一使用 ModelCapabilities，与 settings-02 的 model-spec 合并实现。网关行和 KeyCreatedDialog 的模型胶囊前加 ProviderLogo size="xs"。沙箱页把 SegmentedControl 换成 provider 卡片（字母头像或 Logo、description、tags 胶囊、可用状态点），风格与数据源和渠道目录一致。'reasoning' 能力（lucide Brain 图标加新的 avatar 色调）等后端在租户模型和网关目录里保存 features.thinking 之后再上线；在此之前只在发现对话框里显示。

**对标**：Cherry Studio 的模型列表用统一的能力图标集（视觉、联网、推理、工具、向量）。OpenRouter 的模型卡统一显示供应商 Logo 和 reasoning 标识。Vercel AI Elements 的 model selector 示例也以 Logo 加名称为最小单元。

**核验**：部分成立：model-row.tsx:88-94 的能力是纯文字 secondary Badge，而 model-capabilities.tsx:85-112 是带图标的胶囊；key-created-dialog.tsx:141-147 的模型名是等宽灰块，不带 Logo；ModelCapabilityKind（model-capabilities.tsx:16-24）里没有推理；sandbox-page.tsx:82-94 是文字 SegmentedControl，后端 PROVIDER_REGISTRY 提供了 description 和 tags（sandbox_service.py:24-30）。需要修正两处。(1)"网关里的模型名不带 Logo"不准确：网关按连接分卡，每张卡头都有 ProviderLogo（connection-card.tsx:62），只是行内和一次性 Key 对话框里没有。(2) thinking 只在发现阶段出现（model_contract.py:45 DiscoveredModel.features；model_provider_service.py:74 从目录的 thinking 字段推出），tenantModelSchema（llm-provider-types.ts:41-56）和网关目录都没有这个字段。要在设置列表上持久显示"推理"，需要后端在登记时保存 features，所以 backend 应为 needs-backend（统一胶囊、Key 对话框加 Logo、沙箱卡片这几项是纯前端）。

#### settings-12 账户设置缺个性化（关于我、回复偏好、记忆入口），与主流 AI 产品差距明显

低 · 工作量 M · 需后端改动 · missing-pattern

**现状**：用户无法告诉 Tide"我是谁、喜欢怎样的回答"，也不能在设置里选择回车发送还是 Shift+Enter 发送，或新对话默认用哪个模型。记忆功能只在单独页面里，设置中没有入口。

**证据**：

- src/pages/settings/profile/index.tsx:67-108 — 个人资料只有基本信息和安全两节
- src/pages/settings/appearance/appearance-page.tsx:121-220 — 偏好都是视觉类（模式、密度、字号、动效、对比度、语言）
- MultiRAG/api/apps/restful_apis/user_api.py:342-416 — /users/me 的 GET/PATCH 没有个性化字段，后端也搜不到 custom_instruction 或 personaliz 相关实现
- src/types/mcp.ts:155 — 前端已有 SubmitType（enter/shiftEnter）类型，但设置里没有对应选项

**方案**：在"账户"组新增"个性化"页，标题区放 Tide 头像。分两步做。第一步是纯前端，偏好用 Zustand 持久化：发送快捷键（Enter 或 ⌘/Ctrl+Enter，并接入 Home、Explore、Studio 共用的 prompt input）、个人默认模型（覆盖租户默认，复用 ModelSelect）、"管理记忆"跳转到 /memory。第二步需要后端：称呼、职业、"希望 Tide 怎样回答"和回答风格要在 /users/me 增加字段，并在对话链路注入系统提示词；"记忆开关"等后端定义个人记忆语义后再做。

**对标**：ChatGPT 的个性化设置有自定义指令（称呼、职业、回复风格）和记忆开关。Claude.ai 在 Profile 里提供个人偏好，并有可切换的回答风格（Styles）。Gemini 有 Saved info。

**核验**：大体成立：profile/index.tsx 只有 BasicInfoSection 和 SecuritySection；appearance-page.tsx 都是视觉偏好；user_api.py 没有个性化字段，后端也搜不到 custom_instruction、personaliz、about_me。细节修正如下。SubmitType 在 src/types/mcp.ts:145（不是 :155），全仓没有任何地方引用它，只是一个遗留类型，不能当作"已有基础"。MultiRAG 的"记忆"是 Memory 资源空间（memory_api.py:70-326，有 memories/messages 的增删改查），不是 ChatGPT 式的"个人记忆开关"，提案里的"记忆开关"需要先在后端定义语义；"管理记忆"的跳转可以直接指向现有的 src/pages/memory。"新对话默认模型"与租户级默认对话模型（SystemSetting）概念重叠：做成个人偏好可以先用 Zustand 本地持久化，跨设备同步需要后端。

### design：设计系统与视觉语言

**维度结论**：色彩令牌 2.0 的底座已经是同类开源项目里少见的扎实（OKLCH 种子 → 12 阶色阶 → 128 个语义角色，每套方案 × 明暗 × 对比度 × 主操作风格都有 WCAG 合同测试，还能在浏览器里生成品牌色方案），所以这一维不需要推倒重来，差距集中在「最后一公里」的视觉表达。按影响排序：(1) 求解器把深色模式的强调文字和语法色都压在 4.6:1 的下限，用户日常用的 ink/深色下链接、引用和代码发灰发闷；(2) 弹层进出场的 animate-in 类从未生效（旧 design-24 仍未关闭），也没有动效时长和缓动令牌；(3) 没有语义字阶，页面标题在 15–30px 之间各写各的，中文句子里的 “” … · 由 Geist 渲染，深色模式还全局加了字距；(4) AI 身份仍是 lucide 的 Waves 图形配通用转圈，默认 AI 渐变正是 DreamJira 清单点名要避开的蓝紫粉；(5) 密度只缩控件不缩行，紧凑档控件 28px，小于 DreamJira 的 32px。另有滚动条全局隐藏（旧 design-13 仍未关闭）、圆角/层级/图标尺寸阶梯不统一、缺共享图表原语、全局 Markdown 正文用次要色等中低优先级问题。需要提醒方案负责人：任务说明写的是默认 Mist，但 docs/engineering-modernization-roadmap.md:384 记录用户在 2026-11-18 批准了「默认墨（ink）」，用户原来的 studio 偏好也已迁到 ink。本报告不主张改默认方案，只指出 Mist 方案与 DreamJira Mist 的取值差异，请先跟用户确认默认方案。

**已做好、应保留**：

- 色彩令牌 2.0 分四层（seed → 12 阶 OKLCH 色阶 → 语义角色 → 按需组件别名），文字阶和实色上的文字都靠求解得到；npm run test:design-tokens 覆盖 6 套方案 × 明暗 × 对比度 × 主操作风格，外加 144 组品牌色种子（src/themes/design-system.md、semantic-contract.test.ts）。这是 LobeHub、Open WebUI 这类项目都没有的严谨度，必须保留。
- 意图 × 角色矩阵（accent/ai/neutral/success/warning/danger/info × solid/soft/fg/line…）、半透明交互层 fill-\*、身份色 avatar-1..8、分类色 viz-1..10、运行态 run-\*、引用 citation-\*、流式光标 caret 都已经是一等令牌，可以直接承接新的视觉表达。
- 外观偏好维度完整：方案、明暗、密度、字号、动效、对比度、主操作风格，加上浏览器端生成的 custom 品牌方案。有 ScopedTheme 和首帧前执行的 public/theme-init.js，切换时不用重挂载。
- AI 时刻的工具类已经准备好：bg-ai-tide、ai-glow、ai-halo、text-shimmer，都带 prefers-reduced-motion 和 forced-colors 回退（src/themes/tailwind.css:108-155）。缺的是使用面和品牌化，基础设施不用改。
- Geist 与 Geist Mono 经 @fontsource-variable 自托管，旧 design-18 的 Google Fonts 问题已关闭；Clay 方案为长回答提供衬线阅读字体和 1.8 行高。
- EntityAvatar（FNV 稳定取色、按字素取首字、kind 角标、发丝内描边）、ProviderLogo 中性底块、FileKindTile、EmptyStart（起步路径卡、幽灵网格、AI 光晕上的 FileStackIllustration）都在承担身份感，与「不能做减法」的反馈方向一致。
- 壳层分层符合 Codex 式结构：bg-canvas 作为导航轨和侧栏，主工作面是 12px 圆角、带 line-subtle 描边和 elevation-low 的浮起卡片（src/components/layout/app-shell.tsx:114）；深色阴影用顶部高光代替投影。
- 已经成体系的动效可以作为模板：列表进出场 200/160ms、cubic-bezier(0.2,0,0,1)、首屏阶梯错开，并区分 reduced-motion（src/components/patterns/resource-presence.css）；输入框停靠用 motion 弹簧，且 LazyMotion 懒加载特性包（src/pages/home/components/composer-entrance.tsx）。
- 原语已迁到 Radix（Tabs、Select、Avatar 等）；Button 焦点环已改为 2px 加偏移，Input 用边框加 1px 外环，旧 design-14 的主要问题已经修复。
- Ant Design 和 Ant Design X 已整体移除（c7f3b9fd、2c6c0af1），原语层统一到 Radix 加 Tailwind 4，只剩 @ant-design/x-markdown；Dialog 用原生 \<dialog>（dialog.tsx:280），天然进入 top-layer。
- 已有设计守卫 ESLint 规则：eslint-rules/no-raw-visual-values.js 拦截 Tailwind 调色板色和写死的颜色，no-letter-avatar.js 禁止手写字母头像。提案中的圆角、阴影、duration、焦点 lint 都可以在这套设施上扩展。
- 外观系统已有完整的偏好维度和对应的令牌接线：text-scale 同时作用于字阶和控件高度（appearance.css:47-49、tailwind.css:15-27）；[data-motion='reduced'] 全局归零动效（appearance.css:98-106）；Clay 方案单独提供衬线阅读字体和 1.8 行高（appearance.css:32-37）。
- studio 已有带 AI 运行态的 StatusDot（collection-identity.tsx:45，running 用 bg-ai-tide 加 text-shimmer，并保证不只靠颜色传达状态），空状态有 kind 图块组合插画（collection-identity.tsx:109-129），可直接复用于 design-06、design-12。
- EntityAvatar 已支持 kind 图标回退、kind 角标、按种子稳定取色，并能用 Intl.Segmenter 正确取首个字素（entity-avatar.tsx:108-110），icon-tile-picker 可以直接建在它上面。
- Shiki 用读取令牌的 CSS 变量主题（code-block.css:11-33），Monaco 主题由令牌生成（use-monaco-theme.ts:90-95），所以 design-02 只需改求解目标，代码高亮会全链路自动跟随。

#### design-01 Mist 方案与 DreamJira Mist 取值不一致（深色品牌色尤甚），且没有 DreamJira 令牌词汇的映射层

中 · 工作量 M · 不需要后端 · consistency

**现状**：六套方案的取值都由种子求解得到，Mist 只是「延续 2.0 之前的默认风格」的近似：浅色主色比 #29669a 更饱和偏亮，深色主按钮是中蓝配白字，强调文字只有 5.5:1，与 DreamJira「深色 brand 变浅 + 深色字」的做法相反。命名上 canvas/surface/fg-muted/fg-subtle/action 与 DreamJira 的 bg-sidebar/bg-app/text-subtle/text-subtlest/brand 一一对应，但没有映射；fg-subtle 和 text-subtle 字面接近、语义差一级，从 DreamJira 搬组件或稿子时很容易用浅一档。

**证据**：

- src/themes/appearance.ts:28-33：studio、graphite 迁到 ink；src/themes/appearance.ts:53-55：DEFAULT_APPEARANCE.preset 为 'ink'
- docs/engineering-modernization-roadmap.md:384：2026-11-18 记录「用户批准方案稿（默认墨、六套方案全部上线）」，与任务说明里的「默认 Mist」冲突
- src/themes/color-schemes.ts:70-76：mist 种子 action:'accent'，深色实色明度 0.56
- src/themes/dark.css:294、386、388：mist 深色主按钮 action-bg = accent-9 oklch(0.56 0.13 245)，约 #1c7abb，配白字（4.61:1）
- src/themes/dark.css:296、392：mist 深色 accent-fg = oklch(0.652 0.101 245)，约 #5796c9，对 surface 5.56:1
- src/themes/light.css:293：mist 浅色 accent-9 oklch(0.5 0.125 245)，约 #0268a5；DreamJira 为 #29669a
- DreamJira tokens.json（artifact 3yXJ11VWF7q7FauWeiksQg）mist-dark：brand #91c2eb、on-brand #191a20（深色字）、text-brand #a3cff2，对 bg-app #17212a 9.9:1；README 规定深色主题 brand 变浅、on-brand 变深
- src/themes/design-system.md:62：fg-subtle 是「元信息与占位符」（第三级），而 DreamJira 的 text-subtle 是标签和说明（第二级），text-subtlest 才是第三级
- 全仓 ::selection 只在 src/components/knowledge/document-preview/components/pdf-preview.css:33 定制过，其余文字选区都是浏览器默认蓝，不随方案变化

**方案**：1) 默认方案不动（ink 已获批），把任务说明与路线图的冲突提交给用户确认；用户原 studio 偏好的去向（ink 还是 mist）也一起确认。2) 在 color-schemes.ts 的 SchemeSeed 增加 darkSolid: 'pastel' | 'deep' 选项：pastel 时深色 accent-solid、action-bg 取 L≈0.80 的浅阶，on-solid 由求解器自动选深色字（琥珀已经有 on:'dark' 的路径可以复用）；mist 启用 pastel，celadon、iris 视截图决定。3) 给种子加可选锚点 anchors: { lightSolid:'#29669a', darkSolid:'#91c2eb', darkText:'#a3cff2' }，生成器以锚点为准，合同测试照常跑。4) 生成 L3 别名层 dreamjira-aliases（bg-app→surface、bg-sidebar→canvas、bg-nav→surface、bg-subtle→fill-muted、text→fg、text-subtle→fg-muted、text-subtlest→fg-subtle、brand→action-bg、on-brand→action-fg、text-brand→accent-fg、border→line、border-strong→line-strong、border-focus→line-focus），写进 tailwind-tokens 生成物和 design-system.md 的对照表，让画布稿、DreamJira 组件和本仓说同一套词。5) base 层加 ::selection { background: color-mix(in oklab, var(--color-accent-solid) 28%, transparent) }，选区随方案变色。

**对标**：DreamJira 自己的规则：深色主题 brand 取浅色（#91c2eb / #a5a0ff），on-brand 取深色 #191a20，text-brand 约 9–10:1。Vercel、ChatGPT 深色模式的主按钮同样是浅色底配深色字。Linear 2024 改版用 LCH 由基色、强调色、对比度三个输入生成主题，同时允许固定锚点色。

**核验**：逐项核实成立。src/themes/appearance.ts:28-33 把 studio/graphite 迁到 ink，:53-55 默认 preset 为 'ink'；docs/engineering-modernization-roadmap.md:384 写明 2026-11-18「用户批准方案稿（默认墨…）」，而用户记忆（2026-11-16）仍写默认 DreamJira Mist，冲突真实存在，需先找用户确认。取值经 OKLCH→sRGB 复算：mist 深色 accent-9 oklch(0.56 0.13 245)=#1c7abb，配白字 4.61:1（dark.css:281、386-388）；accent-11=#5796c9（dark.css:283）；浅色 accent-9=#0268a5（light.css:293）。DreamJira tokens.json 中 mist-dark 的 brand 为 #91c2eb，on-brand 为 #191a20；README 原文写明「深色主题里 brand 变浅、on-brand 变深」「text-subtle 用于标签与说明，text-subtlest 用于占位符和计数」，design-system.md:62 的 fg-subtle 正好低一级。全局 ::selection 只在 pdf-preview.css:33 定制过（320e27f5 只修了 PDF 和画布选区）。补充一点：默认 ink 方案的 action 是 'ink'，深色主按钮已经是 gray-12 底配 gray-1 字（dark.css:124-126），本来就是浅底深字；差异只在 action:'accent' 的 mist、celadon、iris。提案符合约束。

#### design-02 色阶求解器把深色模式的强调文字和语法色压在 AA 下限，深色下发灰发闷

高 · 工作量 S · 不需要后端 · visual

**现状**：标准对比度下，深色模式的所有文字色阶、意图前景和语法色都被求解到 4.6:1 附近。结果是深色下强调色缺少亮度层次：链接和引用芯片偏暗，代码块里的字符串、函数、关键字都是中明度的浑色，状态文字也偏闷。只有切换到「高对比」才得到正常亮度。

**证据**：

- src/themes/color-scales.ts:39-43：solveLightness 注释写明取「as close to the background as allowed」，即刚好达标、离背景最近的明度
- src/themes/color-scales.ts:128-132：文字阶（第 11 阶）目标为 high ? 7 : 4.6
- src/themes/semantic-tokens.ts:372：syntaxTarget = high ? 7 : 4.6
- src/themes/dark.css:32、128、183：ink 深色 accent-11 oklch(0.656 0.156 264)，约 #5f8def，对 surface 5.5:1；链接、引用角标、选中文字都用它
- src/themes/dark.css:195、198：ink 深色 syntax-keyword 约 #4a7ae4（4.63:1），syntax-string 约 #3a8e41（4.61:1，近黑底上的暗绿），底色为 code-bg #111213
- src/themes/dark.css:499：同一 mist 方案的高对比块 accent-11 为 L 0.765，说明更亮的取值只在开启高对比时才给
- 用户使用的预设是 studio（已迁到 ink）+ 深色 + 紧凑，这些值就是他每天看到的

**方案**：把底线和目标分开。color-scales.ts 增加 TEXT_TARGET = { light: { standard: 5.5, high: 7.5 }, dark: { standard: 7, high: 9.5 } }；solveLightness 改为朝目标求解，深色允许彩度上浮约 10% 保持鲜艳。语法色在深色取 7–8:1，浅色取 5.5:1；意图 \*-fg 深色至少 6.5:1。合同测试的 4.5/3 阈值不变，再加一条「不更暗」回归：深色 accent-11 的 L ≥ 0.74，syntax-\* 的 L ≥ 0.72。改完运行 npm run build:themes，并截取 ink、mist、amber 深色下的代码块、引用和链接做对比。

**对标**：GitHub Dark 语法色：string #a5d6ff（12.3:1）、keyword #ff7b72（7.5:1）。Radix Colors 深色 blue-11 为 #70b8ff。DreamJira 深色 text-brand #b4aeff / #a3cff2，约 9–10:1。VS Code / Cursor 默认深色主题的语法色同样远高于 4.5:1。业界通行做法是把 4.5:1 当底线，而不是目标。

**核验**：核实成立。color-scales.ts:39-43 注释和二分逻辑都是「刚好达标、离背景最近」；文字阶在 :128-132 以 accent-4（tinted step）为底求 4.6:1（high 为 7），落到 surface 上约 5.5:1；semantic-tokens.ts:372 的 syntaxTarget 同为 4.6。复算 ink 深色：accent-11 oklch(0.6558 0.156 264)=#5f8def，对 surface #17181a 为 5.50:1（dark.css:32，accent-fg 在 :128，citation-fg 在 :183）；syntax-keyword #4a7ae4 为 4.63:1，string #3a8e41 为 4.61:1，function #0388b3 为 4.61:1，底色都是 code-bg=gray-1 #111213（dark.css:193-198）。这些值经 code-block.css:11-16 进入 Shiki，经 use-monaco-theme.ts:90-95 进入 Monaco。高对比块 mist accent-11 L 0.7649 实际在 dark.css:497，不是 499。对标数据复算属实：GitHub #a5d6ff 12.31:1，#ff7b72 7.51:1。提案建议：回归断言用对比度下限（例如深色 accent-fg 不低于 6.5:1），不要写固定 L 值；固定 L 对 amber、clay 和自定义种子不一定成立。

#### design-03 弹层进出场动效类全部失效，也没有动效时长和缓动令牌（旧 design-24 仍未关闭）

高 · 工作量 M · 不需要后端 · interaction

**现状**：Tooltip、Popover、Dialog、Sheet、AlertDialog 都是瞬间出现、瞬间消失，写了 data-[state=closed]:animate-out 也没有退场。各组件的过渡时长写在类名里，150/200/300/500ms 混用；只有列表进出场和输入框停靠两处有经过设计的动效。

**证据**：

- src/components/ui/tooltip.tsx:18：animate-in fade-in-0 zoom-in-95 data-[side=\*]:slide-in-from-\*
- src/components/ui/popover.tsx:30、src/components/ui/dialog.tsx:42、312：同类类名；另外 sheet.tsx、alert-dialog.tsx、file-uploader/file-card.tsx、file-list.tsx 和 code-script-editor.tsx 也在用，共 8 个文件
- package.json 中没有 tw-animate-css 或 tailwindcss-animate；2026-11-18 的构建产物 dist/assets/css/index-CHSHivfk.css 里 zoom-in-95 出现 0 次，也没有 .animate-in 规则
- docs/design-reviews/ui-ux-modernization-audit-2026-10-05.md:540：design-24 已指出同一问题，至今未修
- src/themes/tailwind.css:57-61：只有 fade-in 0.5s、slide 0.3s、fade-up 0.7s 几个动画，没有 duration 和 ease 令牌
- 全仓 duration-150 有 32 处、duration-200 有 24 处、duration-300 有 12 处、duration-500 有 3 处，显式 ease-\* 只有 4 处
- src/components/patterns/resource-presence.css:11-20：列表进出 200/160ms 加 cubic-bezier(0.2,0,0,1)，是唯一成体系的动效
- src/pages/home/components/composer-entrance.tsx:41：motion 库只用在输入框停靠的弹簧上
- src/components/ui/skeleton.tsx:22：骨架屏用 animate-pulse 整块闪烁

**方案**：1) appearance.css 定义动效令牌：--motion-fast:120ms、--motion-menu:160ms、--motion-panel:200ms、--motion-page:280ms、--ease-out:cubic-bezier(0.2,0,0,1)、--ease-in:cubic-bezier(0.4,0,1,1)、--ease-spring:linear(…)，[data-motion=reduced] 下全部为 0，并在 @theme 里映射成 --default-transition-duration 和 --animate-\*。2) 修复弹层：最省事的是 @import 'tw-animate-css'（S）；或者自写 @utility overlay-in/overlay-out，读 Radix 的 data-[state] 和 --radix-\*-transform-origin，菜单从 0.96 缩放到 1 并淡入，用时 --motion-menu。dialog.tsx 是原生 \<dialog>，对它和 ::backdrop 用 @starting-style。3) 统一动效语汇：Sheet 侧滑 200ms；骨架改成与 text-shimmer 同一渐变的横向扫光；流式文本按块淡入（120ms opacity）；导航轨和 Tabs 的选中指示用 motion 的 layoutId 滑动。4) 在 components/ui 里用 design-guard 禁止裸写 duration-\*，改用 duration-(--motion-\*)。

**对标**：DreamJira 定义 --motion-fast 120ms（悬停、颜色）、--motion-menu 160ms、--motion-panel 200ms，reduced-motion 时全部归零。shadcn/ui 的 Tailwind v4 版用 tw-animate-css 按 Radix 的 data-[state] 驱动进出场。Linear、Raycast 的菜单从触发点做约 150ms 的缩放加淡入。原生 \<dialog> 在 Chromium、Safari、Firefox 都可以用 @starting-style 加 transition-behavior: allow-discrete 做进出场。

**核验**：核实成立。8 个文件使用 animate-in：tooltip.tsx:18、popover、dialog.tsx:42/312、sheet、alert-dialog、file-card、file-list、code-script-editor。package.json 只有 motion 14.14.0，没有 tw-animate-css 或 tailwindcss-animate；src 下没有定义 animate-in 的 @utility 或 keyframes；dist/assets/css/index-CHSHivfk.css（11-18 构建）中 zoom-in-95 和 .animate-in 都是 0 次。旧审计 ui-ux-modernization-audit-2026-10-05.md:540 的 design-24 至今未关闭。tailwind.css:57-61 只有 fadeIn/slide/fadeUp 几个动画。实测 duration-150/200/300/500 分别为 33/25/13/3 处，与报告基本一致。skeleton.tsx:22 用 animate-pulse；resource-presence.css 是唯一成体系的动效。DreamJira README 原文确有 120/160/200ms 三档动效，reduced-motion 时归零。dialog.tsx:280 是原生 \<dialog>，可以按提案用 @starting-style。appearance.css:98-106 已有 [data-motion='reduced'] 全局归零，可直接承接动效令牌。

#### design-04 没有语义字阶，标题层级在 15–30px 之间；中文里的引号、省略号由 Geist 渲染，深色模式还全局加字距

高 · 工作量 M · 不需要后端 · visual

**现状**：界面主要靠 text-sm 和 text-xs 两档，层级多靠粗细和颜色区分。页面标题有三种尺寸：PageTitleBar 16px（page-title-bar.tsx:106），PageHeader 20–24px（page-header.tsx:84），首页问候 24–30px。字体栈 appearance.css:14-17 让 Geist 排在中文字体前面，并且 latin 子集覆盖 U+2000-206F，所以中文里的引号、省略号、间隔号由 Geist 绘制。深色模式另有 index.css:241-245 的 0.015em 字距补丁。body 基准为 16px（appearance.css:86-90）。

**证据**：

- src/themes/tailwind.css:15-27：只有 xs…9xl 通用字阶乘以 text-scale，没有 view-title、section-title、control、caption 这类按用途命名的角色
- 全仓 text-sm 958 处、text-xs 858 处、text-[11px] 9 处；没有 13px 档（DreamJira 的 control 是 13px medium），src/components/ui/button.tsx:8 按钮用 text-sm（14px）
- 页面标题：src/components/patterns/page-title-bar.tsx:106 为 text-base；src/components/patterns/page-header.tsx:84 为 text-xl 或 text-2xl（8 个页面在用）；src/pages/home/components/home-greeting.tsx:51 为 text-2xl sm:text-3xl。tracking-\* 全仓只有 31 处
- src/themes/appearance.css:178-181：'Geist Variable' 排在所有中文字体前面。node_modules/@fontsource-variable/geist/index.css 的 latin 子集 unicode-range 包含 U+2000-206F，所以 “ ” ‘ ’ … — · 都由 Geist 绘制
- src/locales/zh-CN 中有 68 个 …、28 对 “”、42 个 ·，模型输出的中文回答里这些符号更多
- src/index.css:241-245：深色模式给 .text-xs 和 .text-sm 加 letter-spacing 0.015em（构建产物里确实存在），中文字距也被拉开
- src/themes/appearance.css:250-254：body 字号 16px，而界面主体是 14px
- src/components/patterns/stat-card.tsx:40：统计数值 text-2xl，没有 tabular-nums

**方案**：保留原提案 1、3、4、5、6。第 2 条（CJK 标点字体别名）改为渐进实施：先只在 zh-CN 的阅读区（.prose 和聊天正文）启用，截图对比中英混排的模型回答，确认英文句子里的引号没有变成全角字形后，再推广到 --font-interface。

**对标**：Vercel Geist 设计系统按用途给字阶命名（Heading、Label、Copy、Button 各有固定字号和行高）。DreamJira 只有三级标题 18/16/15（view-title 字距 -0.02em），body 14/1.5、control 13 medium、caption 12、micro 11，数字成列一律 tabular-nums。Linear 界面以 13px 为主字号。飞书、语雀的中文正文用全角引号字形。Chromium 已支持 text-spacing-trim 和 text-autospace，可用于标点挤压和中英间距。

**核验**：核心结论成立，但 appearance.css 的行号错了：文件只有 106 行。字体栈在 src/themes/appearance.css:14-17（'Geist Variable' 排在所有中文字体前面），body 字号在 :86-90（calc(1rem\*text-scale)=16px）。其余证据属实：tailwind.css:15-27 只有通用字阶；text-sm 960、text-xs 859、text-[11px] 9、text-[13px] 0、tracking-\* 31 处；button.tsx:8 用 text-sm；page-title-bar.tsx:106 为 text-base；page-header.tsx:84 为 text-xl/2xl；home-greeting.tsx:51 为 text-2xl sm:text-3xl；stat-card.tsx:40 为 text-2xl，没有 tabular-nums。Geist latin 子集的 unicode-range 包含 U+0000-00FF 和 U+2000-206F，所以 · “” … — 都由 Geist 绘制；zh-CN 资源中 … 68、“ 28、· 42 处。index.css:241-245 的深色字距补丁确实存在。DreamJira README 确认标题只有三级 18/16/15，view-title 字距 -0.02em，并要求「不要再造更大的标题」，control 为 13px。提案第 2 条需要补一个风险：把仅含标点的 CJK 字体放到 Geist 前面后，中文界面里模型输出的英文句子同样会换成全角弯引号和省略号。:lang(en) 只覆盖声明了 lang 的容器，模型回答通常没有 lang，应先截图评估，或只对 zh 阅读区启用。

#### design-05 密度只缩控件不缩行；紧凑档控件 28px 小于 DreamJira 的 32px，桌面导航轨不读密度令牌

中 · 工作量 M · 不需要后端 · consistency

**现状**：用户用的是紧凑档：按钮和选择器缩到 28px，比 DreamJira 的 32px 还小，但表格行仍是 44px，列表行由内边距推出，结果控件很挤、行却很松。Web 侧栏会随密度变，桌面端导航轨不会，两端观感不一致。

**证据**：

- src/themes/appearance.css:202-221：comfortable 控件 32px；src/themes/appearance.css:222-240：compact 控件 28px、sm 24px。没有 row-height 和 input-height 令牌
- src/components/ui/table.tsx:284、299：表头固定 h-9，行固定 h-11（44px），两档密度相同
- src/components/patterns/resource-row.tsx:142：行高靠 py-space-xs / py-space-sm 间接推出
- src/components/layout/desktop/activity-rail.tsx:30、52：w-16、size-10 写死；而 src/components/layout/Sidebar.tsx:71、117 用的是 --nav-rail-item
- DreamJira tokens.json layout：control-h 32、input-h 36、row-height 36（默认紧凑）、row-height-comfortable 44、touch-target 44

**方案**：在 appearance.css 增加 --row-height（compact 36px / comfortable 44px）、--row-height-sm（28/32，用于嵌套和树）、--input-height（32/36）。--control-height 两档都保持 32px，compact 只收间距和行高。table.tsx、resource-row.tsx、conversation-list.tsx、侧栏导航项、activity-rail 都改读这些令牌；虚拟列表的 estimateSize 通过 useDensity() 取同一数值。@media (pointer: coarse) 下可点目标至少 44px。

**对标**：DreamJira 的密度只改行高（36↔44），控件固定 32px，输入框 36px，手机上可点控件至少 44px，并要求改密度时同步虚拟列表的行高估算。Gmail 的「显示密度」也是直接改列表行高，而不只是改内边距。

**核验**：结论成立，行号需要更正：comfortable 档在 src/themes/appearance.css:38-57（control-height 2rem=32px），compact 档在 :58-76（control-height 1.75rem=28px，sm 1.5rem=24px），没有 row-height 和 input-height 令牌。table.tsx:284 的表头为 h-9，:299 的行为 h-11，两档相同；resource-row.tsx:142 只按密度切换 py-space-xs/sm；activity-rail.tsx:30 的 w-16 和 :52 的 size-10 写死，Sidebar.tsx:71、117 读 --nav-rail-item。DreamJira README 原文：control-h 32、input-h 36、row-height 36（默认）/44，并要求「子控件不能加 padding 撑高行，改密度要同步虚拟列表估算」。用户使用紧凑档（见记忆），提案与 DreamJira 一致，可以照做。

#### design-06 AI 身份仍是图标库图形加通用转圈：品牌标是 lucide Waves，思考态是 LoaderCircle，默认 AI 渐变是蓝紫粉

高 · 工作量 M · 不需要后端 · missing-pattern

**现状**：「Tide」这个 Agent 身份在视觉上没有自己的图形：品牌位、首页问候和导航轨用的是通用的波浪图标，配默认方案里最常见的蓝紫粉渐变；模型思考、页面加载和按钮 loading 共用同一种转圈，用户看不出「AI 正在工作」和「页面在加载」有什么区别。

**证据**：

- src/components/layout/brand-mark.tsx:1、27、32：TideMark 就是 lucide-react 的 Waves 图标，放在 bg-ai-tide 渐变块上
- src/themes/color-schemes.ts:65：默认 ink 方案的 AI 三色相为 [255, 290, 330]（蓝→紫→粉）
- src/components/chat/ChatBubbleLoading.tsx:14-18：首个 token 到达前只显示 LoaderCircle 转圈加 text-shimmer 文本
- src/components/patterns/page-states.tsx:72：页面级加载也是 Loader2 转圈；全仓 animate-spin 59 处
- AI 工具类用得很少：bg-ai-tide 8 个文件、ai-halo 只有 WelcomeSection 1 处、ai-soft 和 ai-fg 只在 src/components/chat/run-timeline.tsx
- src/themes/tailwind.css:108-155：tide、glow、halo、shimmer 工具类都已齐备
- src/themes/design-system.md:105：规定 AI 感靠动效与结构表达
- DreamJira README 检查清单：No AI tropes (blue-purple gradients…)

**方案**：1) 保留自有 \<TideGlyph state=idle|thinking|streaming|done>，替换 ChatBubbleLoading、助手标识、run-running、导航轨品牌位和 PageLoadingState，LoaderCircle 只留给按钮 loading；图形稿先给用户确认。2) AI 渐变改成「潮汐」意象的青→蓝→强调色：ink 取 (h-60, h-30, h) 约 204→234→264，去掉紫和粉两端；custom 的 (h-35, h, h+35) 规则同步改为单侧，避免任何方案默认落到蓝紫粉。其他方案逐个截图评估。3) 「AI 生成」标记复用 studio 已有的 StatusDot running 语汇（collection-identity.tsx:45，bg-ai-tide 加 text-shimmer），不另造视觉。用量仍限定在 AI 时刻。

**对标**：Claude.ai 的星芒标在侧栏、回答起始处和生成过程中是同一个图形，生成时会动起来；Gemini 的 spark 在思考时有渐变动画；Perplexity 检索时 logo 有动画；ChatGPT 在生成前显示脉动圆点和闪光的 Thinking 文本。它们都用一个自有图形贯穿「待命、思考、输出」，而不是借用通用加载图标。

**核验**：核心成立。brand-mark.tsx:1、32 的 TideMark 就是 lucide 的 Waves 放在 bg-ai-tide 上，导航轨 activity-rail.tsx:39 和 Sidebar.tsx:76 都在用；ChatBubbleLoading.tsx:14-18 是 LoaderCircle 加 text-shimmer；page-states.tsx:72 是 Loader2；animate-spin 共 59 处；color-schemes.ts:65 的 ink AI 色相为 [255,290,330]。需要更正三处。(1) 「No AI tropes (blue-purple gradients…)」出自 Design System 制品类型自带的 SKILL.md 编写检查清单，不是 DreamJira 的 README；DreamJira README 只写了「颜色只用来表达品牌、状态和危险」和「不用 emoji，不用插画」。(2) AI 工具类不只在 run-timeline 中使用：home-greeting.tsx:35 也用了 border-ai-line 和 bg-ai-glow。(3) 提案把 ink 的 AI 色相改成 229→264→299，仍是蓝到紫的渐变（299 属紫罗兰），没有真正摆脱它要解决的问题。另外，更换品牌标属于品牌决策，需要用户先认可图形稿。

#### design-07 实体头像缺省是首字母加平涂色块，没有图标或 emoji 加颜色的选择器

中 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：\<EntityAvatar> 共 71 处，21 处带 kind 或 icon。应用、知识库、搜索、记忆等集合页只传 badge（kind 角标），没有图片时显示「首字母色块加右下角类别角标」；列表里雷同的字母块仍然很多，身份感不足。上传入口有两个（ui/avatar-upload.tsx 与 memory/AvatarUpload.tsx），都只能上传图片。

**证据**：

- src/components/patterns/entity-avatar.tsx:172-180：没有图片时显示首字母（或 kind 图标）；src/components/patterns/entity-avatar.tsx:18-27：底色是 avatar-1..8 平涂
- src/components/patterns/entity-avatar.tsx:113-119：resolveAvatarSrc 已经接受 data: URL
- src/components/ui/avatar-upload.tsx:28-67 与 src/components/memory/AvatarUpload.tsx：两个上传组件，都只能上传图片
- 全仓 67 处 \<EntityAvatar>，传了 kind 或 icon 的只有约 3 处，其余在无图时都显示字母
- 后端 E:\\project\\MultiRAG\\api\\db\\db_models.py:2949（Knowledgebase.avatar）、:3132（Dialog.icon）、:3410（UserCanvas.avatar）、:3688（Search.avatar）、:4009（Memory.avatar）：均为 Text 类型的 base64 字符串字段

**方案**：新增 patterns/icon-tile-picker.tsx，提供两个标签页：图标（精选 lucide 图标加 8 个身份色）和上传；emoji 标签页待用户确认后再加，以免违反 DreamJira 的「不用 emoji」规则。选定后在前端用 canvas 渲染成 128×128 的 PNG，写入 data:image/png;base64，回填现有的 avatar 或 icon 字段。不要用 SVG：知识库 REST 接口只收 jpeg 和 png，且长度上限 65535。新建实体时默认给「kind 图标加身份色」，集合页对没有图片的实体传 kind，不再只传 badge。两个 AvatarUpload 合并到 picker 的上传页。

**对标**：Notion 页面图标可选 emoji 或图标加颜色；Linear 项目图标可选图标加颜色；LobeHub 助手头像是 emoji 加背景色；Dify 应用图标选择器提供 emoji 和背景色，也能上传图片；ChatGPT Projects 可为项目选择颜色和图标。

**核验**：现象成立，但计数、后端和提案都需要修正。(1) 计数：\<EntityAvatar> 共 71 处，传了 kind 或 icon 的有 21 处，不是约 3 处。主要集合页 studio-app-list.tsx:145、search-collection.tsx:301、memory-collection.tsx:168、home-recent-work.tsx:60 传的是 avatar.badge，结果是首字母加角标，仍属字母块，所以核心观察成立；entity-avatar.tsx:172-180 在无图时回退到 kind 图标或首字母。(2) 后端：五个字段在 db_models.py:2949/3132/3410/3688/4009 均为 Text，这点属实。但知识库走 REST PUT /v1/datasets（web 的 src/api/knowledge.ts:148），MultiRAG 的 api/utils/validation_utils.py:603-650 只接受 data:image/jpeg 或 data:image/png，且长度不超过 65535，由 restful_apis/dataset_api.py:71 调用。提案中的 data:image/svg+xml 会被知识库接口拒绝，必须先在前端用 canvas 栅格化成 PNG。(3) DreamJira README 明确写「不用 emoji，不用插画」，emoji 标签页与之冲突，需要用户另行确认。另外 eslint-rules/no-letter-avatar.js 已经禁止手写字母头像，可作为后续收口的抓手。

#### design-08 全局隐藏滚动条仍未处理（旧 design-13），Windows 上看不出区域能滚动

中 · 工作量 S · 不需要后端 · accessibility

**现状**：侧栏会话列表、设置页、检索结果、表格等大部分滚动区没有任何滚动指示。Windows 没有 macOS 那样的叠加滚动条，长列表看起来像已经到底；用户的主力平台正是 Windows 和 Electron 桌面端。

**证据**：

- src/index.css:154-163：\* { scrollbar-width: none } 和 \*::-webkit-scrollbar { width: 0 }
- src/components/ui/scroll-area.tsx:17-24：只有 ScrollArea 加了 scrollbar-thin
- 全仓 overflow-auto / overflow-y-auto 196 处，scrollbar-thin 只有 15 处
- src/index.css:189-212：.scrollbar-thin[style\*='overflow'] 等 webkit 伪元素规则，在标准 scrollbar-width 生效后不再起作用
- docs/design-reviews/ui-ux-modernization-audit-2026-10-05.md:638：design-13 已指出同一问题

**方案**：删除全局隐藏规则。base 层设 \* { scrollbar-width: thin; scrollbar-color: var(--color-line-strong) transparent }；提供 .scroll-quiet 变体，静止时 thumb 透明、:hover 或 :focus-within 时显示；轮播和横向标签条显式加 scrollbar-none；主工作面加 scrollbar-gutter: stable，防止内容跳动。同时删除 index.css:165-212 的 webkit 规则。

**对标**：VS Code 和 Cursor 使用细滚动条，悬停时加深，不会完全去掉。DreamJira 和 Linear 风格的密集界面也保留细滚动条作为位置提示。

**核验**：核实成立。src/index.css:153-163 有 \* { scrollbar-width:none } 和 \*::-webkit-scrollbar 宽 0；scroll-area.tsx:21 只给 ScrollArea 视口加了 scrollbar-thin；overflow-auto 和 overflow-y-auto 共 196 处，scrollbar-thin 只有 15 处。index.css:165-212 的 webkit 伪元素规则，在 Chromium 121+ 与 Electron 中只要设置了标准 scrollbar-width 就会被忽略。旧审计 :638 的 design-13 至今未修，git log 中 index.css 也没有相关改动。提案合理。

#### design-09 圆角、阴影、层级、图标尺寸各有一套写法：四级圆角加原生类混用，z-index 随手写

中 · 工作量 M · 不需要后端 · consistency

**现状**：圆角有 4/6/8/12 四级，8px 一级用量很大（rounded-radius-lg 175 处，另有同值的 rounded-lg 46 处），按钮 6、图块 8、卡片 12 三种观感并存。原生 rounded-lg/md/xl 在 TW4 下与令牌同值，只是命名不统一；真正写死的是 rounded-2xl、markdown-prose.css 的 8px/4px，以及 10 处 Tailwind 默认阴影。z-index 没有令牌，Select 和 skill-select 用 1000，Dialog 用 50。

**证据**：

- src/themes/appearance.css:187-193：注释写「DreamJira radii 4/6/8/12」，实际是四级；DreamJira 只有 4/6/12
- 圆角用量：rounded-radius-md 240、rounded-radius-lg（8px）175、rounded-radius-sm 126、rounded-radius-xl 70；另有原生 rounded-lg 47、rounded-xl 15、rounded-md 15、rounded-2xl 6
- src/styles/markdown-prose.css:144-148：pre 写死 border-radius: 8px
- 原生阴影 shadow-lg 6 处、shadow-md 2 处、shadow-2xl 1 处，绕过了 elevation 令牌
- src/themes/dark.css:102、104：深色 raised 与 overlay 同为 gray-3，从卡片上弹出的菜单只能靠描边和阴影区分
- src/components/ui/select.tsx:264：z-[1000]；全仓 z-50 20 处，另有 z-[1100]、z-[70]、z-[71] 各 1 处，没有层级令牌
- 图标尺寸：size-icon-sm 617 处，同义的 size-4 117 处、size-5 24 处；文件图标有两套：src/components/ui/file-icon.tsx:497-501（3 个使用方，标签文字 6–11px）和 src/components/patterns/file-kind-tile.tsx（24 个使用方）；src/components/ui/icon-font.tsx:14-17 仍用 iconfont 雪碧图

**方案**：保留原提案 1-4，补充两点：codemod 收敛 8px 时，按「控件和小图块并入 6，卡片和面板并入 12」逐页截图核对，涉及约 220 处，分批提交；lint 只需拦截 rounded-2xl 及以上、Tailwind 默认 shadow-\* 和写死的 border-radius，原生 rounded-md/lg/xl 用 codemod 统一成 rounded-radius-\* 即可。

**对标**：DreamJira：radius-sm 4（chip、状态胶囊）、radius 6（按钮、输入、菜单项）、radius-lg 12（下拉面板、弹窗、卡片）、full；阴影只有 shadow-card、shadow-overlay、shadow-raised 三档；z 层级 80/81/100/120。Radix Themes 也用一套编号圆角加全局缩放系数。

**核验**：四级圆角、z-index 和图标尺寸混用属实，但「原生类绕过令牌」的说法有误。Tailwind 4 的 rounded-sm/md/lg 读取 --radius-\*，而 src/themes/tailwind.css:28-34 已把它们映射到 var(--radius) 体系；appearance.css:28 的 --radius-xl 也会覆盖默认值。所以 rounded-lg(46)、rounded-md(15)、rounded-xl(15) 与 rounded-radius-\* 取值相同，只是写法不统一。真正绕过令牌的只有 rounded-2xl(5)、markdown-prose.css:146/153 写死的 8px/4px，以及 Tailwind 默认的 shadow-lg/md/2xl（共 10 处）。注释「DreamJira radii 4/6/8/12」在 appearance.css:23，不是 :187。z-[1000] 除 select.tsx:264 外，还有 skills/skill-select.tsx 一处。DreamJira README 原文确为 4/6/12 三级圆角，z 层级 80/81/100/120，阴影 card/overlay/raised 三档。dark.css:102/104 中 raised 与 overlay 同为 gray-3，属实；elevation-medium 带 1px 白色描边，可以部分区分。图标：size-icon-sm 617 处、size-4 124 处、size-5 24 处；FileIcon 有 3 个使用方，FileKindTile 23 个，IconFont 2 个。

#### design-10 有分类色令牌却没有共享图表原语：用量图是手写的 div 柱，StatCard 没有趋势和对比

中 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：模型网关、安全审查等页面已有按日期汇总的数据，但前端只能手写柱子或只显示大数字。KPI 卡看不出变化趋势，图表的配色、图例、tooltip、空态在各页面各写各的。

**证据**：

- src/pages/settings/model-gateway/components/overview/requests-chart.tsx:82：flex 布局手写柱状图，基线用 border-viz-axis
- src/components/patterns/stat-card.tsx:36-55：标题、大数字加一个图标块，没有涨跌、sparkline 和 tabular-nums
- package.json:119：echarts 6.1.0 只用于 src/pages/agent/form/html-report/renderer/\*；提交 2ef8ae77 移除了 recharts
- src/themes/semantic-tokens.ts 的 viz 段：只有 10 个等明度分类色，没有顺序色阶和发散色阶（相关度、热力、分数）
- src/lib/design-tokens/categorical-palette.ts：getCategoricalPalette 已经可以按方案和明暗给图表取色
- 后端：E:\\project\\MultiRAG\\api\\apps\\restful_apis\\model_gateway_api.py:95（/overview）、:152（/usage，按 Key、模型、日期汇总）；api/apps/guard_detection_app.py:1964（/stats/trend）

**方案**：新建 patterns/chart/：\<ChartFrame> 负责标题、图例、加载/空/错误态和可访问的 table 回退（沿用 requests-chart 现有的 caption 表格）；\<Sparkline> 用纯 SVG 实现，零依赖；复杂图按需懒加载 echarts/core（已是依赖，只注册 Line、Bar 和 SVGRenderer），主题由 getTokenValue 和 getCategoricalPalette 生成，并随 preset 与 resolvedMode 重建。StatCard 增加 delta（success-fg 或 danger-fg 加箭头）、sparkline、tabular-nums，可选放 ProviderLogo。令牌层补 viz-seq-1..7（取强调色阶）和 viz-div 发散色阶，用于相关度、热力等场景。

**对标**：shadcn/ui Charts（Recharts 加 ChartContainer，用 CSS 变量配置系列颜色，统一 Tooltip 和 Legend）；Vercel Observability、Langfuse、Helicone 的 KPI 卡带 sparkline 和环比；Dify 应用「监测」页有对话量、token、延迟折线图。

**核验**：核实成立。requests-chart.tsx:80-82 用 flex 手写柱状图，基线是 border-viz-axis；stat-card.tsx:36-55 没有 delta、sparkline 和 tabular-nums；package.json:119 有 echarts ^6.1.0，但只用在 agent/form/html-report/renderer/echarts-option.ts；2ef8ae77 确实删除了 recharts；semantic-tokens.ts:108-109、411-415 只有 viz-1..10 和 viz-axis，没有顺序或发散色阶；categorical-palette.ts 存在。后端 MultiRAG 中 model_gateway_api.py:93 有 /overview，:152 有 /usage（group_by 含 day），guard_detection_app.py:1964 有 /stats/trend，均已核实。其他页面的统计口径按记忆的说法并不可靠，接入前需逐个核实，这一提醒正确。

#### design-11 全局 Markdown 排版正文用次要色，行内代码底色与页面相同，只有聊天区单独修正

中 · 工作量 S · 不需要后端 · visual

**现状**：同一份 Markdown，在聊天区是主文字色加浅底代码芯片，到了知识库预览、技能文档、Agent 运行对话、应用预览里就变成灰色正文，行内代码看不出底色。阅读体验取决于在哪个页面打开。

**证据**：

- src/styles/markdown-prose.css:9-12、131-141：.prose 的正文颜色和 --tw-prose-body 都是 fg-muted
- src/styles/markdown-prose.css:144-155：pre 和行内 code 的背景都是 surface，与页面同色，行内代码没有可见底色；圆角写死 8px 和 4px
- src/components/chat/app-chat-message.css:1-30：只有 .app-chat-area .markdown-content 把正文改回 fg、代码改回 code-bg
- 仍走全局规则的页面：src/components/knowledge/document-preview/components/text-preview.tsx:86、src/pages/skills/skill-document.tsx、src/pages/agent/components/runtime-chat/runtime-chat-renderers.tsx、src/pages/studio/create-app/components/preview-pane.tsx
- src/themes/appearance.css:182、186、196-201：已有 --font-reading 和 --reading-line-height，但没有阅读字号、行宽和段距令牌

**方案**：把聊天区的修正提升为全局的阅读排版约定：--reading-size（界面 14px，阅读 15px，Clay 16px）、--reading-measure 72ch；正文用 fg，引用和注释用 fg-muted；行内代码用 code-bg 芯片，pre 统一 code-bg 加 line-subtle 描边和 md 圆角；表头用 sunken；中文段距 0.75em、行高 1.75。然后删除 app-chat-message.css 中重复的规则。

**对标**：Claude.ai 和 ChatGPT 的回答正文用主文字色，约 16px，行内代码是浅底芯片；Vercel AI Elements 的 Response 组件（Streamdown）为所有 AI 输出提供同一套排版。

**核验**：结论成立，行号需要更正：--font-reading 在 src/themes/appearance.css:18，--reading-line-height 在 :22，.prose 行高在 :91-94，不是 :182/186/196-201。markdown-prose.css:9-12 和 :131-141 的正文色都是 fg-muted；:144-155 中 pre 和行内 code 的背景都是 surface，并写死 8px/4px。app-chat-message.css:1-30 只修正了 .app-chat-area 里的正文和代码颜色。补一条佐证：skill-document.tsx:99 虽然加了 text-fg，但 markdown-prose.css 是未分层样式，会压过分层的 Tailwind 工具类，所以技能文档正文仍是 fg-muted。text-preview.tsx:86 和 runtime-chat-renderers.tsx:56 同样走全局规则。提案可以照做。

#### design-12 Badge 按色相命名（blue/orange/purple/green），缺少 accent、ai、info 和圆点状态等语义变体

低 · 工作量 S · 不需要后端 · consistency

**现状**：「蓝色标签」「紫色标签」是按颜色而不是按含义选的，换方案后无法保证语义一致；AI 生成标记、信息提示、运行中状态都没有对应的标签变体，只能在页面里各自拼写。

**证据**：

- src/components/ui/badge.tsx:17-37：变体为 default、secondary、destructive、success、warning、outline，外加 blue、orange、purple、green（映射到 avatar-6/2/7/4 身份色）
- src/components/ui/badge.tsx:51-58：渲染为 div，放进 \<p> 这类行内上下文时结构不合法
- src/themes/design-system.md:71-73：意图矩阵已有 accent、ai、neutral、info 的 soft、line、fg 角色
- DreamJira 状态胶囊按状态分组（lz-default、lz-inprogress、lz-success、lz-removed），12/16 medium

**方案**：Badge 改为 tone（neutral、accent、ai、info、success、warning、danger）× variant（soft、outline、solid）两维，元素改为 span。把 studio 的 StatusDot 提升到 patterns/status-dot.tsx，作为唯一的圆点状态组件，接 run-\* 令牌，不在 Badge 里再造 dot 变体。8 处 blue/orange/purple/green 直接改成 identity={n}，或改成对应的语义 tone。

**对标**：GitHub Primer 的 Label 按语义命名（accent、success、attention、severe、danger、done）；Radix Themes 的 Badge 是 color × variant（solid、soft、surface、outline）两维组合。

**核验**：badge.tsx:17-37 的色相变体，以及 :51-58 渲染为 div，都属实。但「运行中状态点只能各页拼写」不准确：src/components/studio/collection-identity.tsx:17-60 已有 StatusDot（6px 圆点加文字，含 success、warning、error、info、neutral、running；running 用 bg-ai-tide 和 text-shimmer，带 data-slot），app-metadata.tsx 在用，只是放在 studio 目录，没有进入 patterns。色相变体实际只有 8 处，分布在 7 个文件，迁移成本很低。

#### design-13 焦点环仍有四种画法，偏移带颜色固定为 surface

低 · 工作量 S · 不需要后端 · accessibility

**现状**：主要原语已经满足可见焦点，但宽度、偏移和内外位置各不相同。在非 surface 底色上，Button 的偏移带会显示成一条错色的边。

**证据**：

- 全仓 focus-visible:ring-2 105 处、focus-visible:outline-2 13 处、focus-visible:ring-1 10 处、ring-inset 9 处、ring-offset-0 3 处
- src/components/ui/button.tsx:8：ring-2、ring-offset-2 加 ring-offset-surface，按钮放在 canvas 导航轨或 raised 卡片上时，偏移带是另一种颜色
- src/components/ui/select.tsx:190、src/components/ui/input.tsx:9：ring-1
- src/components/ui/tabs.tsx:82：ring-inset
- src/components/layout/desktop/activity-rail.tsx:52：ring-2 无偏移
- docs/design-reviews/ui-ux-modernization-audit-2026-10-05.md:639：design-14 建议的 @utility focus-ring 至今未落地

**方案**：在 tailwind.css 增加 @utility focus-ring { outline: 2px solid var(--color-line-focus); outline-offset: 2px }，以及用于密集行和标签的 focus-ring-inset（outline-offset: -2px）。用 outline 而不是 box-shadow ring：不存在偏移带底色问题，forced-colors 模式下也可见。base 层加 :focus-visible 兜底；design-guard 拦截 focus-visible:ring-1，以及只写 outline-hidden 却没有替代样式的情况。

**对标**：DreamJira 规定 :focus-visible 一律为 2px 实线 border-focus、偏移 2px；WCAG 2.2 的 2.4.13（Focus Appearance）；GitHub Primer 用统一的 focus outline 令牌。

**核验**：核实成立。focus-visible:ring-2 106 处、outline-2 13 处、ring-1 10 处、ring-inset 17 处（报告写 9）、ring-offset-0 3 处。button.tsx:8 用 ring-offset-2 加 ring-offset-surface；select.tsx:190 用 ring-1；tabs.tsx:82 用 ring-inset；activity-rail.tsx:52 是 ring-2 无偏移。tailwind.css 和 index.css 都没有 @utility focus-ring，也没有 :focus-visible 兜底，旧审计 :639 的 design-14 未落地。DreamJira README 原文：「:focus-visible 一律 2px 实线 border-focus、偏移 2px」。提案合理。

#### design-14 原语层写法停留在 React 18 时代：33 个文件用 forwardRef，Radix 分包按区间声明，data-slot 只覆盖 5 个文件

低 · 工作量 M · 不需要后端 · tech-choice

**现状**：依赖版本都是新的，组件写法却是 shadcn v3 和 React 18 的样子：forwardRef 层层包装，父级没有稳定的 data-slot 可供选择器定位，Radix 分散成 21 个包，各自按区间升级。

**证据**：

- src/components/ui/button.tsx:55、src/components/ui/card.tsx:36、src/components/ui/avatar.tsx:5、src/components/ui/tabs.tsx:40：React.forwardRef 加 displayName；components/ui 下共 33 个文件这样写
- data-slot 只出现在 5 个 ui 文件中（如 src/components/ui/badge.tsx:54）
- package.json:85-105：21 个 @radix-ui/react-\* 以 ^ 区间声明（实际安装 react-dialog 1.3.1、react-select 2.4.1）
- package.json:134：react 19.3.1，已支持把 ref 当作普通 prop
- src/components/ui/avatar.tsx:90-127：AvatarGroup 仍用 ring-background、bg-muted-foreground、text-white 这些旧别名
- DreamJira README：真实组件基于 React + Base UI

**方案**：不建议整体换库。1) 用 codemod 把 forwardRef 改成函数组件加 ref prop，并给所有原语统一加 data-slot，方便密度和主题样式按 slot 定位。2) 改用统一的 radix-ui 包并锁定版本。3) 以后新增复杂原语（Combobox、NumberField 等）时评估 Base UI，与 DreamJira 共享 API 习惯。4) 清理 AvatarGroup 和 LegacyAvatar 里的旧别名与 text-white。

**对标**：shadcn/ui 的 Tailwind v4 / React 19 版去掉了 forwardRef，每个原语都带 data-slot，并提供迁移到统一 radix-ui 包的命令；Base UI 由 Radix、Floating UI、MUI 的作者维护，DreamJira 用的就是它。

**核验**：核实成立。components/ui 下 33 个文件使用 forwardRef，带 data-slot 的只有 5 个；package.json 中有 21 个 @radix-ui/react-\* 按区间声明（实际安装 react-dialog 1.3.1、react-select 2.4.1）；React 为 19.3.1。DreamJira README 原文确为「真实组件是 React + Base UI」。补充：avatar.tsx 中的 ring-background、bg-muted-foreground 仍能渲染，因为 tailwind-tokens-1.generated.css:40、85 还保留着桥接别名；AvatarGroup 和 LegacyAvatar 在 avatar.tsx 之外没有使用方，可以直接删除，不必迁移。提案不建议整体换库，判断稳妥。

### quality：横切体验质量

**维度结论**：跨领域体验质量的底子已经比 10-05 审计时好很多：只剩一个 ConfirmDialog，错误文案固定不泄露后端细节，有 EmptyStart 首用态和路由恢复页，Button 焦点环改成 2px，应用内可以设置减少动效，有 Cmd+K 命令面板，外壳有跳转链接和移动端抽屉。tsx 里非注释的中文字面量从约 3,600 行降到约 250 行，大多是 t() 的兜底文案。

主要差距在“感知速度”和“容错”两类模式上，和 Linear、Vercel、ChatGPT、Claude.ai 比明显落后：

1. 加载态：列表和详情的默认加载态是居中转圈卡片。Skeleton 只在 3 个文件里用到；`isLoading: isFetching` 还有 30 处，翻页或搜索时整页闪一下。
2. 动效：浮层的 animate-in 系列类因为没装 tw-animate-css 全部失效，审计项 design-24 仍未关闭。
3. 路由：路由用 `lazy()` 配逐个 Suspense，没有意图预取和进度条；220KB 的 iconfont.js 仍在同步加载。
4. 错误隔离：只有根级 errorElement，任一页面崩溃，导航也会一起丢失。
5. 数据安全：没有任何未保存离开保护，105 个 mutation 里一处乐观更新都没有，没有撤销，键入名称的删除门槛有但没人用。
6. 列表状态：列表状态不进 URL，从详情返回会回到第 1 页、滚动到顶部；名称是按钮不是链接。
7. 标题与播报：没有逐页 document.title，切换路由也不播报。
8. 无障碍门禁：jsx-a11y 全部规则降为 warn，实测 157 条告警，列表也不能用键盘导航。
9. 登录注册：登录页只有一张卡片，后端已有的找回密码接口在前端已封装但没有界面；注册页完全不校验。

建议的方向是在现有模板和原语这一层补齐几份合同：骨架、反馈分级、离开保护、错误边界、动效令牌、路由元数据。不删装饰，反而在加载、等待、登录这些时刻加上 Tide 的 AI 视觉。

**已做好、应保留**：

- ConfirmDialog 是唯一的确认原语（src/components/ui/confirm-dialog.tsx:44-99）。它基于 Radix AlertDialog，默认聚焦“取消”，pending 时锁住 Esc 和按钮，菜单触发器卸载后能把焦点交回原处，还支持键入名称的门槛。原生 confirm 已清零，旧 AlertDialog 只剩 channels 一处，并已标记 deprecated。
- mutation 错误映射到固定的产品文案，刻意不读 APIError.message，避免泄露 prompt 或密钥，并按 toastId 去重（src/lib/mutation-error-feedback.ts:37-86、src/lib/query-client.ts:49-71）。
- 页面模板（Collection/Detail/Settings）通过 state 槽统一 loading/empty/error 三态（src/components/page-templates/template-state.tsx）。EmptyStart 首用态带 ghost 卡片网格和起步卡片，已在 9 个页面使用（src/components/patterns/empty-start.tsx），和筛选为空时用的 PageEmptyState 分工清楚，符合“丰富空态”的方向。
- 路由恢复页按 404/401/403/5xx 分型，有品牌 wordmark、role=alert，并主动移交焦点（src/components/routing/route-recovery-page.tsx:45-137）。
- 减少动效有全局方案：应用内偏好与系统设置合并后写入 data-motion（src/themes/appearance.ts:160、src/themes/appearance.css:98-106），原语上有 88 处 motion-reduce:。集合项的进出场与 stagger（src/components/patterns/resource-presence.css）、发送键 morph 成停止键、Home composer 的弹簧入场（motion 的 LazyMotion 按需加载）都已经落地。
- 焦点可见性已修好：Button 是 2px 带 offset 的 focus-visible 环（src/components/ui/button.tsx:8）。ResourceRow/ResourceCard 用拉伸的按钮覆盖整卡，键盘可以触达，行操作在 focus-visible 和 data-state=open 时也会显示，审计项 interaction-07 已大体解决。
- 外壳无障碍和移动端：有跳到主任务的链接和 main 地标（src/components/layout/app-shell.tsx:72-78）、移动端侧栏 Sheet。visualViewport 处理软键盘，AiWorkspace 用 ResizeObserver 在停靠和 Sheet 之间切换（src/components/layout/ai-workspace.tsx:71-97）。
- 命令面板基于 cmdk，可以搜索会话、知识库和应用，全局快捷键有 Cmd+K/N/B/, 和前进后退（src/lib/commands/keyboard.ts:17-60），并且在输入框里不会误触发。
- 主题首帧不闪：index.html 先同步执行 theme-init.js；Geist 字体通过 @fontsource-variable 自托管，Web 与离线桌面端表现一致。
- 工程门禁：bundle 体积预算（scripts/bundle-size-budget.json）、文件体积棘轮、design-guard 和 security 类 lint 都是 error 级，后续给 a11y 做棘轮可以照搬这套模式。
- 登录表单本身规范：RHF + zod，autoComplete 写对，显示密码按钮带 aria-pressed，会话过期有提示，登录后安全回跳（src/pages/auth/components/login-form.tsx）。
- src/components/layout/Sidebar.tsx:95-112：图标 rail 已经实现了 ↑↓/Home/End 的方向键导航，可以作为列表键盘导航的参考实现
- src/themes/use-appearance.ts:17 的 useResolvedAppearance() 已经能让 JS 拿到应用内的减少动效偏好，src/pages/knowledge/graph/components/force-graph.tsx:60-64 已用它把图谱动画时长降为 0
- src/components/patterns/resource-presence.css：集合项进出场动效（≤200ms、前 12 项交错），基础规则就是减少动效版本，并有 [data-motion='reduced'] 覆盖（:61）
- src/components/patterns/resource-card.tsx:36：卡片网格用 auto-fill minmax，本身就会随容器宽度重排
- use-document-request.ts:141、use-memory.ts:48/195、document-chunks/hooks/use-chunk-list-state.ts:89、use-model-gateway-request.ts:67/76 已经用 previousData 或 keepPreviousData 防止闪烁，可以作为统一 Query 合同的范本
- src/stores/collection-view.ts：集合视图偏好已经持久化，Studio 和 Agents 在用
- src/components/ui/confirm-dialog.tsx:20-40：ConfirmDialog 已支持 pending 锁定、请求失败时保留对话框和输入、菜单卸载后的 returnFocus
- src/components/ui/dialog.tsx:42/312、sheet.tsx:93 已带 motion-reduce:animate-none，引入 tw-animate-css 后立刻遵守减少动效；appearance.css:98-106 另有全局压缩规则
- React Router 7.18 的 RouterProvider 默认用 startTransition 提交导航，平级懒路由之间跳转时旧页面会保留，不会闪白
- scripts/browser/profile-route-loads.mjs 和 scripts/check-bundle-size.mjs 已经提供路由加载剖析和 bundle 预算门禁（路线图 ENG-4/ENG-11），性能改动可以拿来做前后对比
- src/components/routing/route-recovery-page.tsx:116-123：恢复页会聚焦到 main，并按错误类型设置 role=alert
- src/pages/knowledge/documents/table-file-column-config.tsx:64-66 和 settings/configuration/table.tsx:42-45：列数超过 200 时有手写的窗口化渲染

#### quality-01 浮层出入场动效类全部失效，动效缺少时长/缓动令牌

中 · 工作量 M · 不需要后端 · interaction

**现状**：8 个文件、17 行里约 50 个 shadcn 风格的 animate-in/zoom-in/slide-in 类没有生成 CSS，Dialog、Sheet、Popover、Tooltip 都是瞬间出现和消失。ActionMenu/Select 本身就没写出入场类。时长和缓动散落在约 74 处手写类和 3 种 cubic-bezier 里，没有令牌。

**证据**：

- src/components/ui/sheet.tsx:18 — data-[state=open]:animate-in、slide-in-from-right 等类
- src/components/ui/popover.tsx:30 — fade-in-0 / zoom-in-95 / slide-in-from-top-2
- src/components/ui/tooltip.tsx:18 — animate-in fade-in-0 zoom-in-95
- src/components/ui/dialog.tsx:42、:312 — 遮罩与内容的 animate-in fade-in-0 zoom-in-95
- src/index.css:1-15、src/themes/tailwind.css:1-6 — 只引入 tailwindcss、@tailwindcss/forms、typography、tailwind-scrollbar；package-lock.json 中没有 tw-animate-css/tailwindcss-animate，src 下的 CSS 也没有任何 animate-in 定义
- src/themes/tailwind.css:57-61 — 只有 fade-in/slide-up 等 5 个旧动画，没有 duration/easing 令牌；全仓手写 duration-150 有 32 处、200 有 24 处、300 有 12 处、500 有 3 处，cubic-bezier 有 3 种
- src/components/ui/action-menu.tsx:72 — 菜单没有任何出入场；motion 库只在 src/pages/home/components/composer-entrance.tsx 和 motion-features.ts 中使用

**方案**：按原提案 1-3、5 执行。第 4 条的 design-guard 规则改成棘轮方式（参照 scripts/file-size-baseline.json），先禁止新增裸写的 duration-数字和 cubic-bezier，存量约 74 处随原语改造逐步迁移，不一次性改全仓。

**对标**：Linear 和 Raycast 的菜单、命令面板从触发点做 scale+fade，约 120–150ms；Vercel（Geist）的侧滑面板有明显的滑入。shadcn/ui 的 Tailwind v4 版本正是用 tw-animate-css 提供这些同名类，本仓的类名就是照它写的。

**核验**：核心属实：package.json/package-lock.json 均无 tw-animate-css 或 tailwindcss-animate，src 下 CSS 也没有 animate-in/enter 关键帧定义（grep 0 处）。src/index.css:1-15 和 src/themes/tailwind.css:1-8 只引入了 tailwindcss、forms、typography、scrollbar。src/themes/tailwind.css:57-61 只有 5 个旧动画，没有时长和缓动令牌。动效类分布在 8 个文件、17 行（alert-dialog.tsx:118、dialog.tsx:42/312、popover.tsx:30、sheet.tsx:18-27/93、tooltip.tsx:18、file-uploader/file-card.tsx:112-141、file-list.tsx:40、agent/form/code/code-script-editor.tsx:196），按 token 数约 50 余个，不是 41 个，量级一致。action-menu.tsx:20-21 的 menuContentClass 完全没有出入场类。实测手写 duration-150/200/300/500 分别为 33/25/13/3 处，cubic-bezier 有 3 种，与描述吻合。git log 自 10-05 起没有修复提交。严重度下调为 medium：10-05 审计 design-24 定为 low；这是质感问题，不影响功能和数据。补充一点：dialog/sheet 已带 motion-reduce:animate-none，appearance.css:98-106 也有全局 [data-motion='reduced'] 压缩规则，所以装上 tw-animate-css 后减少动效会自动生效。提案符合约束。

#### quality-02 应用内“减少动效”偏好管不住 JS 驱动的动效

低 · 工作量 S · 不需要后端 · accessibility

**现状**：用户在“外观”里把动效设为“减少”、但系统没开时，Home composer 弹簧照样回弹，开场白照样逐字打出，跳转到某轮对话时照样平滑滚动。偏好在 CSS 层生效，在 JS 层不生效。

**证据**：

- src/themes/appearance.ts:160 — reducedMotion = 用户偏好 'reduced' // 系统 prefers-reduced-motion
- src/themes/appearance.css:98-106 — 全局规则只压缩 CSS animation/transition/scroll-behavior
- src/pages/home/components/composer-entrance.tsx:7、:59 — 用 motion 的 useReducedMotion()，它只读系统媒体查询；弹簧由 JS 写 transform，CSS 规则拦不住
- src/components/patterns/chat/typing-text.tsx:7-10 — 逐字打出只看 matchMedia
- src/components/chat/turn-rail.tsx:60-66 — scrollIntoView 时显式传 behavior:'smooth'，会覆盖 CSS 的 scroll-behavior:auto
- src/hooks/use-chat-scroll-follow.ts:55-57 — 同样直接读 matchMedia；全仓 MotionConfig 0 处

**方案**：1）直接复用 useResolvedAppearance().reducedMotion，不新建 hook；可以加一个只做薄封装的 selector。2）App 根部包一层 \<MotionConfig reducedMotion={reduced ? 'always' : 'user'}>，用 'user' 代替 'never'，保留 motion 自己对系统设置的检测。3）composer-entrance、typing-text、turn-rail、use-chat-scroll-follow 这 4 处改读同一个值。4）加一条 lint，禁止在组件里直接调用 matchMedia('(prefers-reduced-motion…')，并补单测。

**对标**：Discord 的无障碍设置提供“减少动效”，可跟随系统也可单独开启，开启后对全部动画生效；motion 官方提供 `MotionConfig reducedMotion` 做全局覆盖。

**核验**：现象属实。composer-entrance.tsx:7/59 用 motion 的 useReducedMotion()，只读系统媒体查询；typing-text.tsx:7-10、turn-rail.tsx:60-66（显式传 behavior:'smooth'，会覆盖 CSS 的 scroll-behavior）、use-chat-scroll-follow.ts:55-57 都直接读 matchMedia。全仓 MotionConfig 0 处。但提案的第 1 步不需要：src/themes/use-appearance.ts:17 已有 useResolvedAppearance()，它基于 useSyncExternalStore，会订阅偏好变化，并且已经包含 reducedMotion（appearance.ts:160）。src/pages/knowledge/graph/components/force-graph.tsx:60-64 已经用它来控制图谱动画时长，是现成的正确示范。CSS 层由 appearance.css:98-106 的 [data-motion='reduced'] 全局规则兜底，resource-presence.css:61 也有覆盖。真正漏掉的只有这 4 处 JS 动效，而且只发生在“系统没开、应用内开了”这一种组合下，所以严重度下调为 low。

#### quality-03 加载态是居中转圈卡片，骨架没有贴合版式；翻页和搜索时整页闪烁

中 · 工作量 M · 不需要后端 · missing-pattern

**现状**：首屏和翻页/搜索（queryKey 变化）时，集合页整块换成同一张 240px 的“加载中”卡片；同 key 的后台刷新因为有 length===0 守卫不会闪。列表、表格、详情都没有和版式对齐的骨架；加载区对读屏是静默的。

**证据**：

- src/components/page-templates/template-state.tsx:26-27 — 模板的 loading 默认就是 PageLoadingState
- src/components/patterns/page-states.tsx:50、:63-84 — min-h-[240px] 的居中 Loader2 加一个 h2“加载中”，没有 role=status，也没有 aria-live
- src/pages/knowledge/KnowledgeListPage.tsx:69-74、src/pages/agents/index.tsx:262-266、src/pages/studio/StudioPage.tsx:160-164 — 主要集合页的 loadingState 都是转圈卡片
- 全仓 `<PageLoadingState` 62 处，而 `<Skeleton` 只在 3 个文件出现（knowledge/logs 两处、model-gateway/key-usage）
- src/components/ui/resource-list.tsx:277-305 — ResourceListSkeletonRow 已经写好，调用 0 处
- src/components/patterns/data-table.tsx:53、:170 — 只有 emptyState，没有 loading 骨架行
- src/hooks/use-knowledge-request.ts:67-98 — 没有 placeholderData，且 `isLoading: isFetching`；配合 KnowledgeListPage.tsx:29-31，每次翻页或防抖搜索，整个列表都换成转圈
- 全仓 `isLoading: isFetching` 30 处，keepPreviousData 只有 3 处（审计 interaction-04、stack-12、interaction-05 仍开放）

**方案**：沿用原提案。补充：①ResourceListSkeletonRow 按 DreamJira 的 44/36px 行高和 6px 圆角重写，不直接复用 68px 的旧行；②统一把集合页主 hook 的 placeholderData 改成 keepPreviousData，并同时暴露 isPending 和 isFetching，复用 use-memory.ts 和 use-document-request.ts 已有的写法；③骨架保留彩色图标块位，不做成纯灰条，以符合“不做减法”的要求。

**对标**：Linear 的列表和 Vercel 的 Deployments 首屏用和真实行同尺寸的骨架；筛选或翻页时保留旧结果，只显示细进度。ChatGPT 侧栏会话加载时是灰条骨架，而不是转圈。

**核验**：大部分属实。template-state.tsx:26-27 默认渲染 PageLoadingState；page-states.tsx:50、63-84 是 min-h-[240px] 的居中 Loader2 加 h2，没有 role=status，也没有 aria-live。\<PageLoadingState 共 62 处，\<Skeleton 只在 3 个文件出现；ResourceListSkeletonRow（resource-list.tsx:277-305）没有调用方。`isLoading/loading: …isFetching` 实测 31 处。需要修正两点。①“后台刷新也整页转圈”不准确：KnowledgeListPage.tsx:29-31 和 agents/index.tsx:180 都加了 `&& length === 0` 守卫，同一 queryKey 的后台刷新会保留数据。真正会闪的是翻页和防抖搜索：use-knowledge-request.ts:67-98 没有 placeholderData，key 一变数据就变成 undefined。②保留旧数据的写法不止 3 处：use-document-request.ts:141、use-memory.ts:48/195、use-chunk-list-state.ts:89 也都用了 previousData 形式的 placeholderData，只是集合页的主 hook 没有统一。另外，ResourceListSkeletonRow 是旧几何（h-[68px]、rounded-xl、bg-sunken），和 DreamJira 的 44/36px 行不一致，应该重写而不是复用。severity 下调为 medium：失败被当成空态的问题已经修好（state 已区分 error），剩下的是感知速度问题。

#### quality-04 路由切换和首屏偏慢：整页转圈兜底、没有意图预取、iconfont 同步加载

中 · 工作量 M · 不需要后端 · performance

**现状**：懒路由用 React.lazy 加逐个 Suspense。从 Home 或嵌套布局进入懒页面时，会先闪出“加载中”卡片；平级懒页面之间跳转时，由于 React Router 7 的 transition，旧页面会停留到 chunk 就绪，期间没有任何进度提示。悬停不预取代码和数据；首屏要先执行 220KB 的同步 iconfont.js，HTML 里也没有外壳占位。

**证据**：

- src/lib/router.tsx:27-45 — 每个懒路由外面包一个新的 Suspense，fallback 是 PageLoadingState；全文件 48 处 withLoading(...)
- src/lib/router.tsx:584 — 用的是 createBrowserRouter，但没有用 route.lazy、loader、useNavigation
- 全仓 prefetchQuery、ensureQueryData、preload、viewTransition、startViewTransition 都是 0 处
- index.html:14 — 同步加载 public/iconfont.js（220,785 B），阻塞 module 入口（审计 design-17 仍开放）；#root 为空，JS 就绪前一片空白
- 全仓 `vite:preloadError` 0 处：发版后旧 chunk 404，会直接落到根 errorElement
- package-lock.json 中没有任何虚拟化库；src/components/chat/chat-transcript.tsx:35-36 把长会话一次全部渲染

**方案**：沿用原提案 1-7，并作为 ENG-11 的子项推进：改用 route.lazy 后用 useNavigation 驱动延迟 150ms 出现的 2px 进度条；prefetchRoute 映射表接入 scripts/browser/profile-route-loads.mjs 做前后对比；iconfont.js 先改 defer 或按 design-17 退役。

**对标**：Vercel 控制台用 Next.js Link 在悬停或进入视口时就预取，切页几乎不出现空白；Linear 是本地优先，切视图即时完成；ChatGPT 和 Claude.ai 首屏先画出外壳和侧栏骨架；GitHub 切页时顶部有细进度条。

**核验**：静态事实都属实：router.tsx:27-45 用 withLoading 给每个懒路由包一个 Suspense，共 48 处；router.tsx:589 用了 createBrowserRouter，但 route.lazy、loader、useNavigation、prefetchQuery、ensureQueryData、viewTransition、vite:preloadError 都是 0 处。index.html:14 在 body 末尾同步加载 iconfont.js（220,785 B），它会阻塞解析，进而推迟 module 入口执行；#root 是空的。没有虚拟化库，chat-transcript.tsx:35-36 一次渲染全部消息。需要修正“第一次进入任何懒加载页面，旧页面都会立刻被换成加载卡片”这个说法：React Router 7.18.5 的 RouterProvider 默认用 startTransition 提交导航（node_modules/react-router/dist/development/chunk-6KYCQHYJ.mjs:6848），\_renderMatches 渲染的 RenderedRoute 也没有 key。所以在 Layout 下两个平级懒路由之间跳转时，同位置的 Suspense 会被复用，React 会保留旧页面，直到 chunk 就绪。这时没有任何反馈，useNavigation 一直是 idle。只有从静态导入的 HomePage（router.tsx:322-324）进入，或者进入 memory/:id、knowledge/:id 这类嵌套布局时，才会闪出转圈卡片。所以问题其实是“要么闪一下转圈，要么无反馈地卡住”，提案依然成立，而且 route.lazy 是让进度条能拿到状态的前提。另外，仓库已有 scripts/browser/profile-route-loads.mjs 和路线图 ENG-11（真实路由 preload 预算），提案应该挂到 ENG-11 下推进。

#### quality-05 缺少错误隔离和诊断：页面一崩溃导航也没了，错误态没法自助排查

高 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：任一页面渲染出错，整个工作台（包括导航 rail）都会被换成全屏错误页，用户只能刷新或回首页。接口错误态没有错误 ID，没法反馈给管理员。权限不足、限流、离线都显示成同一种“加载失败”。公开分享链接坏了，访客看到的是开发说明。

**证据**：

- src/lib/router.tsx:577-582 — 只有一个根级 errorElement
- src/components/layout/Layout.tsx:23-33 — Outlet 外面没有任何错误边界
- src/components/routing/route-recovery-page.tsx:116-135 — 恢复页是 min-h-dvh 的全屏，rail 和二级面板都没了
- src/api/client-types.ts:41-53 — APIError 只有 status/code/details，没有 requestId；而后端 MultiRAG/api/middleware/request_context.py:15、:40 已经在响应里回写 X-Request-ID
- src/lib/mutation-error-feedback.ts:65-75 — 403 只有一句“无权限”，429 被归成笼统的“操作失败”
- src/pages/agent/share/index.tsx:343-362 — 公开分享页的错误态用的是 PageEmptyState，文案是给研发看的（“…通过 `auth` 参数传入 beta token，并由外部接口写入 `Authorization: Bearer <beta>`”）
- src/api/client.ts:321 — 只在请求失败时检查 navigator.onLine，没有离线提示条

**方案**：1）给 Layout 下的子路由组加 `errorElement`，在 MainSurface 里渲染 PageErrorState，根级只负责外壳自身的崩溃；切换路由时自动重置。
2）APIError 增加 `requestId`（读响应头 X-Request-ID）；PageErrorState 和错误 toast 加一个次级动作“复制错误 ID”。
3）错误态按类型区分：

- 离线：用 TanStack onlineManager，在顶部显示细条“已离线，恢复后自动重试”；
- 无权限：说明需要什么权限，提供“联系管理员/切换团队”；
- 限流：429 显示倒计时后重试；
- not-found 和 server 各自一套文案。
  4）share/widget 公开页的文案改成面向访客的“链接无效或已过期，请联系分享者”，技术细节收进可折叠的“详情”。

**对标**：Linear 和 Vercel 页面出错时保留侧栏和顶栏，只在内容区显示错误卡片，并能复制错误或请求 ID；ChatGPT 断网时顶部出现提示，恢复后自动重试。

**核验**：属实。router.tsx:578-582 只有根级 errorElement；Layout.tsx:21-44 的 Outlet 外没有错误边界（全仓 ErrorBoundary 只在 entrypoints/mount-application.tsx:35、CarouselWrapper、Lexical 中使用）。route-recovery-page.tsx:116-123 是 min-h-dvh 的全屏页，rail 和二级面板都不在。client-types.ts:41-53 的 APIError 没有 requestId。mutation-error-feedback.ts:65-75 把 429 归成 common.operationFailed。share/index.tsx:343-362 和 locales/zh-CN/agent.ts:274 的文案是写给研发看的（含 `Authorization: Bearer <beta>`）。client.ts:321 只在请求失败时检查 navigator.onLine，全仓没有 onlineManager。后端已确认：MultiRAG/api/middleware/request_context.py:15、:40 会回写 X-Request-ID，api/apps/\__init_\_.py:256-258 注册了该中间件。补充一个后端注意点：api/apps/\__init_\_.py:239-245 的 CORSMiddleware 没有设置 expose_headers。同源代理（vite.config.ts:196-200）下可以读到这个头，但如果桌面端或其他部署跨域访问 API，就需要后端加 expose_headers=['X-Request-ID'] 这一行小改动。对标中“保留侧栏、只在内容区报错”的说法合理；“可复制请求 ID”在 Vercel 上有类似做法，但不是所有产品都有，宜表述为常见做法。

#### quality-06 没有未保存离开保护（审计 interaction-08 仍开放）

高 · 工作量 M · 不需要后端 · missing-pattern

**现状**：知识库/记忆设置、Studio 应用编辑器、渠道表单、技能配置这些页面都知道自己“脏了”，但点 rail、按 Cmd+K 跳转、浏览器后退或关闭标签页时，改动会被直接丢掉，没有任何提示。

**证据**：

- 全仓 useBlocker、unstable_usePrompt、beforeunload 都是 0 处
- isDirty 已在 23 个文件里跟踪，例如 src/pages/memory/MemorySettingsPage.tsx:104、:145-172 已经显示“未保存”徽标和保存/放弃按钮
- src/pages/studio/create-app/hooks/use-create-app-page.ts:135-141 — 计算了 isDirty，但只用来禁用测试
- src/locales/en-US/environment.ts:12-15 — 只有环境管理器在组件内部切换时提示，离开路由不拦
- src/lib/commands/keyboard.ts:17-22、:53-60 — Cmd+N、Cmd+,、Cmd+[ 等全局快捷键随时能把页面切走

**方案**：1）新建 `src/hooks/use-unsaved-changes-guard.ts`：组合 React Router 的 `useBlocker(isDirty && 目标路径不同)`、`beforeunload` 和 ConfirmDialog，三个按钮“保存并离开 / 放弃更改 / 继续编辑”；embed 路由不注册 beforeunload。
2）SettingsTemplate 和 DetailTemplate 增加 `SaveBar` 槽：表单变脏时从底部浮起，显示变更数，Cmd+S 保存、Esc 放弃；复用 MemorySettingsPage 已有的徽标逻辑。
3）Sheet/Dialog 里的表单（channel-form-sheet、skill-config-dialog、core-config-dialog）在关闭和点遮罩前也走同一个 guard。
4）Studio 编辑器和 Agent 画布接入同一个 hook。

**对标**：GitHub 在有未提交评论时离开页面会触发浏览器确认；Shopify Polaris 的 Contextual Save Bar 在表单变脏时顶部出现“保存/放弃”；n8n 编辑器离开未保存的工作流时会弹窗询问是否保存。

**核验**：属实。全仓 useBlocker、unstable_usePrompt、beforeunload 都是 0 处（grep 只命中无关的 usePromptInput）。isDirty 在 23 个文件中出现；MemorySettingsPage.tsx:104、145-172 已有“未保存”徽标和保存/重置按钮。use-create-app-page.ts:135-141 的 isDirty 只用于禁用预览发送。environment.ts:12-15 的 discard 文案只用于组件内部切换。git log 自 10-05 起没有修复，interaction-08 仍开放。小修正：keyboard.ts:28-34 中只有 Cmd+K 在输入框内仍会触发，Cmd+N、Cmd+, 等在焦点位于输入框时不会生效，风险略低于描述，但点击 rail、浏览器后退、关闭标签页仍会直接丢改动。项目使用 createBrowserRouter（数据路由），useBlocker 可以直接用。提案中提到的 channel-form-sheet.tsx、skill-config-dialog.tsx、core-config-dialog.tsx 都存在。对标的 GitHub、Polaris Contextual Save Bar、n8n 均属实。

#### quality-07 操作反馈没有分级：没有乐观更新和撤销，成功 toast 太多，确认强度不按风险区分

中 · 工作量 M · 不需要后端 · interaction

**现状**：开关、重命名、删除会话都要等一次往返才有变化，每次成功都弹 toast。删错了没有任何撤销，删除整个知识库却只需点一下确认。复制反馈一半是 toast，一半是图标变化。toast 的颜色和当前配色方案不一致。

**证据**：

- 全仓 105 处 useMutation，onMutate 0 处，useOptimistic 0 处；9 处 setQueryData 全是成功之后回写
- src/pages/knowledge/documents/hooks/use-document-status-actions.ts:75-80 — 单个文档启停要等接口返回，然后每次弹一条成功 toast
- toast.success 142 处、toast.error 231 处、toast.promise 0 处；带 action 的 toast 只有 src/pages/settings/components/api-key-action-dialog.tsx:66 一处，没有任何“撤销”
- src/components/ui/confirm-dialog.tsx:30-31 — 已支持 confirmationText 键入门槛，但全仓 0 处使用；src/pages/knowledge/KnowledgeListPage.tsx:200-215 删除知识库只是普通确认
- src/pages/explore/ExplorePage.tsx:249-275 — 会话重命名失败只 console.error，界面无任何反馈；:325-340 删除要等往返完成再 refetch
- src/App.tsx:66-71 — Sonner 开了 `richColors`，颜色来自 Sonner 内置色板，不跟六套配色方案的语义令牌；样式里也没有 [data-sonner-toast] 覆盖
- src/lib/clipboard.ts:4-17 — 10 个文件的复制成功走 toast；另有 11 个文件各自手写 copied 状态（如 src/components/chat/CodeBlock.tsx）

**方案**：四级反馈规则不变。②级的撤销改为：在列表里立即乐观移除，toast 显示“已删除 · 撤销”，5 秒后提交；同时注册 pagehide/visibilitychange 和路由离开回调，未提交的删除在这些时机立即 flush；提交失败时回滚并 toast.error。③级在 ConfirmDialog 中启用 confirmationText 并显示影响摘要。Toaster 去掉 richColors，把 sonner 的 CSS 变量映射到语义令牌。新增 CopyButton 原语，替换约 17 处复制实现（9 处 toast + 8 处手写 copied）。

**对标**：Linear 几乎所有改动都是乐观生效，删除后给“撤销”toast，并支持 Cmd+Z；Gmail 的“撤销发送/删除”；Vercel 和 GitHub 删除项目或仓库要键入名称；ChatGPT 和 Claude.ai 的复制按钮原地变成对勾，不弹 toast。

**核验**：核心属实，数字略有出入。useMutation( 实测 101 处，不是 105；onMutate 0、useOptimistic 0、setQueryData 9、toast.success 142、toast.error 231、toast.promise 0。全仓没有“撤销”toast；唯一带 action 的 toast 是 api-key-action-dialog.tsx:63-70 的重试吊销。confirm-dialog.tsx:30-31 的 confirmationText 在调用方 0 处使用；KnowledgeListPage.tsx:200-219 删除知识库只是普通确认。ExplorePage.tsx:248-274 重命名失败只有 console.error，:327-341 删除要等往返完成。App.tsx:66-71 直接用 sonner 的 Toaster 并开了 richColors，CSS 中没有 [data-sonner-toast] 或 --normal-bg 覆盖。复制反馈：9 个文件走 copyToClipboardWithFeedback 弹 toast，8 个文件手写 setCopied，合计约 17 处，不是 21 处。后端确实没有 restore/trash 接口（MultiRAG/api 下 grep 只命中内部服务函数），撤销只能由前端延迟提交实现。需要修正提案：延迟 5 秒提交时，如果用户关标签页或离开路由，删除会悄悄丢失；必须在 pagehide 或路由离开时立即提交（或者改用 navigator.sendBeacon 不适用于鉴权请求时，在 visibilitychange 时 flush），否则用户以为删了，实际没删。

#### quality-08 列表状态不进 URL，返回时位置丢失；名称是按钮不是链接

中 · 工作量 M · 不需要后端 · information-architecture

**现状**：知识库、Agents、Studio、记忆列表的页码、搜索词、排序都存在组件 state 里，从详情返回后回到第 1 页、搜索清空、滚动到顶。视图偏好在 Studio/Agents 通过 collection-view 持久化 store 保留，但知识库列表没有接入。列表项名称是按钮，不能 Cmd/中键在新标签打开，也不能通过链接分享筛选结果。

**证据**：

- src/pages/knowledge/list/use-knowledge-list-page.ts:43-54 — 视图、分组、排序、页码、页大小、搜索词全是 useState
- 知识库、Agents、Studio、记忆、搜索这几个列表页都没用 useSearchParams（全仓 22 个文件用到，集中在日志和编辑器）
- src/components/layout/main-workbench.tsx:32 — 主面 overflow-hidden，滚动发生在各页面内部；全仓 ScrollRestoration 0 处
- src/components/patterns/resource-parts.tsx:100-111 — ResourceName 是 `<button onClick={onOpen}>`；src/pages/knowledge/list/knowledge-collection.tsx:120 等调用方传的是回调
- src/components/patterns/resource-card.tsx:105-109 — 卡片的拉伸点击区也是这个按钮

**方案**：1）新增 useCollectionParams(schema)，把 q/page/sort/group 写进 URL（replace 模式）；视图偏好统一走现有的 stores/collection-view.ts，知识库列表改用 useCollectionView，不再另建 persist。2）ResourceName/ResourceCard 支持 href，渲染成 \<Link>，保留拉伸伪元素；这也是 quality-04 意图预取的挂载点。3）MainSurface 内的滚动容器按 location.key 记录并恢复滚动位置。

**对标**：GitHub Issues 和 Vercel 部署列表的筛选、排序都写在 URL 里，可以分享；Linear 的视图可保存，从详情返回仍在原位置。这些产品的列表项都是真实链接，可以 Cmd 点击开新标签。

**核验**：核心属实。use-knowledge-list-page.ts:43-54 的视图、分组、排序、页码、页大小、搜索都是 useState；agents/index.tsx:55 和 use-dialog-apps.ts:32-33 同样。useSearchParams 共 24 个文件，集合页里只有 agents/log 和 studio/create-app 用到。main-workbench.tsx:32 的 section 是 overflow-hidden，ScrollRestoration 0 处。resource-parts.tsx:100-111 的 ResourceName 是 \<button>，resource-card.tsx:105-109 的拉伸点击区复用它。需要修正：视图偏好并非全丢。stores/collection-view.ts:11-19、49-85 已有持久化的 useCollectionView，Studio（StudioPage.tsx:73-77）和 Agents 在用；Studio 的状态筛选放在 zustand 的 useStudioStore 中（StudioPage.tsx:35、61-62），返回时会保留。只有 KnowledgeList 自己用 useState 保存 viewChoice（use-knowledge-list-page.ts:43、67-68），没有接入这个 store，是一处不一致。丢失的主要是页码、搜索词、排序和滚动位置。

#### quality-09 没有逐页标签标题，路由切换也不播报（审计 shell-12 仍开放）

中 · 工作量 S · 不需要后端 · accessibility

**现状**：开多个标签时每个都叫“沧溟 AI”，浏览器历史和书签无法区分页面。读屏用户切换路由时听不到任何提示，焦点也停在原来的导航项上（WCAG 2.4.2 要求页面有标题）。

**证据**：

- index.html:9 — `<title>沧溟 AI</title>` 写死中文，英文界面也一样
- 全仓应用页面设置 document.title 或渲染 \<title> 的地方是 0（只有 document-image-resources 的弹窗和 HTML 报告）
- src/components/layout/ 下没有 live region，也没有路由播报
- src/components/layout/workbench-header.tsx:4-26 — 页面标题已经交给卡片头（85668d97），但没有同步到标签页；src/locales/i18n.ts:62 已经同步 html lang（这点是好的）

**方案**：1）路由加 `handle: { titleKey, section }`，Layout 用 `useMatches()` 取最深一层的标题。
2）用 React 19 原生的 `<title>` 输出“{页面} · {品牌}”，品牌名走 i18n；会话页用会话名；Agent 运行中可以加前缀标记“进行中”。
3）同一个组件在 sr-only 的 aria-live=polite 区域播报新页面标题，并把焦点移到页面 h1；只是同页参数变化时不移焦点。

**对标**：ChatGPT 和 Claude.ai 的标签页显示当前会话标题；Linear 显示“ENG-123 标题”；Vercel 显示“项目 – Deployments”。

**核验**：属实。index.html:9 写死 \<title>沧溟 AI\</title>（同时 index.html:2 的 lang="en" 也写死，运行时由 i18n.ts:60-63 的 applyDocumentLocale 修正）。应用页面设置 document.title 或渲染 \<title> 的地方为 0，只有 document-image-resources.ts:165 的弹窗和 HTML 报告。src/components/layout 下没有路由播报的 live region；app-shell.tsx 只在跳转链接点击时聚焦内容区（:74），路由切换时不移动焦点。router.tsx 中没有 handle 元数据。React 19.3 原生支持在组件里渲染 \<title>，提案可行。

#### quality-10 无障碍门禁仍是 warn，列表和表格不能用键盘导航

中 · 工作量 M · 不需要后端 · accessibility

**现状**：a11y 问题只会以告警形式淹没在 722 条告警里，新代码不受约束，也没有自动化的 axe 检查。集合列表、数据表、会话列表只能用 Tab 一个个跳，不能上下移动，也不能用键盘多选。

**证据**：

- eslint.config.js:79-84、:148 — 所有 jsx-a11y 规则统一降为 warn；而 design-guard 和 security 规则是 error（:467-536）
- 本地运行 `npx eslint src` 实测 jsx-a11y 告警 157 条：label-has-for 72（已废弃的规则）、prefer-tag-over-role 33、click-events-have-key-events 16、no-static-element-interactions 15、media-has-caption 5、no-autofocus 5 等；最多的文件是 src/pages/settings/model-providers/components/local-model-fields.tsx（9）和 src/pages/settings/admin/components/create-user-dialog.tsx（7）
- package.json:177 有 playwright，但没有 @axe-core/playwright
- src/components/patterns/data-table.tsx、resource-row.tsx、conversation-list.tsx — grep 不到任何 ArrowUp/ArrowDown/onKeyDown 处理
- 仍只在 hover 时显示的控件：src/components/ui/file-uploader/file-card.tsx:150、src/pages/knowledge/metadata/components/metadata-field-row.tsx:134、metadata-value-tag.tsx:92

**方案**：1）关闭已废弃的 label-has-for。按目录做棘轮基线（照 scripts/file-size-baseline.json 的模式），把 click-events-have-key-events、no-static-element-interactions、label-has-associated-control、control-has-associated-label 升为 error。
2）Playwright 加 @axe-core/playwright 冒烟测试，覆盖 Home、知识库列表、设置、登录，明暗两套主题各跑一遍。
3）ResourceList、DataTable、ConversationList 改用 roving tabindex：↑↓/J/K 移动，Enter 打开，X/Space 选择，Shift 范围选，并和 BulkActionBar 联动。
4）命令注册表加 `?`，打开一个快捷键速查 Sheet，内容从 keyboard.ts 自动生成。
5）提供统一的 `reveal-on-hover` 工具类：hover、focus-within、粗指针（pointer-coarse）时都显示。

**对标**：Linear 的列表支持 J/K/↑↓ 移动、Enter 打开、X 选择，按 ? 打开快捷键表；Raycast 列表全键盘操作，Cmd+K 打开动作面板。

**核验**：属实，已本地复跑验证。eslint.config.js:79-84 把所有 jsx-a11y 规则映射为 warn，并在 :148 展开。复跑 `npx eslint src` 的结果与审计完全一致：共 722 条告警、0 错误，其中 jsx-a11y 157 条（label-has-for 72、prefer-tag-over-role 33、click-events-have-key-events 16、no-static-element-interactions 15、media-has-caption 5、no-autofocus 5 等）；告警最多的文件是 local-model-fields.tsx（9）和 create-user-dialog.tsx（7）。label-has-for 和 no-onchange 是已废弃规则，占了近一半，属于噪声。package.json 中没有 @axe-core/playwright；scripts/browser/ 下的 playwright 脚本只做路由性能和工作区验证。data-table.tsx、resource-row.tsx、conversation-list.tsx 中 grep 不到 onKeyDown 或方向键处理。file-card.tsx:150、metadata-field-row.tsx:134、metadata-value-tag.tsx:92 只在 group-hover 时显示，没有 focus-within。补充一个长处：Sidebar.tsx:95-112 的 rail 已经实现了 ↑↓/Home/End 的方向键导航，列表可以照这个模式做。

#### quality-11 登录注册页单薄：后端已有的找回密码没有界面，注册页不做校验

高 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：登录页只有一张表单卡片，和 Home 上的 Tide 视觉不连贯。忘记密码只能找管理员，尽管前后端链路都已经通了。注册页三步走，却允许空邮箱、两次密码不一致直接提交，还要用户填一组根本不会提交的信息。

**证据**：

- src/pages/auth/components/login-frame.tsx:28-43 — 只有 BrandMark 加一张卡片，背景是 bg-canvas，没有品牌视觉，也没有语言/主题切换
- src/pages/auth/components/login-form.tsx:90-178 — 没有“忘记密码”，没有 SSO 按钮
- src/api/auth.ts:134-200 — getLoginChannels、getOAuthURL、requestPasswordResetCaptcha、sendPasswordResetOtp、verifyPasswordResetOtp、resetPassword 都已实现，除 src/api/\__tests_\_/auth.test.ts 外没有任何调用方
- MultiRAG/api/apps/restful_apis/user_api.py:538-610 — 找回密码四步接口齐全；:123-147 有 /auth/login/channels；:327-334 OAuth 回调目前固定跳到 `/?error=oauth_identity_binding_required`（身份绑定还没做完）
- src/pages/auth/RegisterPage.tsx:40-41 — 显示密码的 setter 以 `_` 前缀未使用；:63-77 提交前不校验，也不比较两次密码；:24 的 'work' 步骤收集 company/role，但 :66-71 注释写明不会发送；所有输入框都没有 autoComplete

**方案**：1）AuthLayout 宽屏左右分栏：左侧品牌面用 TideMark、ai-halo、令牌色渐变和能力轮播，可以参考 bd6939e4 之前的 AuthCarousel 结构，但不要恢复 MB 级的 PNG 截图；窄屏退回单列，右上角放语言和主题切换。2）/forgot-password 四步流程调用现有 authAPI；后端返回 recovery unavailable 时（例如 SMTP 未配置），显示“找回密码暂不可用，请联系管理员”，不留在死胡同。3）SSO 区读 getLoginChannels，用 ProviderLogo 渲染，在后端完成身份绑定前用特性开关隐藏（needs-backend）；把 /?error= 回跳码映射成 AuthAlert。4）注册改成单页 RHF + zod，提交按钮改为 type=submit；加密码一致性校验和 autoComplete；删掉不会提交的工作信息步骤。5）Caps Lock 提示、提交时按钮保持宽度。

**对标**：Claude.ai 和 ChatGPT 的登录页：品牌视觉，“使用 Google/Microsoft 继续”加邮箱登录；Linear：邮箱魔法链接、Google、SAML；Vercel：Git 提供商按钮加邮箱。这些产品都有“忘记密码/无法登录”入口。

**核验**：属实，但需要补充背景和前置条件。login-frame.tsx:22-43 只有 BrandMark 加居中卡片，注释写明“No marketing panel”。这是 2026-11-16 提交 bd6939e4 有意删掉的：它移除了半屏渐变轮播（AuthCarousel 和 3 张 1.4MB 的截图）。而用户随后把 wave-2 的这类减法（包括登录轮播）评价为“简陋、丑”，所以恢复品牌面符合用户反馈；做法上应改用令牌和 SVG 光晕，不要再引入 MB 级截图。login-form.tsx 没有忘记密码和 SSO 入口。src/api/auth.ts 的 getLoginChannels、getOAuthURL、requestPasswordResetCaptcha、sendPasswordResetOtp、resetPassword 除 src/api/\__tests_\_/auth.test.ts 外没有调用方。RegisterPage.tsx:40-41 的显示密码 setter 以 \_ 前缀未使用；:63-77 提交前不校验，也不比较两次密码；提交按钮（约 :213）是 type="button" 加 onClick，所以 type=email 的原生校验永远不会触发；work 步骤收集的 company/role 不会发送。后端已核实：user_api.py:538-610 的找回密码四步接口齐全，:123-147 有 login/channels，:327-334 的 OAuth 回调固定跳到 oauth_identity_binding_required。需要补充：找回密码依赖 SMTP 配置（MultiRAG/api/utils/web_utils.py:37-50，未配置时抛错），各步骤失败时后端统一返回“recovery unavailable”，所以前端入口要能降级。backend 整体为 exists，SSO 部分为 needs-backend，与审计的标注一致。

#### quality-12 响应式按视口断点写，主面宽度变化时组件不跟着调整（容器查询只有 13 处）

低 · 工作量 M · 不需要后端 · tech-choice

**现状**：卡片网格已用 auto-fill 跟随容器宽度，但 StatGrid、DataTable 的列隐藏、FormItem 的水平布局（固定 w-1/4）和 FilterBar 仍按视口断点布局，在主面变窄（二级面板展开、Inspector 停靠）或 Sheet 里会显得拥挤。

**证据**：

- 全仓 @container 及 @sm:/@md: 等容器变体只有 13 处，分布在 5 个文件（ReferencePanel、ReferenceImageList、MCPServerForm、mcp-protocol-select、model-config）；视口断点 sm:/md:/lg:/xl: 有 346 处
- src/components/patterns/stat-grid.tsx:10-12 — md:grid-cols-2 lg:grid-cols-4
- src/components/patterns/data-table.tsx:62-63 — 列的隐藏按 md/lg 视口判断
- src/components/ui/form.tsx:117 — horizontal 标签固定 w-1/4；src/components/forms/KnowledgeFormFields.tsx:106、:110 等共 9 处 w-1/4 和 w-3/4（审计 knowledge-14 仍开放）
- src/components/layout/ai-workspace.tsx:71、:97 — 这里已经用 ResizeObserver 按容器宽度判断停靠还是 Sheet，说明主面宽度确实独立于视口

**方案**：1）给 MainSurface、Inspector 面板、Sheet 内容、SettingsTemplate 内容列标上命名容器，例如 `@container/main`。
2）StatGrid、DataTable 的列优先级、FilterBar、PageTitleBar、SettingRow、FormItem horizontal 改用 `@md:`/`@lg:` 变体。
3）水平表单在 `@[32rem]` 以下自动改为上下堆叠，标签宽度改成 minmax(8rem,30%)。
4）在 patterns/ 下加 lint 提示：新代码优先用容器变体。

**对标**：shadcn/ui 新版的 blocks（如 Card 头部、Sidebar 内的组件）用 Tailwind 4 的 `@container` 变体，按所在容器重排。据我了解 Vercel 控制台的卡片在侧栏收起和展开时也会按容器重排，这一点不能完全确定。

**核验**：大体属实。@container 和 @xx: 容器变体实测 16 处，分布在 5 个文件（ReferencePanel、ReferenceImageList、MCPServerForm、mcp-protocol-select、model-config），与描述基本一致。stat-grid.tsx:10-12、data-table.tsx:62-66、form.tsx:117 都按视口断点写；tsx 中 w-1/4、w-3/4 共 62 处（含 Sheet 的 w-3/4）。需要修正：最主要的集合视图卡片网格已经是固有响应式，会随容器宽度变化。resource-card.tsx:36 用 grid-cols-[repeat(auto-fill,minmax(min(17.5rem,100%),1fr))]，empty-start.tsx:64 也用 auto-fit，二级面板展开或 Inspector 停靠时卡片会自动重排。所以受影响的是 StatGrid、DataTable 的列隐藏、水平表单和 FilterBar，范围比描述小。shadcn 的 Card 头部确实用 @container/card-header，这条对标属实；Vercel 那条审计自己已经注明不确定。

### stack：技术选型与依赖

**维度结论**：依赖版本整体已处于前沿（React 19.3.1、Vite 8.3 + Rolldown、TS 7 原生编译器、Tailwind 4.3、Query 5.107、xyflow 13、Lexical 0.53、shiki 4、Electron 45），这一维度的问题不是“版本旧”，而是新版本的能力没被用起来，同时还留着几块 RAGFlow 时代的旧资产。主要差距有七点。(1) 首屏加载结构：入口静态闭包约 750KB gzip，KaTeX、jsencrypt、x-card 都在里面，第三方嵌入的 widget/share 页面也要先下载整个控制台外壳；而体积预算只统计入口文件。(2) React 19.3 已导出 ViewTransition、Activity、useOptimistic、useEffectEvent，React Compiler 也已经可以通过 plugin-react 6.3 开启，但仓内全部零采用，手写的 useMemo/useCallback 有 1,574 处。(3) React Router 7 只被当成路由表使用：没有 route.lazy/loader 并行加载，没有导航进度条、离开拦截和视图过渡。(4) 101 个 mutation 中乐观更新为 0。(5) 编辑器路线落后：Studio 系统提示词用 @uiw/react-md-editor，却退化成纯 textarea，还带进第二条 react-markdown 管线；聊天输入框是 textarea 加 @ 符号的拼凑方案，没有行内 mention chip。(6) 遗留资产：220KB 的 RAGFlow iconfont.js 仍在每个页面同步加载，其中两个算子图标是空白；PDF 预览依赖 react-pdf-highlighter 的 RC 版本，缺少缩放、搜索、缩略图；G6 单块 1.4MB；Monaco 没有声明为直接依赖，却把 14MB 的 /vs 目录拷进产物。(7) 缺少生成式 UI 宿主：HTML Artifact 只能在 sandbox="" 里静态显示，文本和代码类 Artifact 以原始文本展示，MCP 工具结果在后端被压平成文本，无法承载 MCP Apps。另外长会话既没有虚拟化，也没有 content-visibility。建议保留现有 SPA、x-markdown 和 shiki 主干，按“首屏拆分 → 编辑器与输入框 → React 19.3 能力 → 生成式 UI 宿主”的顺序推进。

**已做好、应保留**：

- 主干版本处于前沿：react 19.3.1、vite 8.3.8 + rolldown 1.3.2、@typescript/native 7.0.2、tailwindcss 4.3.5、@tanstack/react-query 5.107.1、zustand 5.1.0、@xyflow/react 13.0.1、lexical 0.53.0、motion 14.14.0、electron 45.3.3（package.json:66-180），不需要换框架，结论与 stack-assessment-2026-10-02 一致。
- 代码高亮实现领先：shiki 4 使用 JavaScript RegExp 引擎（不加载 WASM，forgiving 模式），只用一个 CSS 变量主题，映射到设计令牌，切换主题或配色方案时无需重新高亮（src/components/chat/shiki-engine.ts:14-25、src/components/chat/code-highlighter.ts:7-33）；语言包按需加载。
- Markdown 已收敛到 x-markdown 一条管线，并开启了 incremental、incompleteMarkdown:'complete'、按句淡入和 2px 尾部光标（src/components/chat/MarkdownCodeBlock.tsx:329-337），流式体验与 Streamdown 同档；markdown-it、react-markdown 和 recharts 已删除（2ef8ae77、5094b04c）。
- Mermaid 懒加载，使用 securityLevel strict，主题从 token 取值，并先校验、失败时回落为代码块（src/components/chat/MarkdownCodeBlock.tsx:86-190）。
- 重型预览器都是动态 import：docx-preview、pptx-preview、@js-preview/excel，以及只在沙箱报告里使用的 echarts（src/pages/agent/form/html-report/renderer/echarts-inline.ts:21）。
- 已经有 A2UI 生成式卡片：x-card 配合自定义 catalog（src/pages/agent/x-card/agent-x-card-renderer.tsx:50-60），这在开源 RAG 产品里属于前沿做法。
- eslint-plugin-react-hooks 7.1.1 recommended-latest 已清零（docs/engineering-modernization-roadmap.md:885），代码已具备开启 React Compiler 的条件。
- 厂商 logo 按单个图标从 @lobehub/icons-static-svg 导入（src/components/ui/provider-icon.tsx:10-36），只打包实际用到的图标，品牌识别度好。
- ID 统一用 uuid，crypto.randomUUID 零调用：在纯 HTTP 的内网部署下这是正确选择，旧审计 stack-17 指出的技能上传崩溃已修复。
- 体积预算、文件体积棘轮和手工 chunk 分组都已有门禁（scripts/bundle-size-budget.json、vite.config.ts:285-475）；sonner、cmdk 命令面板、react-resizable-panels 4 和共享 SSE 解析（eventsource-parser）都是当下主流选型。
- motion 使用 LazyMotion 并配合 useReducedMotion（src/pages/home/components/composer-entrance.tsx:7），按需加载的姿势正确。
- Agent 算子已有统一的分类色 tile：OperatorTile + OPERATOR_CATEGORY_TONE（src/pages/agent/operator-icon.tsx:110-140、operator-icon.constants.ts:184-194），画布、菜单、面板和运行日志共用同一套身份色，审计把它当成待建项。
- 代码高亮与 Monaco 已共用 token 源：Shiki 使用 CSS 变量主题，切换配色无需重新高亮；Monaco 主题经 getTokenValue 读取 code-\*/syntax-\* 角色（46804c26，src/components/jsonjoy-builder/hooks/use-monaco-theme.ts:89-103）。
- 聊天草稿按会话保存在内存 store，切换导航分区不丢失，且按用户/租户隔离、不落盘（src/hooks/use-chat-drafts.ts、src/pages/home/hooks/use-home-drafts.ts）。
- 点赞/点踩与发送时的用户气泡已是即时本地更新（MessageActionsFooter.tsx:59-71、useHomeChat.ts:413），不需要等服务器返回。
- AI Elements 风格的部件已相当完整：context-manifest-summary、reasoning-disclosure、source-strip/citation-chip、run-timeline、retrieval-progress、artifact-card、turn-rail 均为自研并接入设计令牌。
- 沙箱安全规则由 lint 强制（security/no-unsafe-iframe-sandbox 等，docs/agent-guidance/runtime.md:87-89），为生成式 UI 宿主提供了现成的安全护栏。
- 已有体积预算门禁与精细的 Rolldown 分组（含 G6 CJS 循环、pdf-highlighter 等坑的注释），TanStack Query devtools 改为按需加载（9cb6d390），DOCX 预览已有缩放控件，可作为 PDF 查看器交互的参照。

#### stack-01 首屏静态闭包约 750KB gzip：KaTeX、jsencrypt 和 x-card 随登录页、首页、widget 一起加载，预算却只统计入口文件

高 · 工作量 M · 不需要后端 · performance

**现状**：任何路由的首次访问（包括登录页和嵌入第三方站点的 chat widget）都要下载 Layout、首页、整条消息渲染链、KaTeX、x-card 和 RSA 加密库，约 750KB gzip 的 JS。预算门禁只看入口文件（约 79-117KB），因此这部分成本是看不见的。

**证据**：

- src/lib/router.tsx:21-22 — LoginPage 和 HomePage 是静态导入（critical path）
- src/pages/home/components/ChatSection.tsx:6-15 — 首页静态导入 chat-transcript、message-parts 等整条消息渲染链
- src/components/chat/MarkdownCodeBlock.tsx:5,357-366 — markdownConfig 静态挂载 createChatLatexExtensions
- src/components/chat/latex-extension.ts:1 — 导入 @ant-design/x-markdown/plugins/Latex；该插件第 1-2 行静态 import 'katex' 和 katex.min.css（node_modules/@ant-design/x-markdown/plugins/Latex/index.js:1-2）
- vite.config.ts:311-321 — x-markdown、x-card 及整个 @ant-design/\* 合并成一个 vendor-x-render chunk
- dist/.vite/manifest.json（2026-11-18 构建，其后又有约 20 个提交）— index.html 静态闭包共 73 个 chunk，JS 原始 2,345,983 B，gzip 约 748,874 B，CSS gzip 约 62,295 B（manifest 遍历实测）
- dist/js/chunks/vendor-x-render-CmizA6WK.js 408,703 B — sourcemap 显示 katex 源码约 600KB，占比最大；document-images-CDpsXlzG.js（gzip 93KB）里混入了 jsencrypt（约 195KB 源码）、query-core、i18next
- src/lib/router.tsx:301-310 — share 和 widget 路由本身是 lazy，但必须先加载上面整个入口闭包
- scripts/bundle-size-budget.json:3 与 scripts/check-bundle-size.mjs:8 — entryGzipBytes 只统计 dist/js/index-\*.js 一个文件

**方案**：1) KaTeX 按需加载：把 latex-extension 改成只产出占位 token，由 MathFormula 组件在首次遇到公式时执行 import('katex') 及其 CSS，流式过程中先显示等宽原文；也可以只在消息含有 \$、\\( 或 \\[ 时才挂载 Latex 扩展。2) 在 vite.config.ts 中把 x-card 从 vendor-x-render 拆出，只让 Agent 运行时引用。3) encryptPassword 改为在登录提交时 await import('jsencrypt')。4) 首页改为“外壳静态、消息区 lazy”：composer 和问候语立即可用，ChatTranscript 和 Markdown 链路懒加载；LoginPage 改为 lazy。5) 评估为 widget/share 增加独立的 Vite input（widget.html），只挂载嵌入所需的 Provider。6) check-bundle-size.mjs 改为遍历 manifest，按路由统计首屏闭包（login、home、chat-widget 三个预算），并写入 ENG-4 账本。

**对标**：Next.js App Router 和 React Router framework 模式默认按路由拆分，并且代码与数据并行预加载；Claude.ai、ChatGPT 的登录页和嵌入页从可见行为看都是与主应用壳分离的轻量页面（内部打包方式无法确认）。Streamdown 和 LobeHub 都把数学公式、图表当作可选插件，只在内容需要时才渲染。

**核验**：核实成立。src/lib/router.tsx:21-22 静态导入 LoginPage/HomePage，:9 静态导入 Layout；ChatSection.tsx:3-20 静态导入整条消息链；MarkdownCodeBlock.tsx:362-365 静态挂 createChatLatexExtensions；node_modules/@ant-design/x-markdown/plugins/Latex/index.js:1-2 静态 import katex 及其 CSS。用 dist/.vite/manifest.json（2026-11-18 12:44 构建）复算 index.html 静态闭包：73 个 chunk、JS 原始 2,345,983 B、gzip 748,874 B、CSS gzip 62,295 B，与审计数字完全一致。sourcemap 聚合：vendor-x-render 中 katex 源码 599,721 B（最大），x-card 仅 35,163 B；document-images chunk 中 jsencrypt 195,716 B（src/utils/crypt.ts:8 静态导入）。scripts/check-bundle-size.mjs:8 与 bundle-size-budget.json 只统计 dist/js/index-\*.js。其后约 20 个提交都是主题/配色改动，未触及分包与 latex 链路（git log 核实）。补充：拆出 x-card 只省约 10KB gzip，收益主要来自 KaTeX 按需加载与 jsencrypt 动态导入；widget/share 独立入口收益最大但需注意它们复用 RouteLocaleBoundary 和 auth store。

#### stack-02 编辑器路线落后：系统提示词用 md-editor 退化成 textarea，聊天输入框是 textarea 加 @ 符号拼凑，没有行内 mention chip 和 / 命令

中 · 工作量 L · 后端已有接口 · tech-choice

**现状**：仓内有三套编辑技术：md-editor（只当 textarea 用）、Lexical（只给 Agent 用）、Monaco。用户最常用的两个输入面（聊天输入框、Studio 系统提示词）都是纯文本：变量是 {knowledge} 这样的裸字符串，@ 引用的应用或 MCP 显示在输入框外，没有 / 命令，也没有行内缺失变量提示。

**证据**：

- src/pages/studio/create-app/components/prompt-pane.tsx:3,25-29 — lazy 加载 @uiw/react-md-editor/nohighlight，另引入两份 vendor CSS
- src/pages/studio/create-app/components/prompt-pane.tsx:244-254 — hideToolbar、commands={[]}、preview="edit"，实际只剩一个 textarea；变量通过字符串拼接插入（同文件 :63-79）
- src/pages/studio/create-app/components/editor.css:1-12 — 需要专门桥接 GitHub Primer 的 --color-\* 变量才能跟随配色方案
- npm ls — @uiw/react-md-editor@4.2.3 带入 react-markdown@10.1.0 和 rehype-prism-plus → refractor@4.9.0，也就是 5094b04c 删掉的第二条 Markdown 管线又回来了；对应 chunk dist/js/chunks/vendor-markdown\~index.nohighlight-BVhZm6Ai.js 279,622 B
- src/components/prompt-editor/index.tsx:1-33 — Lexical 0.53 的 PromptEditor 已有 VariableNode 和变量选择插件，但只服务 Agent 表单（10 处调用均在 src/pages/agent/form/\*\*）
- src/components/patterns/chat/prompt-input.tsx:191 — 聊天输入框是原生 textarea
- src/pages/home/hooks/useAtTrigger.ts:15-57 — 检测到 @ 后打开面板并删掉 @，引用对象以 chip 形式显示在输入框外（src/pages/home/components/SelectedTags.tsx:36-72），不在文本流中
- 旧审计 stack-05（编辑器三套半）仍未解决

**方案**：(a) Studio 系统提示词优先：从 components/prompt-editor 抽出通用 Lexical 内核（VariableNode、Typeahead 插件、纯文本序列化），系统提示词改用它，变量显示为带颜色 token chip、未定义变量行内标红，预览继续用 StreamingXMarkdown；完成后删除 @uiw/react-md-editor、editor.css 与 vite vendor-markdown 分组。(b) PromptInput 迁移到同一内核的单段落模式：@ 只列出现有接口支持的对象（应用、MCP 服务），/ 提供新建对话、切换模型、上传附件；chip 继续使用 EntityAvatar/ProviderLogo 和实体色，保留现有 SelectedTags 作为输入框外的汇总视图（不删减），保留粘贴文件、Enter 发送、IME 组合输入与自适应高度。@ 知识库、@ 技能标记为 needs-backend（MultiRAG ChatRequest 需新增 kb_ids/skill 字段），或仅在选中应用时以继承方式展示。

**对标**：Dify 的 Prompt Editor 基于 Lexical，变量和上下文都是行内块；LobeHub 的 @lobehub/editor 基于 Lexical，支持 @ 提及和斜杠菜单；Cursor 和 GitHub Copilot Chat 的输入框支持行内 @文件、#文件引用 chip；ChatGPT 支持在输入框里 @ 调用 GPT。这些产品都把 AI 的上下文对象做成可见、可删除的行内 token。

**核验**：核心成立：prompt-pane.tsx:29 lazy 加载 md-editor/nohighlight，:244-254 hideToolbar、commands=[]、preview="edit"，变量用字符串拼接插入（:63-79）；editor.css:1-12 桥接 Primer --color-\*；npm ls 确认 md-editor 带入 react-markdown@10.1.0、rehype-prism-plus→refractor@4.9.0，对应 chunk 279,622 B（但仅 Studio 懒加载，非首屏）。Lexical PromptEditor 的 JSX 调用为 17 处（不是 10 处），全部在 src/pages/agent/form/\*\*。PromptInput 为原生 textarea（prompt-input.tsx:191），useAtTrigger.ts:15-57 检测 @ 后打开面板并删除 @，chip 在输入框外（SelectedTags.tsx:36-72）；全仓无 / 命令。需修正两点：(1) 后端：首页请求 ChatRequest 只有 mcp_ids 与所选应用（web useHomeChat.ts:428-440；MultiRAG api/apps/llm_app.py:730-747 无 kb_ids/skill 字段），提案中“@ 知识库、技能”不在现有接口内，需后端支持或改为经由应用继承；应用、MCP、模型切换才是 exists。(2) 基准夸大：Claude.ai、ChatGPT 的工具/连接器/附件同样以输入框外的 pill 展示，现有 SelectedTags 带 EntityAvatar 已是主流做法之一；行内 chip 主要见于 Cursor、Copilot Chat、Dify/LobeHub 编辑器。故降为 medium：Studio 侧 md-editor 退化+第二条 Markdown 管线是确定的技术债，聊天输入行内 mention 与 / 命令是增强项。

#### stack-03 React 19.3 新能力零采用，React Compiler 仍未试点（手写 useMemo/useCallback 共 1,574 处）

中 · 工作量 M · 不需要后端 · tech-choice

**现状**：React 19.3 与 plugin-react 6.3 已具备 Compiler、ViewTransition、Activity、useOptimistic 能力，但代码仍以手写记忆化为主（useMemo/useCallback 约 1,500 处，含 import）；页面与面板切换无过渡；切换导航分区后聊天草稿已由 use-chat-drafts 保留，但滚动位置、Studio 未保存表单、Agent 画布视口会丢失。

**证据**：

- node_modules/react（19.3.1）已导出 Activity、ViewTransition、addTransitionType、useOptimistic、useActionState、useEffectEvent（运行时检查）
- grep src（不含 \__tests_\_）：useOptimistic 0、useActionState 0、\<Activity 0（7 处命中都是 lucide 的 Activity 图标）、ViewTransition/startViewTransition 0、useEffectEvent 0
- grep src：useMemo 682、useCallback 892、memo( 104
- node_modules/@vitejs/plugin-react/README.md:80-113 — 已安装的 6.3.0 支持 react({ compiler: true })（oxc-transform-react，标注实验性）或 Babel reactCompilerPreset
- docs/engineering-modernization-roadmap.md:780 — 全局 Compiler 另行规划；docs/agent-guidance/stack-assessment-2026-10-02.md 第 6 项“消息列表局部试点”至今未开始
- src/components/chat/streaming-x-markdown.tsx:17-40 — 典型的 latestContentRef 加 effect 写法，适合换成 useEffectEvent
- src/pages/home/components/composer-entrance.tsx:7 — motion 只用在这一个组件

**方案**：1) Compiler 以 compilationMode: 'annotation' 在 src/components/chat/\*\* 与 patterns/chat/\*\* 试点，用 Profiler 对比流式期间提交次数与 INP，有收益再扩大并按棘轮删除手写 memo（与 stack-assessment 第 6 项一致）。2) \<ViewTransition> 用于主题/配色切换交叉淡化、ResourceCard→详情的 EntityAvatar 共享元素、Artifact 面板展开，尊重 prefers-reduced-motion。3) \<Activity> 用于保活 Studio 编辑器与 Agent 画布（保留视口和未保存表单），聊天草稿继续用现有 use-chat-drafts。4) useEffectEvent 只用于真正需要“读最新值但不重订阅”的 effect（如事件监听、定时器），不针对 streaming-x-markdown。5) motion 扩展到消息操作栏和 Tide 身份标识状态动画，继续 LazyMotion。

**对标**：React Compiler 1.0 于 2025-10 正式发布，Meta 已在生产环境使用；React 的 \<ViewTransition> 基于浏览器原生 View Transitions（Chrome/Edge 111+、Safari 18+，Firefox 新版本陆续支持，不支持的浏览器直接无动画）；Linear、Vercel Dashboard 的列表到详情、面板展开都有连续的过渡。

**核验**：核心成立：运行时确认 react 19.3.1 导出 Activity、ViewTransition、addTransitionType、useOptimistic、useActionState、useEffectEvent；src 非测试代码中 useOptimistic/useActionState/ViewTransition/startViewTransition/useEffectEvent 均为 0，\<Activity 7 处全是 lucide 图标或 ActivityRail；全仓无 view-transition CSS。plugin-react 6.3.0 README:80-113 确认 compiler 选项（oxc，实验性）。roadmap.md:780 写明“Compiler 全局启用另行规划”，stack-assessment-2026-10-02.md:68 第 6 项局部试点未落地。需修正：(1) useMemo 682/useCallback 892 是 grep -o 计数，含 import 行，应写“约”。(2) streaming-x-markdown.tsx:17-40 的 latestContentRef 是 rAF 合并写法，effect 每次 content 变化都会重跑，换成 useEffectEvent 收益很小，不是好例子。(3) “切换导航分区后草稿丢失”不准确：首页与 Agent Explore 草稿已按会话保存在内存 store（src/hooks/use-chat-drafts.ts，use-home-drafts.ts:7-13，d332b9e9），Activity 的实际收益是滚动位置、Studio 未保存表单和 Agent 画布视口。(4) motion 用在 composer-entrance.tsx 与 motion-features.ts（LazyMotion 特性包）。

#### stack-04 React Router 7 数据路由只当路由表用：没有 route.lazy/loader 并行预取、导航进度、离开拦截和视图过渡

中 · 工作量 M · 不需要后端 · tech-choice

**现状**：进入页面为两段瀑布（先下 chunk、挂载后才发 Query），导航无全局进度反馈；内部滚动容器的列表位置在返回时丢失；Studio 有未保存状态时可直接离开，Agent 画布 20 秒防抖 autosave 在卸载时被清除，离开前 20 秒内的编辑会静默丢失。

**证据**：

- src/lib/router.tsx:2-8,586 — 使用 createBrowserRouter，但所有路由都写成 element: withLoading(Lazy)（:38-44），没有 lazy、loader、HydrateFallback
- grep src：useNavigation( 0、ScrollRestoration 0、useBlocker 0、viewTransition 0、beforeunload 0
- grep src：prefetchQuery/ensureQueryData 0、useSuspenseQuery 0
- src/pages/studio/create-app/hooks/use-create-app-save.ts:44 — Studio 有 'unsaved' 保存状态，但离开页面时没有拦截
- package-lock.json:16912-16913 — react-router 7.18.5

**方案**：保留 React Router。1) 列表/详情路由改为 route.lazy 返回 { Component, loader }，loader 调 queryClient.ensureQueryData(queryOptions)，与 queryOptions 工厂一起落地。2) MainSurface 顶部 2px 品牌色进度条，由 useNavigation().state 与 useIsFetching 驱动。3) 导航栏与次级面板条目 hover/focus 时预热 chunk 并 prefetchQuery。4) useBlocker + ConfirmDialog 封装 useUnsavedChangesGuard，接入 Studio、设置表单；Agent 画布在离开/pagehide 时先 flush 待保存的 autosave，失败再拦截。5) 自建 useScrollContainerRestoration（按 location.key 记录 MainSurface 内部滚动容器的 scrollTop），而非直接使用 window 级 \<ScrollRestoration>；Link/navigate 开启 viewTransition（与 stack-03 联动）。

**对标**：React Router 7 数据模式支持 route.lazy 返回 { Component, loader }，代码与数据并行加载；GitHub、Vercel Dashboard 导航时顶部有细进度条；Linear 依靠预取和本地缓存几乎做到瞬时切换；Notion 和 Figma 在有未保存内容时会拦截离开。

**核验**：核心成立：router.tsx:38-44 withLoading(Lazy)，:586 createBrowserRouter，src 非测试代码中 useNavigation/ScrollRestoration/useBlocker/viewTransition/beforeunload/prefetchQuery/ensureQueryData/useSuspenseQuery/route.lazy/HydrateFallback 均为 0；package-lock.json:16912-16913 react-router 7.18.5；无任何全局导航进度条。补充更严重的证据：Agent 画布 autosave 为 20 秒防抖（src/pages/agent/hooks/use-watch-agent-change.ts:37-60），卸载时 cleanup 直接 clearTimeout，离开画布前 20 秒内的编辑会静默丢失；Studio saveStatus 初始为 'unsaved'（use-create-app-save.ts:44）且无离开拦截。需修正：(1) 应用外壳是 h-dvh overflow-hidden（app-shell.tsx:69、main-surface.tsx:12），滚动发生在内部容器，React Router 的 \<ScrollRestoration> 只恢复 window 滚动，直接加上无效，需要按路由 key 记录内部滚动容器 scrollTop。(2) 基准：Notion/Figma 主要靠自动保存，只在存在未同步修改时提示，应改为“Google Docs/Figma 在有未同步修改时提示离开”。

#### stack-05 乐观更新为零：101 个 mutation、108 处 invalidate；重命名和删除都要等服务器返回，删除也不能撤销（旧审计 stack-12/18 仍未解决）

中 · 工作量 M · 后端已有接口 · interaction

**现状**：重命名、删除、置顶、启用或停用之类的操作要等一次往返才更新界面；页面层仍有命令式 await API 再 refetch 的写法；后台刷新会让列表闪成骨架屏；删除没有撤销。

**证据**：

- grep src（不含测试）：useMutation( 101、onMutate 0、useOptimistic 0、mutation.variables 乐观渲染 0、invalidateQueries 108、queryOptions( 0
- src/pages/explore/ExplorePage.tsx:249-262 — 重命名会话：await renameConversation → refetchConversations()，再手动 patch 本地 state
- src/pages/explore/ExplorePage.tsx:328-339 — 删除会话：await removeConversations → refetch → toast，没有撤销
- src/hooks/use-knowledge-request.ts:98 — isLoading: isFetching；仓内同类映射仍有 16 处，后台刷新会被当成首次加载

**方案**：1) 为会话、知识库、MCP 服务、模型启停、技能建 queryOptions/mutationOptions 工厂；rename、pin、toggle 用 onMutate 快照 + setQueryData + onError 回滚 + onSettled 失效。2) 删除改为先隐藏、sonner toast 带撤销（约 5 秒）后再调用 DELETE（客户端延迟提交，pagehide 时立即提交）。3) 点赞/点踩现有本地即时切换，补上失败回滚与 toast；发送失败的用户气泡就地显示重试。4) 15 处 isLoading: isFetching 改为 isPending，加 placeholderData: keepPreviousData，后台刷新只在标题旁显示小 spinner。5) lint 禁止 pages 层直接 await xxxAPI，按棘轮清退。

**对标**：Linear 的所有编辑都会立即生效并在后台同步；Gmail 和 Linear 删除后在 toast 里提供“撤销”；TanStack Query v5 官方推荐用 mutation.variables 或 onMutate 加回滚实现乐观 UI，用 placeholderData: keepPreviousData 避免分页闪烁。

**核验**：核心成立：src 非测试代码 useMutation( 101、onMutate 0、useOptimistic 0、invalidateQueries 108、queryOptions(/mutationOptions( 0；9 处 setQueryData 全部在 onSuccess 中（如 use-model-gateway-request.ts:120、use-dialog-apps.ts:139），不是乐观更新；无任何带“撤销”的 toast。ExplorePage.tsx:249-262 重命名、:328-339 删除确为 await API → refetch。需修正：(1) isLoading: isFetching 全仓共 15 处（含 use-knowledge-request.ts:98），不是另有 16 处。(2) 提案第 3 点基本已做到：首页发送时用户气泡先于请求追加到本地消息（useHomeChat.ts:413），点赞/点踩用本地 useState 立即切换（MessageActionsFooter.tsx:59-71），只是失败时没有回滚或重试提示。

#### stack-06 RAGFlow 时代的 iconfont.js（220KB、118 个 symbol）仍在每页同步加载，A2UI 和 Note 算子图标渲染为空白

中 · 工作量 M · 不需要后端 · tech-choice

**现状**：每次首屏都要同步下载并执行 220KB 的脚本，往 DOM 注入一个 SVG sprite；厂商 logo 混用三套来源，风格不统一；Agent 画布上 A2UI 和 Note 节点的图标是空的。

**证据**：

- index.html:13-14 — \<script src="/iconfont.js"> 是经典同步脚本，位于 module 入口之前，share 和 widget 页面也会加载
- public/iconfont.js — 220,785 B，共 118 个 id="icon-\*" symbol
- src/components/ui/icon-font.tsx:14-18 — \<use xlinkHref="#icon-\*"> 依赖全局注入的 sprite
- src/pages/agent/operator-icon.tsx:41-60 — 算子图标优先走 iconfont，Lucide 只作兜底
- src/pages/agent/operator-icon.constants.ts:32-50 — A2UI 映射 'card'、Note 映射 'notebook-pen'，但 iconfont.js 中这两个 symbol 不存在（grep 计数为 0）。\<use> 引用缺失 symbol 不会抛错，IconErrorBoundary 不会触发兜底，结果是空白
- src/components/ui/provider-icon.tsx:250-293 — 厂商 logo 有三种来源：本地 SVG glob、iconfont sprite、lobehub 静态 SVG
- src/stores/model.ts:344 — IconMap 注释写明“与 ragflow iconfont.js 中的图标名称匹配”
- desktop/build/staging-policy.mjs:4 — 桌面打包强制要求 iconfont.js
- 旧审计 stack-16 / design-17 仍未解决

**方案**：1) 厂商 logo：IconMap 中仍依赖 sprite 的厂商逐个映射到 @lobehub/icons-static-svg 单图标 URL 或 src/assets/svg/llm，统一经 resolveProviderLogo/ProviderLogo 输出，保留彩色 logo。2) 算子：OperatorGlyph 改为只用 LucideIconMap（立即修复 A2UI、Note 空白），继续放在现有 OperatorTile + OPERATOR_CATEGORY_TONE 中，不需要新建分类色体系。3) 删除 index.html 的 script、public/iconfont.js、icon-font.tsx，同步修改 staging-policy.mjs 与桌面打包测试。

**对标**：LobeHub 全站统一使用 @lobehub/icons 的厂商标识；Dify 和 n8n 的工作流节点用带颜色底块的图标 tile 区分节点类型，识别度高，也不依赖全局 sprite。

**核验**：核心成立：index.html:13-14 在 module 入口前同步加载 /iconfont.js（注释“来自 ragflow”）；public/iconfont.js 220,785 B、118 个 id="icon-\*"；operator-icon.constants.ts:36,44 A2UI→'card'、Note→'notebook-pen'，iconfont.js 中两者计数为 0；operator-icon.tsx:41-60 iconfont 优先，\<use> 引用缺失 symbol 不抛错，IconErrorBoundary 不会回退到 Lucide，结果空白。provider-icon.tsx:250-293 三种来源、stores/model.ts:344 注释、desktop/build/staging-policy.mjs:4 均核实。需修正：提案第 2 点“放进带颜色的算子 tile、按分类分配色 token”已经实现——operator-icon.tsx:110-140 的 OperatorTile 使用 operator-icon.constants.ts:184-194 的 OPERATOR_CATEGORY_TONE（avatar-1..8 色），已在 6 个文件中用于画布、菜单、面板和运行日志。剩下的只是让 OperatorGlyph 放弃 iconfont 优先。

#### stack-07 长会话没有任何虚拟化或 content-visibility，每条历史消息都会挂载 XMarkdown、Shiki 和 Mermaid

中 · 工作量 M · 不需要后端 · performance

**现状**：会话越长，首次打开历史和流式期间的布局与绘制成本越高：几十轮含代码和图表的对话会把所有 DOM 和高亮结果常驻内存，流式期间每帧的样式计算也要覆盖整棵树。

**证据**：

- src/components/chat/chat-transcript.tsx:31-60 — items.map 全量渲染每个回合
- grep src：react-virtuoso、@tanstack/react-virtual、react-window、virtua、content-visibility 均为 0（仅有两处知识库列配置的手写窗口化：src/pages/knowledge/settings/configuration/table.tsx:42-45）
- src/components/chat/MarkdownCodeBlock.tsx:201-232 — 历史消息里每个代码块都创建 Shiki 高亮，每个 mermaid 代码块都会校验并渲染
- docs/agent-guidance/frontend.md:114 — 首页、Explore、Studio、Agent 运行和分享对话共用 ChatTranscript，所以问题对所有聊天面都有影响

**方案**：第一阶段（S）：在 app-chat-message.css 中给 .chat-transcript > li:not(:nth-last-child(-n+2)) 加 content-visibility: auto 和 contain-intrinsic-size: auto 480px，保证正在流式输出的最后两回合始终渲染，并保留 chat-scroll-viewport 的“发送后锚定问题”和 turn-rail 的 data-turn-id 定位。第二阶段（M）：超过约 80 回合，以及 Agent 日志、运行轨迹这类长列表，引入 virtua（体积小，支持反向和动态高度）或 @tanstack/react-virtual，turn-rail 跳转改为 scrollToIndex。同时给屏幕外的 Mermaid 和 Shiki 加 IntersectionObserver 延迟高亮。

**对标**：LobeHub 的会话列表使用 react-virtuoso 虚拟化；Slack、Discord 这类长消息流都做了窗口化。CSS content-visibility: auto（Chrome 85+、Firefox 125+、Safari 18+）可以零依赖跳过屏幕外区块的渲染，同时保留页内查找和锚点。

**核验**：核实成立：chat-transcript.tsx:31-60 items.map 全量渲染；src 中 react-virtuoso、@tanstack/react-virtual、react-window、virtua、content-visibility、contain-intrinsic-size 均为 0（仅 knowledge 列配置两处手写窗口化：configuration/table.tsx:42-45、documents/table-file-column-config.tsx:64-66）；MarkdownCodeBlock.tsx:204-235 每个代码块走 CodeBlock(Shiki)，mermaid 走 SafeMermaid；聊天组件内 IntersectionObserver 只用于 turn-rail.tsx:35-38。frontend.md:114 确认多面共用 ChatTranscript。基准（LobeHub 用 react-virtuoso、content-visibility 浏览器支持版本）可信。提案提醒：content-visibility 会影响 ChatScrollViewport 的锚定测量，contain-intrinsic-size: auto 可缓解，需在流式锚定与 turn-rail 跳转上回归验证。

#### stack-08 PDF 预览依赖 react-pdf-highlighter 8.0.0-rc.0（锁定 pdfjs 4.4，需要 Vite 特殊处理），缺少缩放、页码、搜索、缩略图和引用跳转

中 · 工作量 M · 后端已有接口 · tech-choice

**现状**：引用溯源时只能看到带高亮的整页 PDF，不能缩放、搜索，也没有缩略图，无法在多处引用之间跳转；PDF 引擎升级受这个 RC 库锁定，开发环境还要靠 Vite 特殊处理才能运行。

**证据**：

- package.json:139 — "react-pdf-highlighter": "^8.0.0-rc.0"（RC 版本）
- npm ls — react-pdf-highlighter@8.0.0-rc.0 → pdfjs-dist@4.4.168（2024 年版本线）
- vite.config.ts:233-252 — 为了让它内部 vendored 的 pdfjs 相对路径能工作，必须排除出 optimizeDeps，并手动预打包 react-rnd、react-draggable、re-resizable
- src/components/knowledge/document-preview/components/pdf-preview.tsx:11-19,57 — 只使用 PdfLoader、PdfHighlighter，固定 scale 1，没有 zoom、search 或 thumbnail 控件
- npm ls — pptx-preview@1.0.7 还自带了第二份 echarts@5.6.0（主依赖是 echarts 6.1.0，package.json:119）
- 旧审计 stack-07 中 DOCX 双引擎问题已解决（mammoth 已移除），PDF 的 RC 依赖仍未解决

**方案**：新建 patterns/document-viewer/pdf-viewer.tsx（底层 EmbedPDF 或 pdf.js 5 PDFViewer + 自研高亮层），工具栏提供页码 n/N、缩放与适应宽度（交互与现有 docx-preview 的缩放保持一致）、文本搜索、缩略图栏；“引用 2/5”上一处/下一处在 positions 间平滑滚动并用 accent token 闪烁高亮；保留懒加载与 DocumentPreview 注册表，删除 vite optimizeDeps 特殊处理；评估 pptx-preview 替代或服务端转 PDF 以去掉第二份 echarts。

**对标**：NotebookLM 点击引用后会在来源面板中定位并高亮原文；EmbedPDF（基于 PDFium WASM，MIT 许可，提供 React 无头插件：缩放、搜索、缩略图、选区、批注）和 pdf.js 5 的 PDFViewer 都是 2025 年后的主流选择；react-pdf-highlighter-extended 是仍在维护的分支（据我所知）。

**核验**：核心成立：package.json:139 react-pdf-highlighter ^8.0.0-rc.0；npm ls 确认其自带 pdfjs-dist@4.4.168；vite.config.ts:233-252 需手动预打包 react-rnd/react-draggable/re-resizable 并 exclude 该库；pdf-preview.tsx 只用 PdfLoader/PdfHighlighter，getViewport({ scale: 1 })，无缩放、页码、搜索、缩略图，只滚动到第一个高亮（:77-87）。对比 docx-preview.tsx 已有缩放（ZoomIn/ZoomOut、DOCX_ZOOM_STEPS），PDF 体验落后于同仓 DOCX。pptx-preview@1.0.7 自带 echarts@5.6.0 核实。需修正后端引用：MultiRAG api/apps/chunk_app.py:140 是 docstring 示例，真正返回 positions 的位置是 chunk_app.py:321（"positions": sres.field[id].get("position_int", [])）。

#### stack-09 缺少生成式 UI 宿主：HTML Artifact 被 sandbox="" 冻结为静态，文本和代码类 Artifact 以原始文本显示，MCP 工具结果在后端被压平，无法承载 MCP Apps

中 · 工作量 L · 需后端改动 · missing-pattern

**现状**：模型或 Agent 产出的 HTML 无法交互（图表、计算器、小应用都是静态的）；Markdown 和代码类 Artifact 没有渲染和高亮；接入的 MCP 服务即使提供 UI 资源也只能看到文本。

**证据**：

- src/components/chat/artifact-detail-panel.tsx:178-195 — HTML Artifact 使用 \<iframe srcDoc sandbox="">，脚本被完全禁用；md、json、代码类 Artifact 用 \<pre>\<code>{resource.text}\</code>\</pre> 原样显示，没有复用 StreamingXMarkdown 或 CodeBlock
- src/components/chat/artifact-kind.ts:1-35 — 预览类型只有 html、image、text、unsupported
- src/pages/agent/form/html-report/report-frame.tsx:76 — html 报告已经采用 sandbox="allow-scripts"、不带 allow-same-origin 的安全沙箱写法，可以复用
- src/pages/agent/x-card/agent-x-card-renderer.tsx:50-60 — A2UI 卡片已可渲染
- MultiRAG common/mcp_tool_call_conn.py:832-864 — MCP 结果的 structured_content 被 json.dumps 成文本，meta 只保存在 \_last_tool_call_meta，没有读取 ui:// 资源
- grep web/src：ui://、mcp-ui、MCP Apps 均为 0

**方案**：新建 components/patterns/sandbox-frame.tsx：统一的沙箱 iframe 宿主（allow-scripts，不带 allow-same-origin，内联 CSP，postMessage JSON-RPC 桥，size-changed 自适应高度，注入主题 token）。1) HTML Artifact 改用它，可交互，并在头部提供“查看源码 / 运行”切换；text 类 Artifact 按扩展名走 StreamingXMarkdown（md）或 CodeBlock（代码、json），补上身份图标。2) MCP Apps：工具结果带 \_meta.ui.resourceUri 时，在消息中渲染为内联卡片，并可展开到 Artifact 面板；iframe 内发起的 tools/call 经后端代理，并弹出用户确认。3) html-report 迁移到同一个宿主，与 A2UI 一起作为生成式 UI 的两条通道。

**对标**：Claude.ai Artifacts 在独立源（claudeusercontent.com）的沙箱 iframe 中运行交互式 HTML 和 React；ChatGPT 的 Apps SDK 和 MCP Apps 扩展（SEP-1865，2025-11 由 MCP 维护者联合 OpenAI 与 MCP-UI 社区推出）把工具 UI 以 ui:// 资源的形式交给宿主渲染；据我所知 LibreChat 已支持 MCP-UI 资源。本仓已有 A2UI，生成式 UI 的另一条主线还缺失。

**核验**：核实成立：artifact-detail-panel.tsx:178-195 HTML 用 \<iframe srcDoc sandbox="">，其余文本类用 \<pre>\<code>{resource.text}\</code>\</pre>；artifact-kind.ts:1-35 只有 html/image/text/unsupported；report-frame.tsx:76 已用 sandbox="allow-scripts"（不带 allow-same-origin），符合 docs/agent-guidance/runtime.md:89 的沙箱规则（两者不得同时开启）与 security/no-unsafe-iframe-sandbox lint。web/src 中 ui://、mcp-ui、resourceUri 均为 0。MultiRAG common/mcp_tool_call_conn.py:833-865 把 structured_content json.dumps 成文本、meta 拼成字符串，\_last_tool_call_meta 在后端其他模块无任何消费者，确实未透传给前端，也没有 resources/read 代理。needs-backend 判断正确（MCP Apps 部分），交互式 HTML 与文本 Artifact 渲染不需后端。基准（Claude Artifacts 独立源沙箱、MCP Apps SEP-1865 于 2025-11 提出）可信。

#### stack-10 Monaco 没有声明为直接依赖（0.52.2 作为 peer 被自动安装），14MB 的 AMD /vs 目录拷入产物，只服务 3 个 JSON/代码小编辑器

低 · 工作量 M · 不需要后端 · tech-choice

**现状**：三个小型 JSON/代码编辑器引入了 Web 产物和桌面安装包中最大的静态目录（dist/vs 14M），monaco-editor 版本由 peer 自动安装决定。配色已与 Shiki 共用 syntax-\* token（46804c26），但 AMD 加载、体积和窄屏/触屏体验仍是负担。

**证据**：

- package.json:84 — 只声明了 "@monaco-editor/react": "^4.7.0"
- package-lock.json:15140-15145 — monaco-editor 0.52.2 标记为 "peer": true，版本随 peer 范围 >=0.25 <1 浮动
- vite.config.ts:67-116 — monacoStaticAssetsPlugin 把 node_modules/monaco-editor/min/vs 整体拷到 dist/vs（du 实测 14M）
- src/components/jsonjoy-builder/lib/configure-monaco-loader.ts:8 — loader.config({ paths: { vs: '/vs' } })，使用 AMD 加载
- 使用方只有 3 处：src/components/jsonjoy-builder/components/schema-editor/json-schema-visualizer.tsx:1、src/pages/agent/form/code/code-script-editor.tsx:13、src/pages/agent/form/components/json-code-editor.tsx:1
- desktop/build/staging-policy.mjs:14 — 桌面打包必须携带 vs 目录

**方案**：短期：package.json 显式声明并锁定 monaco-editor。中期：统一为 patterns/code-editor.tsx，用 CodeMirror 6（lang-json/python/javascript + lint，JSON Schema 校验用 codemirror-json-schema），配色沿用现有 code-\*/syntax-\* 角色；完成后删除 monacoStaticAssetsPlugin、dist/vs 与桌面 staging 的 vs。

**对标**：n8n 的 Code 节点使用 CodeMirror 6；Dify 的代码节点使用 Monaco。CodeMirror 6 体积远小于 Monaco，模块化，移动端友好，可以通过 CSS 变量主题直接复用设计令牌。

**核验**：核心成立：package.json:84 只声明 @monaco-editor/react；package-lock.json:15140-15146 monaco-editor 0.52.2 "peer": true；vite.config.ts:67-116 monacoStaticAssetsPlugin 拷贝 min/vs，du 实测 dist/vs 14M；configure-monaco-loader.ts:8 AMD paths '/vs'；使用方为 json-schema-visualizer、code-script-editor、json-code-editor 三处；staging-policy.mjs:14 允许 vs 目录。需修正：“主题需单独桥接、与 shiki 是两套体系”已过时——46804c26（2026-11-18）起 use-monaco-theme.ts:89-103 通过 getTokenValue 读取与 Shiki 相同的 code-fg/code-bg/syntax-\* 角色，两者已共用 token 源，只是实现机制不同。迁移 CodeMirror 6 的理由应集中在 14MB 产物体积、peer 漂移与触屏体验。

#### stack-11 G6 单块 1.4MB 且无法拆分，同时承担知识图谱和搜索思维导图；思维导图可以并入已有的 xyflow

低 · 工作量 M · 不需要后端 · tech-choice

**现状**：仓内有两套图形引擎：思维导图节点是 G6 画布元素，无法复用 EntityAvatar、引用 chip、设计令牌和 React 交互；打开搜索详情里的导图就要整体下载 1.4MB。

**证据**：

- package.json:71 — "@antv/g6": "5.1.1"
- vite.config.ts:381-389 — 注释说明 @antv/layout 含嵌套 CommonJS，按体积拆分会产生启动循环，只能整体打成一个 chunk
- dist/js/chunks/vendor-graph-antv-Bh84soS2.js — 1,403,970 B
- src/pages/knowledge/graph/components/force-graph.tsx:10-17 — 知识图谱力导布局
- src/pages/search/detail/mindmap/indented-tree.tsx:25 — 搜索思维导图也使用 G6（580 行）
- @xyflow/react 13 已用于 55 个文件（Agent 画布）

**方案**：1) 思维导图改为 xyflow 加 d3-hierarchy（或 elkjs）的横向树布局，节点用 React 组件渲染：标题、来源 favicon 或文档 file-kind tile、引用数 badge，点击后打开引用面板，配色走 token。2) 知识图谱暂时保留 G6，或在节点数较大时评估 sigma.js v3 加 graphology（WebGL，体积小）。3) 在规则中写明分工：xyflow 负责画布和树，G6 或 Sigma 负责大图，ECharts 只用于沙箱报告，Mermaid 只经由 Markdown。

**对标**：RAGFlow 使用 G6（本仓继承自它）；LightRAG WebUI 用 Sigma.js 加 graphology 做 WebGL 知识图谱；xyflow 官方示例用 d3-hierarchy 或 elkjs 布局 React 节点树，节点可以是任意组件。

**核验**：核实成立：package.json:71 @antv/g6 5.1.1；vite.config.ts:381-389 注释说明 @antv/layout 含嵌套 CJS，只能整体成块；dist chunk vendor-graph-antv 1,403,970 B；G6 仅用于 knowledge/graph（5 个文件）和 search/detail/mindmap/indented-tree.tsx（580 行）；@xyflow/react 在 55 个非测试文件中使用（除 components/canvas/background.tsx、types/agent.ts 外均在 Agent）。ECharts 确实只在 html-report 中使用，Mermaid 只经由 MarkdownCodeBlock/mermaid-diagram，提案第 3 点的分工描述与现状一致。基准（LightRAG WebUI 用 Sigma+graphology、xyflow 树布局示例）可信。

#### stack-12 Ant Design X 残留：x-sdk 零引用但文档仍称“保留”；x-card 与 x-markdown 绑在同一 chunk 进入首屏；XMarkdown 需要 rAF 补丁

低 · 工作量 S · 不需要后端 · consistency

**现状**：x-sdk 是死依赖；x-card 只服务 Agent 运行时，却和 Markdown 一起进入首屏；XMarkdown 用 effect 镜像状态，流式期间每帧会多一次提交。

**证据**：

- package.json:70 — "@ant-design/x-sdk": "2.10.0"；在 src 和 desktop 中 grep x-sdk、XRequest、useXChat、XStream 全部为 0
- docs/agent-guidance/frontend.md:114,186 与 eslint.config.js:471-474 — 仍写着“保留 x-markdown、x-card、x-sdk”
- src/components/chat/streaming-x-markdown.tsx:33-36 — 注释说明 XMarkdown 用 effect 镜像输入状态，必须按 rAF 合并 SSE 突发，否则会超出 React 的更新深度限制
- patches/@ant-design+x-card+2.10.0.patch — x-card 依赖本地补丁，每次升级都要移植
- vite.config.ts:311-321 — vendor-x-render 包含 x-card 和全部 @ant-design/\*
- 旧审计 stack-01 中的 x-sdk 零引用项仍未解决

**方案**：1) 删除 @ant-design/x-sdk，同步修改 frontend.md、团队手册和 eslint 注释。2) 拆出 x-card chunk（见 stack-01）。3) 保留 StreamingXMarkdown 作为唯一门面，新增一个长回答基准（3 万字、10 个代码块、2 个 mermaid、流式 50 token/s），记录提交次数和长任务；只有当基准显示卡顿时，才在门面后评估 Streamdown，调用方不需要改动。

**对标**：Streamdown（Vercel，基于 react-markdown 加 remend 修补未闭合语法，按块做 memo，内置 shiki、katex、mermaid）是 2025 年后常见的流式 Markdown 选择；本仓的 x-markdown 配置功能已与之同档，不建议现在替换。

**核验**：核实成立：package.json:70 @ant-design/x-sdk 2.10.0，src 与 desktop 中 x-sdk/XRequest/useXChat/XStream 均为 0，x-card、x-markdown 的 dependencies 均不依赖 x-sdk，为死依赖；frontend.md:114,186、eslint.config.js:473、AI前端技术栈开发规范.md:43 仍写保留；patches/@ant-design+x-card+2.10.0.patch 存在；streaming-x-markdown.tsx:33-36 注释确认 rAF 合并补丁；vite.config.ts:311-321 vendor-x-render 按 @ant-design/ 前缀合并。小修正：x-card 源码仅约 35KB（sourcemap 实测），拆出后首屏收益约 10KB gzip，主要收益仍是 KaTeX；Streamdown 新版本已把 math/mermaid 等拆成插件，与 stack-01 基准描述保持一致即可。

#### stack-13 没有 shadcn components.json，Radix 仍是 21 个分散包，无法直接从 AI Elements 等 registry 拉取组件源码

低 · 工作量 S · 不需要后端 · consistency

**现状**：chat 模式组件按 AI Elements 思路手写，Reasoning、Sources、InlineCitation、Context 清单、运行时间线、Artifact 卡片已有自研实现；Branch、Suggestion、token 用量仍缺。Radix 为 21 个分散包，没有 shadcn registry 配置，后续引入 AI Elements 新部件只能手工移植。

**证据**：

- package.json:85-105 — 21 个独立的 @radix-ui/react-\* 依赖
- 仓库根目录没有 components.json（ls 确认）
- src/components/patterns/chat/message.tsx、prompt-input.tsx — 命名和结构沿用 AI Elements（Message、MessageContent、MessageActions、PromptInput），但全部是手工移植

**方案**：1) 合并为 radix-ui 单包导入，继续使用 Radix。2) 新增 components.json，aliases 指向 @/components/ui 与 @/components/patterns，配置 AI Elements registry；拉取的 Branch、Suggestion 等只作结构参考，用本仓 token（space-\*、radius-\*、语义色、EntityAvatar）改写后放进 patterns/chat，并与现有 context-manifest-summary、reasoning-disclosure、run-timeline 对齐，不重复造已有部件。

**对标**：shadcn/ui 当前模板已改为从统一的 radix-ui 包导入，并支持 registry 分发；Vercel AI Elements 以 shadcn registry 方式发布 Reasoning、Sources、InlineCitation、Branch、Suggestion、Context、Task、Artifact 等 AI 组件；据我所知 shadcn 也已提供 Base UI 变体，但本仓没有必须切换的理由。

**核验**：核心成立：根目录无 components.json；package.json:85-105 共 21 个 @radix-ui/react-\* 包，无统一 radix-ui 包；message.tsx:2-3、prompt-input.tsx:2-3 文件头注明改编自 Vercel AI Elements，frontend.md:115 也有记录。需修正“后续要补 Context、Task”的说法：仓内已有对应自研部件——context-manifest-summary.tsx（上下文清单）、reasoning-disclosure.tsx（Reasoning）、source-strip.tsx/citation-chip.tsx（Sources/InlineCitation）、run-timeline.tsx 与 retrieval-progress.tsx（Task/ChainOfThought 类）、artifact-card.tsx（Artifact）。真正缺口是 Branch（回答版本切换）、Suggestion（追问建议）以及 token 用量展示。

### gaps：覆盖缺口

**维度结论**：我先对照八个已审维度，找出覆盖不到或只碰到边的面：公开分享页和浮窗（含发布入口）、发布后的使用数据、AI 工具里的自动填表、可安装性与移动端浏览器外观、打印和导出、桌面端的原生 AI 入口。下面挑其中 5 块审计，共 9 条发现。

最大的缺口在公开分享面。匿名访客看到的是开发者文案：shared_id、beta token、Begin inputs，中文界面里还夹着英文的 Task/Conversation。开场白同一屏出现两次，助手头像是中性的 Bot 图标，刷新一下会话就没了。发布能力只有 Agent 有：后端早就提供了 /chatbots 和 /searchbots 两组公共接口，可 Studio 对话应用和搜索应用都不能公开分享；搜索页的「分享」只是复制一条要登录才能打开的地址。浮窗的配色把所有表面压成同一种颜色，从代码看深色主题会被浅色默认值盖掉。

其次是「发布之后看不到效果」。后端 /api/v1/system/stats 已经按天统计会话数、独立访客、token、输出速度和点赞，前端没有任何地方调用。

自动填表有两个问题。第一，只认用户手工标记 {{}} 的 .docx，后端 docx_marker 和 xlsx_marker 的自动识别、Excel 支持都没用上。第二，AI 填写一次性覆盖全部字段：不能逐项审阅，资料只能是纯文本文件，第 2 步的预览看不到填写结果。

可安装性、打印导出、桌面快捷唤起这三条列为低优先级。

刻意没提的面：

- SSO：后端 OAuth 回调目前固定返回 oauth_identity_binding_required，登录还没有打通，所以不提 SSO 按钮。
- Team 和系统状态页：近期已重建，和后端能力对得上。
- Skills 和 Channels：有独立的计划在推进。
- 匿名分享里的「查看原文」跳登录页（旧审计 chat-18）：引用面板里已经没有这个入口，不再重提。

仍未关闭的旧审计项：settings-01，分享凭证固定取第一条 Token；settings-20，自动填表的 SSE 请求还没有移进领域 API。

**已做好、应保留**：

- 浮窗设置用 zod schema 持久化在 DSL globals['sys.widget_settings']。宿主颜色只接受 hex，页脚链接会剔除非 http(s) 协议和内嵌凭证，ScopedTheme 把配色限定在浮窗作用域内。测试覆盖设置、生命周期和引用（src/pages/agent/share/widget-settings.ts、\__tests_\_/widget-\*.test.tsx）
- 分享页和浮窗已经有 Agent 头像（EntityAvatar badge=agent）、locale 参数、静音提示音，加载、失败、缺参都有对应状态（src/pages/agent/share/index.tsx、widget-shell.tsx）
- 自动填表的结构可以保留：三步进度条带 aria-current；第 2 步表单和 Word 预览左右分栏、宽度可调，预览在无脚本沙箱 iframe 里渲染，可缩放；模型以 ProviderLogo 标识；有已填计数、字段搜索、「只看未填」、原始输出折叠；流式请求可中断（src/pages/ai-tools/\*）
- Agent 运行日志是可调宽的主从布局：状态点、运行中显示 Tide 闪光文字、错误摘要条、版本、耗时，可导出 CSV（src/pages/agents/log/\*）
- 系统状态页每个组件一行，带健康色图标块和延迟 sparkline 趋势（src/pages/system/system-status-page.tsx）
- 移动端有专门的 MobileSidebarSheet，触控目标 44px，并用 visualViewport 处理软键盘遮挡（src/components/layout/mobile-sidebar-sheet.tsx、use-workbench-viewport.ts）
- Geist 和 Geist Mono 通过 @fontsource 打包到本地，Web 与离线桌面端字形一致（src/themes/appearance.css:13、package.json:75）
- 桌面端是安全的 Renderer Bridge v2，命令面板、工具栏、快捷键和原生菜单由同一个命令注册表驱动（desktop/protocol/renderer-bridge/capabilities.ts、src/lib/commands/command-provider.tsx）
- 模型网关已有完整的概览仪表盘（src/pages/settings/model-gateway/components/overview/kpi-row.tsx、requests-chart.tsx、top-lists.tsx，含请求数、错误、token、首 token 延迟中位数），gaps-04 的指标卡和趋势图可以直接抽成共享组件，不必等 design-10。
- 主题层已经能在浏览器里按种子色生成配色方案：src/themes/custom-scheme.ts:27、37 的 customSchemeCSS 和 customTokenValues，加上 src/themes/oklch.ts:97 的 rgbToOklch。gaps-03 的「一个强调色派生全部角色」可以直接复用。
- 浮窗的安全边界做得扎实：宿主嵌入脚本校验 e.origin（src/pages/agent/share/access.ts:183）；颜色先过 hex 白名单才进入作用域样式（widget-theme.tsx:17、widget-settings.ts normalizeHexColor）；页脚链接拒绝控制字符、内嵌凭据和非 http(s) 协议（widget-settings.ts normalizeWidgetFooterLink）。
- 公开分享面和登录态隔离：分享页和浮窗用 ScopedTheme 加 useRouteLocale 使用自己的主题和语言（index.tsx:122、401）；分享态思维导图的 401 不会清掉产品会话（src/api/search.ts:131 skipAuth，有 search-share-session.test.ts 覆盖）。
- 后端 /custom/process_docx 已能自动识别表格空格、冒号标签和段落下划线待填位（MultiRAG api/apps/custom_app.py:764-805、1024），自动填表的核心能力比前端文案描述的更强。
- src/hooks/use-mcp-upload.ts 已经能为 enhanced_chat_sse.files 提供运行时附件 id，gaps-06 把任意文件作为资料来源时可以直接复用。

#### gaps-01 公开分享页和浮窗把开发者文案直接给匿名访客，缺少开场引导和 Agent 身份，刷新就丢会话

高 · 工作量 M · 需后端改动 · interaction

**现状**：公开页沿用 WorkspacePageTemplate 加 PageHeader（index.tsx:402-449），访客看到的是参数名、令牌说明和英文模式徽标。开场白在头部描述和首条消息里各出现一次。头部是 Agent 头像，消息里却是中性 Bot 图标，身份不一致。错误以红框原文显示在消息流上方，没有重试。会话只存在内存里，刷新或宿主页跳转后丢失。分享页有「重置会话」，浮窗没有任何新对话入口。

**证据**：

- src/locales/zh-CN/agent.ts:242-245 — 中文资源里 agentWidget/agentShare/conversation/task 仍是英文 'Agent Widget'、'Agent Share'、'Conversation'、'Task'
- src/locales/zh-CN/agent.ts:270-284 — 访客能看到的说明写着 `shared_id`、`auth`、beta token、`Authorization: Bearer <beta>`、'external inputs、发布模式和公共输入契约'、'Begin inputs'
- src/pages/agent/share/index.tsx:421-427 — 头部描述的缺省文案是「公共运行页只消费 shared_id 与 auth，不读取本地登录态」
- src/pages/agent/share/index.tsx:123-127 与 421-422 — 对话模式下 prologue 既是头部描述，又被追加成第一条助手消息，同屏出现两次
- src/pages/agent/share/index.tsx:428-449 — 头部动作是紫/蓝色 Task/Conversation 徽标加「复制」「重置会话」，像内部控制台
- src/pages/agent/share/index.tsx:454-458 — 运行错误是消息流上方的一块红框原文，没有重试
- src/pages/agent/share/use-shared-agent-runner.ts:49-50 — messages 和 sessionId 只存在 React state 里，刷新或宿主页跳转后会话丢失
- src/pages/agent/components/runtime-chat/runtime-chat-renderers.tsx:35-38 — 分享页和浮窗里助手头像固定为中性 Bot 图标，没用 Agent 自己的头像
- src/pages/agent/share/widget.tsx:379-397 — 浮窗加载和失败都是一行纯文字，没有骨架也没有重试
- E:/project/MultiRAG/api/apps/restful_apis/bot_api.py:650-681 — /agentbots/{id}/inputs 只返回 title/avatar/inputs/prologue/mode，没有描述和开场问题

**方案**：第 1 到 5 条保留：访客欢迎区 share-hero.tsx、44px 紧凑顶栏加「新对话」、重写 agent.share.\* 访客文案（调试细节放到 ?debug=1）、内联错误卡片带「重试」、RuntimeChatMessageList 增加 assistantIdentity。assistantIdentity 要遵守 access.visibleAvatar，分享方关闭头像时仍回退到中性图标。对话模式下头部不再把 prologue 当描述，只保留开场白气泡。第 6 条改为：浏览器存储里只保存 sessionId 这类最小恢复元数据（按 agentId+userId 做键，读写包 try/catch），不保存消息内容；刷新后的消息回放依赖后端新增凭 beta token 读取会话消息的接口，在那之前刷新后显示「继续上次会话」的空态。浮窗顶栏同样提供「新对话」。index.tsx 已有 576 行，新增 UI 要拆成独立文件，避免超过 600 行的上限。

**对标**：ChatGPT 的 GPTs 分享页依次展示 GPT 头像、名称、描述、作者和 4 个 conversation starters。Dify WebApp 有应用图标、开场白和「开场问题」chips，左侧是会话列表加「新对话」，会话在本机保留。Chatbase 和 Intercom Fin 的浮窗用初始消息加建议问题引导访客开口。

**核验**：核心成立，逐条核对属实：zh-CN/agent.ts:242-245 中文资源里仍是 'Agent Widget'/'Agent Share'/'Conversation'/'Task'；270-284 把 `shared_id`、`auth`、beta token、Begin inputs 直接给访客看；index.tsx:421-427 缺省描述是开发者文案；index.tsx:123-127 在对话模式下把 prologue 追加成首条助手消息，421-422 又把它当头部描述，同屏出现两次；runtime-chat-renderers.tsx:35-38 助手头像固定为中性 Bot；index.tsx:454-458 红框原文、无重试；use-shared-agent-runner.ts:49-50 会话只在 state 里；widget.tsx:379-388 加载和失败都是一行纯文字；bot_api.py:672-681 的 /agentbots/{id}/inputs 只返回 title/avatar/inputs/prologue/mode。自 dc4b8e6d（Tide identity）之后没有相关修复。需要更正三处。(1)「没有新对话入口」只对浮窗成立：分享页头部有「重置会话」（index.tsx:438-445），widget.tsx 里没有任何 reset。(2) 头部已经用 EntityAvatar 显示 Agent 头像（index.tsx:407-414），问题在于和消息列表的 Bot 图标前后不一致，并不是完全没有身份。(3) 提案第 6 条要把消息快照写进 localStorage，这违反 docs/agent-guidance/runtime.md:98「禁止把对话内容、prompt、tool 输出写入 localStorage」，也违反 :24「仅持久化 UI 偏好」。后端没有凭 beta token 读取会话详情的接口（bot_api.py 的路由清单里没有 sessions GET），刷新后恢复消息必须由后端提供。

#### gaps-02 只有 Agent 能发布：Studio 对话应用和搜索应用不能公开分享或嵌入，分享对话框是开发者配置面板

高 · 工作量 L · 后端已有接口 · information-architecture

**现状**：公开发布只有 Agent 能做，入口是一个 3xl 弹窗，正文里摆着 shared_id 和 release 这类参数。Studio 对话应用列表上的「已发布 / 草稿」其实是有效 / 已删除标志，既没有真正的发布状态，也没有任何对外渠道。搜索页的「分享」只复制一条要登录才能打开的地址；页面里虽然有读取 shared_id 的分享态，但它只接到了思维导图，访客也进不了这个页面。

**证据**：

- src/lib/router.tsx:301-311 — AuthGuard 之外的公开路由只有 AGENT_SHARE 和 CHAT_WIDGET，两者都只服务 Agent
- src/pages/studio/create-app/components/editor-header.tsx:39-92 — Studio 编辑器头部只有返回、编辑信息、保存，没有发布、分享、嵌入或 API 入口
- src/pages/search/detail/SearchDetailPage.tsx:127-134 与 src/locales/zh-CN/search-workspace.ts:41 — 搜索的「分享」按钮只是「复制会话链接」，复制的是当前页地址
- src/components/layout/Layout.tsx:26 — /search/:id 挂在 AuthGuard requireAuth 下，访客打开复制来的链接会被带去登录页
- E:/project/MultiRAG/api/apps/restful_apis/bot_api.py:551-601 — /chatbots/{dialog_id}/completions 和 /info 已支持凭 beta token 公开对话
- E:/project/MultiRAG/api/apps/restful_apis/bot_api.py:743、918、963、977 — /searchbots/ask、related_questions、detail、mindmap 已支持公开搜索
- src/pages/agent/share/share-embed-dialog.tsx:208-213、240、278-284 — 对话框正文直接摆出 'shared_id: xxx'、「第一条系统 API Token 的 beta」「RAGFlow 标准 Share 链接」「URL 将包含 release=true」
- src/pages/agent/hooks/use-agent-delivery-token.ts:6-10 — 分享凭证固定取 tokens[0].beta。旧审计 settings-01 提的「删掉第一条 Token，所有已发布链接静默失效」仍未关闭
- src/pages/agent/share/share-embed-dialog.tsx:186-191 — 预览只能新开标签页，对话框里没有实时预览

**方案**：1）src/components/patterns/publish/publish-popover.tsx 只做入口菜单：顶部显示 Agent 的发布状态，下面是「公开链接（一键复制）」「嵌入网站」「API」三项。「嵌入网站」打开 Sheet 或现有 Dialog，左侧实时预览（WidgetShell variant=panel），右侧代码 Tabs；shared_id、release、令牌来源收进「高级」折叠。2）Agent 编辑器、Studio 编辑器头部和应用卡片菜单都接这一个组件。Studio 一侧先不显示版本状态，同时把列表上误导人的「已发布 / 草稿」改成真实语义，或者等后端提供发布字段。3）新增两个 AuthGuard 外的公开路由，避免和现有的 /chats/widget 混淆，建议用 /share/chat 和 /share/search。chat 接 /chatbots/{id}/info 和 completions；search 接 searchbots 的 detail、ask、related_questions、mindmap，复用 SearchDetailPage 已有的 isShareMode 分支和 gaps-01 的访客外壳。4）分享凭证改为「专用分享令牌」，删除前提示会影响几个已发布链接，这部分需要后端。

**对标**：Dify 每个应用（Chatbot、Agent、Workflow）右上角都有统一的「发布」菜单：发布更新、运行（WebApp 链接）、嵌入网站（iframe、script 气泡、浏览器插件三种代码）、访问 API。RAGFlow 的对话助手和搜索都有「嵌入网站」。Vercel 和 Linear 的 Share 是轻量 popover：链接、访问级别、一键复制。

**核验**：核心成立。router.tsx:301-311 在 AuthGuard 之外只有 AGENT_SHARE 和 CHAT_WIDGET 两个公开路由。editor-header.tsx:39-92 只有返回、编辑信息、保存。SearchDetailPage.tsx:127-134 的分享只是复制当前地址，而 Layout.tsx:26 把它放在 requireAuth 下。后端 bot_api.py:551、584（chatbots）和 743、918、963、977（searchbots）都凭 beta token 鉴权（conversation_service.py:306 validate_iframe_access）。use-agent-delivery-token.ts:6-10 仍然取 tokens[0].beta，settings-01 未关闭。share-embed-dialog.tsx:242 正文显示 shared_id，284 写着 release=true，191 只能新开标签页预览。「第一条系统 API Token」和「RAGFlow 标准 Share 链接」在 212 行，属于 FormTooltip 提示，不在正文里。需要更正两处。(1)「Studio 对话应用有『已发布』状态」不成立：use-studio-stats.ts:13 把 status==='1' 当作已发布，可 status 实际是 Dialog 的软删除标志（MultiRAG common/constants.py:11 VALID='1'；chat_api.py:746 删除时置 INVALID；dialog_service.py:331 列表只返回 VALID）。所以「草稿」恒为 0，对话应用根本没有发布或版本生命周期，提案里「线上版本号 / 草稿有未发布更改」只对 Agent 成立（Agent 有 release 版本）。(2) 搜索页已有半成品分享态：SearchDetailPage.tsx:224 读取 shared_id 判断 isShareMode，src/api/search.ts:107 的 mindmapShare 会走 /v1/searchbots/mindmap，但页面在 AuthGuard 内，访客进不来。另外，带实时 iframe 预览和代码 Tabs 的嵌入配置放进 Popover 空间不够，Dify 的做法也是 Popover 只做入口菜单，具体项再打开弹窗。

#### gaps-03 浮窗主题与身份：深色主题被浅色默认色盖掉，各层表面压成同一种颜色，启动器是通用气泡图标

中 · 工作量 M · 不需要后端 · visual

**现状**：运营方要手调五个颜色才能得到一个可读的浮窗，选深色主题反而出错。浮窗内部只剩一层平面色，启动器是任何站点都一样的聊天气泡，看不出是谁家的 AI。

**证据**：

- src/pages/agent/share/widget-settings.ts:8 — theme 只允许 light/dark，不能跟随访客系统
- src/pages/agent/share/widget-settings.ts:19-23 — 五个颜色默认是固定浅色 hex（#2563eb、#ffffff、#111827、#ffffff、#111827），不随主题变化
- src/pages/agent/share/widget-theme.tsx:15-27 — 不管用户有没有自定义颜色，这组值都会写进作用域样式
- src/pages/agent/share/widget-theme.css:2-14 — canvas、surface、raised、overlay、sunken 全部指向背景色，fg-muted 等于 fg，消息、输入框、弹层没有层次也没有次要文字。由代码推断（未在浏览器验证）：theme=dark 且没改颜色时，浮窗是白底深字，边框和填充却是深色令牌
- src/pages/agent/share/widget-shell.tsx:61-66 — 启动器是 lucide MessageCircle，没用 Agent 头像，没有未读点或预告气泡
- src/pages/agent/share/widget-shell.tsx:92 — 面板固定 380×500，不能展开成全高
- src/pages/agent/share/widget-shell.tsx:149-150 — 副标题缺省为英文 'Agent Widget'

**方案**：1）浮窗配色改为一个强调色派生全部角色：用 rgbToOklch 把 widget_accent_color 换算成色相和彩度，调用 customSchemeSeed 加 customTokenValues 得到 light/dark 两套语义值，只写进 .agent-widget-theme 作用域；不要调用 installCustomScheme，它会写全局样式表和 localStorage。背景色、文字色降为「高级覆盖」，并删掉 widget-theme.css:3-9 把所有表面指向同一色的规则。2）theme 增加 'auto'，构建链接时不写 theme 参数。3）启动器改为 Agent 头像（EntityAvatar 加强调色描边），开合用现有的 motion morph；首条预告气泡和未读点作为可选项。4）宿主脚本（access.ts:188）给窗口加 max-width:calc(100vw - 48px) 和 max-height:calc(100dvh - 120px)，并支持 position=left|right 和展开为全高抽屉。5）分享设置的「浮窗定制」区放实时预览。

**对标**：Intercom Messenger 和 Chatbase 只让运营方选一个品牌色，其余颜色由系统派生并保证可读对比度。启动器可以换成自定义图标或头像，有未读角标、首条消息预告气泡，并能放在左侧或右侧。

**核验**：核心成立。widget-settings.ts:8 的 theme 只有 light/dark，19-23 是固定浅色 hex。widget-theme.tsx:15-27 总是把这组颜色写进作用域样式。widget-theme.css:3-9 把 canvas、surface、raised、overlay、sunken 全部指向 --widget-background，fg-muted 等于 fg，而边框等 line 令牌没有覆盖。所以 theme=dark 且没改颜色时，推断会是白底深字配深色边框（未在浏览器验证）。widget-shell.tsx:61-66 启动器是 MessageCircle；149-150 副标题缺省为英文 'Agent Widget'。需要更正证据：widget-shell.tsx:92 的 380×500 只是站内独立预览，真实嵌入的窗口尺寸写在宿主脚本 access.ts:188（width:380px;height:500px，没有 max-width/max-height），在不足 404px 宽的手机宿主页上会溢出。提案也要改一处：src/themes/custom-scheme.ts:56-79 的 installCustomScheme 会替换全局 adoptedStyleSheets，并写入 localStorage 的 'appearance-custom-css'。浮窗 iframe 和主应用同源，直接调用它会覆盖访客或运营方自己的品牌配色缓存，所以只能用 customTokenValues（custom-scheme.ts:37）配合 oklch.ts:97 的 rgbToOklch 算出数值，再写进浮窗作用域。'auto' 实现很简单：不传 theme 时 ScopedTheme 会继承全局外观（scoped-theme.tsx:60）。基准方面，Intercom 由少数品牌色派生其余配色，基本属实；Chatbase 实际上允许调好几种颜色，「只选一个」的说法需要弱化。

#### gaps-04 发布之后看不到效果：后端已有按天统计的会话、访客、token、速度、点赞，前端没有任何地方使用

中 · 工作量 M · 需后端改动 · missing-pattern

**现状**：运营方把应用发布到分享链接或浮窗后看不到使用效果。后端 /api/v1/system/stats 的形态已经有了，但只有会话数、访客、平均轮次是真实数据；token、速度、点赞从来没有写入。Agent 的公开会话被 Dialog 内连接整体过滤掉，前端也没有调用这个接口。

**证据**：

- E:/project/MultiRAG/api/apps/restful_apis/stats_api.py:19-35、38-49 — GET /api/v1/system/stats 返回 pv、uv、tokens、speed（token/秒）、round、thumb_up 的每日序列，默认近 7 天
- E:/project/MultiRAG/api/db/services/api_service.py:207-228 — 数据源是 API4Conversation（分享、浮窗、SDK 会话），按租户聚合；canvas_id 只把 source 切到 'agent'，并不按单个应用过滤
- 在 src 中 grep 'system/stats'、thumb_up 均无结果；唯一的用量数据来自模型网关（src/api/model-gateway.ts:329）
- src/pages/agents/log/index.tsx:47-67 — 运行日志页的 InlineStats 只有「类型」和「最近一次」
- src/pages/studio/use-studio-stats.ts:13-21 — Studio 统计只是本页已发布、草稿、近 7 天更新的数量

**方案**：先修后端，再做前端。后端：stats 对 source='agent' 改连 UserCanvas，并增加 dialog_id/canvas_id 过滤；在 agent_completion 和 iframe_completion 里累计 tokens、duration；新增公共会话的点赞接口。前端：在 Agents 和 Studio 的二级面板加「概览」页，上方是 7/30/90 天 Segmented 选择器，下面是会话、访客、平均轮次、token、输出速度、点赞六张卡片，直接从模型网关 overview 的 kpi-row 和 requests-chart 抽出共享组件。后端就绪前只展示有真实数据的会话、访客、轮次，其余指标显示「暂无数据」说明，不要画全 0 的图。

**对标**：Dify 每个应用都有「监测」页：全部会话数、活跃用户数、平均会话互动数、Token 输出速度、用户满意度、费用消耗，各是一张趋势图卡片。LangSmith 和 Langfuse 的项目 Dashboard 给出运行量、错误率、P50/P99 延迟和 token/成本。

**核验**：前端部分属实：src 里 grep 'system/stats'、thumb_up 均为 0；agents/log/index.tsx:47-67 只有「类型」和「最近一次」；use-studio-stats.ts:13-21 只统计本页数量。后端「已有」的说法明显夸大：(1) API4Conversation 的 tokens、duration、thumb_up 在 MultiRAG 里没有任何写入点（grep conv.tokens/duration/thumb_up= 只在 channel_execution/history.py:274 复制旧值），只有默认值 0（api_service.py:76）。所以 tokens、speed（stats_api.py:31 是 tokens/(duration+0.1)）、thumb_up 三条序列恒为 0，真实的只有 pv、uv、round。(2) stats 用内连接 join Dialog（api_service.py:264），而 Agent 的分享和浮窗会话存的是 dialog_id=agent_id、source='agent'（canvas_service.py:567-573），连不上 Dialog 表，会被全部过滤掉；传 canvas_id 只会得到空序列。(3) 对话应用前端还不能公开发布（gaps-02），现有数据基本只来自 SDK 调用。照提案在 Agents 区做第一版「对外发布总览」，会显示一片 0。另有可复用资产审计没提：模型网关概览已有 KPI 和趋势图组件（src/pages/settings/model-gateway/components/overview/kpi-row.tsx、requests-chart.tsx、top-lists.tsx），不必等 design-10。基准（Dify 监测页、LangSmith、Langfuse）属实。

#### gaps-05 自动填表只认手工标记 {{占位符}} 的 .docx，后端的自动识别和 Excel 能力没用上

低 · 工作量 M · 后端已有接口 · missing-pattern

**现状**：后端 process_docx 已经能自动识别表格空格、冒号标签和下划线待填位，前端文案却要求用户先手写 {{字段名}}，等于把已有能力藏起来了。Excel 模板不能用。字段只有一个可能很长的标签键，看不出它在文档里的位置。

**证据**：

- src/pages/ai-tools/ref/FileUpload.tsx:47、80 — 只接受 .docx
- src/locales/zh-CN/ai-tools.ts:14-21 — 要求用户「在文档中用 {{字段名}} 标记待填写的位置」
- src/api/document.ts:9-28 — 只调用 /custom/process_docx 和 /custom/fill_docx
- src/pages/ai-tools/ref/DataInput.tsx:382-383 — 字段标题直接显示占位符 key
- E:/project/MultiRAG/api/apps/docx_marker_app.py:192-240 — POST /v1/docx_marker/recognize 不用预先标记，就能识别表格空单元格（向右或向下填）、「标签：」独占行、「标签：\__\__」下划线等待填位置，返回 path、label、field_key；同文件 128 /parse、271 /fill、416 /fill_download
- E:/project/MultiRAG/api/apps/xlsx_marker_app.py:92、123、156 — Excel 的 parse、recognize、fill；数据模型与 docx 同构，见 E:/project/MultiRAG/api/service/xlsx_marker_service/models.py:9

**方案**：1）先改文案（S 级）：说明系统会自动识别空白单元格和下划线，{{}} 只是可选的精确标记方式。2）新增 .xlsx 路径，接 /v1/xlsx_marker/recognize 和 fill；拖拽区同时展示 docx 和 xlsx 两种 FileKindTile。3）docx 可选切换到 /v1/docx_marker/recognize，拿到 path 和 label 后，表单按表格或段落分组，以 label 为标题、path 为副文本，并在预览中按 path 定位高亮。切换前请后端确认这些接口的鉴权，并确认 recognize 与 process_docx 的识别结果一致。

**对标**：Adobe Acrobat 的「准备表单」会自动检测 PDF 里的可填字段并生成表单域，用户不用手工标记。Word 和 Excel 里的 Copilot 是直接对现有文档操作，不要求预先埋占位符。

**核验**：标题的核心「只认手工标记 {{}}」在后端层面不成立。前端调用的 /custom/process_docx 本身就会自动识别待填位：custom_app.py:764-805 的 fill_table 会从左侧标签向右填空单元格、从表头向下填、处理孤立空单元格；should_process_non_empty_cell 处理含「：」的标签格；:1024 的 process_paragraph_underline_placeholders 处理段落下划线。它生成的是以中文标签命名的 {{键}}，所以「现成的政府或企业表格用不了」不成立，字段标题也不完全是机器 key，只是可能很长或带 \_1、\_2 这类后缀。真正的问题有三个。(1) 前端文案误导用户：zh-CN/ai-tools.ts:21 的 placeholderHelp 在 FileUpload.tsx:154 显示，告诉用户要手工写 {{字段名}}。(2) FileUpload.tsx:47、80 只收 .docx，后端已有的 xlsx_marker（xlsx_marker_app.py:92、123、156）没用上。(3) 没用 docx_marker 返回的 path 和 label 结构（docx_marker_app.py:192），预览里无法定位字段。另外 docx_marker 和 xlsx_marker 的路由都没有声明鉴权依赖（文件里没有 Depends/current_user），接入前要请后端确认。

#### gaps-06 AI 填写是一键覆盖的黑盒：不能逐项审阅，资料只能是纯文本，填写中的预览看不到结果

中 · 工作量 L · 后端已有接口 · interaction

**现状**：点「AI 填写」后，只有一行闪光文字，接着所有字段被一次性替换；用户分不清哪些是 AI 写的、依据是什么、哪些覆盖了自己的输入。资料来源只能是纯文本。左边改了值，右边预览仍是空模板。

**证据**：

- src/pages/ai-tools/ref/DataInput.tsx:213 — 模型结果用 setForm(parsed) 整体覆盖用户已填内容，没有对比、逐项接受、拒绝或撤销
- src/pages/ai-tools/ref/DataInput.tsx:98-101 — llm_name 初始为空，每次都要先开设置弹窗选模型；租户默认模型（src/api/auth.ts:126 getTenantInfo）没有用上
- src/pages/ai-tools/ref/data-input-user-input-section.tsx:29-34、56-69 — 资料来源只收 txt/json/csv/md，用 readAsText 拼进提示词；PDF、Word、图片不能作为来源，而且入口藏在设置弹窗里
- src/pages/ai-tools/ref/DataInput.tsx:208 — 请求体固定为 files: []
- E:/project/MultiRAG/api/apps/llm_app.py:744、2699-2703 — enhanced_chat_sse 已支持 files，会调用 prepare_runtime_files 处理运行时附件
- src/pages/ai-tools/AutoFillWorkbenchPage.tsx:85 — 第 2 步预览渲染的是原模板 processedData.file，填写值要到第 3 步生成后才看得到
- src/pages/ai-tools/ref/use-structured-ai-fill.ts:62 — 流式请求手拼 URL，并回落到 http://localhost:8000，绕过领域传输层。旧审计 settings-20 的「SSE 请求移入领域 API」仍未关闭

**方案**：第 1 条建议层（逐字段 AI 徽标、对比、全部采纳、撤销本次）、第 3 条默认用租户模型（getTenantInfo）、第 5 条流式请求移进 src/api 并复用共享 SSE 解析（顺带修 home/utils/mcp-agent-stream.ts:32），这三条保留。建议层只合并模型返回的键，不能整体替换表单。第 2 条资料区复用现有的 src/hooks/use-mcp-upload.ts 拿到附件 id，再放进 files。第 4 条改为前端本地实时预览：docx-preview 渲染模板后，用 textContent（不用 innerHTML）把 {{key}} 文本节点替换成当前值并加高亮标记，不向服务端发请求；只在第 3 步生成时调用一次 fill_docx。知识库作为资料来源需要后端增加 kb_ids。

**对标**：Cursor 和 GitHub Copilot 的 AI 改动以 diff 呈现，逐块 Accept/Reject。Notion AI Autofill 填数据库属性时，单元格带 AI 标识，可以单独重新生成。AI Elements 和 assistant-ui 都把流式结构化输出逐步渲染成 UI，而不是最后一次性替换。

**核验**：现状属实。DataInput.tsx:213 用 setForm(parsed) 整体替换表单，模型漏返回的键还会把用户已填的值一起冲掉（setForm 在 137-140 直接覆盖）。98-101 的 llm_name 初始为空，167-171 没选模型就强制打开设置。data-input-user-input-section.tsx:29-34、56-69 只收文本文件，用 readAsText 拼进提示词。208 行固定 files: []。AutoFillWorkbenchPage.tsx:85 第 2 步预览的是原模板。use-structured-ai-fill.ts:62 手拼 URL，和 home/utils/mcp-agent-stream.ts:32 是同一种模式，settings-20 未关闭。后端 llm_app.py:744 支持 files，并由 prepare_runtime_files（llm_app.py:275）解析运行时上传。提案第 4 条需要改：fill_docx 每次调用都会把输入文档、填写数据和输出落盘日志（custom_app.py:1159、1194 save_docx_log），防抖约 800ms 就调一次，会把用户数据大量写进服务器日志，有隐私和磁盘问题。基准中 Cursor 和 Copilot 的逐块 Accept/Reject、Notion AI Autofill 的单格重新生成都属实；「AI Elements / assistant-ui 逐步渲染结构化输出」更准确的例子是 Vercel AI SDK 的 streamObject/useObject。

#### gaps-07 无法安装为应用，移动端浏览器外观不跟随配色：没有 PWA manifest、theme-color 和应用图标

低 · 工作量 S · 不需要后端 · missing-pattern

**现状**：手机和平板上无法「添加到主屏」获得独立窗口；Safari 和 Chrome 的地址栏颜色和 bg-app 对不上，深色模式下顶部是一条亮边；首屏 lang 与界面语言不一致。

**证据**：

- index.html:2 — `<html lang="en">`；运行时才由 src/locales/i18n.ts:60-63 applyDocumentLocale 改写，首屏的读屏软件和浏览器翻译都按英文判断
- index.html:3-10 — 没有 manifest、theme-color、apple-touch-icon，viewport 没有 viewport-fit=cover 和 interactive-widget
- public/ 目录只有 iconfont.js、openapi.json、pdfjs-dist、theme-init.js，没有任何图标或 manifest
- public/theme-init.js:1-40 — 首屏前的脚本只解析配色方案和明暗模式，不同步浏览器界面颜色

**方案**：1）新增 public/manifest.webmanifest：name 用「沧溟 AI」，display standalone，maskable 图标由 brand-mark（src/components/layout/brand-mark.tsx）导出 192 和 512 两档。2）index.html 加两条带 media 的 theme-color，取值用默认 ink 方案在 token-values.generated.ts 里的 canvas/bg-app 浅色和深色值，不写死 Mist 色；同时加 apple-touch-icon、viewport-fit=cover 和 interactive-widget=resizes-content。3）theme-init.js 解析出配色方案和明暗模式后，更新 meta theme-color，并按已保存的 locale 预设 lang。4）只做可安装外壳，不做离线缓存。

**对标**：ChatGPT、Claude.ai、Perplexity 的网页版都能安装为应用；开源项目 Open WebUI、LibreChat 也自带 manifest，可以添加到主屏。

**核验**：现状属实。index.html:2 是 lang="en"，运行时才由 i18n.ts:60-63 改写；index.html 没有 manifest、theme-color、apple-touch-icon，viewport 没有 viewport-fit 和 interactive-widget；public/ 只有 iconfont.js、openapi.json、pdfjs-dist、theme-init.js。提案里的 theme_color「Mist #29669a」在仓库里找不到。而且当前默认配色方案已经不是 Mist：appearance.ts:54 和 public/theme-init.js 的缺省值都是 'ink'，color-schemes.ts:70 的 mist 只是可选方案之一，写死这个值会和默认外观对不上。「深色模式顶部是一条亮边」是推断：Safari 15+ 在没有 theme-color 时会从页面背景取色，需要弱化。基准里 ChatGPT、Open WebUI、LibreChat 可以安装为应用，基本属实。

#### gaps-08 打印与导出：全站没有打印样式，搜索答案只能导出 Markdown

低 · 工作量 M · 不需要后端 · missing-pattern

**现状**：Ctrl+P 打印任何页面，都会带上图标栏、二级面板、composer 和操作栏，长回答会被截断或排版错乱。把答案交给不用 Markdown 的同事时，只能手动复制。

**证据**：

- 全仓 grep '@media print' 和 'print:' 都是 0 处；唯一的 print 字样是 src/pages/agent/x-card/components/media.tsx:82 里的图标映射
- src/pages/search/detail/export/search-session-export.ts:110-156 — 搜索会话只能导出 .md（Blob text/markdown）
- src/pages/agents/log/hooks/use-agent-log-export.ts:148 — 运行日志只能导出 CSV
- package.json:117 — 只有 docx-preview（用于预览），没有生成 Word 或 PDF 的依赖

**方案**：1）在 src/index.css 增加一组打印样式：隐藏图标栏、面板、composer 和操作栏；消息流铺满宽度；代码块自动换行；引用角标展开成文末脚注；Mermaid 和图表保留 SVG。2）搜索会话（以及 chat-12 提出的会话导出入口）提供下拉：「打印 / 存为 PDF」走浏览器打印，「Markdown」用现有实现，「Word」按需懒加载 npm docx 包在前端生成。3）导出的文件头写上应用名、模型、时间和 Tide 标识。

**对标**：Perplexity 的线程可以导出 PDF、Markdown 和 DOCX；ChatGPT Canvas 可以下载 PDF、Word 和 Markdown（细节不完全确定）；Notion 页面有专门的打印友好样式。

**核验**：属实。全仓 grep '@media print'、'print:'、window.print 都没有匹配，唯一的 print 字样是 src/pages/agent/x-card/components/media.tsx:82 的图标映射。search-session-export.ts 只生成 text/markdown 的 Blob。use-agent-log-export.ts 只导出 CSV。package.json:117 只有 docx-preview，也没有其他生成 PDF 或 Word 的依赖。「打印时带上图标栏、composer、长回答被截断」是从 h-dvh 加内部滚动容器的布局推断出来的，没有实测。Perplexity 可导出 PDF/Markdown/DOCX、ChatGPT Canvas 可下载 PDF/Word/Markdown，审计已标注「细节不完全确定」，基本可信。提案不涉及后端，符合约束。

#### gaps-09 桌面端缺少 AI 桌面应用的原生入口：全局快捷键唤起、系统通知、托盘

低 · 工作量 L · 不需要后端 · missing-pattern

**现状**：桌面端目前就是把 Web 应用装进一个窗口。用户必须切回主窗口才能提问；长任务完成后没有系统级提醒；后台运行时也没有托盘入口。

**证据**：

- desktop/protocol/renderer-bridge/capabilities.ts:9-17、26-34 — updater、notifications、localAgent、pty、localMcp 全部是 false
- src/lib/commands/command-provider.tsx:38-39 — Renderer 只读取了 nativeMenu 这一项能力
- 在 desktop/electron 下 grep globalShortcut、Tray、Notification、autoUpdater 都是 0 处
- docs/client-platform/ROADMAP.md:110、181、197 — 通知和更新已排进后续阶段，但「全局快捷键唤起的迷你输入窗」不在路线图里

**方案**：1）在路线图的下一阶段补一项 Quick Ask：主进程注册可配置的全局快捷键，弹出约 640×64 的无边框浮动输入条，复用 ChatComposer 和 Tide 标识；回车后在主窗口打开新会话，或直接在浮条下方展开流式回答。2）通知能力上线后接入 shell-05 提出的活动中心：解析、索引、Agent 运行完成时发系统通知，点击直接定位到对应页面。3）托盘菜单提供「新对话 / 最近会话 / 暂停通知」。4）Renderer 侧先定义 PlatformPort.quickAsk 契约；Web 端降级为 ⌘K 里的「问 Tide」。

**对标**：ChatGPT 桌面版用 Option/Alt+Space 唤起悬浮输入条；Claude 桌面版有 Quick Entry（macOS 双击 Option）；Raycast AI 也是全局快捷键唤起。这些都是桌面 AI 应用常见的「随叫随到」入口。

**核验**：属实。desktop/protocol/renderer-bridge/capabilities.ts:9-17、25-33 的 updater、notifications、localAgent、pty、localMcp 全部为 false。command-provider.tsx:38-39 只读取 nativeMenu。desktop 下 grep globalShortcut、Tray、Notification、autoUpdater 都是 0 处。docs/client-platform/ROADMAP.md 在 CLP-DESK 阶段列了 notifications 和 updates（约 181-197 行），没有全局快捷唤起或 Quick Ask。ChatGPT 桌面版 Alt/Option+Space、Claude 桌面版 Quick Entry、Raycast AI 都属实。补充一点：Windows 上 Alt+Space 默认是窗口系统菜单，快捷键要能配置，冲突时要提示。提案不涉及后端，并带 Web 降级，符合约束。

## 附录 B：外部调研（截至 2026-11-23）

截至 2026-11-23 的外部基线（已联网核实，部分为二手来源，已逐条标注置信度）：

1. 产品范式：从"聊天框"转向"Agent 工作台"。Gemini（Chat→Task 切换，2026-11-17）、Claude（Chat/Cowork 模式切换，Cowork 云端会话跨设备）、Codex app 与 Claude Code desktop（并行会话、worktree、diff 审阅、可拖拽面板、Verbose/Normal/Summary 三档详略）、Cursor 3 Agents Window 共同确立了这些标配：计划/todo、单一可折叠 Trace、逐工具审批、内联澄清提问、后台运行与通知、运行中 steer/queue、computer/browser 视图与人工接管。

2. 生成式 UI 已有标准可依：MCP Apps（SEP-1865，2026-01-26 稳定）已被 Claude、ChatGPT、VS Code 等作为宿主采用，ChatGPT 明确以它为基础、window.openai 只做扩展。A2UI 1.0（2026-11-11）可在 MCP Apps 内渲染。AG-UI 是事件层，TanStack AI 1.0、Langflow、AWS AgentCore 已接入。OpenAI 的 Agent Builder 可视化画布将于 2026-11-30 关停，转向代码化的 ChatKit 服务端；n8n 和 LobeHub 则推出"用描述生成 Agent"的构建器。

3. 组件层变化：shadcn/ui 2026-07 起新项目默认 Base UI，Radix 未被弃用但进展缓慢。2026-10 shadcn 发布 Trace、Code Block 以及 21 个 AI Elements 模式（Plan、Queue、Confirmation、Context、Inline Citation 等），Vercel 版 ai-elements 将于 2026-11 底弃用。Streamdown 2.x 已被 Dify、Cherry Studio 采用，Dify 前端同时用了 Base UI。

4. 对照本地 package.json：核心工具链已经处在前沿（React 19.3.1、Vite 8.3.8、Tailwind 4.3.5、Motion 14.14、Electron 45、@xyflow/react 13、TS 7 native），比多数开源竞品更新。真正的差距不在版本号，主要有六处：

- 交互范式：缺少 Trace、审批、计划、后台任务这类 Agent 交互层。
- MCP Apps：还没有宿主渲染能力。
- 原语层：22 个 @radix-ui 包，而行业默认已转向 Base UI。
- 虚拟化：package.json 里没有任何虚拟化库。
- 路由：react-router 7，v8 已发布。
- browserslist：Chrome 111 / Safari 16.4 的下限挡住了 field-sizing、anchor positioning、scroll-driven animations 等已 Baseline 的 CSS 能力（Electron 壳内不受此限）。

### 产品范式

#### Composer / 输入区：输入框就是能力路由：一个 + 菜单统一承载附件、连接器、工具开关和模式切换（Chat 与 Task/Agent/Plan 互切）

置信度：high

头部产品把选知识库、选工具、开联网/深度研究、切换 Agent 等操作都收进输入框上的 + 菜单和 chip。模式切换在 composer 内完成，不再跳转到独立页面或设置页；Agent/Task 已经与 Chat 并列，部分产品甚至设为默认入口。对企业 RAG/Agent 平台，知识库、MCP 工具、技能、搜索应用、深度研究都应以 composer chip + popover 的方式出现，并支持把一次对话一键升级为后台任务。

例子：

- ChatGPT Atlas：在输入框的 + 菜单里选 Agent mode
- Codex app：Add 菜单可附加文件、文件夹、Chrome，也能开 Plan mode、设定持续目标（goal）
- Gemini：首页 Chat 与 Task 切换（2026-11-17 起在 6 国免费）
- Claude：Chat 与 Cowork 共用一个界面，用模式开关切换
- Cherry Studio 2.0.10：新用户的默认入口改为 Agent

来源：

- <https://help.openai.com/en/articles/12628199-chatgpt-atlas-agent-mode>
- <https://learn.chatgpt.com/docs/features>
- <https://blog.google/innovation-and-ai/products/gemini-app/tasks-in-gemini-free-new-features/>
- <https://thenewstack.io/?p=22829037>
- <https://www.80aj.com/2026/08/29/cherry-studio-agent-default-entry/>

#### 模型 / 模式选择器：从挑模型变成挑力度：Auto 路由，加上推理强度档位和场景模式

置信度：high

一级控件变成快/深和问答/计划/执行两组选择，具体模型名退到二级菜单。模型网关型产品可以这样分层：一级只放 Auto、推理档位和模式；二级展开提供商与模型，附 ProviderLogo、上下文长度、价格和速率标签；回答气泡上再标注实际使用的模型和耗时。DeepSeek 自动路由那条只有一个二手来源。

例子：

- ChatGPT 输入框下拉：Light / Standard / Extended / Heavy 思考时长
- DeepSeek：Instant / Expert 模式 + DeepThink 开关（单一二手来源称 2026-09 起改为自动判断复杂度）
- Cursor：Agent / Ask / Plan / Debug 四种模式
- RAGFlow 0.26.4：Agent 画布里每个 LLM 节点可单独控制 thinking 模式

来源：

- <https://www.techradar.com/ai-platforms-assistants/chatgpt/you-can-now-toggle-gpt-5s-thinking-time-for-faster-or-smarter-answers-heres-how-to-do-it>
- <https://www.scmp.com/tech/policy/article/3349345/chinas-deepseek-adds-instant-and-expert-chatbot-modes-ahead-much-awaited-v4-release>
- <https://www.cursorforpms.com/guides/cursor-modes-explained>
- <https://newreleases.io/project/github/infiniflow/ragflow/release/v0.26.4>

#### 推理展示：推理和工具步骤合并成一个可折叠的 Trace：默认显示摘要，展开后可逐步审计，并提供详略档位

置信度：high

标准做法是正文之上放一行状态（如 Thought for 12s · 3 tools），点开后看到结构化步骤树，原始 chain-of-thought 不直接铺开。Trace 同时承载 reasoning、tool、source 和 subagent 四类 part；用户可选择只看结果（Summary）或审计全过程（Verbose）。

例子：

- shadcn Trace（2026-10）：推理、工具、来源、计划、子 Agent 各占一行，带 running/error/pending 状态，可嵌套，可展开为 dialog/sheet
- AnythingLLM 1.16.1：多段 thinking 和 tool call 卷成一个可折叠元素
- Claude Code desktop：Verbose / Normal / Summary 三档视图，会话中可随时切换
- Perplexity Comet：sidecar 面板展示推理过程，可跟随工作流进展

来源：

- <https://ui.shadcn.com/docs/changelog/2026-10-ai-elements>
- <https://docs.anythingllm.com/changelog/v1.16.1>
- <https://claude.com/blog/claude-code-desktop-redesign>
- <https://www.thehansindia.com/technology/tech-news/perplexitys-comet-assistant-gets-major-upgrade-with-more-transparency-control-and-safety-1023610>

#### Agent 计划与进度：Plan 模式加上可见的 todo/步骤清单：先出计划、可审可改，再执行，每一步的状态实时更新

置信度：high

计划是一张可编辑卡片（步骤列表，可勾选、改写或删步），批准后转为执行；执行中每步带状态，可回滚到 Checkpoint。对 Agent 工作流平台来说，运行（Run）的计划视图应和画布节点双向联动。

例子：

- Codex app：Add 菜单里的 Plan mode 开关
- Cursor：Plan 模式
- Claude Cowork：每步有进度指示，侧栏列出子任务与状态，开工前展示要读哪些文件的计划
- shadcn AI Elements：Plan / Task / Queue / Checkpoint 模式

来源：

- <https://learn.chatgpt.com/docs/features>
- <https://support.claude.com/articles/13345190>
- <https://ui.shadcn.com/docs/changelog/2026-10-ai-elements>
- <https://www.cursorforpms.com/guides/cursor-modes-explained>

#### 工具调用与审批：工具调用做成卡片，按工具粒度审批（needsApproval / Always allow / 权限档位），关键动作前暂停确认

置信度：high

工具卡片的默认状态是折叠一行（图标、工具名、参数摘要、耗时、状态），可展开看入参和出参（长输出用小号 Code Block）。危险工具显示审批条，提供允许一次、始终允许、拒绝并说明原因三个选项。审批记录需要可审计。

例子：

- AI SDK 6：工具 part 进入 approval-requested 状态，用 addToolApprovalResponse 回应
- TanStack AI 1.0：审批作为 interrupt，通过 chat hook 解决
- Gemini Tasks：关键步骤（如点击购买）前暂停确认，常规动作可设为 Always allow
- Codex app：Agent approvals、权限配置档、Auto-review
- LibreChat 0.8.9：审批提示更清晰；MCP Apps 规范允许宿主要求 UI 发起的工具调用先经用户批准

来源：

- <https://ai-sdk.dev/docs/announcing-ai-sdk-6-beta>
- <https://tanstack.com/blog/tanstack-ai-1-0>
- <https://blog.google/innovation-and-ai/products/gemini-app/tasks-in-gemini-free-new-features/>
- <https://www.librechat.ai/changelog/v0.8.9>
- <https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx>

#### 澄清提问 / Human-in-the-loop：模型主动停下来问：结构化选择题或问卷内联在消息流中，不遮住输入框

置信度：high

澄清是消息流中的一张交互卡（单选、多选、表单、跳过），提交后折叠成一行可回看的答案。MCP 的 elicitation 表单也应复用这个组件。

例子：

- LibreChat 0.8.9：Ask User 问题改为内联在对话中，不再覆盖 composer
- shadcn Questionnaire（2026-08）多步问答组件，以及 @shadcn/helpers 的 Human in the Loop 模拟
- Claude in-chat visuals：可用交互式多选输入提出结构化问题
- Open WebUI v0.11.1：The Model Learns to Stop and Ask

来源：

- <https://www.librechat.ai/changelog/v0.8.9>
- <https://ui.shadcn.com/docs/changelog>
- <https://www.theregister.com/2026/03/13/claude_charts_a_new_course/>
- <https://www.openwebui.com/blog>

#### 对话内生成式 UI：答案正文里内联临时的交互式可视化（HTML/SVG 小组件），和持久化的 Artifact 分开

置信度：high

Claude 官方明确了两者的分工：内联可视化用来解释，会随对话变化或消失；Artifact 是可分享、可下载的持久成果。对 RAG 平台，数据类问答（统计、对比、流程）可内联图表或流程图卡片，用户点击后再提升为 Artifact。Gemini 两项功能 2026 年的状态未核实。

例子：

- Claude 对话内交互图表、示意图（2026-03-12 beta，所有计划默认开启；2026-04-22 扩展到 Cowork）
- Gemini Dynamic View / Visual Layout 实验（按提示生成定制界面或杂志式排版）
- ChatGPT GPT-Live（2026-07）语音对话中显示天气、股票、体育等视觉卡片

来源：

- <https://claude.com/blog/claude-builds-visuals>
- <https://www.testingcatalog.com/gemini-gets-agent-mode-visual-layout-and-dynamic-view/>
- <https://www.androidauthority.com/openai-gpt-live-voice-model-3685616/>

#### Artifacts / Canvas / 产出物：侧边 Artifact 工作区：持久、可编辑、有版本、可分享，并且可以绑定数据源自动刷新；Agent 的产出物扩展到网站、幻灯片和表格

置信度：medium

Artifact 已经从代码预览升级为活文档：带数据源绑定、版本历史、协作和公开链接。对知识库平台，基于知识库生成的报告或表格应能绑定知识库或搜索应用并定时刷新。Live Artifacts 等细节来自二手更新日志。

例子：

- Claude Artifacts：全计划可用，新增 Sheets、Whiteboards 等类型；Live Artifacts 从连接器刷新
- ChatGPT Space：文档、幻灯片、表格、网站工作区；Pages 可借 Gmail/Slack 刷新，2026-11 扩展到 Plus
- Kimi Agent：Websites 与 Slides 为核心产出（Slides 有 Adaptive / Visual 模式）
- Vercel Chatbot：Artifacts 侧边面板支持 code、text、sheet；LibreChat：Artifact 版本控制与分享视图

来源：

- <https://www.tomsguide.com/ai/chatgpt/chatgpt-just-got-a-massive-upgrade-it-can-now-create-documents-that-update-themselves>
- <https://www.gradually.ai/en/changelogs/claude/>
- <https://www.kimi.com/help>
- <https://vercel.com/templates/next.js/chatbot>
- <https://www.librechat.ai/changelog/v0.8.1>

#### 嵌入式应用（MCP Apps）：MCP Apps 成为跨宿主的对话内应用标准：工具通过 \_meta.ui.resourceUri 指向 ui:// 资源，在沙箱 iframe 中渲染；展示方式有 inline、fullscreen、PiP 三种

置信度：high

消息流里出现第三方交互 UI 已成主流。UI 发往宿主的消息都走可记录的 JSON-RPC，宿主可以对 UI 发起的工具调用要求审批，服务端必须提供纯文本降级。平台已有 MCP 服务器模块，作为宿主渲染 MCP Apps 是补齐生成式 UI 成本最低的路径。

例子：

- MCP Apps 扩展（SEP-1865），2026-01-26 稳定，宿主包括 Claude、ChatGPT、VS Code、Goose、Postman
- ChatGPT：官方文档称实现开放 MCP Apps 标准，window.openai 只用于结账、模态框等扩展
- Apps SDK UI 指南：inline 卡片/轮播；fullscreen 下 composer 保留；PiP 用于持续会话
- LibreChat 0.8.9 与 assistant-ui 已支持 MCP Apps 渲染

来源：

- <https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx>
- <https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/>
- <https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt>
- <https://developers.openai.com/apps-sdk/concepts/ui-guidelines>

#### 连接器 / MCP 目录：连接器目录（官方 Directory 加自定义远程 MCP），OAuth 走 URL 模式 elicitation 在浏览器中完成，并出现交互式连接器

置信度：medium

连接器管理页需要展示：能力（tools、resources、ui、tasks 扩展）、认证状态、按工具的启用和审批策略、最近调用日志。2026-07-28 修订后，管理 UI 要能识别协议版本和扩展协商结果。Claude 侧的细节来自二手更新日志。

例子：

- Claude：Customize > Connectors 目录 + 自定义远程 MCP；11 月新增 Adobe、Atlassian 等交互式连接器
- MCP 2025-11-25 加入 URL-mode elicitation（敏感流程如 OAuth 在浏览器完成），2026-07-28 修订移除 elicitationId 等字段
- MCP 2026-07-28 修订：协议改为无状态，Tasks 移入官方扩展，Roots/Sampling/Logging 弃用

来源：

- <https://releasebot.io/updates/anthropic/claude>
- <https://modelcontextprotocol.io/specification/2026-07-28/changelog>
- <https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/>

#### 技能（Skills）：Skills 是可安装的能力包，遵循 SKILL.md 开放标准，并与插件、MCP 一起打包分发

置信度：high

技能市场 UI 的通行要素：卡片（图标、作者、适用场景、权限）、一键安装、按 Agent 或项目启用、版本更新提示、按标准格式导入导出。平台的技能模块应兼容 SKILL.md 目录结构。

例子：

- Agent Skills 标准（agentskills.io）2025-12 发布，后捐赠给 Agentic AI Foundation，称已有 70+ 平台集成
- Codex/ChatGPT：Skills & Plugins，与 Codex 共用同一技能格式
- LibreChat 0.8.8：实验性 Agent Plugins，打包 Skills 与 MCP 服务器
- LobeHub 2.0：Agent Builder 一次生成工具、技能和人设

来源：

- <https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation>
- <https://developers.openai.com/codex/skills>
- <https://releasebot.io/updates/librechat>
- <https://lobehub.com/changelog/2026-01-27-v2>

#### 记忆：记忆透明且可编辑：按主题列出，可内联纠正，能解释某条回答用到了哪些记忆，支持无痕对话或单个对话关闭记忆

置信度：medium

记忆 UI 的三个要点：可见（列表或摘要）、可控（编辑、删除、关闭、无痕）、可溯源（回答旁标注使用了哪条记忆）。企业版还要考虑合规默认值，例如受监管工作区默认关闭。

例子：

- ChatGPT 新记忆：自动增删、记忆摘要、在 sources 中解释记忆为何影响回答、自动管理优先级（Plus/Pro）
- Claude：Settings > Memory 中按 Topics 列出，可编辑删除；incognito 对话不进入记忆；可对单个对话关闭记忆
- LobeHub 2.0 Agent Memory；RAGFlow 0.25 用户级 Memory（按 User ID 隔离）

来源：

- <https://help.openai.com/en/articles/8590148-memory-faq>
- <https://support.claude.com/en/articles/11817273-use-claude-s-chat-search-and-memory-to-build-on-previous-context>
- <https://lobehub.com/changelog/2026-01-27-v2>
- <https://ragflow.io/blog/ragflow-0.25-ingestion-pipeline-agent-sandbox-and-user-level-memory>

#### 项目 / 工作区：Project 是上下文容器（共享指令、文件库、记忆），并开始承载并行线程和协调者

置信度：medium

项目页应同时呈现指令、知识（知识库或文件）、记忆、产出物库和运行中的线程，不只是一个对话文件夹。对企业平台，项目可以映射为团队空间加上默认知识库和默认 Agent。

例子：

- Claude Code Projects（2026-09-17 beta）：协调者拆分工作流、分派并行会话，项目级共享记忆，文件和 Artifact 统一放在库里
- LibreChat 0.8.9：Chat Projects，带共享指令与参考文件
- ChatGPT：移动端可固定 Projects、Codex、Images 等入口

来源：

- <https://venturebeat.com/2026/09/17/anthropic-launches-claude-code-projects-an-always-on-conversation-that-remembers-and-delegates-your-long-running-dev-work/>
- <https://www.librechat.ai/changelog/v0.8.9>
- <https://www.scriptbyai.com/timeline-of-chatgpt/>

#### 深度研究报告：深度研究成果用全屏报告视图呈现（目录、来源面板、导出），研究过程步骤可回看

置信度：medium

研究类结果的形态是文档而不是长消息：独立阅读视图、目录跳转、来源列表可筛选、导出。过程（检索查询、阅读页面）放进 Trace，默认折叠。平台的搜索应用和深度研究可以直接套用这一形态。

例子：

- ChatGPT Deep Research（2026-02）：全屏文档查看器，带目录和来源面板，可导出 PDF/Word/Markdown
- Gemini：对话与研究详情双栏，成稿和步骤放在副栏
- DeepSeek API（2026-11）：deep thinking search 在多步推理中搜索并阅读网页

来源：

- <https://www.androidheadlines.com/2026/02/chatgpt-deep-research-full-screen-document-viewer-update.html>
- <https://levelup.gitconnected.com/deep-research-uis-perplexity-vs-manus-vs-chatgpt-vs-gemini-4740ca01365a>
- <https://api-docs.deepseek.com/news/news261113>

#### 引用与证据（RAG 核心）：引用是可交互的：内联编号、悬停卡片、来源面板，并直达原文片段

置信度：high

有来源面板不等于引用准确，所以 RAG 产品应把证据链做成一等公民：悬停显示片段原文，点击打开文档预览并高亮命中位置，标注检索得分或置信度，标出未被引用支撑的句子。这是企业 RAG 相对通用聊天产品的差异化点。

例子：

- Perplexity：内联编号引用加上每条回答顶部的来源面板
- shadcn AI Elements：Inline Citation 与 Sources 模式
- DeepSeek：非思考模式联网搜索附带引用
- arXiv（2026-05）：商用模型引用幻觉率仍在 11–57%

来源：

- <https://dev.to/franciscomoretti/deep-research-uis-perplexity-vs-manus-vs-chatgpt-vs-gemini-5cc2>
- <https://ui.shadcn.com/docs/changelog/2026-10-ai-elements>
- <https://api-docs.deepseek.com/news/news261113>
- <https://arxiv.org/html/2605.06635>

#### Computer / Browser use 视图：Agent 有自己的电脑视图：实时屏幕或浏览器画面，用户随时可接管，关键操作前确认，事后可回放

置信度：high

视图要素包括实时画面（或截图流）、当前动作高亮、接管与交还按钮、动作时间线（可回放），以及把敏感动作交还用户的机制。如果平台的 Agent 有浏览器或沙箱工具，这类查看器是可信度的关键。

例子：

- Gemini Tasks：在隔离 VM 中运行，关键步骤暂停确认，可随时介入或交还屏幕；Mac 版 2026-11-19 获得 computer use
- Manus：Manus's Computer 视图和会话回放
- Comet：sidecar 跨多标签执行，行动前请求许可
- Open WebUI v0.13：Desktop/Browser 标签页，用户与模型共享桌面和浏览器

来源：

- <https://blog.google/innovation-and-ai/products/gemini-app/tasks-in-gemini-free-new-features/>
- <https://searchatlas.com/blog/manus-ai-agent-review/>
- <https://www.techradar.com/ai-platforms-assistants/gemini/perplexity-upgrades-comet-to-multitask-across-your-tabs>
- <https://openwebui.com/blog/v0-13-0-your-model-gets-a-computer>

#### 后台任务与通知：异步和后台运行：离开页面后继续执行，流可恢复，有通知收件箱，可跨设备查看

置信度：high

长任务不再占住对话框。UI 需要提供：运行列表（状态、耗时、成本）、全局通知中心、断线重连后接续流、完成后跳回对应会话。这对 Agent 工作流运行、知识库解析和批量评测同样适用。

例子：

- LibreChat 0.8.9：Background Responses（可查看、取消、恢复）以及可恢复的后台子 Agent 流
- Claude Cowork：会话在云端运行，可在 Web 和移动端接着看
- Codex app：Automations / Scheduled tasks 与 Notifications；Open WebUI 0.13：通知收件箱（含失败的自动化运行）
- Comet Background Assistant 仪表盘；Grok Tasks 定时任务；MCP Tasks 扩展（2026-07-28）

来源：

- <https://www.librechat.ai/changelog/v0.8.9>
- <https://www.eweek.com/news/claude-cowork-web-mobile-ai-agents/>
- <https://openwebui.com/blog/v0-13-0-your-model-gets-a-computer>
- <https://modelcontextprotocol.io/specification/2026-07-28/changelog>

#### 运行中控制：生成过程中可以 steer、queue、pause、resume，不必等回答结束再追加指令

置信度：medium

Agent 运行期间输入框不锁定：新消息可以选择插队纠偏（steer）或排在当前运行之后（queue），排队的消息显示为可编辑、可删除的待发卡片。

例子：

- LibreChat 0.8.9：生成过程支持 pause、resume、stop、steer、queue
- shadcn AI Elements：Queue 模式
- Gemini Tasks：执行中随时给新指令

来源：

- <https://www.librechat.ai/changelog/v0.8.9>
- <https://ui.shadcn.com/docs/changelog/2026-10-ai-elements>
- <https://blog.google/innovation-and-ai/products/gemini-app/tasks-in-gemini-free-new-features/>

#### 并行 Agent 管理：多会话或多 Agent 并行的管理台：侧栏列出运行中会话，用 worktree 或沙箱隔离，审阅 diff 后再合并

置信度：high

运行成为一等对象：会话侧栏显示状态徽标（运行中、待审批、完成、失败），产出走审阅流（diff、文件变更、产物）。对知识库和 Agent 平台，可以类比为批量解析、批量评测、多 Agent 运行的总览台。

例子：

- Codex app：并行线程、Worktree 线程、diff 面板可评论，有 Pinned/Projects/Recents 侧栏
- Claude Code desktop（2026-04-14 重设计）：并行会话，每个会话独立 worktree，逐文件审阅与行内评论
- Cursor 3 Agents Window（2026-04-02）：本地、云端、worktree、SSH Agent 统一列出

来源：

- <https://openai.com/index/introducing-the-codex-app/>
- <https://claude.com/blog/claude-code-desktop-redesign>
- <https://code.claude.com/docs/en/desktop>
- <https://www.datacamp.com/blog/cursor-3>

#### 多面板工作台：可拖拽的多面板工作台：对话旁并排放文件、终端、预览、diff、评论；可在预览上直接标注后发给 Agent

置信度：high

布局正在从固定三栏转向可组合的面板工作台。本地已有 react-resizable-panels，具备基础。各面板的状态（尺寸、打开的标签）应持久化为 UI 偏好。

例子：

- Claude Code desktop：聊天、终端、预览、diff、文件编辑器面板可拖拽布局，预览可打开 HTML/PDF
- Open WebUI v0.13：工作区标签（文件、终端、Artifact、预览、语音、评论），可重排、可展开
- Cursor 3 Design Mode：在渲染预览上标注元素后发给 Agent

来源：

- <https://claude.com/resources/articles/claude-code-desktop-redesign>
- <https://openwebui.com/blog/v0-13-0-your-model-gets-a-computer>
- <https://www.datacamp.com/blog/cursor-3>

#### 多 Agent 协作：群组对话或 Agent 团队：一个对话里多个专精 Agent 协作，或由一个总控 Agent 编排

置信度：medium

消息气泡需要标明是哪个 Agent 发言（头像、名称、颜色），群组设置页管理成员 Agent 与发言策略，Trace 中显示子 Agent 嵌套。部分信息来自厂商或二手来源。

例子：

- LobeHub 2.0（2026-01-27）：多 Agent 群聊
- LobeHub 2.2：Chief Agent Operator（二手来源）
- Genspark：并行任务通道，多个专职 Agent 共享文件（厂商自述）
- Langflow 1.11：支持 A2A 协议

来源：

- <https://lobehub.com/changelog/2026-01-27-v2>
- <https://aiidelist.com/blog/lobehub.md>
- <https://www.genspark.ai/alternative/manus>
- <https://langflow.org/blog/langflow-1-11>

#### 多模型对比：同一问题发给多个模型，并排展示回答以便比较

置信度：medium

对模型网关和评测场景很实用：并排列展示各模型回答，附耗时、token、成本，支持选出最佳答案继续对话。可与模型网关的路由和评测功能联动。

例子：

- Onyx v3.2（2026-04-09）：multi-model chat，一个 prompt 并行发给多个模型对比输出

来源：

- <https://docs.onyx.app/changelog>

#### Agent 构建器：Agent 构建从画布优先转向描述优先：用自然语言生成 Agent，画布退为高级视图；OpenAI 关停可视化的 Agent Builder

置信度：high

趋势是双轨：轻量 Agent 用对话或表单配置并可即时试聊，复杂编排仍用画布，但画布需要具备运行调试、人工检查点、版本发布。OpenAI 放弃 Agent Builder 说明，只有画布、没有代码出口的构建器不是终局。

例子：

- OpenAI：Agent Builder 2026-11-30 关停，新项目推荐用自建服务端加 ChatKit
- n8n Agents：给出指令、模型、工具即可得到 Agent，内置记忆、渠道、定时与发布；Chat Hub 区分 personal agents 和 workflow agents
- LobeHub 2.0 Agent Builder：用日常语言描述目标即可生成 Agent
- Langflow 1.11：Human-in-the-Loop 检查点与 AG-UI 流

来源：

- <https://developers.openai.com/api/docs/guides/chatkit>
- <https://community.n8n.io/t/introducing-n8n-agents-a-new-way-to-build-agents-you-set-up-once-and-use-anywhere/306323>
- <https://docs.n8n.io/build/ways-of-building-workflows/chat-hub>
- <https://lobehub.com/changelog/2026-01-27-v2>
- <https://langflow.org/blog/langflow-1-11>

#### 知识库摄取管道：知识摄取管道可视化：解析、切块、嵌入都是画布节点，可整条或逐步试运行，并查看每个节点的输入输出

置信度：high

知识库不再是上传后黑盒解析，而是可调试的管道：每个文档的解析状态、切块预览（带原文定位）、失败原因、重跑单节点。这是 RAG 平台的核心差异化界面。

例子：

- Dify Knowledge Pipeline（2.0 beta）：沿用 Workflow 画布体验，RAG ETL 全程可见，可 Test Run 逐步检查
- RAGFlow 0.25：ingestion pipeline 与 Agent 沙箱
- RAGFlow 0.24：Memory 抽取日志，Agent 会话管理

来源：

- <https://www.dify.ai/blog/introducing-knowledge-pipeline>
- <https://ragflow.io/blog/ragflow-0.25-ingestion-pipeline-agent-sandbox-and-user-level-memory>
- <https://milvus.io/ai-quick-reference/what-are-ragflow-v024-new-features>

#### 语音：语音融入主对话：实时转写，配合视觉卡片，不再是独立的全屏模式；听写不再有时长限制

置信度：high

语音是对话的一种输入输出模态，而不是另一个应用：转写回写到同一线程，语音中触发的工具和卡片照常渲染。

例子：

- ChatGPT Voice（2025-11-25）在当前聊天内使用，显示实时转写和地图、天气等信息
- GPT-Live-1（2026-07）：视觉卡片，可把任务委派给其他模型
- ChatGPT Live Dictation（2026-11-18）：去掉 10 分钟限制
- Open WebUI v0.13：语音通话作为工作区标签

来源：

- <https://techcrunch.com/2025/11/25/chatgpts-voice-mode-is-no-longer-a-separate-interface/>
- <https://www.androidauthority.com/openai-gpt-live-voice-model-3685616/>
- <https://help.openai.com/en/articles/6825453-chatgpt-release-notes>

#### 协作与分享：从分享链接升级为协作对象：选中文本评论、@提及、在线状态、通知、对外渠道

置信度：medium

企业场景里，对话和产出物需要能评审：评论线程、提及、权限（查看、评论、编辑）、对外渠道（IM 机器人）。

例子：

- Open WebUI v0.13：在对话或笔记上选中文本评论并 @队友，配通知收件箱；v0.12.x：笔记实时在线状态
- ChatGPT Space Pages 支持协作
- LibreChat 0.8.9：Agent Channels（Slack 集成，带审批与反馈）
- Claude Artifacts：公开分享链接

来源：

- <https://openwebui.com/blog/v0-13-0-your-model-gets-a-computer>
- <https://learn.chatgpt.com/docs/features>
- <https://www.librechat.ai/changelog/v0.8.9>
- <https://medium.com/@boredhead/everything-claude-has-shipped-in-2026-full-reference-65341c1cea30>

#### 用量与上下文透明：展示 token 去向、上下文窗口占用和成本，遥测不包含 prompt 内容

置信度：medium

输入框旁显示上下文用量环，会话或项目级显示用量和成本面板。模型网关平台天然有这些数据。遥测应与凭证和 prompt 内容隔离。

例子：

- Open WebUI v0.12.5：会话分析，显示 token 花在哪里
- shadcn AI Elements：Context 模式（上下文占用）
- Langflow 1.12：OpenTelemetry 导出，不发送 prompt 和 completion

来源：

- <https://www.openwebui.com/blog>
- <https://ui.shadcn.com/docs/changelog/2026-10-ai-elements>
- <https://langflow.org/blog/langflow-1-12>

#### 可访问性：流式对话可被读屏完整跟随；生成式 UI 协议开始内建无障碍语义

置信度：medium

流式内容需要节流的 aria-live 播报，步骤和工具卡片要能用键盘操作，动效遵循 prefers-reduced-motion。这是开源项目近期补齐的方向。

例子：

- Open WebUI v0.12.4：读屏可从头到尾跟随一段对话
- A2UI 1.0（2026-11-11）：新增无障碍支持

来源：

- <https://www.openwebui.com/blog>
- <https://developers.googleblog.com/en/a2ui-1-0-generative-ui>

### 开源项目

#### LobeHub (LobeChat, lobehub/lobehub v2.3.4)

**技术栈**：Next.js \~16.3，React 19.2.7，Vite 8（dev），react-router ^8.3；@lobehub/ui 6（emotion 体系）、@floating-ui、StyleX、lucide；Zustand 5、SWR、TanStack Query、tRPC 11；react-markdown 10、shiki 4、partial-json；虚拟化用 virtua 和 react-virtuoso；motion ^14；基于 Lexical 0.42 的 @lobehub/editor，yjs 协同

**界面要点**：2.0（2026-01-27）：多 Agent 群聊、用自然语言生成 Agent 的 Agent Builder、Pages 文档、文件夹式知识、Agent Memory、Agent 市场与 remix。2.2 加入 Chief Agent Operator（二手来源）。仓库已从 lobe-chat 更名为 lobehub。

来源：

- <https://raw.githubusercontent.com/lobehub/lobehub/main/package.json>
- <https://lobehub.com/changelog/2026-01-27-v2>
- <https://aiidelist.com/blog/lobehub.md>

#### Open WebUI (v0.13.4)

**技术栈**：SvelteKit 2，Svelte 5，Tailwind 4，bits-ui 2，Vite 5；marked、shiki 4、mermaid、katex；Tiptap 3；@xyflow/svelte；i18next

**界面要点**：v0.11 从头重做界面：对话列更窄、字重更轻、菜单统一、输入框描边、侧栏重建、换新图标集。v0.12.x：读屏可跟随对话、笔记实时在线状态、token 去向分析。v0.13（2026-11-04）：工作区标签（终端、浏览器、文件、桌面）、Git 面板、/btw 侧聊、选中文本评论加 @提及、通知收件箱。

来源：

- <https://raw.githubusercontent.com/open-webui/open-webui/main/package.json>
- <https://openwebui.com/blog/v0-11-0-the-interface-reorganized>
- <https://openwebui.com/blog/v0-13-0-your-model-gets-a-computer>

#### LibreChat (v0.8.9, 2026-11-17)

**技术栈**：React 18，Vite 8，Tailwind 4.3；Radix、Ariakit、Headless UI 三种原语混用；Recoil、Jotai、SWR、TanStack Query v4；react-markdown 9、rehype-katex；Sandpack 渲染 Artifacts；TanStack Virtual、react-virtualized；framer-motion 12。属于历史包袱较重的混合栈。

**界面要点**：MCP Apps 与更清晰的工具审批、Tool Search、Chat Projects、内联 Ask User、pause/resume/steer/queue、Background Responses、可恢复的子 Agent 流、Agent Channels（Slack，beta）、Passkeys。0.8.5 重做了侧栏和工具调用 UI。2026 路线图包括 Admin Panel 和 Agent Skills。

来源：

- <https://raw.githubusercontent.com/danny-avila/LibreChat/main/client/package.json>
- <https://www.librechat.ai/changelog/v0.8.9>
- <https://www.librechat.ai/blog/2026-02-18_2026_roadmap>

#### Cherry Studio (v2.2.3)

**技术栈**：Electron 45，electron-vite 6 beta，Vite 8，React 19.3，Tailwind 4.3，少量 Radix 原语；TanStack Router、SWR；AI SDK 6；Streamdown ^2.5 加 unified/remark；TanStack Virtual 与 virtua；motion 12；Tiptap 3 与 CodeMirror；drizzle、better-sqlite3、sqlite-vec 本地存储

**界面要点**：2.0（2026-08）大规模重写：Agent 会话有独立运行时，执行状态持久化，工具审批下沉到底层。2.0.10 把 Agent 设为默认入口，并加入沙箱化本地 Mini App。2.1.5 支持 MCP SDK v2 的交互请求、表单校验、取消和结构化结果。和本仓同为 Electron 桌面形态，最值得对标。

来源：

- <https://raw.githubusercontent.com/CherryHQ/cherry-studio/main/package.json>
- <https://www.aicoin.com/en/news-flash/3016684>
- <https://newreleases.io/project/github/CherryHQ/cherry-studio/release/v2.1.5>

#### Dify (web 1.20.0)

**技术栈**：Next.js，React，Tailwind 4，@base-ui/react；Zustand、Jotai、zundo、TanStack Query；reactflow；Streamdown 与 @streamdown/math；Lexical；TanStack Virtual；motion（版本由 pnpm catalog 管理）

**界面要点**：Knowledge Pipeline 把 RAG ETL 放到与 Workflow 相同的画布上，可逐步试运行。2.0 beta 引入基于队列的图引擎。前端已采用 Base UI 和 Streamdown，与本仓（Radix 加 x-markdown）形成直接对照。

来源：

- <https://raw.githubusercontent.com/langgenius/dify/main/web/package.json>
- <https://www.dify.ai/blog/introducing-knowledge-pipeline>
- <https://newreleases.io/project/github/langgenius/dify/release/2.0.0-beta.1>

#### RAGFlow (v0.27.x)

**技术栈**：React 18，Vite 7，Tailwind 3，Radix 与 shadcn 式组件（cva、cmdk、sonner）；Zustand 4、TanStack Query 5；@xyflow/react 12 加 @antv/x6、@antv/g6；react-markdown 9、rehype-katex；Lexical 0.45；i18next 23

**界面要点**：Agent 画布可按 LLM 节点控制思考模式（0.26.4）；ingestion pipeline 与 Agent 沙箱，用户级记忆（0.25）；Memory 抽取日志与会话管理（0.24）；0.27 大规模改动包括 Go 后端和前端 UI。

来源：

- <https://raw.githubusercontent.com/infiniflow/ragflow/main/web/package.json>
- <https://ragflow.io/blog/ragflow-0.25-ingestion-pipeline-agent-sandbox-and-user-level-memory>
- <https://github.com/infiniflow/ragflow/releases>

#### n8n

**技术栈**：Vue 3，Element Plus，Reka UI 2.5（@n8n/design-system 2.48），markdown-it，@tiptap/markdown，Vite

**界面要点**：2.0 是加固版本（草稿与发布分离）。Chat Hub 在 2.1 推出 beta：集中聊天入口，personal agents 与 workflow agents 分开，并有独立的 Chat user 角色。n8n Agents 提供 Agent Builder，内置记忆、渠道、定时与发布。另有一个专门搭建工作流的 AI assistant Agent。

来源：

- <https://raw.githubusercontent.com/n8n-io/n8n/master/packages/frontend/%40n8n/design-system/package.json>
- <https://docs.n8n.io/build/ways-of-building-workflows/chat-hub>
- <https://community.n8n.io/t/introducing-n8n-agents-a-new-way-to-build-agents-you-set-up-once-and-use-anywhere/306323>

#### Langflow

**技术栈**：React 19.2，Vite 7，Tailwind 3.4，Radix 加 shadcn；@xyflow/react 12（仍残留 reactflow 11）；Zustand 4、TanStack Query 5；react-markdown 9；framer-motion 11

**界面要点**：1.11：Human-in-the-Loop 检查点、A2A 协议、Workflow API 的 AG-UI 流。1.12：OpenTelemetry（不发送 prompt 和 completion）。1.10 推出桌面版。最近一次大的界面改版在 1.1（2024-11）。

来源：

- <https://raw.githubusercontent.com/langflow-ai/langflow/main/src/frontend/package.json>
- <https://langflow.org/blog/langflow-1-11>
- <https://langflow.org/blog/langflow-1-12>

#### Flowise (ui 3.1.4)

**技术栈**：React 18，Vite 5，MUI 5.15，reactflow 11，Redux 与 RTK，react-markdown 8，Tiptap markdown

**界面要点**：AgentFlow V2 强调显式编排，V1 已弃用。整体技术栈明显偏旧（MUI 5、reactflow 11），可作为技术选型的反面参照。有单一二手来源称其被 Workday 收购，未核实。

来源：

- <https://raw.githubusercontent.com/FlowiseAI/Flowise/main/packages/ui/package.json>
- <https://docs.flowiseai.com/using-flowise/agentflowv2>
- <https://dev.to/gautammanak1/flowise-deep-dive-23c9>

#### AnythingLLM

**技术栈**：React 18，Vite 4，Tailwind 3，Tremor，Phosphor icons，@lobehub/icons，markdown-it，highlight.js，DOMPurify。无虚拟化库，栈偏旧。

**界面要点**：Agent Flows 可视化画布；Desktop Assistant 屏幕悬浮层（1.11）；多段 thinking 与工具调用合并为一个可折叠元素（1.16.1）；任务收件箱重做，支持托盘常驻（1.20）。

来源：

- <https://raw.githubusercontent.com/Mintplex-Labs/anything-llm/master/frontend/package.json>
- <https://docs.anythingllm.com/changelog/v1.16.1>
- <https://docs.anythingllm.com/changelog/v1.20.0>

#### Onyx (原 Danswer)

**技术栈**：Next.js 16.4，React 19.2，Tailwind 4.3，Radix 系列原语，@floating-ui，SWR、Zustand，@tanstack/react-table，react-markdown 9 与 unified 管线，katex，motion 12

**界面要点**：面向企业搜索加聊天加 Agent，提供 40+ 数据源连接器。v3.2（2026-04-09）推出多模型并排对比聊天；3.0.x 统一了搜索与聊天。定位与本仓的企业 RAG 最接近。

来源：

- <https://raw.githubusercontent.com/onyx-dot-app/onyx/main/web/package.json>
- <https://docs.onyx.app/changelog>
- <https://raw.githubusercontent.com/onyx-dot-app/onyx/main/README.md>

#### Vercel Chatbot (vercel/chatbot) 与 AI Elements

**技术栈**：Chatbot：Next.js、AI SDK、shadcn/ui、Vercel AI Gateway、Auth.js。AI Elements：shadcn registry 形式的复制粘贴组件，面向 React 19 和 Tailwind 4，只支持 CSS Variables 模式。

**界面要点**：Chatbot 自带 Artifacts 侧边面板（code、text、sheet）。AI Elements 的 README 已声明迁往 shadcn/ui，2026-11 底弃用。shadcn 版 AI Elements（2026-10）有 21 个模式：Chain of Thought、Checkpoint、Confirmation、Context、Inline Citation、Model Selector、Plan、Prompt Input、Queue、Reasoning、Sources、Subagent、Task、Terminal、Tool 等，配合新的 Trace 和 Code Block，支持 Base UI、Radix、React Aria 三种底层和 8 种风格。

来源：

- <https://vercel.com/templates/next.js/chatbot>
- <https://github.com/vercel/ai-elements>
- <https://ui.shadcn.com/docs/changelog/2026-10-ai-elements>

#### assistant-ui

**技术栈**：受 Radix 启发的无样式 React 原语（ThreadPrimitive、MessagePrimitive、ComposerPrimitive），配 shadcn 主题；适配 AI SDK、LangGraph 等运行时；另有 React Native、React Ink（终端）版本

**界面要点**：Tool UI：把工具载荷渲染为审批、表单、表格、图表；支持 MCP Apps 渲染、工具展示提示与分组、Checklist 原语、tw-shimmer 流式微光效果。已进入 Thoughtworks 技术雷达。

来源：

- <https://www.assistant-ui.com/changelog?page=2>
- <https://github.com/assistant-ui/tool-ui>
- <https://assistant-ui.com/blog/2026-03-launch-week>
- <https://www.thoughtworks.com/radar/languages-and-frameworks/assistant-ui>

#### CopilotKit / AG-UI

**技术栈**：AG-UI：开放的事件式 Agent 与前端交互协议，包含 RUN、TEXT_MESSAGE、TOOL_CALL、STATE 等事件。CopilotKit：React 组件与运行时。

**界面要点**：把生成式 UI 分为三类：静态（AG-UI）、声明式（A2UI / Open-JSON-UI）、开放式（MCP Apps）。据称已被 Microsoft Agent Framework、AWS Bedrock AgentCore 接入，TanStack AI 1.0 完全兼容，Langflow 1.11 支持 AG-UI 流。采用数据多为厂商自述。

来源：

- <https://copilotkit.ai/blog/ag-ui-and-a2ui-explained-how-the-emerging-agentic-stack-fits-together>
- <https://aws.amazon.com/blogs/machine-learning/build-generative-ui-for-ai-agents-on-amazon-bedrock-agentcore-with-the-ag-ui-protocol/>
- <https://tanstack.com/blog/tanstack-ai-1-0>

#### Google A2UI (1.0, 2026-11-11)

**技术栈**：声明式 UI 意图协议，由 Agent 输出组件树和数据模型。渲染器：React、Angular、Lit（共用 web-core）、Flutter、SwiftUI；Jetpack Compose 仍为 v0.9.1。

**界面要点**：1.0 新增双向函数调用（例如选择器可实时查询可用性）、无障碍支持和元数据扩展。Web 与 Flutter 渲染器可在 MCP Apps 内运行，因此能出现在 Claude、Gemini 等助手中。v0.9（2026-04）首次推出官方 React 渲染器。

来源：

- <https://developers.googleblog.com/en/a2ui-1-0-generative-ui>
- <https://developers.googleblog.com/en/a2ui-v0-9-generative-ui/>
- <https://github.com/google/A2UI>

#### MCP Apps / mcp-ui

**技术栈**：规范为 modelcontextprotocol/ext-apps（2026-01-26 稳定），MIME 为 text/html;profile=mcp-app，通过 JSON-RPC 桥通信。宿主 SDK：@mcp-ui/client 的 AppRenderer（React）和底层 AppFrame，采用双层 iframe 沙箱。服务端用 registerAppTool / registerAppResource。

**界面要点**：第一个官方 MCP 扩展。工具结果可以渲染为交互 UI，要求提供纯文本降级，宿主可审批 UI 发起的工具调用。ChatGPT、Claude、VS Code 等已支持。对本仓 MCP 服务器模块，这是落地生成式 UI 最直接的标准。

来源：

- <https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx>
- <https://mcpui.dev/guide/client/app-renderer>
- <https://blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps/>

#### OpenAI ChatKit / Apps SDK

**技术栈**：ChatKit：可嵌入的聊天组件，带 widgets、工具调用、附件、思维链可视化，以及 Python 服务端 SDK。Apps SDK：以 MCP Apps 为基础，window.openai 作扩展（checkout、modal、文件、widget 状态），配可选的 @openai/apps-sdk-ui 组件库。

**界面要点**：Agent Builder 2026-11-30 关停，官方推荐自建服务端加 ChatKit 的高级集成。Apps SDK 指南定义了 inline 卡片与轮播、fullscreen（保留 composer）、PiP 三种展示模式和使用边界，可直接作为本仓插件和 MCP UI 的设计规范参考。

来源：

- <https://developers.openai.com/api/docs/guides/chatkit>
- <https://developers.openai.com/apps-sdk/concepts/ui-guidelines>
- <https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt>

### 技术雷达

- **Streamdown**（流式 Markdown 渲染 · trial）本仓用 @ant-design/x-markdown 2.10，它同样有 streaming 属性处理未闭合语法，没有必要仓促迁移。建议用真实模型回放（长表格、代码、Mermaid、公式）对 x-markdown 和 Streamdown 做卡顿与重排基准；如果之后采用 shadcn AI Elements 模式，Streamdown 与之最契合。
- **shadcn/ui（2026 版）**（组件分发 / 设计系统 · adopt）本仓 src/components/ui 本身就是 shadcn 风格（cva、tailwind-merge、Radix）。可以按需拉取 Trace、Code Block、Plan、Queue、Confirmation、Context、Inline Citation、Questionnaire 作为 patterns 层的起点，再套用本仓设计令牌，避免自研整套 Agent 交互组件。
- **Base UI (@base-ui/react)**（无样式原语 · trial）本仓依赖 22 个 @radix-ui/react-\* 包。建议新组件（Combobox、Autocomplete、Drawer、带过滤的菜单、模型选择器）直接用 Base UI；存有 Radix 组件不做全量迁移，借助 shadcn 的 migration skill 逐个组件迁移，并检查调用方兼容性。
- **Radix Primitives**（无样式原语 · hold）现有组件继续使用，不必大规模重写。新增原语不再优先选 Radix；可考虑把 22 个分散包收敛为统一的 radix-ui 包，以减少版本漂移。
- **React Aria（作为 shadcn 底层）**（无样式原语 / 无障碍 · assess）如果企业客户有严格的无障碍合规要求，可以评估，但不建议与 Base UI、Radix 三者并存。
- **Tailwind CSS 4.3**（样式 · adopt）本仓已是 4.3.5，处于前沿。可评估用原生 scrollbar 工具类替换 tailwind-scrollbar 插件；@container-size 和逻辑属性有助于面板化布局与 RTL。
- **React 19.3（ViewTransition、Fragment refs、Activity、useEffectEvent）**（框架 · adopt）本仓已是 19.3.1。可以直接用 \<Activity> 保活多会话或多面板标签（切走后流式状态和滚动位置不丢），用 \<ViewTransition> 做路由、面板、Artifact 展开动画，用 Trusted Types 加固 SafeHtml 和沙箱渲染路径。
- **React Compiler**（框架 / 构建 · trial）本仓有 @vitejs/plugin-react 6.3.0 和 eslint-plugin-react-hooks 7.1.1，具备试点条件。可先在聊天消息列表、Trace、画布节点等重渲染热点用注解模式或按目录启用，配合 Profiler 对比，不要一次性全局开启。
- **React Router 8**（路由 · trial）本仓使用 react-router-dom ^7.18.5，React、Node、Vite 版本均已满足 v8 要求，升级成本低。先清理 v7 的弃用警告，再把导入统一到 react-router。
- **TanStack Router / Start 1.0**（路由 / 全栈框架 · assess）对现有大型 react-router 应用，迁移收益主要在类型安全的 URL 状态（知识库筛选、搜索参数），成本高。建议先升级 React Router 8，TanStack Router 只作评估。
- **TanStack DB**（客户端数据 · assess）可用于大列表的本地增量过滤和乐观更新（知识库文档、会话列表、运行列表），但仍是 RC；本仓服务器状态已统一由 TanStack Query 管理，暂不引入。
- **TanStack AI 1.0**（AI 客户端 SDK · assess）本仓用 @ant-design/x-sdk 管理流式会话，后端是 Python 服务。如果后端能输出 AG-UI 事件，TanStack AI 的 headless chat 可以作为替换或对照；它的消息与审批模型也值得参考。
- **Vercel AI SDK 6/7（UI message parts）**（AI 客户端 SDK · assess）本仓后端不是 Node，不一定要直接引入。建议借鉴它的 parts 消息模型，统一流式事件到渲染组件的映射（reasoning、tool、source、approval），这样能与 shadcn Trace 和 AI Elements 无缝对接。
- **AG-UI 协议**（Agent 与前端事件协议 · trial）本仓用 eventsource-parser 自研 SSE 解析，聊天、Agent、搜索各有一套流。可以把 AG-UI 事件作为领域传输层的规范化目标（不一定改后端，在前端 adapter 中映射），减少流式分支。
- **MCP Apps + @mcp-ui/client**（生成式 UI / 嵌入 · trial）本仓有 MCP 服务器模块，聊天和 Agent 会调用工具。作为宿主渲染 MCP Apps 是补齐生成式 UI 最标准的路径，可复用现有沙箱 iframe 规范与 CSP，UI 发起的工具调用接入审批卡片。
- **A2UI**（生成式 UI（声明式） · assess）如果希望 Agent 产出的表单、卡片使用本仓设计令牌和组件，而不是第三方 HTML，可以评估 A2UI React 渲染器，把组件目录映射到 src/components/ui。
- **MCP 规范 2026-07-28**（协议 · adopt）MCP 服务器管理页应展示协议版本与扩展协商结果（是否支持 ui 和 tasks），提供 elicitation 表单和 URL 授权流程的 UI，并为 Tasks 提供运行状态与取消入口，与后台任务中心打通。
- **Agent Skills 标准（SKILL.md）**（Agent 能力格式 · adopt）本仓有技能模块。技能的导入、导出、预览和版本管理应兼容 SKILL.md 目录格式，避免私有格式锁定。
- **Motion 14**（动效 · adopt）本仓已是 14.14.0（领先 Onyx、Cherry Studio 的 12.x）。与 React \<ViewTransition> 二选一负责同一过渡，避免叠加；聊天流式区域用 LazyMotion 和 m 组件，并遵循 prefers-reduced-motion。
- **列表虚拟化：virtua / TanStack Virtual / react-virtuoso**（性能 · trial）本地 package.json 没有任何虚拟化库。长会话、知识库文档和切块列表、运行日志、Trace 列表在数据量大时会出现性能问题。聊天反向滚动建议试 virtua 或 TanStack Virtual 的 chat 方案，并与流式 Markdown 的高度变化联调。
- **Vite 8 + Rolldown / Vite+**（构建 · adopt）本仓已是 Vite 8.3.8 和 rolldown 1.3.2，处于前沿。Vite+ 只作观察。
- **Oxlint（含 type-aware）**（代码质量 · trial）本仓有 ESLint 10、typescript-eslint、jsx-a11y（vendor 版）、tailwind 插件和自定义 eslint-rules。可以先把 Oxlint 作为快速前置检查（lint-staged、CI 首段），自定义安全规则和 a11y 仍留在 ESLint，不要一次性替换。
- **Biome 2.x**（代码质量 / 格式化 · hold）本仓 Prettier（含 tailwind 插件）加 ESLint 自定义规则体系成熟，迁移到 Biome 收益有限，与 VoidZero 链路也不一致，暂不引入。
- **CSS field-sizing: content**（CSS 平台 · adopt）本仓 browserslist（Chrome ≥111、Firefox ≥128、Safari ≥16.4）低于支持线，只能渐进增强（不支持时回退为固定高度或现有 JS）；Electron 壳内可直接使用。Lexical 编辑器不适用，表单类 textarea 适用。
- **CSS Anchor Positioning + Popover**（CSS 平台 · trial）本仓浮层由 Radix 和 floating-ui 负责，短期无需替换；当 browserslist 提升后，可在简单 tooltip、悬停卡片上试用。
- **Scroll-driven animations**（CSS 平台 · trial）适合聊天区顶部和底部滚动阴影、回到底部按钮淡入、长报告阅读进度条；需在 @supports 下渐进增强。
- **View Transitions API（同文档）**（CSS 平台 · trial）可用于会话切换、Artifact 展开与收起、列表到详情的共享元素过渡。依赖 transition types 的方向性动画在 Firefox 需要回退。
- **@starting-style + transition-behavior: allow-discrete**（CSS 平台 · adopt）按本仓 browserslist（Safari 16.4）严格来说仍需降级，但降级效果只是没有动画，风险低。可替代部分为进场动画引入的 JS 或 Motion 用法。
- **Container queries（size 与 style）**（CSS 平台 · adopt）本仓走向可拖拽多面板布局，消息卡片、工具卡片、Artifact 在不同宽度的面板中应使用 @container 响应式；style queries 暂作评估。
- **Customizable select（appearance: base-select）**（CSS 平台 · assess）短期不适合替换 Radix Select 或 Base UI Select；等跨引擎支持后，可用于模型选择器这类带图标的下拉。
- **Ant Design X 2.x（x-sdk / x-markdown / x-card）**（AI 组件 / 流式 · trial）本仓只用了 headless 程度较高的 x-sdk、x-markdown、x-card，与 Tailwind 加 shadcn 体系并存。建议继续保留，但视觉层（Trace、工具卡片、审批）走本仓 patterns 层与设计令牌，避免引入 antd 组件造成两套视觉；同时以 Streamdown 作为渲染性能对照基准。

#### Streamdown（trial）

**最新**：v2.5（2026）。v2（2026-01-12）包体积减少 83.5%，语言包、主题、CSS 改为按需从 CDN 加载。Releasebot 显示 2026-11-17 有 @streamdown 作用域包更新，版本号未核实。

Vercel 出品，可直接替换 react-markdown。用 remend 引擎自动补全未闭合的 Markdown 语法，内置 Shiki、Mermaid、KaTeX。v2.4 增加 prefix 属性给 Tailwind v4 工具类加命名空间。Dify、Cherry Studio 已采用。LogRocket 基准结论是：只看流式特性无法预测实际速度，必须用自己的数据回放测试。

来源：

- <https://vercel.com/changelog/streamdown-2-5>
- <https://vercel.com/changelog/streamdown-2-4>
- <https://releasebot.io/updates/vercel/streamdown>
- <https://blog.logrocket.com/react-markdown-alternatives-benchmarking-3-streaming-renderers/>

#### shadcn/ui（2026 版）（adopt）

**最新**：2026-10：Trace、Code Block、AI Elements。2026-09：cn 独立成包。2026-08：Questionnaire、Human in the Loop、私有 GitHub registry。2026-07：Base UI 成为默认，React Aria 成为一等底层。2026-06：聊天组件（Message Scroller、Message、Bubble）。2026-03：CLI v4。新风格有 Luma、Sera、Rhea 等，共 8 种。

shadcn 已从组件集合演变为多底层（Base UI、Radix、React Aria）、多风格、带 preset、apply、eject 命令和 GitHub registry 的代码分发平台，并直接提供 Agent UI 模式（Plan、Queue、Confirmation、Context、Inline Citation、Subagent、Tool 等 21 个）。

来源：

- <https://ui.shadcn.com/docs/changelog>
- <https://ui.shadcn.com/docs/changelog/2026-10-ai-elements>
- <https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default>

#### Base UI (@base-ui/react)（trial）

**最新**：v1.9.0（2026-10-09）：菜单过滤预览，Combobox/Menu/Select 大列表挂载更快，Drawer 滑动与虚拟键盘改进。1.0 于 2025-12-11 发布。

由 MUI、Radix 和 Floating UI 的原作者团队维护，迭代快（每月一个 minor），包含 Combobox、Autocomplete、Drawer、OTPField、Toast 等 Radix 缺失或较弱的组件。shadcn 称其周下载量超过 600 万，已是新项目默认选项。Dify 已采用。

来源：

- <https://base-ui.com/react/overview/releases>
- <https://www.infoq.com/news/2026/02/baseui-v1-accessible>
- <https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default>

#### Radix Primitives（hold）

**最新**：由 WorkOS 维护。官方 releases 页面最近一条（2026-06-06）只是为内部 context 加 displayName。shadcn 已提供统一的 radix-ui 单包（2026-02）。

shadcn 明确表示 Radix 未弃用，会继续同时为两种底层发布组件；但 Radix 本身迭代缓慢，原维护者多已离开（社区文章）。

来源：

- <https://radix-ui.com/primitives/docs/overview/releases>
- <https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default>
- <https://dev.to/mashuktamim/is-your-shadcn-ui-project-at-risk-a-deep-dive-into-radixs-future-45ei>

#### React Aria（作为 shadcn 底层）（assess）

**最新**：2026-07 成为 shadcn/ui 一等组件底层；Trace、Code Block 提供 React Aria 版本

Adobe 维护，无障碍与国际化（含 RTL、日期等）最完整，API 风格与 Radix/Base UI 差异较大。

来源：

- <https://ui.shadcn.com/docs/changelog/2026-07-react-aria>

#### Tailwind CSS 4.3（adopt）

**最新**：v4.3（2026-05-08）及 4.3.x 补丁。Tailwind Labs 于 2026-09-09 宣布加入 Shopify。

4.3 新增一方滚动条工具类、zoom-\*/tab-\*、@container-size、更多逻辑属性工具类、更灵活的 @variant、4 套新的中性色板，webpack loader 提速约 2 倍。

来源：

- <https://tailwindcss.com/blog/tailwindcss-v4-3>
- <https://tailwindcss.com/blog>
- <https://newreleases.io/project/github/tailwindlabs/tailwindcss/release/v4.3.3>

#### React 19.3（ViewTransition、Fragment refs、Activity、useEffectEvent）（adopt）

**最新**：React 19.3（2026-09-09）：\<ViewTransition> 与 addTransitionType 稳定，Fragment refs 稳定，新增 browser()、Trusted Types 支持、在 RSC 中直接渲染 Context。\<Activity> 与 useEffectEvent 在 19.2 稳定，19.3 有修复。

ViewTransition 只对 Transition 更新生效（startTransition、Suspense reveal、useDeferredValue），可按方向区分动画。Activity 用于隐藏但保留状态的子树。Trusted Types 让 React 与 require-trusted-types-for 策略兼容。

来源：

- <https://react.dev/blog/2026/09/09/react-19-3>
- <https://x.com/reactjs/status/2097766969080680729>

#### React Compiler（trial）

**最新**：Babel 版 React Compiler v1 已稳定。Rust 移植版 2026-06 合入 React 主仓，仍属实验性。@vitejs/plugin-react 6.1+ 提供实验性原生支持（{ compiler: true }）。Oxc 已集成 Rust 版（oxc_react_compiler）。Rolldown 因二进制体积暂停集成。

自动 memo 化，可减少手写 useMemo/useCallback；Oxlint 已提供 Rust 原生的 Compiler lint 规则。

来源：

- <https://infoq.com/news/2026/07/meta-react-compiler-rust>
- <https://oxc.rs/blog/2026-08-18-react-compiler-support>
- <https://socket.dev/blog/rolldown-pulls-rust-react-compiler-integration>

#### React Router 8（trial）

**最新**：v8.0（2026-06-17），2026-10 已到 8.5.x。最低要求 React 19.2.7、Node 22.22、Vite 7+；middleware 默认开启；v6 和 Remix v2 宣告 EOL。

刻意保持低调的大版本：破坏性变更主要是最低版本要求和 future flag 转正。RouterProvider 改从 react-router/dom 导入。InfoQ 称改为 ESM-only，需要核实。LobeHub 已用 ^8.3。

来源：

- <https://remix.run/blog/react-router-v8>
- <https://infoq.com/news/2026/08/react-route-v8>
- <https://www.netlify.com/changelog/2026-06-18-react-router-8-support/>

#### TanStack Router / Start 1.0（assess）

**最新**：TanStack Start 1.0 稳定（一个来源称 2026-10-13）；TanStack Router 1.x 持续更新

类型安全的路由与 search params、内置数据加载与缓存，和 TanStack Query 深度整合。Cherry Studio v2 采用了 TanStack Router。

来源：

- <https://tanstack.com/blog/tanstack-start-1-0>
- <https://raw.githubusercontent.com/CherryHQ/cherry-studio/main/package.json>

#### TanStack DB（assess）

**最新**：1.0.0-rc.1（2026-10-29），官方称 API 已稳定

响应式客户端集合，支持增量 live query 和乐观更新，可叠加在 TanStack Query 之上。

来源：

- <https://tanstack.com/blog/tanstack-db-1.0-rc1-going-all-in-on-oracles>

#### TanStack AI 1.0（assess）

**最新**：1.0（2026-10-23），核心 API 稳定；agent harness 仍是 0.x 实验版

框架无关，有 23 个提供商适配器。流式协议完全兼容 AG-UI（以 RUN_FINISHED 结束），审批以 interrupt 形式处理，可用 createMCPServer 暴露工具，支持 WebMCP。

来源：

- <https://tanstack.com/blog/tanstack-ai-1-0>
- <https://www.infoq.com/news/2026/01/tanstack-ai-sdk>

#### Vercel AI SDK 6/7（UI message parts）（assess）

**最新**：AI SDK 6 于 2025-12-22 发布（tool approval needsApproval、ToolLoopAgent）。npm 上可见 ai@7.0.x 文档，二手来源称 v7 于 2026-06-25 发布，未见官方公告。

useChat 把消息建模为 parts 数组（text、reasoning、tool 含 approval-requested 状态、source、data），已成为事实上的前端 AI 消息结构。Cherry Studio 使用 AI SDK 6。

来源：

- <https://vercel.com/blog/ai-sdk-6>
- <https://ai-sdk.dev/docs/announcing-ai-sdk-6-beta>
- <https://app.unpkg.com/ai@7.0.173/files/docs/03-agents/06-tool-approvals.mdx>

#### AG-UI 协议（trial）

**最新**：持续演进。2026 年 AWS Bedrock AgentCore 接入，TanStack AI 1.0 完全兼容，Langflow 1.11 支持

标准化的事件流（运行生命周期、文本增量、工具调用、状态快照与增量、中断），可在 SSE 或 WebSocket 上传输。采用数据多为 CopilotKit 自述。

来源：

- <https://copilotkit.ai/ag-ui>
- <https://aws.amazon.com/blogs/machine-learning/build-generative-ui-for-ai-agents-on-amazon-bedrock-agentcore-with-the-ag-ui-protocol/>
- <https://tanstack.com/blog/tanstack-ai-1-0>

#### MCP Apps + @mcp-ui/client（trial）

**最新**：MCP Apps 规范 2026-01-26 稳定。@mcp-ui/client v7 提供 AppRenderer。有来源称 @modelcontextprotocol/ext-apps v2.0.0（2026-09-08），未经一手核实。

工具通过 \_meta.ui.resourceUri 指向 ui:// HTML 资源，在双层 iframe 沙箱中运行，UI 与宿主之间走 JSON-RPC，并要求纯文本降级。ChatGPT、Claude、VS Code、LibreChat、assistant-ui 均已支持。

来源：

- <https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx>
- <https://mcpui.dev/guide/client/app-renderer>
- <https://developers.openai.com/apps-sdk/mcp-apps-in-chatgpt>

#### A2UI（assess）

**最新**：1.0（2026-11-11）：双向函数调用、无障碍支持、元数据扩展；Web 与 Flutter 渲染器可在 MCP Apps 内运行

Agent 输出声明式组件树，由宿主用自己的组件库渲染，因此样式一致、安全面小。是 MCP Apps（任意 HTML）的互补方案。

来源：

- <https://developers.googleblog.com/en/a2ui-1-0-generative-ui>
- <https://github.com/google/A2UI>

#### MCP 规范 2026-07-28（adopt）

**最新**：2026-07-28 正式版：核心改为无状态，结果必须带 resultType，Tasks 移入官方扩展 io.modelcontextprotocol/tasks，URL-mode elicitation 精简，Roots/Sampling/Logging 弃用

扩展机制（ui、tasks）成为能力协商的核心，弃用的特性保留一年兼容期。

来源：

- <https://modelcontextprotocol.io/specification/2026-07-28/changelog>
- <https://blog.modelcontextprotocol.io/posts/2026-07-28-release-candidate/>

#### Agent Skills 标准（SKILL.md）（adopt）

**最新**：2025-12 发布，已捐赠给 Agentic AI Foundation；据称 70+ 平台集成，包括 ChatGPT、Codex、Cursor、GitHub Copilot、VS Code

技能是带说明文件与脚本或资源的目录，采用渐进式加载。OpenAI Codex 和 ChatGPT 使用同一格式，并通过插件分发。

来源：

- <https://www.anthropic.com/news/donating-agent-skills-to-the-agentic-ai-foundation>
- <https://developers.openai.com/codex/skills>

#### Motion 14（adopt）

**最新**：motion 14.x（npm 可见 14.13 及以上），animateView 并入免费库，scroll 优先使用原生 ScrollTimeline，新增 tap 属性

Framer Motion 的继任者。animateView 封装了 View Transition API 并自动管理 view-transition-name；LazyMotion 与 m 组件可减小包体。

来源：

- <https://motion.dev/changelog>
- <https://motion.dev/docs/upgrade-guide>

#### 列表虚拟化：virtua / TanStack Virtual / react-virtuoso（trial）

**最新**：TanStack Virtual 于 2026-05 发布 chat 指南（anchorTo: 'end' 保持前插时的位置）；virtua 原生支持 reverse 与双向无限滚动；react-virtuoso 用 firstItemIndex 处理前插

LobeHub 同时用 virtua 和 react-virtuoso，Cherry Studio 用 virtua 和 TanStack Virtual，Dify 和 LibreChat 用 TanStack Virtual。长对话、长列表必须虚拟化已是共识。

来源：

- <https://tanstack.com/blog/tanstack-virtual-chat>
- <https://tanstack.com/virtual/latest/docs/chat>
- <https://npmjs.com/package/virtua>

#### Vite 8 + Rolldown / Vite+（adopt）

**最新**：Vite 8 于 2026-03-12 稳定，以 Rolldown 统一 dev 与 build、以 Oxc 负责解析和转换；Rolldown 为 RC；Vite+ 仍是 alpha

取代 esbuild 加 Rollup 的双引擎组合，构建明显加快。Vite+（VoidZero 一体化工具链）尚不成熟。

来源：

- <https://vite.dev/blog/announcing-vite8>
- <https://theregister.com/2026/03/16/vite_8_rolldown>
- <https://voidzero.dev/posts/whats-new-jul-2026>

#### Oxlint（含 type-aware）（trial）

**最新**：2026-07 type-aware lint 稳定（tsgolint 实现 typescript-eslint 61 条规则中的 59 条，版本跟随 TS 7），并提供 Rust 原生的 React Compiler lint

比 ESLint 快一个数量级以上，可与 ESLint 并行使用，由 ESLint 承担 Oxlint 尚未覆盖的规则。

来源：

- <https://voidzero.dev/posts/whats-new-jul-2026>
- <https://frontendmasters.com/blog/react-compiler-linting-just-got-a-rust-native-speedup-in-oxlint/>

#### Biome 2.x（hold）

**最新**：v2.5.x（GitHub 最新可见 2.5.10），未见 v3 公告

一体化 lint 与 format，有类型推断和 GritQL 插件。

来源：

- <https://biomejs.dev/blog/biome-v2/>
- <https://github.com/biomejs/biome/releases>

#### CSS field-sizing: content（adopt）

**最新**：2026-06 随 Firefox 152 达到 Baseline Newly available（Chrome 123、Safari 26.2）

textarea 和 input 可按内容自动增高，用 min-height、max-height 约束，不再需要 JS 自动增高。

来源：

- <https://web.dev/blog/web-platform-06-2026>
- <https://developer.chrome.com/docs/css-ui/css-field-sizing>

#### CSS Anchor Positioning + Popover（trial）

**最新**：Firefox 147（2026-01）取消 flag，达到 Baseline Newly available（caniuse 仍标记 Firefox 为部分支持）；Interop 2026 继续推进 anchor positioning 以及 dialogs 与 popovers

无需 JS 即可做锚定浮层，customizable select 也基于它。

来源：

- <https://web.dev/blog/web-platform-01-2026>
- <https://web.dev/blog/interop-2026>
- <https://caniuse.com/css-anchor-positioning>

#### Scroll-driven animations（trial）

**最新**：Firefox 159 默认开启，2026-10 达到 Baseline Newly available（Chrome 115、Safari 26）

animation-timeline、scroll-timeline、view-timeline，在合成线程运行。

来源：

- <https://web.dev/blog/web-platform-10-2026>
- <https://www.webkit.org/blog/17101/a-guide-to-scroll-driven-animations-with-just-css/>

#### View Transitions API（同文档）（trial）

**最新**：同文档过渡随 Firefox 144（2025-10）达到 Baseline Newly available，但 Firefox 不支持 transition types；跨文档过渡与 :active-view-transition-type() 列入 Interop 2026

React 19.3 的 \<ViewTransition> 和 Motion 的 animateView 都构建在此 API 之上。

来源：

- <https://web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available>
- <https://web.dev/blog/interop-2026>

#### @starting-style + transition-behavior: allow-discrete（adopt）

**最新**：2024-08-06 起为 Baseline（Chrome 117、Firefox 129、Safari 17.4），2026 年已接近 Widely available

让 display:none 到可见、popover、dialog 的进出场动画可以只用 CSS 完成。

来源：

- <https://web.dev/blog/baseline-entry-animations>
- <https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@starting-style>

#### Container queries（size 与 style）（adopt）

**最新**：尺寸容器查询已广泛可用；container style queries 列入 Interop 2026；Tailwind 4.3 新增 @container-size

组件按所在面板宽度自适应，而不是按视口。

来源：

- <https://web.dev/blog/interop-2026>
- <https://tailwindcss.com/blog/tailwindcss-v4-3>

#### Customizable select（appearance: base-select）（assess）

**最新**：Chrome/Edge 134 至 135 起支持；WebKit 称 Safari 27 将支持；Firefox 仍滞后

原生 select 可完全自定义样式和富内容选项，基于 popover 与 anchor positioning。

来源：

- <https://developer.chrome.com/blog/a-customizable-select>
- <https://builder.aws.com/content/3Jgb2BOBDM0TjxmaPqjsN32Nxry/customizable-select-the-lessselectgreater-dropdown-finally-catches-up-with-css>

#### Ant Design X 2.x（x-sdk / x-markdown / x-card）（trial）

**最新**：2.x（npm 可见 2.8 以上，本仓 2.10.0）。V2 升级到 antd 6、React 19 和 CSS 变量，拆分为 x、x-markdown、x-sdk 三个包；useXAgent 改为 useXChat

国内生态活跃。x-markdown 支持 streaming 属性和未闭合语法占位，x-sdk 管理会话与请求状态。

来源：

- <https://x.ant.design/x-markdowns/streaming>
- <https://x.ant.design/docs/react/migration-v2>
- <https://github.com/ant-design/x>
