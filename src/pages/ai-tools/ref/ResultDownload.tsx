import React, { useState } from 'react'
import { Button } from '@/components/vendor/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/vendor/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/vendor/ui/badge'
import { toast } from '@/lib/toast'
import DocumentPreview from './DocumentPreview'
import { Download, FileText, CheckCircle, RotateCcw, Share2, Eye, Clock } from 'lucide-react'

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
      link.download = `${baseName}_填充完成_${ts}.docx`
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

  const currentTime = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  const formatFileSize = (base64: string) => {
    const bytes = (base64.length * 3) / 4
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <Card className="border-components-alert-success-border bg-components-alert-success-bg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-text-success" />
            <CardTitle className="text-text-success">文档填充完成！</CardTitle>
          </div>
          <CardDescription className="text-text-success">恭喜！您的文档已成功填充所有占位符数据</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" />文件信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-text-secondary">原始文件名</span><span className="font-medium">{originalFileName}</span></div>
              <div className="flex items-center justify-between"><span className="text-text-secondary">处理状态</span><Badge variant="default">已完成</Badge></div>
              <div className="flex items-center justify-between"><span className="text-text-secondary">文件大小</span><span className="font-medium">{formatFileSize(fileData)}</span></div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between"><span className="text-text-secondary">处理时间</span><span className="font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{currentTime}</span></div>
              <div className="flex items-center justify-between"><span className="text-text-secondary">文档类型</span><span className="font-medium">Microsoft Word (.docx)</span></div>
              <div className="flex items-center justify-between"><span className="text-text-secondary">编码格式</span><span className="font-medium">UTF-8</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        <Button onClick={downloadFile} disabled={isDownloading} size="lg" className="w-full"><Download className="w-4 h-4 mr-2" />{isDownloading ? '正在下载...' : '下载文档'}</Button>
        <Button variant="outline" size="lg" className="w-full" onClick={() => setShowPreview(true)}><Eye className="w-4 h-4 mr-2" />在线预览</Button>
      </div>

      {onBackToFill && (
        <div className="flex justify-end">
          <Button variant="ghost" onClick={onBackToFill}><RotateCcw className="w-4 h-4 mr-2" />返回填写继续编辑</Button>
        </div>
      )}

      <Alert>
        <AlertDescription>
          <div className="space-y-2">
            <p><strong>处理完成</strong></p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>所有占位符已成功填充为您提供的数据</li>
              <li>文档格式和样式保持不变</li>
              <li>可以在线预览填充后的效果</li>
              <li>下载的文档可以直接使用Microsoft Word打开</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {showPreview && (
        <DocumentPreview
          fileData={fileData}
          originalFileName={originalFileName}
          onClose={() => setShowPreview(false)}
          onDownload={downloadFile}
        />
      )}

      <div className="text-center text-sm text-text-secondary">如需处理更多文档，请点击“处理新文档”。</div>
      <div className="flex justify-end"><Button variant="outline" onClick={onReset}><RotateCcw className="w-4 h-4 mr-2" />处理新文档</Button></div>
    </div>
  )
}

export default ResultDownload


