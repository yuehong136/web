import { cn } from '@/lib/utils'
import type { PropsWithChildren } from 'react'
import { Variable } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

export type OutputType = {
  title: string
  type?: string
}

export type OutputMap = Record<
  string,
  {
    type?: string
    value?: unknown
    ref?: string
  }
>

type OutputProps = {
  list: Array<OutputType>
  title?: string
  description?: string
  variant?: 'default' | 'contrast' | 'compact'
} & PropsWithChildren

export function transferOutputs(outputs: OutputMap | undefined) {
  if (!outputs) {
    return []
  }
  return Object.entries(outputs).map(([key, value]) => ({
    title: key,
    type: value?.type,
  }))
}

export function buildOutputList(outputs: OutputMap | undefined) {
  return transferOutputs(outputs)
}

export function buildOutputMapFromList(list: OutputType[]): OutputMap {
  return list.reduce<OutputMap>((acc, item) => {
    acc[item.title] = {
      type: item.type,
      value: '',
    }
    return acc
  }, {})
}

export function buildFixedOutputMap(
  list: Array<{ title: string; type?: string; value?: unknown }>,
): OutputMap {
  return list.reduce<OutputMap>((acc, item) => {
    acc[item.title] = {
      type: item.type,
      value: item.value,
    }
    return acc
  }, {})
}

export const OutputSchema = {
  outputs: z.record(z.string(), z.unknown()),
}

export function Output({
  list,
  children,
  title,
  description,
  variant = 'compact',
}: OutputProps) {
  const { t } = useTranslation()
  const resolvedTitle = title || t('flow.output', 'Output')
  const isContrast = variant === 'contrast'
  const isCompact = variant === 'compact'

  return (
    <section
      className={cn(
        'space-y-space-base',
        isContrast &&
          'rounded-radius-xl border border-border-strong bg-text-primary p-space-lg shadow-elevation-low',
        isCompact &&
          'border-t border-border-subtle pt-space-md',
      )}
    >
      <div className="flex items-start justify-between gap-space-base">
        <div className="space-y-space-sm">
          <div
            className={cn(
              'font-medium',
              isCompact ? 'text-lg text-text-primary' : 'text-sm',
              isContrast ? 'text-text-inverted' : 'text-text-primary',
            )}
          >
            {resolvedTitle}
          </div>
          {description ? (
            <p
              className={cn(
                isCompact ? 'text-sm leading-7' : 'text-xs',
                isContrast ? 'text-text-inverted opacity-75' : 'text-text-secondary',
              )}
            >
              {description}
            </p>
          ) : null}
        </div>
        {children ? <span>{children}</span> : null}
      </div>

      <ul
        className={cn(
          isCompact ? 'divide-y divide-border-subtle' : 'space-y-space-sm',
        )}
      >
        {list.map((x, idx) => (
          <li
            key={idx}
            className={cn(
              'flex items-center justify-between gap-space-sm',
              isCompact
                ? 'min-h-12 py-space-base'
                : 'rounded-radius-lg border px-space-sm py-space-sm shadow-elevation-low',
              isContrast
                ? 'border-border-default bg-components-card-bg'
                : !isCompact && 'border-border-default bg-background-subtle',
            )}
          >
            <div className="flex min-w-0 items-center gap-space-sm">
              {isCompact ? (
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-radius-full bg-components-system-accent-text" />
              ) : (
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-radius-md',
                    isContrast
                      ? 'bg-components-system-accent-soft text-components-system-accent-text'
                      : 'bg-components-system-accent-bg text-components-system-accent-text',
                  )}
                >
                  <Variable className="size-4" />
                </span>
              )}

              <div className="min-w-0">
                <div
                  className={cn(
                    'truncate text-sm font-medium',
                    isCompact
                      ? 'text-base leading-7 text-text-primary'
                      : 'text-components-system-accent-text',
                  )}
                >
                  {x.title}
                </div>
                {!isCompact ? (
                  <div className="truncate text-xs text-text-secondary">
                    {t('flow.output', 'Output')}
                  </div>
                ) : null}
              </div>
            </div>

            {x.type ? (
              isCompact ? (
                <span className="shrink-0 font-mono text-sm text-text-tertiary">
                  {x.type}
                </span>
              ) : (
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-radius-full border px-space-sm py-0.5 text-xs',
                    isContrast
                      ? 'border-border-subtle bg-background-subtle text-text-secondary'
                      : isCompact
                        ? 'border-border-subtle bg-background-subtle font-mono text-text-tertiary'
                        : 'border-border-default bg-surface-primary text-text-secondary',
                  )}
                >
                  {x.type}
                </span>
              )
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
