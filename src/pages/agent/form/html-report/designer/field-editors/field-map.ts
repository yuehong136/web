/**
 * 字段映射:声明每种 Block 在 Inspector 暴露哪些可编辑叶子。
 *
 * - {@link BLOCK_FIELDS} —— 标量/结构叶子(顶层 directive 行或结构下拉)。
 * - {@link BLOCK_LIST} —— 列表型叶子(可增删的项,每项字段可挂 directive)。
 * - {@link BLOCK_STATIC_ARRAY} —— 纯结构字符串数组(列头之类,恒 static,可增删)。
 * - {@link BLOCK_BULK} —— 整段数据指令(rows/criteria,只 variable/llm)。
 *
 * chart 不在此处,字段较特殊,由 chart-shape-fields.tsx 单独处理。
 */
import type { BlockKind } from '../../types'
import {
  ICON_OPTIONS,
  LEVEL_OPTIONS,
  ORDERED_OPTIONS,
  STAT_ITEM_FIELDS,
  TIMELINE_ITEM_FIELDS,
  TITLE_FIELD,
  TREND_OPTIONS,
  VARIANT_OPTIONS,
} from './field-options'

export type ControlKind = 'text' | 'textarea'

export interface EnumOption {
  value: string
  labelKey: string
  fallback: string
}

/** 可挂 directive 的标量叶子(static / variable / llm 三态) */
export interface DirectiveField {
  kind: 'directive'
  path: string
  labelKey: string
  fallback: string
  control: ControlKind
}

/** 结构枚举叶子:默认恒 static(下拉选择) */
export interface StructureField {
  kind: 'structure'
  path: string
  labelKey: string
  fallback: string
  options: EnumOption[]
  valueType?: 'number' | 'boolean'
  /**
   * 取值由内容决定的语义枚举(标注框样式、指标卡趋势)置 true:Inspector 额外给
   * 「固定/模型」开关,模型模式下由模型在 options 里选。版式枚举(级别、列表样式)不开。
   */
  allowLlm?: boolean
}

export type FieldDescriptor = DirectiveField | StructureField

/** 列表中每项的子字段;key 为空串表示项本身是标量字符串(路径 items[i]) */
export interface ListItemField {
  key: string
  labelKey: string
  fallback: string
  control: ControlKind
  structure?: {
    options: EnumOption[]
    valueType?: 'number' | 'boolean'
    allowLlm?: boolean
  }
}

export interface ListGroup {
  arrayPath: string
  itemFields: ListItemField[]
  newItem: () => unknown
  addLabelKey: string
  addFallback: string
  itemLabelKey: string
  itemFallback: string
}

/** 纯结构字符串数组(列头),恒 static,可增删 */
export interface StaticArrayGroup {
  arrayPath: string
  labelKey: string
  fallback: string
  addLabelKey: string
  addFallback: string
}

/** 整段数据指令(rows / criteria),只支持 variable / llm */
export interface BulkField {
  path: string
  labelKey: string
  fallback: string
}

// ============================================================
// 标量/结构字段
// ============================================================

export const BLOCK_FIELDS: Record<BlockKind, FieldDescriptor[]> = {
  heading: [
    {
      kind: 'structure',
      path: 'level',
      labelKey: 'flow.htmlReportFieldLevel',
      fallback: 'Level',
      options: LEVEL_OPTIONS,
      valueType: 'number',
    },
    {
      kind: 'directive',
      path: 'content',
      labelKey: 'flow.htmlReportFieldContent',
      fallback: 'Content',
      control: 'text',
    },
  ],
  paragraph: [
    {
      kind: 'directive',
      path: 'content',
      labelKey: 'flow.htmlReportFieldContent',
      fallback: 'Content',
      control: 'textarea',
    },
  ],
  callout: [
    {
      kind: 'structure',
      path: 'variant',
      labelKey: 'flow.htmlReportFieldVariant',
      fallback: 'Style',
      options: VARIANT_OPTIONS,
      allowLlm: true,
    },
    TITLE_FIELD,
    {
      kind: 'directive',
      path: 'content',
      labelKey: 'flow.htmlReportFieldContent',
      fallback: 'Content',
      control: 'textarea',
    },
  ],
  list: [
    {
      kind: 'structure',
      path: 'ordered',
      labelKey: 'flow.htmlReportFieldOrdered',
      fallback: 'List style',
      options: ORDERED_OPTIONS,
      valueType: 'boolean',
    },
    TITLE_FIELD,
  ],
  'stat-card': [
    {
      kind: 'directive',
      path: 'label',
      labelKey: 'flow.htmlReportFieldLabel',
      fallback: 'Label',
      control: 'text',
    },
    {
      kind: 'directive',
      path: 'value',
      labelKey: 'flow.htmlReportFieldValue',
      fallback: 'Value',
      control: 'text',
    },
    {
      kind: 'directive',
      path: 'change',
      labelKey: 'flow.htmlReportFieldChange',
      fallback: 'Change',
      control: 'text',
    },
    {
      kind: 'structure',
      path: 'trend',
      labelKey: 'flow.htmlReportFieldTrend',
      fallback: 'Trend',
      options: TREND_OPTIONS,
      allowLlm: true,
    },
    {
      kind: 'directive',
      path: 'description',
      labelKey: 'flow.htmlReportFieldDescription',
      fallback: 'Description',
      control: 'text',
    },
    {
      kind: 'structure',
      path: 'icon',
      labelKey: 'flow.htmlReportFieldIcon',
      fallback: 'Icon',
      options: ICON_OPTIONS,
    },
  ],
  'stat-card-group': [],
  table: [TITLE_FIELD],
  'comparison-matrix': [TITLE_FIELD],
  timeline: [TITLE_FIELD],
  chart: [],
  // 生成区无标量叶子:Inspector 走专属 OpenRegionFields(brief 编辑),不经 BlockFields。
  'open-region': [],
}

// ============================================================
// 列表型字段
// ============================================================

export const BLOCK_LIST: Partial<Record<BlockKind, ListGroup>> = {
  list: {
    arrayPath: 'items',
    itemFields: [
      {
        key: '',
        labelKey: 'flow.htmlReportItem',
        fallback: 'Item',
        control: 'text',
      },
    ],
    newItem: () => '',
    addLabelKey: 'flow.htmlReportAddItem',
    addFallback: 'Add item',
    itemLabelKey: 'flow.htmlReportItem',
    itemFallback: 'Item',
  },
  'stat-card-group': {
    arrayPath: 'items',
    itemFields: STAT_ITEM_FIELDS,
    newItem: () => ({ label: '', value: '' }),
    addLabelKey: 'flow.htmlReportAddCard',
    addFallback: 'Add card',
    itemLabelKey: 'flow.htmlReportCard',
    itemFallback: 'Card',
  },
  timeline: {
    arrayPath: 'items',
    itemFields: TIMELINE_ITEM_FIELDS,
    newItem: () => ({ date: '', title: '' }),
    addLabelKey: 'flow.htmlReportAddItem',
    addFallback: 'Add item',
    itemLabelKey: 'flow.htmlReportItem',
    itemFallback: 'Item',
  },
}

// ============================================================
// 纯结构字符串数组 + 整段数据指令
// ============================================================

export const BLOCK_STATIC_ARRAY: Partial<Record<BlockKind, StaticArrayGroup>> =
  {
    table: {
      arrayPath: 'headers',
      labelKey: 'flow.htmlReportFieldHeaders',
      fallback: 'Columns',
      addLabelKey: 'flow.htmlReportAddColumn',
      addFallback: 'Add column',
    },
    'comparison-matrix': {
      arrayPath: 'items',
      labelKey: 'flow.htmlReportFieldCompareItems',
      fallback: 'Compared items',
      addLabelKey: 'flow.htmlReportAddColumn',
      addFallback: 'Add column',
    },
  }

export const BLOCK_BULK: Partial<Record<BlockKind, BulkField>> = {
  table: {
    path: 'rows',
    labelKey: 'flow.htmlReportFieldRows',
    fallback: 'Rows',
  },
  'comparison-matrix': {
    path: 'criteria',
    labelKey: 'flow.htmlReportFieldCriteria',
    fallback: 'Criteria',
  },
}
