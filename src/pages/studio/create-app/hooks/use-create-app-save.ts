import { useCallback, useState } from 'react'
import { dialogAPI } from '@/api/dialog'
import { toast } from '@/lib/toast'
import { DEFAULT_SYSTEM_PROMPT } from '../constants'
import type { AppConfig } from '../types'

interface UseCreateAppSaveParams {
  config: AppConfig
  currentDialogId: string | null
  setCurrentDialogId: (dialogId: string) => void
}

/**
 * Owns the dialog save flow (validation + request assembly + create/update).
 * Extracted from useCreateAppPage to keep that composition hook under the
 * file-size ratchet; the returned shape stays part of useCreateAppPage's API.
 */
export const useCreateAppSave = ({
  config,
  currentDialogId,
  setCurrentDialogId,
}: UseCreateAppSaveParams) => {
  const [saving, setSaving] = useState(false)

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
        ...(config.llm_setting.temperature_enabled && {
          temperature: Number(config.llm_setting.temperature),
        }),
        ...(config.llm_setting.top_p_enabled && {
          top_p: Number(config.llm_setting.top_p),
        }),
        ...(config.llm_setting.presence_penalty_enabled && {
          presence_penalty: Number(config.llm_setting.presence_penalty),
        }),
        ...(config.llm_setting.frequency_penalty_enabled && {
          frequency_penalty: Number(config.llm_setting.frequency_penalty),
        }),
        ...(config.llm_setting.max_tokens_enabled && {
          max_tokens: Number(config.llm_setting.max_tokens),
        }),
      }

      let searchMode: Record<string, unknown> | null = null
      if (config.search_mode) {
        if (config.search_mode.type === 'hybrid') {
          searchMode = {
            type: 'hybrid',
            weight_dense: config.search_mode.weight_dense ?? 0.7,
            weight_sparse: config.search_mode.weight_sparse ?? 0.3,
          }
        } else {
          searchMode = {
            type: config.search_mode.type,
          }
        }
      }

      const hasKnowledgeBase = Boolean(config.kb_ids?.length)
      const hasTavilyRetrieval = Boolean(
        config.prompt_config.tavily_api_key?.trim(),
      )
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
        llm_setting:
          Object.keys(enabledLlmSettings).length > 0
            ? enabledLlmSettings
            : null,
        prompt_config: {
          system: systemPrompt,
          prologue: config.prompt_config.prologue || '您好，我是您的助手！',
          empty_response: isRetrievalApp
            ? config.prompt_config.empty_response ||
              '抱歉，我无法回答这个问题。'
            : config.prompt_config.empty_response || '',
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
            : config.prompt_config.parameters.filter(
                (item) => item.key !== 'knowledge',
              ),
        },
        dataset_ids: config.kb_ids || [],
        top_n: config.top_n,
        top_k: config.top_k,
        do_refer: config.do_refer,
        similarity_threshold: config.similarity_threshold,
        vector_similarity_weight: config.vector_similarity_weight,
        rerank_id: config.rerank_id || null,
      }

      if (searchMode) {
        requestData.search_mode = searchMode
      }

      const result = currentDialogId
        ? await dialogAPI.updateChat(currentDialogId, requestData)
        : await dialogAPI.createChat(requestData)
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
  }, [config, currentDialogId, setCurrentDialogId])

  return { saving, handleSave }
}
