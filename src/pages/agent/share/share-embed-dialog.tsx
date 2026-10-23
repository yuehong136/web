import { useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { WidgetCustomization } from './widget-customization'
import { normalizeWidgetSettings, type WidgetSettings } from './widget-settings'
import { useTranslation } from 'react-i18next'
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
import { getCurrentLanguage, supportedLocales } from '@/locales/i18n'
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
  initialWidgetSettings?: unknown
  onSaveWidgetSettings?: (settings: WidgetSettings) => Promise<void>
  savingWidgetSettings?: boolean
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
  initialWidgetSettings,
  onSaveWidgetSettings,
  savingWidgetSettings,
}: ShareEmbedDialogProps) {
  const { t } = useTranslation()
  const form = useForm<WidgetSettings>({
    defaultValues: normalizeWidgetSettings({
      published: Boolean(releaseDefault),
      locale: getCurrentLanguage(),
      ...(initialWidgetSettings && typeof initialWidgetSettings === 'object'
        ? initialWidgetSettings
        : {}),
    }),
  })
  const settings = useWatch({ control: form.control }) as WidgetSettings
  const {
    published: release,
    visibleAvatar,
    locale,
    theme,
    userId,
    embedType,
    enableStreaming: streaming,
  } = settings
  const setRelease = (value: boolean) => form.setValue('published', value)
  const setVisibleAvatar = (value: boolean) =>
    form.setValue('visibleAvatar', value)
  const setLocale = (value: string) => form.setValue('locale', value)
  const setTheme = (value: string) =>
    form.setValue('theme', value as WidgetSettings['theme'])
  const setUserId = (value: string) => form.setValue('userId', value)
  const setEmbedType = (value: AgentEmbedType) =>
    form.setValue('embedType', value)
  const setStreaming = (value: boolean) =>
    form.setValue('enableStreaming', value)
  const saveSettings = async () => {
    if (!onSaveWidgetSettings) return
    try {
      await onSaveWidgetSettings(normalizeWidgetSettings(form.getValues()))
      toast.success(t('agent.shareEmbed.settingsSaved'))
    } catch {
      toast.error(t('agent.shareEmbed.settingsSaveFailed'))
    }
  }

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
      widgetSettings: settings,
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
      settings,
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
      toast.success(t('agent.shareEmbed.sharedIdCopied', 'shared_id 已复制'))
    } catch {
      toast.error(
        t('agent.shareEmbed.sharedIdCopyFailed', '复制 shared_id 失败'),
      )
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
            {t('agent.shareEmbed.title', '分享与嵌入')}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-space-xs">
            <span>
              {t(
                'agent.shareEmbed.description',
                '配置并生成对外公开的访问链接或嵌入代码。',
              )}
            </span>
            <FormTooltip
              tooltip={t(
                'agent.shareEmbed.betaTokenTip',
                '链接使用第一条系统 API Token 的 beta 作为 auth，参数与 RAGFlow 标准 Share 链接保持一致。',
              )}
            />
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
                        {t('agent.shareEmbed.agentInfo', 'Agent 信息')}
                      </p>
                      <h3 className="mt-space-sm text-3xl font-semibold break-words text-text-primary">
                        {title || agentId}
                      </h3>
                    </div>
                    <Badge variant={betaToken ? 'secondary' : 'warning'}>
                      {t(
                        betaToken
                          ? 'agent.shareEmbed.tokenReady'
                          : 'agent.shareEmbed.tokenMissing',
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-space-sm text-sm text-text-secondary">
                    <span className="break-all">shared_id: {agentId}</span>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => void handleCopySharedId()}
                      aria-label={t(
                        'agent.shareEmbed.copySharedId',
                        '复制 shared_id',
                      )}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {!betaToken ? (
                  <div className="rounded-radius-md border border-status-warning bg-surface-secondary p-space-sm text-sm text-text-secondary">
                    {tokenError
                      ? t(
                          'agent.shareEmbed.tokenReadFailed',
                          '系统 Token 读取失败，请刷新或到系统 Token 管理检查。',
                        )
                      : t(
                          'agent.shareEmbed.missingBetaToken',
                          '未检测到第一条系统 API Token 的 beta。请先创建或刷新 Token；此处不会自动创建。',
                        )}
                  </div>
                ) : null}

                <div className="space-y-space-base border-t border-border-subtle pt-space-lg">
                  <p className="text-sm font-medium text-text-secondary">
                    {t('agent.shareEmbed.accessConfig', '访问配置')}
                  </p>
                  <div className="space-y-space-sm">
                    <ShareSettingSwitch
                      id="agent-share-release"
                      label={t(
                        'agent.shareEmbed.useRelease',
                        '使用发布版本访问',
                      )}
                      description={t(
                        'agent.shareEmbed.useReleaseDescription',
                        '启用后生成的 URL 将包含 release=true。',
                      )}
                      checked={release}
                      onCheckedChange={setRelease}
                    />
                    <ShareSettingSwitch
                      id="agent-share-avatar"
                      label={t(
                        'agent.shareEmbed.showAvatar',
                        '显示 Agent 头像',
                      )}
                      description={t(
                        'agent.shareEmbed.showAvatarDescription',
                        '控制公开访问页是否展示 Agent 头像。',
                      )}
                      checked={visibleAvatar}
                      onCheckedChange={setVisibleAvatar}
                    />
                  </div>
                </div>

                <div className="space-y-space-md border-t border-border-subtle pt-space-lg">
                  <p className="text-sm font-medium text-text-secondary">
                    {t('agent.shareEmbed.embedType', '嵌入类型')}
                  </p>
                  <Tabs
                    value={embedType}
                    onValueChange={(value) =>
                      setEmbedType(value as AgentEmbedType)
                    }
                  >
                    <TabsList className="grid h-10 w-full grid-cols-2">
                      <TabsTrigger value="fullscreen" className="px-space-sm">
                        {t(
                          'agent.shareEmbed.fullscreenIframe',
                          '独立页面 iframe',
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="widget" className="px-space-sm">
                        {t('agent.shareEmbed.widget', '浮窗组件 widget')}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {embedType === 'widget' ? (
                    <ShareSettingSwitch
                      id="agent-share-streaming"
                      label={t('agent.shareEmbed.streaming', '启用流式响应')}
                      description={t(
                        'agent.shareEmbed.streamingDescription',
                        '启用后 widget 会实时展示模型输出；关闭时仅展示完整回复。',
                      )}
                      checked={streaming}
                      onCheckedChange={setStreaming}
                    />
                  ) : null}
                </div>

                {embedType === 'widget' && (
                  <WidgetCustomization
                    settings={settings}
                    onChange={form.setValue}
                  />
                )}
                {onSaveWidgetSettings && (
                  <Button
                    onClick={() => void saveSettings()}
                    disabled={savingWidgetSettings}
                  >
                    {t(
                      savingWidgetSettings
                        ? 'common.loading'
                        : 'agent.shareEmbed.saveSettings',
                    )}
                  </Button>
                )}

                <div className="space-y-space-md border-t border-border-subtle pt-space-lg">
                  <p className="text-sm font-medium text-text-secondary">
                    {t('agent.shareEmbed.displayConfig', '展示配置')}
                  </p>
                  <div className="grid gap-space-lg sm:grid-cols-2">
                    <div className="space-y-space-sm">
                      <Label>{t('layout.sidebar.language', '语言')}</Label>
                      <Select
                        value={locale}
                        onValueChange={(value) =>
                          setLocale(value as typeof locale)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supportedLocales.map((item) => (
                            <SelectItem key={item.code} value={item.code}>
                              {item.nativeLabel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-space-sm">
                      <Label>{t('layout.sidebar.theme', '主题')}</Label>
                      <Select value={theme} onValueChange={setTheme}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">
                            {t('agent.shareEmbed.light')}
                          </SelectItem>
                          <SelectItem value="dark">
                            {t('agent.shareEmbed.dark')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-space-md border-t border-border-subtle pt-space-lg">
                  <div className="flex items-center gap-space-xs">
                    <Label>
                      {t('agent.shareEmbed.externalUserId', '外部用户 ID')}
                    </Label>
                    <FormTooltip
                      tooltip={t(
                        'agent.shareEmbed.externalUserIdTip',
                        '可用于在外部系统中隔离用户会话，生成链接时会作为 userId 参数传递。',
                      )}
                    />
                  </div>
                  <Input
                    value={userId}
                    onChange={(event) => setUserId(event.target.value)}
                    placeholder={t(
                      'agent.shareEmbed.externalUserIdPlaceholder',
                      '请输入外部用户 ID（可选）',
                    )}
                  />
                </div>

                <div className="mt-auto grid gap-space-sm border-t border-border-subtle pt-space-lg sm:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={onRefreshToken}
                    disabled={tokenLoading}
                    title={t(
                      'agent.shareEmbed.refreshTokenTip',
                      '重新读取系统 API Token。若 Token 已在后台变更，旧链接可能不再可用。',
                    )}
                  >
                    <RefreshCw className="h-4 w-4" />
                    {tokenLoading
                      ? t('common.loading', '加载中...')
                      : t('agent.shareEmbed.refreshToken', '刷新 Token')}
                  </Button>
                  <Button onClick={handlePreview} disabled={!previewUrl}>
                    <ExternalLink className="h-4 w-4" />
                    {t('agent.shareEmbed.preview', '预览体验')}
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-radius-xl border border-components-split-pane-border bg-components-split-pane-bg p-space-lg">
              <div className="space-y-space-lg">
                <div className="flex items-center justify-between gap-space-md">
                  <div>
                    <p className="text-sm font-medium text-text-secondary">
                      {t('agent.shareEmbed.outputTitle')}
                    </p>
                    <h3 className="mt-space-xs text-lg font-semibold text-text-primary">
                      {t('agent.shareEmbed.outputTitle', '生成结果')}
                    </h3>
                  </div>
                  <Badge variant="outline">
                    {t('agent.shareEmbed.liveUpdate', '实时更新')}
                  </Badge>
                </div>

                <ShareOutputBlock
                  title={t('agent.shareEmbed.fullscreenUrl', '独立访问链接')}
                  description={t(
                    'agent.shareEmbed.fullscreenUrlDescription',
                    '通过该链接可在新窗口中独立访问 Agent。',
                  )}
                  value={shareUrl}
                  emptyText={t(
                    'agent.shareEmbed.waitingBeta',
                    '等待 beta token 后生成',
                  )}
                  copyLabel={t(
                    'agent.shareEmbed.copyFullscreenUrl',
                    '复制独立访问链接',
                  )}
                />

                <div className="border-t border-border-subtle pt-space-lg">
                  <ShareOutputBlock
                    title={t('agent.shareEmbed.webEmbedCode', '网页嵌入代码')}
                    description={
                      embedType === 'widget'
                        ? t(
                            'agent.shareEmbed.widgetCodeDescription',
                            '将以下代码嵌入到你的网站中，即可展示浮窗组件。',
                          )
                        : t(
                            'agent.shareEmbed.iframeCodeDescription',
                            '将以下代码嵌入到你的网站中，即可在页面内展示 Agent。',
                          )
                    }
                    value={iframeCode}
                    emptyText={t(
                      'agent.shareEmbed.waitingBeta',
                      '等待 beta token 后生成',
                    )}
                    copyLabel={t(
                      'agent.shareEmbed.copyWebEmbedCode',
                      '复制网页嵌入代码',
                    )}
                    variant="html"
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-space-md grid gap-space-sm text-sm text-text-secondary lg:grid-cols-2">
            <div className="flex items-center gap-space-sm">
              <ShieldCheck className="h-4 w-4 text-text-tertiary" />
              <span>
                {t(
                  'agent.shareEmbed.accessControlled',
                  '分享链接和嵌入代码均受 Agent 访问权限控制。',
                )}
              </span>
            </div>
            <div className="flex items-center gap-space-sm lg:justify-end">
              <Sparkles className="h-4 w-4 text-text-tertiary" />
              <span>
                {t(
                  'agent.shareEmbed.configLiveUpdate',
                  '配置项变更将实时更新链接与代码。',
                )}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
