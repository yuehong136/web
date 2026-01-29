import { useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dialogAPI } from '@/api/dialog'
import { knowledgeAPI } from '@/api/knowledge'
import { queryKeys, invalidateQueries } from '@/lib/query-client'
import { toast } from '@/lib/toast'
import type { DialogApp } from '@/types/api'
import type { ChatSettings } from '@/components/chat/ChatSettingsPanel'
import { defaultChatSettings } from '@/components/chat/ChatSettingsPanel'
import type { MetadataFilterMode } from '@/components/chat/MetadataFilter'
import { detectMatchingPreset, GenerationPresetType } from '@/constants/llm'

/**
 * 从 DialogApp 转换为 ChatSettings
 */
export function dialogToSettings(dialog: DialogApp | null | undefined): ChatSettings {
  if (!dialog) return defaultChatSettings

  const promptConfig = dialog.prompt_config || {}
  
  // 解析元数据过滤设置
  let metadataFilterMode: MetadataFilterMode = 'disabled'
  let metadataCondition = defaultChatSettings.metadataCondition
  
  // 从 dialog 中读取 meta_data_filter (如果存在)
  const metaDataFilter = (dialog as any).meta_data_filter
  if (metaDataFilter) {
    if (metaDataFilter.method === 'manual' || (metaDataFilter.manual && metaDataFilter.manual.length > 0)) {
      metadataFilterMode = 'manual'
      metadataCondition = {
        logic: metaDataFilter.logic || 'and',
        conditions: (metaDataFilter.manual || []).map((item: any) => ({
          name: item.key || item.name || '',
          comparison_operator: item.op || item.comparison_operator || 'is',
          value: item.value || '',
        })),
      }
    }
  }

  return {
    // 聊天设置
    icon: dialog.icon || '',
    name: dialog.name || '',
    description: dialog.description || '',
    emptyResponse: promptConfig.empty_response || '',
    prologue: promptConfig.prologue || '您好，我是您的助手！有什么可以帮您的？',
    
    // 开关选项
    quote: promptConfig.quote !== false, // 默认 true
    keyword: promptConfig.keyword || false,
    tts: promptConfig.tts || false,
    tocEnhance: promptConfig.toc_enhance || false,
    refineMultiturn: promptConfig.refine_multiturn !== false, // 默认 true
    useKnowledgeGraph: promptConfig.use_kg || false,
    reasoning: promptConfig.reasoning || false,
    
    // API Key
    tavilyApiKey: promptConfig.tavily_api_key || '',
    
    // 知识库
    kbIds: dialog.kb_ids || [],
    
    // 元数据过滤
    metadataFilterMode,
    metadataCondition,
    
    // 提示工程
    systemPrompt: promptConfig.system || '',
    similarityThreshold: dialog.similarity_threshold ?? 0.2,
    vectorSimilarityWeight: dialog.vector_similarity_weight ?? 0.3,
    topN: dialog.top_n ?? 8,
    crossLanguages: promptConfig.cross_languages || [],
    variables: (promptConfig.parameters || []).map((p: any) => ({
      key: p.key || '',
      optional: p.optional || false,
    })),
    
    // 重排序
    rerankId: dialog.rerank_id || '',
    topK: dialog.top_k ?? 1024,
    
    // LLM 设置
    llmId: dialog.llm_id || '',
    // 参数值
    temperature: dialog.llm_setting?.temperature ?? 0.5,
    topP: dialog.llm_setting?.top_p ?? 0.85,
    presencePenalty: dialog.llm_setting?.presence_penalty ?? 0.2,
    frequencyPenalty: dialog.llm_setting?.frequency_penalty ?? 0.3,
    maxTokens: dialog.llm_setting?.max_tokens ?? 4096,
    // 参数启用状态 - 参考 ragflow，默认启用常用参数
    // Temperature, Top P, Presence Penalty, Frequency Penalty 默认启用
    // Max Tokens 默认禁用（除非服务端有值）
    temperatureEnabled: true,
    topPEnabled: true,
    presencePenaltyEnabled: true,
    frequencyPenaltyEnabled: true,
    maxTokensEnabled: dialog.llm_setting?.max_tokens !== undefined,
    // 生成多样性预设 - 根据参数值自动检测
    generationPreset: detectMatchingPreset({
      temperature: dialog.llm_setting?.temperature ?? 0.5,
      topP: dialog.llm_setting?.top_p ?? 0.85,
      presencePenalty: dialog.llm_setting?.presence_penalty ?? 0.2,
      frequencyPenalty: dialog.llm_setting?.frequency_penalty ?? 0.3,
      maxTokens: dialog.llm_setting?.max_tokens ?? 4096,
      temperatureEnabled: true,
      topPEnabled: true,
      presencePenaltyEnabled: true,
      frequencyPenaltyEnabled: true,
      maxTokensEnabled: dialog.llm_setting?.max_tokens !== undefined,
    }),
  }
}

/**
 * 从 ChatSettings 转换为 DialogApp 更新请求
 */
export function settingsToDialogUpdate(settings: ChatSettings, dialogId: string): Partial<DialogApp> & { dialog_id: string } {
  // 构建 meta_data_filter
  let metaDataFilter: any = { method: 'disabled' }
  if (settings.metadataFilterMode === 'manual' && settings.metadataCondition.conditions?.length) {
    metaDataFilter = {
      method: 'manual',
      logic: settings.metadataCondition.logic || 'and',
      manual: settings.metadataCondition.conditions.map(c => ({
        key: c.name,
        op: c.comparison_operator,
        value: c.value,
      })),
    }
  }

  return {
    dialog_id: dialogId,
    icon: settings.icon || undefined,
    name: settings.name || undefined,
    description: settings.description || undefined,
    kb_ids: settings.kbIds,
    similarity_threshold: settings.similarityThreshold,
    vector_similarity_weight: settings.vectorSimilarityWeight,
    top_n: settings.topN,
    top_k: settings.topK,
    rerank_id: settings.rerankId || null,
    llm_id: settings.llmId || undefined,
    llm_setting: {
      // 只发送启用的参数，参考 ragflow 的 removeUselessFieldsFromValues 逻辑
      ...(settings.temperatureEnabled ? { temperature: settings.temperature } : {}),
      ...(settings.topPEnabled ? { top_p: settings.topP } : {}),
      ...(settings.presencePenaltyEnabled ? { presence_penalty: settings.presencePenalty } : {}),
      ...(settings.frequencyPenaltyEnabled ? { frequency_penalty: settings.frequencyPenalty } : {}),
      ...(settings.maxTokensEnabled ? { max_tokens: settings.maxTokens } : {}),
    },
    prompt_config: {
      system: settings.systemPrompt,
      prologue: settings.prologue,
      empty_response: settings.emptyResponse,
      quote: settings.quote,
      keyword: settings.keyword,
      tts: settings.tts,
      toc_enhance: settings.tocEnhance,
      refine_multiturn: settings.refineMultiturn,
      use_kg: settings.useKnowledgeGraph,
      reasoning: settings.reasoning,
      tavily_api_key: settings.tavilyApiKey,
      cross_languages: settings.crossLanguages,
      parameters: settings.variables.filter(v => v.key).map(v => ({
        key: v.key,
        optional: v.optional,
      })),
    },
    meta_data_filter: metaDataFilter,
  } as any
}

/**
 * 聊天设置 Hook
 * 用于获取和保存对话应用的设置
 */
export function useChatSettings(dialogId: string | undefined) {
  const queryClient = useQueryClient()

  // 获取 dialog 详情
  const { 
    data: dialog, 
    isLoading: dialogLoading,
    error: dialogError,
  } = useQuery({
    queryKey: queryKeys.dialogApps.detail(dialogId || ''),
    queryFn: () => dialogAPI.getDetail(dialogId!),
    enabled: !!dialogId,
  })

  // 转换为 ChatSettings
  const settings = useMemo(() => dialogToSettings(dialog), [dialog])

  // 保存设置
  const { mutateAsync: saveSettings, isPending: saving } = useMutation({
    mutationFn: async (newSettings: ChatSettings) => {
      if (!dialogId) throw new Error('Dialog ID is required')
      const updateData = settingsToDialogUpdate(newSettings, dialogId)
      return dialogAPI.set(updateData)
    },
    onSuccess: () => {
      // 使缓存失效
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dialogApps.detail(dialogId || '') 
      })
      invalidateQueries.dialogApps()
      toast.success('设置保存成功')
    },
    onError: (error: any) => {
      toast.error(error.message || '保存设置失败')
    },
  })

  return {
    dialog,
    settings,
    loading: dialogLoading,
    error: dialogError,
    saving,
    saveSettings,
  }
}

/**
 * 获取知识库列表 Hook
 * 返回 KnowledgeBase[] 格式，包含完整的知识库信息
 */
export function useKnowledgeBases() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['knowledgeBases'],
    queryFn: async () => {
      const result = await knowledgeAPI.knowledgeBase.list({ page: 1, page_size: 100 })
      return result.kbs || []
    },
  })

  // 加载知识库的回调函数（用于搜索和分页）
  const loadKnowledgeBases = useCallback(async (search?: string, page = 1) => {
    const result = await knowledgeAPI.knowledgeBase.list({
      keywords: search || '',
      page,
      page_size: 20,
      orderby: 'create_time',
      desc: true,
    })
    return {
      kbs: result.kbs || [],
      total: result.total || 0,
    }
  }, [])

  return {
    knowledgeBases: data || [],
    loading: isLoading,
    error,
    loadKnowledgeBases,
  }
}

/**
 * 获取重排序模型列表 Hook
 * 返回 LLMModel[] 格式，用于 RerankModelSelector
 */
export function useRerankModels(myLLMs: any) {
  return useMemo(() => {
    const models: Array<{
      id: string
      llm_name: string
      fid: string
      mdl_type: 'rerank'
      available: boolean
      max_tokens?: number
    }> = []
    
    if (!myLLMs || typeof myLLMs !== 'object') return models

    Object.entries(myLLMs).forEach(([providerName, providerData]: [string, any]) => {
      if (providerData?.llm && Array.isArray(providerData.llm)) {
        providerData.llm.forEach((model: any) => {
          if (model?.type === 'rerank' && model?.name) {
            models.push({
              id: `${model.name}@${providerName}`,
              llm_name: model.name,
              fid: providerName,
              mdl_type: 'rerank',
              available: true,
              max_tokens: model.max_tokens,
            })
          }
        })
      }
    })

    return models
  }, [myLLMs])
}

/**
 * 获取 LLM 聊天模型列表 Hook
 */
export function useLLMModels(myLLMs: any) {
  return useMemo(() => {
    const models: { id: string; name: string; provider?: string }[] = []
    
    if (!myLLMs || typeof myLLMs !== 'object') return models

    Object.entries(myLLMs).forEach(([providerName, providerData]: [string, any]) => {
      if (providerData?.llm && Array.isArray(providerData.llm)) {
        providerData.llm.forEach((model: any) => {
          if (model?.type === 'chat' && model?.name) {
            models.push({
              id: model.name,
              name: model.name,
              provider: providerName,
            })
          }
        })
      }
    })

    return models
  }, [myLLMs])
}

/**
 * 构建用于 API 调用的 metadata_condition
 */
export function buildMetadataCondition(settings: ChatSettings) {
  if (settings.metadataFilterMode !== 'manual') return undefined
  if (!settings.metadataCondition.conditions?.length) return undefined

  return {
    logic: settings.metadataCondition.logic || 'and',
    conditions: settings.metadataCondition.conditions.map(c => ({
      name: c.name,
      comparison_operator: c.comparison_operator,
      value: c.value,
    })),
  }
}
