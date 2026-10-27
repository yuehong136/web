import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { RecommendCard } from '../types'

interface RecommendCardsProps {
  cards: RecommendCard[]
  onCardClick: (prompt: string) => void
}
export function RecommendCards({ cards, onCardClick }: RecommendCardsProps) {
  const { t } = useTranslation()
  return (
    <div className="grid w-full gap-space-md sm:grid-cols-3">
      {cards.map((card) => {
        const prompt = card.titleKey ? t(card.titleKey, card.title) : card.title
        const tag = card.tagKey ? t(card.tagKey, card.tag) : card.tag
        return (
          <button
            type="button"
            key={card.id}
            aria-label={prompt}
            onClick={() => onCardClick(prompt)}
            className="group flex min-w-0 flex-col gap-space-sm rounded-radius-sm border-t border-border-default px-space-sm py-space-md text-start transition-colors hover:bg-state-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-state-focus"
          >
            <span className="flex w-full items-center justify-between gap-space-sm text-sm font-semibold text-text-primary">
              {tag}
              <ArrowUpRight
                className="size-icon-sm shrink-0 text-text-tertiary"
                aria-hidden="true"
              />
            </span>
            <span className="text-sm leading-relaxed text-text-secondary">
              {prompt}
            </span>
          </button>
        )
      })}
    </div>
  )
}
