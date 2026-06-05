/**
 * 头图四种排布对比样张（非正式测试）。
 *
 *   npx tsx src/pages/agent/form/html-report/renderer/__dev__/build-header-variants.ts
 *
 * 用同一份精简报告 + 同一张内联头图（tourism），分别渲成四种排布：
 *   band（横幅在上）/ cover（文字压图）/ split（左右分栏）/ frosted（满幅毛玻璃卡）。
 * 产出 docs/html-report/header-variants/{band,cover,split,frosted}.html + index.html，
 * 浏览器开 index.html 即可上下对比四种效果（用 iframe 各自隔离，互不串样式）。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ReportSchema } from '../../types'
import { buildReportHtml } from '../build-report-html'

const ROOT = resolve(import.meta.dirname, '../../../../../../..')
const OUT_DIR = resolve(ROOT, 'docs/html-report/header-variants')
mkdirSync(OUT_DIR, { recursive: true })

// 精简到「头部主导」：只留一节，头图换排布时对比最直观。
const base: ReportSchema = {
  title: '2026 城市文旅年度报告',
  eyebrow: '2026 年度 · 文旅大数据',
  subtitle: '以客流、收入与满意度三条主线，复盘全年文旅经营全貌',
  date: '2026-06-05',
  author: '文旅数据中心',
  headerArt: 'tourism',
  theme: {
    colorPalette: ['#1677ff', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de'],
  },
  sections: [
    {
      id: 's1',
      title: '核心指标',
      subtitle: '全年关键 KPI 概览',
      layout: 'full',
      blocks: [
        {
          id: 'b-kpi',
          type: 'stat-card-group',
          items: [
            {
              label: '接待游客',
              value: '4,820万',
              change: '+12%',
              trend: 'up',
              icon: 'users',
            },
            {
              label: '旅游收入',
              value: '¥586亿',
              change: '+18%',
              trend: 'up',
              icon: 'money',
            },
            { label: '游客满意度', value: '94.6', change: '+1.2', trend: 'up' },
            {
              label: '重点项目',
              value: '37',
              change: '+5',
              trend: 'up',
              icon: 'building',
            },
          ],
        },
        {
          id: 'b-p',
          type: 'paragraph',
          content:
            '全年文旅市场强劲复苏，**夜间经济**与 *乡村旅游* 成为新增长极；下阶段聚焦 `品质提升` 与区域协同。',
        },
      ],
    },
  ],
}

// 第一个是基准（无头图）：去掉 headerArt → resolveHeaderArt 落空 → 纯文字 Hero。
const CASES: { label: string; file: string; schema: ReportSchema }[] = [
  {
    label: '★ 图文卡 · 对照设计图（文字左 + 头图融入右侧）',
    file: 'card.html',
    schema: { ...base, headerLayout: 'card' },
  },
  {
    label: '原始版 · 无头图（纯文字 Hero）',
    file: 'none.html',
    schema: { ...base, headerArt: undefined, headerLayout: undefined },
  },
  {
    label: 'A 横幅在上、文字在下',
    file: 'band.html',
    schema: { ...base, headerLayout: 'band' },
  },
  {
    label: 'B 文字压在图上（封面式）',
    file: 'cover.html',
    schema: { ...base, headerLayout: 'cover' },
  },
  {
    label: 'C 左右分栏',
    file: 'split.html',
    schema: { ...base, headerLayout: 'split' },
  },
  {
    label: 'D 满幅背景 + 毛玻璃卡',
    file: 'frosted.html',
    schema: { ...base, headerLayout: 'frosted' },
  },
]

for (const c of CASES) {
  writeFileSync(resolve(OUT_DIR, c.file), buildReportHtml(c.schema), 'utf-8')
}

const index =
  `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width, initial-scale=1">` +
  `<title>头图排布 · 四方案对比</title>` +
  `<style>` +
  `body{margin:0;background:#0f172a;color:#e2e8f0;` +
  `font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}` +
  `.wrap{max-width:1040px;margin:0 auto;padding:24px 16px 64px}` +
  `h1{font-size:18px;margin:8px 4px 4px}` +
  `.hint{font-size:13px;color:#94a3b8;margin:0 4px 20px}` +
  `.case{margin-bottom:28px}` +
  `.cap{font-size:14px;font-weight:600;margin:0 4px 8px;color:#f8fafc}` +
  `iframe{width:100%;height:780px;border:1px solid #334155;border-radius:12px;` +
  `background:#fff;display:block}` +
  `</style></head><body><div class="wrap">` +
  `<h1>HTMLReport 头图排布 · 原始版 + 四方案对比</h1>` +
  `<p class="hint">同一份报告：第一块是无头图的原始纯文字 Hero，其余仅 headerLayout 不同。每块是独立 iframe（与真实报告一致）。</p>` +
  CASES.map(
    (c) =>
      `<div class="case"><p class="cap">${c.label}</p>` +
      `<iframe src="./${c.file}" loading="lazy"></iframe></div>`,
  ).join('') +
  `</div></body></html>`
writeFileSync(resolve(OUT_DIR, 'index.html'), index, 'utf-8')

console.log(`✓ wrote ${OUT_DIR}`)
for (const c of CASES) console.log(`  - ${c.file}  (${c.label})`)
console.log(`  - index.html  ← 浏览器打开这个对比`)
