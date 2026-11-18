import React from 'react'

interface ReadonlyWeightBarProps {
  label: string
  value: number
  hint: string
}

const clampPercent = (value: number): number => {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export const ReadonlyWeightBar: React.FC<ReadonlyWeightBarProps> = ({
  label,
  value,
  hint,
}) => {
  const clamped = clampPercent(value)
  const percentLabel = clamped.toFixed(2)
  const percentWidth = `${(clamped * 100).toFixed(0)}%`

  return (
    <div>
      <label className="mb-1 block text-xs text-fg-muted">{label}</label>
      <div className="flex items-center space-x-3">
        <div
          className="relative h-2 flex-1 rounded-radius-full bg-fill-pressed"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={clamped}
          aria-label={label}
        >
          <div
            className="h-full rounded-radius-full bg-accent-solid"
            style={{ width: percentWidth }}
          />
        </div>
        <div className="w-16 rounded-radius-md border border-line px-space-xs py-space-xs text-center text-xs text-fg-muted">
          {percentLabel}
        </div>
      </div>
      <div className="mt-1 text-xs text-fg-subtle">{hint}</div>
    </div>
  )
}
