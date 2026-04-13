import { cn } from '@/lib/utils'
import type { HTMLAttributes, ReactNode } from 'react'
import {
  OperatorFormTone,
  type OperatorFormToneValue,
} from './operator-form-shell.constants'

const SURFACE_TONE_CLASSNAME: Record<OperatorFormToneValue, string> = {
  [OperatorFormTone.DEFAULT]:
    'border-border-default bg-components-card-bg text-text-primary',
  [OperatorFormTone.MUTED]:
    'border-border-default bg-background-subtle text-text-primary',
  [OperatorFormTone.ACCENT]:
    'border-components-system-accent-border bg-components-system-accent-soft text-text-primary',
  [OperatorFormTone.CONTRAST]:
    'border-border-strong bg-text-primary text-text-inverted',
}

type OperatorFormHeroProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  meta?: ReactNode
  tone?: OperatorFormToneValue
}

export function OperatorFormHero({
  eyebrow,
  title,
  description,
  meta,
  tone = OperatorFormTone.DEFAULT,
  className,
  ...props
}: OperatorFormHeroProps) {
  const isContrast = tone === OperatorFormTone.CONTRAST

  return (
    <section
      className={cn(
        'overflow-hidden rounded-radius-xl border shadow-elevation-low',
        SURFACE_TONE_CLASSNAME[tone],
        className,
      )}
      {...props}
    >
      <div className="flex flex-wrap items-start justify-between gap-space-base px-space-lg py-space-lg">
        <div className="min-w-0 flex-1 space-y-space-sm">
          {eyebrow ? (
            <div
              className={cn(
                'text-xs font-medium uppercase tracking-widest',
                isContrast ? 'text-text-inverted opacity-70' : 'text-text-tertiary',
              )}
            >
              {eyebrow}
            </div>
          ) : null}
          <div className="space-y-space-xs">
            <h2
              className={cn(
                'text-xl font-semibold',
                isContrast ? 'text-text-inverted' : 'text-text-primary',
              )}
            >
              {title}
            </h2>
            {description ? (
              <p
                className={cn(
                  'max-w-3xl text-sm leading-6',
                  isContrast ? 'text-text-inverted opacity-80' : 'text-text-secondary',
                )}
              >
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {meta ? <div className="shrink-0">{meta}</div> : null}
      </div>
    </section>
  )
}

type OperatorFormSectionProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  tone?: OperatorFormToneValue
  contentClassName?: string
  divider?: boolean
}

export function OperatorFormSection({
  title,
  description,
  actions,
  tone = OperatorFormTone.DEFAULT,
  className,
  contentClassName,
  divider = true,
  children,
  ...props
}: OperatorFormSectionProps) {
  const isContrast = tone === OperatorFormTone.CONTRAST
  const hasHeader = title || description || actions

  return (
    <section
      className={cn(
        'overflow-hidden rounded-radius-xl border shadow-elevation-low',
        SURFACE_TONE_CLASSNAME[tone],
        className,
      )}
      {...props}
    >
      {hasHeader ? (
        <div
          className={cn(
            'flex flex-wrap items-start justify-between gap-space-base px-space-lg py-space-base',
            divider &&
              (isContrast ? 'border-b border-border-strong' : 'border-b border-border-subtle'),
          )}
        >
          <div className="min-w-0 flex-1 space-y-space-xs">
            {title ? (
              <div
                className={cn(
                  'text-base font-semibold',
                  isContrast ? 'text-text-inverted' : 'text-text-primary',
                )}
              >
                {title}
              </div>
            ) : null}
            {description ? (
              <div
                className={cn(
                  'text-sm',
                  isContrast ? 'text-text-inverted opacity-75' : 'text-text-secondary',
                )}
              >
                {description}
              </div>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      <div className={cn('p-space-lg', contentClassName)}>{children}</div>
    </section>
  )
}
