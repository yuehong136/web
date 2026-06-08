/**
 * 指标卡内联 SVG 图标集 + 标签关键词启发式。纯函数、零依赖、零外链。
 *
 * 报告是自包含 HTML（可离线/iframe/中台），不能引图标库；故内置一小套 stroke 风格
 * 通用图标，统一 24 视框、`currentColor` 描边，由外层圆的 class 决定主题色。
 *
 * 选图标优先级（见 {@link blocks}）：① 卡上显式 `icon` 字段命中内置名；
 * ② 否则 {@link pickIconByLabel} 按 label 双语关键词挑；③ 兜底 `chart`。
 */

/** 图标名 → SVG 内层元素（外层 <svg> 由 {@link renderStatIcon} 统一包裹） */
export const ICON_SVGS: Record<string, string> = {
  users:
    '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  money:
    '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 6v2m0 8v2"/>',
  'trending-up':
    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  'thumbs-up':
    '<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/>',
  building:
    '<line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  calendar:
    '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="3" x2="21" y1="10" y2="10"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="16" x2="16" y1="2" y2="6"/>',
  clock:
    '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  chart:
    '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  target:
    '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  layers:
    '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
}

/** 内置图标名集合（设计器下拉选项与渲染校验共用此真源） */
export const ICON_NAMES: string[] = Object.keys(ICON_SVGS)

/**
 * 关键词 → 图标名的启发式规则。按数组顺序匹配，命中即停（**先具体后宽泛**：
 * 「游客满意度」要落 thumbs-up 而非 users，故满意类排在游客类之前）。
 * 中英双语，命中 label（原串）或其小写。
 */
const LABEL_RULES: Array<{ icon: string; keys: string[] }> = [
  {
    icon: 'thumbs-up',
    keys: ['满意', '好评', '口碑', 'satisf', 'rating', 'praise'],
  },
  {
    icon: 'money',
    keys: [
      '收入',
      '营收',
      '金额',
      '投资',
      '消费',
      '产值',
      '营业额',
      'gdp',
      '¥',
      '￥',
      'revenue',
      'income',
      'sales',
      'invest',
      'cost',
      'budget',
    ],
  },
  {
    icon: 'users',
    keys: [
      '游客',
      '人次',
      '人数',
      '客流',
      '访客',
      '用户',
      '参与人',
      'visitor',
      'user',
      'people',
      'traffic',
      'audience',
    ],
  },
  {
    icon: 'trending-up',
    keys: [
      '率',
      '占比',
      '比例',
      '增长',
      '增速',
      '百分',
      '%',
      'rate',
      'ratio',
      'percent',
      'growth',
    ],
  },
  {
    icon: 'building',
    keys: [
      '景区',
      '景点',
      '场馆',
      '基地',
      '机构',
      '项目',
      '院校',
      '学校',
      'venue',
      'site',
      'project',
      'building',
      'institution',
      'school',
    ],
  },
  {
    icon: 'clock',
    keys: [
      '时长',
      '天数',
      '周期',
      '停留',
      '时间',
      'duration',
      'days',
      'hours',
      'time',
      'stay',
    ],
  },
  {
    icon: 'globe',
    keys: [
      '国际',
      '境外',
      '出入境',
      '全球',
      '分布',
      'international',
      'global',
      'overseas',
      'distribution',
    ],
  },
  {
    icon: 'check',
    keys: [
      '达标',
      '准确',
      '合格',
      '完成',
      '达成',
      '预警',
      'accuracy',
      'complete',
      'qualified',
      'achieve',
    ],
  },
  {
    icon: 'calendar',
    keys: ['场次', '次数', '日期', '年度', 'date', 'session', 'times'],
  },
  {
    icon: 'layers',
    keys: [
      '覆盖',
      '规模',
      '总量',
      '数量',
      '品类',
      '种类',
      '点位',
      'coverage',
      'scale',
      'count',
      'total',
      'categor',
    ],
  },
  { icon: 'target', keys: ['目标', '指标', 'target', 'goal', 'kpi'] },
]

/** 按 label 关键词挑图标名；无命中回落 `chart`。 */
export function pickIconByLabel(label: string | undefined): string {
  const raw = (label ?? '').trim()
  if (!raw) return 'chart'
  const lower = raw.toLowerCase()
  for (const rule of LABEL_RULES) {
    if (rule.keys.some((k) => raw.includes(k) || lower.includes(k))) {
      return rule.icon
    }
  }
  return 'chart'
}

/**
 * 指标卡图标 → 着色圆 HTML 片段。
 * 颜色由 `rpt-stat-card__icon--{accent}` class 决定（styles.ts 按调色板生成 1..5），
 * 故此处不内联颜色，只按卡序选 accent 槽。
 */
export function renderStatIcon(name: string, accent: number): string {
  const inner = ICON_SVGS[name] ?? ICON_SVGS.chart
  const n = ((accent % 5) + 5) % 5 || 5 // 归一到 1..5
  return (
    `<span class="rpt-stat-card__icon rpt-stat-card__icon--${n}">` +
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>` +
    `</span>`
  )
}
