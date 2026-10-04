# Widget 启动与生命周期移植核对

核对日期：2026-10-04。上游 `/Users/xldu/project/ragflow`，目标为本 Web 仓。
目标提交 `a736948493072ea3c978cc5626d4b19a1dc067e3`；冻结上限
`519e7d98a5651564d4e35d6648f006cba4baaf4f`。已核实 remote 为
`infiniflow/ragflow`，目标提交是冻结上限的祖先；以提交对象读取完整 diff，
后续演进仅检查到冻结上限，不使用更新的 origin/main 扩大移植范围。

## 完整差量处置

| 上游路径/差量                                                                              | 本地处置及依据                                                                                                                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `web/src/components/floating-chat-widget.tsx`：区分独立/嵌入启动并显示聊天窗               | 本地已有独立 React 预览分支，能够渲染聊天组件；无需复制上游动态 iframe 页面。补齐默认关闭、点击启动、同一启动按钮关闭/重开、关闭后保留草稿及会话；首次打开才挂载聊天组件。嵌入继续发送 `CREATE_CHAT_WINDOW` / `TOGGLE_CHAT`，宿主继续拥有 `chat-win`。                                                 |
| 同文件：音频异常日志、import 顺序                                                          | 本地没有对应提示音实现，不新增音频或异常日志。import 顺序无行为差量。                                                                                                                                                                                                                                  |
| `web/src/components/next-message-item/group-button.tsx`：复制按钮去边框、去嵌套 hover 背景 | 本地没有该 ToggleGroup/CopyToClipboard 组合。Agent/widget 经 `ShareMessageList` → `RuntimeChatMessageList` → `MessageActionsFooter`，已使用 `Actions variant="borderless"`；实际按钮计算样式为边框 `0px`、背景透明。保留本地 Actions 交互 token，不照搬上游透明 hover 强制覆盖。无需制造复制按钮提交。 |
| `.gitignore`：忽略 `.claude/settings.local.json`                                           | 本地 `*.local` 不匹配 `.local.json`，增加精确规则。该文件此前已受版本控制，需停止跟踪并保留本地磁盘文件，才能让忽略规则生效。                                                                                                                                                                          |

冻结范围内后续 widget 提交包含自定义、引用、附件、语言、复制内容及 IME 等变化；
启动分支与消息名称在冻结版本仍保留。此次不追带这些独立功能。

## 本地行为及合同

- [路由组件](../../src/pages/agent/share/widget.tsx)继续按顶层/iframe 和 `mode` 选择本地预览、嵌入 launcher、聊天窗，复用现有 `WidgetChatWindow`；不另造上游页面或第二套聊天运行时。
- [widget 壳组件](../../src/pages/agent/share/widget-shell.tsx)统一启动按钮；修复壳层已失效的 surface 背景类，使用现行 background 令牌，确保深色文本与背景可读；关闭仅隐藏已挂载会话，首次打开才挂载。独立分支不向父窗口发送创建/开关消息，不添加额外 iframe 或 message listener。参数 URL 用 `URL.searchParams.set` 改 `mode`，保留其余查询参数和 hash。
- launcher 也通过现有 `applyRouteLocale` 使用 URL 语言；保留路由语言与产品偏好的隔离，以及 `ScopedTheme`。
- [公共 Agent runner](../../src/pages/agent/share/use-shared-agent-runner.ts)在卸载或访问身份变化时 abort 当前订阅。关闭隐藏不 abort。该清理仅结束本地连接，不新增服务端取消请求，不宣称后端任务已取消。
- Agent release/draft、beta token、user ID、inputs、上传、附件、流式输出、Begin/task/webhook 与续传输入继续消费已有实现；未改 API payload 或消息 reducer。普通聊天页面与传输未修改。

## 实际验证

- share/widget 定向 Vitest：3 文件、19 项通过，其中新增 5 项覆盖中英文启动/关闭/重开、保留草稿和活动流、卸载 abort、嵌入消息及完整 URL、StrictMode 文档样式恢复、访问身份变化清理。
- 最终隔离快照（基于 `06e003975a26fb9b11ba1a522bf28147d0187f25`，仅叠加本任务差量）`npm run test:ci`：正式 inventory 174 文件；source Node 656、Vitest 379、Desktop 81、tooling 10 项通过。此前共享工作区也曾完整通过 656/395/81/10 项；其它任务 WIP 的额外用例不计入本次隔离证明。
- 隔离快照 `npm run build`、`npm run lint`、`npm run lint:file-size`、`npm run lint:i18n-agent`、`npm run test:product-ui`（30 项 Vitest 加 3 项 Node）、`npm run typecheck:agent-strict`、`npm run verify:test-inventory`、`npm run check:bundle-size` 通过。lint 为 0 error，保留既有 warning；构建仍有既有大 chunk 提示。
- 仅包含本任务差量的最终生产构建配合本地 fixture API：独立页面点击/Enter/Space 打开、发送 SSE 回复、关闭/重开保留回复及未发送草稿；英文浅色、中文深色实际呈现；缺少访问参数的错误态实际打开。
- 运行 `buildAgentEmbedCode` 生成的真实片段：宿主创建隐藏 `mode=window` iframe；启动/关闭消息显示/隐藏它，重开保留草稿。另以 `127.0.0.1` 宿主嵌入 `localhost` widget 验证不同 origin 的打开与关闭。
- 独立活动流卸载：关闭后 fixture 读回 `active=1`，整页卸载后 `active=0, closed=2`（含此前嵌入连接）。
- 嵌入活动流卸载：只移除 launcher 后 `chat-win` 和活动连接仍在；移除聊天 iframe 后 fixture 服务端读回 `active=0, closed=1`。
- 明暗与嵌入截图保存在本机 `/tmp/widget-a7369484-evidence/`；它们是 fixture 验收记录，不进入产品代码。

共享工作区在主题任务拆分期间，后续构建及 Node 测试曾因 `generateThemeCSS` 未正确导入/导出而失败，lint 另报 `rgbChannels` unused。已向负责主题的 chat 协调保留各自路径，并通知这些暂态失败；未修改它的主题文件。隔离快照用于确认本次 widget 差量可独立构建、测试；它不代表仍在变化的整个共享工作区通过验收。

## 兼容性调查与讨论建议

现有 [生成嵌入代码](../../src/pages/agent/share/access.ts)没有销毁消息，监听器为匿名函数，
`chat-win` 属于宿主 document。实际验证仅卸载启动 iframe 不会卸载聊天 iframe，也不会结束它的活动流。
本次保留原消息合同；SPA 宿主应在页面销毁时统一移除两个 iframe 并清理自己持有的消息监听器。
如需 widget 主动请求宿主销毁，应另行讨论类型化 teardown 事件、实例 ID、多实例隔离与旧片段兼容，
而不是在此次启动修复中静默扩展协议。现有固定 `chat-win` ID 也意味着一个宿主页只支持一个实例。

本次浏览器验收使用隔离 fixture，未验证真实后端/模型、生产分享 token、附件上传下载、
真实长任务的服务端取消或运行持续性；现有专项及全套测试通过不代表这些外部链路已验收。
