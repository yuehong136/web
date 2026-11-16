import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { HighlightText } from '@/components/knowledge/HighlightText'
import type { InspectorPanelProps } from '@/components/patterns'

import type { RetrievalResultView } from './types'
import { formatResultScore } from './utils'

interface ResultPreviewProps {
  result: RetrievalResultView
  highlightEnabled: boolean
  isMarkdownPreview: boolean
  onTogglePreview: () => void
}

/** One retrieved chunk: scores, then its text (highlighted or raw). */
export const ResultPreview: React.FC<ResultPreviewProps> = ({
  result,
  highlightEnabled,
  isMarkdownPreview,
  onTogglePreview,
}) => {
  const { t } = useTranslation()
  const scores = [
    { key: 'combined', label: t('knowledge.search.similarity') },
    { key: 'vector', label: t('knowledge.search.vector') },
    { key: 'term', label: t('knowledge.search.text') },
  ] as const

  return (
    <div className="flex flex-col gap-space-md text-sm">
      <ul
        aria-label={t('knowledge.search.scoresLabel')}
        className="flex flex-col gap-space-2xs text-text-secondary"
      >
        {scores.map((score) => (
          <li key={score.key} className="tabular-nums">
            {score.label}: {formatResultScore(result.scores[score.key], t)}
          </li>
        ))}
        <li className="text-xs text-text-tertiary">
          {t('knowledge.search.resultId', { id: result.id })} ·{' '}
          {t('knowledge.search.charsCount', { count: result.text.length })}
        </li>
      </ul>

      <div className="flex items-center gap-space-sm border-t border-border-subtle pt-space-md">
        <SegmentedControl
          aria-label={t('knowledge.search.previewMode')}
          size="sm"
          value={isMarkdownPreview ? 'raw' : 'preview'}
          onValueChange={(value) => {
            if ((value === 'raw') !== isMarkdownPreview) onTogglePreview()
          }}
          options={[
            { value: 'preview', label: t('knowledge.search.preview') },
            { value: 'raw', label: t('knowledge.search.raw') },
          ]}
        />
        <Badge variant="warning">{t('knowledge.search.beta')}</Badge>
      </div>

      {isMarkdownPreview ? (
        <pre className="rounded-radius-md bg-background-subtle p-space-sm text-sm leading-relaxed break-words whitespace-pre-wrap text-text-secondary">
          {result.text}
        </pre>
      ) : (
        <div className="text-sm leading-relaxed whitespace-pre-wrap text-text-secondary">
          <HighlightText
            html={result.highlight}
            text={result.text}
            enableHighlight={highlightEnabled}
          />
        </div>
      )}
    </div>
  )
}

interface ResultPreviewPanelOptions extends Omit<ResultPreviewProps, 'result'> {
  result: RetrievalResultView | null
  onClose: () => void
}

/**
 * Inspector props for the previewed result, replacing the preview dialog so
 * the result list stays visible beside it.
 */
export function useResultPreviewPanel({
  result,
  onClose,
  ...props
}: ResultPreviewPanelOptions): InspectorPanelProps {
  const { t } = useTranslation()
  return {
    open: Boolean(result),
    onOpenChange: (open) => {
      if (!open) onClose()
    },
    scopeKey: 'knowledge-search-result',
    title: result?.doc.name || t('knowledge.search.previewTitle'),
    description: t('knowledge.search.previewTitle'),
    content: result ? <ResultPreview result={result} {...props} /> : null,
  }
}
