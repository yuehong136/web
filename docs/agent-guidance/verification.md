# 验证与构建

按变更影响选择检查。命令以 `package.json`、CI 以 `.github/workflows/ci.yml` 为准。

## Scope

选择覆盖本次影响面的检查，多个范围取并集。局部源码改动可先对相关文件运行 ESLint 和所属测试 lane；类型、导出、依赖或构建配置变化运行 `npm run build`，源文件增删或大小变化运行 `npm run lint:file-size`。跨模块改动、提交前或无法判断影响面时运行 `npm run lint` 与相关完整门禁。纯文档不触发源码门禁；CI 仍执行完整检查。

| 变更                                            | 验证                                                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 纯 Markdown / 指令 / 注释，不改变运行行为       | diff、本地链接/锚点、引用路径、命令存在性、规则引用一致性；无需业务测试                                                                                                  |
| API 端点、信封、归一化                          | `npm run test:api`；覆盖路由/错误/响应合同                                                                                                                               |
| Agent serializer / adapter / operator           | `npm run lint:typed`、`npm run typecheck:agent-strict`、`npm run test:agent-t1`；其他 Agent 严格目录的类型变更也跑 strict 检查                                           |
| SSE / chunk reducer                             | `npm run test:streaming` 及受影响消费面的测试                                                                                                                            |
| 设计令牌 / 调色板 / 生成器                      | `npm run build:themes`，核对生成物；`npm run test:design-tokens`；提交生成物                                                                                             |
| Agent / Agents / Layout 用户可见文案            | `npm run lint:i18n-agent`，所改表面的中英切换；语言服务 / share locale 验收见 frontend 的 i18n 节                                                                        |
| 产品能力、mutation 反馈、路由恢复               | `npm run test:product-ui` 及所改行为对应测试；专项脚本不一定包含全部测试，检查实际覆盖                                                                                   |
| HTML / 链接 / 净化 / 安全规则                   | `npm run test:security` 及受影响渲染器回归                                                                                                                               |
| Web/Desktop composition、PlatformPort、命令系统 | `npm run test:client-platform`                                                                                                                                           |
| Desktop main/preload、协议、打包边界            | `npm run lint:desktop`、`npm run desktop:typecheck`、`npm run test:desktop`；构建链路改动再顺序跑 Web build → `desktop:build` → `desktop:stage` → `desktop:verify:stage` |
| 重型依赖、懒加载、widget、bundle 配置           | Web build 后 `npm run check:bundle-size`；需要定位时用 `npm run build:analyze`，`stats.html` 与 `.map` 不进入公开部署包                                                  |
| 增删/移动测试文件、runner、inventory、CI        | `npm run verify:test-inventory`、`npm run test:ci`；依赖/工具链改动覆盖其影响的构建与测试                                                                                |

UI 变更检查明暗主题、键盘交互及受影响流程。新增或改变 serializer、adapter、registry、parser、纯工具、流式 reducer、API 合同时，补足稳定外部行为的回归覆盖；重命名、注释等无行为变化或已有充分覆盖时，不为满足文件触碰规则新增重复测试。流式合并逻辑用 fixture，不依赖真实网络。

本地检查失败后，修复本次引入的问题并重跑受影响检查；已有/无关失败记录原因，不顺手扩成无关修复。只有代码、环境或风险变化才扩大或重复验证。

## Toolchain

- `tsc` 使用 TypeScript 7 原生编译器；`typescript` npm alias 保留官方 TS 6 Compiler API 给 ESLint 等消费者，`tsc6` 可用于兼容性诊断。具体 alias/版本以 package/lock 为准。不要把 Compiler API 消费者改成导入 native 包，也不要因它们的 peer 需求恢复旧版构建编译器。

- 测试使用 `tsx --test` / Node test / Vitest；不引入 Jest，不顺手迁移存量 runner。测试放对应 `__tests__/`；API 合同在 `src/api/__tests__/`。
- 新增测试必须被 `verify:test-inventory` 归到唯一正式 lane 并进入 `test:ci`；仅加进专项脚本不够。lane 为 `source-node`、`source-vitest`、`desktop-node`、`tooling-node`。
- `patch-package` 在 postinstall 执行，补丁失效要修补丁，不能通过删除补丁绕过。
- Vite 使用 Rolldown/Oxc。生产拆包配置为 `build.rolldownOptions.output.codeSplitting.groups`；不恢复 Rollup `manualChunks`，不为桌面构建降级 Vite 8。预构建/压缩优先使用 `rolldownOptions` / `oxc`，临时兼容需有第三方插件不兼容证据。

## 命令

```bash
npm run dev          # Vite 开发服务器，默认仅本机访问，端口 5173
npm run dev:host     # 绑定 0.0.0.0，用于局域网联调
npm run build        # tsc -b && vite build
npm run build:analyze # 生成 dist/stats.html bundle treemap（不部署）
npm run lint         # eslint src
npm run lint:all     # eslint .
npm run lint:typed   # type-aware lint，先覆盖 Agent 关键目录
npm run lint:i18n-agent # 扫描 Agent/Layout 新增硬编码中文 UI 文案
npm run typecheck:agent-strict # Agent 关键目录严格类型检查
npm run build:themes # 修改 tokens.ts 后重新生成 src/themes/{light,dark}.css + token-values.generated.ts
npm run build:docker # 不跑 tsc -b 的 vite build（仅 Docker 镜像构建用 — 不得用来绕过类型错误）
npm run preview      # 预览生产构建
npm run verify:test-inventory # 校验所有 test/spec 文件都有唯一正式测试 lane
npm run test:unit    # 运行 src 与 tooling 的全部 Node/Vitest 单元测试
npm run test:ci      # CI 正式测试入口：inventory + src/tooling/desktop 全量测试
npm run test:agent-t1 # tsx 跑 node --test：agent serializer + adapter
npm run test:design-tokens # tsx 跑 node --test：设计令牌工具（调色板、token 取值）
npm run test:streaming # tsx 跑 node --test：共享流式运行时（SSE transport + chunk 合并 reducer）
npm run test:api     # tsx 跑 node --test：API 层契约（路由、信封、归一化）
npm run test:product-ui # 产品能力、Search 导出、路由恢复与 mutation ownership 合同
npm run test:client-platform # Web/Desktop composition、PlatformPort 与命令系统合同
npm run test:security # 安全 lint 规则 + Toast DOM 注入边界回归
npm run lint:desktop # 检查 Electron main/preload、协议与构建脚本
npm run desktop:typecheck # 分别类型检查 Electron main 与 preload project
npm run test:desktop # 桌面壳 main/preload/协议/打包合同测试
npm run desktop:build # Rolldown 独立生成 main ESM 与 sandbox preload CJS
npm run desktop:stage # 从 Web/main/preload 显式 allowlist 组装 staging app
npm run desktop:verify:stage # 验证 staging allowlist、manifest 和敏感文件排除
npm run lint:file-size # 文件体积棘轮：超标文件不得膨胀（基线：scripts/file-size-baseline.json）
npm run lint:file-size:update # 偿还债务（行数下降）后收紧基线（禁止用来放宽）
npm run check:bundle-size # Bundle 预算门禁，build 后运行（预算：scripts/bundle-size-budget.json）
```

**注意**：没有裸 `test`、`format` 或 `typecheck` 脚本。正式测试门禁是 `npm run test:ci`；它先校验 inventory，再按 runner 自动执行全部 `src/`、`scripts/`、`eslint-rules/` 与 `desktop/` 测试。`test:unit` 运行不含 Desktop 的单元测试，原有 `test:agent-t1`、`test:api` 等脚本继续作为局部快速反馈入口。全量类型检查由 `npm run build` 完成；Agent 关键目录补充跑 `npm run typecheck:agent-strict`，桌面壳使用 `npm run desktop:typecheck`。格式化通过 Prettier + lint-staged 作用于 staged 文件，**不要做全仓格式化**。测试运行时为 `tsx --test` / Node test / Vitest，**不要引入 Jest**。

**CI**：`.github/workflows/ci.yml` 在每次 push/PR 到 `master` 时通过 `test:ci` 执行完整测试 inventory，并运行现有 lint、Web/Agent/Desktop typecheck、Web build、Bundle budget、Desktop build/stage/verify 门禁。这些桌面门禁只验证跨平台源码/合同/构建/staging，不代表 Windows 打包、签名或安装包 E2E 已通过。`lint:i18n-agent` 仍是本地门禁（它 diff 工作区）。pre-commit hook 只跑 lint-staged；推送前仍需本地跑相关门禁 —— **没有实际运行就不得声称通过**。
