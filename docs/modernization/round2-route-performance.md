# 第二轮生产路由资源测量

2026-10-24，北京时间 15:05:19。最终生产浏览器入口通过 14 项核心检查，并在独立 context 中完成 Home、Search、Agent 画布的资源采集。三条路由均实际渲染，`pageErrors`、`failedRequests` 为空；这轮没有测量或声称速度提升、FCP、INP。

## 重放与分母

[测量脚本](../../scripts/browser/profile-route-loads.mjs) 导出 `profileRouteLoads(browser, { baseURL, output })`，由 [生产浏览器入口](../../scripts/browser/verify-ai-workspace.mjs) 调用；也可独立运行。依赖现有生产 `dist`，执行前应完成 `npm run build`，采集时保持产物不变：

```sh
npm run test:browser:production
# 只采集路由资源，自动启动本机 Vite preview
node scripts/browser/profile-route-loads.mjs
```

集成入口证据位于 `output/playwright/round2/browser/route-loads.json`，完整结果也嵌入同目录 `results.json`；独立入口默认写入 `output/playwright/round2/route-profile/`。输出目录不提交，可重放生成。`PROFILE_BASE_URL`、`PROFILE_OUTPUT`、`BROWSER_CHANNEL` 可覆盖独立入口地址、目录和浏览器。

测量使用 Apple M4 Pro、macOS 15.7.7 / arm64、Node 24.4.1、Chrome 155.0.8059.85，headless，1920×1080、deviceScaleFactor 1、en-US、减少动态效果，无 CPU/网络节流。生产 manifest SHA-256 为 `da0eb97cab6beec7126660a2b0450243d7477681eaab6577f640fed0e03dd42d`。

每条路由新建 context，先安装 [既有受控 API 夹具](../../scripts/browser/workspace-fixtures.mjs)，再加载页面。Home `/home`、Search `/search/fixture-search` 等待真实输入框；Agent `/agent/profile-agent` 必须同时有真实 React Flow `begin` 节点与 `Controlled profile agent` 标题。Agent 接口返回最小已保存 DSL，真实画布与右侧栏均完成渲染；JSON 记录 `readyEvidence.kind=persisted-agent-canvas`、`nodeIds=["begin"]` 与实际请求路径。最终同一提交还验证侧栏的 Current asset、Runtime Workbench、Delivery and debug、Recent activity 四个英文标题。未执行 Agent runtime，也未打开所有编辑对话框。

冷启动快照在初始视图可用、`document.fonts.ready`，且 JS/CSS/font 请求无在途并连续 350ms 无新增后采集。ResourceTiming buffer 提高到 10,000；本次三条冷快照的全部资源条目数分别为 103、124、183，未截断。每个增量阶段从交互前的 `performance.now()` 起筛选新请求；高亮还必须出现真实代码 token span。脚本先写原始数据，再断言路由渲染、全部适用阶段成功与无运行错误，失败不能静默当作通过。

原有 `workspace-paths` 的 Home 记录位于语言/主题切换之后，Search 与 Home 共用 context；它们继续用于功能证据，不作为本报告冷启动分母。[静态路由闭包分析](../../scripts/profile-route-bundles.mjs) 可用于定位模块归属，但与这里的实际 HTTP 资源请求量属于不同证据。

## 初次路由请求

单位为 byte；请求数包括页面实际请求的全局入口、modulepreload 与路由资源。`encodedBodySize` 是浏览器观测的编码响应体，`decodedBodySize` 是解码后体积，`transferSize` 含传输开销。没有用文件大小计算值代替网络观测。

| 路由   | 类型 | 请求数 | encodedBodySize | decodedBodySize | transferSize |
| ------ | ---- | -----: | --------------: | --------------: | -----------: |
| Home   | JS   |     94 |       1,349,618 |       4,294,130 |    1,377,818 |
| Home   | CSS  |      5 |          98,427 |         641,953 |       99,927 |
| Search | JS   |    113 |       1,791,708 |       5,826,179 |    1,825,608 |
| Search | CSS  |      6 |          99,112 |         642,638 |      100,912 |
| Agent  | JS   |    167 |       2,911,718 |       8,376,817 |    2,961,818 |
| Agent  | CSS  |      8 |         101,900 |         659,648 |      104,300 |

三条初始路径均未观测到独立 font 请求，因此其请求数、编码体积与传输量都为 0。这只描述本轮路径和字体环境，不代表其他页面、数学内容或设备无需字体。

## 首次使用增量

Home 与 Search 各自冷加载后先提交无代码、无图片的受控回答，再依次打开证据、Home 成果预览、TypeScript、Python。所有阶段 CSS/font 新增均为 0；下表只列 JS。

| 路由   | 阶段                 | 新 JS 请求 | encodedBodySize | decodedBodySize | transferSize |
| ------ | -------------------- | ---------: | --------------: | --------------: | -----------: |
| Home   | 普通回答             |          0 |               0 |               0 |            0 |
| Home   | 首次展开证据         |          0 |               0 |               0 |            0 |
| Home   | 首次 HTML 成果预览   |          1 |           2,031 |           4,607 |        2,331 |
| Home   | 首次 TypeScript 高亮 |          3 |          21,143 |         203,729 |       22,043 |
| Home   | 随后的 Python 高亮   |          1 |           9,124 |          69,945 |        9,424 |
| Search | 普通回答             |          0 |               0 |               0 |            0 |
| Search | 首次展开证据         |          0 |               0 |               0 |            0 |
| Search | 首次 TypeScript 高亮 |          3 |          21,143 |         203,729 |       22,043 |
| Search | 随后的 Python 高亮   |          1 |           9,124 |          69,945 |        9,424 |

实际新增模块是 `artifact-detail-panel-DdnAcni8.js`；TypeScript 阶段为 `github-light-EUqPIrTm.js`、`github-dark-C-LZuMrd.js`、`typescript-ITQieXu3.js`；Python 为 `python-gzcpVVnB.js`。证据新增 0 表示相关代码已在初始闭包，不表示该能力没有资源成本。Python 在 TypeScript 之后加载，已共享核心与主题，不能把 9,124 byte 当作独立冷启动 Python 高亮总成本。

Search summary 当前将成果 URL 渲染为普通链接，未接 Home 的成果卡片合同；本脚本不虚构 Search 预览阶段，只通过现有 Home 卡片测量首次成果预览。证据两处均经过真实 Sources → 引用 → 详情路径；Home 等待 MessageParts 完成标记，Search 等待本轮 `section[aria-busy=false]` 的 `Completed` 状态，未把两者 DOM 合同混用。

## 适用边界与实际验证

- `context.route` 使用受控 API 并关闭 HTTP cache；新 context 隔离模块、路由和浏览器状态，但不清空 OS、磁盘或服务端缓存。结果不模拟普通重复访问。
- SSE、应用、知识范围和 Agent DSL 都来自本地夹具，没有真实后端或模型调用。不能推导真实检索、模型首 token 或完整业务请求延迟。
- 数据来自本机 Vite preview；编码响应体明显小于解码体积，但正式服务压缩/CDN/网络协议可能不同，不把本次值写作线上 gzip/Brotli 承诺。
- 只累计已完成的 JS/CSS/font ResourceTiming 条目，不含 HTML、API、图片、iframe 文档或未来交互才触发的资源；跨源 TAO 或缓存限制也可能产生 0。离开后的内存、Web Vitals、耗时统计与慢设备均未测量。
- 各阶段只采集适用路径，无之前版本的相同环境基线，不计算节省比例或性能胜出结论。

实际运行：独立脚本 exit 0；最终 `npm run test:browser:production` exit 0，14 项核心检查和三条独立 context 资源路径全部通过。读回三条路由的完整 JSON、Agent 画布截图与 Home/Search 初始截图；Node 语法、针对脚本的 ESLint、两份文件格式与 diff 检查通过。此前两轮发现的脚本定位错误已修复，失败样本未进入上表。
