import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dialogAPI } from '@/api/dialog'
import { knowledgeAPI } from '@/api/knowledge'
import { settingsToDialogUpdate } from '@/hooks/chat-settings-payload'
import { knowledgeKeys } from '@/hooks/use-knowledge-request'
import { dialogKeys } from '@/hooks/use-dialog-apps'
import { toast } from '@/lib/toast'
import type { DialogApp } from '@/types/api'
import type { ChatSettings } from '@/components/chat/chat-settings.types'
import { defaultChatSettings } from '@/components/chat/chat-settings.constants'
import type { MetadataFilterMode } from '@/components/chat/MetadataFilter'
import { detectMatchingPreset } from '@/constants/llm'
import { isLLMModelEnabled } from '@/stores/model'

/**
 * 从 DialogApp 转换为 ChatSettings
 * 应用没有开场白时填入 defaultPrologue（按界面语言），保存后写入应用
 */
export function dialogToSettings(
  dialog: DialogApp | null | undefined,
  defaultPrologue: string,
): ChatSettings {
  if (!dialog) return defaultChatSettings

  const promptConfig = (dialog.prompt_config || {}) as any

  // 解析元数据过滤设置
  let metadataFilterMode: MetadataFilterMode = 'disabled'
  let metadataCondition = defaultChatSettings.metadataCondition

  // 从 dialog 中读取 meta_data_filter (如果存在)
  const metaDataFilter = (dialog as any).meta_data_filter
  if (metaDataFilter) {
    if (
      metaDataFilter.method === 'manual' ||
      (metaDataFilter.manual && metaDataFilter.manual.length > 0)
    ) {
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
    prologue: promptConfig.prologue || defaultPrologue,

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
 * 聊天设置 Hook
 * 用于获取和保存对话应用的设置
 */
export function useChatSettings(dialogId: string | undefined) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  // 获取 dialog 详情
  const {
    data: dialog,
    isLoading: dialogLoading,
    error: dialogError,
  } = useQuery({
    queryKey: dialogKeys.detail(dialogId || ''),
    queryFn: () => dialogAPI.getDetail(dialogId!),
    enabled: !!dialogId,
  })

  // 转换为 ChatSettings
  const defaultPrologue = t('chat.settings.defaultPrologue')
  const settings = useMemo(
    () => dialogToSettings(dialog, defaultPrologue),
    [dialog, defaultPrologue],
  )

  // 保存设置
  const { mutateAsync: saveSettings, isPending: saving } = useMutation({
    mutationFn: async (newSettings: ChatSettings) => {
      if (!dialogId) throw new Error('Dialog ID is required')
      const updateData = settingsToDialogUpdate(
        newSettings,
        t('chat.knowledgePrompt.block'),
      )
      await dialogAPI.updateChat(dialogId, updateData)
      // 只有保存时追加了知识库块，提交的 system 才会与编辑内容不同
      return {
        knowledgeBlockAppended:
          updateData.prompt_config?.system !== newSettings.systemPrompt,
      }
    },
    onSuccess: ({ knowledgeBlockAppended }) => {
      // 使缓存失效
      queryClient.invalidateQueries({
        queryKey: dialogKeys.detail(dialogId || ''),
      })
      queryClient.invalidateQueries({ queryKey: dialogKeys.all })
      toast.success(t('chat.settings.saveSuccess'))
      if (knowledgeBlockAppended) {
        toast.info(t('chat.knowledgePrompt.insertedOnSave'))
      }
    },
    onError: () => {
      toast.error(t('chat.settings.saveError'))
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
    queryKey: knowledgeKeys.simpleList(),
    queryFn: async () => {
      const result = await knowledgeAPI.knowledgeBase.list({
        page: 1,
        page_size: 100,
      })
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

    Object.entries(myLLMs).forEach(
      ([providerName, providerData]: [string, any]) => {
        if (providerData?.llm && Array.isArray(providerData.llm)) {
          providerData.llm.forEach((model: any) => {
            if (
              model?.type === 'rerank' &&
              model?.name &&
              isLLMModelEnabled(model)
            ) {
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
      },
    )

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

    Object.entries(myLLMs).forEach(
      ([providerName, providerData]: [string, any]) => {
        if (providerData?.llm && Array.isArray(providerData.llm)) {
          providerData.llm.forEach((model: any) => {
            if (
              model?.type === 'chat' &&
              model?.name &&
              isLLMModelEnabled(model)
            ) {
              models.push({
                id: model.name,
                name: model.name,
                provider: providerName,
              })
            }
          })
        }
      },
    )

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
    conditions: settings.metadataCondition.conditions.map((c) => ({
      name: c.name,
      comparison_operator: c.comparison_operator,
      value: c.value,
    })),
  }
}
