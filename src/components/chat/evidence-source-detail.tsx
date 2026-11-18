import { useCallback, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Watermark } from '@/components/ui/watermark'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { SafeHtml } from '@/components/ui/safe-html'
import { ReferenceDiagnostics } from '@/components/chat/reference-diagnostics'
import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import {
  CHUNK_CONTENT_PURIFY_OPTIONS,
  getOriginalSource,
  getOriginalSourceLink,
  toPlainText,
} from '@/components/chat/reference-meta'
import { useTypedTranslation } from '@/locales/use-typed-translation'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { getCitationNumber } from './citation-utils'
import { EvidenceScoreBars } from './evidence-score'
import { EvidenceChunkRow } from './evidence-chunk-list'
import { SourceTile } from './source-tile'
import { HighlightText } from '@/components/knowledge/HighlightText'
import { markedChunkHtml } from '@/components/chat/reference-highlight'

export interface EvidenceSourceDetailProps {
  chunk: ReferenceChunk
  references: ReferenceChunk[]
  cited?: ReferenceChunk[]
  onSelectChunk: (chunk: ReferenceChunk) => void
}

const PILL =
  'h-[var(--control-height-sm)] rounded-radius-full border-line px-space-base text-xs'

/** The selected source: file, where it sits, its scores, the passage, then the rest of the turn. */
export function EvidenceSourceDetail({
  chunk,
  references,
  cited,
  onSelectChunk,
}: EvidenceSourceDetailProps) {
  const { t, i18n } = useTranslation()
  const { t: tw } = useTypedTranslation('chat.aiWorkspace')
  const user = useAuthStore((state) => state.user)
  const [copied, setCopied] = useState<string | null>(null)
  const locale = i18n.resolvedLanguage ?? i18n.language
  const watermarkContent = useMemo(
    () => [
      user?.email || user?.nickname || '',
      new Intl.DateTimeFormat(locale).format(new Date()),
    ],
    [user?.email, user?.nickname, locale],
  )
  const content = chunk.content ?? ''
  // Matched words, when the search engine reported them.
  const marked = markedChunkHtml(chunk)
  const plain = toPlainText(content)
  const copy = useCallback(async () => {
    if (!plain) return
    try {
      await copyToClipboard(plain)
      setCopied(content)
      toast.success(t('sources.copied'))
    } catch {
      toast.error(t('sources.copyFailed'))
    }
  }, [content, plain, t])
  const number = getCitationNumber(chunk, references)
  const isCited = !cited || cited.includes(chunk)
  const others = references.filter((item) => item !== chunk)
  const name = chunk.document_name || t('sources.unknownDocument')
  const original = getOriginalSource(chunk)
  const link = original && getOriginalSourceLink(original)
  const where = [
    isCited ? tw('sourceNumber', { number }) : tw('notCited'),
    chunk.doc_type === 'table' || chunk.doc_type === 'image'
      ? t(`reference.docType.${chunk.doc_type}`)
      : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <div className="space-y-space-md" data-evidence-source={chunk.id}>
      <article
        className={cn(
          'space-y-space-base rounded-radius-xl border bg-raised p-space-base',
          isCited ? 'border-line-focus' : 'border-line',
        )}
      >
        <header className="flex min-w-0 items-center gap-space-base">
          <SourceTile chunk={chunk} size="md" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-medium text-fg">{name}</h3>
            <p className="truncate text-xs text-fg-subtle">{where}</p>
          </div>
        </header>
        <section aria-label={tw('scores')}>
          <EvidenceScoreBars chunk={chunk} />
        </section>
        <Watermark content={watermarkContent} fontSize={12} gap={[80, 80]}>
          {content.includes('<') ? (
            <SafeHtml
              className="prose prose-sm max-w-none break-words text-fg-muted"
              html={content}
              options={CHUNK_CONTENT_PURIFY_OPTIONS}
            />
          ) : marked ? (
            <HighlightText
              html={marked}
              className="text-sm leading-relaxed break-words text-fg-muted"
            />
          ) : (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-fg-muted">
              {content || t('sources.noContent')}
            </p>
          )}
        </Watermark>
        <div className="flex flex-wrap items-center gap-space-sm">
          {link ? (
            <Button asChild variant="outline" size="sm" className={PILL}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={t(link.hintKey)}
              >
                <ExternalLink aria-hidden className="size-icon-xs" />
                {t(link.labelKey)}
              </a>
            </Button>
          ) : (
            <p className="text-xs text-fg-subtle">{tw('noOriginal')}</p>
          )}
          <Button
            size="sm"
            variant="outline"
            className={PILL}
            disabled={!plain}
            onClick={() => void copy()}
          >
            {copied === content ? (
              <Check aria-hidden className="size-icon-xs" />
            ) : (
              <Copy aria-hidden className="size-icon-xs" />
            )}
            {copied === content ? t('sources.copied') : t('sources.copy')}
          </Button>
        </div>
        <ReferenceMetadataBadges metadata={chunk.document_metadata} />
      </article>
      <details className="group rounded-radius-lg border border-line-subtle px-space-base py-space-sm">
        <summary className="cursor-pointer text-xs font-medium text-fg-muted">
          {tw('technicalDetails')}
        </summary>
        <div className="mt-space-base">
          <ReferenceDiagnostics chunk={chunk} />
        </div>
      </details>
      {others.length > 0 && (
        <section className="space-y-space-xs">
          <h3 className="px-space-2xs text-xs text-fg-subtle">
            {tw('otherChunks')}
          </h3>
          <ul className="space-y-space-2xs">
            {others.map((item) => (
              <li key={`${item.dataset_id ?? ''}:${item.id}`}>
                <EvidenceChunkRow
                  chunk={item}
                  references={references}
                  cited={!cited || cited.includes(item)}
                  onSelect={onSelectChunk}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
