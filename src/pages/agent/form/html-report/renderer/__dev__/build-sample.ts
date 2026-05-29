/**
 * Phase 1 离线验证脚本（非正式测试）。
 *
 *   npx tsx src/pages/agent/form/html-report/renderer/__dev__/build-sample.ts
 *
 * 产出 `docs/html-report/sample-report.html`：内联真实 echarts.min.js 的自包含
 * 单文件，双击浏览器离线打开，核对各文本/数据 Block + 多种图表是否都出来，
 * 并肉眼核对指标卡升/降/平变化率的红/绿/灰渲染。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ReportSchema } from '../../types'
import { buildReportHtml } from '../build-report-html'

const ROOT = resolve(import.meta.dirname, '../../../../../../..')
const echartsScript = readFileSync(
  resolve(ROOT, 'node_modules/echarts/dist/echarts.min.js'),
  'utf-8',
)

const schema: ReportSchema = {
  title: 'Q3 业务经营分析报告',
  subtitle: '示例报告 · 用于 Phase 1 渲染器离线验证',
  date: '2026-05-25',
  author: '增长分析团队',
  theme: {
    primaryColor: '#1677ff',
    colorPalette: ['#1677ff', '#36cfc9', '#ffc53d', '#ff7a45', '#9254de'],
  },
  sections: [
    {
      id: 's1',
      title: '核心指标',
      subtitle: '本季度关键 KPI 概览',
      layout: 'full',
      blocks: [
        {
          id: 'b-kpi',
          type: 'stat-card-group',
          items: [
            { label: '总营收', value: '¥12.4M', change: '+18%', trend: 'up' },
            { label: '新增客户', value: '3,210', change: '+7%', trend: 'up' },
            { label: '流失率', value: '4.2%', change: '-1.1pt', trend: 'down' },
            { label: 'NPS', value: '52', change: '+0', trend: 'neutral' },
          ],
        },
        {
          id: 'b-callout',
          type: 'callout',
          variant: 'insight',
          title: '关键洞察',
          content:
            '营收增长主要由**企业版**贡献，环比提升 `18%`；但 *中小客户* 流失需关注。',
        },
      ],
    },
    {
      id: 's-change',
      title: '指标卡变化率（红绿示意）',
      subtitle:
        '升→绿、降→红、平/未判向→灰；颜色由 trend 决定，trend 在后端按 change 符号推导，认不出则落灰（绝不上错色）',
      layout: 'three-column',
      blocks: [
        {
          id: 'b-chg-up',
          type: 'stat-card',
          label: '营收环比',
          value: '¥38.6M',
          change: '+12.5%',
          trend: 'up',
          description: '正号 → 绿（--rpt-success）',
        },
        {
          id: 'b-chg-down',
          type: 'stat-card',
          label: '获客成本环比',
          value: '¥214',
          // Unicode 减号 U+2212（非 ASCII 连字符），后端 _trend_from_change 同样判为 down
          change: '−3.2%',
          trend: 'down',
          description: '负号 → 红（--rpt-error）',
        },
        {
          id: 'b-chg-flat',
          type: 'stat-card',
          label: '毛利率环比',
          value: '47.0%',
          change: '0.0%',
          trend: 'neutral',
          description: '零/未判向 → 灰',
        },
      ],
    },
    {
      id: 's2',
      title: '趋势与构成',
      layout: 'two-column',
      blocks: [
        {
          id: 'b-line',
          type: 'chart',
          chartType: 'line',
          title: '月度营收趋势（万元）',
          xAxisKey: 'month',
          series: [
            { dataKey: 'enterprise', name: '企业版' },
            { dataKey: 'smb', name: '中小版' },
          ],
          data: [
            { month: '7月', enterprise: 320, smb: 180 },
            { month: '8月', enterprise: 360, smb: 175 },
            { month: '9月', enterprise: 420, smb: 168 },
          ],
        },
        {
          id: 'b-pie',
          type: 'chart',
          chartType: 'donut',
          title: '营收构成',
          nameKey: 'name',
          valueKey: 'value',
          data: [
            { name: '企业版', value: 1100 },
            { name: '中小版', value: 520 },
            { name: '增值服务', value: 280 },
          ],
        },
      ],
    },
    {
      id: 's3',
      title: '渠道与对比',
      layout: 'sidebar-right',
      blocks: [
        {
          id: 'b-bar',
          type: 'chart',
          chartType: 'bar',
          title: '各渠道获客（人）',
          role: 'main',
          xAxisKey: 'channel',
          series: [{ dataKey: 'count', name: '新增客户' }],
          data: [
            { channel: '官网', count: 1200 },
            { channel: '社媒', count: 860 },
            { channel: '转介绍', count: 640 },
            { channel: '合作', count: 510 },
          ],
        },
        {
          id: 'b-list',
          type: 'list',
          role: 'side',
          title: '行动项',
          ordered: true,
          items: ['复盘中小客户流失', '加大转介绍激励', '企业版扩容压测'],
        },
      ],
    },
    {
      id: 's4',
      title: '明细与对比',
      layout: 'full',
      blocks: [
        {
          id: 'b-table',
          type: 'table',
          title: '区域业绩',
          headers: ['区域', '营收(万)', '环比'],
          rows: [
            ['华东', '520', '+22%'],
            ['华北', '410', '+15%'],
            ['华南', '380', '+9%'],
          ],
        },
        {
          id: 'b-matrix',
          type: 'comparison-matrix',
          title: '版本能力对比',
          items: ['基础版', '企业版'],
          criteria: [
            { name: 'SSO', values: ['—', '✓'] },
            { name: 'SLA', values: ['99.0%', '99.9%'] },
            { name: '专属支持', values: ['—', '✓'] },
          ],
        },
        {
          id: 'b-timeline',
          type: 'timeline',
          title: '季度里程碑',
          items: [
            {
              date: '7月',
              title: '企业版 2.0 发布',
              description: '新增 SSO 与审计日志',
            },
            {
              date: '8月',
              title: '华东区域突破',
              description: '单季营收破 500 万',
            },
            { date: '9月', title: 'NPS 调研', description: '满意度提升至 52' },
          ],
        },
        {
          id: 'b-radar',
          type: 'chart',
          chartType: 'radar',
          title: '能力雷达',
          radarKeys: ['dimension'],
          series: [{ dataKey: 'score', name: '本季' }],
          data: [
            { dimension: '稳定性', score: 90 },
            { dimension: '性能', score: 85 },
            { dimension: '易用性', score: 78 },
            { dimension: '生态', score: 70 },
            { dimension: '支持', score: 88 },
          ],
        },
        {
          id: 'b-funnel',
          type: 'chart',
          chartType: 'funnel',
          title: '转化漏斗',
          nameKey: 'stage',
          valueKey: 'count',
          data: [
            { stage: '访问', count: 10000 },
            { stage: '注册', count: 4200 },
            { stage: '试用', count: 1800 },
            { stage: '付费', count: 620 },
          ],
        },
      ],
    },
    {
      id: 's5',
      layout: 'full',
      blocks: [
        { id: 'b-h2', type: 'heading', level: 2, content: '结语' },
        {
          id: 'b-p',
          type: 'paragraph',
          content:
            '本季度整体向好，企业版是增长引擎。下季度聚焦 `中小客户留存` 与 **渠道效率**。',
        },
      ],
    },
  ],
}

const html = buildReportHtml(schema, { echartsScript })
const out = resolve(ROOT, 'docs/html-report/sample-report.html')
writeFileSync(out, html, 'utf-8')

const charts = schema.sections.flatMap((s) =>
  s.blocks.filter((b) => b.type === 'chart'),
).length
const schemaBytes = JSON.stringify(schema).length
console.log(`✓ wrote ${out}`)
console.log(
  `  ReportSchema JSON（真正入库/随消息走）: ${(schemaBytes / 1024).toFixed(1)} KB`,
)
console.log(
  `  整份自包含 HTML（仅展示/下载时临时拼）: ${(html.length / 1024).toFixed(1)} KB`,
)
console.log(
  `    其中 echarts.min.js: ${(echartsScript.length / 1024).toFixed(1)} KB`,
)
console.log(`  charts inlined: ${charts}`)
