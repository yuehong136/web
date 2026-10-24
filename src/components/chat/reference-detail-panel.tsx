import { useCallback, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Watermark } from 'antd'
import type { Config } from 'dompurify'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ContextPanel } from '@/components/patterns/context-panel'
import { SafeHtml } from '@/components/ui/safe-html'
import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import { getDocTypeIcon } from '@/components/chat/reference-meta'
import {
  SourceMetadata,
  SourceRelevance,
  sourcePlainText,
} from '@/components/chat/source-metadata'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ReferenceDetailPanelProps {
  onClose: () => void
  onSelectChunk?: (chunk: ReferenceChunk) => void
  chunk: ReferenceChunk | null
  allChunks?: ReferenceChunk[]
  onCopySuccess?: () => void
}

const CHUNK_CONTENT_PURIFY_OPTIONS: Config = {
  ALLOWED_TAGS: [
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'caption',
    'br',
    'p',
    'div',
    'span',
    'strong',
    'em',
    'b',
    'i',
    'ul',
    'ol',
    'li',
  ],
  ALLOWED_ATTR: ['rowspan', 'colspan', 'class'],
}

/** Source content shares one scrolling panel across desktop and mobile sheets. */
export function ReferenceDetailPanel({
  onClose,
  onSelectChunk,
  chunk,
  allChunks,
  onCopySuccess,
}: ReferenceDetailPanelProps) {
  const { t, i18n } = useTranslation()
  const [copiedContent, setCopiedContent] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)
  const { t: tw } = useTypedTranslation('chat.aiWorkspace')
  const locale = i18n.resolvedLanguage ?? i18n.language
  const watermarkContent = useMemo(
    () => [
      user?.email || user?.nickname || '',
      new Intl.DateTimeFormat(locale).format(new Date()),
    ],
    [user?.email, user?.nickname, locale],
  )
  const relatedChunks = useMemo(
    () =>
      allChunks
        ?.filter(
          (item) =>
            item.dataset_id === chunk?.dataset_id &&
            item.document_id === chunk?.document_id &&
            item.id !== chunk?.id,
        )
        .slice(0, 3) ?? [],
    [allChunks, chunk],
  )
  const content = chunk?.content ?? ''
  const copy = useCallback(async () => {
    try {
      await copyToClipboard(sourcePlainText(content))
      setCopiedContent(content)
      toast.success(t('sources.copied'))
      onCopySuccess?.()
    } catch {
      toast.error(t('sources.copyFailed'))
    }
  }, [content, onCopySuccess, t])
  if (!chunk) return null
  const documentName = chunk.document_name || t('sources.unknownDocument')
  const metadata = [
    { label: t('sources.chunkId'), value: chunk.id, copyable: true },
    {
      label: t('sources.documentId'),
      value: chunk.document_id,
      copyable: true,
    },
    { label: t('sources.datasetId'), value: chunk.dataset_id, copyable: true },
    ...(chunk.image_id
      ? [{ label: t('sources.imageId'), value: chunk.image_id, copyable: true }]
      : []),
    ...(chunk.positions?.length
      ? [
          {
            label: t('sources.positions'),
            value: JSON.stringify(chunk.positions),
          },
        ]
      : []),
  ]
  const documentUrl = `/document/${encodeURIComponent(chunk.document_id)}/preview?${new URLSearchParams({ name: chunk.document_name || '' })}`
  return (
    <ContextPanel
      width="full"
      title={
        <span className="flex min-w-0 items-center gap-space-sm">
          {getDocTypeIcon(chunk.doc_type, chunk.document_name, 'size-icon-md')}
          <span className="truncate">{documentName}</span>
        </span>
      }
      description={t('sources.description')}
      onClose={onClose}
      closeLabel={t('common.close')}
      actions={
        chunk.document_id && (
          <Button asChild variant="outline" size="sm">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('sources.viewDocumentLabel')}
            >
              <ExternalLink className="size-icon-sm" />
              {t('sources.viewDocument')}
            </a>
          </Button>
        )
      }
    >
      <div className="space-y-space-lg">
        {!chunk.document_id && (
          <p className="text-sm text-text-secondary">{tw('noOriginal')}</p>
        )}
        <section className="space-y-space-base">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <h3 className="text-sm font-semibold">{t('sources.content')}</h3>
            <Button
              size="sm"
              variant="ghost"
              disabled={!content}
              onClick={() => void copy()}
            >
              {copiedContent === content ? (
                <Check className="size-icon-sm" />
              ) : (
                <Copy className="size-icon-sm" />
              )}
              {copiedContent === content
                ? t('sources.copied')
                : t('sources.copy')}
            </Button>
          </div>
          <Watermark
            content={watermarkContent}
            font={{ fontSize: 12 }}
            gap={[80, 80]}
          >
            <div className="rounded-radius-lg border border-border-subtle bg-background-subtle p-space-base">
              {content.includes('<') ? (
                <SafeHtml
                  className="prose prose-sm max-w-none break-words text-text-primary"
                  html={content}
                  options={CHUNK_CONTENT_PURIFY_OPTIONS}
                />
              ) : (
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-text-primary">
                  {content || t('sources.noContent')}
                </p>
              )}
            </div>
          </Watermark>
        </section>
        <ReferenceMetadataBadges metadata={chunk.document_metadata} />
        <details className="space-y-space-base rounded-radius-lg border border-border-subtle p-space-base">
          <summary className="cursor-pointer text-sm font-medium">
            {tw('technicalDetails')}
          </summary>
          <section aria-label={t('sources.similarity')}>
            <dl>
              <SourceRelevance
                label={t('sources.similarity')}
                value={chunk.similarity}
              />
              {chunk.vector_similarity !== undefined && (
                <SourceRelevance
                  label={t('sources.vectorSimilarity')}
                  value={chunk.vector_similarity}
                />
              )}
              {chunk.term_similarity !== undefined && (
                <SourceRelevance
                  label={t('sources.termSimilarity')}
                  value={chunk.term_similarity}
                />
              )}
            </dl>
          </section>
          <SourceMetadata items={metadata} onCopy={onCopySuccess} />
        </details>
        {relatedChunks.length > 0 && (
          <section className="space-y-space-base">
            <h3 className="text-sm font-semibold">
              {t('sources.relatedPassages', {
                count: relatedChunks.length,
              })}
            </h3>
            {relatedChunks.map((item) =>
              onSelectChunk ? (
                <Button
                  key={item.id}
                  variant="outline"
                  className="h-auto w-full justify-start text-left whitespace-normal"
                  onClick={() => onSelectChunk(item)}
                >
                  <span className="line-clamp-3">
                    {sourcePlainText(item.content || '')}
                  </span>
                </Button>
              ) : (
                <p
                  key={item.id}
                  className="line-clamp-3 rounded-radius-md border border-border-subtle bg-background-surface p-space-base text-sm leading-relaxed text-text-secondary"
                >
                  {sourcePlainText(item.content || '')}
                </p>
              ),
            )}
          </section>
        )}
      </div>
    </ContextPanel>
  )
}
