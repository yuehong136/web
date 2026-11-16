import { useEffect, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface ThreadTurn {
  /** Matches the `data-turn-id` attribute on the turn's question. */
  id: string
  question: string
}

const MIN_TURNS = 3
const PREVIEW_LENGTH = 80

const findTurn = (root: HTMLElement | null, id: string) =>
  root?.querySelector<HTMLElement>(`[data-turn-id="${CSS.escape(id)}"]`) ?? null

/**
 * Slim turn ticks on the right edge of long conversations: hover previews the
 * question, click jumps to it. Pure navigation over the rendered thread; it
 * hides on narrow screens and for short conversations.
 */
export function TurnRail({
  turns,
  rootRef,
}: {
  turns: ThreadTurn[]
  rootRef: RefObject<HTMLElement | null>
}) {
  const { t } = useTranslation()
  const [current, setCurrent] = useState<string | null>(null)
  const enabled = turns.length >= MIN_TURNS
  useEffect(() => {
    const root = rootRef.current
    if (!enabled || !root || typeof IntersectionObserver === 'undefined')
      return undefined
    const visible = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute('data-turn-id')
          if (!id) continue
          if (entry.isIntersecting) visible.add(id)
          else visible.delete(id)
        }
        const first = turns.find((turn) => visible.has(turn.id))
        if (first) setCurrent(first.id)
      },
      // A question counts as current while it is in the upper half of the view.
      { rootMargin: '0px 0px -50% 0px' },
    )
    for (const turn of turns) {
      const anchor = findTurn(root, turn.id)
      if (anchor) observer.observe(anchor)
    }
    return () => observer.disconnect()
  }, [enabled, turns, rootRef])
  if (!enabled) return null
  const jump = (id: string) => {
    const reduce =
      typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches
    findTurn(rootRef.current, id)?.scrollIntoView?.({
      block: 'start',
      behavior: reduce ? 'auto' : 'smooth',
    })
    setCurrent(id)
  }
  return (
    <nav
      aria-label={t('chat.thread.turns')}
      className="pointer-events-none absolute inset-y-space-lg end-space-md z-10 hidden flex-col items-end overflow-y-auto lg:flex"
      data-turn-rail
    >
      {turns.map((turn, index) => {
        const question =
          turn.question.length > PREVIEW_LENGTH
            ? `${turn.question.slice(0, PREVIEW_LENGTH)}…`
            : turn.question
        const active = turn.id === current
        return (
          <Tooltip key={turn.id} content={question} side="left" asChild>
            <button
              type="button"
              aria-label={t('chat.thread.jumpToTurn', {
                count: index + 1,
                question,
              })}
              aria-current={active ? 'step' : undefined}
              onClick={() => jump(turn.id)}
              className="group pointer-events-auto flex h-space-base w-space-lg shrink-0 items-center justify-end rounded-radius-sm focus-visible:outline-2 focus-visible:outline-state-focus"
            >
              <span
                aria-hidden="true"
                className={cn(
                  'h-space-2xs rounded-radius-full transition-all motion-reduce:transition-none',
                  active
                    ? 'w-space-md bg-components-button-primary-bg'
                    : 'w-space-base bg-border-strong group-hover:w-space-md group-hover:bg-text-secondary',
                )}
              />
            </button>
          </Tooltip>
        )
      })}
    </nav>
  )
}
