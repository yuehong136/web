import { useCallback, useEffect, useMemo, useState, type WheelEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useFetchExternalAgentInputs,
  useUploadPublicCanvasFile,
} from '@/hooks/use-agent-request'
import { changeLanguage } from '@/locales/i18n'
import { ScopedTheme } from '@/themes'
import { Send } from 'lucide-react'
import type { AgentCanvasUploadResult } from '@/types/agent'
import { AgentDialogueMode } from '../constant'
import {
  buildRuntimeInputObject,
  formatRuntimeInputSummary,
} from '../features/runtime-workbench/utils'
import type { BeginQuery } from '../types'
import { parseAgentShareAccess } from './access'
import { ShareMessageList } from './share-message-list'
import { ShareParameterDialog } from './share-parameter-dialog'
import { useSharedAgentRunner } from './use-shared-agent-runner'
import {
  WidgetLauncher,
  WidgetShell,
  useTransparentDocument,
} from './widget-shell'
import {
  isEmptyShareValue,
  runnerStatusFromState,
} from './widget-utils'
import {
  buildInitialShareValues,
  buildShareInputsPayload,
  formatShareInputSummary,
  getShareInputEntries,
  isRequiredShareInput,
  type ShareFormValues,
} from './utils'

export default function AgentWidgetPage() {
  const [searchParams] = useSearchParams()
  const access = useMemo(
    () => parseAgentShareAccess(searchParams),
    [searchParams],
  )

  useTransparentDocument()

  return (
    <ScopedTheme theme={access.theme}>
      {access.mode === 'master' ? (
        <WidgetLauncher />
      ) : (
        <WidgetChatWindow access={access} />
      )}
    </ScopedTheme>
  )
}

function WidgetChatWindow({
  access,
}: {
  access: ReturnType<typeof parseAgentShareAccess>
}) {
  const shareQuery = useFetchExternalAgentInputs(
    access.agentId,
    access.betaToken,
  )
  const { uploadCanvasFile, isLoading: uploading } =
    useUploadPublicCanvasFile()
  const [formValues, setFormValues] = useState<ShareFormValues>({})
  const [messageValue, setMessageValue] = useState('')
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
    if (access.locale === 'zh-CN' || access.locale === 'en-US') {
      changeLanguage(access.locale)
    }
  }, [access.locale])

  useEffect(() => {
    setFormValues(
      buildInitialShareValues(shareQuery.data.inputs, access.data),
    )
  }, [access.data, shareQuery.data.inputs])

  useEffect(() => {
    setBeginReady(inputEntries.length === 0)
    setPromptedBeginInputs(false)
    setTaskStarted(false)
    setPendingMessage(null)
    setFormError(undefined)
  }, [access.agentId, inputEntries.length, isTaskMode])

  useEffect(() => {
    if (!shareQuery.data.title || promptedBeginInputs || runner.isRunning) {
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
        userMessage: '启动任务',
      })
    }
  }, [
    formValues,
    inputEntries.length,
    isTaskMode,
    promptedBeginInputs,
    runner,
    shareQuery.data.title,
    taskStarted,
  ])

  const validateInputs = useCallback(() => {
    const missing = inputEntries.find(({ key, field }) => {
      return isRequiredShareInput(field) && isEmptyShareValue(formValues[key])
    })

    if (missing) {
      setFormError(`请填写必填输入：${missing.field.label || missing.key}`)
      return false
    }

    return true
  }, [formValues, inputEntries])

  const submitConversation = useCallback(
    async (content: string) => {
      const trimmed = content.trim()
      if (!trimmed) {
        return
      }

      await runner.submit({
        query: trimmed,
        values: formValues,
        files: [],
        userMessage: trimmed,
      })
      setMessageValue('')
    },
    [formValues, runner],
  )

  const handleSendMessage = useCallback(async () => {
    if (runner.isRunning || uploading) {
      return
    }

    if (inputEntries.length > 0 && !beginReady) {
      setPendingMessage(messageValue)
      setParameterDialogOpen(true)
      return
    }

    await submitConversation(messageValue)
  }, [
    beginReady,
    inputEntries.length,
    messageValue,
    runner.isRunning,
    submitConversation,
    uploading,
  ])

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
        userMessage: formatShareInputSummary(formValues) || '启动任务',
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

  if (!access.agentId || !access.betaToken) {
    return (
      <WidgetShell title="Agent Widget">
        <div className="p-space-lg text-sm text-status-error">
          缺少 shared_id 或 auth，无法加载浮窗。
        </div>
      </WidgetShell>
    )
  }

  return (
    <WidgetShell title={shareQuery.data.title || 'Agent Widget'}>
      <div
        className="min-h-0 flex-1 overflow-auto"
        onWheel={handleScrollPassthrough}
      >
        {shareQuery.isLoading ? (
          <div className="p-space-lg text-sm text-text-secondary">
            正在准备公共运行页...
          </div>
        ) : shareQuery.isError ? (
          <div className="p-space-lg text-sm text-status-error">
            分享信息加载失败，请检查 shared_id 与 auth。
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
          />
        )}
      </div>

      {isTaskMode ? (
        <div className="border-t border-border-subtle p-space-base">
          <div className="flex items-center justify-between gap-space-sm">
            <Badge variant="purple">Task</Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setParameterDialogOpen(true)}
              disabled={runner.isRunning || uploading}
            >
              参数
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t border-border-subtle p-space-base">
          <div className="flex gap-space-sm">
            <Input
              value={messageValue}
              onChange={(event) => setMessageValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleSendMessage()
                }
              }}
              placeholder="输入消息"
              inputSize="sm"
              disabled={runner.isRunning || uploading}
            />
            <Button
              size="icon-sm"
              onClick={() => void handleSendMessage()}
              disabled={
                runner.isRunning || uploading || !messageValue.trim()
              }
              aria-label="发送"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <ShareParameterDialog
        open={parameterDialogOpen}
        title={isTaskMode ? '启动任务参数' : '会话参数'}
        description={
          isTaskMode
            ? '填写 Begin inputs 后立即启动任务。'
            : '填写 Begin inputs 后继续当前会话。'
        }
        entries={inputEntries}
        values={formValues}
        error={formError}
        disabled={runner.isRunning || uploading}
        onOpenChange={setParameterDialogOpen}
        onChange={(key, value) => {
          setFormValues((previous) => ({ ...previous, [key]: value }))
          setFormError(undefined)
        }}
        onUpload={async (key, files) => {
          const uploaded: AgentCanvasUploadResult[] = []
          for (const file of Array.from(files)) {
            uploaded.push(
              await uploadCanvasFile({
                canvasId: access.agentId,
                file,
              }),
            )
          }
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
