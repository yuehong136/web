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
      <label className="mb-1 block text-xs text-text-secondary">{label}</label>
      <div className="flex items-center space-x-3">
        <div
          className="rounded-radius-full relative h-2 flex-1 bg-components-slider-track"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={clamped}
          aria-label={label}
        >
          <div
            className="rounded-radius-full h-full bg-components-slider-range"
            style={{ width: percentWidth }}
          />
        </div>
        <div className="rounded-radius-md px-space-xs py-space-xs w-16 border border-border-default text-center text-xs text-text-secondary">
          {percentLabel}
        </div>
      </div>
      <div className="mt-1 text-xs text-text-tertiary">{hint}</div>
    </div>
  )
}
