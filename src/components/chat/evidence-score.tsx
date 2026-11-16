import { useTranslation } from 'react-i18next'
import { Progress } from '@/components/ui/progress'
import {
  formatRetrievalScore,
  readRetrievalScore,
} from '@/lib/knowledge/retrieval-score'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import type { ReferenceChunk } from '@/utils/reference-replacer'

/** Combined score as a short bar plus its value; nothing when it is unavailable. */
export function EvidenceScore({ value }: { value: unknown }) {
  const { i18n } = useTranslation()
  const score = readRetrievalScore(value)
  if (score === null) return null
  return (
    <span className="inline-flex shrink-0 items-center gap-space-xs font-mono text-xs text-text-secondary">
      {/* The value is written out next to it; the bar is only a visual aid. */}
      <Progress aria-hidden value={score * 100} className="h-1 w-10" />
      {formatRetrievalScore(score, i18n.resolvedLanguage ?? i18n.language)}
    </span>
  )
}

/**
 * “Combined 82% · vector 74% · keyword 61%”: the retrieval ranking scores the
 * backend returned for this chunk (similarity, vector_similarity,
 * term_similarity). Missing or out-of-range values are left out, never shown
 * as zero; there is no separate rerank score.
 */
export function useEvidenceScoreLine(chunk: ReferenceChunk): string | null {
  const { i18n } = useTranslation()
  const { t } = useTypedTranslation('chat.aiWorkspace')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const parts = (
    [
      ['combinedScore', chunk.similarity],
      ['vectorScore', chunk.vector_similarity],
      ['keywordScore', chunk.term_similarity],
    ] as const
  ).flatMap(([key, value]) => {
    const score = readRetrievalScore(value)
    return score === null
      ? []
      : [t(key, { score: formatRetrievalScore(score, locale) })]
  })
  return parts.length ? parts.join(' · ') : null
}
