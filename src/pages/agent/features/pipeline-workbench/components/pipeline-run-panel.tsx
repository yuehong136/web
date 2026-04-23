import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import DebugContent from '../../../debug-content'
import { FileUploadDirectUpload } from '../../../debug-content/uploader'
import type { BeginQuery } from '../../../types'
import { useCallback, useState } from 'react'
import { PipelineRuntimeStatus, type PipelineRuntimeController } from '../types'

interface PipelineRunPanelProps {
  controller: PipelineRuntimeController
}

export function PipelineRunPanel({ controller }: PipelineRunPanelProps) {
  const {
    canvasId,
    beginInputs,
    handleRun,
    loading,
    saving,
    status,
    lastError,
  } = controller
  const [quickFiles, setQuickFiles] = useState<unknown[]>([])

  const handleQuickStart = useCallback(async () => {
    if (!Array.isArray(quickFiles) || quickFiles.length === 0) {
      return
    }

    const value: BeginQuery = {
      key: 'files',
      type: 'file',
      value: quickFiles as unknown as string,
      optional: false,
      name: '上传文档',
    }
    await handleRun([value])
  }, [handleRun, quickFiles])

  if (beginInputs.length > 0) {
    return (
      <div className="space-y-space-lg p-space-md">
        <SectionCard title="Begin 输入" padding="default">
          <div className="space-y-space-md">
            <p className="text-sm text-text-secondary">
              上传文档或填写 Begin 节点定义的字段，点击"启动 Pipeline"会保存当前画布并触发数据流处理。
            </p>
            <DebugContent
              canvasId={canvasId}
              parameters={beginInputs}
              ok={handleRun}
              isNext={false}
              loading={loading || saving}
              btnText={loading ? '运行中…' : '启动 Pipeline'}
              className="min-h-0"
              maxHeight="max-h-none"
            />
          </div>
        </SectionCard>

        {status === PipelineRuntimeStatus.ERROR && lastError ? (
          <SectionCard title="启动失败" padding="default">
            <p className="text-sm text-status-error">{lastError}</p>
          </SectionCard>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-space-lg p-space-md">
      <SectionCard title="快速运行" padding="default">
        <div className="space-y-space-md">
          <p className="text-sm text-text-secondary">
            当前 Begin 节点没有定义输入字段。直接上传一份样本文档即可启动 Pipeline 数据流。
          </p>
          <FileUploadDirectUpload
            canvasId={canvasId}
            value={quickFiles}
            onChange={(value) =>
              setQuickFiles(Array.isArray(value) ? value : value ? [value] : [])
            }
            buttonLabel="选择样本文档"
          />
          <Button
            type="button"
            className="w-full"
            disabled={loading || saving || quickFiles.length === 0}
            onClick={handleQuickStart}
          >
            {loading ? '运行中…' : '启动 Pipeline'}
          </Button>
        </div>
      </SectionCard>

      {status === PipelineRuntimeStatus.ERROR && lastError ? (
        <SectionCard title="启动失败" padding="default">
          <p className="text-sm text-status-error">{lastError}</p>
        </SectionCard>
      ) : null}
    </div>
  )
}
