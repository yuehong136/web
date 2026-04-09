import { memo, useCallback, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react'
import { Watermark } from 'antd'
import { Button, Tooltip } from '@/components/ui'
import { DocumentPreview } from '@/components/knowledge/DocumentPreview'
import { API_BASE_URL, API_VERSION, STORAGE_KEYS } from '@/constants'
import { toast } from '@/lib/toast'
import { useAuthStore } from '@/stores'

function buildAuthHeader(): string | null {
  try {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
    if (!token) return null
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`
  } catch {
    return null
  }
}

const DocumentPreviewPage: React.FC = () => {
  const { docId } = useParams<{ docId: string }>()
  const [searchParams] = useSearchParams()
  const [downloading, setDownloading] = useState(false)
  const user = useAuthStore((s) => s.user)

  const docName = searchParams.get('name') || undefined

  const watermarkContent = useMemo(() => {
    const email = user?.email || user?.nickname || ''
    const date = new Date().toLocaleDateString('zh-CN')
    return [email, date]
  }, [user?.email, user?.nickname])

  const handleDownload = useCallback(async () => {
    if (!docId) return
    setDownloading(true)
    try {
      const url = `${API_BASE_URL}/${API_VERSION}/document/get/${docId}?action=download`
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
    <div className="flex flex-col h-full">
      <div
        className="flex items-center gap-space-sm px-space-md py-space-sm shrink-0"
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
          className="text-sm font-medium truncate flex-1 min-w-0"
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

      <Watermark content={watermarkContent} className="flex-1 min-h-0">
        <DocumentPreview
          docId={docId}
          docName={docName}
          hideHeader
          className="h-full"
        />
      </Watermark>
    </div>
  )
}

export default memo(DocumentPreviewPage)
