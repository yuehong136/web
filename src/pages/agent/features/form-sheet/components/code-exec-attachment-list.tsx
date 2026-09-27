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
    <section className="rounded-radius-lg bg-surface-secondary p-space-base border border-border-subtle">
      <div className="mb-space-sm gap-space-sm flex items-center">
        <span className="rounded-radius-md flex size-8 shrink-0 items-center justify-center bg-components-system-accent-soft text-components-system-accent-text">
          <Paperclip className="size-4" />
        </span>
        <div className="min-w-0">
          <h5 className="text-sm font-semibold text-text-primary">
            {t('flow.attachments', 'Attachments')}
          </h5>
          <p className="text-xs leading-5 text-text-secondary">
            {t('flow.codeAttachmentsTip', 'Files produced by this code run.')}
          </p>
        </div>
      </div>

      <div className="space-y-space-xs">
        {attachments.map((attachment, index) => {
          const link = parseCodeExecAttachmentLink(attachment)
          const linkClassName =
            'gap-space-xs flex min-w-0 items-center text-components-system-accent-text hover:underline'

          return (
            <div
              key={`${attachment}-${index}`}
              className="rounded-radius-md bg-surface-primary px-space-sm py-space-xs border border-border-subtle text-sm"
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
                <span className="break-words text-text-primary">
                  {link.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
