/**
 * The document's chunk method; activating it opens the chunk method dialog.
 */

import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import type { Document } from '@/types/api'
import {
  DocumentParserType,
  DOCUMENT_PARSER_TYPE_LABELS,
} from '@/types/document-parser'

/** Friendly parser name; the built-in `naive` parser reads as General. */
export function getParserLabel(
  parserId: string | undefined,
  defaultLabel: string,
): string {
  if (!parserId) return defaultLabel
  if (parserId === 'naive') return 'General'
  return DOCUMENT_PARSER_TYPE_LABELS[parserId as DocumentParserType] || parserId
}

export function useDocumentParserLabel(document: Document) {
  const { t } = useTranslation()
  return document.pipeline_id
    ? t('knowledge.documents.chunkMethodModal.pipelineLabel')
    : getParserLabel(document.parser_id, t('knowledge.documents.defaultParser'))
}

interface ParserMethodCellProps {
  document: Document
  onShowChunkMethodModal: (doc: Document) => void
}

export const ParserMethodCell: FC<ParserMethodCellProps> = ({
  document,
  onShowChunkMethodModal,
}) => {
  const { t } = useTranslation()
  const parserLabel = useDocumentParserLabel(document)

  return (
    <button
      type="button"
      title={t('knowledge.documents.configureParser')}
      aria-label={t('knowledge.documents.configureParserFor', {
        name: document.name,
        parser: parserLabel,
      })}
      onClick={() => onShowChunkMethodModal(document)}
      className="max-w-full truncate rounded-radius-sm text-left text-sm text-fg-muted outline-hidden hover:text-fg hover:underline focus-visible:ring-2 focus-visible:ring-line-focus"
    >
      {parserLabel}
    </button>
  )
}
