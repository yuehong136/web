import type { CSSProperties, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import { RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { APIError } from '@/api/client'
import type { DocumentImageSource } from '@/api/document-images'
import {
  useDocumentImage,
  useDocumentImageEpoch,
} from '@/hooks/use-document-image'
import { cn } from '@/lib/utils'
import 'react-photo-view/dist/react-photo-view.css'

export function DocumentImagePreviewProvider({
  children,
  resetKey,
}: {
  children: ReactNode
  resetKey: string
}) {
  const epoch = useDocumentImageEpoch()
  const { t } = useTranslation()
  return (
    <PhotoProvider
      key={`${epoch}:${resetKey}`}
      toolbarRender={({ rotate, onRotate, scale, onScale }) => (
        <>
          <button
            type="button"
            aria-label={t('common.documentImage.rotate')}
            onClick={() => onRotate(rotate + 90)}
          >
            <RotateCw />
          </button>
          <button
            type="button"
            aria-label={t('common.documentImage.zoomIn')}
            onClick={() => onScale(scale + 0.5)}
          >
            <ZoomIn />
          </button>
          <button
            type="button"
            aria-label={t('common.documentImage.zoomOut')}
            onClick={() => onScale(Math.max(0.5, scale - 0.5))}
          >
            <ZoomOut />
          </button>
        </>
      )}
    >
      {children}
    </PhotoProvider>
  )
}

interface DocumentImageProps {
  source: DocumentImageSource | null
  alt: string
  className?: string
  style?: CSSProperties
  preview?: boolean
  onClick?: () => void
  retryable?: boolean
}

/** Feature container: native img / PhotoView only ever receive owned blobs. */
export function DocumentImage({
  source,
  alt,
  className,
  style,
  preview = false,
  onClick,
  retryable = true,
}: DocumentImageProps) {
  const { t } = useTranslation()
  const image = useDocumentImage(source)
  if (!image.objectUrl)
    return <DocumentImageFeedback image={image} retryable={retryable} />
  const content = (
    <img
      src={image.objectUrl}
      alt={alt}
      className={className}
      style={style}
      onClick={preview ? onClick : undefined}
    />
  )
  return preview ? (
    <PhotoView src={image.objectUrl}>
      <button
        type="button"
        className="block w-full"
        aria-label={t('common.documentImage.preview')}
      >
        {content}
      </button>
    </PhotoView>
  ) : onClick ? (
    <button
      type="button"
      className="block w-full"
      onClick={onClick}
      aria-label={alt}
    >
      {content}
    </button>
  ) : (
    content
  )
}

export function DocumentImageFeedback({
  image,
  className,
  retryable = true,
}: {
  image: ReturnType<typeof useDocumentImage>
  className?: string
  retryable?: boolean
}) {
  const { t } = useTranslation()
  const error = image.error
  const key =
    error instanceof APIError && [401, 403].includes(error.status)
      ? 'auth'
      : error instanceof APIError &&
          (error.status === 415 ||
            (error.code === '102' && error.status === 200))
        ? 'invalid'
        : 'unavailable'
  return (
    <div
      className={cn(
        'flex min-h-16 flex-col items-center justify-center gap-2 rounded bg-background-subtle p-2 text-sm text-text-tertiary',
        className,
      )}
      role={error ? 'status' : undefined}
    >
      <span>
        {t(`common.documentImage.${image.isLoading ? 'loading' : key}`)}
      </span>
      {retryable &&
        !!error &&
        !(error instanceof APIError && [401, 403].includes(error.status)) && (
          <button
            type="button"
            onClick={image.retry}
            className="text-text-accent underline"
          >
            {t('common.documentImage.retry')}
          </button>
        )}
    </div>
  )
}
