import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUpdateSearch } from '@/hooks/use-search-request'
import { useUIStore } from '@/stores/ui'
import { DEFAULT_SEARCH_CONFIG } from '../../constants'
import type { SearchApp, SearchConfig } from '@/types/search'

const buildDefaultConfig = (): SearchConfig => ({
  kb_ids: [],
  similarity_threshold: DEFAULT_SEARCH_CONFIG.similarity_threshold,
  vector_similarity_weight: DEFAULT_SEARCH_CONFIG.vector_similarity_weight,
  top_k: DEFAULT_SEARCH_CONFIG.top_k,
  summary: DEFAULT_SEARCH_CONFIG.summary,
  related_search: DEFAULT_SEARCH_CONFIG.related_search,
  use_rerank: DEFAULT_SEARCH_CONFIG.use_rerank,
  rerank_id: '',
  use_kg: DEFAULT_SEARCH_CONFIG.use_kg,
  web_search: false,
  query_mindmap: false,
  meta_data_filter: {
    method: 'disabled',
    logic: 'and',
    manual: [],
  },
})

export const useSearchSettings = (searchApp: SearchApp | null) => {
  const { updateSearch, isLoading } = useUpdateSearch()
  const { addNotification } = useUIStore()
  const [config, setConfig] = useState<SearchConfig>(buildDefaultConfig)
  const [savedConfig, setSavedConfig] = useState<SearchConfig>(buildDefaultConfig)
  const [basicInfo, setBasicInfo] = useState<Pick<SearchApp, 'name' | 'description' | 'avatar'>>({
    name: '',
    description: '',
    avatar: '',
  })
  const [savedBasicInfo, setSavedBasicInfo] = useState<Pick<SearchApp, 'name' | 'description' | 'avatar'>>({
    name: '',
    description: '',
    avatar: '',
  })

  useEffect(() => {
    if (!searchApp) return
    const rawSearchConfig = (searchApp.search_config || {}) as Partial<SearchConfig>
    const mergedConfig: SearchConfig = {
      ...buildDefaultConfig(),
      ...rawSearchConfig,
      rerank_id: rawSearchConfig.rerank_id || '',
      web_search: rawSearchConfig.web_search || false,
      query_mindmap: rawSearchConfig.query_mindmap || false,
      meta_data_filter: rawSearchConfig.meta_data_filter || {
        method: 'disabled',
        logic: 'and',
        manual: [],
      },
    }
    setConfig(mergedConfig)
    setSavedConfig(mergedConfig)
    const nextBasicInfo = {
      name: searchApp.name || '',
      description: searchApp.description || '',
      avatar: searchApp.avatar || '',
    }
    setBasicInfo(nextBasicInfo)
    setSavedBasicInfo(nextBasicInfo)
  }, [searchApp])

  const isDirty = useMemo(
    () =>
      JSON.stringify(config) !== JSON.stringify(savedConfig) ||
      JSON.stringify(basicInfo) !== JSON.stringify(savedBasicInfo),
    [basicInfo, config, savedBasicInfo, savedConfig]
  )

  const updateConfig = useCallback((partial: Partial<SearchConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const updateBasicInfo = useCallback((partial: Partial<Pick<SearchApp, 'name' | 'description' | 'avatar'>>) => {
    setBasicInfo((prev) => ({ ...prev, ...partial }))
  }, [])

  const saveConfig = useCallback(async () => {
    if (!searchApp) return
    if (!config.kb_ids?.length) {
      addNotification({ type: 'error', title: '保存失败', message: '至少需要选择一个知识库。' })
      return
    }
    const trimmedName = (basicInfo.name || '').trim()
    if (!trimmedName) {
      addNotification({ type: 'error', title: '保存失败', message: '名称不能为空。' })
      return
    }

    try {
      await updateSearch({
        search_id: searchApp.id,
        name: trimmedName,
        description: (basicInfo.description || '').trim() || undefined,
        avatar: basicInfo.avatar || '',
        tenant_id: searchApp.tenant_id,
        search_config: config as unknown as Record<string, unknown>,
      })
      setSavedConfig(config)
      setSavedBasicInfo({
        name: trimmedName,
        description: (basicInfo.description || '').trim(),
        avatar: basicInfo.avatar || '',
      })
      addNotification({ type: 'success', title: '保存成功', message: '搜索配置已更新。' })
    } catch {
      addNotification({ type: 'error', title: '保存失败', message: '更新搜索配置时发生错误。' })
    }
  }, [addNotification, basicInfo.avatar, basicInfo.description, basicInfo.name, config, searchApp, updateSearch])

  return {
    basicInfo,
    config,
    appliedConfig: savedConfig,
    updateBasicInfo,
    updateConfig,
    saveConfig,
    isSaving: isLoading,
    isDirty,
  }
}
