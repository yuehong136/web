import type { ReactNode } from 'react'
import { TagEditor, Tooltip } from '@/components/ui'

interface ChunkEditTagSectionProps {
  icon: ReactNode
  label: string
  tooltip: string
  value: string[]
  onChange: (value: string[]) => void
  placeholder: string
  variant: 'info' | 'warning'
}

export const ChunkEditTagSection = ({
  icon,
  label,
  tooltip,
  value,
  onChange,
  placeholder,
  variant,
}: ChunkEditTagSectionProps) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2">
      {icon}
      <span className="block text-sm font-medium text-fg-muted">{label}</span>
      <Tooltip content={tooltip}>
        <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-line text-xs text-fg-subtle">
          ?
        </span>
      </Tooltip>
    </div>
    <div className="rounded-lg border border-line bg-sunken p-3">
      <TagEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        variant={variant}
      />
    </div>
  </div>
)
