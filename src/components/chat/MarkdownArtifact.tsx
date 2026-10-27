import {
  memo,
  useCallback,
  useEffect,
  useState,
  type FC,
  type MouseEvent,
  type ReactNode,
} from 'react'
import type { ComponentProps } from '@ant-design/x-markdown'
import { Download, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { isSafeMarkdownImageSource } from '@/components/chat/markdown-image-source'
import { isArtifactUrl, resolveArtifactUrl } from '@/lib/agent/artifact-url'
import {
  createPreviewObjectUrl,
  isAbortError,
  revokePreviewObjectUrl,
} from '@/lib/knowledge/preview-resource'
import {
  downloadArtifactBlob,
  fetchArtifactBlob,
  getArtifactName,
  openArtifactResource,
} from '@/components/chat/artifact-resource'
import { ArtifactCard } from '@/components/chat/artifact-card'
import { useChatWorkspace } from '@/components/chat/chat-workspace-context'
import { useArtifactMessageId } from '@/components/chat/artifact-message-context'

export {
  downloadArtifactBlob,
  fetchArtifactBlob,
  getArtifactName,
  isArtifactUrl,
  openArtifactResource,
  resolveArtifactUrl,
  shouldForceArtifactDownload,
} from '@/components/chat/artifact-resource'

type DomNodeWithAttributes = {
  attribs?: Record<string, string | undefined>
}

type MarkdownAnchorProps = ComponentProps<{
  href?: string
  target?: string
  rel?: string
}>

type MarkdownImageProps = ComponentProps<{
  src?: string
  alt?: string
}>

const getDomAttribute = (
  domNode: ComponentProps['domNode'],
  attributeName: string,
): string | undefined =>
  (domNode as DomNodeWithAttributes | undefined)?.attribs?.[attributeName]

const joinClassNames = (
  ...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(' ')

const ArtifactImage: FC<{
  src: string
  alt?: string
  className?: string
}> = (props) => <ArtifactImageResource key={props.src} {...props} />

const ArtifactImageResource: FC<{
  src: string
  alt?: string
  className?: string
}> = ({ src, alt, className }) => {
  const { t } = useTranslation()
  const [objectUrl, setObjectUrl] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    let nextObjectUrl = ''

    void fetchArtifactBlob(src, controller.signal)
      .then((blob) => {
        nextObjectUrl = createPreviewObjectUrl(blob)
        if (active) {
          setObjectUrl(nextObjectUrl)
          setIsLoading(false)
        } else {
          revokePreviewObjectUrl(nextObjectUrl)
        }
      })
      .catch((error) => {
        if (isAbortError(error)) return
        if (active) {
          setHasError(true)
          setIsLoading(false)
          toast.error(
            t(
              'chat.markdownArtifact.imageLoadFailed',
              'Failed to load artifact image',
            ),
          )
        }
      })

    return () => {
      active = false
      controller.abort()
      revokePreviewObjectUrl(nextObjectUrl)
    }
  }, [src, t])

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    try {
      const blob = await fetchArtifactBlob(src)
      downloadArtifactBlob(blob, getArtifactName(src, alt))
    } catch (error) {
      if (!isAbortError(error)) {
        toast.error(
          t(
            'chat.markdownArtifact.downloadFailed',
            'Failed to download artifact',
          ),
        )
      }
    } finally {
      setIsDownloading(false)
    }
  }, [alt, src, t])

  return (
    <span className="my-space-sm block max-w-full">
      {objectUrl ? (
        <img
          src={objectUrl}
          alt={alt || ''}
          className={joinClassNames(
            'block max-w-full rounded-radius-lg border border-border-subtle bg-surface-primary',
            className,
          )}
        />
      ) : (
        <span
          role={hasError ? 'alert' : 'status'}
          className={joinClassNames(
            'block rounded-radius-lg border border-border-subtle bg-surface-secondary p-space-lg text-sm text-text-secondary',
            className,
          )}
        >
          {hasError
            ? t(
                'chat.markdownArtifact.imageLoadFailed',
                'Failed to load artifact image',
              )
            : isLoading
              ? t(
                  'chat.markdownArtifact.imageLoading',
                  'Loading artifact image...',
                )
              : null}
        </span>
      )}
      <button
        type="button"
        className="mt-space-xs inline-flex items-center gap-space-xs rounded-radius-sm text-sm font-medium text-text-accent hover:text-text-accent/80 disabled:cursor-not-allowed disabled:text-text-tertiary"
        disabled={isDownloading}
        onClick={handleDownload}
      >
        <Download className="size-icon-sm" aria-hidden="true" />
        {isDownloading
          ? t('chat.markdownArtifact.downloading', 'Downloading...')
          : t('common.download', 'Download')}
      </button>
    </span>
  )
}

export const ArtifactLink: FC<{
  href: string
  className?: string
  children: ReactNode
}> = ({ href, className, children }) => {
  const { t } = useTranslation()
  const [isOpening, setIsOpening] = useState(false)

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault()
      if (isOpening) return

      setIsOpening(true)
      try {
        await openArtifactResource(href)
      } catch (error) {
        if (!isAbortError(error)) {
          toast.error(
            t('chat.markdownArtifact.openFailed', 'Failed to open artifact'),
          )
        }
      } finally {
        setIsOpening(false)
      }
    },
    [href, isOpening, t],
  )

  return (
    <a
      href={resolveArtifactUrl(href)}
      className={joinClassNames(
        'inline-flex items-center gap-space-xs text-text-accent hover:text-text-accent/80',
        className,
      )}
      onClick={handleClick}
    >
      <span>{children}</span>
      <ExternalLink className="size-icon-sm" aria-hidden="true" />
      {isOpening ? (
        <span className="sr-only">
          {t('chat.markdownArtifact.opening', 'Opening artifact...')}
        </span>
      ) : null}
    </a>
  )
}

export const MarkdownArtifactLink: FC<MarkdownAnchorProps> = ({
  href,
  children,
  className,
  domNode,
  streamStatus: _streamStatus,
  ...rest
}) => {
  const workspace = useChatWorkspace()
  const messageId = useArtifactMessageId()
  const resolvedHref = href || getDomAttribute(domNode, 'href') || ''

  if (isArtifactUrl(resolvedHref)) {
    if (workspace && messageId)
      return <ArtifactCard url={resolvedHref} messageId={messageId} />
    return (
      <ArtifactLink href={resolvedHref} className={className}>
        {children}
      </ArtifactLink>
    )
  }

  return (
    <a href={resolvedHref} className={className} {...rest}>
      {children}
    </a>
  )
}

export const MarkdownArtifactImage: FC<MarkdownImageProps> = ({
  src,
  alt,
  className,
  children: _children,
  domNode,
  streamStatus: _streamStatus,
  ...rest
}) => {
  const workspace = useChatWorkspace()
  const messageId = useArtifactMessageId()
  const resolvedSrc = src || getDomAttribute(domNode, 'src') || ''
  const resolvedAlt = alt || getDomAttribute(domNode, 'alt') || ''

  if (!isSafeMarkdownImageSource(resolvedSrc)) return null

  if (isArtifactUrl(resolvedSrc)) {
    if (workspace && messageId)
      return <ArtifactCard url={resolvedSrc} messageId={messageId} />
    return (
      <ArtifactImage
        src={resolvedSrc}
        alt={resolvedAlt}
        className={className}
      />
    )
  }

  return (
    <img
      src={resolvedSrc}
      alt={resolvedAlt}
      className={joinClassNames('max-w-full', className)}
      {...rest}
    />
  )
}

export const MemoizedMarkdownArtifactLink = memo(MarkdownArtifactLink)
export const MemoizedMarkdownArtifactImage = memo(MarkdownArtifactImage)
