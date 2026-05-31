/**
 * 轻量模型下拉。**刻意不 portal 到 body**:AI 对话框处在 Designer 的 Radix 模态
 * Sheet 内,body 被设为 pointer-events:none 且被 react-remove-scroll 锁滚动;portal
 * 到 body 的下拉(共用 ui/select)会点不动、滚不了。就地 absolute 渲染,留在 Sheet
 * 子树内即可正常交互与滚动。
 */
import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

export interface ModelOption {
  label: string
  value: string
}

interface ModelSelectProps {
  value: string
  options: ModelOption[]
  disabled?: boolean
  placeholder?: string
  onChange: (value: string) => void
}

export function ModelSelect({
  value,
  options,
  disabled,
  placeholder,
  onChange,
}: ModelSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="gap-space-xs rounded-radius-md px-space-sm flex h-9 w-full items-center justify-between border border-components-input-border bg-components-input-bg text-sm text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={cn('truncate', !selected && 'text-text-tertiary')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'size-icon-sm shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && options.length > 0 && (
        <div className="mt-space-2xs p-space-2xs rounded-radius-md shadow-elevation-medium absolute left-0 right-0 top-full z-30 max-h-60 overflow-auto border border-components-dropdown-border bg-components-dropdown-bg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className="rounded-radius-sm px-space-sm py-space-xs gap-space-sm flex w-full items-center justify-between text-left text-sm text-text-primary hover:bg-state-hover"
            >
              <span className="truncate">{opt.label}</span>
              {opt.value === value && (
                <Check className="size-icon-sm shrink-0 text-text-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
