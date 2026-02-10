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
    method: 'manual',
    manual: [],
  },
})

export const useSearchSettings = (searchApp: SearchApp | null) => {
  const { updateSearch, isLoading } = useUpdateSearch()
  const { addNotification } = useUIStore()
  const [config, setConfig] = useState<SearchConfig>(buildDefaultConfig)
  const [savedConfig, setSavedConfig] = useState<SearchConfig>(buildDefaultConfig)

  useEffect(() => {
    if (!searchApp?.search_config) return
    const mergedConfig: SearchConfig = {
      ...buildDefaultConfig(),
      ...searchApp.search_config,
      rerank_id: searchApp.search_config.rerank_id || '',
      web_search: searchApp.search_config.web_search || false,
      query_mindmap: searchApp.search_config.query_mindmap || false,
      meta_data_filter: searchApp.search_config.meta_data_filter || {
        method: 'manual',
        manual: [],
      },
    }
    setConfig(mergedConfig)
    setSavedConfig(mergedConfig)
  }, [searchApp])

  const isDirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(savedConfig), [config, savedConfig])

  const updateConfig = useCallback((partial: Partial<SearchConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }, [])

  const saveConfig = useCallback(async () => {
    if (!searchApp) return
    if (!config.kb_ids?.length) {
      addNotification({ type: 'error', title: '保存失败', message: '至少需要选择一个知识库。' })
      return
    }

    try {
      await updateSearch({
        search_id: searchApp.id,
        name: searchApp.name,
        description: searchApp.description,
        tenant_id: searchApp.tenant_id,
        search_config: config as unknown as Record<string, unknown>,
      })
      setSavedConfig(config)
      addNotification({ type: 'success', title: '保存成功', message: '搜索配置已更新。' })
    } catch {
      addNotification({ type: 'error', title: '保存失败', message: '更新搜索配置时发生错误。' })
    }
  }, [addNotification, config, searchApp, updateSearch])

  return {
    config,
    updateConfig,
    saveConfig,
    isSaving: isLoading,
    isDirty,
  }
}
