import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/vendor/ui/card'
import { Button } from '@/components/vendor/ui/button'
import { Badge } from '@/components/vendor/ui/badge'
import { X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2, FileText } from 'lucide-react'

interface DocumentPreviewProps {
  fileData: string
  originalFileName: string
  onClose: () => void
  onDownload: () => void
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ fileData, originalFileName, onClose, onDownload }) => {
  const [zoom, setZoom] = React.useState(100)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-text-accent" />
            <div>
              <h3 className="font-medium">{originalFileName}</h3>
              <p className="text-sm text-text-secondary">文档预览</p>
            </div>
            <Badge variant="outline">已填充</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-background rounded-md p-1 border">
              <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.max(50, z - 25))}><ZoomOut className="w-4 h-4" /></Button>
              <span className="text-sm px-2 min-w-[3rem] text-center">{zoom}%</span>
              <Button variant="ghost" size="sm" onClick={() => setZoom((z) => Math.min(200, z + 25))}><ZoomIn className="w-4 h-4" /></Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setZoom(100)}><RotateCw className="w-4 h-4 mr-1" />重置</Button>
            <Button variant="outline" size="sm"><Maximize2 className="w-4 h-4 mr-1" />全屏</Button>
            <Button onClick={onDownload} size="sm"><Download className="w-4 h-4 mr-1" />下载</Button>
            <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-background-subtle p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg mx-auto" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', width: '210mm', minHeight: '297mm', padding: '25mm 20mm', lineHeight: 1.5 }}>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">员工信息登记表</h1>
                <p className="text-gray-600 text-sm">Employee Information Registration Form</p>
              </div>
              <div className="text-sm text-text-secondary">（演示预览，实际渲染略）</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DocumentPreview


