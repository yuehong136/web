import { SectionCard } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Download, ExternalLink } from 'lucide-react'
import type { PipelineRuntimeController } from '../types'

interface PipelineOutputPanelProps {
  controller: PipelineRuntimeController
}

export function PipelineOutputPanel({ controller }: PipelineOutputPanelProps) {
  const {
    outputAvailable,
    endOutput,
    lastError,
    uploadedFile,
    resultPath,
    handleDownloadOutput,
    handleOpenResult,
  } = controller

  return (
    <div className="space-y-space-lg p-space-md">
      <SectionCard
        title="END 节点输出"
        padding="default"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenResult}
              disabled={!outputAvailable}
            >
              <ExternalLink className="mr-space-xs size-4" />
              查看结果
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownloadOutput}
              disabled={!outputAvailable}
            >
              <Download className="mr-space-xs size-4" />
              下载 JSON
            </Button>
          </>
        }
      >
        {uploadedFile ? (
          <div className="mb-space-md rounded-radius-md border border-border-subtle bg-surface-secondary p-space-sm text-sm text-text-secondary">
            <div className="font-medium text-text-primary">
              {String(uploadedFile.name || uploadedFile.id || '未命名文档')}
            </div>
            <div className="mt-space-xs text-xs text-text-tertiary">
              {resultPath
                ? '已准备结果页上下文，可跳转查看本次运行结果。'
                : '已记录本次文件；缺少 doc_id 时只能在当前面板查看 END 输出。'}
            </div>
          </div>
        ) : null}
        {outputAvailable ? (
          <pre className="max-h-[420px] overflow-auto rounded-radius-md bg-surface-secondary p-space-sm text-xs">
            {JSON.stringify(endOutput, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-text-secondary">
            Pipeline 暂无可下载的 END 输出。运行完成后此处会展示数据流的最终结果。
          </p>
        )}
      </SectionCard>

      {lastError ? (
        <SectionCard title="运行异常" padding="default">
          <p className="text-sm text-status-error">{lastError}</p>
        </SectionCard>
      ) : null}
    </div>
  )
}
