import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Upload,
  Download,
  Package,
  FileText,
  CheckSquare,
  Square,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Loader2,
  Copy,
  Globe,
  Activity,
  Database,
} from 'lucide-react'
import type { MCPServer } from '@/types/mcp'
import { mcpAPI } from '@/api/mcp'
import { toast } from '@/lib/toast'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'

interface BatchOperation {
  type: 'import' | 'export' | 'delete'
  data?: any
  result?: {
    success: boolean
    message: string
    details?: any
  }
}

export const MCPBatchPage: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [selectedServers, setSelectedServers] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [operating, setOperating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // 导入导出数据
  const [importData, setImportData] = useState('')
  const [exportResult, setExportResult] = useState<string>('')
  const [operationHistory, setOperationHistory] = useState<
    (BatchOperation & { timestamp: Date })[]
  >([])

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      setLoading(true)
      const response = await mcpAPI.listServers({}, { page_size: 100 })
      setServers(response.mcp_servers || [])
    } catch (error) {
      toast.error('加载服务器列表失败')
      console.error('Load servers error:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredServers = servers.filter(
    (server) =>
      server.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      server.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelectAll = () => {
    if (selectedServers.size === filteredServers.length) {
      setSelectedServers(new Set())
    } else {
      setSelectedServers(new Set(filteredServers.map((s) => s.id)))
    }
  }

  const handleSelectServer = (serverId: string) => {
    const newSelected = new Set(selectedServers)
    if (newSelected.has(serverId)) {
      newSelected.delete(serverId)
    } else {
      newSelected.add(serverId)
    }
    setSelectedServers(newSelected)
  }

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('请输入要导入的配置数据')
      return
    }

    try {
      setOperating(true)

      let mcpServers
      try {
        mcpServers = JSON.parse(importData)
      } catch (e) {
        throw new Error('导入数据格式错误，请确保是有效的JSON格式')
      }

      const result = await mcpAPI.import({ mcpServers })

      const operation: BatchOperation = {
        type: 'import',
        data: { serversCount: Object.keys(mcpServers).length },
        result: {
          success: true,
          message: '导入成功',
          details: result.results,
        },
      }

      setOperationHistory((prev) => [
        { ...operation, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
      setImportData('')
      loadServers()
      toast.success(`成功导入 ${Object.keys(mcpServers).length} 个服务器配置`)
    } catch (error: any) {
      const operation: BatchOperation = {
        type: 'import',
        data: { error: error.message },
        result: {
          success: false,
          message: error.message || '导入失败',
        },
      }

      setOperationHistory((prev) => [
        { ...operation, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
      toast.error('导入失败: ' + error.message)
    } finally {
      setOperating(false)
    }
  }

  const handleExport = async () => {
    if (selectedServers.size === 0) {
      toast.error('请选择要导出的服务器')
      return
    }

    try {
      setOperating(true)

      const serverIds = Array.from(selectedServers)
      const result = await mcpAPI.export({ mcp_ids: serverIds })

      const exportJson = JSON.stringify(result.mcpServers, null, 2)
      setExportResult(exportJson)

      const operation: BatchOperation = {
        type: 'export',
        data: { serversCount: serverIds.length },
        result: {
          success: true,
          message: '导出成功',
          details: { serversCount: serverIds.length },
        },
      }

      setOperationHistory((prev) => [
        { ...operation, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
      toast.success(`成功导出 ${serverIds.length} 个服务器配置`)
    } catch (error: any) {
      const operation: BatchOperation = {
        type: 'export',
        data: { error: error.message },
        result: {
          success: false,
          message: error.message || '导出失败',
        },
      }

      setOperationHistory((prev) => [
        { ...operation, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
      toast.error('导出失败: ' + error.message)
    } finally {
      setOperating(false)
    }
  }

  const handleBatchDelete = async () => {
    if (selectedServers.size === 0) {
      toast.error('请选择要删除的服务器')
      return
    }

    try {
      setOperating(true)

      const serverIds = Array.from(selectedServers)
      await mcpAPI.deleteServers(serverIds)

      const operation: BatchOperation = {
        type: 'delete',
        data: { serversCount: serverIds.length },
        result: {
          success: true,
          message: '批量删除成功',
          details: { deletedIds: serverIds },
        },
      }

      setOperationHistory((prev) => [
        { ...operation, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
      setSelectedServers(new Set())
      loadServers()
      toast.success(`成功删除 ${serverIds.length} 个服务器`)
    } catch (error: any) {
      const operation: BatchOperation = {
        type: 'delete',
        data: { error: error.message },
        result: {
          success: false,
          message: error.message || '批量删除失败',
        },
      }

      setOperationHistory((prev) => [
        { ...operation, timestamp: new Date() },
        ...prev.slice(0, 9),
      ])
      toast.error('批量删除失败: ' + error.message)
    } finally {
      setOperating(false)
    }
  }

  const copyExportResult = (text: string) =>
    copyToClipboardWithFeedback(text, '已复制到剪贴板', '复制失败')

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getServerTypeColor = (type: string) => {
    switch (type) {
      case 'stdio':
        return 'bg-purple-100 text-purple-800'
      case 'sse':
        return 'bg-green-100 text-green-800'
      case 'streamable-http':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-background-subtle text-text-primary'
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

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">MCP批量操作</h1>
          <p className="mt-1 text-muted-foreground">
            批量管理MCP服务器配置，支持导入、导出和删除操作
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="border-blue-200 bg-blue-50 text-blue-700">
            已选择 {selectedServers.size} 个服务器
          </Badge>
          <Button
            onClick={loadServers}
            variant="outline"
            className="smooth-transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 主要操作区域 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 批量操作面板 */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                批量操作面板
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="import" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-3">
                  <TabsTrigger value="import">导入配置</TabsTrigger>
                  <TabsTrigger value="export">导出配置</TabsTrigger>
                  <TabsTrigger value="delete">批量删除</TabsTrigger>
                </TabsList>

                <TabsContent value="import" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary">
                        配置数据 (JSON格式)
                      </label>
                      <Textarea
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder={`请输入JSON格式的配置数据，例如：
{
  "server1": {
    "type": "http",
    "url": "http://localhost:3000",
    "authorization_token": "your-token"
  }
}`}
                        className="min-h-[200px] border-0 bg-background-subtle font-mono text-sm focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        onClick={handleImport}
                        disabled={operating || !importData.trim()}
                        variant="default"
                      >
                        {operating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {operating ? '导入中...' : '开始导入'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="export" className="space-y-4">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Info className="h-4 w-4" />
                        <span className="font-medium">导出说明</span>
                      </div>
                      <p className="mt-1 text-sm text-blue-700">
                        选择要导出的服务器，点击导出按钮生成JSON配置文件
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        已选择 {selectedServers.size} 个服务器
                      </p>
                      <Button
                        onClick={handleExport}
                        disabled={operating || selectedServers.size === 0}
                        variant="default"
                      >
                        {operating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="mr-2 h-4 w-4" />
                        )}
                        {operating ? '导出中...' : '导出配置'}
                      </Button>
                    </div>

                    {exportResult && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-text-secondary">
                            导出结果
                          </label>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => copyExportResult(exportResult)}
                            >
                              <Copy className="mr-1 h-3 w-3" />
                              复制
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                downloadFile(
                                  exportResult,
                                  `mcp-servers-${new Date().getTime()}.json`,
                                )
                              }
                            >
                              <Download className="mr-1 h-3 w-3" />
                              下载
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={exportResult}
                          readOnly
                          className="min-h-[200px] border-0 bg-background-subtle font-mono text-sm"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="delete" className="space-y-4">
                  <div className="space-y-4">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">危险操作</span>
                      </div>
                      <p className="mt-1 text-sm text-red-700">
                        删除操作无法撤销，请确认选择的服务器后再执行删除
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        已选择 {selectedServers.size} 个服务器待删除
                      </p>
                      <Button
                        onClick={handleBatchDelete}
                        disabled={operating || selectedServers.size === 0}
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {operating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        {operating ? '删除中...' : '批量删除'}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 服务器选择列表 */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  服务器选择
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSelectAll}
                    className="text-xs"
                  >
                    {selectedServers.size === filteredServers.length ? (
                      <>
                        <Square className="mr-1 h-3 w-3" />
                        取消全选
                      </>
                    ) : (
                      <>
                        <CheckSquare className="mr-1 h-3 w-3" />
                        全选
                      </>
                    )}
                  </Button>
                  <Input
                    placeholder="搜索服务器..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 w-48 border-0 bg-background-subtle text-sm focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
                  <p className="text-muted-foreground">正在加载服务器列表...</p>
                </div>
              ) : filteredServers.length === 0 ? (
                <div className="py-8 text-center">
                  <Database className="mx-auto mb-4 h-12 w-12 text-text-muted" />
                  <p className="text-muted-foreground">
                    {searchTerm ? '未找到匹配的服务器' : '暂无可用服务器'}
                  </p>
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {filteredServers.map((server) => (
                    <div
                      key={server.id}
                      className={`cursor-pointer rounded-lg border p-4 transition-all ${
                        selectedServers.has(server.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-border-default hover:border-border-subtle hover:bg-background-subtle'
                      }`}
                      onClick={() => handleSelectServer(server.id)}
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={selectedServers.has(server.id)}
                          onChange={() => handleSelectServer(server.id)}
                          className="flex-shrink-0"
                        />
                        <div className="flex flex-1 items-center gap-3">
                          <div className="rounded-lg bg-background-subtle p-2">
                            <Globe className="h-4 w-4 text-text-secondary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-text-primary">
                                {server.name}
                              </span>
                              <Badge
                                className={`${getServerTypeColor(server.server_type)} text-xs`}
                              >
                                {server.server_type.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="truncate text-sm text-muted-foreground">
                              {server.url}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              创建时间: {formatDate(server.create_time)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">在线</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧边栏 */}
        <div className="space-y-6">
          {/* 操作统计 */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                操作统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    服务器总数
                  </span>
                  <span className="font-medium">{servers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">已选择</span>
                  <span className="font-medium text-blue-600">
                    {selectedServers.size}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    筛选结果
                  </span>
                  <span className="font-medium">{filteredServers.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    历史操作
                  </span>
                  <span className="font-medium">{operationHistory.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 操作历史 */}
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

          {/* 操作说明 */}
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                操作说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></div>
                  <p>导入：支持JSON格式的批量配置导入</p>
                </div>
                <div className="flex gap-2">
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500"></div>
                  <p>导出：将选中的服务器配置导出为JSON文件</p>
                </div>
                <div className="flex gap-2">
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500"></div>
                  <p>删除：批量删除选中的服务器（不可恢复）</p>
                </div>
                <div className="flex gap-2">
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-text-tertiary"></div>
                  <p>支持搜索和全选功能，提高操作效率</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
