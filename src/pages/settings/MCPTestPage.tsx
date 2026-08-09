import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TestTube,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Globe,
  Settings,
  Info,
  Loader2,
} from 'lucide-react'
import type { MCPServer, MCPTool } from '@/types/mcp'
import { MCP_SERVER_TYPES } from '@/types/mcp'
import { mcpAPI } from '@/api/mcp'
import { toast } from '@/lib/toast'

interface TestResult {
  success: boolean
  tools?: MCPTool[]
  error?: string
  duration?: number
  timestamp?: Date
}

export const MCPTestPage: React.FC = () => {
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testHistory, setTestHistory] = useState<
    (TestResult & { serverInfo?: any })[]
  >([])

  // 测试表单数据
  const [testForm, setTestForm] = useState({
    url: '',
    server_type: 'http' as string,
    headers: {} as Record<string, string>,
    variables: {} as Record<string, any>,
    timeout: 10000,
  })

  const [headerEntries, setHeaderEntries] = useState<
    Array<{ key: string; value: string }>
  >([])
  const [variableEntries, setVariableEntries] = useState<
    Array<{ key: string; value: string }>
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
      console.error('Load servers error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleServerSelect = (server: MCPServer) => {
    setTestForm({
      url: server.url,
      server_type: server.server_type,
      headers: server.headers || {},
      variables: server.variables || {},
      timeout: 10000,
    })

    // 更新编辑器数据
    setHeaderEntries(
      Object.entries(server.headers || {}).map(([key, value]) => ({
        key,
        value,
      })),
    )
    setVariableEntries(
      Object.entries(server.variables || {}).map(([key, value]) => ({
        key,
        value: typeof value === 'string' ? value : JSON.stringify(value),
      })),
    )
  }

  const handleHeaderChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    const newEntries = [...headerEntries]
    newEntries[index][field] = value
    setHeaderEntries(newEntries)

    const headers: Record<string, string> = {}
    newEntries.forEach(({ key, value }) => {
      if (key.trim()) headers[key] = value
    })
    setTestForm((prev) => ({ ...prev, headers }))
  }

  const handleVariableChange = (
    index: number,
    field: 'key' | 'value',
    value: string,
  ) => {
    const newEntries = [...variableEntries]
    newEntries[index][field] = value
    setVariableEntries(newEntries)

    const variables: Record<string, any> = {}
    newEntries.forEach(({ key, value }) => {
      if (key.trim()) {
        try {
          variables[key] = JSON.parse(value)
        } catch {
          variables[key] = value
        }
      }
    })
    setTestForm((prev) => ({ ...prev, variables }))
  }

  const addHeaderEntry = () => {
    setHeaderEntries([...headerEntries, { key: '', value: '' }])
  }

  const removeHeaderEntry = (index: number) => {
    const newEntries = headerEntries.filter((_, i) => i !== index)
    setHeaderEntries(newEntries)

    const headers: Record<string, string> = {}
    newEntries.forEach(({ key, value }) => {
      if (key.trim()) headers[key] = value
    })
    setTestForm((prev) => ({ ...prev, headers }))
  }

  const addVariableEntry = () => {
    setVariableEntries([...variableEntries, { key: '', value: '' }])
  }

  const removeVariableEntry = (index: number) => {
    const newEntries = variableEntries.filter((_, i) => i !== index)
    setVariableEntries(newEntries)

    const variables: Record<string, any> = {}
    newEntries.forEach(({ key, value }) => {
      if (key.trim()) {
        try {
          variables[key] = JSON.parse(value)
        } catch {
          variables[key] = value
        }
      }
    })
    setTestForm((prev) => ({ ...prev, variables }))
  }

  const handleTest = async () => {
    if (!testForm.url || !testForm.server_type) {
      toast.error('请填写服务器URL和类型')
      return
    }

    try {
      setTesting(true)
      setTestResult(null)

      const startTime = Date.now()
      const tools = await mcpAPI.testConnection({
        url: testForm.url,
        server_type: testForm.server_type,
        headers: testForm.headers,
        variables: testForm.variables,
        timeout: testForm.timeout,
      })
      const endTime = Date.now()

      const result: TestResult = {
        success: true,
        tools,
        duration: endTime - startTime,
        timestamp: new Date(),
      }

      setTestResult(result)
      setTestHistory((prev) => [
        { ...result, serverInfo: testForm },
        ...prev.slice(0, 9),
      ])
      toast.success(`连接测试成功，发现 ${tools.length} 个工具`)
    } catch (error: any) {
      const result: TestResult = {
        success: false,
        error: error.message || '连接测试失败',
        duration: Date.now() - Date.now(),
        timestamp: new Date(),
      }

      setTestResult(result)
      setTestHistory((prev) => [
        { ...result, serverInfo: testForm },
        ...prev.slice(0, 9),
      ])
      toast.error('连接测试失败')
    } finally {
      setTesting(false)
    }
  }

  const getServerTypeDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      stdio: '标准输入输出协议，适合本地进程通信',
      sse: '服务器发送事件，支持实时数据推送',
      'streamable-http': '可流式传输的HTTP协议，支持长连接',
      http: '标准HTTP协议，简单可靠',
      websocket: 'WebSocket协议，支持双向实时通信',
    }
    return descriptions[type] || '未知协议类型'
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">MCP连接测试</h1>
          <p className="mt-1 text-muted-foreground">
            测试MCP服务器连接性能和可用性
          </p>
        </div>
        <Button
          onClick={loadServers}
          variant="outline"
          className="smooth-transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          disabled={loading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
          />
          刷新服务器列表
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 测试配置 */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="card-modern">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                连接测试配置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-3">
                  <TabsTrigger value="basic">基本配置</TabsTrigger>
                  <TabsTrigger value="headers">请求头</TabsTrigger>
                  <TabsTrigger value="variables">环境变量</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        服务器URL <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={testForm.url}
                        onChange={(e) =>
                          setTestForm((prev) => ({
                            ...prev,
                            url: e.target.value,
                          }))
                        }
                        placeholder="输入服务器URL，如: http://localhost:3000"
                        className="border-0 bg-background-subtle focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-text-secondary">
                        协议类型 <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={testForm.server_type}
                        onValueChange={(value) =>
                          setTestForm((prev) => ({
                            ...prev,
                            server_type: value,
                          }))
                        }
                      >
                        <SelectTrigger className="border-0 bg-background-subtle focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MCP_SERVER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <span>{type.toUpperCase()}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        {getServerTypeDescription(testForm.server_type)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-secondary">
                      超时设置 (毫秒)
                    </label>
                    <Input
                      type="number"
                      value={testForm.timeout}
                      onChange={(e) =>
                        setTestForm((prev) => ({
                          ...prev,
                          timeout: parseInt(e.target.value) || 10000,
                        }))
                      }
                      min={1000}
                      max={60000}
                      className="border-0 bg-background-subtle focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleTest}
                      disabled={testing || !testForm.url}
                      size="lg"
                      className="px-8"
                      variant="default"
                    >
                      {testing ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : (
                        <Play className="mr-2 h-5 w-5" />
                      )}
                      {testing ? '测试中...' : '开始测试'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="headers" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-secondary">
                        HTTP请求头
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addHeaderEntry}
                      >
                        添加请求头
                      </Button>
                    </div>
                    {headerEntries.map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-3 md:grid-cols-2"
                      >
                        <Input
                          placeholder="Header名称"
                          value={entry.key}
                          onChange={(e) =>
                            handleHeaderChange(index, 'key', e.target.value)
                          }
                          className="border-0 bg-background-subtle focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="Header值"
                            value={entry.value}
                            onChange={(e) =>
                              handleHeaderChange(index, 'value', e.target.value)
                            }
                            className="flex-1 border-0 bg-background-subtle focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeHeaderEntry(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                    {headerEntries.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        暂无请求头配置
                      </p>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-secondary">
                        环境变量
                      </label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addVariableEntry}
                      >
                        添加变量
                      </Button>
                    </div>
                    {variableEntries.map((entry, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-3 md:grid-cols-2"
                      >
                        <Input
                          placeholder="变量名"
                          value={entry.key}
                          onChange={(e) =>
                            handleVariableChange(index, 'key', e.target.value)
                          }
                          className="border-0 bg-background-subtle focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="变量值 (支持JSON)"
                            value={entry.value}
                            onChange={(e) =>
                              handleVariableChange(
                                index,
                                'value',
                                e.target.value,
                              )
                            }
                            className="flex-1 border-0 bg-background-subtle font-mono text-sm focus:bg-background-surface focus:ring-2 focus:ring-blue-500/20"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeVariableEntry(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                    ))}
                    {variableEntries.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        暂无环境变量配置
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 测试结果 */}
          {testResult && (
            <Card className="card-modern">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  测试结果
                  {testResult.duration && (
                    <Badge className="ml-2 border-blue-200 bg-blue-50 text-blue-700">
                      {testResult.duration}ms
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testResult.success ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">连接测试成功</span>
                    </div>
                    {testResult.tools && testResult.tools.length > 0 ? (
                      <div>
                        <p className="mb-3 text-sm text-muted-foreground">
                          发现 {testResult.tools.length} 个可用工具：
                        </p>
                        <div className="max-h-60 space-y-2 overflow-y-auto">
                          {testResult.tools.map((tool, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between rounded-lg bg-background-subtle p-3"
                            >
                              <div>
                                <span className="font-medium text-text-primary">
                                  {tool.name}
                                </span>
                                <p className="text-sm text-muted-foreground">
                                  {tool.description}
                                </p>
                              </div>
                              <Badge className="border-green-200 bg-green-100 text-green-800">
                                {tool.enabled ? '已启用' : '未启用'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <span>服务器连接成功，但未发现可用工具</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-red-600">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">连接测试失败</span>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-red-800">{testResult.error}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 侧边栏 */}
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
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></div>
                  <p>测试将验证服务器URL的可访问性</p>
                </div>
                <div className="flex gap-2">
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></div>
                  <p>检查协议类型是否匹配</p>
                </div>
                <div className="flex gap-2">
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></div>
                  <p>获取服务器提供的工具列表</p>
                </div>
                <div className="flex gap-2">
                  <div className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500"></div>
                  <p>测量连接响应时间</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
