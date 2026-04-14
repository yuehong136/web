import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { dialogAPI } from '@/api/dialog'
import { knowledgeAPI } from '@/api/knowledge'
import { llmAPI } from '@/api/llm'
import {
  GenerationPresetType,
  detectMatchingPresetSnake,
  generationPresetConfigMapSnake,
  getDefaultEnabledFieldsSnake,
} from '@/constants/llm'
import { toast } from '@/lib/toast'
import type { MyLLMProvider } from '@/stores/model'
import type { KnowledgeBase, LLMModel } from '@/types/api'
import { ResizablePanel } from '@/components/ui/resizable'
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_VARIABLE_FORM,
  KNOWLEDGE_PAGE_SIZE,
  createInitialConfig,
  createTempConfig,
} from '../constants'
import type { AppConfig, TempAppConfig, VariableForm } from '../types'
import { buildKnowledgeFallback, mapLLMProviders, normalizeDialogConfig, type DialogDetailResponse, type ProviderResponseEntry } from '../data'
import { useCreateAppPreview } from './use-create-app-preview'
import { useCurrentTheme } from './use-current-theme'

export const useCreateAppPage = () => {
  const [searchParams] = useSearchParams()
  const initialDialogId = searchParams.get('dialog_id') || searchParams.get('id')

  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const leftPanelRef = useRef<React.ElementRef<typeof ResizablePanel>>(null)
  const rightPanelRef = useRef<React.ElementRef<typeof ResizablePanel>>(null)
  const iconInputRef = useRef<HTMLInputElement>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false)
  const [showVariableModal, setShowVariableModal] = useState(false)

  const currentTheme = useCurrentTheme()
  const [currentDialogId, setCurrentDialogId] = useState(initialDialogId)
  const [config, setConfig] = useState<AppConfig>(() => createInitialConfig({
    name: searchParams.get('name'),
    description: searchParams.get('description'),
    icon: searchParams.get('icon'),
  }))

  const [tempConfig, setTempConfig] = useState<TempAppConfig>(() => createTempConfig(createInitialConfig({
    name: searchParams.get('name'),
    description: searchParams.get('description'),
    icon: searchParams.get('icon'),
  })))

  const [chatModels, setChatModels] = useState<MyLLMProvider>({})
  const [rerankModels, setRerankModels] = useState<LLMModel[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState<string | undefined>()
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [availableKnowledgeBases, setAvailableKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [knowledgeSearch, setKnowledgeSearch] = useState('')
  const [knowledgePage, setKnowledgePage] = useState(1)
  const [knowledgeTotal, setKnowledgeTotal] = useState(0)
  const [addedKnowledgeBases, setAddedKnowledgeBases] = useState<Set<string>>(new Set())

  const [currentPreset, setCurrentPreset] = useState<GenerationPresetType>(GenerationPresetType.Custom)
  const [modelSectionExpanded, setModelSectionExpanded] = useState(true)
  const [knowledgeSectionExpanded, setKnowledgeSectionExpanded] = useState(true)
  const [advancedSectionExpanded, setAdvancedSectionExpanded] = useState(true)
  const [variableSectionExpanded, setVariableSectionExpanded] = useState(true)
  const [experienceSectionExpanded, setExperienceSectionExpanded] = useState(true)
  const [variableForm, setVariableForm] = useState<VariableForm>(DEFAULT_VARIABLE_FORM)

  const [saving, setSaving] = useState(false)

  const selectedEmbdId = useMemo(() => {
    if (!knowledgeBases.length) {
      return ''
    }

    return knowledgeBases[0]?.embd_id || ''
  }, [knowledgeBases])

  const loadDialogConfig = useCallback(async (dialogId: string) => {
    try {
      const data = await dialogAPI.getDetail(dialogId) as DialogDetailResponse

      if (!data) {
        return
      }

      const { config: newConfig, matchedPreset } = normalizeDialogConfig(data)
      setConfig(newConfig)
      setTempConfig(createTempConfig(newConfig))
      setCurrentPreset(matchedPreset)

      if (data.kb_ids && Array.isArray(data.kb_ids) && data.kb_ids.length > 0) {
        const kbPromises = data.kb_ids.map(async (kbId: string, index: number) => {
          try {
            return await knowledgeAPI.knowledgeBase.get(kbId)
          } catch (error) {
            console.error(`Failed to fetch knowledge base ${kbId}:`, error)
            return buildKnowledgeFallback(data, kbId, index)
          }
        })

        const kbs = await Promise.all(kbPromises)
        setKnowledgeBases(kbs)
        setAddedKnowledgeBases(new Set(data.kb_ids))
      } else {
        setKnowledgeBases([])
        setAddedKnowledgeBases(new Set())
      }
    } catch (error) {
      console.error('Failed to load dialog config:', error)
      toast.error('加载对话配置失败')
    }
  }, [])

  const loadModels = useCallback(async () => {
    try {
      setModelsLoading(true)
      setModelsError(undefined)

      const response = await llmAPI.list()
      if (response && typeof response === 'object') {
        const { chatModels: chatModelData, rerankModels: allRerankModels } = mapLLMProviders(
          response as Record<string, ProviderResponseEntry>,
        )
        setChatModels(chatModelData)
        setRerankModels(allRerankModels)
        setConfig((previousConfig) => {
          if (previousConfig.llm_id || Object.keys(chatModelData).length === 0) {
            return previousConfig
          }

          const firstProvider = Object.values(chatModelData)[0]
          if (!firstProvider?.llm?.length) {
            return previousConfig
          }

          return {
            ...previousConfig,
            llm_id: firstProvider.llm[0].name,
          }
        })
      }
    } catch (error) {
      console.error('Failed to load models:', error)
      setModelsError('加载模型列表失败')
      toast.error('加载模型列表失败')
    } finally {
      setModelsLoading(false)
    }
  }, [])

  const loadKnowledgeBases = useCallback(async (search = '', page = 1) => {
    try {
      const response = await knowledgeAPI.knowledgeBase.list({
        keywords: search,
        page,
        page_size: KNOWLEDGE_PAGE_SIZE,
        orderby: 'create_time',
        desc: true,
      })

      if (response.kbs) {
        setAvailableKnowledgeBases(response.kbs)
        setKnowledgeTotal(response.total || 0)
      }
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      toast.error('加载知识库列表失败')
    }
  }, [])

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([loadModels(), loadKnowledgeBases()])
      if (currentDialogId) {
        await loadDialogConfig(currentDialogId)
      }
    }

    void loadInitialData()
  }, [currentDialogId, loadDialogConfig, loadKnowledgeBases, loadModels])

  const {
    previewMessages,
    inputValue,
    setInputValue,
    isStreaming,
    previewConversationId,
    handleSendPreviewMessage,
    handleStopOutput,
    handleResetPreview,
  } = useCreateAppPreview({
    dialogId: currentDialogId,
    quote: config.prompt_config.quote,
    prologue: config.prompt_config.prologue,
  })

  const handleConfigChange = useCallback(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig((previousConfig) => ({ ...previousConfig, [key]: value }))
  }, [])

  const collapseLeftPanel = useCallback(() => {
    setLeftCollapsed(true)
    leftPanelRef.current?.collapse()
  }, [])

  const expandLeftPanel = useCallback(() => {
    setLeftCollapsed(false)
    leftPanelRef.current?.expand(20)
  }, [])

  const collapseRightPanel = useCallback(() => {
    setRightCollapsed(true)
    rightPanelRef.current?.collapse()
  }, [])

  const expandRightPanel = useCallback(() => {
    setRightCollapsed(false)
    rightPanelRef.current?.expand(20)
  }, [])

  const handlePresetChange = useCallback((presetType: GenerationPresetType) => {
    if (presetType !== GenerationPresetType.Custom && presetType in generationPresetConfigMapSnake) {
      const presetConfig = generationPresetConfigMapSnake[presetType as Exclude<GenerationPresetType, 'custom'>]
      const enabledFields = getDefaultEnabledFieldsSnake()

      setConfig((previousConfig) => ({
        ...previousConfig,
        llm_setting: {
          ...previousConfig.llm_setting,
          temperature: presetConfig.temperature,
          top_p: presetConfig.top_p,
          presence_penalty: presetConfig.presence_penalty,
          frequency_penalty: presetConfig.frequency_penalty,
          max_tokens: presetConfig.max_tokens,
          ...enabledFields,
        },
      }))
      setCurrentPreset(presetType)
      return
    }

    setCurrentPreset(GenerationPresetType.Custom)
  }, [])

  const handleLLMSettingChange = useCallback(<K extends keyof AppConfig['llm_setting']>(
    field: K,
    value: AppConfig['llm_setting'][K],
  ) => {
    setConfig((previousConfig) => {
      const nextSetting = {
        ...previousConfig.llm_setting,
        [field]: value,
      }

      const matchedPreset = detectMatchingPresetSnake({
        temperature: nextSetting.temperature ?? 0.5,
        top_p: nextSetting.top_p ?? 0.85,
        presence_penalty: nextSetting.presence_penalty ?? 0.2,
        frequency_penalty: nextSetting.frequency_penalty ?? 0.3,
        max_tokens: nextSetting.max_tokens ?? 4096,
        temperature_enabled: nextSetting.temperature_enabled ?? false,
        top_p_enabled: nextSetting.top_p_enabled ?? false,
        presence_penalty_enabled: nextSetting.presence_penalty_enabled ?? false,
        frequency_penalty_enabled: nextSetting.frequency_penalty_enabled ?? false,
        max_tokens_enabled: nextSetting.max_tokens_enabled ?? false,
      })
      setCurrentPreset(matchedPreset)

      return {
        ...previousConfig,
        llm_setting: nextSetting,
      }
    })
  }, [])

  const handleOpenKnowledgeModal = useCallback(() => {
    setShowKnowledgeModal(true)
    setKnowledgePage(1)
    void loadKnowledgeBases(knowledgeSearch, 1)
  }, [knowledgeSearch, loadKnowledgeBases])

  const handleKnowledgeSearch = useCallback(() => {
    setKnowledgePage(1)
    void loadKnowledgeBases(knowledgeSearch, 1)
  }, [knowledgeSearch, loadKnowledgeBases])

  const handleKnowledgePageChange = useCallback((page: number) => {
    setKnowledgePage(page)
    void loadKnowledgeBases(knowledgeSearch, page)
  }, [knowledgeSearch, loadKnowledgeBases])

  const handleAddKnowledgeBase = useCallback((knowledgeBase: KnowledgeBase) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      kb_ids: [...previousConfig.kb_ids, knowledgeBase.id],
    }))
    setKnowledgeBases((previousKnowledgeBases) => [...previousKnowledgeBases, knowledgeBase])
    setAddedKnowledgeBases((previousAddedBases) => new Set(previousAddedBases).add(knowledgeBase.id))
  }, [])

  const handleRemoveKnowledgeBase = useCallback((knowledgeBaseId: string) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      kb_ids: previousConfig.kb_ids.filter((id) => id !== knowledgeBaseId),
    }))
    setKnowledgeBases((previousKnowledgeBases) => previousKnowledgeBases.filter((item) => item.id !== knowledgeBaseId))
    setAddedKnowledgeBases((previousAddedBases) => {
      const nextAddedBases = new Set(previousAddedBases)
      nextAddedBases.delete(knowledgeBaseId)
      return nextAddedBases
    })
  }, [])

  const handleAddVariable = useCallback(() => {
    if (!variableForm.key.trim()) {
      toast.error('变量名不能为空')
      return
    }

    const exists = config.prompt_config.parameters.some((item) => item.key === variableForm.key)
    if (exists) {
      toast.error('变量名已存在')
      return
    }

    setConfig((previousConfig) => ({
      ...previousConfig,
      prompt_config: {
        ...previousConfig.prompt_config,
        parameters: [...previousConfig.prompt_config.parameters, { ...variableForm }],
      },
    }))
    setVariableForm(DEFAULT_VARIABLE_FORM)
    setShowVariableModal(false)
  }, [config.prompt_config.parameters, variableForm])

  const handleRemoveVariable = useCallback((key: string) => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      prompt_config: {
        ...previousConfig.prompt_config,
        parameters: previousConfig.prompt_config.parameters.filter((item) => item.key !== key),
      },
    }))
  }, [])

  const handleEditApp = useCallback(() => {
    setTempConfig(createTempConfig(config))
    setShowEditModal(true)
  }, [config])

  const handleSaveEdit = useCallback(() => {
    setConfig((previousConfig) => ({
      ...previousConfig,
      name: tempConfig.name,
      description: tempConfig.description,
      icon: tempConfig.icon,
    }))
    setShowEditModal(false)
  }, [tempConfig])

  const handleCancelEdit = useCallback(() => {
    setTempConfig(createTempConfig(config))
    setShowEditModal(false)
  }, [config])

  const handleSave = useCallback(async () => {
    try {
      setSaving(true)

      if (!config.name.trim()) {
        toast.error('应用名称不能为空')
        return
      }

      if (!config.llm_id) {
        toast.error('请选择模型')
        return
      }

      const enabledLlmSettings = {
        ...(config.llm_setting.temperature_enabled && { temperature: Number(config.llm_setting.temperature) }),
        ...(config.llm_setting.top_p_enabled && { top_p: Number(config.llm_setting.top_p) }),
        ...(config.llm_setting.presence_penalty_enabled && { presence_penalty: Number(config.llm_setting.presence_penalty) }),
        ...(config.llm_setting.frequency_penalty_enabled && { frequency_penalty: Number(config.llm_setting.frequency_penalty) }),
        ...(config.llm_setting.max_tokens_enabled && { max_tokens: Number(config.llm_setting.max_tokens) }),
      }

      let searchMode: Record<string, unknown> | null = null
      if (config.search_mode) {
        if (config.search_mode.type === 'hybrid') {
          searchMode = {
            type: 'hybrid',
            weight_dense: config.search_mode.weight_dense || 0.7,
            weight_sparse: config.search_mode.weight_sparse || 0.3,
          }
        } else {
          searchMode = {
            type: config.search_mode.type,
          }
        }
      }

      const hasKnowledgeBase = Boolean(config.kb_ids?.length)
      const hasTavilyRetrieval = Boolean(config.prompt_config.tavily_api_key?.trim())
      const isRetrievalApp = hasKnowledgeBase || hasTavilyRetrieval

      let systemPrompt = config.systemPrompt
      if (!isRetrievalApp) {
        systemPrompt = systemPrompt
          .replace(/{knowledge}/g, '')
          .replace(/以下是知识库：[\s\S]*?以上是知识库。/g, '')
          .replace(/以下是知识库：\s*\n\s*\n\s*以上是知识库。/g, '')
          .trim()

        if (!systemPrompt) {
          systemPrompt = DEFAULT_SYSTEM_PROMPT
        }
      }

      const requestData: Record<string, unknown> = {
        name: config.name,
        description: config.description,
        icon: config.icon || '',
        llm_id: config.llm_id,
        llm_setting: Object.keys(enabledLlmSettings).length > 0 ? enabledLlmSettings : null,
        prompt_config: {
          system: systemPrompt,
          prologue: config.prompt_config.prologue || '您好，我是您的助手！',
          empty_response: isRetrievalApp
            ? (config.prompt_config.empty_response || '抱歉，我无法回答这个问题。')
            : (config.prompt_config.empty_response || ''),
          quote: config.prompt_config.quote,
          keyword: config.prompt_config.keyword,
          tts: config.prompt_config.tts,
          toc_enhance: config.prompt_config.toc_enhance,
          refine_multiturn: config.prompt_config.refine_multiturn,
          use_kg: config.prompt_config.use_kg,
          reasoning: config.prompt_config.reasoning,
          tavily_api_key: config.prompt_config.tavily_api_key || '',
          cross_languages: config.prompt_config.cross_languages || [],
          parameters: isRetrievalApp
            ? config.prompt_config.parameters
            : config.prompt_config.parameters.filter((item) => item.key !== 'knowledge'),
        },
        kb_ids: config.kb_ids || [],
        top_n: config.top_n,
        top_k: config.top_k,
        do_refer: config.do_refer,
        similarity_threshold: config.similarity_threshold,
        vector_similarity_weight: config.vector_similarity_weight,
        rerank_id: config.rerank_id || null,
      }

      if (currentDialogId) {
        requestData.dialog_id = currentDialogId
      }
      if (searchMode) {
        requestData.search_mode = searchMode
      }

      const result = await dialogAPI.set(requestData)
      toast.success('保存成功')

      if (!currentDialogId && result?.id) {
        setCurrentDialogId(result.id)
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
  }, [config, currentDialogId])

  const handleIconUpload = useCallback((file: File) => {
    const isAllowedType = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/svg+xml'
    if (!isAllowedType) {
      toast.error('只能上传 JPG/PNG/SVG 格式的图片!')
      return false
    }

    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isLt2M) {
      toast.error('图片大小不能超过 2MB!')
      return false
    }

    const reader = new FileReader()
    reader.onload = () => {
      setTempConfig((previousConfig) => ({ ...previousConfig, icon: reader.result as string }))
    }
    reader.onerror = () => {
      toast.error('读取图片失败，请重试')
    }
    reader.readAsDataURL(file)

    return false
  }, [])

  const handleOpenIconPicker = useCallback(() => {
    iconInputRef.current?.click()
  }, [])

  const handleIconInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleIconUpload(file)
    }
    event.target.value = ''
  }, [handleIconUpload])

  return {
    dialogId: currentDialogId,
    config,
    tempConfig,
    setTempConfig,
    currentTheme,
    saving,
    chatModels,
    rerankModels,
    modelsLoading,
    modelsError,
    knowledgeBases,
    availableKnowledgeBases,
    knowledgeSearch,
    setKnowledgeSearch,
    knowledgePage,
    knowledgeTotal,
    addedKnowledgeBases,
    selectedEmbdId,
    currentPreset,
    modelSectionExpanded,
    setModelSectionExpanded,
    knowledgeSectionExpanded,
    setKnowledgeSectionExpanded,
    advancedSectionExpanded,
    setAdvancedSectionExpanded,
    variableSectionExpanded,
    setVariableSectionExpanded,
    experienceSectionExpanded,
    setExperienceSectionExpanded,
    variableForm,
    setVariableForm,
    previewMessages,
    inputValue,
    setInputValue,
    isStreaming,
    previewConversationId,
    leftCollapsed,
    setLeftCollapsed,
    rightCollapsed,
    setRightCollapsed,
    leftPanelRef,
    rightPanelRef,
    iconInputRef,
    showEditModal,
    setShowEditModal,
    showKnowledgeModal,
    setShowKnowledgeModal,
    showVariableModal,
    setShowVariableModal,
    handleConfigChange,
    collapseLeftPanel,
    expandLeftPanel,
    collapseRightPanel,
    expandRightPanel,
    handlePresetChange,
    handleLLMSettingChange,
    handleOpenKnowledgeModal,
    handleKnowledgeSearch,
    handleKnowledgePageChange,
    handleAddKnowledgeBase,
    handleRemoveKnowledgeBase,
    handleAddVariable,
    handleRemoveVariable,
    handleEditApp,
    handleSaveEdit,
    handleCancelEdit,
    handleSave,
    handleSendPreviewMessage,
    handleStopOutput,
    handleResetPreview,
    handleOpenIconPicker,
    handleIconInputChange,
  }
}

export type CreateAppPageController = ReturnType<typeof useCreateAppPage>
