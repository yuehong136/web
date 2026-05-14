import React from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import type { RecommendCard } from '../types'

interface RecommendCardsProps {
  cards: RecommendCard[]
  onCardClick: (title: string) => void
}

export const RecommendCards: React.FC<RecommendCardsProps> = ({
  cards,
  onCardClick,
}) => {
  const { t } = useTranslation()

  return (
    <div className="mt-20 flex w-full gap-4">
      {cards.map((card) => {
        const title = card.titleKey ? t(card.titleKey, card.title) : card.title
        const tag = card.tagKey ? t(card.tagKey, card.tag) : card.tag

        return (
          <div
            key={card.id}
            className={cn(
              'group relative flex h-[200px] flex-1 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl p-5',
              card.bgColor,
            )}
          >
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium leading-relaxed text-components-recommend-card-text">
                {title}
              </p>
              {card.hasImage && card.imageUrl && (
                <div className="h-20 w-full overflow-hidden rounded-lg">
                  <img
                    src={card.imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    data-dark-enhance="true"
                  />
                </div>
              )}
            </div>
            <p className="text-right text-xs text-components-recommend-card-tag">
              {tag}
            </p>

            {/* 悬停时显示的聊一聊按钮 */}
            <div className="absolute bottom-0 left-0 right-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0">
              <div className="h-px bg-border-subtle" />
              <div className="p-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCardClick(title)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-text-primary py-2.5 text-sm font-medium text-text-inverted transition-colors hover:bg-text-secondary"
                >
                  <span className="text-base">✨</span>
                  {t('home.input.talk', '聊一聊')}
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
