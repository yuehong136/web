import { useCallback, useMemo, useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { Watermark } from 'antd'
import type { Config } from 'dompurify'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ContextPanel } from '@/components/patterns/context-panel'
import { SafeHtml } from '@/components/ui/safe-html'
import { ReferenceDiagnostics } from '@/components/chat/reference-diagnostics'
import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import {
  getDocTypeIcon,
  getOriginalSource,
  getOriginalSourceLink,
  toPlainText,
} from '@/components/chat/reference-meta'
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

// 引用内容白名单（chunk 内容来自文档解析，按不可信输入对待）
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

const hasEntries = (value?: Record<string, unknown> | null) =>
  Boolean(value && Object.keys(value).length)

/**
 * Source content shares one scrolling panel across desktop and mobile sheets.
 * 检索匹配评分只在技术详情的检索诊断区展示，标题区和同文档引用都不展示评分。
 */
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
      // 没有文档 ID（如知识图谱汇总）时不能把其他无文档片段当成同文档引用
      chunk?.document_id
        ? (allChunks
            ?.filter(
              (item) =>
                item.dataset_id === chunk.dataset_id &&
                item.document_id === chunk.document_id &&
                item.id !== chunk.id,
            )
            .slice(0, 3) ?? [])
        : [],
    [allChunks, chunk],
  )
  const content = chunk?.content ?? ''
  const plainContent = toPlainText(content)
  const copy = useCallback(async () => {
    if (!plainContent) return
    try {
      await copyToClipboard(plainContent)
      setCopiedContent(content)
      toast.success(t('sources.copied'))
      onCopySuccess?.()
    } catch {
      toast.error(t('sources.copyFailed'))
    }
  }, [content, plainContent, onCopySuccess, t])
  if (!chunk) return null
  const documentName = chunk.document_name || t('sources.unknownDocument')
  // 知识库切片打开文档预览，联网结果打开来源网页；都没有时说明没有原文
  const originalSource = getOriginalSource(chunk)
  const originalLink = originalSource && getOriginalSourceLink(originalSource)
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
        originalLink && (
          <Button asChild variant="outline" size="sm">
            <a
              href={originalLink.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t(originalLink.hintKey)}
              title={t(originalLink.hintKey)}
            >
              <ExternalLink aria-hidden className="size-icon-sm" />
              {t(originalLink.labelKey)}
            </a>
          </Button>
        )
      }
    >
      <div className="space-y-space-lg">
        {!originalLink && (
          <p className="text-sm text-text-secondary">{tw('noOriginal')}</p>
        )}
        <section className="space-y-space-base">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <h3 className="text-sm font-semibold">{t('sources.content')}</h3>
            <Button
              size="sm"
              variant="ghost"
              disabled={!plainContent}
              onClick={() => void copy()}
            >
              {copiedContent === content ? (
                <Check aria-hidden className="size-icon-sm" />
              ) : (
                <Copy aria-hidden className="size-icon-sm" />
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
        {/* 文档元数据（应用配置的字段，按纯文本展示）；没有时不留空标题 */}
        {hasEntries(chunk.document_metadata) && (
          <section>
            <h3 className="text-sm font-semibold">
              {t('reference.documentMetadata')}
            </h3>
            <ReferenceMetadataBadges metadata={chunk.document_metadata} />
          </section>
        )}
        <details className="space-y-space-base rounded-radius-lg border border-border-subtle p-space-base">
          <summary className="cursor-pointer text-sm font-medium">
            {tw('technicalDetails')}
          </summary>
          <ReferenceDiagnostics chunk={chunk} onCopySuccess={onCopySuccess} />
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
                    {toPlainText(item.content)}
                  </span>
                </Button>
              ) : (
                <p
                  key={item.id}
                  className="line-clamp-3 rounded-radius-md border border-border-subtle bg-background-surface p-space-base text-sm leading-relaxed text-text-secondary"
                >
                  {toPlainText(item.content)}
                </p>
              ),
            )}
          </section>
        )}
      </div>
    </ContextPanel>
  )
}
