# E2：当前流式 Markdown 与 Streamdown 2.7.1

2026-10-24（Asia/Shanghai）。裁决：**本轮保留 XMarkdown，退出 Streamdown 生产迁移**。候选改善了一份中文标点粗体语料，但未覆盖当前支持的括号数学语法；三轮隔离测量也没有显示跨语料一致的性能优势。实验没有修改生产 renderer 或根依赖。

## 可重放边界

入口为 [实验说明](../../experiments/markdown-renderer/README.md)、[语料](../../experiments/markdown-renderer/corpus.mjs)、[浏览器执行脚本](../../experiments/markdown-renderer/run.mjs) 与 [48 条精简证据](../../experiments/markdown-renderer/evidence-summary.jsonl)。原始 JSON、最终 DOM 和截图在本机 `output/playwright/round2/renderer/`，重放可重新生成。

实际 npm registry 验证版本：`streamdown@2.7.1`（2026-10-19 发布）、`@streamdown/code@2.0.0`、`@streamdown/math@1.0.3`、`@streamdown/mermaid@1.0.3`、`@streamdown/cjk@1.0.4`。独立 lock 固定 272 条 package 记录，包含完整性散列；安装禁用脚本。候选采用官方要求的独立插件；单美元公式显式开启。[官方用法](https://streamdown.ai/docs/usage)、[数学插件](https://streamdown.ai/docs/plugins/math)

当前输入直接复用生产 `StreamingXMarkdown`、`markdownConfig`、`useMarkdownComponents`，包含现有 Shiki code、SafeMermaid、成果链接/图片和真实引用按钮。候选复用同一引用组件并适配其 React children，复用成果链接/图片并去掉 AST `node` 属性；没有用默认 XMarkdown 替代现有链路。

输入为相同累计字符串、相同 16ms 节奏；当前保留自身 RAF，候选使用相同 RAF 合并策略。页面加载完成后才开始测量。Chrome 155.0.8059.85、Node 24.4.1、1365×900，三轮交换运行顺序，共 48 样本；测量结束于北京时间 14:26:49。当前源码复制到忽略目录后关闭 HMR，避免共享 checkout 修改导致样本混合。

关键源码 SHA-256：

| 文件                     | 测量快照                                                           |
| ------------------------ | ------------------------------------------------------------------ |
| streaming-x-markdown.tsx | `e44e6ecae8c42ce00ce5c8123a0b66f1f8c9a8c81f657d7b00794c6f235d178a` |
| MarkdownCodeBlock.tsx    | `ba5bd6e7fdfca9e2519f8d918e601f4b991c64a4b38ba2c6a6cf7efc1e84bfed` |
| CodeBlock.tsx            | `0350e897905b7c7b44a2c88c5d9b6362c10f03ba6ef192b10ebcb79a4eedeb66` |
| ReferenceMarker.tsx      | `25e179271b3a494dbcc1db2b9df2f693fd7aa6d123e063902153c73e5f85cde2` |
| MarkdownArtifact.tsx     | `2e691528cccd66af1d15616908951f20b8a79b188aefcd0c1a3ac069082344b3` |

测量时根目录的五份关键文件前后散列相同。这个快照仍使用 `react-shiki` 入口；主 agent 随后为生产 bundle 预算调整高亮 registry，不把这里的数据当作最终高亮实现或最终生产构建的性能证明。

## 功能与安全

| 同语料                          | 当前链路（每项 3 次）                                         | Streamdown（每项 3 次）                                     |
| ------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- |
| 中文/English 混排               | 正文保留；`这是**重点结论。**AI` 的粗体定界符未解析，预期 0/3 | 正文与粗体呈现，3/3；粗体为 `data-streamdown="strong"` span |
| 未闭合 TypeScript fence         | 正文及代码存在，3/3                                           | 正文及代码存在，3/3                                         |
| 两个引用标记                    | 两个真实按钮和片段弹层，3/3                                   | 同一引用按钮/片段弹层，3/3；需要 children 适配              |
| 180 行长表格                    | 181 个 tr，末尾正文存在，3/3                                  | 同样 181 个 tr，3/3                                         |
| `$...$`、`\\(...\\)`、`$$...$$` | 3 个 KaTeX 节点，3/3                                          | 2 个 KaTeX 节点，0/3；括号公式未解析                        |
| Mermaid 分帧                    | 最终 SVG 存在，3/3；部分帧出现 Invalid syntax 控制台告警      | 最终 SVG 存在，3/3                                          |
| script/img onerror/iframe       | 危险 DOM 属性和元素为零，探针未执行，3/3                      | 同样通过，3/3                                               |
| javascript/data 链接            | 危险 href 为零，3/3                                           | 同样通过，3/3                                               |

候选保留 sanitizer，显式 URL 过滤仅接受 http(s)/mailto，Mermaid 用 strict；允许 sup 仅为现有引用。官方说明自定义 rehype 数组会替换默认数组，迁移时不能遗漏 sanitizer。[安全配置](https://streamdown.ai/docs/security)、[组件适配](https://streamdown.ai/docs/components)

当前中文粗体的缺口作为已观测问题保留，不能写成“所有中文格式均通过”；可另行评估局部 parser 改进。此实验不自动修复生产代码。安全样本是有限 fixture，不是对任一库的完整安全审计。

## 浏览器测量

下表为三次的中位数，单位 ms。首次内容是**页面已加载后的首个 DOM 内容**，交互是流中真实 Playwright click 到可见计数更新，含协议/locator 开销，不是 FCP 或 INP。

| 语料        | 当前首次内容 | 候选首次内容 | 当前交互 | 候选交互 |
| ----------- | -----------: | -----------: | -------: | -------: |
| 中文混排    |         15.1 |         22.3 |     39.3 |     37.2 |
| 未闭合代码  |         21.6 |         19.8 |    103.1 |     39.8 |
| 引用        |         18.2 |         20.5 |     37.8 |     41.7 |
| 长表格      |         18.5 |         20.2 |     89.1 |     88.6 |
| 数学        |         18.3 |         20.2 |     39.8 |     50.9 |
| Mermaid     |         21.6 |         36.5 |     55.7 |     56.0 |
| 不可信 HTML |         21.8 |         21.4 |     40.5 |     56.0 |
| 不可信链接  |         15.3 |         25.8 |     40.4 |     52.7 |

代码样本的 long task：当前三次各 1 个、均 64ms；候选分别 1/2/1 个，时长为 266ms、260+50ms、263ms。其他语料在被测输入区间未捕获 ≥50ms long task。代码交互延迟与 long task 数值方向不完全一致，不能把某一列外推为整体性能收益。

48 样本均无 pageerror；离开时 renderer DOM 清空，晚到输入不再接纳，两 RAF 后待处理 RAF 为零。该检查不覆盖堆快照、全局 Shiki/Mermaid 缓存或 worker 生命周期，不能宣称不存在内存泄漏。复制到剪贴板、受保护成果下载、移动端和辅助技术也未在本实验中验证。

未测量：生产 gzip/Brotli、首次路由网络闭包、最终减重后的 CodeBlock、CPU throttle、真实后端 token 节奏、端到端 SSE 延迟或统计显著性。两库在实验页共同加载，**不据此计算生产首屏体积或节省百分比**。同机另有构建/浏览器任务，结果只用于阻止未经证明的替换。

## 裁决与验证

Streamdown 的 CJK plugin 有可见收益，但完整替换还需括号 LaTeX、引用 children、成果组件 props、安全 URL、主题/locale 与字体接线；现有功能不能退化，且没有重复测得的整体收益或生产 bundle 收益证据。本轮保留现有 XMarkdown，候选及其依赖只存在隔离实验目录与忽略的 scratch，不进入生产导入图。

实际运行：registry 精确版本核对及独立锁重放安装 exit 0；最终浏览器测量 exit 0，48 样本完成（其中当前 CJK 与候选数学各三次预期未满足，按表保留）；四份 mjs 的 Node 语法检查、五个本地文档链接、格式和 diff 检查通过，并实际读回数学对照截图。首次探测采用未对齐的外层 RAF，另一轮受 HMR 中断，二者均未进入本表。
