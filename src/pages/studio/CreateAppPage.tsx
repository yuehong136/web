import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
// shadcn/ui 组件
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table } from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { CollapsibleSection } from '@/components/ui/collapsible-section'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable'
// Lucide React 图标
import { 
  Pencil, 
  Eye, 
  Bug, 
  Save,
  ArrowLeft,
  PlayCircle,
  LayoutGrid,
  Plus,
  Trash2,
  Search,
  ChevronRight,
  RefreshCw,
  Square,
  Upload
} from 'lucide-react'
// 保留 @ant-design/x 聊天组件
import { 
  Bubble, 
  Sender
} from '@ant-design/x'
import markdownit from 'markdown-it'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { llmAPI } from '@/api/llm'
import { knowledgeAPI } from '@/api/knowledge'
import { dialogAPI } from '@/api/dialog'
import { conversationAPI } from '@/api/conversation'
import type { LLMModel, KnowledgeBase } from '@/types/api'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { RerankModelSelector, KnowledgeBaseAvatar } from '@/components/knowledge'
import type { MyLLMProvider } from '@/stores/model'
import { getResolvedTheme } from '@/themes'
import { toast } from '@/lib/toast'
import { LLMParameterControl, LLM_PARAMETER_PRESETS } from '@/components/vendor/ui/LLMParameterControl'
import {
  GenerationPresetType,
  generationPresetConfigMapSnake,
  generationPresetOptions,
  detectMatchingPresetSnake,
  getDefaultEnabledFieldsSnake,
} from '@/constants/llm'
// SSE 流解析库（参考 ragflow 最佳实践）
import { EventSourceParserStream } from 'eventsource-parser/stream'

// 初始化 markdown-it
const md = markdownit({ html: true, breaks: true, linkify: true })

// Markdown 渲染函数
const renderMarkdown = (content: string | React.ReactNode) => {
  if (!content || typeof content !== 'string') return content
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: md.render(content) }} 
      className="prose prose-sm max-w-none"
      style={{
        // 使用 CSS 变量覆盖 prose 默认颜色以支持主题切换
        '--tw-prose-body': 'var(--color-text-primary)',
        '--tw-prose-headings': 'var(--color-text-primary)',
        '--tw-prose-links': 'var(--color-text-accent)',
        '--tw-prose-bold': 'var(--color-text-primary)',
        '--tw-prose-code': 'var(--color-text-primary)',
        '--tw-prose-quotes': 'var(--color-text-secondary)',
        '--tw-prose-quote-borders': 'var(--color-border-default)',
        '--tw-prose-pre-bg': 'var(--color-components-pre-bg)',
        '--tw-prose-pre-code': 'var(--color-components-pre-text)',
      } as React.CSSProperties}
    />
  )
}


interface AppConfig {
  name: string
  description: string
  icon?: string
  systemPrompt: string
  llm_id: string
  llm_setting: {
    temperature?: number
    top_p?: number
    presence_penalty?: number
    frequency_penalty?: number
    max_tokens?: number
    temperature_enabled?: boolean
    top_p_enabled?: boolean
    presence_penalty_enabled?: boolean
    frequency_penalty_enabled?: boolean
    max_tokens_enabled?: boolean
  }
  kb_ids: string[]
  search_mode: {
    type: 'hybrid' | 'dense' | 'sparse' | 'fusion'
    weight_dense?: number
    weight_sparse?: number
  } | null
  similarity_threshold: number
  vector_similarity_weight: number
  top_n: number
  top_k: number
  rerank_id: string | null
  do_refer: string
  prompt_config: {
    prologue: string
    empty_response: string
    parameters: Array<{ key: string; optional: boolean }>
  }
}



export const CreateAppPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // 主题状态管理
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(getResolvedTheme())
  
  useEffect(() => {
    const updateTheme = () => {
      setCurrentTheme(getResolvedTheme())
    }
    
    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          updateTheme()
        }
      })
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    
    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleMediaChange = () => {
      // 只有在系统主题模式下才响应
      if (!document.documentElement.hasAttribute('data-theme')) {
        updateTheme()
      }
    }
    mediaQuery.addEventListener('change', handleMediaChange)
    
    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])
  
  // 从URL参数初始化配置
  const [config, setConfig] = useState<AppConfig>({
    name: searchParams.get('name') || '新建应用',
    description: searchParams.get('description') || '这是一个AI助手应用',
    icon: searchParams.get('icon') || undefined,
    systemPrompt: '你是一个智能助手，请提供有帮助的回答。',
    llm_id: '',
    llm_setting: {
      temperature: 0.5,
      top_p: 0.85,
      presence_penalty: 0.2,
      frequency_penalty: 0.3,
      max_tokens: 4096,
      temperature_enabled: true,
      top_p_enabled: true,
      presence_penalty_enabled: true,
      frequency_penalty_enabled: true,
      max_tokens_enabled: true
    },
    kb_ids: [],
    search_mode: {
      type: 'dense' as const
    },
    similarity_threshold: 0.2,
    vector_similarity_weight: 0.3,
    top_n: 8,
    top_k: 1024,
    rerank_id: null,
    do_refer: '1',
    prompt_config: {
      prologue: '您好，我是您的助手！',
      empty_response: '',
      parameters: []
    }
  })
  
  // 模型数据
  const [chatModels, setChatModels] = useState<MyLLMProvider>({})
  const [rerankModels, setRerankModels] = useState<LLMModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | undefined>()
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<KnowledgeBase[]>([])
  
  // 模态框状态
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)
  const [knowledgeSearch, setKnowledgeSearch] = useState('')
  const [knowledgePage, setKnowledgePage] = useState(1)
  const [knowledgeTotal, setKnowledgeTotal] = useState(0)
  const [addedKnowledgeBases, setAddedKnowledgeBases] = useState<Set<string>>(new Set())
  
  // 计算已选中知识库的 embedding 模型 ID（用于限制只能选择相同 embedding 模型的知识库）
  const selectedEmbdId = useMemo(() => {
    if (knowledgeBases.length === 0) return ''
    const firstKb = knowledgeBases[0]
    return firstKb?.embd_id || ''
  }, [knowledgeBases])
  
  // 生成多样性预设状态
  const [currentPreset, setCurrentPreset] = useState<GenerationPresetType>(GenerationPresetType.Custom)
  const [variableForm, setVariableForm] = useState<{ key: string; optional: boolean }>({ key: '', optional: false })
  
  
  // 临时编辑状态
  const [tempConfig, setTempConfig] = useState({
    name: config.name,
    description: config.description,
    icon: config.icon
  })
  
  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      // 先加载模型列表和知识库
      await Promise.all([loadModels(), loadKnowledgeBases()])
      
      // 然后加载对话配置
      const dialogId = searchParams.get('dialog_id') || searchParams.get('id')
      if (dialogId) {
        await loadDialogConfig(dialogId)
      }
    }
    
    loadData()
  }, [])
  
  // 加载对话配置
  const loadDialogConfig = async (dialogId: string) => {
    try {
      const response = await dialogAPI.getDetail(dialogId)
      
      // 根据新的API响应结构处理数据
      const data = response
      if (data) {
        // 处理llm_setting，如果为null则所有参数都不启用
        const llmSetting = data.llm_setting
        const isLlmSettingNull = llmSetting === null
        
        const newConfig = {
          name: data.name || '新建应用',
          description: data.description || '',
          icon: data.icon || '',
          systemPrompt: data.prompt_config?.system || '你是一个智能助手，请提供有帮助的回答。',
          llm_id: data.llm_id || '',
          llm_setting: {
            // 如果 llm_setting 为 null，使用默认值但不启用
            // 使用 Number() 确保值为数字类型，避免 API 字符串类型错误
            temperature: isLlmSettingNull ? 0.5 : Number(llmSetting?.temperature ?? 0.5),
            top_p: isLlmSettingNull ? 0.85 : Number(llmSetting?.top_p ?? 0.85),
            presence_penalty: isLlmSettingNull ? 0.2 : Number(llmSetting?.presence_penalty ?? 0.2),
            frequency_penalty: isLlmSettingNull ? 0.3 : Number(llmSetting?.frequency_penalty ?? 0.3),
            max_tokens: isLlmSettingNull ? 4096 : Number(llmSetting?.max_tokens ?? 4096),
            // 如果 llm_setting 为 null，所有参数都不启用
            temperature_enabled: isLlmSettingNull ? false : (llmSetting?.temperature !== undefined),
            top_p_enabled: isLlmSettingNull ? false : (llmSetting?.top_p !== undefined),
            presence_penalty_enabled: isLlmSettingNull ? false : (llmSetting?.presence_penalty !== undefined),
            frequency_penalty_enabled: isLlmSettingNull ? false : (llmSetting?.frequency_penalty !== undefined),
            max_tokens_enabled: isLlmSettingNull ? false : (llmSetting?.max_tokens !== undefined)
          },
          kb_ids: data.kb_ids || [],
          // 处理 search_mode，根据后端返回的数据结构解析
          search_mode: (() => {
            if (!data.search_mode) {
              return { type: 'dense' as const } // 默认语义模式
            }
            
            // 后端返回的可能是 { "hybrid": { "weight_dense": 0.7, "weight_sparse": 0.3 } } 这样的格式
            if (typeof data.search_mode === 'object') {
              const keys = Object.keys(data.search_mode)
              if (keys.length > 0) {
                const modeType = keys[0] as 'hybrid' | 'dense' | 'sparse' | 'fusion'
                const modeData = (data.search_mode as any)[modeType]
                
                if (modeType === 'hybrid' && modeData) {
                  return {
                    type: 'hybrid' as const,
                    weight_dense: modeData.weight_dense || 0.7,
                    weight_sparse: modeData.weight_sparse || 0.3
                  }
                } else {
                  return { type: modeType }
                }
              }
            }
            
            return { type: 'dense' as const }
          })(),
          similarity_threshold: data.similarity_threshold || 0.2,
          vector_similarity_weight: data.vector_similarity_weight || 0.3,
          top_n: data.top_n || 8,
          top_k: data.top_k || 1024,
          rerank_id: data.rerank_id || null,
          do_refer: data.do_refer || '1',
          prompt_config: {
            prologue: data.prompt_config?.prologue || '您好，我是您的助手！',
            empty_response: data.prompt_config?.empty_response || '',
            parameters: data.prompt_config?.parameters || []
          }
        }
        
        setConfig(newConfig)
        
        // 根据加载的参数判断当前预设
        const loadedSetting = newConfig.llm_setting
        const matchedPreset = detectMatchingPresetSnake({
          temperature: loadedSetting.temperature ?? 0.5,
          top_p: loadedSetting.top_p ?? 0.85,
          presence_penalty: loadedSetting.presence_penalty ?? 0.2,
          frequency_penalty: loadedSetting.frequency_penalty ?? 0.3,
          max_tokens: loadedSetting.max_tokens ?? 4096,
          temperature_enabled: loadedSetting.temperature_enabled ?? false,
          top_p_enabled: loadedSetting.top_p_enabled ?? false,
          presence_penalty_enabled: loadedSetting.presence_penalty_enabled ?? false,
          frequency_penalty_enabled: loadedSetting.frequency_penalty_enabled ?? false,
          max_tokens_enabled: loadedSetting.max_tokens_enabled ?? false,
        })
        
        setCurrentPreset(matchedPreset)
        
        // 同步更新已添加的知识库 - 需要获取完整的知识库详情（包含 embd_id）
        if (data.kb_ids && Array.isArray(data.kb_ids) && data.kb_ids.length > 0) {
          // 并行获取所有知识库的详情
          const kbPromises = data.kb_ids.map(async (kbId: string, index: number) => {
            try {
              // 调用 API 获取知识库完整详情（包含 embd_id）
              const kbDetail = await knowledgeAPI.knowledgeBase.get(kbId)
              return kbDetail
            } catch (error) {
              console.error(`Failed to fetch knowledge base ${kbId}:`, error)
              // 获取失败时返回占位对象，使用 kb_names 中的名称
              return {
                id: kbId,
                tenant_id: data.tenant_id || '',
                name: data.kb_names?.[index] || kbId,
                description: '',
                permission: 'me',
                language: data.language || 'Chinese',
                embd_id: '', // 获取失败时无法得知 embd_id
                chunk_count: 0,
                chunk_num: 0,
                doc_num: 0,
                token_num: 0,
                avatar: '',
                parser_id: '',
                create_date: data.create_date || '',
                create_time: data.create_time ? data.create_time.toString() : '',
                update_date: data.update_date || '',
                update_time: data.update_time || 0
              } as KnowledgeBase
            }
          })
          
          const kbs = await Promise.all(kbPromises)
          setKnowledgeBases(kbs)
          setAddedKnowledgeBases(new Set(data.kb_ids))
        }
      }
    } catch (error) {
      console.error('Failed to load dialog config:', error)
      toast.error('加载对话配置失败')
    }
  }
  
  // 加载模型列表
  const loadModels = async () => {
    try {
      setModelsLoading(true)
      setModelsError(undefined)
      
      const response = await llmAPI.list()
      if (response && typeof response === 'object') {
        // 为 ChatModelSelector 格式化数据
        // API 返回格式: { [providerName]: { tags: string, llm: [{ type, name, used_token }] } }
        const chatModelData: MyLLMProvider = {}
        const allRerankModels: LLMModel[] = []
        
        Object.entries(response).forEach(([providerName, providerData]: [string, any]) => {
          // 新格式：providerData 是 { tags, llm: [...] } 对象
          if (providerData && providerData.llm && Array.isArray(providerData.llm)) {
            // 处理聊天模型（type 为 'chat' 或 'image2text'）
            const chatModels = providerData.llm.filter((model: any) => 
              model.type === 'chat' || model.type === 'image2text'
            ).map((model: any) => ({
              name: model.name,
              type: model.type as 'chat' | 'image2text',
              used_token: model.used_token || 0
            }))
            
            if (chatModels.length > 0) {
              chatModelData[providerName] = {
                llm: chatModels,
                tags: providerData.tags || ''
              }
            }
            
            // 处理重排序模型
            const rerankModels = providerData.llm.filter((model: any) => 
              model.type === 'rerank'
            ).map((model: any) => ({
              id: `${model.name}@${providerName}`,
              llm_name: model.name,
              fid: providerName,
              mdl_type: 'rerank' as const,
              available: true
            }))
            allRerankModels.push(...rerankModels)
          }
        })
        
        setChatModels(chatModelData)
        setRerankModels(allRerankModels)
        
        // 设置默认模型
        if (Object.keys(chatModelData).length > 0 && !config.llm_id) {
          const firstProvider = Object.values(chatModelData)[0]
          if (firstProvider.llm && firstProvider.llm.length > 0) {
            setConfig(prev => ({ ...prev, llm_id: firstProvider.llm[0].name }))
          }
        }
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      setModelsError('加载模型列表失败')
      toast.error('加载模型列表失败')
    } finally {
      setModelsLoading(false)
    }
  }
  
  // 加载知识库列表
  const loadKnowledgeBases = async (search?: string, page = 1) => {
    try {
      const response = await knowledgeAPI.knowledgeBase.list({
        keywords: search || '',
        page,
        page_size: 10,
        orderby: 'create_time',
        desc: true
      })
      
      if (response.kbs) {
        setAvailableKnowledgeBases(response.kbs)
        setKnowledgeTotal(response.total || 0)
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      toast.error('加载知识库列表失败')
    }
  }

  // 预览对话状态
  interface PreviewMessage {
    role: 'user' | 'assistant'
    content: string
    id: string
    thinking?: string
  }
  const [previewMessages, setPreviewMessages] = useState<PreviewMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [previewConversationId, setPreviewConversationId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 初始化开场白消息
  useEffect(() => {
    if (config.prompt_config.prologue) {
      setPreviewMessages([{
        role: 'assistant',
        content: config.prompt_config.prologue,
        id: 'prologue-' + Date.now()
      }])
    }
  }, [config.prompt_config.prologue])
  
  // 获取或创建预览会话
  const getOrCreatePreviewConversation = useCallback(async (): Promise<string | null> => {
    // 如果已有预览会话，直接返回
    if (previewConversationId) {
      return previewConversationId
    }
    
    // 获取 dialog_id
    const dialogId = searchParams.get('dialog_id') || searchParams.get('id')
    if (!dialogId) {
      toast.error('请先保存应用配置')
      return null
    }
    
    try {
      // 创建新的预览会话
      const newConversation = await conversationAPI.setConversation({
        dialog_id: dialogId,
        name: `预览会话 - ${new Date().toLocaleString()}`,
        is_new: true
      })
      
      if (newConversation?.id) {
        setPreviewConversationId(newConversation.id)
        return newConversation.id
      }
      return null
    } catch (error) {
      console.error('Failed to create preview conversation:', error)
      toast.error('创建预览会话失败')
      return null
    }
  }, [previewConversationId, searchParams])
  
  // 停止输出
  const handleStopOutput = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])
  
  // 发送预览消息（真实 API 调用）
  const handleSendPreviewMessage = useCallback(async (userContent: string) => {
    if (!userContent.trim() || isStreaming) return
    
    const conversationId = await getOrCreatePreviewConversation()
    if (!conversationId) return
    
    // 添加用户消息
    const userMessage: PreviewMessage = {
      role: 'user',
      content: userContent.trim(),
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    // 添加 AI 占位消息
    const aiMessage: PreviewMessage = {
      role: 'assistant',
      content: '',
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      thinking: ''
    }
    
    setPreviewMessages(prev => [...prev, userMessage, aiMessage])
    setIsStreaming(true)
    setInputValue('')
    
    // 创建 AbortController
    abortControllerRef.current = new AbortController()
    
    try {
      // 构建消息历史（排除开场白）
      const historyMessages = previewMessages
        .filter(msg => !msg.id.startsWith('prologue-'))
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      
      // 添加当前用户消息
      historyMessages.push({
        role: 'user',
        content: userContent.trim()
      })
      
      // 调用 completion API
      const response = await conversationAPI.completion({
        conversation_id: conversationId,
        messages: historyMessages,
        quote: true,
        stream: true
      })
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      if (!response.body) throw new Error('No response body')
      
      // 使用 EventSourceParserStream 处理 SSE 流
      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream())
        .getReader()
      
      while (true) {
        // 检查是否被中止
        if (abortControllerRef.current?.signal.aborted) {
          break
        }
        
        const { done, value } = await reader.read()
        if (done) break
        
        try {
          const jsonStr = value?.data
          if (!jsonStr) continue
          
          const data = JSON.parse(jsonStr)
          // 检查是否是终止信号
          if (data.data === true) continue
          
          if (data.retcode === 0 && data.data?.answer) {
            const content = data.data.answer
            
            // 提取 think/thinking 内容
            let thinking = ''
            const thinkMatch = content.match(/<think(?:ing)?>([\s\S]*?)(?:<\/think(?:ing)?>|$)/)
            if (thinkMatch) {
              thinking = thinkMatch[1].trim()
            }
            
            // 清理内容：移除 think 标签及其内容
            const cleanContent = content
              .replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/g, '')
              .replace(/<think(?:ing)?>[\s\S]*$/, '')
              .trim()
            
            setPreviewMessages(prev => {
              const newMsgs = [...prev]
              const lastIdx = newMsgs.length - 1
              if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
                newMsgs[lastIdx] = {
                  ...newMsgs[lastIdx],
                  content: cleanContent,
                  thinking
                }
              }
              return newMsgs
            })
          }
        } catch {
          // JSON 解析错误，忽略
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to send preview message:', error)
        setPreviewMessages(prev => {
          const newMsgs = [...prev]
          const lastIdx = newMsgs.length - 1
          if (lastIdx >= 0 && newMsgs[lastIdx].role === 'assistant') {
            newMsgs[lastIdx] = {
              ...newMsgs[lastIdx],
              content: '抱歉，发生了错误，请重试。'
            }
          }
          return newMsgs
        })
      }
    } finally {
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }, [isStreaming, getOrCreatePreviewConversation, previewMessages])
  
  // 重置预览会话
  const handleResetPreview = useCallback(() => {
    // 停止任何正在进行的输出
    handleStopOutput()
    // 清空预览会话 ID，下次发送时会创建新会话
    setPreviewConversationId(null)
    // 重置消息为开场白
    if (config.prompt_config.prologue) {
      setPreviewMessages([{
        role: 'assistant',
        content: config.prompt_config.prologue,
        id: 'prologue-' + Date.now()
      }])
    } else {
      setPreviewMessages([])
    }
  }, [handleStopOutput, config.prompt_config.prologue])

  const handleConfigChange = (key: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }
  
  // 处理生成预设变化
  const handlePresetChange = (preset: string) => {
    const presetType = preset as GenerationPresetType
    
    if (presetType !== GenerationPresetType.Custom && presetType in generationPresetConfigMapSnake) {
      const presetConfig = generationPresetConfigMapSnake[presetType as Exclude<GenerationPresetType, 'custom'>]
      const enabledFields = getDefaultEnabledFieldsSnake()
      
      setConfig(prev => ({
        ...prev,
        llm_setting: {
          ...prev.llm_setting,
          // 更新参数值
          temperature: presetConfig.temperature,
          top_p: presetConfig.top_p,
          presence_penalty: presetConfig.presence_penalty,
          frequency_penalty: presetConfig.frequency_penalty,
          max_tokens: presetConfig.max_tokens,
          // 更新启用状态
          ...enabledFields,
        }
      }))
      setCurrentPreset(presetType)
    } else {
      setCurrentPreset(GenerationPresetType.Custom)
    }
  }
  
  // 处理LLM设置变化
  const handleLLMSettingChange = (field: string, value: any) => {
    const newSetting = {
      ...config.llm_setting,
      [field]: value
    }
    
    setConfig(prev => ({
      ...prev,
      llm_setting: newSetting
    }))
    
    // 使用统一的预设检测函数
    const matchedPreset = detectMatchingPresetSnake({
      temperature: newSetting.temperature ?? 0.5,
      top_p: newSetting.top_p ?? 0.85,
      presence_penalty: newSetting.presence_penalty ?? 0.2,
      frequency_penalty: newSetting.frequency_penalty ?? 0.3,
      max_tokens: newSetting.max_tokens ?? 4096,
      temperature_enabled: newSetting.temperature_enabled ?? false,
      top_p_enabled: newSetting.top_p_enabled ?? false,
      presence_penalty_enabled: newSetting.presence_penalty_enabled ?? false,
      frequency_penalty_enabled: newSetting.frequency_penalty_enabled ?? false,
      max_tokens_enabled: newSetting.max_tokens_enabled ?? false,
    })
    
    setCurrentPreset(matchedPreset)
  }
  
  // 添加知识库
  const handleAddKnowledgeBase = (kb: KnowledgeBase) => {
    setConfig(prev => ({
      ...prev,
      kb_ids: [...prev.kb_ids, kb.id]
    }))
    setKnowledgeBases(prev => [...prev, kb])
    setAddedKnowledgeBases(prev => new Set(prev).add(kb.id))
  }
  
  // 删除知识库
  const handleRemoveKnowledgeBase = (kbId: string) => {
    setConfig(prev => ({
      ...prev,
      kb_ids: prev.kb_ids.filter(id => id !== kbId)
    }))
    setKnowledgeBases(prev => prev.filter(kb => kb.id !== kbId))
    setAddedKnowledgeBases(prev => {
      const newSet = new Set(prev)
      newSet.delete(kbId)
      return newSet
    })
  }
  
  // 添加变量
  const handleAddVariable = () => {
    if (!variableForm.key.trim()) {
      toast.error('变量名不能为空')
      return
    }
    
    const exists = config.prompt_config.parameters.some(p => p.key === variableForm.key)
    if (exists) {
      toast.error('变量名已存在')
      return
    }
    
    setConfig(prev => ({
      ...prev,
      prompt_config: {
        ...prev.prompt_config,
        parameters: [...prev.prompt_config.parameters, { ...variableForm }]
      }
    }))
    
    setVariableForm({ key: '', optional: false })
    setShowVariableModal(false)
  }
  
  // 删除变量
  const handleRemoveVariable = (key: string) => {
    setConfig(prev => ({
      ...prev,
      prompt_config: {
        ...prev.prompt_config,
        parameters: prev.prompt_config.parameters.filter(p => p.key !== key)
      }
    }))
  }

  const handleEditApp = () => {
    setTempConfig({
      name: config.name,
      description: config.description,
      icon: config.icon
    })
    setShowEditModal(true)
  }

  const handleSaveEdit = () => {
    setConfig(prev => ({
      ...prev,
      name: tempConfig.name,
      description: tempConfig.description,
      icon: tempConfig.icon
    }))
    setShowEditModal(false)
  }

  const handleCancelEdit = () => {
    setTempConfig({
      name: config.name,
      description: config.description,
      icon: config.icon
    })
    setShowEditModal(false)
  }

  
  // 保存状态
  const [saving, setSaving] = useState(false)
  
  // 保存配置
  const handleSave = async () => {
    try {
      setSaving(true)
      
      // 验证必填项
      if (!config.name.trim()) {
        toast.error('应用名称不能为空')
        setSaving(false)
        return
      }
      
      if (!config.llm_id) {
        toast.error('请选择模型')
        setSaving(false)
        return
      }
      
      // 获取dialog_id（用于更新操作）
      const dialogId = searchParams.get('dialog_id') || searchParams.get('id')
      
      // 构建 llm_setting，如果没有启用的参数则传 null
      // 使用 Number() 确保值为数字类型，避免 API 字符串类型错误
      const enabledLlmSettings = {
        ...(config.llm_setting.temperature_enabled && { temperature: Number(config.llm_setting.temperature) }),
        ...(config.llm_setting.top_p_enabled && { top_p: Number(config.llm_setting.top_p) }),
        ...(config.llm_setting.presence_penalty_enabled && { presence_penalty: Number(config.llm_setting.presence_penalty) }),
        ...(config.llm_setting.frequency_penalty_enabled && { frequency_penalty: Number(config.llm_setting.frequency_penalty) }),
        ...(config.llm_setting.max_tokens_enabled && { max_tokens: Number(config.llm_setting.max_tokens) })
      }
      
      // 构建 search_mode
      let searchMode = null
      if (config.search_mode) {
        if (config.search_mode.type === 'hybrid') {
          searchMode = {
            type: 'hybrid',
            weight_dense: config.search_mode.weight_dense || 0.7,
            weight_sparse: config.search_mode.weight_sparse || 0.3
          }
        } else {
          searchMode = {
            type: config.search_mode.type
          }
        }
      }
      
      // 构建请求参数 - 确保包含所有后端需要的字段
      // 当没有知识库时，确保系统提示词中不包含 {knowledge}
      const hasKnowledgeBase = config.kb_ids && config.kb_ids.length > 0
      
      // 处理系统提示词：如果没有知识库，移除 {knowledge} 相关内容
      let systemPrompt = config.systemPrompt
      if (!hasKnowledgeBase) {
        // 移除 {knowledge} 占位符和相关的知识库描述文本
        systemPrompt = systemPrompt
          .replace(/{knowledge}/g, '')
          .replace(/以下是知识库：[\s\S]*?以上是知识库。/g, '')
          .replace(/以下是知识库：\s*\n\s*\n\s*以上是知识库。/g, '')
          .trim()
        
        // 如果系统提示词为空或只是默认值，提供一个不包含知识库的默认提示
        if (!systemPrompt || systemPrompt === '') {
          systemPrompt = '你是一个智能助手，请提供有帮助的回答。'
        }
      }
      
      const requestData: any = {
        // 基础信息
        name: config.name,
        description: config.description,
        icon: config.icon || '',
        
        // 模型配置
        llm_id: config.llm_id,
        llm_setting: Object.keys(enabledLlmSettings).length > 0 ? enabledLlmSettings : null,
        
        // 提示配置
        prompt_config: {
          system: systemPrompt,
          prologue: config.prompt_config.prologue || '您好，我是您的助手！',
          empty_response: config.prompt_config.empty_response || '抱歉，我无法回答这个问题。',
          parameters: hasKnowledgeBase 
            ? config.prompt_config.parameters 
            : config.prompt_config.parameters.filter(p => p.key !== 'knowledge')
        },
        
        // 检索配置
        kb_ids: config.kb_ids || [],
        top_n: config.top_n,
        top_k: config.top_k,
        similarity_threshold: config.similarity_threshold,
        vector_similarity_weight: config.vector_similarity_weight,
        rerank_id: config.rerank_id || null
      }
      
      // 调试：打印请求数据
      console.log('CreateApp Request Data:', {
        kb_ids: requestData.kb_ids,
        prompt_config: requestData.prompt_config,
        hasKnowledgeBase
      })
      
      // 如果有dialog_id则添加（用于更新操作）
      if (dialogId) {
        requestData.dialog_id = dialogId
      }
      
      // 如果有search_mode则添加
      if (searchMode) {
        requestData.search_mode = searchMode
      }
      
      // 调用API保存
      const result = await dialogAPI.set(requestData)
      
      // 显示保存成功提示
      toast.success('保存成功')
      
      // 如果是新创建的对话，更新URL以包含新的dialog_id
      if (!dialogId && result && result.id) {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('dialog_id', result.id)
        window.history.replaceState({}, '', newUrl.toString())
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleIconUpload: UploadProps['beforeUpload'] = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/svg+xml'
    if (!isJpgOrPng) {
      toast.error('只能上传 JPG/PNG/SVG 格式的图片!')
      return false
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      toast.error('图片大小不能超过 2MB!')
      return false
    }

    // 转换为base64
    const reader = new FileReader()
    reader.onload = () => {
      setTempConfig(prev => ({ ...prev, icon: reader.result as string }))
    }
    reader.readAsDataURL(file)
    return false // 阻止自动上传
  }

  const renderHeader = () => (
    <div className="px-6 py-4 flex items-center justify-between" style={{ 
      backgroundColor: 'var(--color-components-panel-content-bg)',
      borderBottom: '1px solid var(--color-border-default)'
    }}>
      {/* 左侧：返回按钮 + 应用信息 */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost"
          size="icon"
          onClick={() => navigate('/studio')}
        >
          <ArrowLeft className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
        </Button>
        
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {config.icon ? (
              <AvatarImage src={config.icon} alt={config.name} />
            ) : null}
            <AvatarFallback 
              style={{ 
                background: 'var(--color-components-app-avatar-bg)',
                border: '1px solid var(--color-components-app-avatar-border)'
              }}
            >
              <LayoutGrid className="h-5 w-5" style={{ color: 'var(--color-text-tertiary)' }} />
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2">
            <div>
              <h5 className="m-0 text-base font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {config.name}
              </h5>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {config.description}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleEditApp}
            >
              <Pencil className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
            </Button>
          </div>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <div className="flex items-center gap-2">
        <Button 
          variant="outline"
          onClick={handleSave}
          loading={saving}
          disabled={saving}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? '保存中...' : '保存'}
        </Button>
        <Button variant="default">
          <PlayCircle className="h-4 w-4 mr-2" />
          发布
        </Button>
      </div>
    </div>
  )

  const renderLeftPanel = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-components-panel-content-bg)' }}>
      {leftCollapsed ? (
        <div className="flex flex-col items-center p-4 h-full justify-center">
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setLeftCollapsed(false)}
            className="mb-4"
          >
            <Pencil className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
          </Button>
          <span className="text-xs transform -rotate-90 whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
            人设与回复逻辑
          </span>
        </div>
      ) : (
        <>
          <div className="p-4" style={{ 
            backgroundColor: 'var(--color-components-panel-header-bg)',
            borderBottom: '1px solid var(--color-border-default)'
          }}>
            <div className="flex items-center justify-between">
              <h5 className="m-0 text-base font-semibold" style={{ color: 'var(--color-components-panel-header-text)' }}>人设与回复逻辑</h5>
              <Button 
                variant="ghost"
                size="icon-sm"
                onClick={() => setLeftCollapsed(true)}
              >
                <ArrowLeft className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0">
              <MDEditor
                value={config.systemPrompt}
                onChange={(value) => handleConfigChange('systemPrompt', value || '')}
                data-color-mode={currentTheme}
                height="100%"
                visibleDragbar={false}
                textareaProps={{
                  placeholder: '# AI助手系统提示词\n\n请在这里定义AI助手的角色和行为...\n\n## 示例：\n你是一个专业的客服助手，具有以下特点：\n- 友好和耐心\n- 提供准确信息\n- 快速响应问题',
                  style: {
                    fontSize: 14,
                    lineHeight: 1.6,
                    fontFamily: 'ui-monospace, SFMono-Regular, Monaco, Consolas, monospace'
                  },
                  spellCheck: false
                }}
                preview="edit"
              />
            </div>
            
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
              <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                <span>💡 支持Markdown语法</span>
                <span>字符数: {config.systemPrompt.length}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

  const renderCenterPanel = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-components-panel-content-bg)' }}>
      <div className="p-4" style={{ 
        backgroundColor: 'var(--color-components-panel-header-bg)',
        borderBottom: '1px solid var(--color-border-default)'
      }}>
        <h5 className="m-0 text-base font-semibold" style={{ color: 'var(--color-components-panel-header-text)' }}>应用配置</h5>
      </div>
      
      <div className="flex-1 p-4 overflow-auto space-y-4">
        {/* 模型配置 */}
        <CollapsibleSection title="模型" defaultOpen={true}>
          <div className="space-y-6">
            {/* 模型选择 */}
            <div>
              <ChatModelSelector
                models={chatModels}
                selectedModelName={config.llm_id}
                onSelect={(modelName) => handleConfigChange('llm_id', modelName)}
                loading={modelsLoading}
                error={modelsError}
                modelTypes={['chat', 'image2text']}
              />
            </div>
            
            {/* 生成多样性 */}
            <div>
              <span className="block mb-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>生成多样性</span>
              <Tabs value={currentPreset} onValueChange={handlePresetChange}>
                <TabsList>
                  {generationPresetOptions.map(option => (
                    <TabsTrigger key={option.value} value={option.value}>
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              
              <div className="mt-4 space-y-4">
                {/* 温度 */}
                <LLMParameterControl
                  label={LLM_PARAMETER_PRESETS.temperature.label}
                  tooltip={LLM_PARAMETER_PRESETS.temperature.tooltip}
                  value={config.llm_setting.temperature ?? LLM_PARAMETER_PRESETS.temperature.default}
                  onChange={(value) => handleLLMSettingChange('temperature', value)}
                  enabled={config.llm_setting.temperature_enabled}
                  onEnabledChange={(checked) => handleLLMSettingChange('temperature_enabled', checked)}
                  min={LLM_PARAMETER_PRESETS.temperature.min}
                  max={LLM_PARAMETER_PRESETS.temperature.max}
                  step={LLM_PARAMETER_PRESETS.temperature.step}
                />
                
                {/* Top P */}
                <LLMParameterControl
                  label={LLM_PARAMETER_PRESETS.topP.label}
                  tooltip={LLM_PARAMETER_PRESETS.topP.tooltip}
                  value={config.llm_setting.top_p ?? LLM_PARAMETER_PRESETS.topP.default}
                  onChange={(value) => handleLLMSettingChange('top_p', value)}
                  enabled={config.llm_setting.top_p_enabled}
                  onEnabledChange={(checked) => handleLLMSettingChange('top_p_enabled', checked)}
                  min={LLM_PARAMETER_PRESETS.topP.min}
                  max={LLM_PARAMETER_PRESETS.topP.max}
                  step={LLM_PARAMETER_PRESETS.topP.step}
                />
                
                {/* 存在处罚 */}
                <LLMParameterControl
                  label={LLM_PARAMETER_PRESETS.presencePenalty.label}
                  tooltip={LLM_PARAMETER_PRESETS.presencePenalty.tooltip}
                  value={config.llm_setting.presence_penalty ?? LLM_PARAMETER_PRESETS.presencePenalty.default}
                  onChange={(value) => handleLLMSettingChange('presence_penalty', value)}
                  enabled={config.llm_setting.presence_penalty_enabled}
                  onEnabledChange={(checked) => handleLLMSettingChange('presence_penalty_enabled', checked)}
                  min={LLM_PARAMETER_PRESETS.presencePenalty.min}
                  max={LLM_PARAMETER_PRESETS.presencePenalty.max}
                  step={LLM_PARAMETER_PRESETS.presencePenalty.step}
                />
                
                {/* 频率惩罚 */}
                <LLMParameterControl
                  label={LLM_PARAMETER_PRESETS.frequencyPenalty.label}
                  tooltip={LLM_PARAMETER_PRESETS.frequencyPenalty.tooltip}
                  value={config.llm_setting.frequency_penalty ?? LLM_PARAMETER_PRESETS.frequencyPenalty.default}
                  onChange={(value) => handleLLMSettingChange('frequency_penalty', value)}
                  enabled={config.llm_setting.frequency_penalty_enabled}
                  onEnabledChange={(checked) => handleLLMSettingChange('frequency_penalty_enabled', checked)}
                  min={LLM_PARAMETER_PRESETS.frequencyPenalty.min}
                  max={LLM_PARAMETER_PRESETS.frequencyPenalty.max}
                  step={LLM_PARAMETER_PRESETS.frequencyPenalty.step}
                />
                
                {/* 最大 Token 数 */}
                <LLMParameterControl
                  label={LLM_PARAMETER_PRESETS.maxTokens.label}
                  tooltip={LLM_PARAMETER_PRESETS.maxTokens.tooltip}
                  value={config.llm_setting.max_tokens ?? LLM_PARAMETER_PRESETS.maxTokens.default}
                  onChange={(value) => handleLLMSettingChange('max_tokens', value)}
                  enabled={config.llm_setting.max_tokens_enabled}
                  onEnabledChange={(checked) => handleLLMSettingChange('max_tokens_enabled', checked)}
                  min={LLM_PARAMETER_PRESETS.maxTokens.min}
                  max={LLM_PARAMETER_PRESETS.maxTokens.max}
                  step={LLM_PARAMETER_PRESETS.maxTokens.step}
                  inputOnly={LLM_PARAMETER_PRESETS.maxTokens.inputOnly}
                  inputWidth={LLM_PARAMETER_PRESETS.maxTokens.inputWidth}
                />
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* 知识库配置 */}
        <CollapsibleSection 
          title="知识库" 
          extra={
            <Button 
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowKnowledgeModal(true)
                loadKnowledgeBases()
              }}
            >
              <Plus className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
            </Button>
          }
        >
          <div className="space-y-4">
            {/* 已添加的知识库 */}
            <div>
              <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>已添加的知识库</span>
              {knowledgeBases.length === 0 ? (
                <div className="text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
                  暂无添加的知识库
                </div>
              ) : (
                <div className="space-y-2">
                  {knowledgeBases.map(kb => (
                    <div 
                      key={kb.id} 
                      className="flex items-center justify-between p-3 border rounded-lg"
                      style={{ borderColor: 'var(--color-border-default)' }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <KnowledgeBaseAvatar 
                          name={kb.name} 
                          avatar={kb.avatar} 
                          size="lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                            {kb.name}
                          </div>
                          {kb.description && (
                            <div className="text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                              {kb.description}
                            </div>
                          )}
                          {kb.embd_id && (
                            <Badge variant="blue" className="mt-1 text-xs">
                              {kb.embd_id}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveKnowledgeBase(kb.id)}
                      >
                        <Trash2 className="h-4 w-4" style={{ color: 'var(--color-state-error-text)' }} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* 知识库设置 */}
            <CollapsibleSection title="知识库设置">
              <div className="space-y-4">
                {/* 搜索策略 */}
                <div>
                  <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>搜索策略</span>
                  <Select
                    value={config.search_mode?.type ?? 'dense'}
                    onValueChange={(value) => {
                      const searchMode = value === 'hybrid' 
                        ? { type: 'hybrid' as const, weight_dense: config.search_mode?.weight_dense ?? 0.7, weight_sparse: config.search_mode?.weight_sparse ?? 0.3 }
                        : value === 'dense'
                        ? { type: 'dense' as const }
                        : { type: 'sparse' as const }
                      handleConfigChange('search_mode', searchMode)
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择搜索策略" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hybrid">混合</SelectItem>
                      <SelectItem value="dense">语义</SelectItem>
                      <SelectItem value="sparse">全文</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* 混合检索权重设置 */}
                  {config.search_mode?.type === 'hybrid' && (
                    <div className="mt-3 space-y-3 p-3 rounded" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">向量权重</span>
                          <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{((config.search_mode?.weight_dense ?? 0.7)).toFixed(2)}</span>
                        </div>
                        <Slider
                          min={0}
                          max={1}
                          step={0.01}
                          value={[config.search_mode?.weight_dense ?? 0.7]}
                          onValueChange={(values) => {
                            const denseWeight = Number(values[0].toFixed(2))
                            const sparseWeight = Number((1 - denseWeight).toFixed(2))
                            handleConfigChange('search_mode', {
                              type: 'hybrid' as const,
                              weight_dense: denseWeight,
                              weight_sparse: sparseWeight
                            })
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">全文权重 (自动计算)</span>
                          <span className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{((config.search_mode?.weight_sparse ?? 0.3)).toFixed(2)}</span>
                        </div>
                        <div className="h-2 rounded relative" style={{ backgroundColor: 'var(--color-components-progress-bg)' }}>
                          <div
                            className="h-full rounded"
                            style={{ 
                              width: `${((config.search_mode?.weight_sparse ?? 0.3) * 100).toFixed(0)}%`,
                              backgroundColor: 'var(--color-components-progress-fill)'
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs p-2 rounded" style={{ 
                        color: 'var(--color-text-tertiary)', 
                        backgroundColor: 'var(--color-components-alert-info-bg)', 
                        border: '1px solid var(--color-components-alert-info-border)' 
                      }}>
                        💡 向量权重 + 全文权重 = 1.00 (精确到小数点后2位)
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 相似度阈值 */}
                <div>
                  <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>相似度阈值: {Number(config.similarity_threshold ?? 0).toFixed(2)}</span>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[config.similarity_threshold ?? 0]}
                    onValueChange={(values) => handleConfigChange('similarity_threshold', values[0])}
                  />
                </div>
                
                {/* 关键字相似度权重 */}
                <div>
                  <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>关键字相似度权重: {Number(config.vector_similarity_weight ?? 0).toFixed(2)}</span>
                  <Slider
                    min={0}
                    max={1}
                    step={0.01}
                    value={[config.vector_similarity_weight ?? 0]}
                    onValueChange={(values) => handleConfigChange('vector_similarity_weight', values[0])}
                  />
                </div>
                
                {/* Top N */}
                <div>
                  <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>Top N: {config.top_n}</span>
                  <Input
                    type="number"
                    min={1}
                    value={config.top_n}
                    onChange={(e) => handleConfigChange('top_n', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                {/* 知识库空回复 */}
                <div>
                  <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>知识库空回复</span>
                  <Textarea
                    rows={2}
                    value={config.prompt_config.empty_response}
                    onChange={(e) => handleConfigChange('prompt_config', {
                      ...config.prompt_config,
                      empty_response: e.target.value
                    })}
                    placeholder="当知识库中未找到相关内容时的回复"
                  />
                </div>
                
                {/* 重排序模型 */}
                <div>
                  <RerankModelSelector
                    models={rerankModels}
                    selectedModelId={config.rerank_id}
                    onSelect={(modelId) => handleConfigChange('rerank_id', modelId)}
                    loading={modelsLoading}
                    error={modelsError}
                  />
                </div>
                
                {/* 向量召回的个数 */}
                <div>
                  <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>向量召回的个数 (Top K): {config.top_k}</span>
                  <Input
                    type="number"
                    min={1}
                    value={config.top_k}
                    onChange={(e) => handleConfigChange('top_k', parseInt(e.target.value) || 1)}
                  />
                </div>
                
                {/* 显示来源 */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>显示来源</span>
                    <Switch
                      checked={config.do_refer === '1'}
                      onCheckedChange={(checked) => handleConfigChange('do_refer', checked ? '1' : '0')}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </CollapsibleSection>

        {/* 变量配置 */}
        <CollapsibleSection 
          title="变量"
          extra={
            <Button 
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation()
                setShowVariableModal(true)
              }}
            >
              <Plus className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
            </Button>
          }
        >
          <div>
            {config.prompt_config.parameters.length === 0 ? (
              <div className="text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
                暂无变量
              </div>
            ) : (
              <div className="space-y-2">
                {config.prompt_config.parameters.map(param => (
                  <div 
                    key={param.key} 
                    className="flex items-center justify-between p-2 rounded"
                    style={{ border: '1px solid var(--color-border-default)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{param.key}</span>
                      <Badge variant={param.optional ? 'orange' : 'blue'}>
                        {param.optional ? '可选' : '必选'}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveVariable(param.key)}
                    >
                      <Trash2 className="h-4 w-4" style={{ color: 'var(--color-state-error-text)' }} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* 对话体验 */}
        <CollapsibleSection title="对话体验">
          <div className="space-y-4">
            {/* 开场白 */}
            <div>
              <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>开场白</span>
              <Textarea
                rows={3}
                value={config.prompt_config.prologue}
                onChange={(e) => handleConfigChange('prompt_config', {
                  ...config.prompt_config,
                  prologue: e.target.value
                })}
                placeholder="设置对话开始时的问候语"
              />
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  )

  const renderRightPanel = () => {
    // 转换消息数据为 Bubble.List 需要的格式
    const bubbleItems = previewMessages.map((msg, index) => {
      const isUser = msg.role === 'user'
      const isLastAssistant = !isUser && index === previewMessages.length - 1
      const isCurrentStreaming = isStreaming && isLastAssistant
      
      return {
        key: msg.id,
        role: msg.role,
        content: (
          <div className="bubble-content leading-relaxed">
            {/* 显示思考过程 */}
            {msg.thinking && (
              <div 
                className="mb-3 p-3 rounded-lg text-xs"
                style={{ 
                  backgroundColor: 'var(--color-chat-think-bg)',
                  border: '1px solid var(--color-chat-think-border)',
                }}
              >
                <div 
                  className="font-medium mb-2 flex items-center gap-1"
                  style={{ color: 'var(--color-chat-think-text)' }}
                >
                  <span>{isCurrentStreaming ? '💭 思考中...' : '💭 思考过程'}</span>
                </div>
                <div 
                  className="whitespace-pre-wrap leading-relaxed"
                  style={{ color: 'var(--color-chat-think-text)' }}
                >
                  {msg.thinking}
                </div>
              </div>
            )}
            {/* 显示主内容 */}
            {msg.content && msg.content.trim() ? (
              renderMarkdown(msg.content)
            ) : isCurrentStreaming && !msg.thinking ? (
              <div className="italic" style={{ color: 'var(--color-text-muted)' }}>正在生成回复...</div>
            ) : null}
          </div>
        ),
        placement: (isUser ? 'end' : 'start') as 'start' | 'end',
        loading: isCurrentStreaming && !msg.content && !msg.thinking,
        avatar: isUser
          ? (
              <div 
                className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
                style={{ 
                  backgroundColor: 'var(--color-chat-bubble-user-avatar-bg)',
                  color: 'var(--color-chat-bubble-user-avatar-text)'
                }}
              >
                U
              </div>
            )
          : config.icon && config.icon.trim() 
            ? (
                <div className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full overflow-hidden flex-shrink-0">
                  <img 
                    src={config.icon} 
                    alt="AI" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            : (
                <div 
                  className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--color-chat-bubble-assistant-avatar-bg)' }}
                >
                  <LayoutGrid className="h-4 w-4" style={{ color: 'var(--color-chat-bubble-assistant-avatar-text)' }} />
                </div>
              ),
        variant: 'borderless' as const,
        shape: 'round' as const,
        styles: {
          avatar: { 
            border: 'none',
            boxShadow: 'none'
          },
          content: {
            backgroundColor: isUser ? 'var(--color-chat-bubble-user-bg)' : 'var(--color-chat-bubble-ai-bg)',
            color: isUser ? 'var(--color-chat-bubble-user-text)' : 'var(--color-chat-bubble-ai-text)',
            border: 'none',
            boxShadow: 'none',
            borderRadius: '16px',
            padding: '12px 16px',
            fontSize: '14px',
            lineHeight: '1.6'
          }
        },
      }
    })


    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-components-panel-content-bg)' }}>
        {rightCollapsed ? (
          <div className="flex flex-col items-center p-4 h-full justify-center">
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => setRightCollapsed(false)}
              className="mb-2"
            >
              <Eye className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              className="mb-4"
            >
              <Bug className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
            </Button>
            <span className="text-xs transform -rotate-90 whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
              预览调试
            </span>
          </div>
        ) : (
          <>
            <div className="p-4" style={{ 
              backgroundColor: 'var(--color-components-panel-header-bg)',
              borderBottom: '1px solid var(--color-border-default)'
            }}>
              <div className="flex items-center justify-between">
                <h5 className="m-0 text-base font-semibold" style={{ color: 'var(--color-components-panel-header-text)' }}>预览与调试</h5>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleResetPreview}
                    title="重置对话"
                  >
                    <RefreshCw className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
                  </Button>
                  <Button 
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setRightCollapsed(true)}
                  >
                    <ChevronRight className="h-4 w-4" style={{ color: 'var(--color-components-icon-button-text)' }} />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              {/* 对话预览区域 */}
              <div className="flex-1 p-4 overflow-auto">
                {previewMessages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" 
                         style={{ background: 'var(--color-components-app-avatar-bg)' }}>
                      <span className="text-sm font-bold" style={{ color: 'var(--color-text-inverted)' }}>AI</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                      {config.name}
                    </h3>
                    <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                      {config.description}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Bubble.List
                      items={bubbleItems}
                      roles={{
                        user: {
                          variant: 'borderless',
                          shape: 'round'
                        },
                        assistant: {
                          variant: 'borderless', 
                          shape: 'round'
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* 底部输入区域 */}
              <div className="p-4" style={{ borderTop: '1px solid var(--color-border-default)' }}>
                <div className="mb-4">
                  <Sender
                    value={inputValue}
                    onChange={(value) => setInputValue(value)}
                    placeholder="输入消息进行预览..."
                    loading={isStreaming}
                    onSubmit={(message) => {
                      if (message) {
                        handleSendPreviewMessage(message)
                      }
                    }}
                    onCancel={handleStopOutput}
                    submitType="enter"
                    styles={{
                      input: {
                        border: 'none',
                        boxShadow: 'none',
                        borderRadius: '12px',
                        backgroundColor: 'var(--color-chat-input-container-bg)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        padding: '8px 12px'
                      }
                    }}
                    className="border-none shadow-none rounded-xl"
                  />
                  {isStreaming && (
                    <div className="flex justify-center mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleStopOutput}
                      >
                        <Square className="h-4 w-4 mr-2" style={{ color: 'var(--color-state-error-text)' }} />
                        停止生成
                      </Button>
                    </div>
                  )}
                </div>
                
                {/* 调试信息 */}
                <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-chat-preview-debug-bg)' }}>
                  <span className="block mb-2 text-xs font-medium" style={{ color: 'var(--color-chat-preview-debug-text)' }}>调试信息</span>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-tertiary)' }}>当前模型:</span>
                      <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>{config.llm_id || '未选择'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-tertiary)' }}>温度设置:</span>
                      <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>{Number(config.llm_setting.temperature ?? 0).toFixed(2) || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-tertiary)' }}>知识库数量:</span>
                      <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>{config.kb_ids.length}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-tertiary)' }}>最大回复长度:</span>
                      <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>{config.llm_setting.max_tokens || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-tertiary)' }}>预览会话:</span>
                      <span style={{ color: previewConversationId ? 'var(--color-status-success-text)' : 'var(--color-text-tertiary)' }}>
                        {previewConversationId ? '已创建' : '待创建'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'var(--color-text-tertiary)' }}>消息数:</span>
                      <span style={{ color: 'var(--color-chat-preview-debug-text)' }}>{previewMessages.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* 提示信息 */}
                {!(searchParams.get('dialog_id') || searchParams.get('id')) && (
                  <div className="mt-2 p-2 rounded text-xs" style={{ 
                    backgroundColor: 'var(--color-components-alert-warning-bg)',
                    border: '1px solid var(--color-components-alert-warning-border)',
                    color: 'var(--color-components-alert-warning-text)'
                  }}>
                    💡 请先保存应用配置后才能进行预览调试
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background-body)' }}>
      {/* 顶部Header */}
      {renderHeader()}
      
      {/* 三栏布局 */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel 
            defaultSize={33}
            minSize={20}
            maxSize={50}
          >
            <div className="h-full" style={{ borderRight: '1px solid var(--color-border-default)' }}>
              {renderLeftPanel()}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-transparent hover:bg-[var(--color-border-accent)] transition-colors" />
          
          <ResizablePanel 
            defaultSize={34}
            minSize={30}
          >
            <div className="h-full" style={{ borderRight: '1px solid var(--color-border-default)' }}>
              {renderCenterPanel()}
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="w-px bg-transparent hover:bg-[var(--color-border-accent)] transition-colors" />
          
          <ResizablePanel 
            defaultSize={33}
            minSize={20}
            maxSize={50}
          >
            {renderRightPanel()}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* 编辑应用信息弹窗 */}
      <Dialog open={showEditModal} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>编辑应用信息</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>应用图标</span>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {tempConfig.icon ? (
                    <AvatarImage src={tempConfig.icon} alt="App Icon" />
                  ) : null}
                  <AvatarFallback 
                    style={{ 
                      background: 'var(--color-components-app-avatar-bg)',
                      border: '2px solid var(--color-components-app-avatar-border)'
                    }}
                  >
                    <LayoutGrid className="h-6 w-6" style={{ color: 'var(--color-text-tertiary)' }} />
                  </AvatarFallback>
                </Avatar>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/svg+xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleIconUpload(file)
                      }
                    }}
                  />
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      上传图标
                    </span>
                  </Button>
                </label>
                {tempConfig.icon && (
                  <Button 
                    variant="ghost"
                    onClick={() => setTempConfig(prev => ({ ...prev, icon: undefined }))}
                  >
                    <Trash2 className="h-4 w-4 mr-2" style={{ color: 'var(--color-state-error-text)' }} />
                    移除
                  </Button>
                )}
              </div>
              <span className="text-xs mt-2 block" style={{ color: 'var(--color-text-tertiary)' }}>
                支持 JPG、PNG、SVG 格式，文件大小不超过 2MB
              </span>
            </div>
            
            <div>
              <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>应用名称</span>
              <Input
                value={tempConfig.name}
                onChange={(e) => setTempConfig(prev => ({ ...prev, name: e.target.value }))}
                placeholder="输入应用名称"
                maxLength={50}
              />
              <span className="text-xs mt-1 block text-right" style={{ color: 'var(--color-text-tertiary)' }}>
                {tempConfig.name.length}/50
              </span>
            </div>
            
            <div>
              <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>应用描述</span>
              <Textarea
                value={tempConfig.description}
                onChange={(e) => setTempConfig(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述应用的功能和用途..."
                rows={4}
                maxLength={200}
              />
              <span className="text-xs mt-1 block text-right" style={{ color: 'var(--color-text-tertiary)' }}>
                {tempConfig.description.length}/200
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>取消</Button>
            <Button onClick={handleSaveEdit}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 添加知识库弹窗 */}
      <Dialog open={showKnowledgeModal} onOpenChange={(open) => !open && setShowKnowledgeModal(false)}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>添加知识库</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 搜索框 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                <Input
                  placeholder="搜索知识库名称"
                  value={knowledgeSearch}
                  onChange={(e) => setKnowledgeSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setKnowledgePage(1)
                      loadKnowledgeBases(knowledgeSearch, 1)
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => {
                setKnowledgePage(1)
                loadKnowledgeBases(knowledgeSearch, 1)
              }}>
                搜索
              </Button>
            </div>
            
            {/* 知识库列表 */}
            <Table<KnowledgeBase>
              columns={[
                {
                  key: 'name',
                  title: '名称',
                  dataIndex: 'name',
                  width: 180,
                  render: (name: string, record: KnowledgeBase) => (
                    <div className="flex items-center gap-2">
                      <KnowledgeBaseAvatar 
                        name={record.name} 
                        avatar={record.avatar} 
                        size="md"
                      />
                      <span className="truncate">{name}</span>
                    </div>
                  )
                },
                {
                  key: 'description',
                  title: '描述',
                  dataIndex: 'description',
                  ellipsis: true
                },
                {
                  key: 'embd_id',
                  title: '向量模型',
                  dataIndex: 'embd_id',
                  width: 160,
                  render: (embdId: string) => embdId ? (
                    <Badge variant="blue" className="text-xs truncate max-w-[140px]" title={embdId}>
                      {embdId}
                    </Badge>
                  ) : '-'
                },
                {
                  key: 'doc_num',
                  title: '文档个数',
                  dataIndex: 'doc_num',
                  width: 80,
                  render: (num: number) => num || 0
                },
                {
                  key: 'chunk_num',
                  title: '文本块个数',
                  dataIndex: 'chunk_num',
                  width: 90,
                  render: (num: number) => num || 0
                },
                {
                  key: 'action',
                  title: '操作',
                  width: 80,
                  render: (_: unknown, record: KnowledgeBase) => {
                    const isAdded = addedKnowledgeBases.has(record.id)
                    const isEmbdIncompatible = selectedEmbdId !== '' && record.embd_id !== selectedEmbdId
                    
                    if (isAdded) {
                      return (
                        <Button size="sm" disabled variant="outline">
                          已添加
                        </Button>
                      )
                    }
                    
                    if (isEmbdIncompatible) {
                      return (
                        <Button 
                          size="sm" 
                          disabled
                          variant="outline"
                          title={`向量模型不兼容：已选择 ${selectedEmbdId}，当前为 ${record.embd_id || '未知'}`}
                        >
                          不兼容
                        </Button>
                      )
                    }
                    
                    return (
                      <Button 
                        size="sm"
                        onClick={() => handleAddKnowledgeBase(record)}
                      >
                        添加
                      </Button>
                    )
                  }
                }
              ]}
              dataSource={availableKnowledgeBases}
              rowKey="id"
            />
            
            {/* 分页 */}
            {knowledgeTotal > 10 && (
              <div className="flex justify-end mt-4">
                <Pagination
                  current={knowledgePage}
                  total={knowledgeTotal}
                  pageSize={10}
                  onChange={(page) => {
                    setKnowledgePage(page)
                    loadKnowledgeBases(knowledgeSearch, page)
                  }}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 编辑变量弹窗 */}
      <Dialog open={showVariableModal} onOpenChange={(open) => {
        if (!open) {
          setShowVariableModal(false)
          setVariableForm({ key: '', optional: false })
        }
      }}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>编辑变量</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <span className="block mb-2 font-medium" style={{ color: 'var(--color-text-primary)' }}>变量名</span>
              <Input
                value={variableForm.key}
                onChange={(e) => setVariableForm(prev => ({ ...prev, key: e.target.value }))}
                placeholder="请输入变量名"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>是否可选</span>
                <Switch
                  checked={variableForm.optional}
                  onCheckedChange={(checked) => setVariableForm(prev => ({ ...prev, optional: checked }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowVariableModal(false)
              setVariableForm({ key: '', optional: false })
            }}>取消</Button>
            <Button onClick={handleAddVariable}>添加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}