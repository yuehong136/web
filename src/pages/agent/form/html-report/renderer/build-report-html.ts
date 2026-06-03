/**
 * 顶层渲染器：ReportSchema → 自包含 HTML 字符串。纯函数、同步、零 React/DOM。
 *
 * 自包含 = 内联 `.rpt` CSS + （含图表时）内联 ECharts + 内联数据，不引用任何
 * 外部 URL/CDN/字体，可下载后浏览器离线打开（决策 #26/#28）。
 *
 * ECharts 源码由调用方通过 `options.echartsScript` 注入（见 `echarts-inline`），
 * 而非本模块自行加载——好处：① 本模块同步、可在 Node 下无打包器直接测；
 * ② 消费端掌控懒加载/缓存；③ 无图表的报告完全不带 ECharts，保持小体积。
 *
 * 跑在消费端（Designer 预览 / runtime-chat / datav）。**后端不需要本文件**
 * （后端只产 ReportSchema，见决策 #29/#30）。
 */
import type { ChartBlock, ReportSchema, Section, ThemeConfig } from '../types'
import { chartMountId, escapeHtml } from './blocks'
import { buildChartOption } from './echarts-option'
import { renderSection } from './layout'
import { buildReportStyles } from './styles'

export interface BuildReportHtmlOptions {
  /**
   * 内联的 ECharts UMD 源码（来自 `loadInlineEchartsScript()`）。
   * 报告含图表且提供该项时才内联绘图脚本；不提供则图表容器留空占位。
   */
  echartsScript?: string
  /** 文档语言，默认 'zh-CN' */
  lang?: string
}

function collectCharts(sections: Section[]): ChartBlock[] {
  const charts: ChartBlock[] = []
  for (const section of sections) {
    for (const block of section.blocks ?? []) {
      if (block.type === 'chart') charts.push(block)
    }
  }
  return charts
}

function renderHeader(schema: ReportSchema): string {
  const eyebrow = schema.eyebrow
    ? `<div class="rpt__eyebrow">${escapeHtml(schema.eyebrow)}</div>`
    : ''
  const subtitle = schema.subtitle
    ? `<p class="rpt__subtitle">${escapeHtml(schema.subtitle)}</p>`
    : ''
  const metaParts: string[] = []
  if (schema.date) metaParts.push(`<span>${escapeHtml(schema.date)}</span>`)
  if (schema.author) metaParts.push(`<span>${escapeHtml(schema.author)}</span>`)
  const meta = metaParts.length
    ? `<div class="rpt__meta">${metaParts.join('')}</div>`
    : ''
  return (
    `<header class="rpt__header">` +
    `${eyebrow}` +
    `<h1 class="rpt__title">${escapeHtml(schema.title)}</h1>` +
    `${subtitle}${meta}</header>`
  )
}

/** 防止内联 JSON 中的 `</script>` 提前闭合脚本块、及 JS 非法的行分隔符。 */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/[\u2028\u2029]/g, (ch) => '\\u' + ch.charCodeAt(0).toString(16))
}

function renderChartScript(
  charts: ChartBlock[],
  theme: ThemeConfig | undefined,
  echartsScript: string | undefined,
): string {
  if (charts.length === 0) return ''
  const specs = charts.map((c) => ({
    id: chartMountId(c.id),
    option: buildChartOption(c, theme),
  }))
  const lib = echartsScript ? `<script>${echartsScript}</script>` : ''
  const init =
    `<script>(function(){` +
    `if(!window.echarts){return;}` +
    `var specs=${safeJson(specs)};` +
    `var charts=[];` +
    `specs.forEach(function(s){` +
    `var el=document.getElementById(s.id);` +
    `if(!el){return;}` +
    `try{var c=window.echarts.init(el,null,{renderer:'svg'});c.setOption(s.option);charts.push(c);}catch(e){}` +
    `});` +
    // 跟随窗口/iframe 尺寸重排，避免非全屏下图表被裁切
    `window.addEventListener('resize',function(){charts.forEach(function(c){try{c.resize();}catch(e){}});});` +
    `})();</script>`
  return lib + init
}

/**
 * ReportSchema → 自包含 HTML 文档字符串。
 *
 * @example
 * const html = buildReportHtml(schema, { echartsScript: await loadInlineEchartsScript() })
 * // 写入 .html 离线打开，或喂给 <iframe srcDoc={html}>
 */
export function buildReportHtml(
  schema: ReportSchema,
  options: BuildReportHtmlOptions = {},
): string {
  const lang = options.lang ?? 'zh-CN'
  const sections = schema.sections ?? []
  const styles = buildReportStyles(schema.theme)
  const header = renderHeader(schema)
  // 仅「有标题」小节参与 01/02… 编号，按出现顺序递增。
  let titledCount = 0
  const body = sections
    .map((section) =>
      renderSection(section, section.title ? ++titledCount : undefined),
    )
    .join('')
  const chartScript = renderChartScript(
    collectCharts(sections),
    schema.theme,
    options.echartsScript,
  )
  return (
    `<!DOCTYPE html>` +
    `<html lang="${lang}">` +
    `<head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>${escapeHtml(schema.title)}</title>` +
    `<style>${styles}</style>` +
    `</head>` +
    `<body>` +
    `<div class="rpt"><div class="rpt__container">${header}${body}</div></div>` +
    `${chartScript}` +
    `</body>` +
    `</html>`
  )
}
