import React, { useState } from 'react'
import { Button } from '@/components/vendor/ui/button'
import { toast } from '@/lib/toast'
import DocumentPreview from './DocumentPreview'
import { Download, CheckCircle2, RotateCcw, Eye, FileText, Clock, HardDrive, ArrowLeft } from 'lucide-react'

interface ResultDownloadProps {
  fileData: string
  onReset: () => void
  originalFileName: string
  onBackToFill?: () => void
}

const ResultDownload: React.FC<ResultDownloadProps> = ({ fileData, onReset, originalFileName, onBackToFill }) => {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const downloadFile = async () => {
    try {
      setIsDownloading(true)
      const byteChars = atob(fileData)
      const byteNumbers = new Array(byteChars.length)
      for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i)
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const ts = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const baseName = originalFileName.replace(/\.docx$/i, '')
      link.download = `${baseName}_filled_${ts}.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('文档下载成功！')
    } catch (e) {
      console.error(e)
      toast.error('下载失败，请重试')
    } finally {
      setIsDownloading(false)
    }
  }

  const currentTime = new Date().toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  const formatFileSize = (base64: string) => {
    const bytes = (base64.length * 3) / 4
    if (bytes < 1024) return `${Math.round(bytes)} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-8">
      {/* 成功状态 */}
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">文档填充完成</h2>
        <p className="text-muted-foreground">所有占位符已成功替换为您提供的数据</p>
      </div>

      {/* 文件信息卡片 */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground truncate mb-3">
              {originalFileName}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <HardDrive className="w-3.5 h-3.5" />
                <span>{formatFileSize(fileData)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{currentTime}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400">
                  已完成
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          onClick={downloadFile}
          disabled={isDownloading}
          size="lg"
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {isDownloading ? '正在下载...' : '下载文档'}
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => setShowPreview(true)}
        >
          <Eye className="w-4 h-4 mr-2" />
          在线预览
        </Button>
      </div>

      {/* 底部操作 */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {onBackToFill && (
          <Button variant="ghost" size="sm" onClick={onBackToFill}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回编辑
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onReset} className="ml-auto">
          <RotateCcw className="w-4 h-4 mr-1" />
          处理新文档
        </Button>
      </div>

      {/* 预览弹窗 */}
      {showPreview && (
        <DocumentPreview
          fileData={fileData}
          originalFileName={originalFileName}
          onClose={() => setShowPreview(false)}
          onDownload={downloadFile}
        />
      )}
    </div>
  )
}

export default ResultDownload
