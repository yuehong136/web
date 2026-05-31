/** 报告级属性(空选 / 主题时显示):报告标题(固定 / 模型)。 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FieldMode, SkeletonSchema } from '../../types'
import type { DraftAction } from '../use-skeleton-draft'
import { InspectorHeading, ModeSwitch } from './field-primitives'

interface ReportFieldsProps {
  present: SkeletonSchema
  dispatch: React.Dispatch<DraftAction>
}

// 标题只暴露「固定 / 模型」两态(同字段),不含 variable。
const TITLE_MODES: FieldMode[] = ['static', 'llm']

export function ReportFields({ present, dispatch }: ReportFieldsProps) {
  const { t } = useTranslation()
  const titleMode: FieldMode =
    present.titleDirective?.mode === 'llm' ? 'llm' : 'static'

  return (
    <div className="space-y-space-md p-space-base">
      <InspectorHeading
        text={t('flow.htmlReportReportSettings', 'Report settings')}
      />
      <div className="space-y-space-xs">
        <div className="gap-space-sm flex items-center justify-between">
          <Label className="text-xs text-text-secondary">
            {t('flow.htmlReportTitle', 'Report title')}
          </Label>
          <ModeSwitch
            value={titleMode}
            modes={TITLE_MODES}
            onChange={(mode) => {
              // 切到「固定」时保留已输入的模型提示词(mode:'static' 与无指令同义,hint 仅
              // 留待切回模型时回填),避免 固定↔模型 来回切丢内容;无提示词则照常清空。
              const hint = present.titleDirective?.hint ?? ''
              dispatch({
                type: 'setTitleDirective',
                directive: mode === 'llm' || hint ? { mode, hint } : null,
              })
            }}
          />
        </div>
        {titleMode === 'static' ? (
          <Input
            inputSize="sm"
            value={present.title}
            onChange={(e) =>
              dispatch({
                type: 'setReportField',
                key: 'title',
                value: e.target.value,
              })
            }
          />
        ) : (
          <Textarea
            rows={2}
            value={present.titleDirective?.hint ?? ''}
            placeholder={t(
              'flow.htmlReportTitleLlmPlaceholder',
              'Describe the title the model should generate',
            )}
            onChange={(e) =>
              dispatch({
                type: 'setTitleDirective',
                directive: { mode: 'llm', hint: e.target.value },
              })
            }
          />
        )}
      </div>
    </div>
  )
}
