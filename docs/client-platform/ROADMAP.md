# Client Platform 执行路线图

> 本页是 Client Platform 的唯一执行账本。稳定 ID 使用 `CLP-*`；当前仅 `CLP-F0` 在本仓落文档，其他均是目标计划，不代表已实现。

## 1. 批准主线

MVP 的产品/架构顺序是：

```text
CLP-F0 文档基线
  -> CLP-P0 Web 正确性与认证
  -> CLP-RS2 云端 durable Run Service v2
  -> CLP-SC Web/Desktop Shared Client
  -> CLP-DESK Electron 薄壳
  -> CLP-REL 发布质量与灰度

MVP 完成后，才评估 CLP-BETA-HOST Rust 本地能力。
```

Electron MVP 依赖云端 durable Run，不依赖 Rust Host、PTY、Git 或本地 MCP。Web 继续独立构建和发布；所有阶段按退出门禁而非日期宣称完成。

## 2. 工程量与周期

| ID       | 工作包                                           |       基础工程量 | 状态                 |
| -------- | ------------------------------------------------ | ---------------: | -------------------- |
| CLP-F0   | 架构、目录、合同、决策、版本、测试安全和导航基线 |         4–6 人日 | 已完成（2026-08-13） |
| CLP-P0   | 当前 Web 正确性、认证、流式终态与边界收口        |       35–50 人日 | 未开始               |
| CLP-RS2  | 云端 durable Run Service v2                      |       47–70 人日 | 未开始；跨后端       |
| CLP-SC   | Web/Desktop 共用 Shared Client                   |       28–43 人日 | 未开始               |
| CLP-DESK | Electron stable 薄壳与平台能力                   |       32–48 人日 | 未开始               |
| CLP-REL  | 发布工程、质量、安全、性能与灰度                 |       42–67 人日 | 未开始               |
|          | **MVP 基础合计**                                 | **188–284 人日** |                      |
|          | **含 20–25% 风险缓冲**                           | **230–340 人日** |                      |

以 5 人稳定跨职能团队估算，MVP 为 **16–22 周**。这是工程容量基线，不包含产品/安全审批等待和团队切换成本。

`CLP-BETA-HOST` 为 MVP 后独立增量：**130–200 人日（已含 25% 风险）/ 12–18 周**。MVP + Beta 整体约 **7–10 个月**，不能把 Host 工作偷偷塞回 MVP 估算。

### 执行责任与证据账本

负责人记录角色而不是临时人名；阶段开工时必须在交付系统绑定到具体个人。证据列是最小集合，不能用口头确认替代。

| ID            | 前置依赖                                                          | 负责角色                                             | 完成证据                                                                                                   |
| ------------- | ----------------------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| CLP-F0        | 无                                                                | Client/Web owner；Backend/Runtime owner              | 九份客户端文档、五份后端文档、两仓入口与规则；相对链接、格式和 `git diff --check` 通过；两个独立纯文档提交 |
| CLP-P0        | CLP-F0；EIM 身份边界；后端 refresh/OIDC 契约                      | Web owner；Identity/API owner；QA                    | 认证/租户隔离、流终态、取消与核心链路契约测试；credential localStorage 清零；错误与日志脱敏报告            |
| CLP-RS2       | CLP-F0；Principal/authorization ports；PostgreSQL/Valkey 运维评审 | Backend/Runtime owner；DB/Platform owner             | canonical schema、migration、真实 PG/Valkey 集成、故障/并发/回放测试、v1/v2 并行灰度下的单请求单执行证据   |
| CLP-SC        | CLP-P0；RUN-F1 机器契约；可用 v2 canary                           | Web/Shared Client owner；Backend contract owner      | 生成物零漂移、golden event corpus、Web 黄金链路、四并行 Run/100 chunks/s、reload 恢复报告                  |
| CLP-DESK      | CLP-SC 合同稳定；签名/发布账号已申请                              | Desktop owner；Web owner                             | macOS/Windows packaged E2E、安全协议/IPC/fuses/ASAR 检查、固定负载性能报告                                 |
| CLP-REL       | CLP-DESK；更新源、证书、公证与观测环境                            | Release/DevOps owner；QA owner；Security reviewer    | 已签名 artifact、SBOM/checksum/manifest、更新/回滚/卸载演练、8 小时 soak 与灰度停推证据                    |
| CLP-BETA-HOST | MVP 稳定；产品需求与本地权限模型获批                              | Runtime/Rust owner；Desktop owner；Security reviewer | 协议兼容、sidecar 签名/哈希、PTY/进程树/权限/崩溃恢复与 Windows IME 报告                                   |

### 五人团队日历窗口

| 周期        | 主交付                                                        |
| ----------- | ------------------------------------------------------------- |
| 第 1 周     | F0 文档基线、证书/发布账号申请、固定性能 fixture 与参考机登记 |
| 第 2–4 周   | P0 正确性与认证、Run 协议冻结、Electron/Tauri 生产形态 PoC    |
| 第 3–9 周   | Run Service v2 与 Electron 安全壳并行开发                     |
| 第 8–14 周  | Shared Client、Web/Desktop 接入、OIDC、回放与多 Run           |
| 第 13–18 周 | 签名更新、观测、E2E、压力/soak 与内部灰度                     |
| 第 19–22 周 | 风险窗口、兼容修复、回滚演练与扩大灰度                        |

上述是依赖重叠的排程窗口，不把工程人日简单相加；证书、OIDC provider、安全评审或真实环境未就绪会消耗第 19–22 周缓冲。

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

## 4. CLP-P0：Web 正确性与认证

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

## 5. CLP-RS2：云端 durable Run Service v2

目标：Run 生命周期独立于页面、SSE/WS 连接和 Electron 进程。

范围：

- 服务端持久化 Run、单调事件 sequence/cursor、终态与 interaction wait。
- 提供 `createRun/getRun/subscribe/cancelRun/submitInteraction` 的权威 API/事件 schema。
- 支持断线补放、重复去重、gap 检测、幂等取消和 interaction 参数摘要/重授权。
- 保留 trace id 与隐私边界；客户端重载后可重建任务投影。
- 每个 Run 只能提交一个 `completed|failed|cancelled|interrupted` 终态；无安全 checkpoint 的 Runner 崩溃必须明确进入 `interrupted`，不得伪装续跑成功。
- 读取、订阅、interaction 与取消都必须以服务端加载的 tenant、Principal、membership 和 Run ownership/policy 鉴权，跨租户 ID 不得泄露存在性。
- v2/v1 并行运行，先发布兼容消费者，再生产 v2 新事件。

退出条件：

- 服务端 schema、compatibility 与 migration 文档由 MultiRAG 真相源发布。
- v1 fixture 与 v2 consumer 兼容测试通过；v1 至少保留一个完整发布周期。
- 断线、重复、gap、取消、interaction、服务重启和未知执行结果有集成测试。
- 服务端可从任意有效 cursor 回放并在 cursor 过期时提供明确 resync；Renderer 的 2 秒恢复门槛归 CLP-SC/DESK 验收。

## 6. CLP-SC：Shared Client

目标：Web 与 Desktop 共享一个 Run/auth/platform 产品合同。

范围：

- 实现固定 `RunClient` 五方法，消费 MultiRAG 远程 schema 生成物，不在本仓复制 schema 真相源。
- 实现固定 `PlatformPort`：`capabilities/auth/openExternal/downloads/notifications/updates/runs`。
- browser adapter 完整可用；desktop adapter 先提供合同和 mock，后接 Electron bridge。
- Run 投影 reducer、cursor 持久、重订阅、duplicate/gap、interaction 和取消语义。
- 本地只持久化 `run_id`、cursor、投影版本等最小恢复元数据；对话、prompt、tool payload/result 不落本地。
- 保持现有 React Query/Zustand 边界：流事件不逐 chunk 写 Query cache，终态再对账。

退出条件：Web 使用 Shared Client 跑通黄金链路；v1/v2 compatibility tests、100 chunks/s 和四并行 Run 固定负载通过；Renderer reload 恢复门槛通过。

## 7. CLP-DESK：Electron MVP 薄壳

目标：以客户端形式提供现有产品，并补齐低权限桌面体验；不加入 Rust Host。

范围：

- 独立 main/preload build、secure custom protocol、最小 staging app。
- sandbox/context isolation、最小 bridge、permission/navigation/sender policy。
- `PlatformPort` 的 auth、openExternal、downloads、notifications、updates 桌面 adapter。
- Desktop refresh token 由 main 通过 `safeStorage` 加密保存，access token 仅内存；系统浏览器 OIDC 使用一次性 PKCE/loopback callback。
- 单实例、deep link、系统主题/菜单和受控下载；云 Run 仍由 Shared Client 直连。
- packaged artifact 验证所有 lazy chunk、Monaco、文档预览、千节点画布和深链 reload。

退出条件：

- Web 全部门禁不退化；macOS/Windows packaged 黄金链路通过。
- Renderer 无 Node/Electron import，正式包 fuses/ASAR allowlist 通过。
- 冷/热启动、流输入/显示与 60Hz 帧耗时达到批准门槛。
- 关闭/重载窗口不取消云 Run，2 秒内恢复投影。

## 8. CLP-REL：发布、质量与灰度

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

## 9. CLP-BETA-HOST：MVP 后本地能力

进入条件：MVP 已完成；产品数据证明用户确需 workspace/PTY/Git/本地进程/本地 MCP；团队已有 Rust 与跨平台发布 owner。

范围：Cargo workspace、Host RPC、sidecar 签名/更新、PTY/Git/fs/process、可选 SQLite journal 与本地 MCP。先做一个端到端垂直切片，不同时铺开所有能力。

退出条件包括：Host 崩溃时 UI 不退出，2 秒内重启并恢复可恢复状态；无孤儿进程；高频事件有背压；sidecar hash/签名/架构一致；未知副作用结果不自动重放。

该阶段不改变 Run Service 仍为云端 Run 权威；本地 operation 与云 Run 通过显式 contract 关联。

## 10. 关键依赖与并行策略

- CLP-P0 可与 CLP-RS2 的后端 schema 设计部分重叠，但 Shared Client 不在远程 schema 冻结前猜实现。
- CLP-SC 的 browser adapter 先行，desktop adapter 与 CLP-DESK 后半可并行。
- 签名、更新和性能采样在 CLP-DESK 就试跑，CLP-REL 负责产品化，不能拖到功能完成后首次接触。
- CLP-BETA-HOST 绝不作为 CLP-DESK/CLP-REL 的隐藏前置条件。

## 11. 状态更新规则

- 只在对应退出条件有实跑证据时把 CLP 状态改为完成。
- 每次更新写日期、commit/artifact、验证命令、设备/服务版本和未验证边界。
- 版本漂移只更新 [VERSION_BASELINE.md](./VERSION_BASELINE.md)。
- 若计划范围或估算变化，必须同时更新合计、缓冲、周期和 [DECISIONS.md](./DECISIONS.md)。
