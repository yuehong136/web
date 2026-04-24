import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { WorkspacePageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  SectionCard,
} from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  useFetchExternalAgentInputs,
  useUploadPublicCanvasFile,
} from '@/hooks/use-agent-request'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'
import { ArrowLeft, Copy, Play, RotateCcw, Send, Square } from 'lucide-react'
import { AgentDialogueMode } from '../constant'
import { ShareInputField } from './share-input-field'
import { ShareMessageList } from './share-message-list'
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
import type { AgentCanvasUploadResult } from '@/types/agent'

const isEmptyValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.length === 0
  }
  return value === undefined || value === null || value === ''
}

export default function AgentSharePage() {
  const navigate = useNavigate()
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
  const [formValues, setFormValues] = useState<ShareFormValues>({})
  const [messageValue, setMessageValue] = useState('')
  const [formError, setFormError] = useState<string>()

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
          })
        : '',
    [access.agentId, access.betaToken, access.release, access.userId],
  )
  const isCanonical =
    canonicalPath &&
    `${window.location.pathname}${window.location.search}` === canonicalPath
  const handleCopyLink = useCallback(async () => {
    try {
      await copyToClipboard(window.location.href)
      toast.success('Share 链接已复制')
    } catch {
      toast.error('复制失败，请手动复制 Share 链接')
    }
  }, [])

  const runner = useSharedAgentRunner({
    agentId: access.agentId,
    betaToken: access.betaToken,
    release: access.release,
    userId: access.userId,
    buildInputs: (values) =>
      buildShareInputsPayload(shareQuery.data.inputs || {}, values),
  })

  useEffect(() => {
    setFormValues(
      buildInitialShareValues(shareQuery.data.inputs, access.data),
    )
  }, [access.data, shareQuery.data.inputs])

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

  const validateInputs = useCallback(() => {
    const missing = inputEntries.find(({ key, field }) => {
      return isRequiredShareInput(field) && isEmptyValue(formValues[key])
    })

    if (missing) {
      setFormError(`请填写必填输入：${missing.field.label || missing.key}`)
      return false
    }

    if (!isTaskMode && !messageValue.trim()) {
      setFormError('请输入要发送给 Agent 的消息')
      return false
    }

    return true
  }, [formValues, inputEntries, isTaskMode, messageValue])

  const handleSubmit = useCallback(async () => {
    if (!validateInputs()) {
      return
    }

    const files = Object.values(formValues).flatMap((value) =>
      Array.isArray(value) ? value : [],
    )
    const query = isTaskMode ? '' : messageValue.trim()
    const userMessage = isTaskMode
      ? formatShareInputSummary(formValues) || '启动任务'
      : messageValue.trim()

    await runner.submit({
      query,
      values: formValues,
      files,
      userMessage,
    })

    if (!isTaskMode) {
      setMessageValue('')
    }
  }, [formValues, isTaskMode, messageValue, runner, validateInputs])

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
            '公共运行页使用 Agent external inputs 与 beta token 执行，不读取本地登录态。'
          }
          actions={
            <>
              <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-space-xs h-4 w-4" />
                返回
              </Button>
              <Button
                variant="outline"
                onClick={() => void handleCopyLink()}
              >
                <Copy className="mr-space-xs h-4 w-4" />
                复制链接
              </Button>
            </>
          }
        />
      }
    >
      <div className="grid gap-space-lg p-space-lg xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-space-lg">
          <SectionCard
            title="输入"
            actions={
              <Badge variant={isTaskMode ? 'purple' : 'blue'}>
                {isTaskMode ? 'Task' : 'Conversation'}
              </Badge>
            }
            padding="default"
          >
            <div className="space-y-space-md">
              {canonicalPath && !isCanonical ? (
                <div className="rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm text-xs text-text-secondary">
                  当前链接来自旧别名入口。正式 Share 链接为：
                  <span className="ml-space-xs break-all text-text-primary">
                    {canonicalPath}
                  </span>
                </div>
              ) : null}

              {inputEntries.length ? (
                inputEntries.map(({ key, field }) => (
                  <ShareInputField
                    key={key}
                    fieldKey={key}
                    field={field}
                    value={formValues[key]}
                    disabled={runner.isRunning || uploading}
                    onChange={handleChange}
                    onUpload={handleUpload}
                  />
                ))
              ) : (
                <PageEmptyState
                  scene={AppScene.WORKSPACE}
                  compact
                  title="无外部输入"
                  description="该 Agent 没有 Begin inputs，提交时只会发送用户消息。"
                />
              )}

              {!isTaskMode ? (
                <div className="space-y-space-sm">
                  <p className="text-sm font-medium text-text-primary">
                    消息
                  </p>
                  <Textarea
                    rows={4}
                    value={messageValue}
                    disabled={runner.isRunning}
                    onChange={(event) => {
                      setMessageValue(event.target.value)
                      setFormError(undefined)
                    }}
                    placeholder="输入要发送给 Agent 的消息"
                  />
                </div>
              ) : null}

              {formError || runner.lastError ? (
                <div className="rounded-radius-md border border-status-error bg-surface-secondary p-space-sm text-sm text-status-error">
                  {formError || runner.lastError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-space-sm">
                <Button
                  onClick={() => void handleSubmit()}
                  disabled={runner.isRunning || uploading}
                >
                  {isTaskMode ? (
                    <Play className="mr-space-xs h-4 w-4" />
                  ) : (
                    <Send className="mr-space-xs h-4 w-4" />
                  )}
                  {runner.isRunning ? '运行中...' : isTaskMode ? '启动任务' : '发送'}
                </Button>
                <Button
                  variant="outline"
                  onClick={runner.isRunning ? runner.stop : runner.reset}
                >
                  {runner.isRunning ? (
                    <Square className="mr-space-xs h-4 w-4" />
                  ) : (
                    <RotateCcw className="mr-space-xs h-4 w-4" />
                  )}
                  {runner.isRunning ? '停止' : '重置'}
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="结果" padding="default">
          <ShareMessageList messages={runner.messages} />
        </SectionCard>
      </div>
    </WorkspacePageTemplate>
  )
}
