# Client Platform 测试、性能与安全门禁

> 当前已有 CLP-DESK0 源码、合同、构建与 staging 门禁；CLP-DX1 已通过独立 composition、Desktop Workbench、命令系统和 bridge v2 的内部体验版门禁，证据见 [DX1_EXIT_REPORT.md](./DX1_EXIT_REPORT.md)。正式安装包 E2E、签名/公证、更新、durable Run 性能和 Host 门禁仍是后续目标。

## 1. 当前已验证边界

本仓当前 CI 覆盖 Web lint、文件/Bundle 棘轮、类型检查、Agent/API/Streaming/Design Token/Security 专项测试和 Vite build。CLP-DESK0 额外覆盖：

- path-scoped Electron/Node/React 依赖方向 lint，main/preload 独立 typecheck。
- Renderer Bridge 暴露面、BrowserWindow/session/navigation 策略、`app://bundle/` URL/路径/fallback 的 Node 合同测试。
- production-mode Vite 公共网络变量经 build receipt 到 versioned manifest/CSP 的合同测试；旧 `dist/`/当前 staging env 漂移，以及通配、凭据、远端明文、路径注入和策略扩张均 fail closed。
- Rolldown 单入口产物、electron-builder 配置、staging allowlist/拒绝规则和 package verifier 的合同测试。
- CI 上的 Web build → main/preload build → staging → stage verifier。CI 不生成或启动平台安装包。

CLP-DX1 已新增 `test:client-platform` 并接入 CI。测试覆盖 runtime selection/fail-closed、PlatformPort/browser adapter、紧凑认证 frame、Workbench 960px composition 与偏好真实 rehydrate、命令 ID/registry、命令面板焦点恢复，以及 toolbar/palette/shortcut/native command source 的同一 handler 单次执行；真实 packaged artifact 也已通过固定 composition marker、ASAR/fuses、网络可达性和截图检查。完整命令与边界见 [DX1_EXIT_REPORT.md](./DX1_EXIT_REPORT.md)。

当前仍没有：

- 完整 LoginPage/auth/session、durable Run、全路由/lazy asset、下载或更新的 packaged app E2E；
- Windows 打包/启动/正式签名实测，macOS Developer ID 签名/公证与安装器验收；
- Rust/Cargo/Host 测试；
- 桌面冷启动、内存、8 小时 soak 或 PTY benchmark。

因此 DESK0 不宣称完整桌面安全、发布或性能门禁已经通过。

## 2. 测试金字塔

| 层           | 目标测试                                           | 阶段                          |
| ------------ | -------------------------------------------------- | ----------------------------- |
| 纯 Web       | 现有 CI、browser adapter、runtime config           | 持续                          |
| DX1 Renderer | composition、Workbench、命令、快捷键、焦点、i18n   | CLP-DX1                       |
| Run Contract | v1/v2 schema、cursor、重复/gap、终态、interaction  | CLP-RS2/SC                    |
| Main         | sender、permission、navigation、protocol、平台能力 | DESK0 部分；CLP-DESK 持续     |
| Preload      | 暴露面、参数过滤、event 剥离、unsubscribe          | DESK0 最小子集；DX1/DESK 持续 |
| Rust crates  | domain、framing、PTY/process、Git/fs、migration    | CLP-BETA-HOST                 |
| Integration  | main ↔ 可选 Host、取消、crash、背压、版本不匹配    | CLP-BETA-HOST                 |
| E2E          | 登录、durable Run、Monaco/预览、下载、更新         | CLP-P0 起                     |
| Packaging    | allowlist、ASAR、fuses、签名、arch、SBOM           | DESK0 部分；CLP-DESK/REL 持续 |
| Performance  | packaged cold/warm、长流、固定负载、8h soak        | CLP-SC 起                     |

## 3. CLP-DX1 内部体验版门禁

DX1 的自动化验收必须覆盖：

- `http:` / `https:` 选择 Web composition，`app://bundle/` 选择 Desktop composition；未知 scheme 不进入产品应用。
- `app:` 下 bridge 缺失、shape 错误、version 非 `2` 时显示脱敏兼容性错误并 fail closed。
- Web 登录保留营销 frame；Desktop 登录使用共享表单的紧凑 frame，且不加载营销轮播。
- Desktop 在 `960px` 窗口仍显示 Activity Rail、上下文侧栏和现有 Workspace，不回退为 Web Mobile Sheet。
- activity、侧栏宽度和折叠状态可恢复；越界/损坏值回到安全默认值，存储中不出现正文、prompt、tool payload/result 或 token。
- 命令 ID 唯一；命令面板搜索/键盘导航/Escape/焦点恢复通过；普通快捷键不在 input/textarea/select/contenteditable 或组合输入期间触发。
- palette、toolbar、shortcut 与 Electron menu 调用同一 handler 且一次用户动作只执行一次。
- `conversation.new` 只执行现有 Conversation 重置/导航，不创建 Run 或显示后台/恢复状态。
- preload 过滤非法命令、剥离 Electron event、返回幂等 unsubscribe；取消订阅后不再回调。
- main 只向存活且顶层 URL 属于 `app://bundle/**` 的主窗口派发；生产菜单没有 reload/DevTools。
- bridge v2、Renderer adapter、staging/build manifest、ASAR/package verifier 的版本精确一致。

阶段证据必须包含：

- 同一 commit 的 Web 登录、Desktop 紧凑登录、Desktop Workbench 截图；补充 960px、中英文和键盘焦点证据。
- 实际运行命令、通过/失败、commit、artifact hash、设备、OS/架构和未验证平台。
- packaged smoke 断言 `data-client-runtime="desktop"`；只等待 DOM ready 不算 composition 成功。
- 记录 cold/warm start、总/分进程 RSS、空闲 CPU、首个命令面板打开耗时作为趋势基线。DX1 不用缺失的 durable Run fixture 冒充下述 MVP 性能门槛。

目标命令集至少运行：

```bash
npm run lint
npm run lint:all
npm run lint:i18n-agent
npm run lint:desktop
npm run lint:file-size
npm run desktop:typecheck
npm run test:client-platform
npm run test:desktop
npm run test:product-ui
npm run test:security
npm run build
npm run check:bundle-size
npm run desktop:build
npm run desktop:stage
npm run desktop:verify:stage
```

macOS 本地再运行 package、package verifier、网络 smoke 和启动 smoke。Windows 打包、签名和安装包 E2E 仍要求 Windows 原生 runner 证据；未执行不得声称通过。

## 4. 批准性能与恢复门槛

### 固定方法

- 每个平台至少一台固定参考机，记录 CPU、RAM、OS patch、磁盘、电源模式和显示缩放。
- 测正式 packaged artifact，不用 Vite dev server 或 Electron 默认 app。
- 冷启动前清 OS 文件缓存的策略必须可复现；热启动单独统计。
- 每场景至少 30 次，报告 p50/p95、离群值、commit、artifact hash 和 trace。
- 对照同 commit 的浏览器 Web 路径；不得拿不同数据、不同网络或 hello-world 比较。
- 使用 Chromium trace、Electron content tracing 和 OS 进程指标拆分 main/renderer/GPU；Beta 再加入 Host。
- Tauri 挑战者 PoC 必须复用同一 Renderer、fixture、设备与采样方法：所有目标平台无兼容阻断，且冷启动或稳态内存至少一项相对 Electron 领先 `>20%`，同时流式输入、事件可见和帧耗时不退化，才重开首发选型。

### 固定负载

所有性能报告至少覆盖同一套批准负载：

- 500 条消息；
- 100 张工具卡；
- 100 chunks/s；
- 4 个并行 Run；
- Monaco 5 MB 文本；
- 百页文档；
- 千节点画布。

不得用 hello-world、空列表或不同 fixture 代替。网络相关指标需记录网络模型、服务版本与是否本地缓存。

### MVP 门槛

这些是批准的 go/no-go 门槛，不是当前实测：

| 指标                 | 门槛                                        |
| -------------------- | ------------------------------------------- |
| 冷启动到可交互       | p95 `<= 1.5s`                               |
| 热启动到可交互       | p95 `<= 800ms`                              |
| 流式期间用户输入延迟 | keydown/input 到下一次 paint，p95 `<= 50ms` |
| 事件到可见文本       | p95 `<= 100ms`                              |
| 60 Hz 帧耗时         | p95 `<= 16.7ms`                             |
| 空闲 CPU             | 均值 `< 1%`                                 |
| 8 小时 soak          | 稳态内存增长 `< 10%`                        |
| Renderer 重载        | `2s` 内恢复任务投影                         |

不新增未批准的绝对 RSS 门槛。总/分进程 RSS、安装体积、main stall 与 long task 仍要记录和做趋势棘轮，但不能冒充本次批准的硬阈值。

### Beta Host 额外门槛

- Host 崩溃后 UI 不退出。
- `2s` 内重启 Host 并恢复可恢复状态。
- 不可恢复或副作用未知的 operation 必须明确标记，禁止自动重放。

### 补充重负载与故障场景

- 100 chunks/s 与 4 并行 Run 期间验证 rAF 合帧、事件有序、取消和投影恢复。
- 500 消息/100 工具卡不全量触发昂贵重渲染，用户上滚不被抢回底部。
- Monaco 5 MB 文本的首次打开、编辑、搜索与关闭后内存趋势。
- 百页文档与千节点画布首开、交互、切换和重载。
- PDF、DOCX、PPTX、XLSX 首开与跨页操作；资源缺失必须明确失败而非白屏。
- Renderer reload、窗口关闭、睡眠唤醒、网络切换和 v2/v1 回退期间无假成功或 Run 丢失。
- Beta 才增加 PTY burst、孤儿进程、Host crash/restart 和本地 journal 场景。

### Run 正确性与授权硬门槛

- 同一 Agent 的四个并发 Run 拥有不同 `run_id`/内部 task ID、取消键和日志关联键。
- 取消一个 Run 不影响其他 Run；重复取消幂等，cancel/completion race 只产生一个实际终态。
- detach、刷新、窗口关闭、Renderer reload 和 WS/SSE EOF 只取消订阅，不取消 Run。
- 从最后已确认 `seq` 重连回放后投影无重复；outbox 重试不生成新 `event_id`/`seq`。
- 每个 Run 只有一个 `completed|failed|cancelled|interrupted` 终态，终态后不再产生业务状态事件。
- 未授权主体不能读取、订阅、提交 interaction 或取消其他 tenant/owner 的 Run，响应不泄露资源存在性。
- Runner 无安全 checkpoint 时崩溃明确记为 `interrupted`；不得在同一 `run_id` 下从头重演或伪装恢复成功。
- P0 先对当前 v1/执行入口建立定向测试；RS2 再以 PostgreSQL/Valkey/WS/SSE 集成测试证明同一合同。

## 5. Web 与桌面体验一致性

CLP-DESK packaged smoke 至少覆盖：

- 登录/登出和账号切换 cache isolation；
- 密码 refresh rotation、Web HttpOnly cookie、Desktop `safeStorage`、OIDC PKCE/state/loopback 单次消费与 EIM-I6 fail-closed；
- REST/SSE API origin、401、取消、timeout、意外 EOF；
- 所有路由 lazy chunk、Monaco `/vs`、PDF worker、Office preview 静态资源；
- history deep link/reload、自定义协议 404 与 CSP；
- 中文/英文、明/暗主题、系统缩放和键盘导航；
- share/widget 继续走既有隔离，不因 Electron 获得 Node 权限。

## 6. Electron 安全配置

生产窗口统一：

- `sandbox: true`
- `contextIsolation: true`
- `nodeIntegration: false`
- `webSecurity: true`
- `allowRunningInsecureContent: false`
- `connect-src` 只来自经 staging/package verifier 验证的 exact-origin manifest；远端只用 HTTPS/WSS，HTTP/WS 只限本地 loopback 开发，禁止宽泛 `http:`/`https:` source
- 不启用不需要的 experimental/Blink features
- permission request/check 默认拒绝并按 capability allowlist
- 导航、新窗口、外链、下载与 deep link 使用协议/host allowlist
- 每个 IPC 校验 sender frame、schema、权限和当前 operation

生产只加载 packaged local renderer 或明确隔离的 secure remote content；远程 OAuth/网页不能继承产品 preload。

## 7. Fuses、ASAR 与 sidecar

目标 release policy：

| Fuse                           | 目标                                          |
| ------------------------------ | --------------------------------------------- |
| Run as Node                    | 关闭                                          |
| Cookie encryption              | 开启，从首个公开版本保持单向策略              |
| Node options env               | 关闭                                          |
| Node CLI inspect               | 正式包关闭                                    |
| Embedded ASAR integrity        | macOS/Windows 开启                            |
| Only load app from ASAR        | 开启                                          |
| File protocol extra privileges | 关闭；生产不用 `file://`                      |
| Browser-specific V8 snapshot   | 先 benchmark，默认不启用                      |
| WASM trap handlers             | 保持安全/性能默认，不为省虚拟地址空间随意关闭 |

Packaging test 必须读取最终 binary 的 fuse 状态，检查 ASAR integrity header、app.asar allowlist 和意外 `app/` fallback。Beta 加入 Rust Host 后再检查 sidecar hash/架构/权限与 macOS nested signing/Windows binary signing。

DESK0 已有上述 ASAR/fuse 配置和最终产物验证器，但当前跨平台 CI 只运行到 stage verifier。产物验证必须在目标 OS 原生 runner 上执行 `desktop:package:dir` 和 `desktop:verify:package`；未执行的平台不得声称通过。

2026-08-13 的 DESK0 macOS arm64 本地 unpacked 产物已通过启动 smoke、ASAR/manifest/fuse 验证与 `codesign --verify`。显式 smoke 模式使用唯一临时 profile 与 Chromium mock keychain，避免读取真实桌面 profile 或被 macOS Keychain 阻塞；正常启动仍走生产 profile 与 cookie-encryption fuse，因此该 smoke 不验证真实 Keychain/cookie-encryption 启动路径。该历史 smoke 只等待 DOM ready，不是 DX1 所要求的 `data-client-runtime="desktop"` composition 证据。另一次不含真实账号/token 的 packaged Renderer 探针向 manifest 中的本地登录 origin 发起带预检的 JSON POST，观察到 `OPTIONS 200` 与 `POST 200`；这证明 CSP/CORS/Chromium Local Network Access 没有在发包前阻断，但不等于 LoginPage、密码加密、token 提取与 session 生命周期 E2E 已通过。本地目录包为了在改写 fuses 后恢复可执行签名，使用 ad-hoc identity 且关闭 hardened runtime；这些都只是本地测试策略。正式 release config 仍保持 hardened runtime 并期望 Developer ID，但证书、notarization、installer 和 Windows 实测都未完成。

## 8. IPC、Run 与 Beta Host 威胁用例

必须自动化覆盖：

- 恶意 iframe/弹窗发送合法 channel；
- 未知/重复命令 ID、非受信窗口、bridge 降级与菜单事件在 unsubscribe 后继续触发；
- 任意 channel、超大 payload、循环对象、畸形 frame、sequence 重放；
- 自定义协议目录穿越、编码绕过、MIME 混淆与 SPA fallback 误服务；
- renderer 伪造路径、principal、approval 或 operation id；
- Run 事件重复、gap、越权订阅、cursor 回退、取消/interaction 重放与 v1/v2 混流；
- Beta：Host executable 被替换、协议降级、错误架构、启动超时和崩溃循环；
- Beta：PTY command/env 注入、shell fallback、符号链接逃逸和孤儿进程；
- side-effect 工具的确认重放、参数替换和未知结果自动重试；
- update metadata/installer 被篡改、降级、通道混淆和断电中断。

## 9. 自动化工具边界

- Renderer/Web 单测继续使用本仓现有 Node/Vitest 工具。
- Electron 开发态可用 Playwright 验证 renderer 和 main，但其 Electron 驱动依赖调试接口；不能为了测试让正式 release 保持 inspect fuse 开启。
- 精确正式安装包增加 WebdriverIO 或平台黑盒 smoke，以及独立 packaging verifier。
- Linux headless Electron 测试需要虚拟 display；平台签名与 installer 测试必须在原生 runner 运行。
- Beta Rust Host 使用 `cargo test --workspace --locked`、clippy、fmt、audit/deny、target-specific integration 和基准。

## 10. 供应链与发布门禁

正式 artifact 必须：

- 来自受控原生 runner；package lock 无漂移，Beta 再增加 Cargo lock 检查；
- 生成 SBOM、checksum、build manifest 和私有 symbol/source-map 索引；
- macOS 签名并公证，Windows 应用/sidecar/installer 签名；
- update metadata 与 artifact 同批生成并验证 channel/arch；
- 不包含 `.env*`、source map、测试 fixture、源码 secret、prompt 或本地用户数据；
- 安装、启动、更新、回滚、卸载和旧数据迁移 smoke 通过。

2026-08-13 的 `npm audit` 基线仍有 5 项既有告警（3 moderate、1 high、1 critical）：`pptx-preview` 的嵌套 `echarts`/`uuid`，以及可选 `canvas -> @mapbox/node-pre-gyp -> tar` 链。当前没有兼容且非破坏性的自动修复，禁止用 `npm audit fix --force` 掩盖。DESK0 最终 ASAR 已验证不包含 `node_modules`，所以这些包没有进入当前桌面 artifact；它们仍是 Web/开发供应链债务，必须在 CLP-REL 前分别升级、替换或形成有期限的风险接受记录。

## 11. 隐私与观测

- 允许：版本、平台、operation 状态、耗时、字节数、错误 code、trace/span id。
- 默认禁止：prompt、对话、tool payload/result、token/API key、完整本地路径、文件内容、终端输出。
- 诊断包由用户明确生成并可预览/删减；日志有大小/时间上限。
- Renderer/main/后端只传播受控 trace context，不把身份或秘密塞入 baggage；Beta Host 同样适用。
- 安装目录/app-data 检查只能出现加密 refresh credential 与最小 `run_id/cursor/projection version`；不得出现 access token、对话、prompt 或 tool payload/result。

## 12. 批准灰度与自动停推

- Run Service v2 与 v1 并行；先部署能兼容新旧事件的消费者，再开启新事件生产。
- v1 至少保留一个完整发布周期。
- 桌面更新使用私有 HTTPS `beta` / `stable` channel，不允许 Renderer 注入 feed URL。
- 灰度顺序固定为 `Alpha -> 10% -> 50% -> 100%`。
- crash/session、恢复失败率、事件延迟、TTFT 或内存越线时自动停推；只有定位、修复和复验后继续。

## 13. 阶段退出报告

每阶段交付一份带 artifact hash 的报告：实际运行命令、设备矩阵、通过/失败、未验证边界、安全差异、性能 p50/p95、包内容和是否改变 [DECISIONS.md](./DECISIONS.md)。没有实跑不得声称通过。
