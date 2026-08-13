# Client Platform 推荐目录与构建边界

> 这是分阶段布局。CLP-DESK0 已实体化 Electron 安全壳、最小 Renderer Bridge、构建/staging/packaging 工具和对应测试；CLP-DX1 已冻结 entrypoint、最小 PlatformPort、Desktop Workbench 与命令目录，代码完成状态只以 [ROADMAP.md](./ROADMAP.md) 为准。Shared Client、`host/`、Host RPC 和发布资产仍是后续阶段目标。

## 0. 当前 DESK0 子集

```text
desktop/
├── electron/
│   ├── main/                         # 生命周期、窗口、安全策略、app://bundle/
│   └── preload/                      # 最小 capability bridge
├── protocol/renderer-bridge/          # 浏览器安全 types/DTO，不依赖 Electron
├── build/                             # direct Rolldown、staging、builder、产物验证
├── tests/                             # contract/main/security/packaging
├── tsconfig.main.json
├── tsconfig.preload.json
└── .out/                              # 全部 gitignored
```

DESK0 没有创建 `src/entrypoints`、`src/platform`、`src/agent-runtime`、`desktop/host` 或 `desktop/protocol/host-rpc`。这是有意的渐进边界：DX1 只实体化前两项的最小 composition/capability 子集；在 Shared Client 和远程 Run 合同冻结前，安全壳不猜 auth、Principal 或 Run wire。

## 1. 推荐布局

```text
web/
├── src/
│   ├── pages/、components/、api/、stores/ # 现有产品 UI，保持原位
│   ├── entrypoints/
│   │   ├── web.tsx
│   │   ├── desktop.tsx
│   │   └── mount-application.tsx      # 共享 providers/Application 装配
│   ├── platform/
│   │   ├── contracts/                   # 浏览器安全的 PlatformPort/capability
│   │   ├── browser/                     # Web adapter
│   │   └── desktop/                     # 只调用 preload bridge
│   ├── components/layout/desktop/        # DX1 Activity Rail/Context Panel/Workbench
│   ├── lib/commands/                     # 稳定命令 registry/palette/shortcut
│   └── agent-runtime/
│       ├── client/                      # 固定 RunClient 五方法
│       ├── protocol/generated/          # 从 MultiRAG 真源生成，禁止手写
│       ├── state/                       # reducer/projection/replay
│       └── transport/                   # WebSocket/SSE/Desktop adapter
├── vite.config.ts                       # 仅 renderer -> 根 /dist
├── dist/                                # 唯一 React Renderer 产物
└── desktop/
    ├── electron/
    │   ├── main/
    │   │   ├── index.ts                 # 极薄 composition root
    │   │   ├── lifecycle/
    │   │   ├── windows/
    │   │   ├── security/
    │   │   ├── ipc/
    │   │   ├── app-protocol/
    │   │   ├── host/                    # Beta 才创建：sidecar supervisor
    │   │   ├── credentials/
    │   │   └── updates/
    │   └── preload/
    │       ├── index.ts
    │       └── bridge.ts
    ├── protocol/
    │   ├── renderer-bridge/
    │   └── host-rpc/                    # Beta 才创建
    ├── host/                             # 整棵目录均为 MVP 后 Beta
    │   ├── Cargo.toml                   # virtual workspace, resolver = "3"
    │   ├── Cargo.lock
    │   ├── rust-toolchain.toml
    │   └── crates/
    │       ├── hostd/
    │       ├── host-domain/
    │       ├── host-core/
    │       ├── host-protocol/
    │       ├── host-platform/
    │       ├── host-storage/
    │       └── host-telemetry/
    ├── build/
    │   ├── rolldown.main.config.mjs
    │   ├── rolldown.preload.config.mjs
    │   ├── electron-builder.config.mjs
    │   ├── build-electron.mjs
    │   ├── stage.mjs
    │   ├── verify-stage.mjs
    │   ├── package-electron.mjs
    │   └── verify-package.mjs
    ├── release/                         # 配置与公开资源，不含 secret
    │   ├── icons/
    │   ├── entitlements/
    │   └── channels/
    ├── tests/
    │   ├── contract/
    │   ├── main/
    │   ├── preload/
    │   ├── security/
    │   ├── e2e/
    │   ├── packaging/
    │   └── performance/
    ├── tsconfig.main.json
    ├── tsconfig.preload.json
    └── .out/                            # 全部 gitignored
        ├── build/
        ├── host/
        ├── stage/app/
        ├── unpacked/
        └── artifacts/
```

Rust crate 自身的 unit/integration/benchmark 分别放在对应 crate 的 `src/`、`tests/`、`benches/`，不要假设 virtual workspace 根的普通 `tests/` 会成为 Cargo target。

首期保持当前单包，不移动现有 `src/pages`、组件或设计系统。只有 Web/Desktop 已形成两个真实消费者、协议稳定，并且重复构建/独立发布成本已经有证据时，才迁移到长期 workspace：

```text
client/
├── apps/
│   ├── web/
│   └── desktop/
├── packages/
│   ├── agent-client/
│   ├── platform-contracts/
│   └── product-ui/          # 最后抽取
├── desktop/host/
├── tooling/
└── e2e/
```

MultiRAG 继续是独立 Python 后端仓，不并入客户端 workspace；远程 OpenAPI/event schema 仍由后端真源生成。

## 2. 依赖方向

| 层                                    | 允许依赖                                                                      | 禁止依赖                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `src/pages`、`src/components` 产品 UI | Web API、React、`PlatformPort`、Shared `RunClient`                            | Renderer Bridge、`electron`、`node:*`、main/preload、Host transport、真实路径/凭据 |
| `src/entrypoints`                     | Application、Router、Platform adapter、外壳 composition                       | Electron/Node runtime API、Host transport、身份或 Run wire 推导                    |
| `src/platform/desktop`                | `PlatformPort`、纯 Renderer Bridge types                                      | `electron`、`node:*`、main/preload 实现、Host transport                            |
| `src/lib/commands`                    | 浏览器安全命令 ID、注册表、Router/UI action ports                             | Electron event、`ipcRenderer`、任意 channel、业务持久化                            |
| 其他 `src/` Renderer 基础层           | Web API、React、`PlatformPort`、Shared `RunClient`                            | `electron`、`node:*`、main/preload、Host transport、真实路径/凭据                  |
| Preload                               | `contextBridge`、`ipcRenderer`、纯 schema/types                               | React pages/stores、`ipcMain`、fs/net/process、数据库、通用 IPC 暴露               |
| Main                                  | Electron main API、Node async API、Renderer Bridge；Beta 可加 Host supervisor | React/UI store、PTY/SQLite/MCP 实现、同步 IPC、长 CPU/同步 IO                      |
| Renderer Bridge                       | schema、DTO、channel constants                                                | Electron、Node、网络、数据库、业务副作用                                           |
| Host Protocol                         | framing、版本、generated DTO                                                  | Electron、Renderer shape、存储或业务实现                                           |
| Host Core                             | domain、ports、取消/审批编排                                                  | Electron、DOM、SQL、平台具体 API                                                   |
| Host adapters                         | 对 core ports 的实现                                                          | Renderer、preload、main UI                                                         |
| Build/Release                         | 显式输入、manifest、签名配置                                                  | 运行时业务 import、仓库全量 glob、源码 secret                                      |

这些边界应通过 path-scoped ESLint `no-restricted-imports`、独立 TypeScript project、Cargo crate graph 和 CI contract check 强制，而不是只靠约定。

CLP-DX1 只允许 `src/platform/desktop/**` 和 Desktop entrypoint 静态依赖 `desktop/protocol/renderer-bridge` 的纯 types/DTO；该例外必须精确到路径。`src/pages/**`、通用组件和 stores 继续禁止任何包含 `desktop`、`electron` 或 `node:*` 的运行时依赖，并以反例 fixture 固化。

## 3. Vite 8 构建策略

### Renderer

- 保持现有 `vite.config.ts` 为 renderer-only，继续输出根 `dist/`。
- `src/main.tsx` 只做受信 scheme/bridge 的启动选择；Web/Desktop entrypoint 共享 mount/providers，不复制 Router 或产品页面。
- Web build 可以包含 Desktop composition chunk，但不得在 HTTP 路径加载或执行 Desktop bridge adapter；staging 仍从同一个 `dist/` 复制 allowlist。
- 不把 Electron 插件塞入现有配置；Web build 和 Docker build 不依赖桌面工具链。
- 当前 Monaco 插件固定复制到 `dist/vs`，因此 main/preload 绝不能复用或清理根 `dist/`。

### Main

- 用独立 direct Rolldown 配置生成一个 Node ESM 入口：`desktop/.out/build/main/index.mjs`。
- 仅 externalize `electron` 与 Node built-ins；允许的内部/第三方 JS 尽量 bundle，避免给运行包携带仓库级 `node_modules`。
- main 的 source map 只作为私有调试产物上传，不进入安装包。

### Preload

- 用独立配置生成 `desktop/.out/build/preload/index.cjs`。
- 必须单入口、单文件、无 dynamic chunk；sandbox preload 不依赖普通 Node module resolution。
- 根 package 是 `type: module`，显式 `.cjs` 避免加载语义漂移。

### 为什么当前不采用 electron-vite

当前 stable `electron-vite` 的 peer 范围不包含 Vite 8；包含 Vite 8 的版本仍是 prerelease。CLP-DESK 不降级现有 Vite，也不把 beta 变成生产基线。它未来稳定后可以替换开发编排，但不能改变目录、协议和 staging 边界。

## 4. Staging 与发布产物

electron-builder 只能消费一个显式 staging app，不能把仓库根作为 app directory：

```text
desktop/.out/stage/app/
├── package.json             # 最小 name/version/type/main，无生产 node_modules
├── main/index.mjs
├── preload/index.cjs
├── renderer/                # 从 /dist allowlist 复制
└── build-manifest.json      # commit、版本、composition、Shared Client/Bridge；Beta 加 Host hash
```

`stage.mjs` 必须：

- 从干净的目标目录开始并校验目标路径，禁止未解析的危险 glob。
- 排除 `*.map`、`stats.html`、测试、源码、环境文件和凭据。
- 生成包含输入 hash、app、composition、Shared Client、Bridge 与 target 的 manifest；DX1 bridge 精确为 v2，Beta 再加入 Host/protocol/hash。
- 拒绝任何未在 allowlist 中的新文件，避免默认 `**/*` 悄悄扩大安装包。

MVP 只有 renderer/main/preload，均进入 `app.asar`。Beta 才把 Rust executable 通过 `extraResources` 放到 `resources/host/<platform>-<arch>/`；Host 位于 ASAR 外、架构与 Electron 一致并在签名前组装。

## 5. 开发编排

目标 `dev-runner.mjs` 只负责编排：

1. 启动现有 Vite dev server。
2. watch main/preload 独立 build。
3. 首个有效产物生成后启动 Electron。
4. renderer 使用 HMR；main/preload 变化重启 Electron。
5. Beta 才增加 Host debug binary，且必须完成同样的协议握手。

生产 main 不接受任意 dev URL；开发 URL 必须由显式 dev mode 和 loopback allowlist 同时启用。

## 6. Cargo workspace 规则（CLP-BETA-HOST）

- 使用 virtual workspace 并显式 `resolver = "3"`。
- 所有成员共享 `Cargo.lock`、`target/`、`workspace.package`、`workspace.dependencies` 与 `workspace.lints`。
- 应用仓必须提交 `Cargo.lock`；CI release 使用 `--locked`。
- `hostd` 只负责参数、logging、transport 和依赖装配；业务逻辑不堆入 `main.rs`。
- `host-protocol` 不得依赖 Tokio、SQLite、PTY 或平台 crate。
- 默认 `unsafe_code = "forbid"`；确需 unsafe 的平台 adapter 独立 crate、最小范围和专项审计。
- generated 文件由 schema 生成并做 drift check，禁止手改。

## 7. 产物所有权

| 目录                             | 所有者                       | 是否提交                     |
| -------------------------------- | ---------------------------- | ---------------------------- |
| `dist/`                          | Web renderer build           | 否                           |
| `desktop/.out/build/`            | main/preload 中间产物        | 否                           |
| `desktop/host/target/`           | Cargo cache                  | 否                           |
| `desktop/.out/stage/`            | packaging staging            | 否                           |
| `desktop/.out/artifacts/`        | installer/update metadata    | 否；由 CI 发布               |
| `desktop/protocol/**/generated/` | 生成 contract                | 后续按决策提交并 drift check |
| `desktop/release/`               | 公开配置、icon、entitlements | 是；禁止 secret              |
