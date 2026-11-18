import { ExternalLink, Paperclip } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ArtifactLink } from '@/components/chat/MarkdownArtifact'
import { isArtifactUrl } from '@/lib/agent/artifact-url'
import { parseCodeExecAttachmentLink } from '../utils'

export function CodeExecAttachmentList({
  attachments,
}: {
  attachments: string[]
}) {
  const { t } = useTranslation()

  if (attachments.length === 0) return null

  return (
    <section className="rounded-radius-lg border border-line-subtle bg-sunken p-space-base">
      <div className="mb-space-sm flex items-center gap-space-sm">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-radius-md bg-accent-soft text-accent-fg">
          <Paperclip className="size-4" />
        </span>
        <div className="min-w-0">
          <h5 className="text-sm font-semibold text-fg">
            {t('flow.attachments', 'Attachments')}
          </h5>
          <p className="text-xs leading-5 text-fg-muted">
            {t('flow.codeAttachmentsTip', 'Files produced by this code run.')}
          </p>
        </div>
      </div>

      <div className="space-y-space-xs">
        {attachments.map((attachment, index) => {
          const link = parseCodeExecAttachmentLink(attachment)
          const linkClassName =
            'gap-space-xs flex min-w-0 items-center text-accent-fg hover:underline'

          return (
            <div
              key={`${attachment}-${index}`}
              className="rounded-radius-md border border-line-subtle bg-surface px-space-sm py-space-xs text-sm"
            >
              {link.href && isArtifactUrl(link.href) ? (
                <ArtifactLink href={link.href} className={linkClassName}>
                  <span className="truncate">{link.label}</span>
                </ArtifactLink>
              ) : link.href ? (
                <a
                  className={linkClassName}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="truncate">{link.label}</span>
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              ) : (
                <span className="break-words text-fg">{link.label}</span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
