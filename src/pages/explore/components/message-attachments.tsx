import { useTranslation } from 'react-i18next'
import { FileIcon, getFileCategory } from '@/components/ui/file-icon'
import {
  DocumentImage,
  DocumentImagePreviewProvider,
} from '@/components/knowledge/document-image'
import type { UploadedFileInfo } from '@/config/chat'
import { formatBytes } from '@/lib/utils'

export function ExploreMessageAttachments({
  files,
}: {
  files?: UploadedFileInfo[]
}) {
  const { t } = useTranslation()
  if (!files?.length) return null
  const images = files.filter((f) => f.mime_type?.startsWith('image/'))
  const others = files.filter((f) => !f.mime_type?.startsWith('image/'))
  return (
    <div className="mt-3 grid gap-2">
      {!!images.length && (
        <DocumentImagePreviewProvider
          resetKey={images.map((f) => f.id).join('|')}
        >
          <div
            className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}
          >
            {images.map((file) => (
              <div
                key={file.id}
                className="overflow-hidden rounded-xl border border-border-subtle bg-background-subtle"
              >
                <DocumentImage
                  source={{ kind: 'runtime', fileId: file.id }}
                  alt={file.name}
                  preview
                  className="max-h-64 w-full object-contain"
                />
                <div className="truncate px-3 py-1.5 text-xs text-text-secondary">
                  {file.name} · {formatBytes(file.size || 0)}
                </div>
              </div>
            ))}
          </div>
        </DocumentImagePreviewProvider>
      )}
      {others.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 rounded-xl border border-border-subtle bg-background-subtle px-3 py-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-subtle">
            <FileIcon fileName={file.name} size="md" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{file.name}</div>
            <div className="text-xs text-text-secondary">
              {getFileCategory(file.extension || '') === 'image'
                ? t('explore.attachmentStatus.image')
                : file.extension?.toUpperCase() || 'FILE'}{' '}
              · {formatBytes(file.size || 0)}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
