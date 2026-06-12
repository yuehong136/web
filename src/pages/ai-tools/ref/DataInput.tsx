import React, { useEffect, useState } from 'react'
import { Button } from '@/components/vendor/ui/button'
import { Input } from '@/components/vendor/ui/input'
import { Textarea } from '@/components/vendor/ui/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/vendor/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { Modal } from '@/components/ui/modal'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { streamStructuredChat } from '@/components/chat/structured-chat-stream'
import {
  createEmptyDataSourceForm,
  type DataSourceItem,
} from './data-input-data-source-panel'
import {
  UserInputSection,
  type UploadedFile,
  type UserInputMode,
} from './data-input-user-input-section'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { documentAPI } from '@/api/document'
import { mcpAPI } from '@/api/mcp'
import type { MCPServer } from '@/types/mcp'
import { useModelStore } from '@/stores/model'
import { cn } from '@/lib/utils'
import {
  Save,
  Loader2,
  Copy,
  RotateCcw,
  ArrowLeft,
  Settings2,
  Sparkles,
  PlugZap,
  ChevronDown,
  ChevronUp,
  Search,
  Code2,
  FormInput,
  AlertCircle,
} from 'lucide-react'

export interface PlaceholderData {
  [key: string]: string
}

interface DataInputProps {
  placeholders: PlaceholderData
  processedFile: string
  originalFileName?: string
  onDataFilled: (fileData: string) => void
  onBackToUpload: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const DEFAULT_SYSTEM_PROMPT =
  '你是一名严谨的表单填充助手。请只输出 JSON，不要包含多余说明。输入给你占位符的 JSON 模板和用户补充信息，请根据语义补全缺失字段，保持键名不变，值为字符串或数组，必须返回有效 JSON。'

const DataInput: React.FC<DataInputProps> = ({
  placeholders,
  processedFile,
  originalFileName,
  onDataFilled,
  onBackToUpload,
  isLoading,
  setIsLoading,
}) => {
  const [formData, setFormData] = useState<PlaceholderData>({})
  const [jsonInput, setJsonInput] = useState('')
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([])
  const [mcpLoading, setMcpLoading] = useState(false)
  const [aiFilling, setAiFilling] = useState(false)
  const { myLLMs, loadMyLLMs } = useModelStore()
  const [llmConfig, setLlmConfig] = useState({
    llm_name: '',
    temperature: 0.3,
    max_tokens: 2048,
  })
  const [mcpConfig, setMcpConfig] = useState({
    mcp_ids: [] as string[],
    mcp_timeout: 10,
    verbose_tool_use: false,
  })
  const [promptConfig, setPromptConfig] = useState({
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    userInput: '',
  })
  const [settingsTab, setSettingsTab] = useState<'llm' | 'prompt' | 'mcp'>(
    'llm',
  )
  const [searchKey, setSearchKey] = useState('')
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false)
  const [aiRawOutput, setAiRawOutput] = useState('')
  const [showAiRaw, setShowAiRaw] = useState(false)

  // 用户输入模式相关（状态留在本组件：设置弹窗关闭卸载子树时不丢数据）
  const [userInputMode, setUserInputMode] = useState<UserInputMode>('manual')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([])
  const [showAddDataSource, setShowAddDataSource] = useState(false)
  const [newDataSourceType, setNewDataSourceType] = useState<
    'api' | 'database'
  >('api')
  const [newDataSourceForm, setNewDataSourceForm] = useState(
    createEmptyDataSourceForm,
  )

  useEffect(() => {
    const initial: PlaceholderData = {}
    Object.keys(placeholders).forEach((k) => (initial[k] = ''))
    setFormData(initial)
    setJsonInput(JSON.stringify(initial, null, 2))
  }, [placeholders])

  const fetchMcpServers = async () => {
    setMcpLoading(true)
    try {
      const resp = await mcpAPI.listServers({}, { page_size: 100 })
      setMcpServers(resp.mcp_servers || [])
    } catch (error) {
      console.error(error)
      toast.error('获取 MCP 列表失败')
    } finally {
      setMcpLoading(false)
    }
  }

  useEffect(() => {
    if (settingsOpen) {
      fetchMcpServers()
      loadMyLLMs()
    }
  }, [settingsOpen, loadMyLLMs])

  const _validateData = (_data: PlaceholderData) => {
    // 不再强制必填，允许部分字段为空
    return [] as string[]
  }

  const handleFormChange = (key: string, value: string) => {
    const next = { ...formData, [key]: value }
    setFormData(next)
    setJsonInput(JSON.stringify(next, null, 2))
    if (validationErrors.length) setValidationErrors([])
  }

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    try {
      setFormData(JSON.parse(value))
      setValidationErrors([])
    } catch {
      /* ignore */
    }
  }

  const buildUserMessage = (userInput: string, data: PlaceholderData) => {
    const payload = JSON.stringify(data || {}, null, 2)
    return [
      '请根据以下 JSON 模板补全占位符，只返回 JSON 且键名保持一致：',
      payload,
      `用户补充信息：${userInput || '无'}`,
    ].join('\n')
  }

  const extractJsonFromText = (text: string) => {
    if (!text) return null
    const candidates: string[] = []
    const cleaned = text.replace(/```json|```/gi, '').trim()
    const braceMatch = text.match(/\{[\s\S]*\}/)
    if (braceMatch) candidates.push(braceMatch[0])
    candidates.push(cleaned, text.trim())
    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate)
      } catch {
        continue
      }
    }
    return null
  }

  const handleAIFill = async () => {
    if (placeholderKeys.length === 0) {
      toast.error('暂无占位符可填充')
      return
    }
    if (!llmConfig.llm_name) {
      toast.error('请先在设置中选择模型')
      setSettingsOpen(true)
      return
    }
    let baseData: PlaceholderData = formData
    try {
      baseData = JSON.parse(jsonInput)
    } catch {
      baseData = formData
    }

    const requestBody = {
      prompt: (promptConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT).trim(),
      messages: [
        {
          role: 'user' as const,
          content: buildUserMessage(promptConfig.userInput, baseData),
        },
      ],
      llm_name: llmConfig.llm_name,
      stream: true,
      gen_conf: {
        ...(llmConfig.temperature !== undefined
          ? { temperature: llmConfig.temperature }
          : {}),
        ...(llmConfig.max_tokens ? { max_tokens: llmConfig.max_tokens } : {}),
      },
      mcp_ids: mcpConfig.mcp_ids,
      mcp_timeout: mcpConfig.mcp_timeout,
      verbose_tool_use: mcpConfig.verbose_tool_use,
      files: [],
      structured_output: mcpConfig.mcp_ids.length > 0,
      delta_stream: true,
    }

    let latestText = ''
    setAiFilling(true)
    setIsLoading(true)
    setAiRawOutput('')
    try {
      const apiBase =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      // 错误（含 HTTP 失败）直接传播到下面的 catch——等价于原 onError 的 throw
      await streamStructuredChat({
        url: `${apiBase}/v1/llm/enhanced_chat_sse`,
        requestBody,
        onMessage: (_message, state) => {
          latestText = state.accumulatedText
        },
      })
      setAiRawOutput(latestText)
      const parsed = extractJsonFromText(latestText)
      if (!parsed) {
        toast.error('AI 返回内容未能解析为 JSON，请调整提示词或输入')
        return
      }
      setFormData(parsed)
      setJsonInput(JSON.stringify(parsed, null, 2))
      toast.success('AI 填写完成')
    } catch (error) {
      console.error(error)
      toast.error('AI 填写失败，请重试')
    } finally {
      setAiFilling(false)
      setIsLoading(false)
    }
  }

  const copyJson = () => {
    navigator.clipboard.writeText(jsonInput)
    toast.success('JSON已复制到剪贴板')
  }
  const resetForm = () => {
    const initial: PlaceholderData = {}
    Object.keys(placeholders).forEach((k) => (initial[k] = ''))
    setFormData(initial)
    setJsonInput(JSON.stringify(initial, null, 2))
    setValidationErrors([])
    toast.success('表单已重置')
  }

  const fillDocument = async () => {
    if (!processedFile) {
      toast.error('缺少处理后的文档，请重新上传')
      return
    }
    setIsLoading(true)
    try {
      const base64ToFile = (data: string, filename: string) => {
        const clean = data.trim()
        const byteString = atob(clean)
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++)
          ia[i] = byteString.charCodeAt(i)
        return new File([ia], filename, {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        })
      }
      const safeName = originalFileName || 'document.docx'
      const uploadFile = base64ToFile(processedFile, safeName)
      const resp = await documentAPI.fillDocx(uploadFile, formData)
      onDataFilled(resp.file)
      toast.success('文档填充成功！')
    } catch (error) {
      console.error(error)
      toast.error('填充文档失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const placeholderKeys = Object.keys(placeholders)
  const filteredKeys = placeholderKeys.filter((k) => {
    const hit = !searchKey || k.toLowerCase().includes(searchKey.toLowerCase())
    const notEmpty = formData[k] && formData[k].trim() !== ''
    if (showOnlyEmpty) return hit && !notEmpty
    return hit
  })

  const filledCount = placeholderKeys.filter(
    (k) => formData[k] && formData[k].trim() !== '',
  ).length

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBackToUpload}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回
          </Button>
          <div className="h-4 w-px bg-border-default" />
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Badge variant="secondary" className="font-normal">
              {filledCount}/{placeholderKeys.length} 已填写
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings2 className="mr-1 h-4 w-4" />
            设置
          </Button>
          <Button
            size="sm"
            onClick={handleAIFill}
            disabled={isLoading || aiFilling || placeholderKeys.length === 0}
            className="border-0 bg-gradient-to-r from-violet-500 to-purple-500 text-white hover:from-violet-600 hover:to-purple-600"
          >
            {aiFilling ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-4 w-4" />
            )}
            AI 填写
          </Button>
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 状态信息 */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="bg-background-body-subtle flex items-center gap-1.5 rounded-md px-2.5 py-1">
          <span className="text-text-secondary">模型:</span>
          <span className="font-medium text-text-primary">
            {llmConfig.llm_name || '未选择'}
          </span>
        </div>
        {mcpConfig.mcp_ids.length > 0 && (
          <div className="bg-background-body-subtle flex items-center gap-1.5 rounded-md px-2.5 py-1">
            <PlugZap className="h-3.5 w-3.5 text-text-secondary" />
            <span className="font-medium text-text-primary">
              {mcpConfig.mcp_ids.length} MCP
            </span>
          </div>
        )}
      </div>

      {/* 验证错误 */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-inside list-disc space-y-1">
              {validationErrors.slice(0, 3).map((err) => (
                <li key={err}>{err}</li>
              ))}
              {validationErrors.length > 3 && (
                <li>还有 {validationErrors.length - 3} 个字段未填写</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 主内容区 - Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <TabsList className="bg-background-body-subtle">
            <TabsTrigger value="form" className="gap-1.5">
              <FormInput className="h-4 w-4" />
              表单
            </TabsTrigger>
            <TabsTrigger value="json" className="gap-1.5">
              <Code2 className="h-4 w-4" />
              JSON
            </TabsTrigger>
          </TabsList>

          {activeTab === 'form' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                <Input
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder="搜索字段..."
                  className="h-8 w-[160px] pl-8"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
                <Switch
                  checked={showOnlyEmpty}
                  onCheckedChange={setShowOnlyEmpty}
                  className="scale-90"
                />
                仅看未填
              </label>
            </div>
          )}
        </div>

        <TabsContent value="form" className="mt-0">
          {placeholderKeys.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              文档中没有检测到占位符
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="py-12 text-center text-text-secondary">
              没有匹配的字段
            </div>
          ) : (
            <div
              className="-mr-2 max-h-[50vh] overflow-auto pr-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredKeys.map((k) => (
                  <div key={k} className="space-y-1.5">
                    <label className="block truncate text-sm font-medium text-text-primary">
                      {k}
                    </label>
                    <Input
                      value={formData[k] || ''}
                      onChange={(e) => handleFormChange(k, e.target.value)}
                      className={cn('h-10', !formData[k] && 'border-dashed')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="json" className="mt-0 space-y-4">
          <div className="relative">
            <Textarea
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="min-h-[240px] resize-none font-mono text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={copyJson}
              className="absolute right-2 top-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {aiRawOutput && (
            <div className="overflow-hidden rounded-lg border border-border-default">
              <button
                onClick={() => setShowAiRaw((v) => !v)}
                className="bg-background-body-subtle flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI 原始输出
                </span>
                {showAiRaw ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {showAiRaw && (
                <div className="bg-background-body p-4">
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-xs text-text-secondary">
                    {aiRawOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 提交按钮 */}
      <div className="flex justify-end border-t border-border-default pt-4">
        <Button
          onClick={fillDocument}
          disabled={isLoading || placeholderKeys.length === 0}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              正在填充...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              生成文档
            </>
          )}
        </Button>
      </div>

      {/* 设置弹窗 */}
      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="AI 填写设置"
        description="配置模型和提示词参数"
        size="lg"
      >
        <div className="space-y-4">
          <Tabs
            value={settingsTab}
            onValueChange={(v) => setSettingsTab(v as any)}
          >
            <TabsList className="mb-4 grid w-full grid-cols-3">
              <TabsTrigger value="llm">模型</TabsTrigger>
              <TabsTrigger value="prompt">提示词</TabsTrigger>
              <TabsTrigger value="mcp">高级</TabsTrigger>
            </TabsList>

            <TabsContent value="llm" className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  选择模型
                </label>
                <ChatModelSelector
                  models={myLLMs}
                  selectedModelName={llmConfig.llm_name}
                  onSelect={(name) =>
                    setLlmConfig((prev) => ({ ...prev, llm_name: name || '' }))
                  }
                  modelTypes={['chat']}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-text-secondary">
                    Temperature
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={llmConfig.temperature}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        temperature: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-text-secondary">
                    Max Tokens
                  </label>
                  <Input
                    type="number"
                    min="256"
                    max="4096"
                    value={llmConfig.max_tokens}
                    onChange={(e) =>
                      setLlmConfig((prev) => ({
                        ...prev,
                        max_tokens: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompt" className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  系统提示词
                </label>
                <Textarea
                  className="min-h-[80px] resize-none"
                  value={promptConfig.systemPrompt}
                  onChange={(e) =>
                    setPromptConfig((prev) => ({
                      ...prev,
                      systemPrompt: e.target.value,
                    }))
                  }
                  placeholder={DEFAULT_SYSTEM_PROMPT}
                />
                <p className="mt-1.5 text-xs text-text-secondary">
                  为空时将使用默认提示词
                </p>
              </div>

              <UserInputSection
                userInputMode={userInputMode}
                setUserInputMode={setUserInputMode}
                userInput={promptConfig.userInput}
                onUserInputChange={(value) =>
                  setPromptConfig((prev) => ({ ...prev, userInput: value }))
                }
                uploadedFiles={uploadedFiles}
                setUploadedFiles={setUploadedFiles}
                dataSourcePanel={{
                  dataSources,
                  setDataSources,
                  showAddDataSource,
                  setShowAddDataSource,
                  newDataSourceType,
                  setNewDataSourceType,
                  newDataSourceForm,
                  setNewDataSourceForm,
                }}
              />
            </TabsContent>

            <TabsContent value="mcp" className="space-y-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <label className="text-sm font-medium text-text-primary">
                    MCP 工具
                  </label>
                  {mcpLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-text-secondary" />
                  )}
                </div>
                <ScrollArea className="h-32 rounded-md border border-border-default p-2">
                  {mcpServers.length === 0 ? (
                    <div className="py-4 text-center text-sm text-text-secondary">
                      暂无可用 MCP
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {mcpServers.map((server) => (
                        <label
                          key={server.id}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={mcpConfig.mcp_ids.includes(server.id)}
                            onCheckedChange={(checked) => {
                              setMcpConfig((prev) => ({
                                ...prev,
                                mcp_ids: checked
                                  ? [...prev.mcp_ids, server.id]
                                  : prev.mcp_ids.filter(
                                      (id) => id !== server.id,
                                    ),
                              }))
                            }}
                          />
                          <span className="text-text-primary">
                            {server.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm text-text-secondary">
                    超时时间（秒）
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={mcpConfig.mcp_timeout}
                    onChange={(e) =>
                      setMcpConfig((prev) => ({
                        ...prev,
                        mcp_timeout: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-text-secondary">
                    工具调用详情
                  </label>
                  <div className="flex h-9 items-center">
                    <Switch
                      checked={mcpConfig.verbose_tool_use}
                      onCheckedChange={(checked) =>
                        setMcpConfig((prev) => ({
                          ...prev,
                          verbose_tool_use: checked,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 border-t border-border-default pt-2">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              取消
            </Button>
            <Button onClick={() => setSettingsOpen(false)}>确定</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DataInput
