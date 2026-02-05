import { Input } from '@/components/ui/input'
import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

export type OutputType = {
  title: string
  type?: string
}

type OutputProps = {
  list: Array<OutputType>
} & PropsWithChildren

export function transferOutputs(outputs: Record<string, any> | undefined) {
  if (!outputs) {
    return []
  }
  return Object.entries(outputs).map(([key, value]) => ({
    title: key,
    type: value?.type,
  }))
}

export const OutputSchema = {
  outputs: z.record(z.string(), z.any()),
}

export function Output({ list, children }: OutputProps) {
  const { t } = useTranslation()

  return (
    <section className="space-y-2">
      <div className="text-sm flex items-center justify-between">
        {t('flow.output', 'Output')} <span>{children}</span>
      </div>
      <ul className="space-y-1">
        {list.map((x, idx) => (
          <li
            key={idx}
            className="bg-surface-secondary text-text-accent rounded-radius-sm px-space-sm py-space-xs"
          >
            {x.title}:{' '}
            <span className="text-text-secondary">{x.type}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
