import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Server, 
  Globe, 
  Settings, 
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Info
} from 'lucide-react'
import type { MCPServer, CreateMCPServerRequest, UpdateMCPServerRequest, MCPTool } from '@/types/mcp'
import { MCP_SERVER_TYPES } from '@/types/mcp'
import { mcpAPI } from '@/api/mcp'
import { toast } from '@/lib/toast'

interface MCPServerFormProps {
  server?: MCPServer | null
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  name: string
  server_type: string
  url: string
  description: string
  variables: Record<string, any>
  headers: Record<string, string>
}

export const MCPServerForm: React.FC<MCPServerFormProps> = ({ 
  server, 
  onSuccess, 
  onCancel 
}) => {
  const isEditing = Boolean(server)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    server_type: 'http',
    url: '',
    description: '',
    variables: {},
    headers: {}
  })

  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    tools?: MCPTool[]
    error?: string
  } | null>(null)

  const [variableEntries, setVariableEntries] = useState<Array<{key: string, value: string}>>([])
  const [headerEntries, setHeaderEntries] = useState<Array<{key: string, value: string}>>([])

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        server_type: server.server_type,
        url: server.url,
        description: server.description || '',
        variables: server.variables || {},
        headers: server.headers || {}
      })

      // 转换为编辑器友好的格式
      setVariableEntries(
        Object.entries(server.variables || {}).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value)
        }))
      )
      setHeaderEntries(
        Object.entries(server.headers || {}).map(([key, value]) => ({ key, value }))
      )
    }
  }, [server])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVariableChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEntries = [...variableEntries]
    newEntries[index][field] = value
    setVariableEntries(newEntries)
    
    // 更新formData中的variables
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
    handleInputChange('variables', variables)
  }

  const handleHeaderChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEntries = [...headerEntries]
    newEntries[index][field] = value
    setHeaderEntries(newEntries)
    
    // 更新formData中的headers
    const headers: Record<string, string> = {}
    newEntries.forEach(({ key, value }) => {
      if (key.trim()) {
        headers[key] = value
      }
    })
    handleInputChange('headers', headers)
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
    handleInputChange('variables', variables)
  }

  const addHeaderEntry = () => {
    setHeaderEntries([...headerEntries, { key: '', value: '' }])
  }

  const removeHeaderEntry = (index: number) => {
    const newEntries = headerEntries.filter((_, i) => i !== index)
    setHeaderEntries(newEntries)
    
    const headers: Record<string, string> = {}
    newEntries.forEach(({ key, value }) => {
      if (key.trim()) {
        headers[key] = value
      }
    })
    handleInputChange('headers', headers)
  }

  const handleTestConnection = async () => {
    if (!formData.url || !formData.server_type) {
      toast.error('请先填写服务器URL和类型')
      return
    }

    try {
      setTesting(true)
      setTestResult(null)
      
      const tools = await mcpAPI.testConnection({
        url: formData.url,
        server_type: formData.server_type,
        headers: formData.headers,
        variables: formData.variables,
        timeout: 10000
      })
      
      setTestResult({
        success: true,
        tools
      })
      toast.success(`连接测试成功，发现 ${tools.length} 个工具`)
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || '连接测试失败'
      })
      toast.error('连接测试失败')
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error('请填写必填字段')
      return
    }

    try {
      setLoading(true)
      
      if (isEditing && server) {
        const request: UpdateMCPServerRequest = {
          mcp_id: server.id,
          ...formData
        }
        await mcpAPI.updateServer(request)
        toast.success('服务器更新成功')
      } else {
        const request: CreateMCPServerRequest = formData
        await mcpAPI.createServer(request)
        toast.success('服务器创建成功')
      }
      
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || (isEditing ? '更新失败' : '创建失败'))
    } finally {
      setLoading(false)
    }
  }

  const getServerTypeDescription = (type: string) => {
    const descriptions: Record<string, string> = {
      'stdio': '标准输入输出协议，适合本地进程通信',
      'sse': '服务器发送事件，支持实时数据推送',
      'streamable-http': '可流式传输的HTTP协议，支持长连接',
      'http': '标准HTTP协议，简单可靠',
      'websocket': 'WebSocket协议，支持双向实时通信'
    }
    return descriptions[type] || '未知协议类型'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 头部信息 */}
        <div className="bg-components-card-bg backdrop-blur-xl rounded-2xl p-8 border border-components-card-border">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-components-button-primary-bg rounded-2xl flex items-center justify-center shadow-lg">
              <Server className="h-7 w-7 text-components-button-primary-text" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">
                {isEditing ? `编辑服务器: ${server?.name}` : '添加新的MCP服务器'}
              </h2>
              <p className="text-text-secondary mt-1">
                配置MCP服务器连接信息和参数
              </p>
            </div>
          </div>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="basic" className="data-[state=active]:bg-components-button-primary-bg data-[state=active]:text-components-button-primary-text">
                基本信息
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-components-button-primary-bg data-[state=active]:text-components-button-primary-text">
                连接配置
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-components-button-primary-bg data-[state=active]:text-components-button-primary-text">
                高级设置
              </TabsTrigger>
              <TabsTrigger value="test" className="data-[state=active]:bg-components-button-primary-bg data-[state=active]:text-components-button-primary-text">
                连接测试
              </TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-text-primary font-medium">
                    服务器名称 <span className="text-state-error">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="输入服务器名称"
                    className="bg-components-input-bg border-components-input-border focus:border-components-input-border-focus"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server_type" className="text-text-primary font-medium">
                    协议类型 <span className="text-state-error">*</span>
                  </Label>
                  <Select 
                    value={formData.server_type} 
                    onValueChange={(value) => handleInputChange('server_type', value)}
                  >
                    <SelectTrigger className="bg-components-input-bg border-components-input-border focus:border-components-input-border-focus">
                      <SelectValue placeholder="选择协议类型" />
                    </SelectTrigger>
                    <SelectContent className="bg-components-dropdown-bg border-components-dropdown-border">
                      {MCP_SERVER_TYPES.map((type) => (
                        <SelectItem key={type} value={type} className="hover:bg-components-dropdown-item-bg-hover">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            <span>{type.toUpperCase()}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-text-secondary">
                    {getServerTypeDescription(formData.server_type)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-text-primary font-medium">
                  服务器地址 <span className="text-state-error">*</span>
                </Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange('url', e.target.value)}
                  placeholder="输入服务器URL，如: http://localhost:3000 或 ws://example.com/mcp"
                  className="bg-components-input-bg border-components-input-border focus:border-components-input-border-focus"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-text-primary font-medium">
                  描述信息
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="输入服务器描述信息"
                  className="bg-components-input-bg border-components-input-border focus:border-components-input-border-focus min-h-[100px] resize-none"
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* 连接配置 */}
            <TabsContent value="config" className="space-y-6">
              {/* HTTP Headers */}
              <Card className="border-components-card-border bg-components-card-bg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    HTTP 请求头
                  </CardTitle>
                  <p className="text-sm text-text-secondary">
                    配置请求头信息，如认证令牌、内容类型等
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {headerEntries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Input
                        placeholder="Header名称"
                        value={entry.key}
                        onChange={(e) => handleHeaderChange(index, 'key', e.target.value)}
                        className="flex-1 bg-components-input-bg border-components-input-border"
                      />
                      <Input
                        placeholder="Header值"
                        value={entry.value}
                        onChange={(e) => handleHeaderChange(index, 'value', e.target.value)}
                        className="flex-1 bg-components-input-bg border-components-input-border"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHeaderEntry(index)}
                        className="text-state-error hover:text-state-error hover:bg-state-error/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addHeaderEntry}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加请求头
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 高级设置 */}
            <TabsContent value="advanced" className="space-y-6">
              <Card className="border-components-card-border bg-components-card-bg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    环境变量
                  </CardTitle>
                  <p className="text-sm text-text-secondary">
                    配置服务器运行时环境变量，支持JSON格式
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {variableEntries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <Input
                        placeholder="变量名"
                        value={entry.key}
                        onChange={(e) => handleVariableChange(index, 'key', e.target.value)}
                        className="flex-1 bg-components-input-bg border-components-input-border"
                      />
                      <Input
                        placeholder="变量值 (支持JSON格式)"
                        value={entry.value}
                        onChange={(e) => handleVariableChange(index, 'value', e.target.value)}
                        className="flex-2 bg-components-input-bg border-components-input-border font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariableEntry(index)}
                        className="text-state-error hover:text-state-error hover:bg-state-error/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariableEntry}
                    className="w-full border-dashed"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    添加环境变量
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* 连接测试 */}
            <TabsContent value="test" className="space-y-6">
              <Card className="border-components-card-border bg-components-card-bg">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-text-primary flex items-center gap-2">
                    <TestTube className="h-5 w-5" />
                    连接测试
                  </CardTitle>
                  <p className="text-sm text-text-secondary">
                    测试服务器连接并获取可用工具列表
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={testing || !formData.url}
                      className="bg-components-button-primary-bg hover:bg-components-button-primary-bg-hover text-components-button-primary-text"
                    >
                      {testing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TestTube className="h-4 w-4 mr-2" />
                      )}
                      {testing ? '测试中...' : '开始测试'}
                    </Button>
                    
                    {testResult && (
                      <Badge 
                        className={`${
                          testResult.success 
                            ? 'bg-components-badge-success-bg text-components-badge-success-text' 
                            : 'bg-components-badge-error-bg text-components-badge-error-text'
                        } border-components-badge-border`}
                      >
                        {testResult.success ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircle className="h-3 w-3 mr-1" />
                        )}
                        {testResult.success ? '连接成功' : '连接失败'}
                      </Badge>
                    )}
                  </div>

                  {testResult && (
                    <div className="bg-background-subtle rounded-xl p-6 border border-border-subtle">
                      {testResult.success ? (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-state-success">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">连接测试成功</span>
                          </div>
                          {testResult.tools && testResult.tools.length > 0 ? (
                            <div>
                              <p className="text-text-secondary mb-3">发现 {testResult.tools.length} 个可用工具：</p>
                              <div className="space-y-2 max-h-60 overflow-y-auto">
                                {testResult.tools.map((tool, index) => (
                                  <div 
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-components-card-bg rounded-lg border border-components-card-border"
                                  >
                                    <div>
                                      <span className="font-medium text-text-primary">{tool.name}</span>
                                      <p className="text-sm text-text-secondary">{tool.description}</p>
                                    </div>
                                    <Badge className="bg-components-badge-info-bg text-components-badge-info-text border-components-badge-border">
                                      {tool.enabled ? '已启用' : '未启用'}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-text-secondary">
                              <Info className="h-4 w-4" />
                              <span>服务器连接成功，但未发现可用工具</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-state-error">
                            <XCircle className="h-5 w-5" />
                            <span className="font-medium">连接测试失败</span>
                          </div>
                          <p className="text-text-secondary">{testResult.error}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="bg-components-card-bg border border-components-card-border rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-state-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-text-primary">连接测试说明</p>
                        <ul className="text-sm text-text-secondary mt-2 space-y-1">
                          <li>• 测试将验证服务器URL的可访问性</li>
                          <li>• 验证协议类型是否匹配</li>
                          <li>• 获取服务器提供的工具列表</li>
                          <li>• 建议在保存配置前先进行连接测试</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* 底部操作按钮 */}
        <div className="flex items-center justify-end gap-4 bg-components-card-bg backdrop-blur-xl rounded-2xl p-6 border border-components-card-border">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="px-8"
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name.trim() || !formData.url.trim()}
            className="bg-components-button-primary-bg hover:bg-components-button-primary-bg-hover text-components-button-primary-text px-8"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {loading ? '保存中...' : (isEditing ? '更新服务器' : '创建服务器')}
          </Button>
        </div>
      </form>
    </div>
  )
}