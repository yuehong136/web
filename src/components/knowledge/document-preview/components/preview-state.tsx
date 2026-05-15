import type { FC, ReactNode } from 'react'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export const LoadingState: FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation()
  return (
    <div className="flex h-full w-full items-center justify-center bg-background-subtle">
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-10 w-10 animate-spin rounded-full border-b-2"
          style={{ borderColor: 'var(--color-text-accent)' }}
        />
        <span className="text-sm text-text-secondary">
          {message ?? t('knowledge.preview.loading')}
        </span>
      </div>
    </div>
  )
}

export const ErrorState: FC<{
  icon?: ReactNode
  title?: string
  message?: string
  url?: string
  filename?: string
}> = ({
  icon = <FileText className="h-16 w-16" />,
  title,
  message,
  url,
  filename,
}) => {
  const { t } = useTranslation()
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background-subtle p-8">
      <div className="mb-4 text-text-muted">{icon}</div>
      <p className="mb-2 text-base font-medium text-text-primary">
        {title ?? t('knowledge.preview.loadFailed')}
      </p>
      <p className="mb-6 max-w-sm text-center text-sm text-text-secondary">
        {message ?? t('knowledge.preview.unknownError')}
      </p>
      {url && (
        <div className="flex gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-background-surface px-4 py-2 text-text-accent transition-colors hover:bg-state-hover"
          >
            <ExternalLink className="h-4 w-4" />
            {t('knowledge.preview.openInNewWindow')}
          </a>
          {filename && (
            <a
              href={url}
              download={filename}
              className="inline-flex items-center gap-2 rounded-lg border border-border-default bg-background-surface px-4 py-2 text-text-primary transition-colors hover:bg-state-hover"
            >
              <Download className="h-4 w-4" />
              {t('knowledge.preview.download')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
