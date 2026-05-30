/** 小节属性:标题(固定 / 模型)/ 副标题 / 段落语义注解(作用于该小节内所有 llm 字段)。 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { FieldMode, LayoutType, SkeletonSection } from '../../types'
import { LAYOUT_LABEL } from '../block-meta'
import type { DraftAction } from '../use-skeleton-draft'
import {
  InspectorField,
  InspectorHeading,
  ModeSwitch,
} from './field-primitives'

interface SectionFieldsProps {
  section: SkeletonSection
  dispatch: React.Dispatch<DraftAction>
}

// 小节标题只暴露「固定 / 模型」两态(同报告标题),不含 variable。
const TITLE_MODES: FieldMode[] = ['static', 'llm']

export function SectionFields({ section, dispatch }: SectionFieldsProps) {
  const { t } = useTranslation()
  const setField = (key: 'title' | 'subtitle' | 'annotation', value: string) =>
    dispatch({ type: 'setSectionField', sectionId: section.id, key, value })
  const titleMode: FieldMode =
    section.titleDirective?.mode === 'llm' ? 'llm' : 'static'

  return (
    <div className="space-y-space-md p-space-base">
      <InspectorHeading
        text={t('flow.htmlReportSectionSettings', 'Section settings')}
      />
      <InspectorField label={t('flow.htmlReportSectionLayout', 'Layout')}>
        <Select
          value={section.layout}
          onValueChange={(value) =>
            dispatch({
              type: 'setSectionLayout',
              sectionId: section.id,
              layout: value as LayoutType,
            })
          }
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue />
          </SelectTrigger>
          {/* 同 StructureSelect:恢复指针事件,避免模态 Sheet 下点击穿透 */}
          <SelectContent className="pointer-events-auto">
            {Object.entries(LAYOUT_LABEL).map(([value, label]) => (
              <SelectItem key={value} value={value} className="text-xs">
                {t(label.labelKey, label.fallback)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </InspectorField>
      <div className="space-y-space-xs">
        <div className="gap-space-sm flex items-center justify-between">
          <Label className="text-xs text-text-secondary">
            {t('flow.htmlReportSectionTitle', 'Section title')}
          </Label>
          <ModeSwitch
            value={titleMode}
            modes={TITLE_MODES}
            onChange={(mode) =>
              dispatch({
                type: 'setSectionTitleDirective',
                sectionId: section.id,
                directive:
                  mode === 'llm'
                    ? { mode: 'llm', hint: section.titleDirective?.hint ?? '' }
                    : null,
              })
            }
          />
        </div>
        {titleMode === 'static' ? (
          <Input
            inputSize="sm"
            value={section.title ?? ''}
            onChange={(e) => setField('title', e.target.value)}
          />
        ) : (
          <Textarea
            rows={2}
            value={section.titleDirective?.hint ?? ''}
            placeholder={t(
              'flow.htmlReportTitleLlmPlaceholder',
              'Describe the title the model should generate',
            )}
            onChange={(e) =>
              dispatch({
                type: 'setSectionTitleDirective',
                sectionId: section.id,
                directive: { mode: 'llm', hint: e.target.value },
              })
            }
          />
        )}
      </div>
      <InspectorField
        label={t('flow.htmlReportSectionSubtitle', 'Section subtitle')}
      >
        <Input
          inputSize="sm"
          value={section.subtitle ?? ''}
          onChange={(e) => setField('subtitle', e.target.value)}
        />
      </InspectorField>
      <InspectorField
        label={t('flow.htmlReportAnnotation', 'Annotation (for the model)')}
      >
        <Textarea
          rows={3}
          value={section.annotation ?? ''}
          onChange={(e) => setField('annotation', e.target.value)}
        />
      </InspectorField>
    </div>
  )
}
