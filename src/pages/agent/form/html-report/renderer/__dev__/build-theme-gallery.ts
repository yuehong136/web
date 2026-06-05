/**
 * 10 张主题头图画廊（非正式测试）。
 *
 *   npx tsx src/pages/agent/form/html-report/renderer/__dev__/build-theme-gallery.ts
 *
 * 同一份精简报告 × 10 个 headerArt slug，全用 card（图文卡）排布，逐张渲出，
 * 拼一个 iframe 对比页，肉眼核对每张主题图是否都正确内联、左侧留白够不够托文字。
 * 产出 docs/html-report/theme-gallery/{slug}.html + index.html。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ReportSchema } from '../../types'
import { buildReportHtml } from '../build-report-html'

const ROOT = resolve(import.meta.dirname, '../../../../../../..')
const OUT_DIR = resolve(ROOT, 'docs/html-report/theme-gallery')
mkdirSync(OUT_DIR, { recursive: true })

// slug → 展示用标题/eyebrow（仅样张文案，非产品 i18n）。
const THEMES: {
  slug: string
  label: string
  title: string
  eyebrow: string
}[] = [
  {
    slug: 'medical',
    label: '医疗环境',
    title: '2026 区域医疗服务年度报告',
    eyebrow: '2026 年度 · 医疗大数据',
  },
  {
    slug: 'business',
    label: '展业发展',
    title: '2026 展业经营分析报告',
    eyebrow: '2026 年度 · 经营复盘',
  },
  {
    slug: 'government',
    label: '政务治理',
    title: '2026 政务服务效能报告',
    eyebrow: '2026 年度 · 数字政务',
  },
  {
    slug: 'tourism',
    label: '文旅城市',
    title: '2026 城市文旅年度报告',
    eyebrow: '2026 年度 · 文旅大数据',
  },
  {
    slug: 'ecology',
    label: '生态环境',
    title: '2026 生态环境质量报告',
    eyebrow: '2026 年度 · 生态监测',
  },
  {
    slug: 'campus',
    label: '高校 · 默认',
    title: '2026 高校年度发展报告',
    eyebrow: '2026 学年 · 校情大数据',
  },
  {
    slug: 'campus-talent',
    label: '高校 · 人才培养',
    title: '2026 人才培养质量报告',
    eyebrow: '2026 学年 · 人才培养',
  },
  {
    slug: 'campus-growth',
    label: '高校 · 发展',
    title: '2026 学科与事业发展报告',
    eyebrow: '2026 学年 · 事业发展',
  },
  {
    slug: 'campus-teaching',
    label: '高校 · 教学',
    title: '2026 本科教学质量报告',
    eyebrow: '2026 学年 · 教育教学',
  },
  {
    slug: 'campus-data',
    label: '高校 · 数据治理',
    title: '2026 校园数据治理报告',
    eyebrow: '2026 学年 · 数据治理',
  },
]

function schemaFor(t: (typeof THEMES)[number]): ReportSchema {
  return {
    title: t.title,
    eyebrow: t.eyebrow,
    subtitle: '以核心指标与趋势为主线，复盘全年经营全貌',
    date: '2026-06-05',
    author: '数据中心',
    headerArt: t.slug,
    headerLayout: 'card',
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
                label: '总量',
                value: '4,820万',
                change: '+12%',
                trend: 'up',
                icon: 'users',
              },
              {
                label: '收入',
                value: '¥586亿',
                change: '+18%',
                trend: 'up',
                icon: 'money',
              },
              { label: '满意度', value: '94.6', change: '+1.2', trend: 'up' },
              {
                label: '重点项目',
                value: '37',
                change: '+5',
                trend: 'up',
                icon: 'building',
              },
            ],
          },
        ],
      },
    ],
  }
}

for (const t of THEMES) {
  writeFileSync(
    resolve(OUT_DIR, `${t.slug}.html`),
    buildReportHtml(schemaFor(t)),
    'utf-8',
  )
}

const index =
  `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width, initial-scale=1">` +
  `<title>主题头图画廊</title>` +
  `<style>` +
  `body{margin:0;background:#0f172a;color:#e2e8f0;` +
  `font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif}` +
  `.wrap{max-width:1040px;margin:0 auto;padding:24px 16px 64px}` +
  `h1{font-size:18px;margin:8px 4px 4px}` +
  `.hint{font-size:13px;color:#94a3b8;margin:0 4px 20px}` +
  `.case{margin-bottom:28px}` +
  `.cap{font-size:14px;font-weight:600;margin:0 4px 8px;color:#f8fafc}` +
  `iframe{width:100%;height:560px;border:1px solid #334155;border-radius:12px;` +
  `background:#fff;display:block}` +
  `</style></head><body><div class="wrap">` +
  `<h1>HTMLReport 主题头图画廊 · 10 张 × 图文卡</h1>` +
  `<p class="hint">同一份报告，仅 headerArt 不同，统一 card 排布。核对每张图是否内联正确、左侧留白够托文字。</p>` +
  THEMES.map(
    (t) =>
      `<div class="case"><p class="cap">${t.label}（${t.slug}）</p>` +
      `<iframe src="./${t.slug}.html" loading="lazy"></iframe></div>`,
  ).join('') +
  `</div></body></html>`
writeFileSync(resolve(OUT_DIR, 'index.html'), index, 'utf-8')

console.log(`✓ wrote ${OUT_DIR}`)
console.log(`  ${THEMES.length} themes + index.html  ← 浏览器打开这个`)
