import React, { useRef, useState } from 'react'
import { Button } from '@/components/vendor/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/lib/toast'
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react'

export interface PlaceholderData {
  [key: string]: string
}

export interface ProcessedFile {
  placeholders: PlaceholderData
  file: string
}

interface FileUploadProps {
  onFileUploaded: (file: File) => void
  onFileProcessed: (data: ProcessedFile) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, onFileProcessed, isLoading, setIsLoading }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const validateFile = (file: File): boolean => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error('仅支持 .docx 格式的Word文档')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('文件大小不能超过 10MB')
      return false
    }
    return true
  }

  const processFile = async (file: File) => {
    if (!validateFile(file)) return
    setSelectedFile(file)
    onFileUploaded(file)
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 1000))
      const mockPlaceholders: PlaceholderData = {
        姓名: '',
        日期: '',
        部门: '',
        职位: '',
        联系电话: '',
        邮箱地址: '',
        工作内容: '',
        备注: '',
      }
      const mockFileData =
        'UEsDBBQAAAAIAEaMfVCJg5+iSwEAAO0CAAAOAAAAd29yZC9kb2N1bWVudC54bWyVkE1rwzAMhu8L/Q9D91iJkw+S2s5gY6Vs7HKYoKfBtqrYeFLwR/vz52zstmOHnYQevXqlV4LrOl46Z7aTQsm3wMuwCKy0iuzE2FdJy9BGRN7TxWJhpZW5LLTaSiGtsO5aa+lHdJRdaZO4SuZu7Grf6EZmWm0lp5QQQgghJJ4HbePXUBsrJ1sB7JalrdKhHWqRtXsU7mUorS2K+bxIssf8Lb7J97k5jE5H34kz7qHt6qm01dReKqs75xSCkUhGhKB4RtNOLCvVXCJJFRUmLZs3TJvS1z2fdOH8n8E4mS4zYjN2DPyZjNlRSsqf6t5fSm8vpxAUhGHfSPkwXPyeUlIgCCEFCAiCkBGFGCIFgT8T1iqYg=='
      onFileProcessed({ placeholders: mockPlaceholders, file: mockFileData })
      toast.success('文档处理成功！')
    } catch (e) {
      console.error(e)
      toast.error('文档处理失败，请重试')
      setSelectedFile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0])
  }

  const handleButtonClick = () => fileInputRef.current?.click()

  return (
    <div className="space-y-6">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-components-upload-border-dragover bg-components-upload-bg-dragover'
            : selectedFile
            ? 'border-components-alert-success-border bg-components-alert-success-bg'
            : 'border-components-upload-border hover:border-components-upload-border-hover bg-components-upload-bg'
        } ${isLoading ? 'pointer-events-none opacity-60' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input ref={fileInputRef} type="file" accept=".docx" onChange={handleFileSelect} className="hidden" disabled={isLoading} />

        <div className="flex flex-col items-center gap-4">
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-components-spinner-color animate-spin" />
          ) : selectedFile ? (
            <FileText className="w-12 h-12 text-text-success" />
          ) : (
            <Upload className="w-12 h-12 text-text-tertiary" />
          )}

          <div>
            {isLoading ? (
              <div>
                <h3 className="mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>正在处理文档...</h3>
                <p style={{ color: 'rgb(var(--color-text-secondary))' }}>请稍候，系统正在分析文档中的占位符</p>
              </div>
            ) : selectedFile ? (
              <div>
                <h3 className="mb-2 text-success-700">文件已选择</h3>
                <p className="text-text-secondary">{selectedFile.name}</p>
                <p className="text-sm text-text-tertiary mt-1">大小: {(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <h3 className="mb-2" style={{ color: 'rgb(var(--color-text-primary))' }}>拖拽文件到此处或点击上传</h3>
                <p style={{ color: 'rgb(var(--color-text-secondary))' }}>支持 .docx 格式的Word文档，最大 10MB</p>
              </div>
            )}
          </div>

          {!isLoading && !selectedFile && (
            <Button onClick={handleButtonClick} variant="outline" className="mt-2">
              <Upload className="w-4 h-4 mr-2" /> 选择文件
            </Button>
          )}
          {selectedFile && !isLoading && (
            <Button onClick={handleButtonClick} variant="outline" className="mt-2">
              <Upload className="w-4 h-4 mr-2" /> 选择其他文件
            </Button>
          )}演示模式
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p>
              <strong>文档要求：</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>仅支持 .docx 格式的Microsoft Word文档</li>
              <li>
                文档中应包含带占位符的表格（格式：{'{{占位符名称}}'}）
              </li>
              <li>系统将自动识别并标准化所有占位符</li>
              <li>支持表格的右填充和下填充功能</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* 演示模式提示，贴近参考项目样式 */}
      <div className="rounded-xl border p-4 bg-components-alert-info-bg border-components-alert-info-border text-components-alert-info-text">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-components-badge-info-bg text-components-badge-info-text">演示模式</span>
          <div className="text-sm leading-6">
            当前为前端演示版本，使用模拟数据展示功能流程。实际部署时需要连接后端 API 服务。
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileUpload


