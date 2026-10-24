# 第二轮隔离实验

本页记录 2026-10-24 的实际执行结果。实验源码不进入 `src/`，候选依赖只安装到 ignored scratch；正式产品能力与依赖没有因此启用。

## E1 受控工具界面：保留实验，退出生产接入

自有 catalog、json-render、A2UI 都完成了同一个合成来源任务：显示来源、增量加入一个来源、筛选制度类资料、点击采用来源。三路最终脚本均 exit 0，接收器各收到且只收到 `filterSources`、`adoptSource` 两个预期回执。

**本轮决定：不把任一候选接入生产。** 当前 Search 的来源筛选是 UI 过滤；本实验没有真实的生成式工具 action/授权接收合同。`knowledgeAPI.retrievalTest.test({ doc_ids })` 的存在不能证明“采用来源”可以写回 Agent。按报告 E1 的退出条件，保留可重复样本与比较结果，继续使用现有 React 展示路径。没有新增远程 action、Agent loop、持久化或模型调用。

### 版本、依赖与证据

版本以 npm registry 实查和本次 `npm ci` 安装内容为准；实验目录中的两份 lock 固定传递依赖，不修改根 `package-lock.json`。

| 路径         | 实测版本和 React 兼容性                                                 | 实测依赖代价                                                                                                       |
| ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 自有 catalog | React/React DOM 19.3.0，Zod 4.0.5                                       | 仅使用仓库已有的基础库；在 json-render scratch 复用同一 React/Zod 环境，适配器不导入 json-render                   |
| json-render  | `@json-render/react` / `core` 0.21.3；React peer `^19.2.3`，19.3.0 满足 | 根样本保留 Zod 4.0.5，core 的 `^4.3.6` 解析为嵌套 4.6.7，实际存在两个 Zod 版本                                     |
| A2UI         | `@a2ui/react` / `web_core` 0.14.0；支持 React 18 或 19，19.3.0 满足     | renderer peer 要求 Zod `^3.25.76`，独立样本使用 3.25.76；与产品的 Zod 4 主线存在额外接入成本，未改产品依赖验证共存 |

A2UI 的 npm 包版本与协议版本分开记录：本次使用 `@a2ui/react/v0_9`、`@a2ui/web_core/v0_9` 的实际导出，消息及 catalog 标记为 `v0.9.1`。实际 API 是 `A2uiSurface`、`createComponentImplementation`、`Catalog`、`MessageProcessor`；官网部分入门页仍写旧名称，不据此套用旧代码。[官方 renderer 状态](https://a2ui.org/reference/renderers/)、[React 包源入口](https://github.com/a2ui-project/a2ui/tree/main/typescript/renderers/react)、[registry 元数据](https://registry.npmjs.org/@a2ui/react/0.14.0)。

json-render 使用实际导出的 `defineCatalog`、`defineRegistry`、`JSONUIProvider`、`Renderer`、`applySpecPatch`。它允许传入自有组件和 action handlers，不需要在该样本里启用会话 runtime。[官方 React API](https://json-render.dev/docs/api/react)、[registry 元数据](https://registry.npmjs.org/@json-render/react/0.21.3)。

### 同题验证与差异

只实现 `Column`、`Text`、`Button` 三种实际参与任务的组件，不通过空组件凑数量。三路共用 `fixture.mjs` 的合成数据与宿主接收器；候选负责自身的 schema/renderer/action 出口，宿主负责资源范围与生命周期。

| 验证                                          | 自有 catalog                 | json-render 0.21.3                                                  | A2UI 0.14.0                                                   |
| --------------------------------------------- | ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| 渲染与点击 → fixture 回执                     | 通过                         | 通过，经过 `emit('press')` 和 provider handler                      | 通过，经过绑定 action 与 processor listener                   |
| 把 `Text.text` 换成 `{ script: 'bad' }`       | Zod schema 拒绝              | **`catalog.validate` 接受**；增加逐组件 props schema 校验后宿主拒绝 | processor 的 strict 校验拒绝                                  |
| 未注册组件回退                                | 本地 registry 回退           | `Renderer.fallback`                                                 | strict processor 拒绝后由宿主输出回退；不声称库内置该产品回退 |
| action 白名单与外部 source/scope              | 宿主拒绝，零回执             | 逐 action schema + 宿主范围校验；零回执                             | 宿主范围/白名单校验；零回执                                   |
| 增量来源 patch                                | 宿主 revision 更新           | 实际 `applySpecPatch` 产物进入 renderer                             | 实际 `updateComponents` 进入已有 surface                      |
| 过期 revision、外部 scope patch               | 拒绝、状态不变               | 拒绝、状态不变                                                      | 拒绝、状态不变                                                |
| 中英与 Studio/light → Paper/dark 展示参数切换 | 文案更新，action 数仍为 2    | 同左                                                                | 同左，保留同一 processor                                      |
| dispose 后释放已排队的 Promise patch/action   | 拒绝，状态不变，React 根卸载 | 同左                                                                | 同左，并发送 `deleteSurface`、调用 processor `dispose`        |

json-render 的多组件 catalog 检查不能在这个版本中替代逐组件 props 校验。本例保留 `schemaRejection: { native: false, host: true }`，没有修改预期掩盖差异；宿主适配器还显式扫描 action 名称与参数。该结果只针对固定版本和样本，不推断所有 schema 模式都缺乏验证。

A2UI 的 strict 拓扑检查不接受保留模型节点却从 root 断开引用。本例筛选使用稳定节点加 `hidden` 展示属性，避免伪装成组件删除或重建 surface。`deleteSurface` 仅在销毁时使用。协议定义了独立 surface、增量组件/数据更新和显式销毁；服务端 action 的授权仍由应用决定。[A2UI v0.9.1 协议](https://a2ui.org/specification/v0.9.1-a2ui/)。

### 重放

从仓库根目录运行：

```bash
node experiments/ai-surfaces/run-comparison.mjs
# 或使用另一独立目录：
node experiments/ai-surfaces/run-comparison.mjs --scratch /tmp/web-e1-comparison
```

入口复制样本与已提交的实验 lock，在 scratch 分别执行 `npm ci --ignore-scripts --no-audit --no-fund`、`npm ls react react-dom zod --all --json`，再执行三路 DOM 验证。所有实际命令退出状态记录到 `output/playwright/round2/experiments/e1/comparison.json`；候选目录保留 `install.log`、`dependency-tree.json`、各路 `.log` 与 `*-result.json`。任一路失败会令总入口 exit 1。入口拒绝把仓库源码目录当 scratch。

本次最终运行：两个 `npm ci` exit 0、两个 `npm ls` exit 0、三路验证各 exit 0。根 lock 前后 SHA-256 均为 `932e45e8746b04fca6c973e6cfd21fedb2aef71b8146000b1030fa4951ea17a5`。候选直接依赖及完整锁位于 `experiments/ai-surfaces/manifests/`，无候选包进入根依赖或生产导入图。

### 采用门槛与未验证项

当前小任务下，自有 catalog 的适配层最少；json-render 展示了组合/patch/API 的可用性，但须保留额外宿主校验并解决 Zod 重复；A2UI 提供明确 surface 协议，但带来独立 processor、版本适配、Zod 3 和拓扑语义成本。只有业务出现真实 action 接收、授权、失败恢复及后端回执合同后，才有依据重开接入决策；本次不选双栈。

这是 Node + JSDOM 的控制流与 DOM 证据：没有调用真实 provider、没有验证生产 action、没有测性能或包体积，也没有声称四预设的真实像素/焦点行为通过。展示参数切换证明固定 UI 文案更新且没有重放 action，不证明 A2UI 默认样式已经映射产品 tokens。完整生产安全审计、生成内容质量、真实浏览器与远程异步副作用验收仍未进行。
