/**
 * 提供可内联进报告 HTML 的 ECharts UMD 源码字符串。
 *
 * 通过 Vite `?raw` 取整份 `echarts.min.js`（约 1MB），用**动态 import**，
 * 把这坨重依赖挡在主 bundle 之外——只有真要拼自包含报告（下载/独立展示）
 * 时才加载（CLAUDE.md 重依赖懒加载规约）。加载一次后进程内缓存。
 *
 * 后端不需要本文件（后端只产 ReportSchema，不拼 HTML，见决策 #29/#30）。
 */

let cached: string | null = null
let pending: Promise<string> | null = null

/**
 * 异步取 echarts UMD 源码字符串（带进程内缓存）。
 * 拿到后传给 `buildReportHtml(schema, { echartsScript })` 内联。
 */
export async function loadInlineEchartsScript(): Promise<string> {
  if (cached !== null) return cached
  if (pending) return pending
  pending = import('echarts/dist/echarts.min.js?raw')
    .then((mod) => {
      cached = mod.default
      pending = null
      return mod.default
    })
    .catch((err) => {
      pending = null
      throw err
    })
  return pending
}

/** 同步取已缓存的源码；未加载过返回 null（调用方应先 await loadInlineEchartsScript）。 */
export function getCachedEchartsScript(): string | null {
  return cached
}
