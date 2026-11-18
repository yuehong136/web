import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { PanelRight } from 'lucide-react'

import { HighlightText } from '@/components/knowledge/HighlightText'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import type { RetrievalResultView } from './types'
import { formatResultScore } from './utils'

// Static class strings so Tailwind sees each series colour.
const SCORE_FILL = {
  combined: 'bg-viz-8',
  vector: 'bg-viz-2',
  term: 'bg-viz-10',
} as const

/**
 * A score as "Label 82.4%" over a thin bar. A missing score reads
 * "Unavailable" with an empty, dashed track, never as zero.
 */
function ScoreBar({
  label,
  score,
  series,
  tooltip,
}: {
  label: string
  score: number | null
  series: keyof typeof SCORE_FILL
  tooltip?: string
}) {
  const { t } = useTranslation()
  const value = formatResultScore(score, t)
  const bar = (
    <span
      data-score={series}
      data-unavailable={score === null || undefined}
      className="flex min-w-0 flex-col gap-space-2xs"
    >
      <span
        className={cn(
          'text-xs whitespace-nowrap tabular-nums',
          score === null ? 'text-fg-subtle' : 'text-fg-muted',
        )}
      >
        {label} <span className="font-mono">{value}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'block h-1 w-16 overflow-hidden rounded-radius-full',
          score === null ? 'border border-dashed border-line' : 'bg-sunken',
        )}
      >
        {score === null ? null : (
          <span
            className={cn(
              'block h-full rounded-radius-full',
              SCORE_FILL[series],
            )}
            style={{ width: `${Math.round(score * 100)}%` }}
          />
        )}
      </span>
    </span>
  )
  return tooltip ? <Tooltip content={tooltip}>{bar}</Tooltip> : bar
}

interface RetrievalResultCardProps {
  result: RetrievalResultView
  order: number
  highlight: boolean
  onOpen: () => void
}

/** One retrieved chunk: rank, score bars, the matched text and its file. */
export const RetrievalResultCard: React.FC<RetrievalResultCardProps> = ({
  result,
  order,
  highlight,
  onOpen,
}) => {
  const { t } = useTranslation()
  const { scores } = result
  const hasMore =
    result.text.length > 200 ||
    Boolean(result.highlight && result.highlight.length > 200)

  return (
    <article className="flex flex-col gap-space-sm rounded-radius-xl border border-line-subtle bg-surface p-space-base transition-colors hover:border-line-strong">
      <div className="flex flex-wrap items-start justify-between gap-space-base">
        <div className="flex min-w-0 items-center gap-space-sm">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-radius-md bg-sunken font-mono text-xs font-semibold text-fg">
            {order}
          </span>
          <p className="truncate font-mono text-xs text-fg-subtle">
            {t('knowledge.search.resultId', { id: result.id })}
          </p>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-space-md">
          <ScoreBar
            series="combined"
            label={t('knowledge.search.similarityShort')}
            score={scores.combined}
            tooltip={`${t('knowledge.search.similarity')}: ${formatResultScore(scores.combined, t)}`}
          />
          <ScoreBar
            series="vector"
            label={t('knowledge.search.vector')}
            score={scores.vector}
          />
          <ScoreBar
            series="term"
            label={t('knowledge.search.text')}
            score={scores.term}
          />
        </div>
      </div>

      <button
        type="button"
        className="block w-full rounded-radius-md p-space-xs text-left text-sm leading-relaxed text-fg-muted outline-hidden transition-colors hover:bg-sunken focus-visible:ring-2 focus-visible:ring-line-focus"
        onClick={onOpen}
      >
        <HighlightText
          html={result.highlight}
          text={result.text}
          enableHighlight={highlight}
          truncate
          truncateLength={200}
        />
        {hasMore && (
          <span className="mt-space-xs inline-flex text-xs font-medium text-accent-fg">
            {t('knowledge.search.expand')}
          </span>
        )}
      </button>

      <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-line-subtle pt-space-sm">
        <div className="flex min-w-0 items-center gap-space-sm">
          <FileKindTile
            name={result.doc.extension || result.doc.name}
            size="sm"
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-fg-muted">
              {result.doc.name}
            </div>
            <div className="text-xs text-fg-subtle">
              {t('knowledge.search.fromDocument')}
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-xs"
          onClick={onOpen}
        >
          <PanelRight className="size-icon-sm" aria-hidden="true" />
          {t('knowledge.search.details')}
        </Button>
      </div>
    </article>
  )
}
