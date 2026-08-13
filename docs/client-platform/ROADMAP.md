# Client Platform 执行路线图

> 本页是 Client Platform 的唯一执行账本。稳定 ID 使用 `CLP-*`；`CLP-F0` 与 `CLP-DX1` 已完成，`CLP-P0` 仅完成独立 task ID 与 Web 被动 detach 等切片，`CLP-DESK0` 是安全壳基线。这些都不代表 CLP-DESK、durable Run 或 MVP 已完成。

## 1. 批准主线

MVP 的产品/架构顺序是：

```text
CLP-F0 文档基线
  -> CLP-DX1 Desktop Experience Foundation -----------+
                                                       |
  -> CLP-P0 Web 正确性与认证
  -> CLP-RS2 云端 durable Run Service v2
  -> CLP-SC Web/Desktop Shared Client
  -> CLP-DESK Electron 薄壳 <--------------------------+
  -> CLP-REL 发布质量与灰度

MVP 完成后，才评估 CLP-BETA-HOST Rust 本地能力。
```

CLP-DX1 不依赖 EIM 或 Run Service，可与 P0/RS2 并行，但只交付双 composition、桌面工作台和命令基础，不伪造任务状态。Electron MVP 仍依赖云端 durable Run，不依赖 Rust Host、PTY、Git 或本地 MCP。Web 继续独立构建和发布；所有阶段按退出门禁而非日期宣称完成。

## 2. 工程量与周期

| ID       | 工作包                                           |       基础工程量 | 状态                            |
| -------- | ------------------------------------------------ | ---------------: | ------------------------------- |
| CLP-F0   | 架构、目录、合同、决策、版本、测试安全和导航基线 |         4–6 人日 | 已完成（2026-08-13）            |
| CLP-DX1  | 双 composition、Desktop Workbench、命令与菜单    |       18–26 人日 | 🟢 已完成（2026-08-13）         |
| CLP-P0   | 当前 Web 正确性、认证、流式终态与边界收口        |       35–50 人日 | 🟡 进行中（两个切片完成）       |
| CLP-RS2  | 云端 durable Run Service v2                      |       47–70 人日 | 🟡 RUN-F1a 进行中；跨后端       |
| CLP-SC   | Web/Desktop 共用 Shared Client                   |       28–43 人日 | 未开始                          |
| CLP-DESK | Electron stable 薄壳与平台能力                   |       32–48 人日 | 🟡 DESK0 安全壳切片；阶段未完成 |
| CLP-REL  | 发布工程、质量、安全、性能与灰度                 |       42–67 人日 | 未开始                          |
|          | **MVP 基础合计**                                 | **206–310 人日** |                                 |
|          | **含 20–25% 风险缓冲**                           | **247–388 人日** |                                 |

以 5 人稳定跨职能团队估算，MVP 为 **17–23 周**。这是工程容量基线，不包含产品/安全审批等待和团队切换成本。DX1 内部体验版由两名前端/桌面工程师并行，预计 **2–3 周**。

`CLP-BETA-HOST` 为 MVP 后独立增量：**130–200 人日（已含 25% 风险）/ 12–18 周**。MVP + Beta 整体约 **7–10 个月**，不能把 Host 工作偷偷塞回 MVP 估算。

### 执行责任与证据账本

负责人记录角色而不是临时人名；阶段开工时必须在交付系统绑定到具体个人。证据列是最小集合，不能用口头确认替代。

| ID            | 前置依赖                                                          | 负责角色                                             | 完成证据                                                                                                   |
| ------------- | ----------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| CLP-F0        | 无                                                                | Client/Web owner；Backend/Runtime owner              | 九份客户端文档、五份后端文档、两仓入口与规则；相对链接、格式和 `git diff --check` 通过；两个独立纯文档提交 |
| CLP-DX1       | CLP-F0；DESK0 网络/CSP/登录可达性修复独立收口                     | Desktop owner；Web owner；QA                         | 双 composition、Desktop Workbench、命令/菜单同 handler、bridge v2、Web 无退化、packaged runtime 标记证据   |
| CLP-P0        | CLP-F0；EIM 身份边界；后端 refresh/OIDC 契约                      | Web owner；Identity/API owner；QA                    | 认证/租户隔离、流终态、取消与核心链路契约测试；credential localStorage 清零；错误与日志脱敏报告            |
| CLP-RS2       | CLP-F0；Principal/authorization ports；PostgreSQL/Valkey 运维评审 | Backend/Runtime owner；DB/Platform owner             | canonical schema、migration、真实 PG/Valkey 集成、故障/并发/回放测试、v1/v2 并行灰度下的单请求单执行证据   |
| CLP-SC        | CLP-P0；RUN-F1 机器契约；可用 v2 canary                           | Web/Shared Client owner；Backend contract owner      | 生成物零漂移、golden event corpus、Web 黄金链路、四并行 Run/100 chunks/s、reload 恢复报告                  |
| CLP-DESK      | CLP-DX1；CLP-SC 合同稳定；签名/发布账号已申请                     | Desktop owner；Web owner                             | macOS/Windows packaged E2E、安全协议/IPC/fuses/ASAR 检查、固定负载性能报告                                 |
| CLP-REL       | CLP-DESK；更新源、证书、公证与观测环境                            | Release/DevOps owner；QA owner；Security reviewer    | 已签名 artifact、SBOM/checksum/manifest、更新/回滚/卸载演练、8 小时 soak 与灰度停推证据                    |
| CLP-BETA-HOST | MVP 稳定；产品需求与本地权限模型获批                              | Runtime/Rust owner；Desktop owner；Security reviewer | 协议兼容、sidecar 签名/哈希、PTY/进程树/权限/崩溃恢复与 Windows IME 报告                                   |

### 五人团队日历窗口

| 周期        | 主交付                                                          |
| ----------- | --------------------------------------------------------------- |
| 第 1 周     | F0/网络修复收口、DX1 文档、证书/发布账号申请、性能 fixture 登记 |
| 第 2–3 周   | DX1 双 composition、Desktop Workbench、命令/菜单内部体验版      |
| 第 2–5 周   | P0 正确性与认证、Run 协议冻结                                   |
| 第 3–10 周  | Run Service v2 与 Electron 平台能力并行开发                     |
| 第 9–15 周  | Shared Client、Web/Desktop 接入、OIDC、回放与多 Run             |
| 第 14–19 周 | 签名更新、观测、E2E、压力/soak 与内部灰度                       |
| 第 20–23 周 | 风险窗口、兼容修复、回滚演练与扩大灰度                          |

上述是依赖重叠的排程窗口，不把工程人日简单相加；证书、OIDC provider、安全评审或真实环境未就绪会消耗第 20–23 周缓冲。

## 3. CLP-F0：文档与决策基线

范围：

- 本目录九份架构文档及 README/agent 规则/工程路线图入口。
- 明确当前纯 Web、MVP Electron + 云 Run、Beta Rust Host 三种时态。
- 精确版本只进 `VERSION_BASELINE.md`；长期正文写 stable policy。
- 本轮不改依赖、业务代码、CI、构建或发布。

退出条件：

- 九份文档互相导航且无死链。
- `PlatformPort`、`RunClient` 固定能力与远程 schema 真相源明确。
- CLP 账本、工程量、性能/恢复/灰度门槛与批准计划一致。
- diff 只含文档、导航与规则，无 `package*.json` 或业务源码改动。

## 4. CLP-DX1：Desktop Experience Foundation

目标：在不等待 Run Service/EIM、不复制产品 UI 的前提下，让 DESK0 从安全窗口基座演进为可辨识的内部桌面体验版。

范围：

- Web/Desktop 独立 composition root，共享 Application、Router、页面和业务组件。
- 最小 `PlatformPort` 与 capability 真值；`app://bundle` 下 bridge 缺失/错版 fail closed。
- Activity Rail + 可折叠/可调整上下文侧栏 + 现有 Workspace 的任务优先混合式 Desktop Workbench。
- Web 营销登录 frame 保持；Desktop 使用共享表单的紧凑登录 frame。
- 稳定命令注册表统一 `cmdk`、toolbar、快捷键和 Electron 原生菜单。
- Renderer Bridge 升级到 v2，只新增 allowlisted main → Renderer command event。
- 仅持久化 activity、侧栏开合/宽度等非敏感 UI 偏好。

退出条件：

- HTTP/Web 与 `app://bundle` Desktop composition 自动化测试通过；bridge 缺失、错版和非法命令 fail closed。
- Web 布局/路由无退化；Desktop 在 960px 窗口保持工作台并通过中文/英文、键盘和焦点验收。
- palette、toolbar、shortcut、native menu 调用同一 handler 且单次执行；输入/组合输入不误触发。
- `conversation.new` 只进入现有 Conversation 工作流，没有伪 Run、后台任务或恢复状态。
- bridge v2、staging/build manifest、ASAR/package verifier 一致；packaged smoke 验证 `data-client-runtime="desktop"`。
- 退出报告包含截图、实际命令、commit、artifact hash、设备/OS 和未验证平台。

明确非目标：RunClient/durable Run、认证存储/OIDC、通知、下载、更新、deep link、多窗口、自绘标题栏、Tauri PoC、Rust Host/文件/Git/PTY/本地 MCP。详细设计见 [DESKTOP_EXPERIENCE.md](./DESKTOP_EXPERIENCE.md)。

已实现代码切片（2026-08-13）：

- `src/main.tsx` 在 `http(s)` 与 `app://bundle` 之间选择 Web/Desktop composition，bridge 缺失或错版时显示脱敏失败页。
- 最小 `PlatformPort`、browser/desktop adapter、Desktop Workbench、紧凑认证 frame、统一命令注册表与命令面板已落地。
- Renderer Bridge v2、白名单 main → preload → Renderer 命令事件、macOS/Windows 原生菜单、staging/package contract 检查，以及读取固定 `data-client-runtime="desktop"` 标记的 smoke readiness policy 已落地。
- `test:client-platform` 已纳入项目脚本与 CI；测试源码覆盖 Renderer composition、Workbench/偏好恢复、命令面板焦点与多入口单次执行，它与 `test:desktop` 分别承担 Renderer 和 main/preload/打包合同门禁。

退出结论：最终 revision `3535fae` 已通过完整源码门禁、Bundle 预算、macOS arm64 stage/package verifier、固定 `data-client-runtime="desktop"` marker smoke、真实 packaged Renderer 网络探针，以及 Web/Desktop、960px、明暗主题和英文视觉检查。自动化同时覆盖中英文 locale、偏好真实 rehydrate、键盘/焦点和同 handler 单次执行。artifact hash、命令、截图、性能趋势与未验证边界见 [DX1_EXIT_REPORT.md](./DX1_EXIT_REPORT.md)。CLP-DX1 因此完成；CLP-DESK、CLP-REL 与 durable Run 仍保持未完成。

## 5. CLP-P0：Web 正确性与认证

目标：先让现有 Web 成为可复用的可靠产品层，避免桌面壳放大旧问题。

范围：

- 统一认证 bootstrap、刷新/失效、账号/租户 cache isolation 与跨标签页行为。
- 密码登录迁移到短期 access + rotation refresh；Web 使用 HttpOnly/Secure/SameSite cookie，清除 credential `localStorage`。
- 完成系统浏览器 OIDC + PKCE/loopback 设计；EIM-I6 显式 provider-subject binding 未完成前保持 fail closed，禁止邮箱静默合并。
- 收口 API runtime config、相对 `/api` 与绝对 base URL、REST/SSE auth/401。
- 统一 streaming 的 completed/cancelled/timed_out/interrupted/unauthorized 与意外 EOF。
- 审计并修复现有执行入口：每次尝试必须有唯一 Run/task ID；四个并发 Run 不得共享 ID、取消键或日志关联键；取消一个 Run 不得影响其他 Run。
- 现有取消入口必须校验 tenant、当前 Principal 与 Run ownership，保持幂等；detach、刷新、窗口关闭和 transport EOF 都不能自动取消任务。
- 错误、日志和 telemetry 只保留安全 code/trace ID，禁止 prompt、tool payload/result、token、上游原始响应和堆栈直出。
- 修正假成功、死入口、路由错误恢复和关键 mutation 用户反馈。
- 建立登录、Run/聊天停止恢复、知识/Studio 核心链路的可自动化基线。

退出条件：Web 单独发布无退化；认证/租户隔离与流终态有契约测试；四并发 Run/定向取消与越权取消用例通过；意外 EOF 不落成功、不落 cancel；敏感错误/日志扫描通过；桌面不需要新造一套 API/auth client。

依赖当前工程账本中的 SEC-1、ARCH-7、ENG-6/7/8/2 等条目，但状态仍在原条目维护；本页只记录 Client Platform 的进入门槛。

已完成切片（2026-08-13）：

- MultiRAG `916ed873`：Canvas 每次执行使用唯一 task ID，消除同 Agent 并发共享取消键；不包含取消授权。
- Web `8866b09`：被动卸载/刷新只 abort 本地 transport，显式 Stop 才请求 server cancel；这不承诺 v1
  request-bound Runner 在断连后继续计算，持久运行/回放仍依赖 CLP-RS2。
- MultiRAG `eb0a5999`：RUN-F1a 落地无身份依赖的九状态 reducer、v2 envelope、`message.delta`
  JSON Schema 与 replay 不变量；不包含 route、ledger/outbox、stream gateway 或授权接入，RUN-F1 仍未完成。

身份/授权收口必须等待 EIM 稳定 port。客户端任务不实现 SDK API Key Principal、Channel workload/
candidate capability、active tenant 或团队角色策略；被撤出的探索补丁不得作为 CLP-P0 完成证据。

## 6. CLP-RS2：云端 durable Run Service v2

目标：Run 生命周期独立于页面、SSE/WS 连接和 Electron 进程。

范围：

- 服务端持久化 Run、单调事件 sequence/cursor、终态与 interaction wait。
- 提供 `createRun/getRun/subscribe/cancelRun/submitInteraction` 的权威 API/事件 schema。
- 支持断线补放、重复去重、gap 检测、幂等取消和 interaction 参数摘要/重授权。
- 保留 trace id 与隐私边界；客户端重载后可重建任务投影。
- 每个 Run 只能提交一个 `completed|failed|cancelled|interrupted` 终态；无安全 checkpoint 的 Runner 崩溃必须明确进入 `interrupted`，不得伪装续跑成功。
- 读取、订阅、interaction 与取消都必须基于服务端加载的 Run 自身资源事实，并消费 EIM/目标领域授权端口返回的 opaque policy decision；Run Service 不解释 membership 或团队角色，跨租户 ID 不得泄露存在性。
- v2/v1 并行运行，先发布兼容消费者，再生产 v2 新事件。

退出条件：

- 服务端 schema、compatibility 与 migration 文档由 MultiRAG 真相源发布。
- v1 fixture 与 v2 consumer 兼容测试通过；v1 至少保留一个完整发布周期。
- 断线、重复、gap、取消、interaction、服务重启和未知执行结果有集成测试。
- 服务端可从任意有效 cursor 回放并在 cursor 过期时提供明确 resync；Renderer 的 2 秒恢复门槛归 CLP-SC/DESK 验收。

## 7. CLP-SC：Shared Client

目标：Web 与 Desktop 共享一个 Run/auth/platform 产品合同。

范围：

- 实现固定 `RunClient` 五方法，消费 MultiRAG 远程 schema 生成物，不在本仓复制 schema 真相源。
- 实现固定 `PlatformPort`：`capabilities/auth/openExternal/downloads/notifications/updates/runs`。
- browser adapter 完整可用；desktop adapter 先提供合同和 mock，后接 Electron bridge。
- Run 投影 reducer、cursor 持久、重订阅、duplicate/gap、interaction 和取消语义。
- 本地只持久化 `run_id`、cursor、投影版本等最小恢复元数据；对话、prompt、tool payload/result 不落本地。
- 保持现有 React Query/Zustand 边界：流事件不逐 chunk 写 Query cache，终态再对账。

退出条件：Web 使用 Shared Client 跑通黄金链路；v1/v2 compatibility tests、100 chunks/s 和四并行 Run 固定负载通过；Renderer reload 恢复门槛通过。

## 8. CLP-DESK：Electron MVP 薄壳

目标：以客户端形式提供现有产品，并补齐低权限桌面体验；不加入 Rust Host。

范围：

- 独立 main/preload build、secure custom protocol、最小 staging app。
- sandbox/context isolation、最小 bridge、permission/navigation/sender policy。
- `PlatformPort` 的 auth、openExternal、downloads、notifications、updates 桌面 adapter。
- Desktop refresh token 由 main 通过 `safeStorage` 加密保存，access token 仅内存；系统浏览器 OIDC 使用一次性 PKCE/loopback callback。
- 单实例、deep link、系统主题/菜单和受控下载；云 Run 仍由 Shared Client 直连。
- packaged artifact 验证所有 lazy chunk、Monaco、文档预览、千节点画布和深链 reload。

### CLP-DESK0：历史安全壳基线（2026-08-13）

已实现子集：

- Electron main 和 sandbox preload 使用独立 TypeScript project 与 direct Rolldown 配置，产物分别为单一 ESM 和单一 CJS。
- `app://bundle/` 是 standard + secure 自定义协议；拒绝非 GET、越界/编码绕过/符号链接逃逸，仅 HTML navigation 可 SPA fallback，并附加 CSP/nosniff/referrer policy。
- Vite build 生成只含 API/Admin/WS public inputs 的 package 外 receipt；staging 拒绝 receipt 与当前 production env 漂移，再固化 versioned network policy。main、stage verifier 与 package verifier 分层 fail closed；远端仅允许 exact HTTPS/WSS，本地明文仅允许 exact loopback origin，避免把 `connect-src` 放宽为整个 `http:`。
- BrowserWindow 固定 sandbox/context isolation，禁用 Node integration、webview、弹窗与非受信导航；session 默认拒绝权限、设备和下载。
- DESK0 初始 preload 只暴露 bridge v1 和静态 `capabilities()`；当前工作树已由 DX1 升级到 bridge v2 白名单命令事件，仍未使用通用 IPC。
- staging 从 Web `dist/`、main/preload 产物按显式 allowlist 组装，拒绝 source map、源码、测试、`.env*`、凭据类文件、符号链接与未知根项，生成 SHA-256 build manifest。
- electron-builder 只消费 staging app；配置 ASAR integrity 与最小 fuses。验证器检查最终 ASAR allowlist/integrity header、禁止 fallback/unpacked 目录与 binary fuse 状态。

证据命令：

```bash
npm run lint:desktop
npm run desktop:typecheck
npm run test:desktop
npm run build
npm run desktop:build
npm run desktop:stage
npm run desktop:verify:stage

# 只能在目标 OS 原生 runner 上作为本地产物证据，不纳入当前 Linux CI
npm run desktop:package:dir
npm run desktop:verify:package
```

未完成边界：DX1 已有最小 PlatformPort desktop adapter，但仍只复用现有 Web 密码登录做本地联调，不含 desktop auth adapter、OIDC/`safeStorage`、refresh rotation、扩展平台能力、Shared `RunClient`、durable Run 恢复、updater、通知、受控下载、deep link、Host/PTY/MCP、性能/soak、安装器 E2E 或签名/公证。Windows 尚无打包、启动、签名实测，因此 CLP-DESK 保持进行中。认证与执行 ownership 仍以 EIM 稳定身份/授权 port 为前置；客户端平台不构造 Principal，不解释 API Key、Channel workload、active tenant 或团队角色。

已记录的 DESK0 历史原生证据（macOS arm64，Node `24.4.1` / npm `11.5.1`，2026-08-13）：unpacked app 通过 `MULTIRAG_DESKTOP_SMOKE_OK`；该历史 smoke 只等待 DOM ready，不是当前 DX1 composition marker 证据。显式 smoke 模式使用唯一临时 profile 与 Chromium mock keychain，正常启动不启用这些测试隔离项，因此该 smoke 不验证真实 Keychain/cookie-encryption 启动路径。最终 ASAR 含 1,170 个 entry，build manifest 记录 1,059 个文件，无 `node_modules`、source map、`resources/app` 或 `app.asar.unpacked`，manifest hash 精确匹配，ASAR integrity/fuses 与 `codesign --verify` 通过。no-credential packaged Renderer 探针向 manifest 登录 origin 发起 JSON POST，实测 `OPTIONS 200` 后 `POST 200`，证明精确 CSP、本机 CORS 与 Chromium Local Network Access 没有阻止发包；这不是完整登录/session E2E。该本地 toolchain 尚未对齐 release 目标版本；`desktop:package:dir` 产物使用本地 ad-hoc 签名且关闭 hardened runtime，仅为 fuse 改写后的 unpacked smoke。正式 release config 仍要求 hardened runtime + Developer ID，但尚无证书/公证实测，不得将 ad-hoc 结果当作正式签名证据。该 smoke 还证实 strict CSP 会拒绝 Google Inter 外部 CSS，当前回退字体可用；后续应本地打包字体，不为便利放开第三方 CSP 域。

退出条件：

- Web 全部门禁不退化；macOS/Windows packaged 黄金链路通过。
- Renderer 无 Node/Electron import，正式包 fuses/ASAR allowlist 通过。
- 冷/热启动、流输入/显示与 60Hz 帧耗时达到批准门槛。
- 关闭/重载窗口不取消云 Run，2 秒内恢复投影。

## 9. CLP-REL：发布、质量与灰度

范围：

- 原生 runner 构建，macOS 签名/公证与 Windows app/installer 签名。
- SBOM、checksum、build manifest、symbols/source map 私有上传与供应链扫描。
- beta/stable 私有 HTTPS update channel、回滚、arch/channel/最低版本校验。
- 8 小时 soak、crash/session、恢复失败率、事件延迟、TTFT 与内存趋势监控。
- Run Service v2 与桌面更新均支持停推和回退。

批准灰度顺序：

1. v2/v1 并行，兼容消费者先于新事件生产者。
2. 内部 Alpha。
3. 10%。
4. 50%。
5. 100%。

crash/session、恢复失败率、事件延迟、TTFT 或内存越线自动停推；v1 至少保留一个完整发布周期。

退出条件：安装、更新、回滚、卸载、断电/断网恢复与旧版本兼容演练通过；[TESTING_SECURITY.md](./TESTING_SECURITY.md) 的所有批准门槛有 artifact hash 和 p95/soak 证据。

## 10. CLP-BETA-HOST：MVP 后本地能力

进入条件：MVP 已完成；产品数据证明用户确需 workspace/PTY/Git/本地进程/本地 MCP；团队已有 Rust 与跨平台发布 owner。

范围：Cargo workspace、Host RPC、sidecar 签名/更新、PTY/Git/fs/process、可选 SQLite journal 与本地 MCP。先做一个端到端垂直切片，不同时铺开所有能力。

退出条件包括：Host 崩溃时 UI 不退出，2 秒内重启并恢复可恢复状态；无孤儿进程；高频事件有背压；sidecar hash/签名/架构一致；未知副作用结果不自动重放。

该阶段不改变 Run Service 仍为云端 Run 权威；本地 operation 与云 Run 通过显式 contract 关联。

## 11. 关键依赖与并行策略

- CLP-DX1 可在 EIM/Run Service 前并行，但必须先独立收口 DESK0 网络/CSP/登录可达性修复；DX1 不定义 auth、Principal 或 Run wire。
- CLP-P0 可与 CLP-RS2 的后端 schema 设计部分重叠，但 Shared Client 不在远程 schema 冻结前猜实现。
- CLP-SC 的 browser adapter 先行，desktop adapter 与 CLP-DESK 后半可并行。
- 签名、更新和性能采样在 CLP-DESK 就试跑，CLP-REL 负责产品化，不能拖到功能完成后首次接触。
- CLP-BETA-HOST 绝不作为 CLP-DESK/CLP-REL 的隐藏前置条件。

## 12. 状态更新规则

- 只在对应退出条件有实跑证据时把 CLP 状态改为完成。
- 每次更新写日期、commit/artifact、验证命令、设备/服务版本和未验证边界。
- 版本漂移只更新 [VERSION_BASELINE.md](./VERSION_BASELINE.md)。
- 若计划范围或估算变化，必须同时更新合计、缓冲、周期和 [DECISIONS.md](./DECISIONS.md)。
