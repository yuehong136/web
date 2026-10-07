/**
 * 引用详情侧边栏组件
 * 用于展示单个引用的完整详情，从右侧滑出
 *
 * 展示组件原则：只接收 props，不包含业务逻辑
 */
import { useCallback, useMemo, useState, type FC } from 'react'
import { Copy, Check, ExternalLink, X } from 'lucide-react'
import { Watermark } from 'antd'
import type { Config } from 'dompurify'
import { useTranslation } from 'react-i18next'
import { ReferenceMetadataBadges } from '@/components/chat/reference-metadata-badges'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { SafeHtml } from '@/components/ui/safe-html'
import { ReferenceDiagnostics } from './reference-diagnostics'
import {
  getDocTypeIcon,
  getDocTypeLabelKey,
  openDocumentPreview,
  toPlainText,
  truncateText,
} from './reference-meta'
import { useReturnFocus } from './use-return-focus'
import { cn, copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import { getCurrentLanguage } from '@/locales/i18n'
import { useAuthStore } from '@/stores'
import type { ReferenceChunk } from '@/utils/reference-replacer'

export interface ReferenceDetailSheetProps {
  /** 是否打开 */
  open: boolean
  /** 打开/关闭回调 */
  onOpenChange: (open: boolean) => void
  /** 当前选中的 chunk */
  chunk: ReferenceChunk | null
  /** 所有 chunks（用于显示同文档其他引用） */
  allChunks?: ReferenceChunk[]
  /** 复制成功回调 */
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
  ALLOWED_ATTR: ['rowspan', 'colspan', 'class', 'style'],
}

const SECTION_TITLE_CLASS = 'text-sm font-medium text-text-primary'

/**
 * 引用详情侧边栏组件
 */
export const ReferenceDetailSheet: FC<ReferenceDetailSheetProps> = ({
  open,
  onOpenChange,
  chunk,
  allChunks,
  onCopySuccess,
}) => {
  const { t } = useTranslation()
  const [contentCopied, setContentCopied] = useState(false)
  const user = useAuthStore((s) => s.user)
  // 调用方都以受控方式打开（无 Trigger），关闭时把焦点还给打开前的元素
  const returnFocus = useReturnFocus()
  const locale = getCurrentLanguage()

  const watermarkContent = useMemo(() => {
    const email = user?.email || user?.nickname || ''
    const date = new Date().toLocaleDateString(locale)
    return [email, date]
  }, [user?.email, user?.nickname, locale])

  const relatedChunks = useMemo(() => {
    if (!allChunks || !chunk?.document_id) return []
    return allChunks
      .filter((c) => c.document_id === chunk.document_id && c.id !== chunk.id)
      .slice(0, 3)
  }, [allChunks, chunk])

  const content = chunk?.content
  const handleCopyContent = useCallback(async () => {
    const textContent = toPlainText(content)
    if (!textContent) return
    try {
      await copyToClipboard(textContent)
      setContentCopied(true)
      toast.success(t('reference.sheet.contentCopied'))
      onCopySuccess?.()
      setTimeout(() => setContentCopied(false), 2000)
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }, [content, onCopySuccess, t])

  // 条件返回必须在所有 hooks 之后
  if (!chunk) return null

  const documentName = chunk.document_name || t('reference.unknownDocument')
  const isHtmlContent = chunk.content?.includes('<')
  const hasDocumentMetadata = Boolean(
    chunk.document_metadata && Object.keys(chunk.document_metadata).length,
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        // 默认关闭按钮绝对定位，会被吸顶头部盖住并随内容滚走，改放进头部
        showCloseButton={false}
        className="w-full overflow-y-auto bg-background-body p-0 sm:max-w-md"
        {...returnFocus}
      >
        {/* 头部 */}
        <SheetHeader className="sticky top-0 z-10 border-b border-border-subtle bg-background-surface px-4 py-3">
          <div className="flex items-center gap-3">
            {getDocTypeIcon(chunk.doc_type, chunk.document_name)}
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-base font-semibold text-text-primary">
                {documentName}
              </SheetTitle>
              <SheetDescription className="sr-only">
                {t('reference.sheet.description')}
              </SheetDescription>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="rounded bg-background-subtle px-1.5 py-0.5 text-xs text-text-tertiary">
                  {t(getDocTypeLabelKey(chunk.doc_type))}
                </span>
              </div>
            </div>
            {chunk.document_id && (
              <button
                type="button"
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md bg-state-focus-10 px-2.5 py-1.5 text-xs font-medium text-text-accent transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
                )}
                onClick={() => openDocumentPreview(chunk)}
                title={t('reference.openOriginalHint')}
              >
                <ExternalLink aria-hidden className="size-3.5" />
                {t('reference.sheet.openOriginal')}
              </button>
            )}
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t('common.close')}
              >
                <X className="size-icon-sm" />
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="space-y-4 px-4 py-4">
          {/* 内容 */}
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className={SECTION_TITLE_CLASS}>
                {t('reference.sheet.content')}
              </h3>
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1 rounded bg-background-subtle px-2 py-1 text-xs transition-colors',
                  'focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden',
                  contentCopied ? 'text-text-success' : 'text-text-tertiary',
                )}
                onClick={handleCopyContent}
              >
                {contentCopied ? (
                  <Check aria-hidden className="size-icon-xs" />
                ) : (
                  <Copy aria-hidden className="size-icon-xs" />
                )}
                {contentCopied
                  ? t('reference.sheet.copied')
                  : t('reference.sheet.copy')}
              </button>
            </div>
            <Watermark
              content={watermarkContent}
              font={{ fontSize: 12 }}
              gap={[80, 80]}
            >
              <div className="max-h-80 overflow-auto rounded-lg border border-border-subtle bg-background-subtle p-3">
                {isHtmlContent ? (
                  <SafeHtml
                    className="prose prose-sm max-w-none text-text-primary"
                    html={chunk.content || ''}
                    options={CHUNK_CONTENT_PURIFY_OPTIONS}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap text-text-primary">
                    {chunk.content || t('reference.sheet.noContent')}
                  </p>
                )}
              </div>
            </Watermark>
          </section>

          {/* 文档元数据（应用配置的字段，按纯文本展示） */}
          {hasDocumentMetadata && (
            <section>
              <h3 className={SECTION_TITLE_CLASS}>
                {t('reference.sheet.documentMetadata')}
              </h3>
              <ReferenceMetadataBadges metadata={chunk.document_metadata} />
            </section>
          )}

          {/* 同文档其他引用 */}
          {relatedChunks.length > 0 && (
            <section>
              <h3 className={cn(SECTION_TITLE_CLASS, 'mb-2')}>
                {t('reference.sheet.related', { count: relatedChunks.length })}
              </h3>
              <div className="space-y-2">
                {relatedChunks.map((relatedChunk, index) => (
                  <div
                    key={relatedChunk.id || index}
                    className="rounded-lg border border-border-subtle bg-background-subtle p-2"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded bg-background-default px-1.5 py-0.5 text-xs text-text-tertiary">
                        {t(getDocTypeLabelKey(relatedChunk.doc_type))}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-text-secondary">
                      {truncateText(toPlainText(relatedChunk.content), 100)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 检索诊断：检索匹配评分、原文位置与 ID */}
          <ReferenceDiagnostics chunk={chunk} onCopySuccess={onCopySuccess} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ReferenceDetailSheet
