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
