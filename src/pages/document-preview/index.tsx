import { memo, useCallback, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react'
import { Watermark } from 'antd'
import { Button, Tooltip } from '@/components/ui'
import { DocumentPreview } from '@/components/knowledge/document-preview'
import {
  buildAuthHeader,
  getDocumentUrl,
} from '@/lib/knowledge/preview-resource'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores'
import { usePreviewResource } from '@/hooks/use-preview-resource'

const DocumentPreviewPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>()
  const [searchParams] = useSearchParams()
  const [downloading, setDownloading] = useState(false)
  const user = useAuthStore((s) => s.user)

  const docName = searchParams.get('name') || undefined
  const resource = usePreviewResource({ docId, docName })

  const watermarkContent = useMemo(() => {
    const email = user?.email || user?.nickname || ''
    const date = new Date().toLocaleDateString('zh-CN')
    return [email, date]
  }, [user?.email, user?.nickname])

  const handleDownload = useCallback(async () => {
    if (!docId) return
    setDownloading(true)
    try {
      const url = getDocumentUrl(docId, 'download')
      const auth = buildAuthHeader()
      const headers: HeadersInit = {}
      if (auth) headers.Authorization = auth

      const response = await fetch(url, { headers })
      if (!response.ok) throw new Error(`下载失败: ${response.status}`)

      const contentType = response.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const data = await response.json()
        throw new Error(data.retmsg || '下载失败')
      }

      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = docName || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('[Download] error:', err)
      toast.error(err instanceof Error ? err.message : '下载失败')
    } finally {
      setDownloading(false)
    }
  }, [docId, docName])

  if (!docId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p style={{ color: 'var(--color-text-secondary)' }}>文档 ID 缺失</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div
        className="gap-space-sm px-space-md py-space-sm flex shrink-0 items-center"
        style={{
          backgroundColor: 'var(--color-background-surface)',
          borderBottom: '1px solid var(--color-border-default)',
        }}
      >
        <Tooltip content="返回">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                window.history.back()
              } else {
                window.close()
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Tooltip>

        <FileText
          className="h-4 w-4 flex-shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
        />
        <span
          className="min-w-0 flex-1 truncate text-sm font-medium"
          style={{ color: 'var(--color-text-primary)' }}
          title={docName}
        >
          {docName || '文档预览'}
        </span>

        <Tooltip content="下载文件">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </Tooltip>
      </div>

      <Watermark content={watermarkContent} className="min-h-0 flex-1">
        <DocumentPreview
          resource={resource}
          docName={docName}
          hideHeader
          className="h-full"
        />
      </Watermark>
    </div>
  )
}

export default memo(DocumentPreviewPage)
