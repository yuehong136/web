import { useTranslation } from 'react-i18next'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { cn } from '@/lib/utils'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { toPlainText, truncateText } from './reference-meta'
import { getCitationNumber } from './citation-utils'
import { EvidenceScore, useEvidenceScoreLine } from './evidence-score'
import { SourceTile } from './source-tile'

export interface EvidenceChunkRowProps {
  chunk: ReferenceChunk
  references: ReferenceChunk[]
  cited: boolean
  selected?: boolean
  /** Show vector and keyword scores under the passage. */
  detailed?: boolean
  onSelect: (chunk: ReferenceChunk) => void
}

/** One retrieved passage: file tile, document, citation number and snippet, then its score. */
export function EvidenceChunkRow({
  chunk,
  references,
  cited,
  selected = false,
  detailed = false,
  onSelect,
}: EvidenceChunkRowProps) {
  const { t } = useTranslation()
  const { t: tw } = useTypedTranslation('chat.aiWorkspace')
  const scoreLine = useEvidenceScoreLine(chunk)
  const number = getCitationNumber(chunk, references)
  const name = chunk.document_name || t('sources.unknownDocument')
  return (
    <button
      type="button"
      data-evidence-chunk={chunk.id}
      data-cited={cited || undefined}
      aria-current={selected || undefined}
      onClick={() => onSelect(chunk)}
      className={cn(
        'flex w-full min-w-0 items-start gap-space-base rounded-radius-lg border border-transparent px-space-sm py-space-sm text-start transition-colors hover:border-line-subtle hover:bg-fill-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-focus motion-reduce:transition-none',
        selected && 'border-line-focus bg-accent-soft',
      )}
    >
      <SourceTile chunk={chunk} size="md" className="mt-space-2xs" />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-sm',
            cited ? 'text-fg' : 'text-fg-muted',
          )}
        >
          {name}
        </span>
        <span className="block truncate text-xs text-fg-subtle">
          {cited ? tw('sourceNumber', { number }) : tw('notCited')} ·{' '}
          {truncateText(toPlainText(chunk.content), 120)}
        </span>
        {detailed && scoreLine && (
          <span className="mt-space-2xs block font-mono text-xs text-fg-subtle">
            {scoreLine}
          </span>
        )}
      </span>
      <EvidenceScore value={chunk.similarity} />
    </button>
  )
}

/** Every chunk retrieved for the turn, cited or not, in retrieval order. */
export function EvidenceChunkList({
  references,
  cited,
  selected,
  onSelect,
}: {
  references: ReferenceChunk[]
  cited?: ReferenceChunk[]
  selected?: ReferenceChunk
  onSelect: (chunk: ReferenceChunk) => void
}) {
  return (
    <ul className="space-y-space-2xs" data-evidence-chunks>
      {references.map((chunk) => (
        <li key={`${chunk.dataset_id ?? ''}:${chunk.id}`}>
          <EvidenceChunkRow
            chunk={chunk}
            references={references}
            cited={!cited || cited.includes(chunk)}
            selected={chunk === selected}
            detailed
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  )
}
