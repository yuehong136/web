/**
 * 字段编辑器的枚举选项与列表项描述符,供 {@link ./field-map} 组装各 Block 的字段映射。
 * 拆出纯数据,让 field-map.ts 专注于"Block → 字段"的结构声明。
 */
import type { DirectiveField, EnumOption, ListItemField } from './field-map'

export const LEVEL_OPTIONS: EnumOption[] = [
  { value: '1', labelKey: 'flow.htmlReportLevel1', fallback: 'Heading 1' },
  { value: '2', labelKey: 'flow.htmlReportLevel2', fallback: 'Heading 2' },
  { value: '3', labelKey: 'flow.htmlReportLevel3', fallback: 'Heading 3' },
]

export const VARIANT_OPTIONS: EnumOption[] = [
  { value: 'info', labelKey: 'flow.htmlReportVariantInfo', fallback: 'Info' },
  {
    value: 'success',
    labelKey: 'flow.htmlReportVariantSuccess',
    fallback: 'Success',
  },
  {
    value: 'warning',
    labelKey: 'flow.htmlReportVariantWarning',
    fallback: 'Warning',
  },
  {
    value: 'insight',
    labelKey: 'flow.htmlReportVariantInsight',
    fallback: 'Insight',
  },
]

export const TREND_OPTIONS: EnumOption[] = [
  { value: 'up', labelKey: 'flow.htmlReportTrendUp', fallback: 'Up' },
  { value: 'down', labelKey: 'flow.htmlReportTrendDown', fallback: 'Down' },
  {
    value: 'neutral',
    labelKey: 'flow.htmlReportTrendNeutral',
    fallback: 'Neutral',
  },
]

/**
 * 指标卡图标选项。`value` 必须与 `renderer/icons.ts` 的 `ICON_SVGS` 键一致;
 * 首项 `'auto'` 是「自动」哨兵(不在 ICON_SVGS 中),渲染时回落到 label 关键词启发式
 * (Radix Select 不接受空串 value,故用 'auto' 而非 '')。
 */
export const ICON_OPTIONS: EnumOption[] = [
  { value: 'auto', labelKey: 'flow.htmlReportIconAuto', fallback: 'Auto' },
  { value: 'users', labelKey: 'flow.htmlReportIconUsers', fallback: 'People' },
  { value: 'money', labelKey: 'flow.htmlReportIconMoney', fallback: 'Money' },
  {
    value: 'trending-up',
    labelKey: 'flow.htmlReportIconTrend',
    fallback: 'Growth',
  },
  {
    value: 'thumbs-up',
    labelKey: 'flow.htmlReportIconThumbsUp',
    fallback: 'Approval',
  },
  {
    value: 'building',
    labelKey: 'flow.htmlReportIconBuilding',
    fallback: 'Building',
  },
  {
    value: 'calendar',
    labelKey: 'flow.htmlReportIconCalendar',
    fallback: 'Calendar',
  },
  {
    value: 'clock',
    labelKey: 'flow.htmlReportIconClock',
    fallback: 'Duration',
  },
  { value: 'flag', labelKey: 'flow.htmlReportIconFlag', fallback: 'Milestone' },
  { value: 'chart', labelKey: 'flow.htmlReportIconChart', fallback: 'Chart' },
  { value: 'star', labelKey: 'flow.htmlReportIconStar', fallback: 'Rating' },
  {
    value: 'target',
    labelKey: 'flow.htmlReportIconTarget',
    fallback: 'Target',
  },
  { value: 'layers', labelKey: 'flow.htmlReportIconLayers', fallback: 'Scale' },
  { value: 'globe', labelKey: 'flow.htmlReportIconGlobe', fallback: 'Global' },
  {
    value: 'check',
    labelKey: 'flow.htmlReportIconCheck',
    fallback: 'Verified',
  },
]

/**
 * Hero 头图选项。首项 `'none'` 是「无头图」哨兵(不在 header-art 注册表,
 * resolveHeaderArt 落空 → 纯文字 Hero);其余 `value` 必须与 `renderer/header-art.ts`
 * 的 `HEADER_ARTWORKS` 键一致。
 */
export const HEADER_ART_OPTIONS: EnumOption[] = [
  { value: 'none', labelKey: 'flow.htmlReportHeaderArtNone', fallback: 'None' },
  {
    value: 'medical',
    labelKey: 'flow.htmlReportHeaderArtMedical',
    fallback: 'Healthcare',
  },
  {
    value: 'business',
    labelKey: 'flow.htmlReportHeaderArtBusiness',
    fallback: 'Business growth',
  },
  {
    value: 'government',
    labelKey: 'flow.htmlReportHeaderArtGovernment',
    fallback: 'Government',
  },
  {
    value: 'tourism',
    labelKey: 'flow.htmlReportHeaderArtTourism',
    fallback: 'Culture & tourism',
  },
  {
    value: 'ecology',
    labelKey: 'flow.htmlReportHeaderArtEcology',
    fallback: 'Ecology',
  },
  {
    value: 'campus',
    labelKey: 'flow.htmlReportHeaderArtCampus',
    fallback: 'Campus',
  },
  {
    value: 'campus-talent',
    labelKey: 'flow.htmlReportHeaderArtCampusTalent',
    fallback: 'Campus · talent',
  },
  {
    value: 'campus-growth',
    labelKey: 'flow.htmlReportHeaderArtCampusGrowth',
    fallback: 'Campus · development',
  },
  {
    value: 'campus-teaching',
    labelKey: 'flow.htmlReportHeaderArtCampusTeaching',
    fallback: 'Campus · teaching',
  },
  {
    value: 'campus-data',
    labelKey: 'flow.htmlReportHeaderArtCampusData',
    fallback: 'Campus · data governance',
  },
]

export const ORDERED_OPTIONS: EnumOption[] = [
  {
    value: 'false',
    labelKey: 'flow.htmlReportListUnordered',
    fallback: 'Bulleted',
  },
  {
    value: 'true',
    labelKey: 'flow.htmlReportListOrdered',
    fallback: 'Numbered',
  },
]

export const TITLE_FIELD: DirectiveField = {
  kind: 'directive',
  path: 'title',
  labelKey: 'flow.htmlReportFieldTitle',
  fallback: 'Title',
  control: 'text',
}

export const STAT_ITEM_FIELDS: ListItemField[] = [
  {
    key: 'label',
    labelKey: 'flow.htmlReportFieldLabel',
    fallback: 'Label',
    control: 'text',
  },
  {
    key: 'value',
    labelKey: 'flow.htmlReportFieldValue',
    fallback: 'Value',
    control: 'text',
  },
  {
    key: 'change',
    labelKey: 'flow.htmlReportFieldChange',
    fallback: 'Change',
    control: 'text',
  },
  {
    key: 'trend',
    labelKey: 'flow.htmlReportFieldTrend',
    fallback: 'Trend',
    control: 'text',
    structure: { options: TREND_OPTIONS, allowLlm: true },
  },
  {
    key: 'description',
    labelKey: 'flow.htmlReportFieldDescription',
    fallback: 'Description',
    control: 'text',
  },
  {
    key: 'icon',
    labelKey: 'flow.htmlReportFieldIcon',
    fallback: 'Icon',
    control: 'text',
    structure: { options: ICON_OPTIONS },
  },
]

export const TIMELINE_ITEM_FIELDS: ListItemField[] = [
  {
    key: 'date',
    labelKey: 'flow.htmlReportFieldDate',
    fallback: 'Date',
    control: 'text',
  },
  {
    key: 'title',
    labelKey: 'flow.htmlReportFieldTitle',
    fallback: 'Title',
    control: 'text',
  },
  {
    key: 'description',
    labelKey: 'flow.htmlReportFieldDescription',
    fallback: 'Description',
    control: 'text',
  },
]
