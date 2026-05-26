/** Inspector 字段编辑器共用的小部件:标签行、静态值控件、结构下拉、三态切换。 */
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
import { cn } from '@/lib/utils'
import type { ControlKind, EnumOption } from './field-map'
import type { FieldMode } from '../../types'

export function InspectorHeading({ text }: { text: string }) {
  return <h3 className="text-sm font-semibold text-text-primary">{text}</h3>
}

export function InspectorField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-space-xs">
      <Label className="text-xs text-text-secondary">{label}</Label>
      {children}
    </div>
  )
}

export function EmptyHint({ text }: { text: string }) {
  return <p className="p-space-base text-text-caption text-sm">{text}</p>
}

/** 静态值控件:单行 text 或多行 textarea */
export function ValueControl({
  control,
  value,
  placeholder,
  onChange,
}: {
  control: ControlKind
  value: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  if (control === 'textarea') {
    return (
      <Textarea
        rows={3}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }
  return (
    <Input
      inputSize="sm"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

/** 结构枚举下拉(恒 static) */
export function StructureSelect({
  value,
  options,
  onChange,
}: {
  value: string
  options: EnumOption[]
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      {/* portal 到 body 的下拉会继承模态 Sheet 的 pointer-events:none,
          点击会穿透到背后字段,显式恢复指针事件 */}
      <SelectContent className="pointer-events-auto">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-xs">
            {t(opt.labelKey, opt.fallback)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

const MODE_LABELS: Record<FieldMode, { labelKey: string; fallback: string }> = {
  static: { labelKey: 'flow.htmlReportModeStatic', fallback: 'Fixed' },
  variable: { labelKey: 'flow.htmlReportModeVariable', fallback: 'Variable' },
  llm: { labelKey: 'flow.htmlReportModeLlm', fallback: 'Model' },
}

/** static / variable / llm 分段切换 */
export function ModeSwitch({
  value,
  modes,
  onChange,
}: {
  value: FieldMode
  modes: FieldMode[]
  onChange: (mode: FieldMode) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="gap-space-2xs bg-surface-secondary rounded-radius-md p-space-2xs inline-flex border border-border-subtle">
      {modes.map((mode) => {
        const active = mode === value
        const label = MODE_LABELS[mode]
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={cn(
              'rounded-radius-sm px-space-sm py-space-2xs text-xs transition-colors',
              active
                ? 'bg-surface-primary shadow-elevation-low text-text-primary'
                : 'text-text-secondary hover:text-text-primary',
            )}
          >
            {t(label.labelKey, label.fallback)}
          </button>
        )
      })}
    </div>
  )
}
