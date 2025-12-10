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
import { mcpChatAPI, type MCPServerInfo } from '@/api/mcp-chat-service'
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
  AlertCircle
} from 'lucide-react'

export interface PlaceholderData { [key: string]: string }

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
  const [mcpServers, setMcpServers] = useState<MCPServerInfo[]>([])
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

  useEffect(() => {
    const initial: PlaceholderData = {}
    Object.keys(placeholders).forEach((k) => (initial[k] = ''))
    setFormData(initial)
    setJsonInput(JSON.stringify(initial, null, 2))
  }, [placeholders])

  const fetchMcpServers = async () => {
    setMcpLoading(true)
    try {
      const resp = await mcpChatAPI.listMCPServers()
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


  const validateData = (data: PlaceholderData) => {
    const errors: string[] = []
    Object.keys(placeholders).forEach((k) => { if (!data[k] || data[k].trim() === '') errors.push(`${k} 不能为空`) })
    return errors
  }

  const handleFormChange = (key: string, value: string) => {
    const next = { ...formData, [key]: value }
    setFormData(next)
    setJsonInput(JSON.stringify(next, null, 2))
    if (validationErrors.length) setValidationErrors([])
  }

  const handleJsonChange = (value: string) => {
    setJsonInput(value)
    try { setFormData(JSON.parse(value)); setValidationErrors([]) } catch {}
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
    const errs = validateData(formData)
    if (errs.length) { setValidationErrors(errs); toast.error('请填写所有必填字段'); return }
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
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
          <span className="text-muted-foreground">模型:</span>
          <span className="font-medium text-foreground">{llmConfig.llm_name || '未选择'}</span>
        </div>
        {mcpConfig.mcp_ids.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted">
            <PlugZap className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">{mcpConfig.mcp_ids.length} MCP</span>
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
          <TabsList className="bg-muted/50">
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
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchKey}
                  onChange={(e) => setSearchKey(e.target.value)}
                  placeholder="搜索字段..."
                  className="pl-8 h-8 w-[160px]"
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
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
            <div className="text-center py-12 text-muted-foreground">
              文档中没有检测到占位符
            </div>
          ) : filteredKeys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
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
                    <label className="text-sm font-medium text-foreground truncate block">
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
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setShowAiRaw(v => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  AI 原始输出
                </span>
                {showAiRaw ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showAiRaw && (
                <div className="p-4 bg-background">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-auto max-h-40">
                    {aiRawOutput}
                  </pre>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 提交按钮 */}
      <div className="flex justify-end pt-4 border-t border-border">
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
                <label className="text-sm font-medium text-foreground mb-2 block">选择模型</label>
                <ChatModelSelector
                  models={myLLMs}
                  selectedModelName={llmConfig.llm_name}
                  onSelect={(name) => setLlmConfig((prev) => ({ ...prev, llm_name: name || '' }))}
                  modelTypes={['chat']}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">Temperature</label>
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
                  <label className="text-sm text-muted-foreground mb-1.5 block">Max Tokens</label>
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
                <label className="text-sm font-medium text-foreground mb-1.5 block">系统提示词</label>
                <Textarea
                  className="min-h-[100px] resize-none"
                  value={promptConfig.systemPrompt}
                  onChange={(e) => setPromptConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                  placeholder={DEFAULT_SYSTEM_PROMPT}
                />
                <p className="text-xs text-muted-foreground mt-1.5">为空时将使用默认提示词</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">用户输入</label>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="ghost" disabled className="h-7 text-xs">
                      本地文件
                    </Button>
                    <Button size="sm" variant="ghost" disabled className="h-7 text-xs">
                      数据源
                    </Button>
                  </div>
                </div>
                <Textarea
                  className="min-h-[100px] resize-none"
                  value={promptConfig.userInput}
                  onChange={(e) => setPromptConfig((prev) => ({ ...prev, userInput: e.target.value }))}
                  placeholder="输入补充信息，将与占位符 JSON 一并发送给模型"
                />
              </div>
            </TabsContent>

            <TabsContent value="mcp" className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-sm font-medium text-foreground">MCP 工具</label>
                  {mcpLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                </div>
                <ScrollArea className="h-32 rounded-md border border-border p-2">
                  {mcpServers.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-4">暂无可用 MCP</div>
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
                          <span className="text-foreground">{server.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">超时时间（秒）</label>
                  <Input
                    type="number"
                    min="1"
                    max="60"
                    value={mcpConfig.mcp_timeout}
                    onChange={(e) => setMcpConfig((prev) => ({ ...prev, mcp_timeout: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">工具调用详情</label>
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

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>取消</Button>
            <Button onClick={() => setSettingsOpen(false)}>确定</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default DataInput
