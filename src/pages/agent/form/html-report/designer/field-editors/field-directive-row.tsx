/**
 * 单个叶子字段的编辑行:标签 + static/variable/llm 切换 + 对应控件。
 * - static  → 静态值控件,写入 block.fields(setFieldValue)
 * - variable→ 上游引用输入,写入 directive.ref(setFieldDirective)
 * - llm     → 自然语言提示,写入 directive.hint(setFieldDirective)
 * 与 merge 同源:复用 skeleton-utils 的 resolveDirective / getFieldValue。
 */
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getFieldValue, resolveDirective } from '../../skeleton-utils'
import type { FieldMode, SkeletonBlock } from '../../types'
import type { DraftAction } from '../use-skeleton-draft'
import type { ControlKind } from './field-map'
import { ModeSwitch, ValueControl } from './field-primitives'

// 变量引用(variable)暂时隐藏:只暴露「固定」「模型」两种,降低上手复杂度。
// FieldDirective 数据模型仍保留 variable,Phase 4 接上游变量时再放开即可。
const ALL_MODES: FieldMode[] = ['static', 'llm']

interface FieldDirectiveRowProps {
  block: SkeletonBlock
  sectionId: string
  path: string
  label: string
  control?: ControlKind
  /** 限定可选模式(整段数据字段传 ['variable','llm']) */
  modes?: FieldMode[]
  dispatch: React.Dispatch<DraftAction>
}

export function FieldDirectiveRow({
  block,
  sectionId,
  path,
  label,
  control = 'text',
  modes = ALL_MODES,
  dispatch,
}: FieldDirectiveRowProps) {
  const { t } = useTranslation()
  const blockId = block.id
  const directive = resolveDirective(block, path)
  // 整段数据字段无 static UI:directive 缺省时按首个可选模式显示
  const mode: FieldMode = modes.includes(directive.mode)
    ? directive.mode
    : modes[0]

  const onMode = (next: FieldMode) => {
    if (next === 'static') {
      dispatch({
        type: 'setFieldDirective',
        sectionId,
        blockId,
        path,
        directive: null,
      })
    } else if (next === 'variable') {
      dispatch({
        type: 'setFieldDirective',
        sectionId,
        blockId,
        path,
        directive: { mode: 'variable', ref: directive.ref ?? '' },
      })
    } else {
      dispatch({
        type: 'setFieldDirective',
        sectionId,
        blockId,
        path,
        directive: { mode: 'llm', hint: directive.hint ?? '' },
      })
    }
  }

  return (
    <div className="space-y-space-xs">
      <div className="gap-space-sm flex items-center justify-between">
        <Label className="text-xs text-text-secondary">{label}</Label>
        {modes.length > 1 && (
          <ModeSwitch value={mode} modes={modes} onChange={onMode} />
        )}
      </div>

      {mode === 'static' && (
        <ValueControl
          control={control}
          value={String(getFieldValue(block.fields ?? {}, path) ?? '')}
          onChange={(value) =>
            dispatch({ type: 'setFieldValue', sectionId, blockId, path, value })
          }
        />
      )}

      {mode === 'variable' && (
        <Input
          inputSize="sm"
          value={directive.ref ?? ''}
          placeholder={t(
            'flow.htmlReportVariablePlaceholder',
            '{{ node.output.field }}',
          )}
          onChange={(e) =>
            dispatch({
              type: 'setFieldDirective',
              sectionId,
              blockId,
              path,
              directive: { mode: 'variable', ref: e.target.value },
            })
          }
        />
      )}

      {mode === 'llm' && (
        <Textarea
          rows={2}
          value={directive.hint ?? ''}
          placeholder={t(
            'flow.htmlReportLlmPlaceholder',
            'Describe what the model should produce',
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
      )}
    </div>
  )
}
