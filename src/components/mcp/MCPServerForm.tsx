import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
  Info,
  Zap,
  Link2,
  FileCode,
  X,
  Braces,
} from 'lucide-react'
import type {
  MCPServer,
  CreateMCPServerRequest,
  UpdateMCPServerRequest,
  MCPTool,
} from '@/types/mcp'
import { ToolItem } from './tool-item'
import { AutoResizeTextarea } from './auto-resize-textarea'
import { mcpAPI } from '@/api/mcp'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

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

type TabType = 'basic' | 'headers' | 'variables' | 'test'

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'basic', label: '基本配置', icon: Server },
  { id: 'headers', label: '请求头', icon: FileCode },
  { id: 'variables', label: '环境变量', icon: Settings },
  { id: 'test', label: '连接测试', icon: TestTube },
]

const protocolOptions = [
  {
    value: 'streamable-http',
    label: 'Streamable HTTP',
    description: '流式 HTTP 传输协议',
  },
  { value: 'sse', label: 'SSE', description: '服务器发送事件' },
  { value: 'stdio', label: 'STDIO', description: '标准输入输出' },
]

export const MCPServerForm: React.FC<MCPServerFormProps> = ({
  server,
  onSuccess,
  onCancel,
}) => {
  const isEditing = Boolean(server)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  const [formData, setFormData] = useState<FormData>({
    name: '',
    server_type: 'streamable-http',
    url: '',
    description: '',
    variables: {},
    headers: {},
  })

  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    tools?: MCPTool[]
    error?: string
  } | null>(null)

  const [variableEntries, setVariableEntries] = useState<
    Array<{ key: string; value: string }>
  >([])
  const [headerEntries, setHeaderEntries] = useState<
    Array<{ key: string; value: string }>
  >([])

  useEffect(() => {
    if (server) {
      setFormData({
        name: server.name,
        server_type: server.server_type,
        url: server.url,
        description: server.description || '',
        variables: server.variables || {},
        headers: server.headers || {},
      })

      setVariableEntries(
        Object.entries(server.variables || {}).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value : JSON.stringify(value),
        })),
      )
      setHeaderEntries(
        Object.entries(server.headers || {}).map(([key, value]) => ({
          key,
          value,
        })),
      )
    }
  }, [server])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    handleInputChange('variables', variables)
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
      toast.error('请先填写服务器 URL 和协议类型')
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
        timeout: 10000,
      })

      setTestResult({
        success: true,
        tools,
      })
      toast.success(`连接成功，发现 ${tools.length} 个工具`)
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || '连接测试失败',
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
          ...formData,
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

  // 渲染键值对编辑器
  const renderKeyValueEditor = (
    entries: Array<{ key: string; value: string }>,
    onChange: (index: number, field: 'key' | 'value', value: string) => void,
    onRemove: (index: number) => void,
    onAdd: () => void,
    keyPlaceholder: string,
    valuePlaceholder: string,
    emptyText: string,
    emptyDescription: string,
  ) => {
    if (entries.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--color-border-subtle)] py-12 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-background-subtle)]">
            <Plus className="h-5 w-5 text-[var(--color-text-tertiary)]" />
          </div>
          <p className="mb-0.5 text-sm font-medium text-[var(--color-text-secondary)]">
            {emptyText}
          </p>
          <p className="mb-4 text-xs text-[var(--color-text-tertiary)]">
            {emptyDescription}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onAdd}>
            <Plus className="mr-2 h-4 w-4" />
            添加
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-3">
        {/* 条目列表 */}
        <div className="divide-y divide-[var(--color-border-subtle)] overflow-hidden rounded-lg border border-[var(--color-border-default)]">
          {entries.map((entry, index) => (
            <div
              key={index}
              className="group bg-[var(--color-background-surface)]"
            >
              <div className="flex items-start gap-3 p-3">
                {/* Key + Value 垂直布局 */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="w-8 shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]">
                      Key
                    </label>
                    <Input
                      placeholder={keyPlaceholder}
                      value={entry.key}
                      onChange={(e) => onChange(index, 'key', e.target.value)}
                      inputSize="sm"
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <label className="mt-2 w-8 shrink-0 text-xs font-medium text-[var(--color-text-tertiary)]">
                      Value
                    </label>
                    <AutoResizeTextarea
                      placeholder={valuePlaceholder}
                      value={entry.value}
                      onChange={(e) => onChange(index, 'value', e.target.value)}
                      maxHeight={160}
                      className="flex-1 font-mono text-sm"
                    />
                  </div>
                </div>
                {/* 删除按钮 */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  className="mt-0.5 h-8 w-8 shrink-0 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-status-error-subtle)] hover:text-[var(--color-status-error)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* 添加按钮 */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="h-9 w-full border border-dashed border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:border-[var(--color-border-default)] hover:text-[var(--color-text-secondary)]"
        >
          <Plus className="mr-2 h-4 w-4" />
          添加一行
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-full max-h-[85vh] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-components-button-primary-bg)]">
            <Server className="h-5 w-5 text-[var(--color-text-inverted)]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {isEditing ? '编辑 MCP 服务器' : '添加 MCP 服务器'}
            </h2>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {isEditing
                ? `正在编辑: ${server?.name}`
                : '配置新的 MCP 服务器连接'}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-8 w-8 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1">
          {/* 左侧导航 */}
          <div className="w-48 shrink-0 space-y-1 border-r border-[var(--color-border-subtle)] p-3">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-[var(--color-components-button-primary-bg)] text-[var(--color-text-inverted)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-subtle)] hover:text-[var(--color-text-primary)]',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.id === 'headers' && headerEntries.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto h-5 min-w-5 justify-center text-xs"
                    >
                      {headerEntries.length}
                    </Badge>
                  )}
                  {tab.id === 'variables' && variableEntries.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto h-5 min-w-5 justify-center text-xs"
                    >
                      {variableEntries.length}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>

          {/* 右侧内容 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 基本配置 */}
            {activeTab === 'basic' && (
              <div className="max-w-2xl space-y-6">
                {/* 服务器名称 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    服务器名称{' '}
                    <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="例如: My MCP Server"
                  />
                </div>

                {/* 协议类型 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    协议类型{' '}
                    <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {protocolOptions.map((protocol) => (
                      <button
                        key={protocol.value}
                        type="button"
                        onClick={() =>
                          handleInputChange('server_type', protocol.value)
                        }
                        className={cn(
                          'flex flex-col items-start rounded-xl border-2 p-3 text-left transition-all',
                          formData.server_type === protocol.value
                            ? 'border-[var(--color-components-input-border-focus)] bg-[var(--color-state-focus-subtle)]'
                            : 'border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] hover:border-[var(--color-border-default)]',
                        )}
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <Globe
                            className={cn(
                              'h-4 w-4',
                              formData.server_type === protocol.value
                                ? 'text-[var(--color-state-focus)]'
                                : 'text-[var(--color-text-tertiary)]',
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-medium',
                              formData.server_type === protocol.value
                                ? 'text-[var(--color-state-focus)]'
                                : 'text-[var(--color-text-primary)]',
                            )}
                          >
                            {protocol.label}
                          </span>
                        </div>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {protocol.description}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 服务器地址 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    服务器地址{' '}
                    <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <Input
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="http://localhost:3000/mcp"
                    leftIcon={<Link2 className="h-4 w-4" />}
                    className="font-mono text-sm"
                  />
                </div>

                {/* 描述 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-text-primary)]">
                    描述{' '}
                    <span className="font-normal text-[var(--color-text-tertiary)]">
                      (可选)
                    </span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="描述此服务器的用途..."
                    className="min-h-[100px] resize-none"
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* 请求头 */}
            {activeTab === 'headers' && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">
                    HTTP 请求头
                  </h3>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    配置发送到 MCP 服务器的自定义请求头，如认证令牌等
                  </p>
                </div>
                {renderKeyValueEditor(
                  headerEntries,
                  handleHeaderChange,
                  removeHeaderEntry,
                  addHeaderEntry,
                  'Header 名称',
                  'Header 值',
                  '暂无请求头',
                  '点击下方按钮添加自定义请求头',
                )}
              </div>
            )}

            {/* 环境变量 */}
            {activeTab === 'variables' && (
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">
                    环境变量
                  </h3>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    配置传递给 MCP 服务器的环境变量，值支持 JSON 格式
                  </p>
                </div>
                {renderKeyValueEditor(
                  variableEntries,
                  handleVariableChange,
                  removeVariableEntry,
                  addVariableEntry,
                  '变量名',
                  '变量值 (支持 JSON)',
                  '暂无环境变量',
                  '点击下方按钮添加环境变量',
                )}
              </div>
            )}

            {/* 连接测试 */}
            {activeTab === 'test' && (
              <div className="max-w-2xl space-y-6">
                <div className="mb-6">
                  <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">
                    连接测试
                  </h3>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    测试与 MCP 服务器的连接，验证配置是否正确
                  </p>
                </div>

                {/* 测试按钮 + 状态 */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testing || !formData.url}
                  >
                    {testing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-4 w-4" />
                    )}
                    {testing ? '测试中...' : '开始测试'}
                  </Button>

                  {testResult && (
                    <div
                      className={cn(
                        'flex items-center gap-1.5 text-sm font-medium',
                        testResult.success
                          ? 'text-[var(--color-status-success)]'
                          : 'text-[var(--color-status-error)]',
                      )}
                    >
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {testResult.success ? '连接成功' : '连接失败'}
                    </div>
                  )}
                </div>

                {/* 测试结果 - 失败 */}
                {testResult && !testResult.success && (
                  <div className="rounded-lg border border-[var(--color-border-error)] bg-[var(--color-status-error-subtle)] p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-status-error)]" />
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-medium text-[var(--color-status-error)]">
                          连接失败
                        </p>
                        <p className="break-all text-sm text-[var(--color-text-secondary)]">
                          {testResult.error}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 测试结果 - 成功：工具列表 */}
                {testResult?.success && (
                  <div className="overflow-hidden rounded-lg border border-[var(--color-border-default)]">
                    {/* 工具列表标题栏 */}
                    <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Braces className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                        <span className="text-sm font-medium text-[var(--color-text-primary)]">
                          可用工具
                        </span>
                        <Badge
                          variant="secondary"
                          className="h-5 min-w-5 justify-center text-xs"
                        >
                          {testResult.tools?.length || 0}
                        </Badge>
                      </div>
                    </div>

                    {testResult.tools && testResult.tools.length > 0 ? (
                      <div className="max-h-[320px] divide-y divide-[var(--color-border-subtle)] overflow-y-auto">
                        {testResult.tools.map((tool, index) => (
                          <ToolItem key={index} tool={tool} />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Info className="mb-2 h-5 w-5 text-[var(--color-text-tertiary)]" />
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          服务器未提供任何工具
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 提示信息 */}
                {!testResult && (
                  <div className="flex items-start gap-3 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] p-4">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" />
                    <div className="space-y-1 text-sm text-[var(--color-text-tertiary)]">
                      <p>测试将验证服务器 URL 的可访问性和协议兼容性</p>
                      <p>建议在保存配置前先进行连接测试</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name.trim() || !formData.url.trim()}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            {loading ? '保存中...' : isEditing ? '保存更改' : '创建服务器'}
          </Button>
        </div>
      </form>
    </div>
  )
}
