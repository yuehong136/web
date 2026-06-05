/** 报告级属性(空选 / 主题时显示):报告标题(固定 / 模型)。 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { FieldMode, SkeletonSchema } from '../../types'
import type { DraftAction } from '../use-skeleton-draft'
import { HEADER_ART_OPTIONS } from './field-options'
import {
  InspectorHeading,
  ModeSwitch,
  StructureSelect,
} from './field-primitives'

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
  // 头图:undefined/'' 一律视为「无」哨兵 'none';排布固定图文卡(渲染器缺省即 card)
  const headerArt =
    present.headerArt && present.headerArt !== 'none'
      ? present.headerArt
      : 'none'

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

      {/* Hero 顶部装饰:eyebrow 小标 + 副标题,皆静态可选(留空则渲染时优雅省略) */}
      <div className="space-y-space-xs">
        <Label className="text-xs text-text-secondary">
          {t('flow.htmlReportEyebrow', 'Eyebrow')}
        </Label>
        <Input
          inputSize="sm"
          value={present.eyebrow ?? ''}
          placeholder={t(
            'flow.htmlReportEyebrowPlaceholder',
            'e.g. 2025 Annual Report',
          )}
          onChange={(e) =>
            dispatch({
              type: 'setReportField',
              key: 'eyebrow',
              value: e.target.value,
            })
          }
        />
      </div>
      <div className="space-y-space-xs">
        <Label className="text-xs text-text-secondary">
          {t('flow.htmlReportSubtitle', 'Subtitle')}
        </Label>
        <Input
          inputSize="sm"
          value={present.subtitle ?? ''}
          placeholder={t(
            'flow.htmlReportSubtitlePlaceholder',
            'One-line summary under the title',
          )}
          onChange={(e) =>
            dispatch({
              type: 'setReportField',
              key: 'subtitle',
              value: e.target.value,
            })
          }
        />
      </div>

      {/* Hero 头图:手选素材;默认「无」= 纯文字 Hero,选图即用图文卡排布 */}
      <div className="space-y-space-xs">
        <Label className="text-xs text-text-secondary">
          {t('flow.htmlReportHeaderArt', 'Header image')}
        </Label>
        <StructureSelect
          value={headerArt}
          options={HEADER_ART_OPTIONS}
          onChange={(value) =>
            dispatch({ type: 'setReportField', key: 'headerArt', value })
          }
        />
      </div>
    </div>
  )
}
