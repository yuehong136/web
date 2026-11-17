import { useTranslation } from 'react-i18next'
import { Tooltip } from '@/components/ui/tooltip'
import {
  formatRetrievalScore,
  readRetrievalScore,
} from '@/lib/knowledge/retrieval-score'
import { cn } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'
import type { ChunkResult } from '@/types/search'

// Same series colours as the knowledge retrieval test; static for Tailwind.
const SCORE_FILL = {
  combined: 'bg-data-viz-categorical-8',
  vector: 'bg-data-viz-categorical-2',
  term: 'bg-data-viz-categorical-10',
} as const

type ScoreSeries = keyof typeof SCORE_FILL

/**
 * A score as "Label 82.4%" over a thin bar. A missing or out-of-range score
 * reads "Unavailable" over an empty, dashed track, never as zero.
 */
function ScoreBar({
  series,
  label,
  score,
  tooltip,
}: {
  series: ScoreSeries
  label: string
  score: number | null
  tooltip?: string
}) {
  const { t } = useTranslation()
  const value =
    score === null
      ? t('searchPage.workspace.scores.unavailable')
      : formatRetrievalScore(score, getCurrentLanguage(), 1)
  const bar = (
    <span
      data-score={series}
      data-unavailable={score === null || undefined}
      className="flex min-w-0 flex-col gap-space-2xs"
    >
      <span
        className={cn(
          'text-xs whitespace-nowrap tabular-nums',
          score === null ? 'text-text-tertiary' : 'text-text-secondary',
        )}
      >
        {label} <span className="font-mono">{value}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          'block h-1 w-16 overflow-hidden rounded-radius-full',
          score === null
            ? 'border border-dashed border-border-default'
            : 'bg-background-subtle',
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

/** Combined, vector and text similarity of one retrieved passage. */
export function SearchScoreBars({ chunk }: { chunk: ChunkResult }) {
  const { t } = useTranslation()
  const combined = readRetrievalScore(chunk.similarity)
  return (
    <div className="flex flex-wrap items-start gap-space-md">
      <ScoreBar
        series="combined"
        label={t('searchPage.workspace.scores.combined')}
        score={combined}
        tooltip={`${t('searchPage.workspace.scores.combinedFull')}: ${
          combined === null
            ? t('searchPage.workspace.scores.unavailable')
            : formatRetrievalScore(combined, getCurrentLanguage(), 1)
        }`}
      />
      <ScoreBar
        series="vector"
        label={t('searchPage.workspace.scores.vector')}
        score={readRetrievalScore(chunk.vector_similarity)}
      />
      <ScoreBar
        series="term"
        label={t('searchPage.workspace.scores.term')}
        score={readRetrievalScore(chunk.term_similarity)}
      />
    </div>
  )
}
