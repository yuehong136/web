import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import type { MCPServer, MCPTool } from '@/types/mcp'
export interface TestResult {
  success: boolean
  tools?: MCPTool[]
  error?: string
  duration?: number
  timestamp?: Date
}

export function McpTestSidebar({
  servers,
  loading,
  testHistory,
  handleServerSelect,
}: {
  servers: MCPServer[]
  loading: boolean
  testHistory: (TestResult & { serverInfo?: { url?: string } })[]
  handleServerSelect: (server: MCPServer) => void
}) {
  return (
    <div className="space-y-6">
      {/* 快速选择服务器 */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings className="h-4 w-4" />
            快速选择服务器
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-4 text-center">
              <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
              <p className="text-sm text-muted-foreground">加载中...</p>
            </div>
          ) : servers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              暂无可用服务器
            </p>
          ) : (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {servers.map((server) => (
                <div
                  key={server.id}
                  className="cursor-pointer rounded-lg border border-border-default p-3 transition-colors hover:bg-background-subtle"
                  onClick={() => handleServerSelect(server)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      {server.name}
                    </span>
                    <Badge className="bg-background-subtle text-xs text-text-primary">
                      {server.server_type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {server.url}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 测试历史 */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            测试历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          {testHistory.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              暂无测试历史
            </p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {testHistory.map((result, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-border-default p-3"
                >
                  <div className="mb-2 flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">
                      {result.success ? '成功' : '失败'}
                    </span>
                    {result.duration && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {result.serverInfo?.url}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {result.timestamp?.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 测试说明 */}
      <Card className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            测试说明
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-2">
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></div>
              <p>测试将验证服务器URL的可访问性</p>
            </div>
            <div className="flex gap-2">
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></div>
              <p>检查协议类型是否匹配</p>
            </div>
            <div className="flex gap-2">
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></div>
              <p>获取服务器提供的工具列表</p>
            </div>
            <div className="flex gap-2">
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500"></div>
              <p>测量连接响应时间</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
