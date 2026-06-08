/**
 * 枚举字段编辑器。两种枚举共用此组件:
 *  - 版式枚举(标题级别、列表样式):恒固定,只渲染下拉。
 *  - 内容衍生的语义枚举(标注框样式、指标卡趋势,allowLlm):额外给「固定/模型」开关。
 *    固定 → 下拉选值写入 block.fields;模型 → 留 llm 指令(可选 hint),填充时由模型
 *    在候选值里选。与 field-directive-row 同源,复用 setFieldValue / setFieldDirective。
 */
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getFieldValue, resolveDirective } from '../../skeleton-utils'
import type { FieldMode, SkeletonBlock } from '../../types'
import type { DraftAction } from '../use-skeleton-draft'
import type { EnumOption } from './field-map'
import { InspectorField, ModeSwitch, StructureSelect } from './field-primitives'

// 枚举只暴露「固定」「模型」两态(variable 留给标量字段,见 field-directive-row)。
const ENUM_MODES: FieldMode[] = ['static', 'llm']

interface EnumFieldProps {
  block: SkeletonBlock
  sectionId: string
  path: string
  label: string
  options: EnumOption[]
  valueType?: 'number' | 'boolean'
  allowLlm?: boolean
  dispatch: React.Dispatch<DraftAction>
}

export function EnumField({
  block,
  sectionId,
  path,
  label,
  options,
  valueType,
  allowLlm,
  dispatch,
}: EnumFieldProps) {
  const { t } = useTranslation()
  const blockId = block.id
  const current = getFieldValue(block.fields ?? {}, path) ?? options[0]?.value

  const select = (
    <StructureSelect
      value={String(current)}
      options={options}
      onChange={(raw) =>
        dispatch({
          type: 'setFieldValue',
          sectionId,
          blockId,
          path,
          value:
            valueType === 'number'
              ? Number(raw)
              : valueType === 'boolean'
                ? raw === 'true'
                : raw,
        })
      }
    />
  )

  // 版式枚举:纯下拉,无模型开关(行为同改造前)。
  if (!allowLlm) {
    return <InspectorField label={label}>{select}</InspectorField>
  }

  const directive = resolveDirective(block, path)
  const mode: FieldMode = directive.mode === 'llm' ? 'llm' : 'static'
  const onMode = (next: FieldMode) =>
    dispatch({
      type: 'setFieldDirective',
      sectionId,
      blockId,
      path,
      directive:
        next === 'llm' ? { mode: 'llm', hint: directive.hint ?? '' } : null,
    })

  return (
    <div className="space-y-space-xs">
      <div className="gap-space-sm flex items-center justify-between">
        <Label className="text-xs text-text-secondary">{label}</Label>
        <ModeSwitch value={mode} modes={ENUM_MODES} onChange={onMode} />
      </div>
      {mode === 'static' ? (
        select
      ) : (
        <>
          <p className="text-text-caption text-xs">
            {t('flow.htmlReportEnumModelHint', 'Model picks one of:')}{' '}
            {options.map((opt) => t(opt.labelKey, opt.fallback)).join(' / ')}
          </p>
          <Textarea
            rows={2}
            value={directive.hint ?? ''}
            placeholder={t(
              'flow.htmlReportEnumLlmPlaceholder',
              'Optional: when to use which',
            )}
            onChange={(e) =>
              dispatch({
                type: 'setFieldDirective',
                sectionId,
                blockId,
                path,
                directive: { mode: 'llm', hint: e.target.value },
              })
            }
          />
        </>
      )}
    </div>
  )
}
