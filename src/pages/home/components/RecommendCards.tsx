import React from 'react'
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
  return (
    <div className="w-full flex gap-4 mt-20">
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            "group flex-1 rounded-2xl p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden h-[200px]",
            card.bgColor
          )}
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-components-recommend-card-text leading-relaxed">
              {card.title}
            </p>
            {card.hasImage && card.imageUrl && (
              <div className="w-full h-20 rounded-lg overflow-hidden">
                <img
                  src={card.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  data-dark-enhance="true"
                />
              </div>
            )}
          </div>
          <p className="text-xs text-components-recommend-card-tag text-right">
            {card.tag}
          </p>
          
          {/* 悬停时显示的聊一聊按钮 */}
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
            <div className="h-px bg-border-subtle" />
            <div className="p-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCardClick(card.title)
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-text-primary text-text-inverted rounded-full text-sm font-medium hover:bg-text-secondary transition-colors"
              >
                <span className="text-base">✨</span>
                聊一聊
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
