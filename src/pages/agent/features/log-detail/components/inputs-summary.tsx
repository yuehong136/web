import { FileIcon } from '@/components/ui/file-icon'
import { formatRuntimeInputSummary } from '../../runtime-workbench/utils'
import type { BeginQuery } from '../../../types'
import type { RuntimeAttachment } from '../../runtime-workbench/types'

interface InputsSummaryProps {
  inputs: BeginQuery[]
  files: RuntimeAttachment[]
}

export function InputsSummary({ inputs, files }: InputsSummaryProps) {
  const summary = formatRuntimeInputSummary(inputs)

  if (!summary && files.length === 0) {
    return (
      <p className="text-sm text-text-secondary">
        本次运行没有可展示的 Begin 输入。
      </p>
    )
  }

  return (
    <div className="space-y-space-sm">
      {summary ? (
        <pre className="max-h-[180px] overflow-auto rounded-radius-md bg-surface-secondary p-space-sm text-xs text-text-secondary">
          {summary}
        </pre>
      ) : null}
      {files.length ? (
        <div className="flex flex-wrap gap-space-sm">
          {files.map((file, index) => (
            <div
              key={`${file.id || file.name}-${index}`}
              className="flex items-center gap-space-sm rounded-radius-md border border-border-default bg-surface-secondary px-space-sm py-space-xs"
            >
              <FileIcon fileType={file.type} fileName={file.name} size="sm" />
              <span className="max-w-[220px] truncate text-sm text-text-primary">
                {file.name}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
