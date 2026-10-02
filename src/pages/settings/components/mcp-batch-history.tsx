import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import {
  FileText,
  Upload,
  Download,
  Trash2,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react'

export interface BatchOperation {
  type: 'import' | 'export' | 'delete'
  data?: any
  result?: {
    success: boolean
    message: string
    details?: any
  }
}

const getOperationIcon = (type: string) => {
  switch (type) {
    case 'import':
      return Upload
    case 'export':
      return Download
    case 'delete':
      return Trash2
    default:
      return Info
  }
}

const getOperationColor = (type: string) => {
  switch (type) {
    case 'import':
      return 'text-blue-600'
    case 'export':
      return 'text-green-600'
    case 'delete':
      return 'text-red-600'
    default:
      return 'text-text-secondary'
  }
}

export function McpBatchHistory({
  operationHistory,
}: {
  operationHistory: (BatchOperation & { timestamp: Date })[]
}) {
  return (
    <Card className="card-modern">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          操作历史
        </CardTitle>
      </CardHeader>
      <CardContent>
        {operationHistory.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            暂无操作历史
          </p>
        ) : (
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {operationHistory.map((operation, index) => {
              const Icon = getOperationIcon(operation.type)
              const iconColor = getOperationColor(operation.type)

              return (
                <div
                  key={index}
                  className="rounded-lg border border-border-default p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${iconColor}`} />
                    <span className="text-sm font-medium capitalize">
                      {operation.type === 'import'
                        ? '导入'
                        : operation.type === 'export'
                          ? '导出'
                          : '删除'}
                    </span>
                    {operation.result &&
                      (operation.result.success ? (
                        <CheckCircle className="ml-auto h-3 w-3 text-green-600" />
                      ) : (
                        <XCircle className="ml-auto h-3 w-3 text-red-600" />
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {operation.result?.message || '操作执行中...'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {operation.timestamp.toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
