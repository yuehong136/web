import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TideMark } from '@/components/layout/brand-mark'

const partOfDay = (hour: number) =>
  hour >= 5 && hour < 12
    ? 'morning'
    : hour >= 12 && hour < 18
      ? 'afternoon'
      : 'evening'

/**
 * The new-chat greeting: a tide chip (time of day, plus what the workspace can
 * draw on once those counts have loaded) and the page's one heading.
 */
export function HomeGreeting({
  knowledgeTotal,
  mcpTotal,
}: {
  knowledgeTotal: number | null
  mcpTotal: number | null
}) {
  const { t } = useTranslation()
  const [hour] = useState(() => new Date().getHours())
  const resources = [
    knowledgeTotal
      ? t('home.greeting.knowledge', { count: knowledgeTotal })
      : null,
    mcpTotal ? t('home.greeting.mcp', { count: mcpTotal }) : null,
  ].filter((item): item is string => Boolean(item))
  return (
    <div className="flex flex-col items-center gap-space-base text-center">
      <p
        data-home-greeting
        className="inline-flex max-w-full items-center gap-space-sm rounded-radius-full border border-components-ai-ring bg-components-ai-glow py-space-xs ps-space-xs pe-space-base text-xs text-text-accent"
      >
        <TideMark size="xs" />
        <span className="min-w-0 truncate">
          {t(`home.greeting.${partOfDay(hour)}`)}
          {resources.length > 0 &&
            ` · ${
              resources.length === 2
                ? t('home.greeting.availableBoth', {
                    first: resources[0],
                    second: resources[1],
                  })
                : t('home.greeting.availableOne', { item: resources[0] })
            }`}
        </span>
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-pretty text-text-primary sm:text-3xl">
        {t('home.empty.title')}
      </h1>
      <p className="max-w-xl text-sm text-pretty text-text-tertiary">
        {t('home.empty.description')}
      </p>
    </div>
  )
}
