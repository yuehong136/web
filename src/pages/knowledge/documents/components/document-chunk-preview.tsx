import { useTranslation } from 'react-i18next'
import { ChunkContent } from '@/components/knowledge/chunk-content'
import type { Document } from '@/types/api'
import { useDocumentChunkPreview } from '../hooks/use-document-chunk-preview'

const plainLength = (html: string) => html.replace(/<[^>]*>/g, '').length

/** The first chunks of a parsed document, three lines each. */
export function DocumentChunkPreview({
  kbId,
  document,
}: {
  kbId?: string
  document: Pick<Document, 'id' | 'run' | 'chunk_num'>
}) {
  const { t } = useTranslation()
  const preview = useDocumentChunkPreview(kbId, document)
  if (preview.isPending && preview.fetchStatus !== 'idle')
    return (
      <output className="block text-xs text-fg-subtle">
        {t('knowledge.chunks.list.loading')}
      </output>
    )
  if (preview.isError || !preview.data?.length)
    return (
      <p className="text-xs text-fg-subtle">
        {t('knowledge.documents.inspector.chunkPreviewUnavailable')}
      </p>
    )
  return (
    <ul className="flex flex-col gap-space-sm">
      {preview.data.map((chunk, index) => {
        const page = chunk.positions?.[0]?.[0]
        return (
          <li
            key={chunk.chunk_id}
            className="flex flex-col gap-space-xs rounded-radius-lg border border-line-subtle bg-sunken px-space-sm py-space-sm"
          >
            <span className="font-mono text-xs text-fg-subtle">
              {[
                `#${index + 1}`,
                page
                  ? t('knowledge.documents.inspector.chunkPage', { page })
                  : null,
                t('knowledge.chunks.list.characters', {
                  count: plainLength(chunk.content_with_weight),
                }),
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <ChunkContent
              className="text-xs leading-relaxed text-fg-muted"
              html={chunk.content_with_weight}
              clamp={3}
            />
          </li>
        )
      })}
    </ul>
  )
}
