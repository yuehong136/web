import { useShareStartup } from './use-share-startup'
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
  WidgetStandalonePreview,
  useTransparentDocument,
} from './widget-shell'
import { isEmptyShareValue, runnerStatusFromState } from './widget-utils'
import {
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

  useEffect(() => {
    applyRouteLocale(access.locale)
  }, [access.locale])

  return (
    <ScopedTheme theme={access.theme}>
      {access.mode === 'master' && isStandalone ? (
        <WidgetStandalonePreview>
          <WidgetChatWindow access={access} shellVariant="panel" />
        </WidgetStandalonePreview>
      ) : access.mode === 'master' ? (
        <WidgetLauncher />
      ) : (
        <WidgetChatWindow access={access} />
      )}
    </ScopedTheme>
  )
}

function useIsStandaloneWidgetPreview() {
  const [isStandalone] = useState(
    () => typeof window !== 'undefined' && window.self === window.top,
  )

  return isStandalone
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

  const [messageValue, setMessageValue] = useState('')
  const [messageFiles, setMessageFiles] = useState<AgentCanvasUploadResult[]>(
    [],
  )

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
  const {
    formValues,
    setFormValues,
    formError,
    setFormError,
    parameterDialogOpen,
    setParameterDialogOpen,
    beginReady,
    setBeginReady,
    pendingMessage,
    setPendingMessage,
    markAutomaticTaskStarted,
  } = useShareStartup({
    access,
    inputs: shareQuery.data.inputs,
    inputCount: inputEntries.length,
    title: shareQuery.data.title,
    isTaskMode,
    isWebhookMode,
    runner,
    startTaskMessage: t('agent.share.startTask', '启动任务'),
  })

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
  }, [formValues, inputEntries, setFormError, t])

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
      setParameterDialogOpen,
      setPendingMessage,
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
      markAutomaticTaskStarted()
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
    markAutomaticTaskStarted,
    pendingMessage,
    runner,
    setBeginReady,
    setParameterDialogOpen,
    setPendingMessage,
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
        <div className="p-space-lg text-sm text-status-error">
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
          <div className="p-space-lg text-sm text-status-error">
            {t(
              'agent.share.widgetLoadFailed',
              '分享信息加载失败，请检查 shared_id 与 auth。',
            )}
          </div>
        ) : isWebhookMode ? (
          <div className="p-space-lg">
            <div className="rounded-radius-md border border-border-default bg-background-subtle p-space-base text-sm text-text-secondary">
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
        <div className="border-t border-border-subtle p-space-base">
          <div className="flex items-center justify-between gap-space-sm">
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
