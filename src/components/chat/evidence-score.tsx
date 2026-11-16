import { useTranslation } from 'react-i18next'
import {
  formatRetrievalScore,
  readRetrievalScore,
} from '@/lib/knowledge/retrieval-score'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'

/** Combined score as a quiet number; nothing when it is unavailable. */
export function EvidenceScore({ value }: { value: unknown }) {
  const { i18n } = useTranslation()
  const score = readRetrievalScore(value)
  if (score === null) return null
  return (
    <span className="shrink-0 font-mono text-xs text-text-tertiary tabular-nums">
      {formatRetrievalScore(score, i18n.resolvedLanguage ?? i18n.language)}
    </span>
  )
}

// Score kinds in display order: line key, bar label key, chunk field, bar tone.
const SCORE_KINDS = [
  [
    'combinedScore',
    'chat.evidence.combined',
    'similarity',
    'bg-data-viz-categorical-8',
  ],
  [
    'vectorScore',
    'chat.evidence.vector',
    'vector_similarity',
    'bg-data-viz-categorical-2',
  ],
  [
    'keywordScore',
    'chat.evidence.keyword',
    'term_similarity',
    'bg-data-viz-categorical-7',
  ],
] as const

/** The scores the backend returned for this chunk; missing or invalid ones are left out. */
function useEvidenceScores(chunk: ReferenceChunk) {
  const { i18n } = useTranslation()
  const { t } = useTypedTranslation('chat.aiWorkspace')
  const locale = i18n.resolvedLanguage ?? i18n.language
  return SCORE_KINDS.flatMap(([key, label, field, tone]) => {
    const score = readRetrievalScore(chunk[field])
    return score === null
      ? []
      : [
          {
            key,
            label,
            tone,
            score,
            value: formatRetrievalScore(score, locale),
            text: t(key, { score: formatRetrievalScore(score, locale) }),
          },
        ]
  })
}

/**
 * “Combined 82% · vector 74% · keyword 61%”: the retrieval ranking scores the
 * backend returned for this chunk (similarity, vector_similarity,
 * term_similarity). Missing or out-of-range values are left out, never shown
 * as zero; there is no separate rerank score.
 */
export function useEvidenceScoreLine(chunk: ReferenceChunk): string | null {
  const parts = useEvidenceScores(chunk).map((item) => item.text)
  return parts.length ? parts.join(' · ') : null
}

/**
 * One bar per score the chunk has, labelled and written out; the bars are only
 * a visual aid for the numbers next to them.
 */
export function EvidenceScoreBars({ chunk }: { chunk: ReferenceChunk }) {
  const { t } = useTranslation()
  const { t: tw } = useTypedTranslation('chat.aiWorkspace')
  const scores = useEvidenceScores(chunk)
  if (!scores.length)
    return <p className="text-xs text-text-tertiary">{tw('noScore')}</p>
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-space-sm gap-y-space-xs text-xs">
      {scores.map((item) => (
        <div key={item.key} className="contents">
          <dt className="text-text-tertiary">{t(item.label)}</dt>
          <dd aria-hidden="true" className="contents">
            <span className="h-1.5 overflow-hidden rounded-radius-full bg-background-subtle">
              <span
                className={cn('block h-full rounded-radius-full', item.tone)}
                style={{ width: `${item.score * 100}%` }}
              />
            </span>
          </dd>
          <dd className="text-end font-mono text-text-primary tabular-nums">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
