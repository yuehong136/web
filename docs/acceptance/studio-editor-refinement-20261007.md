# Studio 编辑器紧凑化与应用对话一致性验收

日期：2026-10-07。延续[第一阶段](studio-editor-20261007.md)，针对页面过松、重复边框和试聊与应用对话呈现不一致的反馈实施。本轮不修改保存、会话、SSE API 或后端端点。

## 上游核验

19:18（北京时间）重新调用各仓库 GitHub API 的最新稳定 release 与默认分支 commit，并读取对应主分支源码。版本与 SHA 记录于[上游清单](studio-editor-refinement-20261007/upstream-manifest.json)，本轮未使用旧教程作为实现依据。

| 项目     | 最新稳定 release          | 本轮主分支与源码                                                                                                                                                                                                                                                                                                               | 应用到本页的判断                               |
| -------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Dify     | 1.17.1（09-10）           | [`b369e875` 预览工具栏](https://github.com/langgenius/dify/blob/b369e875feabac591a9b74a7debca9bc56bbe982/web/features/agent-v2/agent-detail/configure/components/preview/header.tsx)、[聊天容器](https://github.com/langgenius/dify/blob/b369e875feabac591a9b74a7debca9bc56bbe982/web/app/components/base/chat/chat/index.tsx) | 紧凑工具栏，按条件开放操作，共用消息呈现       |
| FastGPT  | v4.17.1（09-30）          | [`1870d794` ChatTest](https://github.com/labring/FastGPT/blob/1870d7945d11b34af75fe30bdcc73ddcdd416803/projects/app/src/pageComponents/app/detail/Edit/ChatAgent/ChatTest.tsx)                                                                                                                                                 | 调试容器复用聊天组件，通过上下文与能力控制操作 |
| Langflow | v1.12.5（10-07 北京时间） | [`504c02fc` Playground](https://github.com/langflow-ai/langflow/blob/504c02fc47e76087b82b0e7cbe4186e9cdd916d4/src/frontend/src/components/core/playgroundComponent/sliding-container/components/flow-page-sliding-container.tsx)                                                                                               | 试聊展开、就近会话操作，单独管理工作区视图     |
| Langfuse | v4.54.0（10-07）          | [`23518d40` MultiWindowPlayground](https://github.com/langfuse/langfuse/blob/23518d407d4e9529473139817695f25ae0cd7f07/web/src/features/playground/page/components/MultiWindowPlayground.tsx)                                                                                                                                   | 约束窗口宽度，窄屏降级，避免配置与试验状态混淆 |

Dify 与 Langfuse 主分支已区别于第一阶段记录的 SHA。本轮实现借鉴上述源码的组件分工和交互，再适配本仓 Studio 令牌与保存后试聊合同。

## 实现

- 顶栏压缩到约 52px，标签与面板工具栏更紧凑；指令不重复显示一层标题与边框，保留变量、格式、预览和专注入口。
- 配置正文限制阅读宽度，减少章节与参数间距；模型预设改为无独立卡片边框的单选项，窄容器两列，宽容器四列。
- 全部参数覆盖关闭时明确选中“模型默认”；选择默认仅关闭覆盖标志，保留原值。关闭态显示默认值说明，不宣称本地数值已生效。
- `AppChatAvatar`、`getAppChatBubbleProps`、`AppChatAnswer`、`AppChatComposer` 由应用对话与 Studio 试聊共同使用。统一助手/用户头像、三点等待、思考区、Markdown/表格/图表组件、引用及复制/重新生成。
- 输入框仅保留一个外层 1px 边界，内部 textarea 不画第二层焦点描边或阴影。应用侧附件工具栏进入同一个 Sender footer，保留附件处理与现有功能。
- 表格移除外层卡片框与完整格子边界，使用轻量行分隔；引用来源使用文本展开入口，详情仍支持文档分组、展开更多与引用点击。
- 思考内容限制高度并可独立滚动；完成或中断后的标题为中性的“思考过程”。停止操作标注为“停止接收”。
- 复制和重新生成使用原生按钮与 lucide 图标，支持键盘与中英名称；修复旧 `Actions.Copy` 不调用传入回调的问题。
- `ReferencePanel` 新增兼容的 `inline` variant，默认卡片行为保留；未返回相似度时不显示虚构的 0%。
- 流式状态、保存编排及请求归属逻辑沿用第一阶段实现。试聊只显示已有能力；应用端语音、附件和反馈保持其自身能力入口。
- ExplorePage 2180→1742 行；新源码文件均小于 600 行，收紧唯一文件体积基线和 ENG-1 记录。

## 验证

最终源码复制到基于 `ccd9e29` 的专用工作树，依赖复用当前安装。仅复制本任务 33 个源码/基线文件；独立知识库提交 `19c3df5` 未混入验收补丁。每个文件 SHA-256 见[源码清单](studio-editor-refinement-20261007/source-manifest.json)。

| 检查                            | 实际结果                                                                                                    |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 受影响 Studio Vitest            | 6 文件、32 测试通过：保存/会话生命周期、输入法 Enter、防误试聊、引用、模型默认、共享复制及重新生成          |
| test:product-ui                 | Node 3 + Vitest 31 通过                                                                                     |
| test:streaming                  | Node 59 + Vitest 3 通过                                                                                     |
| verify:test-inventory / test:ci | 新模型测试进入 source-vitest；最终 Node 769、Vitest 98 文件/593 测试、Desktop 81、tooling 10 全通过，exit 0 |
| npm run lint                    | exit 0，0 errors / 1365 存量 warnings；受影响共享组件仅保留原有隐藏音频 caption warning                     |
| 文件体积                        | 22 个在册债务文件未膨胀，新文件均小于 600 行                                                                |
| npm run build                   | 完整 Web 类型检查及生产构建通过，exit 0；保留既有 chunk 大小提示                                            |
| Bundle 预算                     | raw 26.09 MB / 26.13 MB、入口 gzip 32 KB / 120 KB、最大 chunk 725 KB / 739 KB，通过                         |

[验证日志清单](studio-editor-refinement-20261007/verification-manifest.json)记录本机日志路径及哈希。完整测试初次出现未改动的 `mcp-query-ownership` 定时回调未及时反映到 DOM 的失败，单跑也曾失败；后续完整运行通过。本轮未改该模块或放宽其断言。一次误用 Vitest 扫描混合 runner 的目录产生 3 个 Node 文件“无 Vitest suite”的失败，随后按正式 inventory 分 lane 验证通过。

### 浏览器真实流程

- 专用临时应用 `60e11cbcc24311f183acbb6c68c5a906`（Studio Chat Parity 20261007）完成保存与详情读回。最终模型 qwen-flash、五项覆盖关闭、reasoning 关闭，无知识库。
- Studio 及 `/explore` 使用同一测试问题，真实生成平均值 18、增长率 100% 的 Markdown 表格。已观察生成中等待动画、完成状态及两处相同的消息/表格/输入呈现。
- Studio 键盘激活复制后观察“已复制”，读回剪贴板含结果 18；键盘重新生成进入一次忙碌流程并正常完成。
- 专注编辑后恢复双栏，未发送文本“尚未发送的验收输入”和已有表格仍在。窄屏编辑/试聊切换后回复保持；左右方向键能调整比例，并恢复原比例。
- 953×894、1280×800、1440×900、375×812 的 DOM `scrollWidth === innerWidth`；953 的实际工作区宽度不足双栏阈值时切换单区，1280/1440 显示双栏。375 下预设、保存与发送均可见。
- 浅色/暗色、中文/英文均实际渲染。聚焦输入后，外层边界 1px，textarea border 0、outline none、box-shadow none。
- 原应用 1107 字符提示词和已有引用在改版期间实际渲染；本轮未重新发起其知识检索请求。来源展开、引用点击及双语有受控组件回归覆盖。
- qwen3.5-flash reasoning 开启时，真实返回独立 thinking，观察到思考区与本地停止；该模型随后重复推理内容，主动停止，不能据此宣称该次回答正常完成。

开发 HMR 期间共享 locale/组件变动使原页面临时试聊重置；已向用户说明。原应用已保存配置仍在，本轮没有保存原应用。最终源码下的模式切换与输入保留通过；本报告不声称消息在整页重载后持久化。

### 截图

- [英文浅色，单层输入焦点](studio-editor-refinement-20261007/03-preview-light.jpg)
- [中文暗色工作区](studio-editor-refinement-20261007/06-preview-zh-dark.jpg)
- [紧凑模型参数](studio-editor-refinement-20261007/02-model-compact.jpg)
- [实际应用聊天](studio-editor-refinement-20261007/04-application-dark.jpg)
- [原页面已有引用改版效果，HMR 重置前](studio-editor-refinement-20261007/05-original-compact.jpg)
- [思考中真实流式内容](studio-editor-refinement-20261007/01-reasoning-stream.jpg)
- [953 单区](studio-editor-refinement-20261007/07-responsive-953.jpg)、[1280 双栏](studio-editor-refinement-20261007/10-desktop-1280.jpg)、[1440 双栏](studio-editor-refinement-20261007/11-desktop-1440.jpg)
- [375 模型配置](studio-editor-refinement-20261007/08-mobile-edit.jpg)、[375 试聊](studio-editor-refinement-20261007/09-mobile-chat.jpg)

浏览器验收期间的语言恢复到英文，主题恢复到此前深色，视口覆盖已清除。专用应用及生成会话保留供复核，未做不可恢复删除。临时验收工作树在完成后归档。

## 限制

本轮没有验证生产部署、实际 TTS/附件上传、原应用新的知识检索、真实图表模型输出、自定义变量透传或原生浏览器 200% zoom；引用与格式使用真实既有响应及受控回归。未新增后端能力，试聊仍遵守保存配置合同。多个模型的行为和提供方参数支持仍取决于后端与提供方响应。
