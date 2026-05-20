import React, { useRef, useState } from 'react'
import { Button } from '@/components/vendor/ui/button'
import { toast } from '@/lib/toast'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileUp,
} from 'lucide-react'
import { documentAPI } from '@/api/document'
import { cn } from '@/lib/utils'

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

const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  onFileProcessed,
  isLoading,
  setIsLoading,
}) => {
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
      const result = await documentAPI.processDocx(file)
      onFileProcessed({
        placeholders: result.placeholders || {},
        file: result.file,
      })
      toast.success('文档解析成功！')
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
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      processFile(e.dataTransfer.files[0])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0])
  }

  const handleButtonClick = () => fileInputRef.current?.click()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* 上传区域 */}
      <div
        className={cn(
          'group relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200',
          dragActive &&
            'scale-[1.01] border-components-upload-border-dragover bg-components-upload-bg-dragover',
          selectedFile &&
            !isLoading &&
            'border-status-success bg-status-success-subtle',
          !dragActive &&
            !selectedFile &&
            'border-components-upload-border hover:border-components-upload-border-hover hover:bg-background-subtle',
          isLoading && 'pointer-events-none',
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center px-8 py-16">
          {/* 图标 */}
          <div
            className={cn(
              'mb-6 flex h-16 w-16 items-center justify-center rounded-2xl transition-all',
              isLoading && 'bg-status-info-subtle',
              selectedFile && !isLoading && 'bg-status-success-subtle',
              !selectedFile &&
                !isLoading &&
                'bg-background-subtle group-hover:bg-status-info-subtle',
            )}
          >
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-status-info" />
            ) : selectedFile ? (
              <CheckCircle2 className="h-8 w-8 text-status-success" />
            ) : (
              <FileUp className="h-8 w-8 text-text-secondary transition-colors group-hover:text-status-info" />
            )}
          </div>

          {/* 文字内容 */}
          {isLoading ? (
            <div className="text-center">
              <h3 className="mb-2 text-lg font-medium text-text-primary">
                正在解析文档...
              </h3>
              <p className="text-sm text-text-secondary">
                系统正在识别文档中的占位符
              </p>
            </div>
          ) : selectedFile ? (
            <div className="text-center">
              <h3 className="mb-2 text-lg font-medium text-text-primary">
                {selectedFile.name}
              </h3>
              <p className="mb-4 text-sm text-text-secondary">
                {formatFileSize(selectedFile.size)}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleButtonClick()
                }}
              >
                更换文件
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <h3 className="mb-2 text-lg font-medium text-text-primary">
                拖放文件到此处
              </h3>
              <p className="mb-4 text-sm text-text-secondary">
                或点击选择文件上传
              </p>
              <Button variant="default" size="sm">
                <Upload className="mr-2 h-4 w-4" />
                选择文件
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 文件要求说明 */}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex items-start gap-3 rounded-xl border border-border-default bg-background-subtle p-4">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" />
          <div>
            <p className="text-sm font-medium text-text-primary">支持格式</p>
            <p className="text-sm text-text-secondary">
              Microsoft Word 文档 (.docx)，最大 10MB
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-border-default bg-background-subtle p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-text-secondary" />
          <div>
            <p className="text-sm font-medium text-text-primary">占位符格式</p>
            <p className="text-sm text-text-secondary">
              使用 {'{{占位符名称}}'} 格式标记待填充位置
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileUpload
