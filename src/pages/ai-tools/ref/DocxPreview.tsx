import React, { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { Loader2, ZoomIn, ZoomOut, RotateCcw, AlertCircle } from 'lucide-react'
import { Button } from '@/components/vendor/ui/button'
import { cn } from '@/lib/utils'

interface DocxPreviewProps {
  /** Base64 编码的 docx 文件内容 */
  fileData: string | null
  /** 自定义样式类 */
  className?: string
  /** 预览区域标题 */
  title?: string
}

const DocxPreview: React.FC<DocxPreviewProps> = ({ fileData, className, title = '文档预览' }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  useEffect(() => {
    if (!fileData || !containerRef.current) return

    const renderDocument = async () => {
      setLoading(true)
      setError(null)

      try {
        // 清空容器
        if (containerRef.current) {
          containerRef.current.innerHTML = ''
        }

        // Base64 转 ArrayBuffer
        const binaryString = atob(fileData)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const arrayBuffer = bytes.buffer

        // 渲染文档
        await renderAsync(arrayBuffer, containerRef.current!, undefined, {
          className: 'docx-preview-wrapper',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
          trimXmlDeclaration: true,
          useBase64URL: true,
          renderHeaders: true,
          renderFooters: true,
          renderFootnotes: true,
          renderEndnotes: true,
        })
      } catch (err) {
        console.error('Failed to render docx:', err)
        setError('文档渲染失败，请检查文件格式')
      } finally {
        setLoading(false)
      }
    }

    renderDocument()
  }, [fileData])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }

  const handleResetZoom = () => {
    setZoom(100)
  }

  if (!fileData) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-text-secondary', className)}>
        <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">暂无文档预览</p>
        <p className="text-xs mt-1">上传文档后将在此处显示预览</p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 工具栏 */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-border-default bg-background-subtle">
        <span className="text-sm text-text-secondary">{title}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
            className="h-7 w-7 p-0"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs text-text-secondary min-w-[3rem] text-center">
            {zoom}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
            className="h-7 w-7 p-0"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetZoom}
            className="h-7 w-7 p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 预览区域 */}
      <div className="flex-1 overflow-auto bg-background-subtle">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-state-info" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center h-full text-state-error">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div
          ref={containerRef}
          className={cn(
            'docx-preview-container p-4 transition-transform origin-top-left',
            loading && 'hidden'
          )}
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        />
      </div>

      {/* 全局样式 */}
      <style>{`
        .docx-preview-container {
          min-height: 100%;
        }
        .docx-preview-container .docx-wrapper {
          background: var(--background);
          padding: 16px;
        }
        .docx-preview-container .docx-wrapper > section.docx {
          background: white;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 16px;
          padding: 40px 60px;
          min-height: auto;
        }
        .dark .docx-preview-container .docx-wrapper > section.docx {
          background: hsl(var(--card));
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .docx-preview-container table {
          border-collapse: collapse;
          width: 100%;
        }
        .docx-preview-container table td,
        .docx-preview-container table th {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .dark .docx-preview-container table td,
        .dark .docx-preview-container table th {
          border-color: hsl(var(--border));
        }
      `}</style>
    </div>
  )
}

export default DocxPreview

