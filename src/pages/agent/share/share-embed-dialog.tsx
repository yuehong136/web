import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormTooltip } from '@/components/ui/tooltip'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import {
  Copy,
  ExternalLink,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import {
  buildAgentEmbedCode,
  buildAgentFullscreenShareUrl,
  buildAgentWidgetShareUrl,
  type AgentEmbedType,
} from './access'
import { ShareOutputBlock } from './share-output-block'
import { ShareSettingSwitch } from './share-setting-switch'

interface ShareEmbedDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agentId: string
  title: string
  betaToken: string
  releaseDefault?: boolean
  tokenLoading?: boolean
  tokenError?: boolean
  onRefreshToken: () => void
}

export function ShareEmbedDialog({
  open,
  onOpenChange,
  agentId,
  title,
  betaToken,
  releaseDefault,
  tokenLoading,
  tokenError,
  onRefreshToken,
}: ShareEmbedDialogProps) {
  const [release, setRelease] = useState(Boolean(releaseDefault))
  const [visibleAvatar, setVisibleAvatar] = useState(true)
  const [locale, setLocale] = useState('zh-CN')
  const [theme, setTheme] = useState('light')
  const [userId, setUserId] = useState('')
  const [embedType, setEmbedType] = useState<AgentEmbedType>('fullscreen')
  const [streaming, setStreaming] = useState(false)

  const shareOptions = useMemo(
    () => ({
      agentId,
      betaToken,
      release,
      visibleAvatar,
      locale,
      theme,
      userId: userId.trim() || undefined,
      streaming,
    }),
    [
      agentId,
      betaToken,
      locale,
      release,
      streaming,
      theme,
      userId,
      visibleAvatar,
    ],
  )

  const shareUrl = useMemo(() => {
    if (!agentId || !betaToken) {
      return ''
    }

    return buildAgentFullscreenShareUrl(shareOptions)
  }, [agentId, betaToken, shareOptions])

  const previewUrl = useMemo(() => {
    if (!agentId || !betaToken) {
      return ''
    }

    if (embedType === 'widget') {
      return buildAgentWidgetShareUrl({
        ...shareOptions,
        mode: 'master',
      })
    }

    return shareUrl
  }, [agentId, betaToken, embedType, shareOptions, shareUrl])

  const iframeCode = useMemo(() => {
    if (!agentId || !betaToken) {
      return ''
    }

    return buildAgentEmbedCode({
      ...shareOptions,
      embedType,
    })
  }, [agentId, betaToken, embedType, shareOptions])

  const handleCopySharedId = async () => {
    try {
      await copyToClipboard(agentId)
      toast.success('shared_id 已复制')
    } catch {
      toast.error('复制 shared_id 失败')
    }
  }

  const handlePreview = () => {
    if (!previewUrl) {
      return
    }

    window.open(previewUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="3xl" className="overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-space-sm">
            <Share2 className="size-5 text-text-accent" />
            分享与嵌入
          </DialogTitle>
          <DialogDescription className="flex items-center gap-space-xs">
            <span>配置并生成对外公开的访问链接或嵌入代码。</span>
            <FormTooltip tooltip="链接使用第一条系统 API Token 的 beta 作为 auth，参数与 RAGFlow 标准 Share 链接保持一致。" />
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[76vh] overflow-auto px-space-lg pb-space-lg">
          <div className="grid items-stretch gap-space-lg lg:grid-cols-[0.9fr_1.25fr]">
            <section className="flex h-full flex-col rounded-radius-xl border border-border-default bg-surface-primary p-space-xl">
              <div className="flex h-full flex-col gap-space-lg">
                <div className="space-y-space-base">
                  <div className="flex items-start justify-between gap-space-md">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-secondary">
                        Agent 信息
                      </p>
                      <h3 className="mt-space-sm break-words text-3xl font-semibold text-text-primary">
                        {title || agentId}
                      </h3>
                    </div>
                    <Badge variant={betaToken ? 'secondary' : 'warning'}>
                      {betaToken ? 'Beta Token' : '缺少 Beta'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-space-sm text-sm text-text-secondary">
                    <span className="break-all">shared_id: {agentId}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleCopySharedId()}
                      aria-label="复制 shared_id"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {!betaToken ? (
                  <div className="rounded-radius-md border border-status-warning bg-surface-secondary p-space-sm text-sm text-text-secondary">
                    {tokenError
                      ? '系统 Token 读取失败，请刷新或到系统 Token 管理检查。'
                      : '未检测到第一条系统 API Token 的 beta。请先创建或刷新 Token；此处不会自动创建。'}
                  </div>
                ) : null}

                <div className="space-y-space-base border-t border-border-subtle pt-space-lg">
                  <p className="text-sm font-medium text-text-secondary">
                    访问配置
                  </p>
                  <div className="space-y-space-sm">
                    <ShareSettingSwitch
                      id="agent-share-release"
                      label="使用发布版本访问"
                      description="启用后生成的 URL 将包含 release=true。"
                      checked={release}
                      onCheckedChange={setRelease}
                    />
                    <ShareSettingSwitch
                      id="agent-share-avatar"
                      label="显示 Agent 头像"
                      description="控制公开访问页是否展示 Agent 头像。"
                      checked={visibleAvatar}
                      onCheckedChange={setVisibleAvatar}
                    />
                  </div>
                </div>

                <div className="space-y-space-md border-t border-border-subtle pt-space-lg">
                  <p className="text-sm font-medium text-text-secondary">
                    嵌入类型
                  </p>
                  <Tabs
                    value={embedType}
                    onValueChange={(value) =>
                      setEmbedType(value as AgentEmbedType)
                    }
                  >
                    <TabsList className="grid h-10 w-full grid-cols-2">
                      <TabsTrigger value="fullscreen" className="px-space-sm">
                        独立页面 iframe
                      </TabsTrigger>
                      <TabsTrigger value="widget" className="px-space-sm">
                        浮窗组件 widget
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {embedType === 'widget' ? (
                    <ShareSettingSwitch
                      id="agent-share-streaming"
                      label="启用流式响应"
                      description="启用后 widget 会实时展示模型输出；关闭时仅展示完整回复。"
                      checked={streaming}
                      onCheckedChange={setStreaming}
                    />
                  ) : null}
                </div>

                <div className="space-y-space-md border-t border-border-subtle pt-space-lg">
                  <p className="text-sm font-medium text-text-secondary">
                    展示配置
                  </p>
                  <div className="grid gap-space-lg sm:grid-cols-2">
                    <div className="space-y-space-sm">
                      <Label>语言</Label>
                      <Select value={locale} onValueChange={setLocale}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zh-CN">简体中文</SelectItem>
                          <SelectItem value="en-US">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-space-sm">
                      <Label>主题</Label>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger disabled={embedType === 'widget'}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Light</SelectItem>
                          <SelectItem value="dark">Dark</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-space-md border-t border-border-subtle pt-space-lg">
                  <div className="flex items-center gap-space-xs">
                    <Label>外部用户 ID</Label>
                    <FormTooltip tooltip="可用于在外部系统中隔离用户会话，生成链接时会作为 userId 参数传递。" />
                  </div>
                  <Input
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder="请输入外部用户 ID（可选）"
                  />
                </div>

                <div className="mt-auto grid gap-space-sm border-t border-border-subtle pt-space-lg sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={onRefreshToken}
                    disabled={tokenLoading}
                    title="重新读取系统 API Token。若 Token 已在后台变更，旧链接可能不再可用。"
                  >
                    <RefreshCw className="h-4 w-4" />
                    {tokenLoading ? '刷新中...' : '刷新 Token'}
                  </Button>
                  <Button onClick={handlePreview} disabled={!previewUrl}>
                    <ExternalLink className="h-4 w-4" />
                    预览体验
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-radius-xl border border-components-split-pane-border bg-components-split-pane-bg p-space-lg">
              <div className="space-y-space-lg">
                <div className="flex items-center justify-between gap-space-md">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">
                      Output
                    </p>
                    <h3 className="mt-space-xs text-lg font-semibold text-text-primary">
                      生成结果
                    </h3>
                  </div>
                  <Badge variant="outline">实时更新</Badge>
                </div>

                <ShareOutputBlock
                  title="独立访问链接"
                  description="通过该链接可在新窗口中独立访问 Agent。"
                  value={shareUrl}
                  emptyText="等待 beta token 后生成"
                  copyLabel="复制独立访问链接"
                />

                <div className="border-t border-border-subtle pt-space-lg">
                  <ShareOutputBlock
                    title="网页嵌入代码"
                    description={
                      embedType === 'widget'
                        ? '将以下代码嵌入到你的网站中，即可展示浮窗组件。'
                        : '将以下代码嵌入到你的网站中，即可在页面内展示 Agent。'
                    }
                    value={iframeCode}
                    emptyText="等待 beta token 后生成"
                    copyLabel="复制网页嵌入代码"
                    variant="html"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-space-md grid gap-space-sm text-sm text-text-secondary lg:grid-cols-2">
            <div className="flex items-center gap-space-sm">
              <ShieldCheck className="h-4 w-4 text-text-tertiary" />
              <span>分享链接和嵌入代码均受 Agent 访问权限控制。</span>
            </div>
            <div className="flex items-center gap-space-sm lg:justify-end">
              <Sparkles className="h-4 w-4 text-text-tertiary" />
              <span>配置项变更将实时更新链接与代码。</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
