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
import { API_BASE_URL } from '@/constants'
import {
  assertNonEmptyBlob,
  assertPreviewResponse,
  createPreviewObjectUrl,
  fetchPreviewResource,
  isAbortError,
  revokePreviewObjectUrl,
} from '@/lib/knowledge/preview-resource'

const ARTIFACT_URL_MARKER = '/document/artifact/'
const OBJECT_URL_REVOKE_DELAY_MS = 60 * 1000

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

export const isArtifactUrl = (url?: string): boolean =>
  Boolean(url && url.includes(ARTIFACT_URL_MARKER))

const decodeFilename = (filename: string): string => {
  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

const joinClassNames = (
  ...classNames: Array<string | false | null | undefined>
): string => classNames.filter(Boolean).join(' ')

export const resolveArtifactUrl = (url: string): string => {
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  if (url.startsWith('//')) {
    const protocol =
      typeof window !== 'undefined' ? window.location.protocol : 'http:'
    return `${protocol}${url}`
  }

  if (url.startsWith('/')) {
    return `${API_BASE_URL.replace(/\/$/, '')}${url}`
  }

  return new URL(url, `${API_BASE_URL.replace(/\/$/, '')}/`).toString()
}

export const getArtifactName = (url?: string, fallback?: string): string => {
  const trimmedFallback = fallback?.trim()
  if (trimmedFallback) return trimmedFallback

  if (!url) return 'artifact'

  try {
    const parsed = new URL(resolveArtifactUrl(url))
    const filename = parsed.pathname.split('/').filter(Boolean).pop()
    return filename ? decodeFilename(filename) : 'artifact'
  } catch {
    const filename = url.split('?')[0]?.split('#')[0]?.split('/').pop()
    return filename ? decodeFilename(filename) : 'artifact'
  }
}

export const fetchArtifactBlob = async (
  url: string,
  signal?: AbortSignal,
): Promise<Blob> => {
  const response = await fetchPreviewResource(resolveArtifactUrl(url), signal)
  await assertPreviewResponse(response)
  const blob = await response.blob()
  assertNonEmptyBlob(blob)
  return blob
}

export const downloadArtifactBlob = (blob: Blob, filename: string): void => {
  const objectUrl = createPreviewObjectUrl(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  revokePreviewObjectUrl(objectUrl)
}

const getDomAttribute = (
  domNode: ComponentProps['domNode'],
  attributeName: string,
): string | undefined =>
  (domNode as DomNodeWithAttributes | undefined)?.attribs?.[attributeName]

const scheduleObjectUrlRevoke = (objectUrl: string): void => {
  window.setTimeout(() => {
    revokePreviewObjectUrl(objectUrl)
  }, OBJECT_URL_REVOKE_DELAY_MS)
}

const ArtifactImage: FC<{
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

    setIsLoading(true)
    setHasError(false)
    setObjectUrl('')

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
              'agent.markdownArtifact.imageLoadFailed',
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
            'agent.markdownArtifact.downloadFailed',
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
            'rounded-radius-lg bg-surface-primary block max-w-full border border-border-subtle',
            className,
          )}
        />
      ) : (
        <span
          role={hasError ? 'alert' : 'status'}
          className={joinClassNames(
            'rounded-radius-lg bg-surface-secondary p-space-lg block border border-border-subtle text-sm text-text-secondary',
            className,
          )}
        >
          {hasError
            ? t(
                'agent.markdownArtifact.imageLoadFailed',
                'Failed to load artifact image',
              )
            : isLoading
              ? t(
                  'agent.markdownArtifact.imageLoading',
                  'Loading artifact image...',
                )
              : null}
        </span>
      )}
      <button
        type="button"
        className="mt-space-xs gap-space-xs rounded-radius-sm hover:text-text-accent/80 inline-flex items-center text-sm font-medium text-text-accent disabled:cursor-not-allowed disabled:text-text-tertiary"
        disabled={isDownloading}
        onClick={handleDownload}
      >
        <Download className="size-icon-sm" aria-hidden="true" />
        {isDownloading
          ? t('agent.markdownArtifact.downloading', 'Downloading...')
          : t('common.download', 'Download')}
      </button>
    </span>
  )
}

const ArtifactLink: FC<{
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
        const blob = await fetchArtifactBlob(href)
        const objectUrl = createPreviewObjectUrl(blob)
        const openedWindow = window.open(
          objectUrl,
          '_blank',
          'noopener,noreferrer',
        )

        if (openedWindow) {
          scheduleObjectUrlRevoke(objectUrl)
        } else {
          downloadArtifactBlob(blob, getArtifactName(href))
          revokePreviewObjectUrl(objectUrl)
        }
      } catch (error) {
        if (!isAbortError(error)) {
          toast.error(
            t('agent.markdownArtifact.openFailed', 'Failed to open artifact'),
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
      href={href}
      className={joinClassNames(
        'gap-space-xs hover:text-text-accent/80 inline-flex items-center text-text-accent',
        className,
      )}
      onClick={handleClick}
    >
      <span>{children}</span>
      <ExternalLink className="size-icon-sm" aria-hidden="true" />
      {isOpening ? (
        <span className="sr-only">
          {t('agent.markdownArtifact.opening', 'Opening artifact...')}
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
  const resolvedHref = href || getDomAttribute(domNode, 'href') || ''

  if (isArtifactUrl(resolvedHref)) {
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
  const resolvedSrc = src || getDomAttribute(domNode, 'src') || ''
  const resolvedAlt = alt || getDomAttribute(domNode, 'alt') || ''

  if (isArtifactUrl(resolvedSrc)) {
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
