import React from 'react'
import { Button } from '@/components/vendor/ui/button'
import { Textarea } from '@/components/vendor/ui/textarea'
import { cn } from '@/lib/utils'
import { Database, FileText, FileUp, PenLine, X } from 'lucide-react'
import {
  DataSourcePanel,
  type DataSourcePanelProps,
} from './data-input-data-source-panel'

export type UserInputMode = 'manual' | 'file' | 'datasource'

export interface UploadedFile {
  id: string
  name: string
  size: number
  content?: string
}

interface UserInputSectionProps {
  userInputMode: UserInputMode
  setUserInputMode: (mode: UserInputMode) => void
  userInput: string
  onUserInputChange: (value: string) => void
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
  dataSourcePanel: DataSourcePanelProps
}

// 设置弹窗「用户输入」区块：自 DataInput.tsx 原样拆出（棘轮债务文件减行），
// 全部状态仍由 DataInput 持有，弹窗关闭重开不丢已上传文件/数据源
export const UserInputSection: React.FC<UserInputSectionProps> = ({
  userInputMode,
  setUserInputMode,
  userInput,
  onUserInputChange,
  uploadedFiles,
  setUploadedFiles,
  dataSourcePanel,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-primary">
        用户输入
      </label>

      {/* 输入模式切换 */}
      <div className="mb-3 flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setUserInputMode('manual')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            userInputMode === 'manual'
              ? 'bg-background-body text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          <PenLine className="h-3.5 w-3.5" />
          手动输入
        </button>
        <button
          onClick={() => setUserInputMode('file')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            userInputMode === 'file'
              ? 'bg-background-body text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          <FileUp className="h-3.5 w-3.5" />
          本地文件
        </button>
        <button
          onClick={() => setUserInputMode('datasource')}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
            userInputMode === 'datasource'
              ? 'bg-background-body text-text-primary shadow-sm'
              : 'text-text-secondary hover:text-text-primary',
          )}
        >
          <Database className="h-3.5 w-3.5" />
          数据源
        </button>
      </div>

      {/* 手动输入模式 */}
      {userInputMode === 'manual' && (
        <Textarea
          className="min-h-[100px] resize-none"
          value={userInput}
          onChange={(e) => onUserInputChange(e.target.value)}
          placeholder="输入补充信息，将与占位符 JSON 一并发送给模型"
        />
      )}

      {/* 本地文件模式 */}
      {userInputMode === 'file' && (
        <div className="space-y-3">
          {/* 上传区域 */}
          <label className="hover:bg-background-body-subtle flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border-default p-6 transition-colors hover:border-primary/50">
            <input
              type="file"
              className="hidden"
              accept=".txt,.json,.csv,.md"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                files.forEach((file) => {
                  const reader = new FileReader()
                  reader.onload = (ev) => {
                    const newFile: UploadedFile = {
                      id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                      name: file.name,
                      size: file.size,
                      content: ev.target?.result as string,
                    }
                    setUploadedFiles((prev) => [...prev, newFile])
                  }
                  reader.readAsText(file)
                })
                e.target.value = ''
              }}
            />
            <FileUp className="mb-2 h-8 w-8 text-text-secondary" />
            <p className="text-sm text-text-secondary">点击上传文件</p>
            <p className="mt-1 text-xs text-text-secondary">
              支持 .txt, .json, .csv, .md 格式
            </p>
          </label>

          {/* 已上传文件列表 */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-secondary">
                已上传 {uploadedFiles.length} 个文件
              </p>
              <div className="max-h-32 space-y-1.5 overflow-auto">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-background-body-subtle flex items-center justify-between rounded-md p-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-text-secondary" />
                      <span className="truncate text-sm">{file.name}</span>
                      <span className="shrink-0 text-xs text-text-secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 shrink-0 p-0"
                      onClick={() =>
                        setUploadedFiles((prev) =>
                          prev.filter((f) => f.id !== file.id),
                        )
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 数据源模式 */}
      {userInputMode === 'datasource' && (
        <DataSourcePanel {...dataSourcePanel} />
      )}
    </div>
  )
}
