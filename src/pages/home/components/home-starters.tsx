import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { recommendCards } from '../constants'

/** Four starter cards; each one fills the draft and nothing runs until sent. */
export function HomeStarters({ onPick }: { onPick: (prompt: string) => void }) {
  const { t } = useTranslation()
  return (
    <ul
      aria-label={t('home.empty.suggestions')}
      className="grid grid-cols-[repeat(auto-fit,minmax(min(10rem,100%),1fr))] gap-space-sm"
    >
      {recommendCards.map((card) => {
        const Icon = card.icon
        const prompt = card.titleKey ? t(card.titleKey, card.title) : card.title
        return (
          <li key={card.id} className="min-w-0">
            <button
              type="button"
              title={prompt}
              onClick={() => onPick(prompt)}
              className="flex h-full w-full flex-col items-start gap-space-sm rounded-radius-xl border border-line-subtle bg-surface p-space-base text-left outline-hidden transition-[border-color,box-shadow,transform] duration-150 hover:border-line-strong hover:shadow-elevation-medium focus-visible:ring-2 focus-visible:ring-line-focus motion-safe:hover:-translate-y-px"
            >
              <span
                className={cn(
                  'flex size-7 shrink-0 items-center justify-center rounded-radius-md [&_svg]:size-icon-sm',
                  card.tone,
                )}
              >
                <Icon aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col gap-space-2xs">
                <span className="text-sm font-medium text-fg">
                  {card.tagKey ? t(card.tagKey, card.tag) : card.tag}
                </span>
                {card.descriptionKey ? (
                  <span className="text-xs text-fg-subtle">
                    {t(card.descriptionKey)}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
