import React, { useState, useCallback, useRef } from 'react'
import { Upload, FileJson, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useImportDialogApps } from '@/hooks/use-dialog-apps'
import type { DialogImportResult } from '@/types/api'

interface ImportTemplateDialogProps {
  isOpen: boolean
  onClose: () => void
}

type Stage = 'select' | 'uploading' | 'result'

export const ImportTemplateDialog: React.FC<ImportTemplateDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [stage, setStage] = useState<Stage>('select')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [result, setResult] = useState<DialogImportResult | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportDialogApps()

  const reset = useCallback(() => {
    setStage('select')
    setSelectedFile(null)
    setValidationError(null)
    setResult(null)
    setIsDragOver(false)
  }, [])

  const handleClose = useCallback(() => {
    reset()
    onClose()
  }, [reset, onClose])

  const validateFile = useCallback(async (file: File): Promise<boolean> => {
    setValidationError(null)
    const name = file.name.toLowerCase()

    if (!name.endsWith('.json') && !name.endsWith('.zip')) {
      setValidationError('仅支持 .json 或 .zip 文件')
      return false
    }

    if (name.endsWith('.json')) {
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (data.format !== 'multirag_dialog_template') {
          setValidationError('文件格式不正确，缺少有效的 format 标识')
          return false
        }
        if (!data.app || typeof data.app !== 'object') {
          setValidationError('文件格式不正确，缺少 app 数据')
          return false
        }
      } catch {
        setValidationError('JSON 解析失败，请检查文件内容')
        return false
      }
    }

    return true
  }, [])

  const handleFileSelect = useCallback(async (file: File) => {
    const valid = await validateFile(file)
    if (valid) {
      setSelectedFile(file)
      setValidationError(null)
    }
  }, [validateFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [handleFileSelect])

  const handleImport = useCallback(() => {
    if (!selectedFile) return
    setStage('uploading')
    importMutation.mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data)
        setStage('result')
      },
      onError: () => {
        setStage('select')
      },
    })
  }, [selectedFile, importMutation])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            导入应用模版
          </DialogTitle>
          <DialogDescription>
            上传 .json 或 .zip 模版文件来创建应用
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {stage === 'select' && (
            <>
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                  isDragOver
                    ? 'border-text-accent bg-surface-accent/5'
                    : 'border-border-default hover:border-text-accent/50',
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.zip"
                  className="hidden"
                  onChange={handleInputChange}
                />
                <FileJson className="h-10 w-10 mx-auto mb-3 text-text-tertiary" />
                <p className="text-sm text-text-secondary mb-1">
                  拖拽文件到此处，或点击选择文件
                </p>
                <p className="text-xs text-text-tertiary">
                  支持 .json（单个模版）或 .zip（批量模版）
                </p>
              </div>

              {validationError && (
                <div className="flex items-center gap-2 text-sm text-status-error">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {validationError}
                </div>
              )}

              {selectedFile && !validationError && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-surface-secondary">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileJson className="h-5 w-5 text-text-accent flex-shrink-0" />
                    <span className="text-sm text-text-primary truncate">{selectedFile.name}</span>
                    <span className="text-xs text-text-tertiary flex-shrink-0">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                    更换
                  </Button>
                </div>
              )}
            </>
          )}

          {stage === 'uploading' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-text-accent mb-3" />
              <p className="text-sm text-text-secondary">正在导入模版...</p>
            </div>
          )}

          {stage === 'result' && result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-text-primary">
                共处理 {result.total} 个模版
              </div>

              {result.imported.length > 0 && (
                <div className="space-y-2">
                  {result.imported.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-surface-secondary">
                      <CheckCircle2 className="h-4 w-4 text-status-success flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{item.name}</p>
                        {item.warnings.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.warnings.map((w, i) => (
                              <p key={i} className="text-xs text-status-warning">{w}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {result.failed.length > 0 && (
                <div className="space-y-2">
                  {result.failed.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-surface-secondary">
                      <XCircle className="h-4 w-4 text-status-error flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary truncate">{item.name}</p>
                        <p className="text-xs text-status-error">{item.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {stage === 'select' && (
            <>
              <Button variant="outline" onClick={handleClose}>取消</Button>
              <Button onClick={handleImport} disabled={!selectedFile}>
                开始导入
              </Button>
            </>
          )}
          {stage === 'result' && (
            <Button onClick={handleClose}>完成</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
