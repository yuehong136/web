import type { ThemeConfig } from '../types'
import { CHART_HEIGHT, REPORT_CONTENT_WIDTH } from '../constants'

const DEFAULT_PALETTE = ['#1677ff', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de']

/**
 * 返回报告的内联 CSS 字符串。自包含：自定义 `--rpt-*` CSS Variables 与 `.rpt`
 * 下的整套 class，不依赖任何外部 stylesheet。既可嵌进 multrag-web 应用壳
 * （Designer 预览），也可塞进独立 iframe 文档（下载的自包含 HTML）。
 *
 * 渲染端例外（决策 #7）：报告只用 `.rpt` / `--rpt-*`，不用主应用 Tailwind 语义 token。
 */
export function buildReportStyles(theme?: ThemeConfig): string {
  const palette =
    theme?.colorPalette && theme.colorPalette.length > 0
      ? theme.colorPalette
      : DEFAULT_PALETTE

  const paletteVars = palette
    .map((color, i) => `    --rpt-chart-${i + 1}: ${color};`)
    .join('\n')

  return `
.rpt {
  --rpt-bg: #ffffff;
  --rpt-surface: #f8fafc;
  --rpt-surface-muted: #f1f5f9;
  --rpt-border: #e2e8f0;
  --rpt-border-subtle: #eef2f7;
  --rpt-text: #0f172a;
  --rpt-text-muted: #475569;
  --rpt-text-caption: #94a3b8;
  --rpt-success: #16a34a;
  --rpt-warning: #d97706;
  --rpt-error: #dc2626;
  --rpt-info: #2563eb;
  --rpt-insight: #7c3aed;
  --rpt-radius: 10px;
  --rpt-radius-sm: 6px;
  --rpt-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15, 23, 42, 0.04);
${paletteVars}

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC",
    "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  color: var(--rpt-text);
  background: var(--rpt-bg);
  line-height: 1.6;
  font-size: 14px;
  box-sizing: border-box;
}
.rpt *,
.rpt *::before,
.rpt *::after { box-sizing: border-box; }

.rpt__container {
  max-width: ${REPORT_CONTENT_WIDTH}px;
  margin: 0 auto;
  padding: 40px 32px 56px;
}

/* ----- header ----- */
.rpt__header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--rpt-border); }
.rpt__title { font-size: 30px; font-weight: 700; margin: 0 0 8px; color: var(--rpt-text); }
.rpt__meta { margin-top: 12px; font-size: 13px; color: var(--rpt-text-caption); display: flex; gap: 16px; }

/* ----- section ----- */
.rpt-section { margin-bottom: 36px; }
.rpt-section__header { margin-bottom: 16px; }
.rpt-section__title { font-size: 22px; font-weight: 600; margin: 0; color: var(--rpt-text); }
.rpt-section__subtitle { font-size: 14px; color: var(--rpt-text-muted); margin: 4px 0 0; }
.rpt-section__grid { display: grid; gap: 20px; }
/* grid 子项默认 min-width:auto 不会缩到内容尺寸以下；置 0 才能让列正常分配，
   否则图表等含定宽内容的子项会撑爆列、把相邻列顶出视口（见排版修复）。 */
.rpt-section__grid > * { min-width: 0; }
.rpt-section__grid--full          { grid-template-columns: 1fr; }
.rpt-section__grid--two-column    { grid-template-columns: 1fr 1fr; }
.rpt-section__grid--three-column  { grid-template-columns: 1fr 1fr 1fr; }
.rpt-section__grid--sidebar-left  { grid-template-columns: 1fr 2fr; }
.rpt-section__grid--sidebar-right { grid-template-columns: 2fr 1fr; }
@media (max-width: 720px) {
  .rpt-section__grid--two-column,
  .rpt-section__grid--three-column,
  .rpt-section__grid--sidebar-left,
  .rpt-section__grid--sidebar-right { grid-template-columns: 1fr; }
}

/* ----- heading block ----- */
.rpt-heading--1 { font-size: 24px; font-weight: 700; margin: 8px 0; color: var(--rpt-text); }
.rpt-heading--2 { font-size: 19px; font-weight: 600; margin: 8px 0; color: var(--rpt-text); }
.rpt-heading--3 { font-size: 16px; font-weight: 600; margin: 8px 0; color: var(--rpt-text); }

/* ----- paragraph ----- */
.rpt-paragraph { margin: 0; color: var(--rpt-text); }
.rpt-paragraph code { font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  background: var(--rpt-surface-muted); padding: 0 4px; border-radius: 4px; font-size: 0.92em; }

/* ----- callout ----- */
.rpt-callout { border-radius: var(--rpt-radius); padding: 14px 16px;
  border-left: 4px solid var(--rpt-info); background: rgba(37, 99, 235, 0.06); }
.rpt-callout--success { border-left-color: var(--rpt-success); background: rgba(22, 163, 74, 0.06); }
.rpt-callout--warning { border-left-color: var(--rpt-warning); background: rgba(217, 119, 6, 0.06); }
.rpt-callout--insight { border-left-color: var(--rpt-insight); background: rgba(124, 58, 237, 0.06); }
.rpt-callout__title { font-weight: 600; margin: 0 0 4px; color: var(--rpt-text); }
.rpt-callout__content { margin: 0; color: var(--rpt-text); }

/* ----- list ----- */
.rpt-list__title { font-weight: 600; margin: 0 0 8px; color: var(--rpt-text); }
.rpt-list ul, .rpt-list ol { margin: 0; padding-left: 22px; }
.rpt-list li { margin: 4px 0; }

/* ----- stat card ----- */
.rpt-stat-card { padding: 16px; border: 1px solid var(--rpt-border);
  border-radius: var(--rpt-radius); background: var(--rpt-bg); }
.rpt-stat-card__label { font-size: 12px; color: var(--rpt-text-muted); margin-bottom: 6px; }
.rpt-stat-card__value-row { display: flex; align-items: baseline; gap: 8px; }
.rpt-stat-card__value { font-size: 26px; font-weight: 700; color: var(--rpt-text); }
.rpt-stat-card__change { font-size: 12px; font-weight: 600; }
.rpt-stat-card__change--up { color: var(--rpt-success); }
.rpt-stat-card__change--down { color: var(--rpt-error); }
.rpt-stat-card__change--neutral { color: var(--rpt-text-muted); }
.rpt-stat-card__description { font-size: 12px; color: var(--rpt-text-caption); margin-top: 8px; }
.rpt-stat-card-group { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }

/* ----- table ----- */
.rpt-table__title { font-weight: 600; margin: 0 0 8px; }
.rpt-table { width: 100%; border-collapse: collapse; font-size: 13px;
  border: 1px solid var(--rpt-border); border-radius: var(--rpt-radius); overflow: hidden; }
.rpt-table th, .rpt-table td { padding: 10px 12px; text-align: left;
  border-bottom: 1px solid var(--rpt-border-subtle); }
.rpt-table thead { background: var(--rpt-surface); }
.rpt-table th { font-weight: 600; color: var(--rpt-text); }
.rpt-table tbody tr:last-child td { border-bottom: 0; }
.rpt-table tbody tr:hover { background: var(--rpt-surface); }

/* ----- comparison matrix ----- */
.rpt-matrix__title { font-weight: 600; margin: 0 0 8px; }
.rpt-matrix { width: 100%; border-collapse: collapse; font-size: 13px;
  border: 1px solid var(--rpt-border); border-radius: var(--rpt-radius); overflow: hidden; }
.rpt-matrix th, .rpt-matrix td { padding: 10px 12px; border-bottom: 1px solid var(--rpt-border-subtle); }
.rpt-matrix thead th { background: var(--rpt-surface); font-weight: 600; }
.rpt-matrix tbody th { background: var(--rpt-surface); font-weight: 600; text-align: left; }
.rpt-matrix tbody td { text-align: center; }

/* ----- timeline ----- */
.rpt-timeline__title { font-weight: 600; margin: 0 0 12px; }
.rpt-timeline__list { position: relative; padding-left: 24px; margin: 0; list-style: none; }
.rpt-timeline__list::before { content: ""; position: absolute; left: 7px; top: 4px; bottom: 4px;
  width: 2px; background: var(--rpt-border); }
.rpt-timeline__item { position: relative; padding: 0 0 16px 8px; }
.rpt-timeline__dot { position: absolute; left: -22px; top: 5px; width: 12px; height: 12px;
  border-radius: 50%; background: var(--rpt-chart-1);
  box-shadow: 0 0 0 3px var(--rpt-bg), 0 0 0 4px var(--rpt-border); }
.rpt-timeline__date { font-size: 12px; color: var(--rpt-text-caption); }
.rpt-timeline__heading { font-weight: 600; color: var(--rpt-text); margin: 2px 0; }
.rpt-timeline__desc { font-size: 13px; color: var(--rpt-text-muted); margin: 0; }

/* ----- chart ----- */
.rpt-chart { min-width: 0; }
.rpt-chart__title { font-weight: 600; margin: 0 0 8px; }
/* 宽度跟随所在列自适应（不写死 px，否则在 grid 列里会溢出）；高度固定供 echarts 量取。 */
.rpt-chart__canvas { width: 100%; height: ${CHART_HEIGHT}px; }
`
}
