import React, { useEffect, useRef, useState } from 'react'
import { renderAsync } from 'docx-preview'
import { Button } from '@/components/vendor/ui/button'
import { Badge } from '@/components/vendor/ui/badge'
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Maximize2, FileText, Loader2 } from 'lucide-react'

interface DocumentPreviewProps {
  fileData: string
  originalFileName: string
  onClose: () => void
  onDownload: () => void
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ fileData, originalFileName, onClose, onDownload }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
          className: 'docx-preview-modal',
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

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // ESC 键退出
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false)
        } else {
          onClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, onClose])

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div 
        className={`bg-background rounded-xl shadow-2xl flex flex-col transition-all duration-200 ${
          isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full max-w-6xl h-full max-h-[90vh]'
        }`}
      >
        {/* 工具栏 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-medium text-foreground text-sm">{originalFileName}</h3>
              <p className="text-xs text-muted-foreground">文档预览</p>
            </div>
            <Badge variant="secondary" className="ml-2">已填充</Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* 缩放控制 */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
                disabled={zoom <= 50}
                className="h-7 w-7 p-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm px-2 min-w-[3rem] text-center text-muted-foreground">{zoom}%</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
                disabled={zoom >= 200}
                className="h-7 w-7 p-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" onClick={() => setZoom(100)} className="h-8">
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen} className="h-8">
              <Maximize2 className="w-4 h-4 mr-1" />
              {isFullscreen ? '退出' : '全屏'}
            </Button>
            <Button onClick={onDownload} size="sm" className="h-8">
              <Download className="w-4 h-4 mr-1" />
              下载
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 预览区域 */}
        <div className="flex-1 overflow-auto bg-muted/30">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">正在渲染文档...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-destructive">
                <p className="text-sm">{error}</p>
            </div>
          </div>
          )}

          <div
            ref={containerRef}
            className={`docx-preview-modal-container p-6 ${loading ? 'hidden' : ''}`}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
            }}
          />
        </div>
      </div>

      {/* 全局样式 */}
      <style>{`
        .docx-preview-modal-container {
          min-height: 100%;
        }
        .docx-preview-modal-container .docx-wrapper {
          background: transparent;
          padding: 0;
        }
        .docx-preview-modal-container .docx-wrapper > section.docx {
          background: white;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          margin: 0 auto 24px;
          padding: 60px 80px;
          min-height: auto;
          max-width: 210mm;
        }
        .dark .docx-preview-modal-container .docx-wrapper > section.docx {
          background: hsl(var(--card));
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
        }
        .docx-preview-modal-container table {
          border-collapse: collapse;
          width: 100%;
        }
        .docx-preview-modal-container table td,
        .docx-preview-modal-container table th {
          border: 1px solid #ddd;
          padding: 8px;
        }
        .dark .docx-preview-modal-container table td,
        .dark .docx-preview-modal-container table th {
          border-color: hsl(var(--border));
        }
      `}</style>
    </div>
  )
}

export default DocumentPreview
