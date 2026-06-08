/**
 * 图表 Block 的字段编辑区:图表类型(切换会按新形状重建)+ 标题 + 形状键(全 static,
 * 描述数据的字段名)+ 整段 data(默认 llm,模型按形状填行)。决策 #24。
 */
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { getFieldValue } from '../../skeleton-utils'
import type { ChartBlock, ChartType, SkeletonBlock } from '../../types'
import { CHART_LABEL } from '../block-meta'
import { buildChartFields } from '../block-defaults'
import type { DraftAction } from '../use-skeleton-draft'
import { FieldDirectiveRow } from './field-directive-row'
import type { EnumOption } from './field-map'
import {
  InspectorField,
  StructureSelect,
  ValueControl,
} from './field-primitives'

const PROPORTION: ReadonlySet<ChartType> = new Set(['pie', 'donut', 'funnel'])

interface ShapeField {
  path: string
  labelKey: string
  fallback: string
}

function shapeFields(chartType: ChartType): ShapeField[] {
  if (PROPORTION.has(chartType)) {
    return [
      {
        path: 'nameKey',
        labelKey: 'flow.htmlReportFieldNameKey',
        fallback: 'Name key',
      },
      {
        path: 'valueKey',
        labelKey: 'flow.htmlReportFieldValueKey',
        fallback: 'Value key',
      },
    ]
  }
  if (chartType === 'radar') {
    return [
      {
        path: 'radarKeys[0]',
        labelKey: 'flow.htmlReportFieldDimensionKey',
        fallback: 'Dimension key',
      },
      {
        path: 'series[0].dataKey',
        labelKey: 'flow.htmlReportFieldSeriesKey',
        fallback: 'Series key',
      },
    ]
  }
  if (chartType === 'scatter') {
    return [
      {
        path: 'series[0].xKey',
        labelKey: 'flow.htmlReportFieldXKey',
        fallback: 'X key',
      },
      {
        path: 'series[0].yKey',
        labelKey: 'flow.htmlReportFieldYKey',
        fallback: 'Y key',
      },
    ]
  }
  return [
    {
      path: 'xAxisKey',
      labelKey: 'flow.htmlReportFieldXAxis',
      fallback: 'X axis key',
    },
    {
      path: 'series[0].dataKey',
      labelKey: 'flow.htmlReportFieldSeriesKey',
      fallback: 'Series key',
    },
    {
      path: 'series[0].name',
      labelKey: 'flow.htmlReportFieldSeriesName',
      fallback: 'Series name',
    },
  ]
}

const CHART_TYPE_OPTIONS: EnumOption[] = (
  Object.keys(CHART_LABEL) as ChartType[]
).map((type) => ({
  value: type,
  labelKey: CHART_LABEL[type].labelKey,
  fallback: CHART_LABEL[type].fallback,
}))

interface ChartShapeFieldsProps {
  block: SkeletonBlock
  sectionId: string
  dispatch: React.Dispatch<DraftAction>
}

export function ChartShapeFields({
  block,
  sectionId,
  dispatch,
}: ChartShapeFieldsProps) {
  const { t } = useTranslation()
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const fields = (block.fields ?? {}) as Partial<ChartBlock>
  const chartType = fields.chartType ?? 'bar'

  const onChartType = (raw: string) => {
    const nextType = raw as ChartType
    const nextFields = buildChartFields(nextType) as Record<string, unknown>
    if (fields.title) nextFields.title = fields.title
    const replacement: SkeletonBlock = {
      ...block,
      fields: nextFields,
      fieldDirectives: {
        ...(block.fieldDirectives ?? {}),
        data: block.fieldDirectives?.data ?? { mode: 'llm' },
      },
    }
    dispatch({
      type: 'replaceBlock',
      sectionId,
      blockId: block.id,
      block: replacement,
    })
  }

  return (
    <div className="space-y-space-md">
      <InspectorField label={t('flow.htmlReportFieldChartType', 'Chart type')}>
        <StructureSelect
          value={chartType}
          options={CHART_TYPE_OPTIONS}
          onChange={onChartType}
        />
      </InspectorField>

      <FieldDirectiveRow
        block={block}
        sectionId={sectionId}
        path="title"
        label={t('flow.htmlReportFieldTitle', 'Title')}
        control="text"
        dispatch={dispatch}
      />

      <InspectorField label={t('flow.htmlReportFieldData', 'Data')}>
        <p className="text-text-caption text-xs leading-relaxed">
          {t(
            'flow.htmlReportBulkModelFilled',
            'Filled by the model, guided by the annotation below.',
          )}
        </p>
      </InspectorField>

      {/* 形状键是连接数据与图表轴的内部字段名,有默认值、报告里不显示;收进高级,默认收起。 */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="gap-space-2xs flex items-center text-xs text-text-secondary hover:text-text-primary">
          {advancedOpen ? (
            <ChevronDown className="size-icon-sm" />
          ) : (
            <ChevronRight className="size-icon-sm" />
          )}
          {t('flow.htmlReportChartAdvanced', 'Advanced · data field keys')}
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-space-md pt-space-sm">
          <p className="text-text-caption text-xs">
            {t(
              'flow.htmlReportChartShapeHint',
              'These keys name the data fields; the model fills the data using them.',
            )}
          </p>
          {shapeFields(chartType).map((field) => (
            <InspectorField
              key={field.path}
              label={t(field.labelKey, field.fallback)}
            >
              <ValueControl
                control="text"
                value={String(
                  getFieldValue(block.fields ?? {}, field.path) ?? '',
                )}
                onChange={(value) =>
                  dispatch({
                    type: 'setFieldValue',
                    sectionId,
                    blockId: block.id,
                    path: field.path,
                    value,
                  })
                }
              />
            </InspectorField>
          ))}
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
