# CLP-DX1 退出报告

> 结论：CLP-DX1 Desktop Experience Foundation 于 2026-08-13 通过内部体验版退出门禁。它完成的是 Desktop composition、Workbench、命令系统和安全 Bridge v2，不代表 durable Run、桌面原生认证或可发布桌面 MVP 已完成。

## 1. 交付与 Git 基线

| 项目                        | 证据                                                            |
| --------------------------- | --------------------------------------------------------------- |
| 网络/CSP 前置修复           | `970fae7 fix(desktop): bind renderer network policy to package` |
| DX1 合同基线                | `28d3517 docs(client): define desktop experience foundation`    |
| DX1 产品与桌面实现          | `0a8af69 feat(desktop): add desktop experience foundation`      |
| 最终性能边界                | `aa76d74 perf(desktop): lazy load desktop workbench`            |
| 共享工作区 i18n 收口        | `3535fae fix(desktop): localize shared model action`            |
| 最终 artifact 源码 revision | `3535faebaa703c25d9d932cc213f32784757b2de`                      |

最终性能边界把 Desktop Workbench 与 `react-resizable-panels` 从 Web/Desktop 共享入口移到 Desktop 条件 chunk。Web 入口 gzip 从门禁失败时的约 `128 KB` 降到 `118 KB`，低于 `120 KB` 预算；Desktop composition 的 packaged marker smoke 同时覆盖了该异步加载路径。

## 2. 已完成范围

- `http(s)` 与 `app://bundle/` 使用独立 composition root，共享唯一 Application、Router、页面、stores 和业务组件。
- `app://bundle/` 仅在 Renderer Bridge v2 shape 合法时进入 Desktop；缺失、错版、未知 scheme 或非法 bridge 均 fail closed 到脱敏兼容页。
- Desktop 使用 Activity Rail、可折叠/可调整宽度的 Conversation 上下文栏和现有 Workspace；`960px` 下不回退到 Web Mobile Sheet。
- Web 保留营销登录 frame；Desktop 使用共享 LoginForm 的紧凑 frame。
- 固定命令注册表统一驱动命令面板、Toolbar、Renderer 快捷键和 Electron 原生菜单。
- main → preload → Renderer 只允许固定命令 channel/ID；preload 剥离 Electron event、过滤非法 ID，并提供幂等 unsubscribe。
- UI store 只持久化 activity、侧栏折叠/宽度等非敏感偏好，并带 version/migrate、范围归一化和损坏值回退。
- 当前侧栏只展示真实 Conversation；没有伪造 Running、Needs attention、后台恢复或 Run projection。

## 3. 自动化门禁

在最终代码 revision 上实际通过：

```text
npm run lint                         PASS
npm run lint:all                     PASS
npm run lint:i18n-agent              PASS
npm run lint:desktop                 PASS
npm run lint:file-size               PASS
npm run desktop:typecheck            PASS
npm run test:client-platform         PASS (10 files, 41 tests)
npm run test:desktop                 PASS (81 tests)
npm run test:product-ui              PASS (3 Node + 30 Vitest)
npm run test:security                PASS (3 Node + 1 Vitest)
npm run test:agent-t1                PASS (74 tests)
npm run test:design-tokens           PASS (11 tests)
npm run test:streaming               PASS (43 Node + 2 Vitest)
npm run test:api                     PASS (99 tests)
npm run build                        PASS
npm run check:bundle-size            PASS
npm run desktop:build                PASS
npm run desktop:stage                PASS
npm run desktop:verify:stage         PASS
npm run desktop:package:dir          PASS (macOS arm64 directory app)
npm run desktop:verify:package       PASS
```

Bundle 门禁结果：总 JS raw `25.70 MB / 26.13 MB`，入口 gzip `118 KB / 120 KB`，最大 chunk gzip `723 KB / 739 KB`。

`test:client-platform` 直接覆盖 composition 选择、bridge fail-closed、Web/Desktop auth frame、`960px` Workbench、真实 persist rehydrate、命令面板搜索/Escape/焦点恢复、输入/IME 快捷键隔离、同 handler 单次执行和 Conversation 新建语义。`test:desktop` 覆盖协议/IPC/menu、preload event 剥离、sender/URL 校验、runtime marker readiness、staging/package contract、ASAR 和 fuses。

## 4. 原生产物与网络证据

测试环境：macOS `15.7.7` (`24G720`)、Apple M4 Pro、arm64、48 GiB RAM、Node `24.4.1`、npm `11.5.1`、Electron `43.4.0`。

| 项目                        | 结果                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------ |
| artifact                    | `/Users/xldu/project/web/desktop/.out/artifacts/mac-arm64/MultiRAG.app`              |
| 文件/逻辑大小               | 267 files；369,425,768 logical bytes；370,335,744 allocated bytes（`du` 约 353 MiB） |
| artifact 可复现聚合 SHA-256 | `a50a7a7fa55e8e047833a51015fee9f6fddf130ae0c21be59e9b041f82e3813f`                   |
| `app.asar` SHA-256          | `09c342fa2b42675b35cea94a1fe2f9ea68c7dcc026b0ecd7a619f8eaf2051d9e`                   |
| 主可执行文件 SHA-256        | `74f97fe8479098ea6280d6d48eb772536b9ed890b6428096beb7cb9256b454d3`                   |
| manifest                    | schema v2；1,063 files                                                               |
| manifest content SHA-256    | `f2db594e832f1e7edb052b912b693715a6bcd7d64e92f8aa12374cf4032aa916`                   |
| contracts                   | Renderer Bridge v2；Run Client protocol `null`                                       |
| package                     | 1,174 ASAR entries；hardened Electron fuses 通过                                     |
| startup smoke               | `data-client-runtime="desktop"` 就绪后输出 `MULTIRAG_DESKTOP_SMOKE_OK`               |

artifact 聚合值可在仓库根目录用下述命令复算；它按固定 `C` locale 排序 267 个常规文件，再对 `shasum` 清单求 SHA-256：

```bash
find desktop/.out/artifacts/mac-arm64/MultiRAG.app -type f -print0 \
  | LC_ALL=C sort -z \
  | xargs -0 shasum -a 256 \
  | shasum -a 256
```

该本地 directory app 标识包含工作区相对路径，必须从仓库根运行；它不替代后续正式发布的签名 checksum/SBOM。`app.asar` 与主可执行文件哈希作为可独立复核的内容/运行时锚点一并记录。

网络探针从真实 packaged Renderer、隔离 user-data profile 和 mock keychain 发起 synthetic JSON 请求，只记录 method/status，不读取响应体：

```text
OPTIONS http://127.0.0.1:8123/api/v1/auth/login  200 Preflight
POST    http://127.0.0.1:8123/api/v1/auth/login  422 Fetch
```

`422` 是无效 synthetic payload 已穿过 `app://bundle` CSP、CORS 和 Chromium 本地网络边界并到达后端校验的证据，不是登录成功。未使用真实账号、密码、token，也未证明密码加密、Authorization header、refresh/session 生命周期或 EIM/OIDC。

## 5. 视觉证据

所有截图均来自 revision `3535fae`。Workbench 截图使用隔离 profile，在 Renderer 内存中注入不含真实凭证的 synthetic auth projection；没有修改生产代码或持久化用户数据。

| 场景                   | 文件                                                                           | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| Web 登录               | `/tmp/multirag-dx1-3535fae-evidence.0WcPmU/00-web-login.png`                   | `f6342de9169c34c1b9ab687caf19466aababa36e9080c8f15538021605f20ab2` |
| Desktop 紧凑登录       | `/tmp/multirag-dx1-3535fae-evidence.0WcPmU/01-desktop-login.png`               | `10d9d8f36b3ad4a4cbb04749cc816d5c7d12eca2701db9bd23aae60c020e2c85` |
| Desktop Workbench 1440 | `/tmp/multirag-dx1-3535fae-evidence.0WcPmU/02-desktop-workbench-1440.png`      | `8fed200e154a42d37a8f39b9061be87dd0cebbe5c2515b5b1a2bb4a4f35ceb3c` |
| Desktop Workbench 960  | `/tmp/multirag-dx1-3535fae-evidence.0WcPmU/03-desktop-workbench-960.png`       | `79fbd482631addafc5847785780a031fd39e8c34ef274086cd341c8e86a8d7d8` |
| Desktop 登录暗色       | `/tmp/multirag-dx1-3535fae-evidence.0WcPmU/04-desktop-login-dark.png`          | `f0c579c8e702be6d9a06577ac4b865d6799f66e02208db9ef245713d8800c86f` |
| Desktop Workbench 暗色 | `/tmp/multirag-dx1-3535fae-evidence.0WcPmU/05-desktop-workbench-1440-dark.png` | `06073502c40af69ac1b34dd4fff51b2f9fee8d28a29b62fdea5ee05302573bd0` |
| Desktop Workbench 英文 | `/tmp/multirag-dx1-3535fae-evidence.0WcPmU/06-desktop-workbench-1440-en.png`   | `fab53c6a29a422965b1d2005ff43f5fcb147439ba67dd68ec8af07e15a34c6ad` |

人工复核确认：Web 仍有营销区；Desktop 登录不加载营销轮播；1440/960 Workbench 均有 Activity Rail、Conversation context 和主工作区，无空白、裁剪或 mobile 降级；暗色 token 生效。英文运行时的 store、HTML 与 storage 均为 `en-US`，且页面显示 `Configure model`、不再包含旧的“配置模型”；命令面板键盘/焦点和侧栏持久恢复同时由自动化测试覆盖。

## 6. 性能趋势边界

本报告只把启动和命令面板首次打开记录为 DX1 趋势样本；它们不是固定实验室环境的正式 p95，也不替代 `TESTING_SECURITY.md` 中 durable Run、8 小时 soak、流式输入和帧时间门槛。

- 启动 `n=5`：`497.9 / 508.9 / 483.2 / 490.8 / 482.4 ms`，中位数 `490.8 ms`。计时从新隔离 profile 的 process spawn 到 `readyState=complete`、Desktop marker 与紧凑认证 frame 就绪，包含 CDP/mock-keychain 开销。
- 命令面板 `n=1`：真实 Toolbar click 到 `role=dialog` 为 `20.1 ms`，下一动画帧 `21.5 ms`，焦点位于搜索 input；未覆盖 native-menu 路径。
- 短窗口 CPU/RSS 样本在采集期间持续漂移，未形成可信稳态，因此本报告不声称 idle CPU `<1%`、内存门槛或泄漏门槛通过。它们必须在无 CDP、固定 fixture、较长 settle 和正式 harness 中重测。

## 7. 未验证与后续阶段

以下未完成，因此 DX1 通过不等于 CLP-DESK、CLP-REL 或桌面 MVP 完成：

- 真实账号登录、refresh rotation、Desktop `safeStorage`、系统浏览器 OIDC + PKCE 和 EIM 身份合同；
- durable Run、窗口关闭后继续、断线回放、多 Run、Needs attention/Running/Ready；
- 通知、下载、外链、单实例、deep link、自动更新；
- Windows 原生打包、签名和 installer E2E；macOS Developer ID、hardened runtime release、notarization；
- 生产 Keychain/cookie-encryption 启动路径、正式更新/回滚/卸载、SBOM；
- 完整 lazy route、Monaco/文档/画布 packaged E2E、固定负载 p95 和 8 小时 soak；
- Rust Agent Host、本地文件/Git/PTY/MCP。

后续主线不变：优先推进云端 Run Service ledger/outbox/stream 与 Shared `RunClient`；EIM 并行冻结认证上下文和刷新/OIDC 合同。Rust Host 仍是 MVP 稳定后的 Beta，不作为下一阶段前置。
