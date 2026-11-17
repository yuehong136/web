import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/lib/toast'
import { copyToClipboard, formatTimestampDetailed } from '@/lib/utils'
import {
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  History,
  Link2,
  Rocket,
} from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Version {
  id: string
  name: string
  createdAt: string
  description?: string
  release?: boolean
}

interface PublishConfirmDialogProps {
  hideModal?: () => void
  title: string
  versions?: Version[]
  isPublished?: boolean
  lastPublishedAt?: number
  publishLoading?: boolean
  publishedShareUrl?: string
  tokenReady?: boolean
  onPublish: (note: string) => Promise<void>
  onOpenWebhook: () => void
  onOpenExplore: () => void
}

export function VersionDialog({
  hideModal,
  title,
  versions = [],
  isPublished,
  lastPublishedAt,
  publishLoading,
  publishedShareUrl,
  tokenReady,
  onPublish,
  onOpenWebhook,
  onOpenExplore,
}: PublishConfirmDialogProps) {
  const { t } = useTranslation()
  const [releaseNote, setReleaseNote] = useState('')
  const [hasPublished, setHasPublished] = useState(false)

  const handlePublish = async () => {
    await onPublish(releaseNote)
    setHasPublished(true)
  }

  const handleCopyShareUrl = async () => {
    if (!publishedShareUrl) {
      return
    }

    try {
      await copyToClipboard(publishedShareUrl)
      toast.success(t('agent.share.copied'))
    } catch {
      toast.error(t('agent.share.copyFailed'))
    }
  }

  const publishedAtLabel = lastPublishedAt
    ? formatTimestampDetailed(lastPublishedAt)
    : t('agent.delivery.version.neverPublished')
  const showSuccess = hasPublished && Boolean(publishedShareUrl)

  return (
    <Dialog open onOpenChange={() => hideModal?.()}>
      <DialogContent size="xl" className="overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <Rocket className="size-5 text-text-accent" />
            {t('agent.delivery.version.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-space-lg overflow-auto px-space-lg pb-space-lg lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-space-lg">
            <div className="rounded-radius-lg border border-border-default bg-surface-secondary p-space-base">
              <div className="flex items-start justify-between gap-space-sm">
                <div>
                  <p className="text-sm text-text-tertiary">
                    {t('agent.delivery.version.asset')}
                  </p>
                  <p className="mt-space-xs text-base font-semibold text-text-primary">
                    {title}
                  </p>
                </div>
                <Badge variant={isPublished ? 'success' : 'secondary'}>
                  {isPublished
                    ? t('agent.delivery.version.published')
                    : t('agent.delivery.version.unpublished')}
                </Badge>
              </div>
              <p className="mt-space-md flex items-center gap-space-xs text-sm text-text-secondary">
                <Clock className="h-4 w-4" />
                {t('agent.delivery.version.lastPublished', {
                  time: publishedAtLabel,
                })}
              </p>
            </div>

            <div className="space-y-space-sm">
              <p className="text-sm font-medium text-text-primary">
                {t('agent.delivery.version.releaseNote')}
              </p>
              <Textarea
                value={releaseNote}
                onChange={(event) => setReleaseNote(event.target.value)}
                rows={4}
                placeholder={t('agent.delivery.version.releaseNotePlaceholder')}
              />
              <p className="text-xs text-text-secondary">
                {t('agent.delivery.version.releaseHint')}
              </p>
            </div>

            {!tokenReady ? (
              <div className="rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm text-sm text-text-secondary">
                {t('agent.delivery.version.tokenMissing')}
              </div>
            ) : null}

            <Button
              onClick={() => void handlePublish()}
              disabled={publishLoading}
            >
              <Rocket className="mr-space-xs h-4 w-4" />
              {publishLoading
                ? t('agent.delivery.version.publishing')
                : t('agent.delivery.version.publish')}
            </Button>

            {showSuccess ? (
              <div className="space-y-space-sm rounded-radius-lg border border-border-default bg-surface-secondary p-space-base">
                <div className="flex items-center gap-space-xs text-sm font-medium text-text-primary">
                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                  {t('agent.delivery.version.publishDone')}
                </div>
                <p className="text-xs break-all text-text-secondary">
                  {publishedShareUrl}
                </p>
                <div className="flex flex-wrap gap-space-sm">
                  <Button
                    variant="outline"
                    onClick={() => void handleCopyShareUrl()}
                  >
                    <Copy className="mr-space-xs h-4 w-4" />
                    {t('agent.delivery.version.copyShare')}
                  </Button>
                  <Button variant="outline" onClick={onOpenWebhook}>
                    <Link2 className="mr-space-xs h-4 w-4" />
                    {t('agent.delivery.version.webhook')}
                  </Button>
                  <Button variant="outline" onClick={onOpenExplore}>
                    <Compass className="mr-space-xs h-4 w-4" />
                    {t('agent.delivery.version.explore')}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-space-sm">
            <div className="flex items-center gap-space-xs text-sm font-medium text-text-primary">
              <History className="h-4 w-4" />
              {t('agent.delivery.version.history')}
            </div>
            {versions.length === 0 ? (
              <div className="rounded-radius-lg border border-border-subtle bg-surface-secondary p-space-lg text-center text-sm text-text-secondary">
                {t('agent.delivery.version.historyEmpty')}
              </div>
            ) : (
              <div className="space-y-space-sm">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className="rounded-radius-lg border border-border-default bg-surface-secondary p-space-base"
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div>
                        <p className="font-medium text-text-primary">
                          {version.name}
                        </p>
                        <p className="mt-space-xs text-sm text-text-secondary">
                          {version.createdAt ||
                            t('agent.delivery.version.noTime')}
                        </p>
                      </div>
                      {version.release ? (
                        <Badge variant="success">
                          {t('agent.delivery.version.releasedBadge')}
                        </Badge>
                      ) : null}
                    </div>
                    {version.description ? (
                      <p className="mt-space-sm text-sm text-text-tertiary">
                        {version.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
