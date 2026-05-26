/**
 * Designer 右栏:按选中目标渲染属性/字段编辑器。
 * - none / theme → 报告级(标题、副标题、主色)
 * - section      → 小节属性
 * - block        → 块标题 + 字段编辑(chart 走形状编辑器)+ 块级注解
 */
import { useTranslation } from 'react-i18next'
import { Textarea } from '@/components/ui/textarea'
import { ANNOTATABLE_BLOCKS, blockDisplayLabel } from './block-meta'
import { BlockFields } from './field-editors/block-fields'
import { ChartShapeFields } from './field-editors/chart-shape-fields'
import {
  EmptyHint,
  InspectorField,
  InspectorHeading,
} from './field-editors/field-primitives'
import { ReportFields } from './field-editors/report-fields'
import { SectionFields } from './field-editors/section-fields'
import type { DraftAction, DraftState } from './use-skeleton-draft'

interface InspectorProps {
  state: DraftState
  dispatch: React.Dispatch<DraftAction>
}

export function Inspector({ state, dispatch }: InspectorProps) {
  const { t } = useTranslation()
  const { selection, present } = state

  if (selection.kind === 'section') {
    const section = present.sections.find((s) => s.id === selection.sectionId)
    if (!section)
      return (
        <EmptyHint
          text={t('flow.htmlReportInspectorNone', 'Select an item to edit')}
        />
      )
    return <SectionFields section={section} dispatch={dispatch} />
  }

  if (selection.kind === 'block') {
    const section = present.sections.find((s) => s.id === selection.sectionId)
    const block = section?.blocks.find((b) => b.id === selection.blockId)
    if (!block)
      return (
        <EmptyHint
          text={t('flow.htmlReportInspectorNone', 'Select an item to edit')}
        />
      )
    const label = blockDisplayLabel(block)
    return (
      <div className="space-y-space-md p-space-base">
        <InspectorHeading text={t(label.labelKey, label.fallback)} />
        {block.type === 'chart' ? (
          <ChartShapeFields
            block={block}
            sectionId={selection.sectionId}
            dispatch={dispatch}
          />
        ) : (
          <BlockFields
            block={block}
            sectionId={selection.sectionId}
            dispatch={dispatch}
          />
        )}
        {ANNOTATABLE_BLOCKS.has(block.type) && (
          <InspectorField
            label={t('flow.htmlReportAnnotation', 'Annotation (for the model)')}
          >
            <Textarea
              rows={3}
              value={block.annotation ?? ''}
              onChange={(e) =>
                dispatch({
                  type: 'setBlockAnnotation',
                  sectionId: selection.sectionId,
                  blockId: block.id,
                  value: e.target.value,
                })
              }
            />
          </InspectorField>
        )}
      </div>
    )
  }

  return <ReportFields present={present} dispatch={dispatch} />
}
