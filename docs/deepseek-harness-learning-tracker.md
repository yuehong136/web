# DeepSeek Harness 工程实践学习跟踪

本文记录 `D:\project\deepseek-harness` 中值得 `D:\project\web` 学习的 Agent/AI 工程实践、采用判断、落地方案和后续复查方法。它是一个持续更新的跟踪台账，不代表参考项目的全部做法都适合本项目。

## 1. 探查基线

| 项目           | 值                                                                                   |
| -------------- | ------------------------------------------------------------------------------------ |
| 探查日期       | 2026-08-14（Asia/Shanghai）                                                          |
| 参考仓库       | `D:\project\deepseek-harness`                                                        |
| 参考上游       | `git@github.com:deepseek-ai/deepseek-harness.git`                                    |
| 参考分支       | `master`                                                                             |
| 参考提交       | `47f943859bef60e4160492346772ded9b24f765a`                                           |
| 参考提交时间   | 2026-08-13 19:38:46 +08:00                                                           |
| 参考提交说明   | `Merge pull request #2519 from deepseek-harness/feat/npm-public`                     |
| 参考根包版本   | `0.1.0-rc.5`                                                                         |
| 本项目仓库     | `D:\project\web`                                                                     |
| 本项目基线提交 | `f3e263295b52b0ce68d3168d633f65906f73529d`                                           |
| 本项目版本     | `0.9.8`                                                                              |
| 探查方式       | 静态源码、配置、测试资产与 CI 对照；未执行参考项目完整测试，不据此声称其 CI 当前通过 |

固定版本的上游入口：

- [参考项目 AGENTS.md](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/AGENTS.md)
- [参考项目测试策略](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/testing.md)
- [参考项目架构](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/architecture.md)
- [参考项目统一门禁调度器](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/scripts/run-gates.ts)
- [参考项目 CI](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/.github/workflows/ci.yml)

本地参考源码位于 `D:\project\deepseek-harness`。后续分析应同时记录新的提交 ID，不能只写“参考最新 master”。

## 2. 本项目当前基础

本项目已经具备以下较强基础，应在其上增量建设，不需要推倒重来：

- 自定义 ESLint 已约束 Renderer/PlatformPort/Electron main/preload 依赖方向。
- 模型输出按不可信输入处理，已有 iframe、外链、HTML sink、敏感日志、`eval` 等 error 级规则。
- 文件行数和 Bundle 体积已经使用只收紧不放宽的 ratchet。
- API、Streaming、Agent serializer、产品合同、安全、Client Platform 和 Desktop 已有专项测试入口。
- Electron build、staging allowlist 和 stage verifier 已进入 CI。
- `docs/engineering-modernization-roadmap.md` 的 ENG-2 已识别统一测试入口、覆盖率基线和真实 E2E 缺口。

2026-08-14 第一阶段实施后测试清单：

- 自动发现 104 个 `test/spec` 文件：`source-node` 65 个、`source-vitest` 21 个、`desktop-node` 16 个、`tooling-node` 2 个。
- 104 个文件全部归入唯一正式 lane，未归类文件为 0；此前约 43 个未收口文件已全部进入正式入口。
- `test:ci` 实际完成全量执行：Node 466、Vitest 77、Desktop 78、tooling 7 个断言通过；Windows 当前无 symlink 权限的 3 个 Desktop 用例明确跳过。
- 该统计只说明测试入口和本轮执行结果，不等同于语句或分支覆盖率。

高风险未收口示例包括 `src/components/ui/__tests__/select.test.tsx`、`src/pages/agent/features/form-sheet/__tests__/form-renderer.test.ts`、Agent store、embed protocol、form-sheet 和 runtime UI 测试。

## 3. 学习条目台账

状态取值：`候选`、`已规划`、`实施中`、`已采用`、`不采用`。任何状态变化都要补日期、提交和验证证据。

| ID          | 优先级 | 实践                                        | 当前状态 | 本项目判断                                                                           | 主要参考来源                                       |
| ----------- | ------ | ------------------------------------------- | -------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| DSH-LRN-001 | P0     | 统一测试发现与正式入口                      | 已采用   | 已落地，新增测试不再依赖手工维护正式脚本路径                                         | `docs/testing.md`、根 `package.json`；本项目 ENG-2 |
| DSH-LRN-002 | P0     | 无密钥 Agent 事件回放与语义快照             | 候选     | 适合流式、tool-call、approval、timeline，作为必过门禁                                | `docs/testing.md`、`vitest.snapshot.config.ts`     |
| DSH-LRN-003 | P0     | 真实 Chromium + 完整应用入口验收            | 已规划   | 引入 Playwright，优先覆盖 Agent/MCP、流式恢复、Studio                                | `apps/web/tests/README.md`、`vitest.web.config.ts` |
| DSH-LRN-004 | P0     | 验证外部世界，不相信 UI/Agent 自报成功      | 候选     | E2E 同时断言网络、副作用、刷新后状态和取消结果                                       | `docs/testing.md`、postmortem 0003                 |
| DSH-LRN-005 | P1     | 统一 gate graph 编排门禁依赖和并发          | 候选     | 做轻量版，不复制参考项目全部 CI 复杂度                                               | `scripts/run-gates.ts`                             |
| DSH-LRN-006 | P1     | Model-visible / UI-visible 状态可由事件重建 | 候选     | 与 Shared Streaming Runtime、未来 Durable Run 对齐                                   | `docs/architecture.md`                             |
| DSH-LRN-007 | P1     | 测试真实入口和构建产物                      | 部分具备 | Web 补 build 后浏览器测试；Desktop 继续补 packaged smoke                             | `docs/testing.md`、postmortem 0001                 |
| DSH-LRN-008 | P1     | 注册表、目录与生成物一致性门禁              | 候选     | 先覆盖 operator/tool renderer、route、locale、query key                              | `scripts/run-gates.ts` 中 catalog/doc gates        |
| DSH-LRN-009 | P1     | Agent Note / ADR 与事故复盘转永久门禁       | 部分具备 | 复用现有 Decisions，减少超大路线图中的决策堆积                                       | `.agents/notes/README.md`、`docs/postmortem/`      |
| DSH-LRN-010 | P2     | 覆盖率 ratchet                              | 已规划   | 从新增和关键目录开始，不直接照搬全仓单文件 100%                                      | `vitest.config.ts`、`docs/testing.md`              |
| DSH-LRN-011 | P2     | 变更范围驱动的最小可信校验                  | 候选     | 建项目级 change-scope/pre-push 工作流                                                | `.agents/skills/dsh-pre-push-checks/SKILL.md`      |
| DSH-LRN-012 | P2     | Node/Windows/构建产物兼容矩阵               | 部分具备 | 正式桌面交付前增加 Windows 原生 runner；`lint:typed` 的 POSIX 环境变量写法待跨平台化 | `.github/workflows/ci.yml`                         |

## 4. 具体实践与落地方案

### DSH-LRN-001：统一测试发现

目标：所有符合约定的测试文件必须进入至少一个正式测试 lane，新增测试不能因为忘记修改 `package.json` 而静默漏跑。

建议实践：

1. 建立 `test:unit` 或 `test:ci` 统一入口。
2. 保留 `test:api`、`test:streaming` 等专项入口，供本地快速反馈。
3. 增加 `verify:test-inventory`，扫描测试文件并验证其归属。
4. 明确 Node `node:test`、Vitest Node、Vitest jsdom 三类 runner，避免同一文件只能偶然被某个脚本执行。
5. CI 调用统一入口；专项入口不再是唯一覆盖清单。

实施结果（2026-08-14）：

- `scripts/test-inventory.mjs` 从 Git 可见文件自动发现测试，并强制每个文件唯一归入 `source-node`、`source-vitest`、`desktop-node` 或 `tooling-node`。
- `scripts/run-test-suite.mjs` 直接消费同一份 inventory，按 lane 选择 Node/tsx、Vitest/jsdom 与 Desktop 运行参数；Vitest 固定最多 4 个 worker，Desktop 慢扫描使用 180 秒单测上限。
- `package.json` 提供 `verify:test-inventory`、`test:unit`、`test:ci`；原专项脚本保留作局部快速反馈。
- `.github/workflows/ci.yml` 只调用 `test:ci` 作为正式测试入口，避免 CI 与本地维护两份文件清单。
- 完整执行首次暴露并修正：A2UI 旧注册表路径、会加载整套 UI 的表单注册表测试、Windows ASAR 路径分隔符、无 symlink 权限的环境性用例和 Desktop 扫描超时。

验收证据：

- 临时加入 `experiments/inventory-negative.test.ts` 后，`verify:test-inventory` 以退出码 1 拒绝该文件；删除后恢复 104 个文件、0 个未归类。
- `npm run test:ci` 实际通过并明确打印四个 lane 的文件数和测试数。
- Windows 无法创建 symlink 时仅跳过依赖该权限的用例，其余 Desktop 安全合同仍运行；不得把环境性跳过写成已通过。

### DSH-LRN-002/003：无密钥回放与真实浏览器

目标：不依赖真实模型密钥，也能验证完整 Agent UI 生命周期；少量真实模型 smoke 只作为补充。

第一批场景：

1. 打开 Agent 编辑器，选择 MCP server/tool，保存并刷新后仍保持选择。
2. 发起流式响应，停止后真实请求被 abort，重试不产生重复消息。
3. tool-call 等待确认；拒绝无副作用，批准只执行一次。
4. partial/malformed tool result 显示骨架或明确错误，不白屏。
5. Sheet/Dialog/Select 重复开关，无焦点循环和 maximum update depth。
6. Studio 保存、预览和发布使用同一真实数据闭环。

Fixture 建议：

- 使用版本化 JSONL 或等价事件格式记录输入事件、`seq/event_id`、chunk、tool-call 和终态。
- CI 只读回放，禁止自动重写 expected 文件。
- 录制或刷新快照必须是显式本地命令，所有 expected diff 作为行为变更评审。
- 语义快照优先于整页像素截图；截图、trace、网络日志用于失败诊断。

参考实现：

- [Web browser snapshot 测试配置](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/vitest.web.config.ts)
- [Web E2E 说明](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/apps/web/tests/README.md)
- [测试分层与 keyless snapshot](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/testing.md)

### DSH-LRN-004/007：验证真实入口和外部状态

测试不能只断言 toast、HTTP 200、DOM ready 或 Agent 文本中出现“成功”。应检查请求和世界状态：

- stop 后对应 AbortSignal 已触发，上游不再产生业务事件。
- 保存/发布后重新读取服务端数据，而不是只检查乐观 UI。
- 上传后刷新或新会话仍能检索到目标资料。
- 副作用工具拒绝时无调用，批准时只有一次调用。
- build 后启动真实 preview/assembled app，确认测试的 URL、进程和产物就是用户使用的目标。
- Desktop smoke 必须检查 composition marker/关键功能，不把窗口创建或 DOM ready 当成产品通过。

事故来源：

- [Web agent 验证了替代服务而非当前 GUI](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/postmortem/0003-web-agent-gui-feedback-loop.md)
- [单测与 100% 行覆盖仍漏掉真实 Loader 入口故障](https://github.com/deepseek-ai/deepseek-harness/blob/47f943859bef60e4160492346772ded9b24f765a/docs/postmortem/0001-acp-default-export-drops-inject.md)

### DSH-LRN-005：轻量 gate graph

建议定义以下聚合模式：

| 模式       | 内容                                                     |
| ---------- | -------------------------------------------------------- |
| `static`   | lint、typed lint、架构边界、安全规则、文件棘轮、测试清单 |
| `unit`     | 全部 Node/Vitest 单元、组件与 API 合同测试               |
| `artifact` | build、bundle budget、Electron build/stage/verify        |
| `browser`  | Playwright keyless golden paths                          |
| `platform` | Windows/macOS packaged smoke                             |
| `all`      | 完整门禁图                                               |

调度器应验证：门禁 ID 唯一、依赖存在、无循环、依赖失败后下游不能伪装成功，并输出命令、耗时、退出码和汇总。AGENTS.md、本地开发和 CI 应引用同一份门禁定义。

### DSH-LRN-006/008：可重建事件与注册表一致性

建议把以下关系变成可执行校验：

- 每个 Agent operator 必须有 serializer、form renderer、runtime renderer 或明确的 unsupported 声明。
- 每个 tool-call renderer 必须声明 generic/terminal/diff 等展示意图和副作用确认策略。
- 路由、locale namespace、query key factory 和 capability registry 不允许孤儿条目。
- UI 终态应能由规范化 timeline 事件重放；chunk 不进入 Query cache，完成后再落最终状态。
- 影响模型或 Agent 决策的客户端输入需要可审计来源，不能只存在于临时组件 state。

这里借鉴的是“生成目录 + freshness gate”和“model-visible means logged”，不是照搬其 Cordis 插件架构。

### DSH-LRN-009/011：Agent 时代的仓库工作流

建议新增少量项目级工作流文档或 skill：

- `web-pre-push-checks`：根据 diff 选择最小可信门禁并记录实际命令。
- `web-ui-acceptance`：确认真实 URL、进程、运行模式、认证边界和点击路径，保留截图/trace。
- `web-code-review`：检查流式取消、资源释放、tool 副作用确认、模型输出安全和真实入口测试。

非平凡决策使用小型 ADR/Decision Note，至少包含问题、决定、备选方案、代价和验证。事故复盘必须落成测试、lint 或运行时 invariant，不能只留下经验描述。

## 5. 分阶段跟进

### 第一阶段：测试入口收口

- DSH-LRN-001 已于 2026-08-14 实施并验收。
- 已产出 `test:unit/test:ci` 与测试 inventory gate；当前没有静态例外清单，环境性 symlink 跳过由测试输出显式记录。
- 不在这一阶段追求高覆盖率数字。

### 第二阶段：Agent 证据闭环

- 实施 DSH-LRN-002、003、004、007。
- 建 keyless event fixture、Playwright harness 和首批黄金链路。
- 优先覆盖 MCP 选择、流式停止/重试、tool approval。

### 第三阶段：门禁与架构一致性

- 实施 DSH-LRN-005、006、008、010、011。
- 引入轻量 gate graph、注册表 freshness、关键目录 coverage ratchet 和变更范围驱动校验。

### 第四阶段：正式桌面交付

- 实施 DSH-LRN-012。
- 增加 Windows 原生构建、启动、package verifier 和关键 packaged E2E。
- 未执行的平台继续明确标记为未验证。

## 6. 明确不照搬

- 不把当前前端整体改造成“everything is plugin”。优先延续现有 registry、adapter 和 PlatformPort。
- 不立即要求全仓单文件 100% coverage；使用关键目录基线和只收紧 ratchet。
- 不复制参考项目大规模 Agent Notes、双语门禁、自托管 runner 和故障切换体系。
- 不采用“真实模型调用不计成本”的策略；必过 CI 以 keyless replay 为主，真实模型 smoke 按成本、隐私和稳定性单独运行。
- 不为模仿 monorepo 而拆包；出现两个真实生产消费者并有可测维护收益后再评估。

## 7. 参考项目升级后的复查流程

当前参考基线：

```text
47f943859bef60e4160492346772ded9b24f765a
```

下次更新时：

1. 记录新的 `HEAD`、提交时间、根包版本和 tag；保留本节旧基线，不覆盖历史。
2. 先比较下列高价值路径，再决定是否扩大范围：
   - `AGENTS.md`
   - `package.json`
   - `docs/testing.md`
   - `docs/architecture.md`
   - `docs/defensive-patterns.md`
   - `docs/postmortem/`
   - `scripts/run-gates.ts`
   - `vitest*.config.ts`
   - `apps/web/tests/`
   - `.agents/skills/dsh-pre-push-checks/`
   - `.github/workflows/ci.yml`
3. 使用旧提交到新提交的 diff，区分新增机制、机制修订、被撤销实践和单纯规模增长。
4. 逐项更新 DSH-LRN 状态、采用判断和来源；不要因为参考项目新增机制就自动加入本项目计划。
5. 重新扫描本项目测试 inventory、CI、E2E、coverage 和 artifact smoke，记录差距是否已经关闭。
6. 在下方追加复查记录，并为任何实现填写本项目提交和实际验证命令。

建议命令：

```powershell
git -C D:\project\deepseek-harness fetch origin
git -C D:\project\deepseek-harness log --oneline 47f943859bef60e4160492346772ded9b24f765a..origin/master -- AGENTS.md package.json docs scripts apps/web/tests .agents/skills .github/workflows
git -C D:\project\deepseek-harness diff --stat 47f943859bef60e4160492346772ded9b24f765a..origin/master -- AGENTS.md package.json docs scripts apps/web/tests .agents/skills .github/workflows
```

`fetch` 只更新远端引用。是否把本地参考工作树更新到 `origin/master` 应单独确认，避免覆盖参考仓库中的本地工作。

## 8. 复查与实施记录

| 日期       | 参考提交/版本               | 本项目提交/版本        | 变化                                                                            | 采用状态变化                 | 验证证据                                                                                                      |
| ---------- | --------------------------- | ---------------------- | ------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 2026-08-14 | `47f943859b` / `0.1.0-rc.5` | `f3e263295b` / `0.9.8` | 首次建立工程实践对照与跟踪台账                                                  | 建立 DSH-LRN-001～012        | 静态源码、配置、测试资产和 CI 对照；未运行参考项目完整测试                                                    |
| 2026-08-14 | `47f943859b` / `0.1.0-rc.5` | 未提交工作区 / `0.9.8` | 落地统一测试 inventory、runner 与 CI 正式入口，并修复全量执行暴露的历史合同漂移 | DSH-LRN-001：已规划 → 已采用 | `verify:test-inventory` 反向校验按预期退出 1；`test:ci` 覆盖 104 文件并通过，Desktop 有 3 个 symlink 权限跳过 |

每次更新本表时，应同时更新第 1 节当前基线和受影响的学习条目；历史行只追加，不删除。
