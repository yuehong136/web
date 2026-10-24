# Markdown renderer 对照（E2）

这是独立的手动实验，生产路由、生产导入图和根依赖不引用该目录。

```bash
node experiments/markdown-renderer/prepare.mjs
node experiments/markdown-renderer/run.mjs
```

需要根项目已有依赖、Chrome 和网络连接。`prepare` 只在被 Git 忽略的 `output/playwright/round2/renderer-scratch/` 安装候选；从 npm registry 验证指定版本，用 `candidate-lock.jsonl` 还原独立锁文件并执行 `--ignore-scripts --legacy-peer-deps`。根 `package.json` / lock 不变。

`run` 冻结当前 `src` 到 scratch，核对关键源码散列，用隔离 Vite 5194 端口关闭 HMR。当前源码的直接依赖保持根项目解析路径，候选用 scratch 依赖，避免强制统一 nested 版本。当前端直接使用 `StreamingXMarkdown + markdownConfig + useMarkdownComponents`，包括现有 code、Mermaid、artifact link/image 和引用组件；不是默认 XMarkdown。

两端同样按累计输入每 16ms 推进，当前组件保留原本 RAF 合并；Streamdown 使用 `frame-policy.ts` 的相同合并策略。候选启用 code/math/mermaid/cjk、单美元公式、严格 Mermaid 安全配置、URL 过滤，以及真实引用/成果组件的属性适配。

默认八份语料各运行三轮，共 48 样本。第二轮交换 renderer 顺序。`RENDERER_ROUNDS=1` 可用于探测；正式报告需要三轮。输出包括 `results.json`、最终 DOM、首轮截图及受版本控制的精简 `evidence-summary.jsonl`。结构性预期未满足会记录 `passed:false`，实验退出 0 表示测量流程完成，不等于两端所有预期均通过。

指标范围：首次内容是已加载页面内首个可观察 DOM 内容；long task 是流输入阶段 `PerformanceObserver` 记录；交互延迟包含 Playwright 协议与 locator 开销，不是生产 INP。卸载仅核对 DOM、待处理 RAF 和晚到输入归属，不声称完成 heap/worker/全局缓存泄漏审计。浏览器在同一机器与其他任务并行运行，数据不用于统计显著性或生产性能承诺。

裁决与实际结果见 [第二轮 renderer 实验报告](../../docs/modernization/round2-renderer-experiment.md)。
