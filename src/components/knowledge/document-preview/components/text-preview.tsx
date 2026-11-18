import { memo, type FC, type ReactNode } from 'react'
import XMarkdown, {
  type ComponentProps,
  type XMarkdownProps,
} from '@ant-design/x-markdown'
import { useTranslation } from 'react-i18next'
import { ErrorState } from './preview-state'

/**
 * Links and images keep relative targets and http(s)/mailto URLs; any other
 * scheme (javascript:, data:, vbscript:…) is dropped, as react-markdown's
 * default URL transform did.
 */
export function safeMarkdownUrl(value?: string): string | undefined {
  if (!value) return undefined
  const colon = value.indexOf(':')
  const relative =
    colon === -1 ||
    [value.indexOf('/'), value.indexOf('?'), value.indexOf('#')].some(
      (index) => index !== -1 && index < colon,
    )
  return relative || /^(https?|mailto):/i.test(value) ? value : undefined
}

const PreviewLink = ({
  href,
  title,
  children,
}: ComponentProps<{ href?: string; title?: string; children?: ReactNode }>) => {
  const target = safeMarkdownUrl(href)
  const external = target ? /^https?:/i.test(target) : false
  return (
    <a
      href={target}
      title={title}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  )
}

const PreviewImage = ({
  src,
  alt,
  title,
}: ComponentProps<{ src?: string; alt?: string; title?: string }>) => {
  const target = safeMarkdownUrl(src)
  return target ? (
    <img src={target} alt={alt ?? ''} title={title} loading="lazy" />
  ) : null
}

const COMPONENTS = { a: PreviewLink, img: PreviewImage }
const STATIC = { hasNextChunk: false }
// Document previews keep TeX literal (chat math belongs to the chat pipeline)
// and turn single newlines into breaks, as remark-breaks did.
const PREVIEW_CONFIG: XMarkdownProps['config'] = { gfm: true, breaks: true }

const TextContent: FC<{
  content?: string
  sourceUrl: string
  kind: 'txt' | 'md'
}> = ({ content, sourceUrl, kind }) => {
  const { t } = useTranslation()

  if (content === undefined) {
    return (
      <ErrorState
        fileKind={kind}
        title={
          kind === 'md'
            ? t('knowledge.preview.documentLoadFailed')
            : t('knowledge.preview.fileLoadFailed')
        }
        message={t('knowledge.preview.loadFailed')}
        url={sourceUrl}
      />
    )
  }

  if (kind === 'md') {
    return (
      <div className="scroll-area h-full w-full overflow-auto bg-surface px-space-lg py-space-lg">
        <div className="mx-auto prose prose-sm max-w-3xl">
          {/* Raw HTML in the file is shown as text, never parsed. */}
          <XMarkdown
            components={COMPONENTS}
            config={PREVIEW_CONFIG}
            streaming={STATIC}
            escapeRawHtml
          >
            {content}
          </XMarkdown>
        </div>
      </div>
    )
  }

  return (
    <div className="scroll-area h-full w-full overflow-auto bg-surface p-space-base">
      <pre className="font-mono text-sm leading-relaxed break-words whitespace-pre-wrap text-fg-muted">
        {content}
      </pre>
    </div>
  )
}

const TxtPreviewInner: FC<{ content?: string; sourceUrl: string }> = ({
  content,
  sourceUrl,
}) => <TextContent content={content} sourceUrl={sourceUrl} kind="txt" />

const MdPreviewInner: FC<{ content?: string; sourceUrl: string }> = ({
  content,
  sourceUrl,
}) => <TextContent content={content} sourceUrl={sourceUrl} kind="md" />

export const TxtPreview = memo(TxtPreviewInner)
export const MdPreview = memo(MdPreviewInner)
