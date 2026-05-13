import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type WheelEvent,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useFetchExternalAgentInputs,
  useUploadPublicCanvasFile,
} from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import { applyRouteLocale } from '@/locales/i18n'
import { ScopedTheme } from '@/themes'
import type { AgentCanvasUploadResult } from '@/types/agent'
import { MessageCircle, X } from 'lucide-react'
import { AgentDialogueMode } from '../constant'
import {
  buildRuntimeInputObject,
  formatRuntimeInputSummary,
} from '../features/runtime-workbench/utils'
import type { RuntimeAttachment } from '../features/runtime-workbench/types'
import type { BeginQuery } from '../types'
import { parseAgentShareAccess } from './access'
import { downloadShareAttachment } from './download-attachment'
import { ShareComposer } from './share-composer'
import { ShareMessageList } from './share-message-list'
import { ShareParameterDialog } from './share-parameter-dialog'
import { useSharedAgentRunner } from './use-shared-agent-runner'
import {
  WidgetLauncher,
  WidgetShell,
  useTransparentDocument,
} from './widget-shell'
import { isEmptyShareValue, runnerStatusFromState } from './widget-utils'
import {
  buildInitialShareValues,
  buildShareInputsPayload,
  formatShareInputSummary,
  getShareInputEntries,
  isRequiredShareInput,
  type ShareFormValues,
} from './utils'

const collectUploadedFiles = (values: ShareFormValues) =>
  Object.values(values).flatMap((value) =>
    Array.isArray(value) ? (value as AgentCanvasUploadResult[]) : [],
  )

export default function AgentWidgetPage() {
  const [searchParams] = useSearchParams()
  const isStandalone = useIsStandaloneWidgetPreview()
  const access = useMemo(
    () => parseAgentShareAccess(searchParams),
    [searchParams],
  )

  useTransparentDocument()

  return (
    <ScopedTheme theme={access.theme}>
      {access.mode === 'master' && isStandalone ? (
        <WidgetStandalonePreview access={access} />
      ) : access.mode === 'master' ? (
        <WidgetLauncher />
      ) : (
        <WidgetChatWindow access={access} />
      )}
    </ScopedTheme>
  )
}

function useIsStandaloneWidgetPreview() {
  const [isStandalone, setIsStandalone] = useState(
    () => typeof window !== 'undefined' && window.self === window.top,
  )

  useEffect(() => {
    setIsStandalone(window.self === window.top)
  }, [])

  return isStandalone
}

function WidgetStandalonePreview({
  access,
}: {
  access: ReturnType<typeof parseAgentShareAccess>
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-surface-secondary min-h-screen">
      {open ? (
        <div className="rounded-radius-lg fixed bottom-24 right-6 h-[500px] w-[380px] max-w-[calc(100vw-48px)] overflow-hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            className="right-space-sm top-space-sm absolute z-10"
            onClick={() => setOpen(false)}
            aria-label={t('agent.share.closeWidget', '关闭聊天浮窗')}
          >
            <X className="h-4 w-4" />
          </Button>
          <WidgetChatWindow access={access} shellVariant="panel" />
        </div>
      ) : (
        <Button
          size="icon-lg"
          className="rounded-radius-full shadow-elevation-high fixed bottom-6 right-24"
          onClick={() => setOpen(true)}
          aria-label={t('agent.share.openWidget', '打开聊天浮窗')}
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </div>
  )
}

function WidgetChatWindow({
  access,
  shellVariant = 'iframe',
}: {
  access: ReturnType<typeof parseAgentShareAccess>
  shellVariant?: 'iframe' | 'panel'
}) {
  const { t } = useTranslation()
  const shareQuery = useFetchExternalAgentInputs(
    access.agentId,
    access.betaToken,
  )
  const { uploadCanvasFile, isLoading: uploading } = useUploadPublicCanvasFile()
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const [formValues, setFormValues] = useState<ShareFormValues>({})
  const [messageValue, setMessageValue] = useState('')
  const [messageFiles, setMessageFiles] = useState<AgentCanvasUploadResult[]>(
    [],
  )
  const [formError, setFormError] = useState<string>()
  const [parameterDialogOpen, setParameterDialogOpen] = useState(false)
  const [beginReady, setBeginReady] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<string | null>(null)
  const [promptedBeginInputs, setPromptedBeginInputs] = useState(false)
  const [taskStarted, setTaskStarted] = useState(false)

  const inputEntries = useMemo(
    () => getShareInputEntries(shareQuery.data.inputs),
    [shareQuery.data.inputs],
  )
  const isTaskMode = shareQuery.data.mode === AgentDialogueMode.Task
  const isWebhookMode = shareQuery.data.mode === AgentDialogueMode.Webhook
  const runner = useSharedAgentRunner({
    agentId: access.agentId,
    betaToken: access.betaToken,
    release: access.release,
    userId: access.userId,
    buildInputs: (values) =>
      buildShareInputsPayload(shareQuery.data.inputs || {}, values),
  })
  const status = runnerStatusFromState(runner.isRunning, runner.lastError)
  const handleScrollPassthrough = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      const element = event.currentTarget
      const isAtTop = element.scrollTop === 0
      const isAtBottom =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 1

      if ((isAtTop && event.deltaY < 0) || (isAtBottom && event.deltaY > 0)) {
        event.preventDefault()
        window.parent.postMessage(
          {
            type: 'SCROLL_PASSTHROUGH',
            deltaY: event.deltaY,
          },
          '*',
        )
      }
    },
    [],
  )
  const displayMessages = useMemo(
    () =>
      access.streaming
        ? runner.messages
        : runner.messages.filter(
            (message) => message.role !== 'assistant' || !message.isStreaming,
          ),
    [access.streaming, runner.messages],
  )

  useEffect(() => {
    applyRouteLocale(access.locale)
  }, [access.locale])

  useEffect(() => {
    setFormValues(buildInitialShareValues(shareQuery.data.inputs, access.data))
  }, [access.data, shareQuery.data.inputs])

  useEffect(() => {
    setBeginReady(inputEntries.length === 0)
    setPromptedBeginInputs(false)
    setTaskStarted(false)
    setPendingMessage(null)
    setFormError(undefined)
  }, [access.agentId, inputEntries.length, isTaskMode, isWebhookMode])

  useEffect(() => {
    if (
      !shareQuery.data.title ||
      isWebhookMode ||
      promptedBeginInputs ||
      runner.isRunning
    ) {
      return
    }

    if (inputEntries.length > 0) {
      setParameterDialogOpen(true)
      setPromptedBeginInputs(true)
      return
    }

    if (isTaskMode && !taskStarted) {
      setTaskStarted(true)
      void runner.submit({
        query: '',
        values: formValues,
        files: [],
        userMessage: t('agent.share.startTask', '启动任务'),
      })
    }
  }, [
    formValues,
    inputEntries.length,
    isTaskMode,
    isWebhookMode,
    promptedBeginInputs,
    runner,
    shareQuery.data.title,
    taskStarted,
    t,
  ])

  const validateInputs = useCallback(() => {
    const missing = inputEntries.find(({ key, field }) => {
      return isRequiredShareInput(field) && isEmptyShareValue(formValues[key])
    })

    if (missing) {
      setFormError(
        t('agent.share.requiredInput', '请填写必填输入：{{name}}', {
          name: missing.field.label || missing.key,
        }),
      )
      return false
    }

    return true
  }, [formValues, inputEntries, t])

  const submitConversation = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed && messageFiles.length === 0) {
        return
      }

      const files = [...collectUploadedFiles(formValues), ...messageFiles]
      setMessageValue('')
      setMessageFiles([])
      await runner.submit({
        query: trimmed,
        values: formValues,
        files,
        userMessage: trimmed,
      })
    },
    [formValues, messageFiles, runner],
  )

  const handleMessageFileUpload = useCallback(
    async (files: FileList) => {
      if (!access.agentId) {
        return
      }

      const result = await uploadCanvasFile({
        canvasId: access.agentId,
        file: Array.from(files),
      })
      const uploaded = Array.isArray(result) ? result : [result]

      setMessageFiles((previous) => [...previous, ...uploaded])
    },
    [access.agentId, uploadCanvasFile],
  )

  const handleSendMessage = useCallback(
    async (content = messageValue) => {
      if (runner.isRunning || uploading) {
        return
      }

      if (inputEntries.length > 0 && !beginReady) {
        setPendingMessage(content)
        setParameterDialogOpen(true)
        return
      }

      await submitConversation(content)
    },
    [
      beginReady,
      inputEntries.length,
      messageValue,
      runner.isRunning,
      submitConversation,
      uploading,
    ],
  )

  const handleParameterSubmit = useCallback(async () => {
    if (!validateInputs()) {
      return
    }

    setParameterDialogOpen(false)
    setBeginReady(true)

    if (isTaskMode) {
      setTaskStarted(true)
      await runner.submit({
        query: '',
        values: formValues,
        files: [],
        userMessage:
          formatShareInputSummary(formValues) ||
          t('agent.share.startTask', '启动任务'),
      })
      return
    }

    if (pendingMessage !== null) {
      const nextMessage = pendingMessage
      setPendingMessage(null)
      await submitConversation(nextMessage)
    }
  }, [
    formValues,
    isTaskMode,
    pendingMessage,
    runner,
    submitConversation,
    t,
    validateInputs,
  ])

  const handleSubmitAwaitingInputs = useCallback(
    async (messageId: string, values: BeginQuery[]) => {
      runner.clearAwaitingInputs(messageId)
      await runner.submit({
        query: '',
        values: {},
        files: [],
        userMessage: formatRuntimeInputSummary(values),
        inputPayload: buildRuntimeInputObject(values),
      })
    },
    [runner],
  )

  const handleDownloadAttachment = useCallback(
    async (file: RuntimeAttachment) => {
      try {
        await downloadShareAttachment({
          file,
          agentId: access.agentId,
          betaToken: access.betaToken,
        })
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t('agent.share.attachmentDownloadFailed', '附件下载失败'),
        )
      }
    },
    [access.agentId, access.betaToken, t],
  )

  if (!access.agentId || !access.betaToken) {
    return (
      <WidgetShell
        title={t('agent.share.agentWidget', 'Agent Widget')}
        variant={shellVariant}
      >
        <div className="p-space-lg text-status-error text-sm">
          {t(
            'agent.share.widgetMissingAccess',
            '缺少 shared_id 或 auth，无法加载浮窗。',
          )}
        </div>
      </WidgetShell>
    )
  }

  return (
    <WidgetShell
      title={
        shareQuery.data.title || t('agent.share.agentWidget', 'Agent Widget')
      }
      variant={shellVariant}
    >
      <div
        className="min-h-0 flex-1 overflow-auto"
        onWheel={handleScrollPassthrough}
      >
        {shareQuery.isLoading ? (
          <div className="p-space-lg text-sm text-text-secondary">
            {t('agent.share.loadingTitle', '正在准备公共运行页')}
          </div>
        ) : shareQuery.isError ? (
          <div className="p-space-lg text-status-error text-sm">
            {t(
              'agent.share.widgetLoadFailed',
              '分享信息加载失败，请检查 shared_id 与 auth。',
            )}
          </div>
        ) : isWebhookMode ? (
          <div className="p-space-lg">
            <div className="rounded-radius-md bg-surface-secondary p-space-base border border-border-default text-sm text-text-secondary">
              {t(
                'agent.share.webhookWidgetHint',
                'Webhook Agent 通过外部 HTTP 请求触发，不使用浮窗对话输入框。',
              )}
            </div>
          </div>
        ) : (
          <ShareMessageList
            canvasId={access.agentId}
            messages={displayMessages}
            status={status}
            title={shareQuery.data.title}
            prologue={shareQuery.data.prologue}
            onSubmitAwaitingInputs={handleSubmitAwaitingInputs}
            onXCardAction={runner.submitXCardAction}
            onDownloadAttachment={handleDownloadAttachment}
          />
        )}
      </div>

      {isWebhookMode ? null : isTaskMode ? (
        <div className="p-space-base border-t border-border-subtle">
          <div className="gap-space-sm flex items-center justify-between">
            <Badge variant="purple">{t('agent.share.task', 'Task')}</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setParameterDialogOpen(true)}
              disabled={runner.isRunning || uploading}
            >
              {t('agent.share.parameters', '运行参数')}
            </Button>
          </div>
        </div>
      ) : (
        <ShareComposer
          value={messageValue}
          files={messageFiles}
          isRunning={runner.isRunning}
          uploading={uploading}
          hasParameters={inputEntries.length > 0}
          attachmentInputRef={attachmentInputRef}
          onChange={setMessageValue}
          onSubmit={(value) => {
            void handleSendMessage(value)
          }}
          onStop={runner.stop}
          onOpenParameters={() => setParameterDialogOpen(true)}
          onUploadFiles={(files) => {
            void handleMessageFileUpload(files)
          }}
        />
      )}

      <ShareParameterDialog
        open={parameterDialogOpen}
        title={
          isTaskMode
            ? t('agent.share.taskParameters', '启动任务参数')
            : t('agent.share.conversationParameters', '会话参数')
        }
        description={
          isTaskMode
            ? t(
                'agent.share.taskParametersDescription',
                '填写 Begin inputs 后立即启动任务。',
              )
            : t(
                'agent.share.conversationParametersDescription',
                '填写 Begin inputs 后继续当前会话。',
              )
        }
        entries={inputEntries}
        values={formValues}
        error={formError}
        theme={access.theme}
        disabled={runner.isRunning || uploading}
        onOpenChange={setParameterDialogOpen}
        onChange={(key, value) => {
          setFormValues((previous) => ({ ...previous, [key]: value }))
          setFormError(undefined)
        }}
        onUpload={async (key, files) => {
          const result = await uploadCanvasFile({
            canvasId: access.agentId,
            file: Array.from(files),
          })
          const uploaded = Array.isArray(result) ? result : [result]
          setFormValues((previous) => ({
            ...previous,
            [key]: uploaded,
          }))
        }}
        onSubmit={() => {
          void handleParameterSubmit()
        }}
      />
    </WidgetShell>
  )
}
