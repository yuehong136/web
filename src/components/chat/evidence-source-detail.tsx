import { useCallback, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Watermark } from 'antd'
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
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { getCitationNumber, getSourceBadge } from './citation-utils'
import { EvidenceScore, useEvidenceScoreLine } from './evidence-score'
import { EvidenceChunkRow } from './evidence-chunk-list'

export interface EvidenceSourceDetailProps {
  chunk: ReferenceChunk
  references: ReferenceChunk[]
  cited?: ReferenceChunk[]
  onSelectChunk: (chunk: ReferenceChunk) => void
}

/** The selected source: where it comes from, its scores, the passage, then the rest of the turn. */
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
  const scoreLine = useEvidenceScoreLine(chunk)
  const content = chunk.content ?? ''
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
  return (
    <div className="space-y-space-md" data-evidence-source={chunk.id}>
      <p className="flex items-center gap-space-sm text-xs font-medium text-text-tertiary">
        {isCited ? tw('sourceNumber', { number }) : tw('notCited')}
        <span className="ms-auto">
          <EvidenceScore value={chunk.similarity} />
        </span>
      </p>
      <div className="flex min-w-0 items-center gap-space-base">
        <span
          aria-hidden="true"
          className="grid size-icon-2xl shrink-0 place-items-center rounded-radius-md bg-background-subtle font-mono text-xs font-semibold text-text-secondary"
        >
          {getSourceBadge(chunk)}
        </span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">
          {name}
        </h3>
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-space-base gap-y-space-xs text-sm">
        <dt className="text-text-tertiary">{tw('scores')}</dt>
        <dd className="text-text-primary tabular-nums">
          {scoreLine ?? tw('noScore')}
        </dd>
      </dl>
      <Watermark
        content={watermarkContent}
        font={{ fontSize: 12 }}
        gap={[80, 80]}
      >
        <div className="rounded-radius-lg border border-border-subtle bg-background-subtle px-space-md py-space-base">
          {content.includes('<') ? (
            <SafeHtml
              className="prose prose-sm max-w-none break-words text-text-secondary"
              html={content}
              options={CHUNK_CONTENT_PURIFY_OPTIONS}
            />
          ) : (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-text-secondary">
              {content || t('sources.noContent')}
            </p>
          )}
        </div>
      </Watermark>
      <div className="flex flex-wrap items-center gap-space-sm">
        {link ? (
          <Button asChild variant="outline" size="sm">
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title={t(link.hintKey)}
            >
              <ExternalLink aria-hidden className="size-icon-sm" />
              {t(link.labelKey)}
            </a>
          </Button>
        ) : (
          <p className="text-sm text-text-secondary">{tw('noOriginal')}</p>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={!plain}
          onClick={() => void copy()}
        >
          {copied === content ? (
            <Check aria-hidden className="size-icon-sm" />
          ) : (
            <Copy aria-hidden className="size-icon-sm" />
          )}
          {copied === content ? t('sources.copied') : t('sources.copy')}
        </Button>
      </div>
      <ReferenceMetadataBadges metadata={chunk.document_metadata} />
      <details className="rounded-radius-lg border border-border-subtle p-space-base">
        <summary className="cursor-pointer text-sm font-medium">
          {tw('technicalDetails')}
        </summary>
        <div className="mt-space-base">
          <ReferenceDiagnostics chunk={chunk} />
        </div>
      </details>
      {others.length > 0 && (
        <section className="space-y-space-xs">
          <h3 className="text-xs font-medium text-text-tertiary">
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
