import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  RefreshCw, 
  Play,
  Settings, 
  Zap, 
  TestTube,
  Code,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Layers,
  Box,
  Filter,
  Download,
  Sparkles,
  Loader2,
  ChevronRight,
  ExternalLink
} from 'lucide-react'
import type { MCPServer, MCPTool } from '@/types/mcp'
import { mcpAPI } from '@/api/mcp'
import { toast } from '@/lib/toast'

interface MCPToolsPageProps {
  serverId?: string
}

interface ToolWithServer extends MCPTool {
  serverId: string
  serverName: string
}

interface TestResult {
  success: boolean
  content?: any[]
  error?: string
  duration?: number
}

export const MCPToolsPage: React.FC<MCPToolsPageProps> = ({ serverId }) => {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [tools, setTools] = useState<Record<string, MCPTool[]>>({})
  const [flatTools, setFlatTools] = useState<ToolWithServer[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTool, setSelectedTool] = useState<ToolWithServer | null>(null)
  const [showTestDialog, setShowTestDialog] = useState(false)
  const [testArguments, setTestArguments] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testing, setTesting] = useState(false)
  const [selectedServer, setSelectedServer] = useState<string>(serverId || 'all')

  useEffect(() => {
    loadServersAndTools()
  }, [])

  const loadServersAndTools = async () => {
    try {
      setLoading(true)
      
      // 加载服务器列表
      const serverResponse = await mcpAPI.listServers({}, { page_size: 100 })
      const serverList = serverResponse.mcp_servers || []
      setServers(serverList)

      if (serverList.length === 0) {
        setTools({})
        setFlatTools([])
        return
      }

      // 加载工具列表
      const serverIds = serverId ? [serverId] : serverList.map(s => s.id)
      const toolsResponse = await mcpAPI.listTools({ 
        mcp_ids: serverIds,
        timeout: 30000
      })
      
      setTools(toolsResponse)
      
      // 转换为扁平化结构
      const flat: ToolWithServer[] = []
      Object.entries(toolsResponse).forEach(([serverIdKey, toolList]) => {
        const server = serverList.find(s => s.id === serverIdKey)
        if (server && toolList) {
          toolList.forEach(tool => {
            flat.push({
              ...tool,
              serverId: serverIdKey,
              serverName: server.name
            })
          })
        }
      })
      setFlatTools(flat)
      
    } catch (error: any) {
      toast.error('加载工具列表失败: ' + (error.message || '未知错误'))
      console.error('Load tools error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestTool = async () => {
    if (!selectedTool) return

    try {
      setTesting(true)
      setTestResult(null)
      
      let args = {}
      if (testArguments.trim()) {
        try {
          args = JSON.parse(testArguments)
        } catch (e) {
          toast.error('参数格式错误，请输入有效的JSON')
          return
        }
      }

      const startTime = Date.now()
      const result = await mcpAPI.testTool({
        mcp_id: selectedTool.serverId,
        tool_name: selectedTool.name,
        arguments: args,
        timeout: 30000
      })
      const endTime = Date.now()

      setTestResult({
        success: !result.isError,
        content: result.content,
        error: result.isError ? (result.content?.[0]?.text || '执行失败') : undefined,
        duration: endTime - startTime
      })

      if (!result.isError) {
        toast.success('工具测试成功')
      } else {
        toast.error('工具测试失败')
      }

    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || '测试失败'
      })
      toast.error('工具测试失败')
    } finally {
      setTesting(false)
    }
  }

  const handleCacheTools = async (serverIdParam: string) => {
    try {
      const serverTools = tools[serverIdParam]
      if (!serverTools) {
        toast.error('没有找到该服务器的工具')
        return
      }

      await mcpAPI.cacheTools({
        mcp_id: serverIdParam,
        tools: serverTools
      })

      toast.success('工具配置缓存成功')
    } catch (error: any) {
      toast.error('缓存失败: ' + (error.message || '未知错误'))
    }
  }

  const filteredTools = flatTools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tool.serverName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesServer = selectedServer === 'all' || tool.serverId === selectedServer
    
    return matchesSearch && matchesServer
  })

  const getToolStatusIcon = (tool: ToolWithServer) => {
    if (tool.enabled === false) return { icon: AlertCircle, color: 'text-state-warning', bg: 'bg-components-badge-warning-bg' }
    if (tool.inputSchema) return { icon: CheckCircle, color: 'text-state-success', bg: 'bg-components-badge-success-bg' }
    return { icon: Clock, color: 'text-text-accent', bg: 'bg-components-badge-info-bg' }
  }

  const formatArguments = (tool: ToolWithServer) => {
    if (!tool.inputSchema?.properties) return '无参数'
    const props = Object.keys(tool.inputSchema.properties)
    return `${props.length} 个参数: ${props.slice(0, 3).join(', ')}${props.length > 3 ? '...' : ''}`
  }

  // 统计数据
  const stats = {
    totalTools: flatTools.length,
    enabledTools: flatTools.filter(t => t.enabled !== false).length,
    servers: Object.keys(tools).length,
    toolsWithSchema: flatTools.filter(t => t.inputSchema).length
  }

  return (
    <div className="h-full flex flex-col bg-background-body">
      {/* 页面头部 */}
      <div className="p-8 pb-4">
        <div className="bg-components-card-bg rounded-3xl p-8 border border-components-card-border shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-components-button-primary-bg rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="h-8 w-8 text-components-button-primary-text" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-text-primary">
                  MCP工具管理
                </h1>
                <p className="text-text-secondary mt-1 text-lg">
                  管理和测试所有MCP服务器提供的工具能力
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={loadServersAndTools} 
                variant="outline"
                className="border-components-input-border hover:bg-state-hover hover:border-components-input-border-hover transition-all px-6 py-3 rounded-xl"
                disabled={loading}
              >
                <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                刷新工具
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-components-card-border bg-components-card-bg hover:bg-components-card-bg-hover transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-components-button-primary-bg rounded-xl flex items-center justify-center shadow-md">
                    <Box className="h-6 w-6 text-components-button-primary-text" />
                  </div>
                  <Sparkles className="h-5 w-5 text-text-accent opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">工具总数</p>
                  <p className="text-3xl font-bold text-text-primary">{stats.totalTools}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-components-card-border bg-components-card-bg hover:bg-components-card-bg-hover transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-state-success rounded-xl flex items-center justify-center shadow-md">
                    <CheckCircle className="h-6 w-6 text-components-button-primary-text" />
                  </div>
                  <div className="w-2 h-2 bg-state-success rounded-full animate-pulse"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">可用工具</p>
                  <p className="text-3xl font-bold text-text-primary">{stats.enabledTools}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-components-card-border bg-components-card-bg hover:bg-components-card-bg-hover transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-text-accent rounded-xl flex items-center justify-center shadow-md">
                    <Layers className="h-6 w-6 text-components-button-primary-text" />
                  </div>
                  <Activity className="h-5 w-5 text-text-accent opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">服务器数</p>
                  <p className="text-3xl font-bold text-text-primary">{stats.servers}</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-components-card-border bg-components-card-bg hover:bg-components-card-bg-hover transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-state-warning rounded-xl flex items-center justify-center shadow-md">
                    <Code className="h-6 w-6 text-components-button-primary-text" />
                  </div>
                  <Settings className="h-5 w-5 text-text-accent opacity-60" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-secondary mb-1">带参数工具</p>
                  <p className="text-3xl font-bold text-text-primary">{stats.toolsWithSchema}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 工具栏 */}
      <div className="px-8 pb-4">
        <div className="bg-components-card-bg rounded-2xl p-6 border border-components-card-border shadow-md">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <Input
                placeholder="搜索工具名称、描述或服务器..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-components-input-bg border-components-input-border focus:border-components-input-border-focus hover:border-components-input-border-hover rounded-xl transition-colors"
              />
            </div>
            
            {servers.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-text-secondary" />
                <select
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  className="h-12 px-4 bg-components-input-bg border border-components-input-border rounded-xl text-text-primary focus:border-components-input-border-focus transition-colors"
                >
                  <option value="all">所有服务器</option>
                  {servers.map(server => (
                    <option key={server.id} value={server.id}>{server.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <Button 
              onClick={() => setSearchTerm('')} 
              variant="outline"
              className="h-12 px-6 rounded-xl border-components-input-border hover:bg-state-hover hover:border-components-input-border-hover transition-all"
            >
              清除
            </Button>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden px-8 pb-8">
        <div className="h-full bg-components-card-bg rounded-2xl border border-components-card-border shadow-md">
          <div className="h-full p-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-background-subtle rounded-full animate-spin"></div>
                  <div className="w-12 h-12 border-4 border-components-spinner-color border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                </div>
                <p className="text-text-secondary font-medium">正在加载工具列表...</p>
              </div>
            ) : filteredTools.length === 0 ? (
              <div className="text-center py-20 space-y-6">
                <div className="w-32 h-32 bg-background-subtle rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <Zap className="h-16 w-16 text-text-muted" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-primary mb-2">
                    {searchTerm ? '未找到匹配的工具' : '暂无可用工具'}
                  </h3>
                  <p className="text-text-secondary max-w-lg mx-auto text-lg leading-relaxed">
                    {searchTerm 
                      ? '尝试调整搜索条件或清除搜索内容查看所有工具' 
                      : '当前没有MCP服务器提供工具，请先添加并配置MCP服务器'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="bg-components-table-bg rounded-xl border border-components-table-border">
                  <Table
                    columns={[
                      {
                        key: 'name',
                        title: '工具信息',
                        render: (_value: any, record: ToolWithServer) => {
                          const status = getToolStatusIcon(record)
                          const StatusIcon = status.icon
                          return (
                            <div className="flex items-center gap-4">
                              <div className="relative w-12 h-12 bg-components-button-primary-bg rounded-xl flex items-center justify-center shadow-md">
                                <Zap className="h-6 w-6 text-components-button-primary-text" />
                                <div className={`absolute -top-1 -right-1 w-6 h-6 ${status.bg} rounded-full flex items-center justify-center shadow-lg`}>
                                  <StatusIcon className="h-3 w-3 text-components-button-primary-text" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="font-semibold text-text-primary">{record.name}</span>
                                  <Badge className="bg-components-badge-bg text-components-badge-text border-components-badge-border text-xs">
                                    {record.serverName}
                                  </Badge>
                                </div>
                                <p className="text-sm text-text-secondary line-clamp-2 mt-1">
                                  {record.description}
                                </p>
                              </div>
                            </div>
                          )
                        }
                      },
                      {
                        key: 'params',
                        title: '参数信息',
                        render: (_value: any, record: ToolWithServer) => (
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-text-primary">
                              {formatArguments(record)}
                            </p>
                            {record.inputSchema?.required && record.inputSchema.required.length > 0 && (
                              <p className="text-xs text-text-secondary">
                                必填: {record.inputSchema.required.join(', ')}
                              </p>
                            )}
                          </div>
                        )
                      },
                      {
                        key: 'status',
                        title: '状态',
                        render: (_value: any, record: ToolWithServer) => {
                          const status = getToolStatusIcon(record)
                          const StatusIcon = status.icon
                          return (
                            <Badge className={`${status.bg} ${status.color} border-components-badge-border`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {record.enabled === false ? '已禁用' : record.inputSchema ? '已配置' : '未配置'}
                            </Badge>
                          )
                        }
                      },
                      {
                        key: 'actions',
                        title: '操作',
                        align: 'right' as const,
                        render: (_value: any, record: ToolWithServer) => (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTool(record)
                                setTestArguments('')
                                setTestResult(null)
                                setShowTestDialog(true)
                              }}
                              className="h-8 px-3 text-xs border-components-input-border hover:bg-state-hover transition-colors"
                            >
                              <Play className="h-3 w-3 mr-1" />
                              测试
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCacheTools(record.serverId)}
                              className="h-8 px-3 text-xs border-components-input-border hover:bg-state-hover transition-colors"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              缓存
                            </Button>
                          </div>
                        )
                      }
                    ]}
                    data={filteredTools}
                    loading={loading}
                    onRow={(record) => ({
                      className: "hover:bg-components-table-row-bg-hover transition-colors group cursor-pointer rounded-xl",
                      onClick: () => {
                        setSelectedTool(record)
                        setTestArguments('')
                        setTestResult(null)
                        setShowTestDialog(true)
                      }
                    })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 工具测试对话框 */}
      {showTestDialog && selectedTool && (
        <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
          <DialogContent size="xl">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-accent)] flex items-center justify-center">
                  <Zap className="h-5 w-5 text-[var(--color-text-on-accent)]" />
                </div>
                <div>
                  <DialogTitle>{selectedTool.name}</DialogTitle>
                  <DialogDescription>{selectedTool.serverName}</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 pb-2 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* 工具描述 */}
              <div className="p-4 rounded-xl bg-[var(--color-surface-secondary)]">
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                  {selectedTool.description}
                </p>
              </div>

              {/* 参数架构 - 可折叠 */}
              {selectedTool.inputSchema && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                    <Code className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                    参数架构
                  </h4>
                  <pre className="p-4 rounded-xl bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)] text-xs font-mono text-[var(--color-text-secondary)] overflow-auto max-h-40">
                    {JSON.stringify(selectedTool.inputSchema, null, 2)}
                  </pre>
                </div>
              )}

              {/* 测试输入 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
                  <TestTube className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  测试参数
                </h4>
                <Textarea
                  value={testArguments}
                  onChange={(e) => setTestArguments(e.target.value)}
                  placeholder={selectedTool.inputSchema ? 
                    '输入 JSON 格式的参数，例如:\n{"param1": "value1", "param2": "value2"}' : 
                    '该工具无需参数，留空即可'
                  }
                  className="min-h-[120px] font-mono text-sm bg-[var(--color-surface-secondary)] border-[var(--color-border-default)] focus:border-[var(--color-border-focus)] rounded-xl resize-none"
                />
              </div>

              {/* 测试结果 */}
              {testResult && (
                <div className={`p-4 rounded-xl border ${
                  testResult.success 
                    ? 'bg-[var(--color-status-success-bg)] border-[var(--color-status-success-border)]' 
                    : 'bg-[var(--color-status-error-bg)] border-[var(--color-status-error-border)]'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-[var(--color-status-success)]" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-[var(--color-status-error)]" />
                    )}
                    <span className={`font-medium ${
                      testResult.success ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-error)]'
                    }`}>
                      {testResult.success ? '执行成功' : '执行失败'}
                    </span>
                    {testResult.duration && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {testResult.duration}ms
                      </Badge>
                    )}
                  </div>
                  {testResult.success && testResult.content && testResult.content.length > 0 && (
                    <pre className="p-3 rounded-lg bg-[var(--color-background-surface)] text-xs font-mono text-[var(--color-text-secondary)] overflow-auto max-h-48">
                      {JSON.stringify(testResult.content, null, 2)}
                    </pre>
                  )}
                  {!testResult.success && testResult.error && (
                    <p className="text-sm text-[var(--color-status-error)]">{testResult.error}</p>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTestDialog(false)}
              >
                关闭
              </Button>
              <Button
                onClick={handleTestTool}
                disabled={testing}
              >
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {testing ? '测试中...' : '执行测试'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}