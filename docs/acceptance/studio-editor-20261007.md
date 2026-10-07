# 应用编辑器实现与验收（2026-10-07）

本次实现已批准方案的第一阶段：左侧配置工作区、右侧试聊，明确区分草稿、已确认保存配置与试聊快照。没有增加后端端点、数据库迁移或依赖；未部署或推送。

## 交付范围

- `StudioPageTemplate` 单行顶部、四个配置标签；工作区宽度达到 880px 使用可拖动双栏，编辑区最小 480px、试聊区最小 360px。窄屏在编辑/试聊间切换，两个区域保持挂载。
- 指令编辑器保留原始 Markdown 字符串与懒加载；变量、预览、专注编辑常驻，格式操作收进浮层。配置与弹窗使用中英资源及现有 Studio 令牌。
- 知识来源优先显示已选知识库与添加入口，检索及增强设置按需展开；生成风格改为完整单选控件，关闭参数明确使用模型默认值。
- 数据查询使用既有 TanStack Query key factory，草稿使用 React Hook Form；Zustand 的新布局存储只持久化比例、标签及视图偏好，不保存表单、消息或凭证。
- 保存先验证，再写入，再详情读回及规范化比较；新建 ID 在读回前绑定路由，失败重试不会重复创建。保存期间新编辑保留；初次查询失败不进入空配置保存流程。
- 未保存、保存中、旧配置会话、必填自定义变量均阻止发送。保存并试聊仅在读回确认且草稿仍匹配时开启新会话；普通保存保留历史对话，开场白编辑不清空消息。
- 会话创建与发送共用同步忙碌锁；run ID、应用身份与 AbortController 阻止迟到响应污染新会话。提供本地停止接收、显式重试、复制、引用与停止滚动跟随。
- 运行详情 Sheet 展示请求配置快照、客户端耗时、结果状态及引用；关闭的采样参数显示默认值，未推测 token、成本或服务端实际执行模型。
- 本页三个弹窗选择启用共享 Dialog 的原生模态模式，检查焦点进入、Tab 与 Escape 恢复；共享默认行为不变。Sheet 增加兼容的关闭按钮文案 prop。
- `config-pane.tsx` 从 698 行降至 88 行，页面 hook 从 582 行降至 475 行；移除配置面板的文件体积债务基线，新源文件均低于 600 行。

## 参考版本

沿用批准方案中 2026-10-07 经 GitHub API 核对的最新稳定版及当天源码；没有以旧版教程替代源码设计。

| 项目 | 稳定版 | 当天主分支参考源码 |
| --- | --- | --- |
| Dify | [1.17.1](https://github.com/langgenius/dify/releases/tag/1.17.1)，`8387590` | [Agent 预览头部，f4a4e15](https://github.com/langgenius/dify/blob/f4a4e15a0be184ae9966a7e4245e50c41b2c3c35/web/features/agent-v2/agent-detail/configure/components/preview/header.tsx) |
| Langflow | [1.12.5](https://github.com/langflow-ai/langflow/releases/tag/v1.12.5)，`5262228` | [Playground，504c02f](https://github.com/langflow-ai/langflow/blob/504c02fc47e76087b82b0e7cbe4186e9cdd916d4/src/frontend/src/components/core/playgroundComponent/sliding-container/components/flow-page-sliding-container.tsx) |
| Langfuse | [4.54.0](https://github.com/langfuse/langfuse/releases/tag/v4.54.0)，`21f9d2b` | [MultiWindowPlayground，be0b074](https://github.com/langfuse/langfuse/blob/be0b074e58c5426e1ba0e3322ab26322695b9c8f/web/src/features/playground/page/components/MultiWindowPlayground.tsx) |
| FastGPT | [4.17.1](https://github.com/labring/FastGPT/releases/tag/v4.17.1)，`e3d7ed3` | [ChatTest，1870d79](https://github.com/labring/FastGPT/blob/1870d7945d11b34af75fe30bdcc73ddcdd416803/projects/app/src/pageComponents/app/detail/Edit/ChatAgent/ChatTest.tsx) |

## 自动化验证

任务源码以 [SHA-256 manifest](studio-editor-20261007/source-manifest.json) 绑定，共 47 个文件（含相关未改动依赖和既有测试）。主工作区与隔离验证工作区的这些文件内容一致。

| 检查 | 实际结果 |
| --- | --- |
| 保存、试聊归属、composer、引用、顶部与模态焦点的 Vitest 回归 | 24 项编辑器回归及 3 项新增共享模态回归通过；涵盖双击、创建会话期间锁定、保存并发编辑、读回失败/不匹配、停止/重开/身份切换/卸载、重试、IME 与关闭参数诊断 |
| 编辑器状态、配置规范化与知识占位符 Node 回归 | 3 文件、15 项通过；含关闭参数的序列化比较、零值保留与中英 key 一致性 |
| `npm run test:product-ui` | Node 3 项、Vitest 7 文件 31 项通过 |
| `npm run test:streaming` | Node 59 项、Vitest 1 文件 3 项通过 |
| 相关 ESLint | 编辑器、布局 store、共享 Dialog/Sheet 与新增模态测试通过 |
| `npm run lint:file-size` | 通过，22 个在册债务文件未增长 |
| `npm run build` | 主工作区和隔离工作区均通过，包含完整类型检查 |
| `npm run check:bundle-size` | 通过：JS raw 26.10 / 26.13 MB；入口 gzip 32 / 120 KB；最大 chunk gzip 725 / 739 KB |
| 隔离工作区 `npm run test:ci` | 退出 0：Node 769 项、Vitest 97 文件 585 项、desktop Node 81 项、tooling Node 10 项全部通过；新增测试由 inventory 自动纳入正式 CI |

隔离验证基线为 `b45f3192fdd8fa7f74a0e98249f923f70887e332`，仅叠加本任务文件；主工作区检查时 HEAD 为 `01147a6c7c7ea308f8ec1a04a99c8dd575ff767f`，含其他任务未提交改动。主工作区完整 CI 曾通过（Node 771、Vitest 585、desktop 81、tooling 10）；最终两次重跑在未改动的 `mcp-query-ownership.test.tsx` 中出现“第二个服务器响应尚未通知视图”的时序失败，专项重跑通过。隔离最终完整 CI 通过；没有为此修改 MCP 模块。早期知识取消模块的并行开发失败也未混入本任务提交。

命令原始日志保留于本机 `/tmp/studio-editor-{final-shared-build,final-shared-ci,isolated-build,isolated-ci,product-ui,streaming,modal-test,mcp-recheck}.log`。验收工作区结束后归档，可通过本聊天附件恢复；主工作区其他任务改动保留。

## 实际浏览器与模型验证

使用独立应用 [Studio Editor Acceptance 20261007](http://localhost:5173/studio/create-app?dialog_id=b2abf194c23811f183acbb6c68c5a906)，模型 `qwen-flash`，不绑定知识库。该合成验收应用及其会话保留，未永久删除测试数据。

1. 新建应用输入合成指令，先在试聊框输入消息；未保存时发送被阻止。
2. “保存并开始新试聊”完成保存、返回 ID 路由绑定和详情确认，输入内容保留；真实 SSE 返回 `STUDIO_OK`。
3. 将指令改为 `STUDIO_OK_2` 并普通保存；历史 `STUDIO_OK` 保留并标记此前配置，发送被阻止；新对话后真实返回 `STUDIO_OK_2`。
4. 仅重新加载独立验收应用，读回最终指令与模型；最终代码在手机视图重新试聊，真实返回 `STUDIO_OK_2`，运行详情显示 Completed、请求模型 `qwen-flash`、前端耗时 0.53s。
5. 检查指令/知识/模型/体验标签、Markdown 原文/预览、变量入口、知识库列表读取（9 行）、双栏鼠标与键盘调整、专注编辑、展开试聊、退出后的比例及焦点。
6. 检查三个弹窗的模态焦点、Tab 到字段、Escape 关闭并恢复入口；没有在原应用添加知识库、变量或调用保存。

| 视口/外观 | 实际检查 |
| --- | --- |
| 953×894 | 文档宽度等于视口宽度；小于 880px 工作区时使用单区切换，已有试聊消息保留 |
| 1280×800 | 双栏拖动与键盘调整，文档宽度 1280，无页面横向溢出 |
| 1440×900 | 双栏布局，无页面横向溢出 |
| 375×812 | 两行配置标签、窄屏编辑/试聊、固定 composer 与模态弹窗可用；文档宽度 375 |
| 中英、明暗主题、长指令 | 实际页面及模型预设渲染已检查，1107 字符原始指令可读 |
| 720×450 等效重排 | 无页面横向溢出；这是 1440×900 在 200% 下的等效布局宽高，原生浏览器 200% 缩放未验证 |

## 截图

| 证据 | 内容 |
| --- | --- |
| [中文亮色](studio-editor-20261007/04-desktop-zh-light.jpg) / [中文暗色](studio-editor-20261007/05-desktop-zh-dark.jpg) | 原应用长指令的编辑工作区 |
| [英文暗色模型](studio-editor-20261007/06-model-en-dark.jpg) | 完整预设单选与参数配置 |
| [保存后的旧对话](studio-editor-20261007/02-saved-history.jpg) | 保存保留历史回复并要求新试聊 |
| [953px 试聊](studio-editor-20261007/03-narrow-chat.jpg) | 窄屏切换后保留回复 |
| [手机编辑](studio-editor-20261007/07-mobile-editor.jpg) / [变量弹窗键盘](studio-editor-20261007/08-variable-dialog-keyboard.jpg) | 375px 指令区及模态焦点 |
| [手机真实回复](studio-editor-20261007/09-mobile-live-chat.jpg) / [桌面最终闭环](studio-editor-20261007/10-desktop-live-chat.jpg) | 最终代码的 `STUDIO_OK_2` 回复与保存状态 |
| [早期运行详情](studio-editor-20261007/01-live-run-details.jpg) | 真实请求快照；随后将详情入口移到试聊标题栏 |

## 限制与开发期间影响

- 当前普通聊天链路的固定 Top K 1024 与自定义变量不透传，来源于此前本地后端源码检查。前端已明确限制，但本轮没有绑定运行后端 SHA，也没有通过真实检索结果证明 Top K 的服务端生效值。
- 已验证真实模型文本回复；真实知识检索、引用详情与图表回答没有进行完整模型链路验收。引用/SSE/安全渲染保留既有实现并通过相关回归；必填变量、保存失败及迟到响应等异常由受控回归覆盖。
- 原生 200% 缩放未验证；等效 720×450 重排不能替代这一结论。现有开发环境 Query Devtools 浮动按钮在手机截图中会覆盖部分字符计数，不属于新增编辑器控件。
- 开发服务热更新调整 hook 时曾重建原“演示0107”页面，其先前的未保存状态被重置为服务器配置，无法确认是否包含用户新增内容。没有对原应用调用保存；未保存草稿未持久化，无法承诺其在开发热更新后恢复。后续验证使用独立应用。
- 本阶段不提供隔离草稿运行、版本回滚、自定义变量值输入、多模型对比、批量评测或 AI 优化入口，需后续真实接口合同。
