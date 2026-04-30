import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { WorkspacePageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageHeader,
  PageLoadingState,
} from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useFetchExternalAgentInputs,
  useUploadPublicCanvasFile,
} from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import { changeLanguage } from '@/locales/i18n'
import { Copy, RotateCcw } from 'lucide-react'
import {
  AgentRuntimeStatus,
} from '../features/runtime-workbench/types'
import {
  buildRuntimeInputObject,
  formatRuntimeInputSummary,
} from '../features/runtime-workbench/utils'
import { AgentDialogueMode } from '../constant'
import { ShareComposer } from './share-composer'
import { ShareMessageList } from './share-message-list'
import { ShareParameterDialog } from './share-parameter-dialog'
import { buildAgentSharePath, parseAgentShareAccess } from './access'
import { useSharedAgentRunner } from './use-shared-agent-runner'
import {
  buildInitialShareValues,
  buildShareInputsPayload,
  formatShareInputSummary,
  getShareInputEntries,
  isRequiredShareInput,
  type ShareFormValues,
} from './utils'
import type { BeginQuery } from '../types'
import type { AgentCanvasUploadResult } from '@/types/agent'

const isEmptyValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0
  }
  return value === undefined || value === null || value === ''
}

const collectUploadedFiles = (values: ShareFormValues) =>
  Object.values(values).flatMap((value) =>
    Array.isArray(value) ? (value as AgentCanvasUploadResult[]) : [],
  )

export default function AgentSharePage() {
  const [searchParams] = useSearchParams()
  const access = useMemo(
    () => parseAgentShareAccess(searchParams),
    [searchParams],
  )
  const shareQuery = useFetchExternalAgentInputs(
    access.agentId,
    access.betaToken,
  )
  const { uploadCanvasFile, isLoading: uploading } =
    useUploadPublicCanvasFile()
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const [formValues, setFormValues] = useState<ShareFormValues>({})
  const [messageValue, setMessageValue] = useState('')
  const [messageFiles, setMessageFiles] = useState<AgentCanvasUploadResult[]>([])
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
  const canonicalPath = useMemo(
    () =>
      access.agentId && access.betaToken
        ? buildAgentSharePath({
            agentId: access.agentId,
            betaToken: access.betaToken,
            release: access.release,
            userId: access.userId,
            locale: access.locale,
            theme: access.theme,
            visibleAvatar: access.visibleAvatar,
          })
        : '',
    [
      access.agentId,
      access.betaToken,
      access.locale,
      access.release,
      access.theme,
      access.userId,
      access.visibleAvatar,
    ],
  )
  const isCanonical =
    canonicalPath &&
    `${window.location.pathname}${window.location.search}` === canonicalPath

  const runner = useSharedAgentRunner({
    agentId: access.agentId,
    betaToken: access.betaToken,
    release: access.release,
    userId: access.userId,
    buildInputs: (values) =>
      buildShareInputsPayload(shareQuery.data.inputs || {}, values),
  })
  const status = runnerStatusFromState(runner.isRunning, runner.lastError)

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
    if (!isTaskMode && shareQuery.data.prologue) {
      runner.appendAssistantMessage(shareQuery.data.prologue)
    }
  }, [isTaskMode, runner, shareQuery.data.prologue])

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

  const handleCopyLink = useCallback(async () => {
    try {
      await copyToClipboard(window.location.href)
      toast.success('Share 链接已复制')
    } catch {
      toast.error('复制失败，请手动复制 Share 链接')
    }
  }, [])

  const handleChange = useCallback((key: string, value: unknown) => {
    setFormValues((previous) => ({
      ...previous,
      [key]: value as ShareFormValues[string],
    }))
    setFormError(undefined)
  }, [])

  const handleUpload = useCallback(
    async (key: string, files: FileList) => {
      if (!access.agentId) {
        return
      }

      const uploaded: AgentCanvasUploadResult[] = []
      for (const file of Array.from(files)) {
        const result = await uploadCanvasFile({
          canvasId: access.agentId,
          file,
        })
        uploaded.push(result)
      }

      setFormValues((previous) => {
        const current = Array.isArray(previous[key])
          ? (previous[key] as AgentCanvasUploadResult[])
          : []

        return {
          ...previous,
          [key]: [...current, ...uploaded],
        }
      })
      toast.success('文件已上传')
    },
    [access.agentId, uploadCanvasFile],
  )

  const handleMessageFileUpload = useCallback(
    async (files: FileList) => {
      if (!access.agentId) {
        return
      }

      const uploaded: AgentCanvasUploadResult[] = []
      for (const file of Array.from(files)) {
        const result = await uploadCanvasFile({
          canvasId: access.agentId,
          file,
        })
        uploaded.push(result)
      }

      setMessageFiles((previous) => [...previous, ...uploaded])
      toast.success('附件已上传')
    },
    [access.agentId, uploadCanvasFile],
  )

  const validateInputs = useCallback(() => {
    const missing = inputEntries.find(({ key, field }) => {
      return isRequiredShareInput(field) && isEmptyValue(formValues[key])
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
      if (!trimmed && messageFiles.length === 0) {
        return
      }

      const files = [...collectUploadedFiles(formValues), ...messageFiles]
      await runner.submit({
        query: trimmed,
        values: formValues,
        files,
        userMessage: trimmed,
      })
      setMessageValue('')
      setMessageFiles([])
    },
    [formValues, messageFiles, runner],
  )

  const handleSendMessage = useCallback(
    async (content: string) => {
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
        files: collectUploadedFiles(formValues),
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

  const handleResetSession = useCallback(() => {
    runner.reset()
    setBeginReady(inputEntries.length === 0)
    setTaskStarted(false)
    setPromptedBeginInputs(false)
  }, [inputEntries.length, runner])

  if (!access.agentId) {
    return (
      <PageEmptyState
        scene={AppScene.WORKSPACE}
        title="缺少分享资产 ID"
        description="当前链接缺少 `shared_id` 参数。`id` 与 `agent_id` 只作为旧入口别名，生成链接会统一使用 `shared_id`。"
      />
    )
  }

  if (!access.betaToken) {
    return (
      <PageEmptyState
        scene={AppScene.WORKSPACE}
        title="缺少分享访问令牌"
        description="Share 公共运行必须通过 `auth` 参数传入 beta token，并由外部接口写入 `Authorization: Bearer <beta>`。"
      />
    )
  }

  if (shareQuery.isLoading) {
    return (
      <PageLoadingState
        scene={AppScene.WORKSPACE}
        title="正在准备公共运行页"
        description="正在读取 Agent 的 external inputs、发布模式和公共输入契约。"
      />
    )
  }

  if (shareQuery.isError) {
    return (
      <PageErrorState
        scene={AppScene.WORKSPACE}
        title="分享信息加载失败"
        description="请检查链接中的 `shared_id` 与 `auth` 是否匹配，并确认 beta token 仍有效。"
        onRetry={() => void shareQuery.refetch()}
        retryLabel="重新加载"
      />
    )
  }

  return (
    <WorkspacePageTemplate
      header={
        <PageHeader
          title={shareQuery.data.title || 'Agent Share'}
          description={
            shareQuery.data.prologue ||
            '公共运行页只消费 shared_id 与 auth，不读取本地登录态。'
          }
          actions={
            <>
              <Badge variant={isTaskMode ? 'purple' : 'blue'}>
                {isTaskMode ? 'Task' : 'Conversation'}
              </Badge>
              <Button variant="outline" onClick={() => void handleCopyLink()}>
                <Copy className="mr-space-xs h-4 w-4" />
                复制链接
              </Button>
              <Button
                variant="outline"
                onClick={handleResetSession}
                disabled={runner.isRunning}
              >
                <RotateCcw className="mr-space-xs h-4 w-4" />
                重置会话
              </Button>
            </>
          }
        />
      }
    >
      <div className="flex h-[calc(100vh-168px)] min-h-[620px] flex-col">
        {canonicalPath && !isCanonical ? (
          <div className="mx-auto mt-space-base w-full max-w-4xl rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm text-xs text-text-secondary">
            当前链接来自旧别名入口。正式 Share 链接为：
            <span className="ml-space-xs break-all text-text-primary">
              {canonicalPath}
            </span>
          </div>
        ) : null}

        {runner.lastError ? (
          <div className="mx-auto mt-space-base w-full max-w-4xl rounded-radius-md border border-status-error bg-surface-secondary p-space-sm text-sm text-status-error">
            {runner.lastError}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto">
          <ShareMessageList
            canvasId={access.agentId}
            messages={runner.messages}
            status={status}
            title={shareQuery.data.title}
            prologue={shareQuery.data.prologue}
            onSubmitAwaitingInputs={handleSubmitAwaitingInputs}
            onXCardAction={runner.submitXCardAction}
          />
        </div>

        {isTaskMode ? (
          <div className="shrink-0 border-t border-border-subtle bg-surface-primary px-space-lg py-space-base">
            <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-space-sm rounded-radius-xl border border-border-default bg-surface-secondary p-space-sm shadow-elevation-low">
              <div className="flex items-center gap-space-sm text-sm text-text-secondary">
                <Badge variant="purple">Task</Badge>
                {runner.isRunning ? '任务运行中' : '任务模式通过 Begin inputs 启动运行'}
              </div>
              <div className="flex flex-wrap gap-space-sm">
                {inputEntries.length > 0 ? (
                  <Button
                    variant="outline"
                    onClick={() => setParameterDialogOpen(true)}
                    disabled={runner.isRunning || uploading}
                  >
                    参数
                  </Button>
                ) : null}
              </div>
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
      </div>

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
        onChange={handleChange}
        onUpload={handleUpload}
        onSubmit={() => {
          void handleParameterSubmit()
        }}
      />
    </WorkspacePageTemplate>
  )
}

function runnerStatusFromState(
  isRunning: boolean,
  lastError?: string,
): AgentRuntimeStatus {
  if (isRunning) {
    return AgentRuntimeStatus.RUNNING
  }

  if (lastError) {
    return AgentRuntimeStatus.ERROR
  }

  return AgentRuntimeStatus.IDLE
}
