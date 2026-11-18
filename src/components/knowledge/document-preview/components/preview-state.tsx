import type { FC, ReactNode } from 'react'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { FileKindTile } from '@/components/patterns/file-kind-tile'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export const LoadingState: FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation()
  return (
    <div className="flex h-full w-full items-center justify-center bg-sunken">
      <Spinner
        size="lg"
        stacked
        label={message ?? t('knowledge.preview.loading')}
      />
    </div>
  )
}

/**
 * The file's identity for a preview state: its type tile when the name or
 * type is known, otherwise a neutral document glyph.
 */
export const PreviewFileMark: FC<{ name?: string; icon?: ReactNode }> = ({
  name,
  icon,
}) =>
  name ? (
    <FileKindTile
      name={name}
      size="lg"
      className="size-14 rounded-radius-xl text-sm"
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex size-14 items-center justify-center rounded-radius-xl bg-fill-muted text-fg-subtle [&_svg]:size-icon-lg"
    >
      {icon ?? <FileText />}
    </span>
  )

export const ErrorState: FC<{
  icon?: ReactNode
  title?: string
  message?: string
  url?: string
  filename?: string
  /** File name or extension for the type tile, e.g. "report.pdf" or "pdf". */
  fileKind?: string
}> = ({ icon, title, message, url, filename, fileKind }) => {
  const { t } = useTranslation()
  return (
    <div
      role="alert"
      className="flex h-full w-full flex-col items-center justify-center gap-space-md bg-sunken p-space-xl text-center"
    >
      <PreviewFileMark name={fileKind ?? filename} icon={icon} />
      <div className="flex max-w-sm flex-col gap-space-xs">
        <p className="text-base font-medium text-fg">
          {title ?? t('knowledge.preview.loadFailed')}
        </p>
        <p className="text-sm text-fg-muted">
          {message ?? t('knowledge.preview.unknownError')}
        </p>
      </div>
      {url && (
        <div className="flex flex-wrap justify-center gap-space-sm">
          <Button variant="outline" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-icon-sm" aria-hidden="true" />
              {t('knowledge.preview.openInNewWindow')}
            </a>
          </Button>
          {filename && (
            <Button variant="outline" asChild>
              <a href={url} download={filename}>
                <Download className="size-icon-sm" aria-hidden="true" />
                {t('knowledge.preview.download')}
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
