import React, { useEffect, useState } from 'react'
import { Button } from '@/components/vendor/ui/button'
import { Input } from '@/components/vendor/ui/input'
import { Textarea } from '@/components/vendor/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/vendor/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/lib/toast'
import { Modal } from '@/components/ui/modal'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { EnhancedSSEParser } from '@/components/chat/EnhancedSSEParser'
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
  PenLine,
  FileUp,
  Database,
  Globe,
  Plus,
  Trash2,
  FileText,
  X
} from 'lucide-react'

export interface PlaceholderData { [key: string]: string }

type UserInputMode = 'manual' | 'file' | 'datasource'

interface UploadedFile {
  id: string
  name: string
  size: number
  content?: string
}

interface DataSourceItem {
  id: string
  type: 'api' | 'database'
  name: string
  description?: string
  config: Record<string, any>
  status: 'connected' | 'disconnected' | 'error'
  createdAt: Date
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

const DEFAULT_SYSTEM_PROMPT = '你是一名严谨的表单填充助手。请只输出 JSON，不要包含多余说明。输入给你占位符的 JSON 模板和用户补充信息，请根据语义补全缺失字段，保持键名不变，值为字符串或数组，必须返回有效 JSON。'

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
  const [settingsTab, setSettingsTab] = useState<'llm' | 'prompt' | 'mcp'>('llm')
  const [searchKey, setSearchKey] = useState('')
  const [showOnlyEmpty, setShowOnlyEmpty] = useState(false)
  const [aiRawOutput, setAiRawOutput] = useState('')
  const [showAiRaw, setShowAiRaw] = useState(false)
  
  // 用户输入模式相关
  const [userInputMode, setUserInputMode] = useState<UserInputMode>('manual')
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([])
  const [showAddDataSource, setShowAddDataSource] = useState(false)
  const [newDataSourceType, setNewDataSourceType] = useState<'api' | 'database'>('api')
  const [newDataSourceForm, setNewDataSourceForm] = useState({
    name: '',
    description: '',
    // API 配置
    apiUrl: '',
    apiMethod: 'GET',
    apiHeaders: '',
    // 数据库配置
    dbType: 'mysql',
    dbHost: '',
    dbPort: '',
    dbName: '',
    dbUser: '',
    dbPassword: '',
    dbQuery: '',
  })

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
    try { setFormData(JSON.parse(value)); setValidationErrors([]) } catch { /* ignore */ }
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
        ...(llmConfig.temperature !== undefined ? { temperature: llmConfig.temperature } : {}),
        ...(llmConfig.max_tokens ? { max_tokens: llmConfig.max_tokens } : {}),
      },
      mcp_ids: mcpConfig.mcp_ids,
      mcp_timeout: mcpConfig.mcp_timeout,
      verbose_tool_use: mcpConfig.verbose_tool_use,
      files: [],
      structured_output: mcpConfig.mcp_ids.length > 0,
      delta_stream: true,
    }

    const parser = new EnhancedSSEParser()
    let latestText = ''
    setAiFilling(true)
    setIsLoading(true)
    setAiRawOutput('')
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      await parser.connect(
        `${apiBase}/v1/llm/enhanced_chat_sse`,
        requestBody,
        (_message, state) => {
          latestText = state.accumulatedText
        },
        (err) => {
          throw err
        }
      )
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

  const copyJson = () => { navigator.clipboard.writeText(jsonInput); toast.success('JSON已复制到剪贴板') }
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
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
        return new File([ia], filename, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
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

  const filledCount = placeholderKeys.filter(k => formData[k] && formData[k].trim() !== '').length

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBackToUpload}>
            <ArrowLeft className="w-4 h-4 mr-1" />
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
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings2 className="w-4 h-4 mr-1" />
            设置
          </Button>
          <Button
            size="sm"
            onClick={handleAIFill}
            disabled={isLoading || aiFilling || placeholderKeys.length === 0}
            className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white border-0"
          >
            {aiFilling ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            AI 填写
          </Button>
          <Button variant="ghost" size="sm" onClick={resetForm}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 状态信息 */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background-body-subtle">
          <span className="text-text-secondary">模型:</span>
          <span className="font-medium text-text-primary">{llmConfig.llm_name || '未选择'}</span>
        </div>
        {mcpConfig.mcp_ids.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background-body-subtle">
            <PlugZap className="w-3.5 h-3.5 text-text-secondary" />
            <span className="font-medium text-text-primary">{mcpConfig.mcp_ids.length} MCP</span>
          </div>
        )}
      </div>

      {/* 验证错误 */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.slice(0, 3).map((err) => (<li key={err}>{err}</li>))}
              {validationErrors.length > 3 && (
                <li>还有 {validationErrors.length - 3} 个字段未填写</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* 主内容区 - Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList className="bg-background-body-subtle">
            <TabsTrigger value="form" className="gap-1.5">
              <FormInput className="w-4 h-4" />
              表单
          </TabsTrigger>
            <TabsTrigger value="json" className="gap-1.5">
              <Code2 className="w-4 h-4" />
              JSON
          </TabsTrigger>
        </TabsList>

          {activeTab === 'form' && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder="搜索字段..."
                  className="pl-8 h-8 w-[160px]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
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
            <div className="text-center py-12 text-text-secondary">
              文档中没有检测到占位符
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-12 text-text-secondary">
              没有匹配的字段
            </div>
          ) : (
            <div
              className="max-h-[50vh] overflow-auto pr-2 -mr-2"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredKeys.map((k) => (
                  <div key={k} className="space-y-1.5">
                    <label className="text-sm font-medium text-text-primary truncate block">
                      {k}
                    </label>
                    <Input
                      value={formData[k] || ''}
                      onChange={(e) => handleFormChange(k, e.target.value)}
                      className={cn(
                        'h-10',
                        !formData[k] && 'border-dashed'
                      )}
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
              className="font-mono text-sm min-h-[240px] resize-none"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={copyJson}
              className="absolute top-2 right-2"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          {aiRawOutput && (
            <div className="rounded-lg border border-border-default overflow-hidden">
              <button
                onClick={() => setShowAiRaw(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-background-body-subtle hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 原始输出
                </span>
                {showAiRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAiRaw && (
                <div className="p-4 bg-background-body">
                  <pre className="text-xs text-text-secondary whitespace-pre-wrap overflow-auto max-h-40">
                    {aiRawOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 提交按钮 */}
      <div className="flex justify-end pt-4 border-t border-border-default">
        <Button
          onClick={fillDocument}
          disabled={isLoading || placeholderKeys.length === 0}
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              正在填充...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
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
          <Tabs value={settingsTab} onValueChange={(v) => setSettingsTab(v as any)}>
            <TabsList className="w-full grid grid-cols-3 mb-4">
              <TabsTrigger value="llm">模型</TabsTrigger>
              <TabsTrigger value="prompt">提示词</TabsTrigger>
              <TabsTrigger value="mcp">高级</TabsTrigger>
            </TabsList>

            <TabsContent value="llm" className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">选择模型</label>
                <ChatModelSelector
                  models={myLLMs}
                  selectedModelName={llmConfig.llm_name}
                  onSelect={(name) => setLlmConfig((prev) => ({ ...prev, llm_name: name || '' }))}
                  modelTypes={['chat']}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Temperature</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={llmConfig.temperature}
                    onChange={(e) => setLlmConfig((prev) => ({ ...prev, temperature: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">Max Tokens</label>
                  <Input
                    type="number"
                    min="256"
                    max="4096"
                    value={llmConfig.max_tokens}
                    onChange={(e) => setLlmConfig((prev) => ({ ...prev, max_tokens: Number(e.target.value) }))}
                  />
                </div>
              </div>
        </TabsContent>

            <TabsContent value="prompt" className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary mb-1.5 block">系统提示词</label>
                <Textarea
                  className="min-h-[80px] resize-none"
                  value={promptConfig.systemPrompt}
                  onChange={(e) => setPromptConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder={DEFAULT_SYSTEM_PROMPT}
                />
                <p className="text-xs text-text-secondary mt-1.5">为空时将使用默认提示词</p>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary mb-2 block">用户输入</label>
                
                {/* 输入模式切换 */}
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg mb-3">
                  <button
                    onClick={() => setUserInputMode('manual')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      userInputMode === 'manual'
                        ? 'bg-background-body text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                    手动输入
                  </button>
                  <button
                    onClick={() => setUserInputMode('file')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      userInputMode === 'file'
                        ? 'bg-background-body text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    本地文件
                  </button>
                  <button
                    onClick={() => setUserInputMode('datasource')}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                      userInputMode === 'datasource'
                        ? 'bg-background-body text-text-primary shadow-sm'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <Database className="w-3.5 h-3.5" />
                    数据源
                  </button>
                </div>

                {/* 手动输入模式 */}
                {userInputMode === 'manual' && (
                  <Textarea
                    className="min-h-[100px] resize-none"
                    value={promptConfig.userInput}
                    onChange={(e) => setPromptConfig((prev) => ({ ...prev, userInput: e.target.value }))}
                    placeholder="输入补充信息，将与占位符 JSON 一并发送给模型"
                  />
                )}

                {/* 本地文件模式 */}
                {userInputMode === 'file' && (
                  <div className="space-y-3">
                    {/* 上传区域 */}
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border-default rounded-lg cursor-pointer hover:border-primary/50 hover:bg-background-body-subtle transition-colors">
                      <input
                        type="file"
                        className="hidden"
                        accept=".txt,.json,.csv,.md"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || [])
                          files.forEach(file => {
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              const newFile: UploadedFile = {
                                id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                                name: file.name,
                                size: file.size,
                                content: ev.target?.result as string
                              }
                              setUploadedFiles(prev => [...prev, newFile])
                            }
                            reader.readAsText(file)
                          })
                          e.target.value = ''
                        }}
                      />
                      <FileUp className="w-8 h-8 text-text-secondary mb-2" />
                      <p className="text-sm text-text-secondary">点击上传文件</p>
                      <p className="text-xs text-text-secondary mt-1">支持 .txt, .json, .csv, .md 格式</p>
                    </label>

                    {/* 已上传文件列表 */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-text-secondary">已上传 {uploadedFiles.length} 个文件</p>
                        <div className="space-y-1.5 max-h-32 overflow-auto">
                          {uploadedFiles.map(file => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-2 bg-background-body-subtle rounded-md"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-text-secondary shrink-0" />
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-text-secondary shrink-0">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 shrink-0"
                                onClick={() => setUploadedFiles(prev => prev.filter(f => f.id !== file.id))}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 数据源模式 */}
                {userInputMode === 'datasource' && (
                  <div className="space-y-3">
                    {/* 添加数据源按钮 */}
                    {!showAddDataSource && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setNewDataSourceType('api'); setShowAddDataSource(true) }}
                          className="gap-1.5"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          API 接口
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setNewDataSourceType('database'); setShowAddDataSource(true) }}
                          className="gap-1.5"
                        >
                          <Database className="w-3.5 h-3.5" />
                          数据库
                        </Button>
                      </div>
                    )}

                    {/* 添加数据源表单 */}
                    {showAddDataSource && (
                      <div className="p-4 border border-border-default rounded-lg bg-background-body-subtle space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            {newDataSourceType === 'api' ? (
                              <><Globe className="w-4 h-4" /> 添加 API 数据源</>
                            ) : (
                              <><Database className="w-4 h-4" /> 添加数据库数据源</>
                            )}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setShowAddDataSource(false)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="grid gap-3">
                          <div>
                            <label className="text-xs text-text-secondary mb-1 block">名称</label>
                            <Input
                              value={newDataSourceForm.name}
                              onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="数据源名称"
                              className="h-8"
                            />
                          </div>

                          {newDataSourceType === 'api' ? (
                            <>
                              <div>
                                <label className="text-xs text-text-secondary mb-1 block">API URL</label>
                                <Input
                                  value={newDataSourceForm.apiUrl}
                                  onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, apiUrl: e.target.value }))}
                                  placeholder="https://api.example.com/data"
                                  className="h-8"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">请求方法</label>
                                  <select
                                    value={newDataSourceForm.apiMethod}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, apiMethod: e.target.value }))}
                                    className="w-full h-8 px-2 rounded-md border border-input bg-background-body text-sm"
                                  >
                                    <option value="GET">GET</option>
                                    <option value="POST">POST</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">请求头 (JSON)</label>
                                  <Input
                                    value={newDataSourceForm.apiHeaders}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, apiHeaders: e.target.value }))}
                                    placeholder='{"Authorization": "..."}'
                                    className="h-8 font-mono text-xs"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">数据库类型</label>
                                  <select
                                    value={newDataSourceForm.dbType}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, dbType: e.target.value }))}
                                    className="w-full h-8 px-2 rounded-md border border-input bg-background-body text-sm"
                                  >
                                    <option value="mysql">MySQL</option>
                                    <option value="postgresql">PostgreSQL</option>
                                    <option value="mongodb">MongoDB</option>
                                    <option value="sqlite">SQLite</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">主机</label>
                                  <Input
                                    value={newDataSourceForm.dbHost}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, dbHost: e.target.value }))}
                                    placeholder="localhost"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">端口</label>
                                  <Input
                                    value={newDataSourceForm.dbPort}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, dbPort: e.target.value }))}
                                    placeholder="3306"
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">数据库名</label>
                                  <Input
                                    value={newDataSourceForm.dbName}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, dbName: e.target.value }))}
                                    placeholder="database"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">用户名</label>
                                  <Input
                                    value={newDataSourceForm.dbUser}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, dbUser: e.target.value }))}
                                    placeholder="root"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-text-secondary mb-1 block">密码</label>
                                  <Input
                                    type="password"
                                    value={newDataSourceForm.dbPassword}
                                    onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, dbPassword: e.target.value }))}
                                    placeholder="••••••"
                                    className="h-8"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-xs text-text-secondary mb-1 block">查询语句</label>
                                <Input
                                  value={newDataSourceForm.dbQuery}
                                  onChange={(e) => setNewDataSourceForm(prev => ({ ...prev, dbQuery: e.target.value }))}
                                  placeholder="SELECT * FROM table LIMIT 100"
                                  className="h-8 font-mono text-xs"
                                />
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddDataSource(false)}
                          >
                            取消
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (!newDataSourceForm.name) {
                                toast.error('请输入数据源名称')
                                return
                              }
                              const newSource: DataSourceItem = {
                                id: `ds-${Date.now()}`,
                                type: newDataSourceType,
                                name: newDataSourceForm.name,
                                description: newDataSourceType === 'api' 
                                  ? newDataSourceForm.apiUrl 
                                  : `${newDataSourceForm.dbType}://${newDataSourceForm.dbHost}:${newDataSourceForm.dbPort}/${newDataSourceForm.dbName}`,
                                config: newDataSourceType === 'api' 
                                  ? { url: newDataSourceForm.apiUrl, method: newDataSourceForm.apiMethod, headers: newDataSourceForm.apiHeaders }
                                  : { type: newDataSourceForm.dbType, host: newDataSourceForm.dbHost, port: newDataSourceForm.dbPort, database: newDataSourceForm.dbName, user: newDataSourceForm.dbUser, query: newDataSourceForm.dbQuery },
                                status: 'disconnected',
                                createdAt: new Date()
                              }
                              setDataSources(prev => [...prev, newSource])
                              setShowAddDataSource(false)
                              setNewDataSourceForm({
                                name: '', description: '', apiUrl: '', apiMethod: 'GET', apiHeaders: '',
                                dbType: 'mysql', dbHost: '', dbPort: '', dbName: '', dbUser: '', dbPassword: '', dbQuery: ''
                              })
                              toast.success('数据源添加成功（后端接口待对接）')
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            添加
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* 数据源列表 */}
                    {dataSources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-text-secondary">已添加 {dataSources.length} 个数据源</p>
                        <div className="space-y-2 max-h-40 overflow-auto">
                          {dataSources.map(ds => (
                            <div
                              key={ds.id}
                              className="flex items-center justify-between p-3 bg-background-body-subtle rounded-lg border border-border-default"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={cn(
                                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                                  ds.type === 'api' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'
                                )}>
                                  {ds.type === 'api' ? <Globe className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{ds.name}</p>
                                  <p className="text-xs text-text-secondary truncate">{ds.description}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    ds.status === 'connected' && 'border-green-500 text-green-500',
                                    ds.status === 'disconnected' && 'border-muted-foreground text-text-secondary',
                                    ds.status === 'error' && 'border-destructive text-destructive'
                                  )}
                                >
                                  {ds.status === 'connected' ? '已连接' : ds.status === 'error' ? '错误' : '未连接'}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDataSources(prev => prev.filter(d => d.id !== ds.id))}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dataSources.length === 0 && !showAddDataSource && (
                      <div className="text-center py-6 text-text-secondary">
                        <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">暂无数据源</p>
                        <p className="text-xs mt-1">点击上方按钮添加 API 或数据库数据源</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
        </TabsContent>

            <TabsContent value="mcp" className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-text-primary">MCP 工具</label>
                  {mcpLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-text-secondary" />}
                </div>
                <ScrollArea className="h-32 rounded-md border border-border-default p-2">
                  {mcpServers.length === 0 ? (
                    <div className="text-sm text-text-secondary text-center py-4">暂无可用 MCP</div>
                  ) : (
                    <div className="space-y-2">
                      {mcpServers.map((server) => (
                        <label key={server.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={mcpConfig.mcp_ids.includes(server.id)}
                            onCheckedChange={(checked) => {
                              setMcpConfig((prev) => ({
                                ...prev,
                                mcp_ids: checked
                                  ? [...prev.mcp_ids, server.id]
                                  : prev.mcp_ids.filter((id) => id !== server.id)
                              }))
                            }}
                          />
                          <span className="text-text-primary">{server.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">超时时间（秒）</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={mcpConfig.mcp_timeout}
                    onChange={(e) => setMcpConfig((prev) => ({ ...prev, mcp_timeout: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-text-secondary mb-1.5 block">工具调用详情</label>
                  <div className="h-9 flex items-center">
                    <Switch
                      checked={mcpConfig.verbose_tool_use}
                      onCheckedChange={(checked) => setMcpConfig((prev) => ({ ...prev, verbose_tool_use: checked }))}
                    />
                  </div>
                </div>
              </div>
        </TabsContent>
      </Tabs>

          <div className="flex justify-end gap-2 pt-2 border-t border-border-default">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>取消</Button>
            <Button onClick={() => setSettingsOpen(false)}>确定</Button>
          </div>
      </div>
      </Modal>
    </div>
  )
}

export default DataInput
