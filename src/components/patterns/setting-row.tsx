import { useId, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface SettingSectionProps {
  title?: ReactNode
  description?: ReactNode
  /** Trailing header control, e.g. "Add provider". */
  actions?: ReactNode
  /** `SettingRow`s. */
  children: ReactNode
  className?: string
}

/** A titled group of `SettingRow`s inside `SettingsTemplate`. */
export function SettingSection({
  title,
  description,
  actions,
  children,
  className,
}: SettingSectionProps) {
  const headingId = useId()
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      data-slot="setting-section"
      className={cn('mt-space-lg first:mt-0', className)}
    >
      {title || actions ? (
        <div className="mb-space-xs flex items-end gap-space-sm">
          <div className="min-w-0 flex-1">
            {title ? (
              <h3 id={headingId} className="text-sm font-semibold text-fg">
                {title}
              </h3>
            ) : null}
            {description ? (
              <p className="text-xs text-fg-muted">{description}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-space-sm">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex flex-col">{children}</div>
    </section>
  )
}

export interface SettingRowProps {
  label: ReactNode
  description?: ReactNode
  /** `warning`/`error` tint the description (e.g. "Not set: OCR disabled"). */
  tone?: 'default' | 'warning' | 'error'
  /** Avatar or provider icon before the label. */
  leading?: ReactNode
  /** Associates the label with the control's id. */
  htmlFor?: string
  /** The control: select, switch, button… Keep it about 260px wide. */
  children?: ReactNode
  className?: string
}

const TONES = {
  default: 'text-fg-muted',
  warning: 'text-warning-fg',
  error: 'text-danger-fg',
} as const

/**
 * One setting per line: label and help on the left, the control on the right,
 * separated by hairlines. Stacks the control under the label on phones.
 */
export function SettingRow({
  label,
  description,
  tone = 'default',
  leading,
  htmlFor,
  children,
  className,
}: SettingRowProps) {
  const labelClass = 'block text-sm font-medium text-fg'
  return (
    <div
      data-slot="setting-row"
      className={cn(
        'flex min-h-14 flex-wrap items-center gap-x-space-md gap-y-space-sm border-t border-line-subtle py-space-sm',
        className,
      )}
    >
      {leading ? <div className="flex shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1 basis-48">
        {htmlFor ? (
          <Label htmlFor={htmlFor} className={cn(labelClass, 'leading-normal')}>
            {label}
          </Label>
        ) : (
          <div className={labelClass}>{label}</div>
        )}
        {description ? (
          <p className={cn('text-xs', TONES[tone])}>{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className="flex w-full shrink-0 items-center justify-end gap-space-sm sm:w-auto">
          {children}
        </div>
      ) : null}
    </div>
  )
}
