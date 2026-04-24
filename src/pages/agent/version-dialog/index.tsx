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
      toast.success('Share 链接已复制')
    } catch {
      toast.error('复制失败，请手动复制 Share 链接')
    }
  }

  const publishedAtLabel = lastPublishedAt
    ? formatTimestampDetailed(lastPublishedAt)
    : '尚未发布'
  const showSuccess = hasPublished && Boolean(publishedShareUrl)

  return (
    <Dialog open onOpenChange={() => hideModal?.()}>
      <DialogContent size="xl" className="overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <Rocket className="size-5 text-text-accent" />
            发布 Agent
          </DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[70vh] gap-space-lg overflow-auto px-space-lg pb-space-lg lg:grid-cols-[0.9fr_1.1fr]">
          <section className="space-y-space-lg">
            <div className="rounded-radius-lg border border-border-default bg-surface-secondary p-space-base">
              <div className="flex items-start justify-between gap-space-sm">
                <div>
                  <p className="text-sm text-text-tertiary">资产</p>
                  <p className="mt-space-xs text-base font-semibold text-text-primary">
                    {title}
                  </p>
                </div>
                <Badge variant={isPublished ? 'success' : 'secondary'}>
                  {isPublished ? '已发布' : '未发布'}
                </Badge>
              </div>
              <p className="mt-space-md flex items-center gap-space-xs text-sm text-text-secondary">
                <Clock className="h-4 w-4" />
                上次发布：{publishedAtLabel}
              </p>
            </div>

            <div className="space-y-space-sm">
              <p className="text-sm font-medium text-text-primary">
                发布说明
              </p>
              <Textarea
                value={releaseNote}
                onChange={(event) => setReleaseNote(event.target.value)}
                rows={4}
                placeholder="记录本次发布的变更点"
              />
              <p className="text-xs text-text-secondary">
                发布会保存当前画布并生成 released version；运行端可通过 release=true 使用已发布版本。
              </p>
            </div>

            {!tokenReady ? (
              <div className="rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm text-sm text-text-secondary">
                未检测到 beta token。确认发布时会通过系统 token API 创建一个默认交付 token，用于生成 Share 链接。
              </div>
            ) : null}

            <Button onClick={() => void handlePublish()} disabled={publishLoading}>
              <Rocket className="mr-space-xs h-4 w-4" />
              {publishLoading ? '发布中...' : '确认发布'}
            </Button>

            {showSuccess ? (
              <div className="space-y-space-sm rounded-radius-lg border border-border-default bg-surface-secondary p-space-base">
                <div className="flex items-center gap-space-xs text-sm font-medium text-text-primary">
                  <CheckCircle2 className="h-4 w-4 text-status-success" />
                  发布完成
                </div>
                <p className="break-all text-xs text-text-secondary">
                  {publishedShareUrl}
                </p>
                <div className="flex flex-wrap gap-space-sm">
                  <Button
                    variant="outline"
                    onClick={() => void handleCopyShareUrl()}
                  >
                    <Copy className="mr-space-xs h-4 w-4" />
                    复制 Share
                  </Button>
                  <Button variant="outline" onClick={onOpenWebhook}>
                    <Link2 className="mr-space-xs h-4 w-4" />
                    Webhook
                  </Button>
                  <Button variant="outline" onClick={onOpenExplore}>
                    <Compass className="mr-space-xs h-4 w-4" />
                    Explore
                  </Button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-space-sm">
            <div className="flex items-center gap-space-xs text-sm font-medium text-text-primary">
              <History className="h-4 w-4" />
              版本历史
            </div>
            {versions.length === 0 ? (
              <div className="rounded-radius-lg border border-border-subtle bg-surface-secondary p-space-lg text-center text-sm text-text-secondary">
                暂无版本记录
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
                          {version.createdAt || '无时间信息'}
                        </p>
                      </div>
                      {version.release ? (
                        <Badge variant="success">Published</Badge>
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
