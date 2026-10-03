import {
  mcpServerFormDefaults,
  type MCPServerFormData as FormData,
} from './mcp-server-form-state'
import * as React from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  SegmentedTabs,
  SegmentedTabsList,
  SegmentedTabsTrigger,
  SegmentedTabsContent,
} from '@/components/ui/segmented-tabs'
import { MCPFormKeyValues } from '@/components/mcp/mcp-form-key-values'
import { MCPProtocolSelect } from '@/components/mcp/mcp-protocol-select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Server,
  Settings,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
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
import { mcpAPI } from '@/api/mcp'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'

interface MCPServerFormProps {
  server?: MCPServer | null
  onSuccess: () => void
  onCancel: () => void
}

type TabType = 'basic' | 'headers' | 'variables' | 'test'

const tabs: { id: TabType; labelKey: string; icon: React.ElementType }[] = [
  { id: 'basic', labelKey: 'mcp.form.basic', icon: Server },
  { id: 'headers', labelKey: 'mcp.form.headers', icon: FileCode },
  { id: 'variables', labelKey: 'mcp.form.variables', icon: Settings },
  { id: 'test', labelKey: 'mcp.form.test', icon: TestTube },
]

export const MCPServerForm: React.FC<MCPServerFormProps> = ({
  server,
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation()
  const formId = React.useId()
  const isEditing = Boolean(server)
  const [activeTab, setActiveTab] = useState<TabType>('basic')

  const [initialForm] = useState(() => mcpServerFormDefaults(server))
  const [formData, setFormData] = useState<FormData>(initialForm.formData)

  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    tools?: MCPTool[]
    error?: string
  } | null>(null)

  const [variableEntries, setVariableEntries] = useState(
    initialForm.variableEntries,
  )
  const [headerEntries, setHeaderEntries] = useState(initialForm.headerEntries)
  const [previousServer, setPreviousServer] = useState(server)
  if (previousServer !== server) {
    setPreviousServer(server)
    const next = mcpServerFormDefaults(server)
    setFormData(next.formData)
    setVariableEntries(next.variableEntries)
    setHeaderEntries(next.headerEntries)
  }

  const handleInputChange = <K extends keyof FormData>(
    field: K,
    value: FormData[K],
  ) => {
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
      toast.error(t('mcp.form.testRequired'))
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
      toast.success(t('mcp.servers.testSuccess', { count: tools.length }))
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || t('mcp.form.testFailed'),
      })
      toast.error(t('mcp.form.testFailed'))
    } finally {
      setTesting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.url.trim()) {
      toast.error(t('mcp.form.required'))
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
        toast.success(t('mcp.form.updated'))
      } else {
        const request: CreateMCPServerRequest = formData
        await mcpAPI.createServer(request)
        toast.success(t('mcp.form.created'))
      }

      onSuccess()
    } catch (error: any) {
      toast.error(
        error.message ||
          (isEditing ? t('mcp.form.updateFailed') : t('mcp.form.createFailed')),
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="@container flex h-full max-h-[85dvh] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border-subtle)] px-6 py-4">
        <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded-radius-md bg-background-subtle">
            <Server className="size-icon-md text-text-secondary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {isEditing ? t('mcp.form.editTitle') : t('mcp.form.createTitle')}
            </h2>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {isEditing
                ? t('mcp.form.editDescription', { name: server?.name })
                : t('mcp.form.createDescription')}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label={t('common.close')}
          className="h-8 w-8 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <SegmentedTabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as TabType)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <SegmentedTabsList aria-label={t('mcp.form.sections')}>
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <SegmentedTabsTrigger key={tab.id} value={tab.id}>
                  <Icon className="size-icon-sm" />
                  {t(tab.labelKey)}
                  {tab.id === 'headers' && headerEntries.length > 0 && (
                    <Badge variant="secondary">{headerEntries.length}</Badge>
                  )}
                  {tab.id === 'variables' && variableEntries.length > 0 && (
                    <Badge variant="secondary">{variableEntries.length}</Badge>
                  )}
                </SegmentedTabsTrigger>
              )
            })}
          </SegmentedTabsList>
          {/* 右侧内容 */}
          <div className="min-h-0 flex-1 overflow-y-auto p-space-lg">
            {/* 基本配置 */}
            <SegmentedTabsContent value="basic">
              <div className="max-w-2xl space-y-6">
                {/* 服务器名称 */}
                <div className="space-y-2">
                  <label
                    htmlFor={`${formId}-name`}
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    {t('mcp.form.name')}{' '}
                    <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <Input
                    id={`${formId}-name`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={t('mcp.form.namePlaceholder')}
                  />
                </div>

                <MCPProtocolSelect
                  value={formData.server_type}
                  onChange={(value) => handleInputChange('server_type', value)}
                />

                {/* 服务器地址 */}
                <div className="space-y-2">
                  <label
                    htmlFor={`${formId}-url`}
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    {t('mcp.form.url')}{' '}
                    <span className="text-[var(--color-status-error)]">*</span>
                  </label>
                  <Input
                    id={`${formId}-url`}
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    placeholder="http://localhost:3000/mcp"
                    leftIcon={<Link2 className="h-4 w-4" />}
                    className="font-mono text-sm"
                  />
                </div>

                {/* 描述 */}
                <div className="space-y-2">
                  <label
                    htmlFor={`${formId}-description`}
                    className="text-sm font-medium text-[var(--color-text-primary)]"
                  >
                    {t('mcp.form.description')}{' '}
                    <span className="font-normal text-[var(--color-text-tertiary)]">
                      {t('mcp.form.optional')}
                    </span>
                  </label>
                  <Textarea
                    id={`${formId}-description`}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder={t('mcp.form.descriptionPlaceholder')}
                    className="min-h-[100px] resize-none"
                    rows={4}
                  />
                </div>
              </div>
            </SegmentedTabsContent>

            {/* 请求头 */}
            <SegmentedTabsContent value="headers">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">
                    {t('mcp.form.httpHeaders')}
                  </h3>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {t('mcp.form.headersDescription')}
                  </p>
                </div>
                <MCPFormKeyValues
                  entries={headerEntries}
                  onChange={handleHeaderChange}
                  onRemove={removeHeaderEntry}
                  onAdd={addHeaderEntry}
                  keyPlaceholder={t('mcp.form.headerKey')}
                  valuePlaceholder={t('mcp.form.headerValue')}
                  emptyText={t('mcp.form.headersEmpty')}
                  emptyDescription={t('mcp.form.headersEmptyDescription')}
                />
              </div>
            </SegmentedTabsContent>

            {/* 环境变量 */}
            <SegmentedTabsContent value="variables">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">
                    {t('mcp.form.variables')}
                  </h3>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {t('mcp.form.variablesDescription')}
                  </p>
                </div>
                <MCPFormKeyValues
                  entries={variableEntries}
                  onChange={handleVariableChange}
                  onRemove={removeVariableEntry}
                  onAdd={addVariableEntry}
                  keyPlaceholder={t('mcp.form.variableKey')}
                  valuePlaceholder={t('mcp.form.variableValue')}
                  emptyText={t('mcp.form.variablesEmpty')}
                  emptyDescription={t('mcp.form.variablesEmptyDescription')}
                />
              </div>
            </SegmentedTabsContent>

            {/* 连接测试 */}
            <SegmentedTabsContent value="test">
              <div className="max-w-2xl space-y-6">
                <div className="mb-6">
                  <h3 className="mb-1 text-base font-medium text-[var(--color-text-primary)]">
                    {t('mcp.form.test')}
                  </h3>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {t('mcp.form.testDescription')}
                  </p>
                </div>

                {/* 测试按钮 + 状态 */}
                <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
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
                    {testing ? t('mcp.form.testing') : t('mcp.form.startTest')}
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
                      {testResult.success
                        ? t('mcp.form.connected')
                        : t('mcp.form.failed')}
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
                          {t('mcp.form.failed')}
                        </p>
                        <p className="text-sm break-all text-[var(--color-text-secondary)]">
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
                          {t('mcp.form.availableTools')}
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
                          {t('mcp.form.noTools')}
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
                      <p>{t('mcp.form.testHint')}</p>
                      <p>{t('mcp.form.saveHint')}</p>
                    </div>
                  </div>
                )}
              </div>
            </SegmentedTabsContent>
          </div>
        </SegmentedTabs>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-background-subtle)] px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {t('mcp.form.cancel')}
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
            {loading
              ? t('mcp.form.saving')
              : isEditing
                ? t('mcp.form.saveChanges')
                : t('mcp.form.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}
