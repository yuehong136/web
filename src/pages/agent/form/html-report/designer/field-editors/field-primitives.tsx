/** Inspector 字段编辑器共用的小部件:标签行、静态值控件、结构下拉、三态切换。 */
import { useEffect } from 'react'
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
/**
 * 模态(Designer 全屏 Sheet)用 react-remove-scroll 锁滚动,会在 document 上 preventDefault
 * 那些「不在锁定容器内」的滚轮;而本下拉 SelectContent 是 portal 到 body 的,正好落在容器外,
 * 滚轮被吃掉(只能拖滚动条)。不动共享 select.tsx 的前提下,在 feature 侧用 window 捕获阶段的
 * 滚轮兜底:抢在 scroll-lock 之前,对带标记类的下拉自管 scrollTop。仅装一次,只作用于本类。
 */
const WHEELABLE_CLASS = 'rpt-wheel-scroll'
let wheelPatchInstalled = false
function installSelectWheelPatch(): void {
  if (wheelPatchInstalled || typeof window === 'undefined') return
  wheelPatchInstalled = true
  window.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      const target = e.target as Element | null
      const el = target?.closest?.(`.${WHEELABLE_CLASS}`) as HTMLElement | null
      if (!el) return // 非本类下拉:放行,不干预 scroll-lock 的正常行为
      // 行/页模式归一到像素,避免 Firefox 行模式一格只滚几像素
      const factor =
        e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1
      el.scrollTop += e.deltaY * factor
      e.stopPropagation() // 抢在 document 上的 scroll-lock 监听之前截断
      e.preventDefault() // 自管滚动,禁掉原生默认以免双重滚动
    },
    { capture: true, passive: false },
  )
}

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
  useEffect(() => {
    installSelectWheelPatch()
  }, [])
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 text-xs">
        <SelectValue />
      </SelectTrigger>
      {/* portal 到 body 的下拉会继承模态 Sheet 的 pointer-events:none,
          点击会穿透到背后字段,显式恢复指针事件;rpt-wheel-scroll 标记供上面的滚轮兜底识别 */}
      <SelectContent className={`pointer-events-auto ${WHEELABLE_CLASS}`}>
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
    <div className="gap-space-2xs rounded-radius-md p-space-2xs inline-flex border border-border-subtle bg-background-subtle">
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
                ? 'shadow-elevation-low bg-background-surface text-text-primary'
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
