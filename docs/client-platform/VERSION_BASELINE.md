# Client Platform 版本基线

> 唯一精确版本快照，核验时间：2026-08-13（Asia/Shanghai）。其他 Client Platform 文档只描述 stable 通道和兼容政策。

## 1. 使用方法

- **Current**：本仓当前已经声明或实际解析；不得写成桌面能力。
- **阶段锁定**：开始对应 CLP 阶段时在 manifest/lockfile 显式锁定，并在 CI 记录。
- **Stable channel**：长期跟随受支持稳定通道，但每个 release 仍记录精确版本和 hash。
- **Candidate**：仅供 PoC；未完成兼容/性能/打包验证前不得加入架构必选项。
- **External target**：后端升级联调目标，不由本 Web 仓锁定。

本文件是时点快照，不代表允许自动升级。每次阶段开工和每次 release 都要从官方源重新核验。

## 2. 当前 Web 基线

| 组件                   | 精确版本/声明 | 状态与约束                                  |
| ---------------------- | ------------- | ------------------------------------------- |
| 应用                   | `0.9.8`       | Current，来自 `package.json`                |
| React / React DOM      | `19.2.8`      | Current resolved；桌面复用，不另建 UI 栈    |
| Vite                   | `8.2.1`       | Current resolved；renderer build 基线       |
| TypeScript             | `5.8.3`       | Current resolved，保持兼容基线              |
| `@vitejs/plugin-react` | `6.0.5`       | Current resolved                            |
| Node engine            | `>=22.12.0`   | Current 声明，F0 不修改                     |
| npm engine             | `>=10`        | Current 声明                                |
| package manager        | `npm@11.9.0`  | Current 声明；实际发布应由 Corepack/CI 对齐 |

TypeScript registry 在本次核验时的 latest 为 `7.0.2`，但升级跨度涉及 Vite、ESLint、类型定义和全仓编译验证，**不进入 CLP-DESK 改造**；当前继续锁 `5.8.3`。

## 3. 协议生成与测试基线

| 组件                     | 2026-08-13 快照 | 决策                                                        |
| ------------------------ | --------------- | ----------------------------------------------------------- |
| openapi-typescript       | `7.13.0`        | CLP-SC 从 MultiRAG OpenAPI 生成类型；生成后 CI 检查零 diff  |
| Ajv                      | `8.20.0`        | CLP-SC 对 event/bridge payload 做运行时 schema 校验         |
| Playwright               | `1.62.1`        | 开发态 Electron 与 Web E2E；不改变正式包 inspect fuse       |
| WebdriverIO              | `9.30.1`        | 正式安装包黑盒 smoke 基线                                   |
| `@wdio/electron-service` | `10.2.0`        | WebdriverIO Electron service 基线，与正式 artifact 分开验证 |

以上均是阶段锁定基线，F0 不安装。协议生成工具只消费后端真源，不把生成物目录升级成第二份手写 schema。

## 4. 桌面 CLP-DESK/REL 基线

| 组件              | 2026-08-13 快照                          | 决策                                                              |
| ----------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Node LTS          | `24.19.0`（Krypton，随附 npm `11.17.0`） | CLP-DESK 构建/CI 目标；修改 engines/packageManager 需独立升级任务 |
| Electron          | `43.4.0`                                 | CLP-DESK 显式精确锁；跟随受支持 stable 升级节奏                   |
| Rolldown          | `1.2.4`                                  | CLP-DESK main/preload direct build 显式精确锁                     |
| electron-builder  | `26.15.7`                                | CLP-DESK 显式精确锁；见下方 dist-tag 说明                         |
| electron-updater  | `6.8.9`                                  | CLP-REL 候选；更新链路落地时精确锁并做签名/回滚测试               |
| `@electron/fuses` | `2.1.3`                                  | CLP-DESK packaging/security 工具精确锁                            |

### electron-builder dist-tag 差异

核验时 npm `latest` 是 `26.15.3`，但官方 `v26` dist-tag/指定稳定补丁是 `26.15.7`。本方案不依赖浮动 `latest`，明确锁 `26.15.7`。任何升级都需重跑 ASAR integrity、fuses、签名、公证、sidecar 和更新 metadata 测试。

### electron-vite 暂不选

| 版本                | 官方 peer     | 结论                       |
| ------------------- | ------------- | -------------------------- |
| stable `5.0.0`      | Vite `5/6/7`  | 与当前 Vite `8.2.1` 不兼容 |
| beta `6.0.0-beta.1` | 包含 Vite `8` | prerelease，不作为生产基线 |

因此 CLP-DESK 使用当前 renderer Vite build + 独立 direct Rolldown main/preload build。禁止为了采用 electron-vite 降级 Vite；其 stable 明确支持当前 Vite 后再重评。

## 5. Beta Rust Host 基线

| 组件                 | 2026-08-13 快照 | 决策                                                                  |
| -------------------- | --------------- | --------------------------------------------------------------------- |
| Rust stable          | `1.97.1`        | CLP-BETA-HOST 建 workspace 时在 `rust-toolchain.toml` 精确锁并复核    |
| Cargo                | `1.97.1`        | 随 Rust toolchain；应用必须提交 `Cargo.lock`，release 使用 `--locked` |
| Rust edition         | `2024`          | workspace package/crate 统一 edition，不混用旧 edition                |
| Tokio                | `1.53.1`        | Beta async runtime 基线；按实际 feature 最小化                        |
| portable-pty         | `0.9.0`         | Beta PTY 基线；必须验证 Windows ConPTY、中文 IME、resize 与进程树     |
| rusqlite             | `0.40.2`        | Beta SQLite journal 基线，固定 `bundled` feature                      |
| tracing              | `0.1.44`        | Beta structured diagnostics 基线                                      |
| opentelemetry (Rust) | `0.32.0`        | Beta OTel 基线；exporter/features 在隐私评审后最小化                  |

上述是批准的 Beta 起始选型，不代表已安装或通过目标 macOS/Windows 验证；进入 CLP-BETA-HOST 时仍需重新核验 stable 版本、license、advisory、打包体积和真实故障恢复。

Host transport 也未选定；framed stdio、Unix domain socket/named pipe 需先做延迟、背压、权限和故障恢复 PoC。

## 6. 后端升级联调快照

这些是跨仓升级验证目标，不是本仓依赖；最终以服务端 lockfile、镜像 digest 和部署清单为准。

| 组件                                 | 官方快照/目标 | 状态                                                                                   |
| ------------------------------------ | ------------- | -------------------------------------------------------------------------------------- |
| Python                               | `3.13.14`     | External target；采用 python.org 当前 3.13 基线，不采用第三方生命周期 API 的 `3.13.15` |
| FastAPI                              | `0.141.1`     | Run API target；是否升级由后端 lock 与契约测试决定                                     |
| Uvicorn                              | `0.52.1`      | ASGI serving target；需验证 WS/SSE、graceful shutdown 与代理行为                       |
| Pydantic                             | `2.13.4`      | OpenAPI/event schema 真源 target                                                       |
| psycopg                              | `3.3.4`       | PostgreSQL async driver target；需跑事务/outbox/故障集成测试                           |
| PostgreSQL                           | `18.4`        | 升级验证目标；采用 PostgreSQL 官方当前 minor，不采用第三方 API 的 `18.6`               |
| Valkey                               | `9.1.1`       | 升级验证目标；按官方下载页从草案 `9.1.0` 更新到当前补丁                                |
| OpenTelemetry Python SDK/API         | `1.44.0`      | Run Service observability target                                                       |
| OpenTelemetry Python instrumentation | `0.65b0`      | 版本线本身使用 beta 编号；仅在兼容矩阵通过后采用，不等于接受任意 prerelease            |

OpenTelemetry 各语言组件不共享同一版本号，不能写一个“OTel 版本”覆盖全部层。客户端与后端只约定 W3C trace context、允许的 attributes 和隐私边界。

## 7. 锁定政策

### 必须精确锁

- Electron、electron-builder、electron-updater、`@electron/fuses`、main/preload bundler。
- Node/npm release toolchain、签名 runner image、安装包 target tooling。
- 应用的 `package-lock.json`、Rust `Cargo.lock`、Host executable hash。
- updater metadata schema、Bridge/Host protocol version 和 cloud API compatibility range。

### 可写 stable channel，但 release 要记录精确值

- Electron 日常升级政策、Node LTS、Rust stable、PostgreSQL/Valkey 受支持 minor。
- 文档长期规则不得写“自动使用 latest”。
- Electron 每月复核安全更新，并遵循官方最近稳定版本支持窗口；升级仍以兼容/E2E/签名通过为前提。

### 尚不应选定

- electron-vite prerelease。
- Host RPC 具体 transport。
- Linux 首发打包格式。
- OpenTelemetry exporter、collector 拓扑和全量 instrumentation。

## 8. 兼容风险

- Electron 每个 major 捆绑 Chromium/Node；按官方建议逐 major 升级并重跑 preload、CSP、协议、原生菜单、fuses 与 E2E。
- `RunAsNode=false` 会使依赖 `ELECTRON_RUN_AS_NODE` 的 `child_process.fork` 失效；本架构使用 Rust sidecar 或 Electron Utility Process。
- `EnableCookieEncryption` 是单向迁移，公开版本启用后不得随意关闭。
- ASAR integrity 需要 packaging tool 正确写入 header hash；只 flip fuse 不等于已保护。
- Rust crate 使用 SemVer requirement，但真正可复现版本来自已提交的 `Cargo.lock`。
- Python/PostgreSQL/Valkey 升级必须以实际服务迁移、驱动兼容和 smoke 为准，不由客户端计划代替验证。

## 9. 更新步骤

更新本文件时必须记录：核验日期、官方源、旧/新值、是否改变选择、兼容验证和对应阶段。版本漂移不能顺手改长期架构正文。
