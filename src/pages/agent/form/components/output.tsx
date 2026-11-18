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
          'rounded-radius-xl border border-line-strong bg-fg p-space-lg shadow-elevation-low',
        isCompact && 'border-t border-line-subtle pt-space-md',
      )}
    >
      <div className="flex items-start justify-between gap-space-base">
        <div className="space-y-space-sm">
          <div
            className={cn(
              'font-medium',
              isCompact ? 'text-lg text-fg' : 'text-sm',
              isContrast ? 'text-fg-inverse' : 'text-fg',
            )}
          >
            {resolvedTitle}
          </div>
          {description ? (
            <p
              className={cn(
                isCompact ? 'text-sm leading-7' : 'text-xs',
                isContrast ? 'text-fg-inverse opacity-75' : 'text-fg-muted',
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
          isCompact ? 'divide-y divide-line-subtle' : 'space-y-space-sm',
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
                ? 'border-line bg-raised'
                : !isCompact && 'border-line bg-sunken',
            )}
          >
            <div className="flex min-w-0 items-center gap-space-sm">
              {isCompact ? (
                <span className="mt-0.5 h-2 w-2 shrink-0 rounded-radius-full bg-accent-fg" />
              ) : (
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-radius-md',
                    isContrast
                      ? 'bg-accent-soft text-accent-fg'
                      : 'bg-accent-soft text-accent-fg',
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
                      ? 'text-base leading-7 text-fg'
                      : 'text-accent-fg',
                  )}
                >
                  {x.title}
                </div>
                {!isCompact ? (
                  <div className="truncate text-xs text-fg-muted">
                    {t('flow.output', 'Output')}
                  </div>
                ) : null}
              </div>
            </div>

            {x.type ? (
              isCompact ? (
                <span className="shrink-0 font-mono text-sm text-fg-subtle">
                  {x.type}
                </span>
              ) : (
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-radius-full border px-space-sm py-0.5 text-xs',
                    isContrast
                      ? 'border-line-subtle bg-sunken text-fg-muted'
                      : isCompact
                        ? 'border-line-subtle bg-sunken font-mono text-fg-subtle'
                        : 'border-line bg-surface text-fg-muted',
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
