import React, { useState, useEffect } from 'react'
import { Splitter, Collapse, Input, Select, Slider, Switch, Button, Space, Typography, Modal, Avatar, Upload, App, Tabs, Table, Tag } from 'antd'
import { 
  EditOutlined, 
  EyeOutlined, 
  BugOutlined, 
  SaveOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  AppstoreOutlined,
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  CaretRightOutlined
} from '@ant-design/icons'
import { 
  Bubble, 
  Sender
} from '@ant-design/x'
import type { BubbleProps } from '@ant-design/x'
import markdownit from 'markdown-it'
import type { UploadProps } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { llmAPI } from '@/api/llm'
import { knowledgeAPI } from '@/api/knowledge'
import { dialogAPI } from '@/api/dialog'
import type { LLMModel, KnowledgeBase } from '@/types/api'
import { ChatModelSelector } from '@/components/chat/ChatModelSelector'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import type { MyLLMProvider } from '@/stores/model'
import { formatTimestamp } from '@/lib/utils'
import { getResolvedTheme } from '@/themes'

const { TextArea } = Input
const { Title, Text } = Typography
// Using Panel with deprecation suppression until full migration to items prop
// @ts-ignore - Suppress deprecation warning for Panel usage  
const { Panel } = Collapse

// 初始化 markdown-it
const md = markdownit({ html: true, breaks: true, linkify: true })

// Markdown 渲染函数
const renderMarkdown: BubbleProps['messageRender'] = (content) => {
  if (!content || typeof content !== 'string') return content
  
  return (
    <div 
      dangerouslySetInnerHTML={{ __html: md.render(content) }} 
      className="prose prose-sm max-w-none"
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

interface GenerationPreset {
  temperature: number
  top_p: number
  presence_penalty: number
  frequency_penalty: number
  max_tokens_enabled: boolean
}


export const CreateAppPage: React.FC = () => {
  const { message } = App.useApp()
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
  
  // 生成多样性预设
  const generationPresets: Record<string, GenerationPreset> = {
    creative: {
      temperature: 0.80,
      top_p: 0.90,
      presence_penalty: 0.10,
      frequency_penalty: 0.10,
      max_tokens_enabled: false
    },
    precise: {
      temperature: 0.20,
      top_p: 0.75,
      presence_penalty: 0.50,
      frequency_penalty: 0.50,
      max_tokens_enabled: false
    },
    balanced: {
      temperature: 0.50,
      top_p: 0.85,
      presence_penalty: 0.20,
      frequency_penalty: 0.30,
      max_tokens_enabled: false
    }
  }
  
  const [currentPreset, setCurrentPreset] = useState<string>('custom')
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
        let matchedPreset = 'custom'
        
        // 检查是否匹配任何预设（仅比较启用的参数）
        for (const [presetName, preset] of Object.entries(generationPresets)) {
          let isMatch = true
          let hasEnabledParams = false
          
          // 温度参数比较
          if (loadedSetting.temperature_enabled && loadedSetting.temperature !== undefined) {
            hasEnabledParams = true
            if (Math.abs(loadedSetting.temperature - preset.temperature) >= 0.01) {
              isMatch = false
            }
          }
          
          // Top P参数比较
          if (loadedSetting.top_p_enabled && loadedSetting.top_p !== undefined) {
            hasEnabledParams = true
            if (Math.abs(loadedSetting.top_p - preset.top_p) >= 0.01) {
              isMatch = false
            }
          }
          
          // Presence Penalty参数比较
          if (loadedSetting.presence_penalty_enabled && loadedSetting.presence_penalty !== undefined) {
            hasEnabledParams = true
            if (Math.abs(loadedSetting.presence_penalty - preset.presence_penalty) >= 0.01) {
              isMatch = false
            }
          }
          
          // Frequency Penalty参数比较
          if (loadedSetting.frequency_penalty_enabled && loadedSetting.frequency_penalty !== undefined) {
            hasEnabledParams = true
            if (Math.abs(loadedSetting.frequency_penalty - preset.frequency_penalty) >= 0.01) {
              isMatch = false
            }
          }
          
          // 只有当有启用的参数且全部匹配时才认为是该预设
          if (isMatch && hasEnabledParams) {
            matchedPreset = presetName
            break
          }
        }
        
        setCurrentPreset(matchedPreset)
        
        // 同步更新已添加的知识库
        if (data.kb_names && Array.isArray(data.kb_names) && data.kb_ids) {
          const kbs: KnowledgeBase[] = data.kb_names.map((name: string, index: number) => ({
            id: data.kb_ids![index],
            tenant_id: data.tenant_id || '',
            name: name,
            description: '',
            permission: 'me',
            language: data.language || 'Chinese',
            embd_id: '',
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
          }))
          setKnowledgeBases(kbs)
          setAddedKnowledgeBases(new Set(data.kb_ids))
        }
      }
    } catch (error) {
      console.error('Failed to load dialog config:', error)
      message.error('加载对话配置失败')
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
        let allRerankModels: LLMModel[] = []
        
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
      message.error('加载模型列表失败')
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
      message.error('加载知识库列表失败')
    }
  }

  // 预览对话状态
  const [previewMessages, setPreviewMessages] = useState<string[]>([])
  const [inputValue, setInputValue] = useState('')
  
  // 初始化开场白消息
  useEffect(() => {
    if (config.prompt_config.prologue) {
      setPreviewMessages([config.prompt_config.prologue])
    }
  }, [config.prompt_config.prologue])

  const handleConfigChange = (key: keyof AppConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }
  
  // 处理生成预设变化
  const handlePresetChange = (preset: string) => {
    if (preset in generationPresets) {
      const presetConfig = generationPresets[preset]
      setConfig(prev => ({
        ...prev,
        llm_setting: {
          ...prev.llm_setting,
          // 更新参数值
          temperature: presetConfig.temperature,
          top_p: presetConfig.top_p,
          presence_penalty: presetConfig.presence_penalty,
          frequency_penalty: presetConfig.frequency_penalty,
          // 启用相关参数（预设模式下这些参数都应该启用）
          temperature_enabled: true,
          top_p_enabled: true,
          presence_penalty_enabled: true,
          frequency_penalty_enabled: true,
          // max_tokens 根据预设配置决定
          max_tokens_enabled: presetConfig.max_tokens_enabled
        }
      }))
      setCurrentPreset(preset)
    } else {
      setCurrentPreset('custom')
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
    
    // 检查是否匹配预设（比较参数值和启用状态）
    let matchedPreset = 'custom'
    
    for (const [presetName, preset] of Object.entries(generationPresets)) {
      let isMatch = true
      
      // 对于预设，核心参数（temperature, top_p, presence_penalty, frequency_penalty）应该都启用
      const shouldBeEnabled = ['temperature', 'top_p', 'presence_penalty', 'frequency_penalty']
      
      for (const param of shouldBeEnabled) {
        const enabledKey = `${param}_enabled` as keyof typeof newSetting
        const valueKey = param as keyof typeof newSetting
        
        // 检查参数是否启用
        if (!newSetting[enabledKey]) {
          isMatch = false
          break
        }
        
        // 检查参数值是否匹配
        const currentValue = newSetting[valueKey] as number
        const presetValue = preset[param as keyof typeof preset] as number
        if (Math.abs(currentValue - presetValue) >= 0.01) {
          isMatch = false
          break
        }
      }
      
      // 检查 max_tokens_enabled 是否匹配预设
      if (isMatch && newSetting.max_tokens_enabled !== preset.max_tokens_enabled) {
        isMatch = false
      }
      
      if (isMatch) {
        matchedPreset = presetName
        break
      }
    }
    
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
      message.error('变量名不能为空')
      return
    }
    
    const exists = config.prompt_config.parameters.some(p => p.key === variableForm.key)
    if (exists) {
      message.error('变量名已存在')
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
        message.error('应用名称不能为空')
        setSaving(false)
        return
      }
      
      if (!config.llm_id) {
        message.error('请选择模型')
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
      message.success('保存成功')
      
      // 如果是新创建的对话，更新URL以包含新的dialog_id
      if (!dialogId && result && result.id) {
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.set('dialog_id', result.id)
        window.history.replaceState({}, '', newUrl.toString())
      }
    } catch (error) {
      console.error('Failed to save config:', error)
      message.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleIconUpload: UploadProps['beforeUpload'] = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/svg+xml'
    if (!isJpgOrPng) {
      message.error('只能上传 JPG/PNG/SVG 格式的图片!')
      return false
    }
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      message.error('图片大小不能超过 2MB!')
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
          type="text" 
          icon={<ArrowLeftOutlined style={{ color: 'var(--color-components-icon-button-text)' }} />}
          onClick={() => navigate('/studio')}
          className="flex items-center justify-center"
          style={{ color: 'var(--color-components-icon-button-text)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'
            const icon = e.currentTarget.querySelector('.anticon')
            if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text-hover)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-components-icon-button-text)'
            const icon = e.currentTarget.querySelector('.anticon')
            if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text)'
          }}
        />
        
        <div className="flex items-center gap-3">
          <Avatar 
            size={40}
            src={config.icon || undefined}
            icon={!config.icon && <AppstoreOutlined />}
            style={config.icon ? 
              { backgroundColor: 'transparent' } : 
              { 
                background: 'var(--color-components-app-avatar-bg)',
                border: '1px solid var(--color-components-app-avatar-border)'
              }
            }
          />
          <div className="flex items-center gap-2">
            <div>
              <Title level={5} className="m-0" style={{ color: 'var(--color-text-primary)' }}>
                {config.name}
              </Title>
              <Text className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {config.description}
              </Text>
            </div>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={handleEditApp}
              style={{ color: 'var(--color-components-icon-button-text)' }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-components-icon-button-text)'}
            />
          </div>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <Space>
        <Button 
          icon={<SaveOutlined />} 
          onClick={handleSave}
          loading={saving}
          disabled={saving}
        >
          {saving ? '保存中...' : '保存'}
        </Button>
        <Button type="primary" icon={<PlayCircleOutlined />}>
          发布
        </Button>
      </Space>
    </div>
  )

  const renderLeftPanel = () => (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-components-panel-content-bg)' }}>
      {leftCollapsed ? (
        <div className="flex flex-col items-center p-4 h-full justify-center">
          <Button 
            type="text" 
            icon={<EditOutlined style={{ color: 'var(--color-components-icon-button-text)' }} />} 
            onClick={() => setLeftCollapsed(false)}
            className="mb-4"
            style={{ color: 'var(--color-components-icon-button-text)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'
              const icon = e.currentTarget.querySelector('.anticon')
              if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-components-icon-button-text)'
              const icon = e.currentTarget.querySelector('.anticon')
              if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text)'
            }}
          />
          <Text className="text-xs transform -rotate-90 whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
            人设与回复逻辑
          </Text>
        </div>
      ) : (
        <>
          <div className="p-4" style={{ 
            backgroundColor: 'var(--color-components-panel-header-bg)',
            borderBottom: '1px solid var(--color-border-default)'
          }}>
            <div className="flex items-center justify-between">
              <Title level={5} className="m-0" style={{ color: 'var(--color-components-panel-header-text)' }}>人设与回复逻辑</Title>
              <Button 
                type="text" 
                size="small"
                onClick={() => setLeftCollapsed(true)}
                style={{ color: 'var(--color-components-icon-button-text)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-components-icon-button-text)'}
              >
                ←
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
        <Title level={5} className="m-0" style={{ color: 'var(--color-components-panel-header-text)' }}>应用配置</Title>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        <Collapse 
          defaultActiveKey={['model']} 
          ghost
          size="large"
          expandIcon={({ isActive }) => (
            <CaretRightOutlined
              rotate={isActive ? 90 : 0}
              style={{ color: 'var(--color-text-secondary)' }}
            />
          )}
          items={[
            {
              key: 'model',
              label: <span style={{ color: 'var(--color-text-primary)' }}>模型</span>,
              children: (
                <Space direction="vertical" className="w-full" size="large">
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
                    <Text strong className="block mb-3" style={{ color: 'var(--color-text-primary)' }}>生成多样性</Text>
                    <Tabs
                      activeKey={currentPreset}
                      onChange={handlePresetChange}
                      style={{
                        '--color-text-primary': 'var(--color-text-primary)',
                        '--color-text-secondary': 'var(--color-text-secondary)',
                      } as React.CSSProperties}
                      items={[
                        {
                          key: 'creative',
                          label: '即兴创作'
                        },
                        {
                          key: 'precise',
                          label: '精确'
                        },
                        {
                          key: 'balanced',
                          label: '平衡'
                        },
                        {
                          key: 'custom',
                          label: '自定义'
                        }
                      ]}
                    />
                    
                    <div className="mt-4 space-y-4">
                      {/* 温度 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Text strong style={{ color: 'var(--color-text-primary)' }}>温度: {Number(config.llm_setting.temperature ?? 0).toFixed(2)}</Text>
                          <Switch
                            checked={config.llm_setting.temperature_enabled}
                            onChange={(checked) => handleLLMSettingChange('temperature_enabled', checked)}
                          />
                        </div>
                        {config.llm_setting.temperature_enabled && (
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={config.llm_setting.temperature}
                            onChange={(value) => handleLLMSettingChange('temperature', value)}
                          />
                        )}
                      </div>
                      
                      {/* Top P */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Text strong style={{ color: 'var(--color-text-primary)' }}>Top P: {Number(config.llm_setting.top_p ?? 0).toFixed(2)}</Text>
                          <Switch
                            checked={config.llm_setting.top_p_enabled}
                            onChange={(checked) => handleLLMSettingChange('top_p_enabled', checked)}
                          />
                        </div>
                        {config.llm_setting.top_p_enabled && (
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={config.llm_setting.top_p}
                            onChange={(value) => handleLLMSettingChange('top_p', value)}
                          />
                        )}
                      </div>
                      
                      {/* 存在处罚 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Text strong style={{ color: 'var(--color-text-primary)' }}>存在处罚: {Number(config.llm_setting.presence_penalty ?? 0).toFixed(2)}</Text>
                          <Switch
                            checked={config.llm_setting.presence_penalty_enabled}
                            onChange={(checked) => handleLLMSettingChange('presence_penalty_enabled', checked)}
                          />
                        </div>
                        {config.llm_setting.presence_penalty_enabled && (
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={config.llm_setting.presence_penalty}
                            onChange={(value) => handleLLMSettingChange('presence_penalty', value)}
                          />
                        )}
                      </div>
                      
                      {/* 频率惩罚 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Text strong style={{ color: 'var(--color-text-primary)' }}>频率惩罚: {Number(config.llm_setting.frequency_penalty ?? 0).toFixed(2)}</Text>
                          <Switch
                            checked={config.llm_setting.frequency_penalty_enabled}
                            onChange={(checked) => handleLLMSettingChange('frequency_penalty_enabled', checked)}
                          />
                        </div>
                        {config.llm_setting.frequency_penalty_enabled && (
                          <Slider
                            min={0}
                            max={1}
                            step={0.01}
                            value={config.llm_setting.frequency_penalty}
                            onChange={(value) => handleLLMSettingChange('frequency_penalty', value)}
                          />
                        )}
                      </div>
                      
                      {/* 最大回复长度 */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Text strong style={{ color: 'var(--color-text-primary)' }}>最大回复长度: {config.llm_setting.max_tokens}</Text>
                          <Switch
                            checked={config.llm_setting.max_tokens_enabled}
                            onChange={(checked) => handleLLMSettingChange('max_tokens_enabled', checked)}
                          />
                        </div>
                        {config.llm_setting.max_tokens_enabled && (
                          <Input
                            type="number"
                            min={1}
                            value={config.llm_setting.max_tokens}
                            onChange={(e) => handleLLMSettingChange('max_tokens', parseInt(e.target.value) || 1)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </Space>
              )
            },
            {
              key: 'knowledge',
              label: <span style={{ color: 'var(--color-text-primary)' }}>知识库</span>,
              extra: (
                <Button 
                  type="text" 
                  icon={<PlusOutlined style={{ color: 'var(--color-components-icon-button-text)' }} />} 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowKnowledgeModal(true)
                    loadKnowledgeBases()
                  }}
                  style={{ color: 'var(--color-components-icon-button-text)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'
                    const icon = e.currentTarget.querySelector('.anticon')
                    if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-components-icon-button-text)'
                    const icon = e.currentTarget.querySelector('.anticon')
                    if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text)'
                  }}
                />
              ),
              children: (
                <Space direction="vertical" className="w-full" size="middle">
                  {/* 已添加的知识库 */}
                  <div>
                    <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>已添加的知识库</Text>
                    {knowledgeBases.length === 0 ? (
                      <div className="text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
                        暂无添加的知识库
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {knowledgeBases.map(kb => (
                          <div key={kb.id} className="flex items-center justify-between p-2 border rounded">
                            <div>
                              <div className="font-medium">{kb.name}</div>
                              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{kb.description}</div>
                            </div>
                            <Button 
                              type="text" 
                              danger 
                              icon={<DeleteOutlined />} 
                              size="small"
                              onClick={() => handleRemoveKnowledgeBase(kb.id)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* 知识库设置 */}
                  <Collapse 
                    ghost 
                    size="small"
                    expandIcon={({ isActive }) => (
                      <CaretRightOutlined
                        rotate={isActive ? 90 : 0}
                        style={{ color: 'var(--color-text-secondary)' }}
                      />
                    )}
                    items={[
                      {
                        key: 'kb-settings',
                        label: <span style={{ color: 'var(--color-text-primary)' }}>知识库设置</span>,
                        children: (
                  <Space direction="vertical" className="w-full" size="middle">
                    {/* 搜索策略 */}
                    <div>
                      <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>搜索策略</Text>
                      <Select
                        value={config.search_mode?.type ?? 'dense'}
                        onChange={(value) => {
                          const searchMode = value === 'hybrid' 
                            ? { type: 'hybrid' as const, weight_dense: config.search_mode?.weight_dense ?? 0.7, weight_sparse: config.search_mode?.weight_sparse ?? 0.3 }
                            : value === 'dense'
                            ? { type: 'dense' as const }
                            : { type: 'sparse' as const }
                          handleConfigChange('search_mode', searchMode)
                        }}
                        className="w-full"
                        options={[
                          { label: '混合', value: 'hybrid' },
                          { label: '语义', value: 'dense' },
                          { label: '全文', value: 'sparse' }
                        ]}
                      />
                      
                      {/* 混合检索权重设置 */}
                      {config.search_mode?.type === 'hybrid' && (
                        <div className="mt-3 space-y-3 p-3 rounded" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Text className="text-sm">向量权重</Text>
                              <Text className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{((config.search_mode?.weight_dense ?? 0.7)).toFixed(2)}</Text>
                            </div>
                            <Slider
                              min={0}
                              max={1}
                              step={0.01}
                              value={config.search_mode?.weight_dense ?? 0.7}
                              onChange={(value) => {
                                const denseWeight = Number(value.toFixed(2))
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
                              <Text className="text-sm">全文权重 (自动计算)</Text>
                              <Text className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>{((config.search_mode?.weight_sparse ?? 0.3)).toFixed(2)}</Text>
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
                      <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>相似度阈值: {Number(config.similarity_threshold ?? 0).toFixed(2)}</Text>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={config.similarity_threshold}
                        onChange={(value) => handleConfigChange('similarity_threshold', value)}
                      />
                    </div>
                    
                    {/* 关键字相似度权重 */}
                    <div>
                      <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>关键字相似度权重: {Number(config.vector_similarity_weight ?? 0).toFixed(2)}</Text>
                      <Slider
                        min={0}
                        max={1}
                        step={0.01}
                        value={config.vector_similarity_weight}
                        onChange={(value) => handleConfigChange('vector_similarity_weight', value)}
                      />
                    </div>
                    
                    {/* Top N */}
                    <div>
                      <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>Top N: {config.top_n}</Text>
                      <Input
                        type="number"
                        min={1}
                        value={config.top_n}
                        onChange={(e) => handleConfigChange('top_n', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    
                    {/* 知识库空回复 */}
                    <div>
                      <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>知识库空回复</Text>
                      <Input.TextArea
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
                      <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>向量召回的个数 (Top K): {config.top_k}</Text>
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
                        <Text strong style={{ color: 'var(--color-text-primary)' }}>显示来源</Text>
                        <Switch
                          checked={config.do_refer === '1'}
                          onChange={(checked) => handleConfigChange('do_refer', checked ? '1' : '0')}
                        />
                      </div>
                    </div>
                  </Space>
                )
              }
            ]}
          />
                </Space>
              )
            },
            {
              key: 'memory',
              label: <span style={{ color: 'var(--color-text-primary)' }}>变量</span>,
              extra: (
                <Button 
                  type="text" 
                  icon={<PlusOutlined style={{ color: 'var(--color-components-icon-button-text)' }} />} 
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowVariableModal(true)
                  }}
                  style={{ color: 'var(--color-components-icon-button-text)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'
                    const icon = e.currentTarget.querySelector('.anticon')
                    if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-components-icon-button-text)'
                    const icon = e.currentTarget.querySelector('.anticon')
                    if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text)'
                  }}
                />
              ),
              children: (
                <div>
                  {config.prompt_config.parameters.length === 0 ? (
                    <div className="text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
                      暂无变量
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {config.prompt_config.parameters.map(param => (
                        <div key={param.key} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <span className="font-medium">{param.key}</span>
                            <Tag className="ml-2" color={param.optional ? 'orange' : 'blue'}>
                              {param.optional ? '可选' : '必选'}
                            </Tag>
                          </div>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            size="small"
                            onClick={() => handleRemoveVariable(param.key)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'experience',
              label: <span style={{ color: 'var(--color-text-primary)' }}>对话体验</span>,
              children: (
                <Space direction="vertical" className="w-full" size="middle">
                  {/* 开场白 */}
                  <div>
                    <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>开场白</Text>
                    <Input.TextArea
                      rows={3}
                      value={config.prompt_config.prologue}
                      onChange={(e) => handleConfigChange('prompt_config', {
                        ...config.prompt_config,
                        prologue: e.target.value
                      })}
                      placeholder="设置对话开始时的问候语"
                    />
                  </div>
                </Space>
              )
            }
          ]}
        />
      </div>
    </div>
  )

  const renderRightPanel = () => {
    // 转换消息数据为 Bubble.List 需要的格式
    const bubbleItems = previewMessages.map((msg, index) => {
      // 偶数索引为AI回复，奇数为用户消息
      const isUser = index % 2 === 1
      
      return {
        key: `preview-message-${index}`,
        role: isUser ? 'user' : 'assistant',
        content: (
          <div className="bubble-content leading-relaxed">
            {msg && msg.trim() ? (
              renderMarkdown(msg)
            ) : (
              <div className="italic" style={{ color: 'var(--color-text-muted)' }}>正在生成回复...</div>
            )}
          </div>
        ),
        placement: (isUser ? 'end' : 'start') as 'start' | 'end',
        avatar: isUser
          ? (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                U
              </div>
            )
          : config.icon 
            ? (
                <img 
                  src={config.icon} 
                  alt="AI" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              )
            : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <AppstoreOutlined className="text-gray-500" />
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
        messageRender: !isUser ? renderMarkdown : undefined,
      }
    })


    return (
      <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-components-panel-content-bg)' }}>
        {rightCollapsed ? (
          <div className="flex flex-col items-center p-4 h-full justify-center">
            <Button 
              type="text" 
              icon={<EyeOutlined style={{ color: 'var(--color-components-icon-button-text)' }} />} 
              onClick={() => setRightCollapsed(false)}
              className="mb-2"
              style={{ color: 'var(--color-components-icon-button-text)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'
                const icon = e.currentTarget.querySelector('.anticon')
                if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-components-icon-button-text)'
                const icon = e.currentTarget.querySelector('.anticon')
                if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text)'
              }}
            />
            <Button 
              type="text" 
              icon={<BugOutlined style={{ color: 'var(--color-components-icon-button-text)' }} />} 
              className="mb-4"
              style={{ color: 'var(--color-components-icon-button-text)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'
                const icon = e.currentTarget.querySelector('.anticon')
                if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-components-icon-button-text)'
                const icon = e.currentTarget.querySelector('.anticon')
                if (icon) (icon as HTMLElement).style.color = 'var(--color-components-icon-button-text)'
              }}
            />
            <Text className="text-xs transform -rotate-90 whitespace-nowrap" style={{ color: 'var(--color-text-tertiary)' }}>
              预览调试
            </Text>
          </div>
        ) : (
          <>
            <div className="p-4" style={{ 
              backgroundColor: 'var(--color-components-panel-header-bg)',
              borderBottom: '1px solid var(--color-border-default)'
            }}>
              <div className="flex items-center justify-between">
                <Title level={5} className="m-0" style={{ color: 'var(--color-components-panel-header-text)' }}>预览与调试</Title>
                <Button 
                  type="text" 
                  size="small"
                  onClick={() => setRightCollapsed(true)}
                  style={{ color: 'var(--color-components-icon-button-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-components-icon-button-text-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-components-icon-button-text)'}
                >
                  →
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              {/* 对话预览区域 */}
              <div className="flex-1 p-4 overflow-auto">
                {previewMessages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" 
                         style={{ background: 'var(--color-components-app-avatar-bg)' }}>
                      <span className="text-white text-sm font-bold">AI</span>
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
                    onSubmit={(message) => {
                      if (message) {
                        setPreviewMessages(prev => [...prev, message])
                        setInputValue('')
                        
                        // 模拟AI回复
                        setTimeout(() => {
                          const aiResponse = '根据当前配置，这是AI的回复。'
                          setPreviewMessages(prev => [...prev, aiResponse])
                        }, 1000)
                      }
                    }}
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
                </div>
                
                {/* 调试信息 */}
                <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-chat-preview-debug-bg)' }}>
                  <Text strong className="block mb-2 text-xs" style={{ color: 'var(--color-chat-preview-debug-text)' }}>调试信息</Text>
                  <Space direction="vertical" className="w-full" size="small">
                    <div className="flex justify-between text-xs">
                      <Text className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>当前模型:</Text>
                      <Text className="text-xs" style={{ color: 'var(--color-chat-preview-debug-text)' }}>{config.llm_id || '未选择'}</Text>
                    </div>
                    <div className="flex justify-between text-xs">
                      <Text className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>温度设置:</Text>
                      <Text className="text-xs" style={{ color: 'var(--color-chat-preview-debug-text)' }}>{Number(config.llm_setting.temperature ?? 0).toFixed(2) || 'N/A'}</Text>
                    </div>
                    <div className="flex justify-between text-xs">
                      <Text className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>知识库数量:</Text>
                      <Text className="text-xs" style={{ color: 'var(--color-chat-preview-debug-text)' }}>{config.kb_ids.length}</Text>
                    </div>
                    <div className="flex justify-between text-xs">
                      <Text className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>最大回复长度:</Text>
                      <Text className="text-xs" style={{ color: 'var(--color-chat-preview-debug-text)' }}>{config.llm_setting.max_tokens || 'N/A'}</Text>
                    </div>
                  </Space>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部Header */}
      {renderHeader()}
      
      {/* 三栏布局 */}
      <div className="flex-1">
        <Splitter style={{ height: '100%' }}>
          <Splitter.Panel 
            defaultSize="33.33%"
            min="20%"
            max="50%"
            className="border-r"
          >
            {renderLeftPanel()}
          </Splitter.Panel>
          
          <Splitter.Panel 
            defaultSize="33.33%"
            min="30%"
            className="border-r"
          >
            {renderCenterPanel()}
          </Splitter.Panel>
          
          <Splitter.Panel 
            defaultSize="33.33%"
            min="20%"
            max="50%"
          >
            {renderRightPanel()}
          </Splitter.Panel>
        </Splitter>
      </div>

      {/* 编辑应用信息弹窗 */}
      <Modal
        title={<span style={{ color: 'var(--color-text-primary)' }}>编辑应用信息</span>}
        open={showEditModal}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        okText="保存"
        cancelText="取消"
        width={500}
        styles={{
          content: {
            backgroundColor: 'var(--color-components-modal-bg)',
            color: 'var(--color-text-primary)'
          },
          header: {
            backgroundColor: 'var(--color-components-modal-bg)',
            borderBottom: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)'
          },
          body: {
            backgroundColor: 'var(--color-components-modal-bg)'
          }
        }}
      >
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>应用图标</Text>
            <div className="flex items-center gap-4">
              <Avatar 
                size={64}
                src={tempConfig.icon}
                icon={!tempConfig.icon && <AppstoreOutlined />}
                style={tempConfig.icon ? 
                  { backgroundColor: 'transparent' } : 
                  { 
                    background: 'var(--color-components-app-avatar-bg)',
                    border: '2px solid var(--color-components-app-avatar-border)'
                  }
                }
              />
              <Upload
                beforeUpload={handleIconUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<PlusOutlined style={{ color: 'var(--color-components-icon-button-text)' }} />}>
                  上传图标
                </Button>
              </Upload>
              {tempConfig.icon && (
                <Button 
                  onClick={() => setTempConfig(prev => ({ ...prev, icon: undefined }))}
                  type="text"
                  danger
                  style={{ color: 'var(--color-state-error-text)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-state-error-text-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-state-error-text)'}
                >
                  移除
                </Button>
              )}
            </div>
            <Text className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              支持 JPG、PNG、SVG 格式，文件大小不超过 2MB
            </Text>
          </div>
          
          <div>
            <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>应用名称</Text>
            <Input
              value={tempConfig.name}
              onChange={(e) => setTempConfig(prev => ({ ...prev, name: e.target.value }))}
              placeholder="输入应用名称"
              maxLength={50}
              showCount
            />
          </div>
          
          <div>
            <Text strong className="block mb-2">应用描述</Text>
            <TextArea
              value={tempConfig.description}
              onChange={(e) => setTempConfig(prev => ({ ...prev, description: e.target.value }))}
              placeholder="描述应用的功能和用途..."
              rows={4}
              maxLength={200}
              showCount
            />
          </div>
        </Space>
      </Modal>
      
      {/* 添加知识库弹窗 */}
      <Modal
        title={<span style={{ color: 'var(--color-text-primary)' }}>添加知识库</span>}
        open={showKnowledgeModal}
        onCancel={() => setShowKnowledgeModal(false)}
        footer={null}
        width={800}
        styles={{
          content: {
            backgroundColor: 'var(--color-components-modal-bg)',
            color: 'var(--color-text-primary)'
          },
          header: {
            backgroundColor: 'var(--color-components-modal-bg)',
            borderBottom: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)'
          },
          body: {
            backgroundColor: 'var(--color-components-modal-bg)'
          }
        }}
      >
        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="flex gap-2">
            <Input
              placeholder="搜索知识库名称"
              value={knowledgeSearch}
              onChange={(e) => setKnowledgeSearch(e.target.value)}
              onPressEnter={() => {
                setKnowledgePage(1) // 重置到第1页
                loadKnowledgeBases(knowledgeSearch, 1)
              }}
              prefix={<SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />}
            />
            <Button onClick={() => {
              setKnowledgePage(1) // 重置到第1页
              loadKnowledgeBases(knowledgeSearch, 1)
            }}>
              搜索
            </Button>
          </div>
          
          {/* 知识库列表 */}
          <Table
            dataSource={availableKnowledgeBases}
            rowKey="id"
            pagination={{
              current: knowledgePage,
              total: knowledgeTotal,
              pageSize: 10,
              onChange: (page) => {
                setKnowledgePage(page)
                loadKnowledgeBases(knowledgeSearch, page)
              }
            }}
            columns={[
              {
                title: '名称',
                dataIndex: 'name',
                key: 'name',
                width: 150
              },
              {
                title: '描述',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true
              },
              {
                title: '创建时间',
                dataIndex: 'create_time',
                key: 'create_time',
                width: 120,
                render: (timestamp: number) => {
                  if (!timestamp) return '-'
                  try {
                    return formatTimestamp(timestamp)
                  } catch {
                    return '-'
                  }
                }
              },
              {
                title: '文档个数',
                dataIndex: 'doc_num',
                key: 'doc_num',
                width: 80,
                render: (num: number) => num || 0
              },
              {
                title: '文本块个数',
                dataIndex: 'chunk_num',
                key: 'chunk_num',
                width: 90,
                render: (num: number) => num || 0
              },
              {
                title: '操作',
                key: 'action',
                width: 80,
                render: (_, record) => (
                  addedKnowledgeBases.has(record.id) ? (
                    <Button size="small" disabled>
                      已添加
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      size="small"
                      onClick={() => handleAddKnowledgeBase(record)}
                    >
                      添加
                    </Button>
                  )
                )
              }
            ]}
          />
        </div>
      </Modal>
      
      {/* 编辑变量弹窗 */}
      <Modal
        title={<span style={{ color: 'var(--color-text-primary)' }}>编辑变量</span>}
        open={showVariableModal}
        onOk={handleAddVariable}
        onCancel={() => {
          setShowVariableModal(false)
          setVariableForm({ key: '', optional: false })
        }}
        okText="添加"
        cancelText="取消"
        width={400}
        styles={{
          content: {
            backgroundColor: 'var(--color-components-modal-bg)',
            color: 'var(--color-text-primary)'
          },
          header: {
            backgroundColor: 'var(--color-components-modal-bg)',
            borderBottom: '1px solid var(--color-border-default)',
            color: 'var(--color-text-primary)'
          },
          body: {
            backgroundColor: 'var(--color-components-modal-bg)'
          }
        }}
      >
        <Space direction="vertical" className="w-full" size="middle">
          <div>
            <Text strong className="block mb-2" style={{ color: 'var(--color-text-primary)' }}>变量名</Text>
            <Input
              value={variableForm.key}
              onChange={(e) => setVariableForm(prev => ({ ...prev, key: e.target.value }))}
              placeholder="请输入变量名"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between">
              <Text strong style={{ color: 'var(--color-text-primary)' }}>是否可选</Text>
              <Switch
                checked={variableForm.optional}
                onChange={(checked) => setVariableForm(prev => ({ ...prev, optional: checked }))}
              />
            </div>
          </div>
        </Space>
      </Modal>
    </div>
  )
}