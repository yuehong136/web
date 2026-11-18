import type { ReactNode } from 'react'
import {
  MODEL_CAPABILITY_ICONS,
  MODEL_CAPABILITY_TONES,
  type ModelCapabilityKind,
} from '@/components/models/model-capabilities'
import { cn } from '@/lib/utils'

/**
 * One default-model slot: a capability-coloured icon tile, the label and its
 * hint, and the model selector. Slots that need attention (nothing chosen,
 * or the saved model is gone) take the warning tone with the reason.
 */
export function DefaultModelRow({
  kind,
  label,
  hint,
  attention,
  children,
}: {
  kind: ModelCapabilityKind
  label: ReactNode
  hint: string
  attention: boolean
  /** The selector. */
  children: ReactNode
}) {
  const Icon = MODEL_CAPABILITY_ICONS[kind]
  return (
    <div
      data-slot="default-model-row"
      data-attention={attention || undefined}
      className={cn(
        'flex min-w-0 flex-wrap items-center gap-x-space-md gap-y-space-sm rounded-radius-lg border px-space-sm py-space-sm',
        attention
          ? 'border-warning-line bg-warning-soft'
          : 'border-transparent',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-radius-md [&_svg]:size-icon-sm',
          attention
            ? 'bg-warning-soft-hover text-warning-fg'
            : MODEL_CAPABILITY_TONES[kind],
        )}
      >
        <Icon strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-1 basis-40 flex-col">
        <span className="text-sm font-medium text-fg">{label}</span>
        <span
          title={hint}
          className={cn(
            'text-xs',
            // The reason a slot needs attention is never cut off.
            attention ? 'text-warning-fg' : 'truncate text-fg-subtle',
          )}
        >
          {hint}
        </span>
      </div>
      <div className="w-full min-w-0 sm:w-80">{children}</div>
    </div>
  )
}
