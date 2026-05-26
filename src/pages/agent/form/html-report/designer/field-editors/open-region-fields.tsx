/**
 * 生成区编辑器:一段 brief(存于 block.annotation),描述这块讲报告中哪部分内容 +
 * 用什么组件/数量。模型在运行时(试运行/工作流)按 brief 展开成真块,故此处不编辑任何固定字段。
 */
import { useTranslation } from 'react-i18next'
import { Textarea } from '@/components/ui/textarea'
import { InspectorField } from './field-primitives'
import type { DraftAction } from '../use-skeleton-draft'
import type { SkeletonBlock } from '../../types'

interface OpenRegionFieldsProps {
  block: SkeletonBlock
  sectionId: string
  dispatch: React.Dispatch<DraftAction>
}

export function OpenRegionFields({
  block,
  sectionId,
  dispatch,
}: OpenRegionFieldsProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-space-xs">
      <InspectorField
        label={t('flow.htmlReportOpenRegionBrief', 'Generation brief')}
      >
        <Textarea
          rows={5}
          value={block.annotation ?? ''}
          placeholder={t(
            'flow.htmlReportOpenRegionBriefPlaceholder',
            'Describe what this area covers and which components to use…',
          )}
          onChange={(e) =>
            dispatch({
              type: 'setBlockAnnotation',
              sectionId,
              blockId: block.id,
              value: e.target.value,
            })
          }
        />
      </InspectorField>
      <p className="text-text-caption text-xs leading-relaxed">
        {t(
          'flow.htmlReportOpenRegionHelp',
          'The model builds this region at run time from your brief — e.g. "Three charts, you pick the type" or "First a paragraph, then a pie chart".',
        )}
      </p>
    </div>
  )
}
