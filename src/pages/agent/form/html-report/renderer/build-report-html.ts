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
import { resolveHeaderArt } from './header-art'
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

// ----- Hero 头部：四个可复用小块 + 五种排布（纯文字 + 四种带图） -----

function heroEyebrow(schema: ReportSchema): string {
  return schema.eyebrow
    ? `<div class="rpt__eyebrow">${escapeHtml(schema.eyebrow)}</div>`
    : ''
}

function heroTitle(schema: ReportSchema): string {
  return `<h1 class="rpt__title">${escapeHtml(schema.title)}</h1>`
}

function heroSubtitle(schema: ReportSchema): string {
  return schema.subtitle
    ? `<p class="rpt__subtitle">${escapeHtml(schema.subtitle)}</p>`
    : ''
}

function heroMeta(schema: ReportSchema): string {
  const parts: string[] = []
  if (schema.date) parts.push(`<span>${escapeHtml(schema.date)}</span>`)
  if (schema.author) parts.push(`<span>${escapeHtml(schema.author)}</span>`)
  return parts.length ? `<div class="rpt__meta">${parts.join('')}</div>` : ''
}

/** 纯文字 Hero（无头图 / headerArt 未命中时的回落，行为同升级前）。 */
function renderTextHero(schema: ReportSchema): string {
  return (
    `<header class="rpt__header">` +
    heroEyebrow(schema) +
    heroTitle(schema) +
    heroSubtitle(schema) +
    heroMeta(schema) +
    `</header>`
  )
}

/**
 * 图文卡：整块圆角卡，文字左、头图融入右侧并向右下出血，左侧叠一层白→透明渐变
 * 保证文字可读（要求素材左侧留白，否则用其它排布）。对照参考设计图。
 */
function renderCardHero(schema: ReportSchema, art: string): string {
  return (
    `<header class="rpt__header rpt__header--card">` +
    `<div class="rpt__card-hero">` +
    `<img class="rpt__card-img" src="${art}" alt="">` +
    `<div class="rpt__card-text">` +
    heroEyebrow(schema) +
    heroTitle(schema) +
    heroSubtitle(schema) +
    heroMeta(schema) +
    `</div></div></header>`
  )
}

/** A 横幅在上、文字在下：图为顶部一条 band，文字落在画布上，最稳。 */
function renderBandHero(schema: ReportSchema, art: string): string {
  return (
    `<header class="rpt__header rpt__header--band">` +
    `<div class="rpt__art"><img class="rpt__art-img" src="${art}" alt=""></div>` +
    `<div class="rpt__hero-text">` +
    heroEyebrow(schema) +
    heroTitle(schema) +
    heroSubtitle(schema) +
    heroMeta(schema) +
    `</div></header>`
  )
}

/** B 文字压在图上：标题/副标题叠在图上 + 底部渐变压暗保证可读；meta 落到图下。 */
function renderCoverHero(schema: ReportSchema, art: string): string {
  return (
    `<header class="rpt__header rpt__header--cover">` +
    `<div class="rpt__cover">` +
    `<img class="rpt__cover-img" src="${art}" alt="">` +
    `<div class="rpt__cover-text">` +
    heroEyebrow(schema) +
    heroTitle(schema) +
    heroSubtitle(schema) +
    `</div></div>` +
    heroMeta(schema) +
    `</header>`
  )
}

/** C 左文右图：文字与图各占一半，移动端堆叠。 */
function renderSplitHero(schema: ReportSchema, art: string): string {
  return (
    `<header class="rpt__header rpt__header--split">` +
    `<div class="rpt__split-text">` +
    heroEyebrow(schema) +
    heroTitle(schema) +
    heroSubtitle(schema) +
    heroMeta(schema) +
    `</div>` +
    `<div class="rpt__split-art"><img class="rpt__split-img" src="${art}" alt=""></div>` +
    `</header>`
  )
}

/** D 满幅背景 + 文字毛玻璃卡：图铺满头部，文字落进半透明毛玻璃卡。 */
function renderFrostedHero(schema: ReportSchema, art: string): string {
  return (
    `<header class="rpt__header rpt__header--frosted">` +
    `<div class="rpt__frost">` +
    `<img class="rpt__frost-img" src="${art}" alt="">` +
    `<div class="rpt__frost-card">` +
    heroEyebrow(schema) +
    heroTitle(schema) +
    heroSubtitle(schema) +
    heroMeta(schema) +
    `</div></div></header>`
  )
}

function renderHeader(schema: ReportSchema): string {
  const art = resolveHeaderArt(schema.headerArt)
  if (!art) return renderTextHero(schema)
  // 缺省(及显式 'card')= 图文卡;band/cover/split/frosted 仍保留供 dev 样张/将来扩展。
  switch (schema.headerLayout) {
    case 'band':
      return renderBandHero(schema, art)
    case 'cover':
      return renderCoverHero(schema, art)
    case 'split':
      return renderSplitHero(schema, art)
    case 'frosted':
      return renderFrostedHero(schema, art)
    default:
      return renderCardHero(schema, art)
  }
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
