import { useTranslation } from 'react-i18next'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { toast } from '@/lib/toast'
import { useUpdateSearch } from '@/hooks/use-search-request'
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
  cross_languages: [],
  meta_data_filter: {
    method: 'disabled',
    logic: 'and',
    semi_auto: [],
    manual: [],
  },
})

const normalizeModelConfig = (
  rawConfig: Partial<SearchConfig>,
): SearchConfig => {
  const selectedModel = rawConfig.chat_id || rawConfig.llm_id

  return {
    ...buildDefaultConfig(),
    ...rawConfig,
    chat_id: selectedModel || undefined,
    llm_id: selectedModel || undefined,
    rerank_id: rawConfig.rerank_id || '',
    web_search: rawConfig.web_search || false,
    query_mindmap: rawConfig.query_mindmap || false,
    cross_languages: rawConfig.cross_languages || [],
    meta_data_filter: rawConfig.meta_data_filter || {
      method: 'disabled',
      logic: 'and',
      semi_auto: [],
      manual: [],
    },
  }
}

type BasicInfo = Pick<SearchApp, 'name' | 'description' | 'avatar'>
interface SettingsSnapshot {
  config: SearchConfig
  basicInfo: BasicInfo
}
interface SettingsState {
  source: SearchApp | null
  scope: string
  epoch: number
  revision: number
  saveId: number | null
  draft: SettingsSnapshot
  saved: SettingsSnapshot
  confirmedAt: number | null
}

const getScope = (app: SearchApp | null) =>
  JSON.stringify([app?.tenant_id, app?.id])
const getUpdateTime = (app: SearchApp | null) =>
  app && Number.isFinite(app.update_time) ? app.update_time : null
const getSnapshot = (app: SearchApp | null): SettingsSnapshot => ({
  config: normalizeModelConfig(app?.search_config || {}),
  basicInfo: {
    name: app?.name || '',
    description: app?.description || '',
    avatar: app?.avatar || '',
  },
})
const hasDraftChanges = (state: SettingsState) =>
  JSON.stringify(state.draft) !== JSON.stringify(state.saved)
const createSettingsState = (
  source: SearchApp | null,
  epoch = 0,
): SettingsState => {
  const snapshot = getSnapshot(source)
  return {
    source,
    scope: getScope(source),
    epoch,
    revision: 0,
    saveId: null,
    draft: snapshot,
    saved: snapshot,
    confirmedAt: getUpdateTime(source),
  }
}
const isSaveAcknowledgement = (response: SearchApp, app: SearchApp) =>
  response !== null &&
  typeof response === 'object' &&
  response.id === app.id &&
  response.tenant_id === app.tenant_id &&
  typeof response.name === 'string' &&
  response.search_config !== null &&
  typeof response.search_config === 'object' &&
  !Array.isArray(response.search_config) &&
  Array.isArray(response.search_config.kb_ids) &&
  response.search_config.kb_ids.every((id) => typeof id === 'string')

export const useSearchSettings = (searchApp: SearchApp | null) => {
  const { t } = useTranslation()
  const { updateSearch } = useUpdateSearch()
  const [state, setState] = useState(() => createSettingsState(searchApp))
  const owner = useRef<{ epoch: number } | null>(null)
  const activeSave = useRef<object | null>(null)
  const requestRevision = useRef(0)

  if (state.source !== searchApp) {
    if (state.scope !== getScope(searchApp)) {
      setState(createSettingsState(searchApp, state.epoch + 1))
    } else {
      const updateTime = getUpdateTime(searchApp)
      const isOlder =
        updateTime !== null &&
        state.confirmedAt !== null &&
        updateTime < state.confirmedAt
      const saved = getSnapshot(searchApp)
      setState({
        ...state,
        source: searchApp,
        // A refetch can confirm server data, but cannot replace an edited draft
        // or race the acknowledgement of a save already in flight.
        ...(!state.saveId && !isOlder
          ? {
              saved,
              draft: hasDraftChanges(state) ? state.draft : saved,
              confirmedAt: updateTime,
            }
          : {}),
      })
    }
  }

  useLayoutEffect(() => {
    const currentOwner = { epoch: state.epoch }
    owner.current = currentOwner
    return () => {
      if (owner.current === currentOwner) {
        owner.current = null
        activeSave.current = null
      }
    }
  }, [state.epoch])

  const updateConfig = useCallback(
    (partial: Partial<SearchConfig>) => {
      setState((prev) =>
        prev.epoch === state.epoch
          ? {
              ...prev,
              revision: prev.revision + 1,
              draft: {
                ...prev.draft,
                config: normalizeModelConfig({
                  ...prev.draft.config,
                  ...partial,
                }),
              },
            }
          : prev,
      )
    },
    [state.epoch],
  )

  const updateBasicInfo = useCallback(
    (partial: Partial<BasicInfo>) => {
      setState((prev) =>
        prev.epoch === state.epoch
          ? {
              ...prev,
              revision: prev.revision + 1,
              draft: {
                ...prev.draft,
                basicInfo: { ...prev.draft.basicInfo, ...partial },
              },
            }
          : prev,
      )
    },
    [state.epoch],
  )

  const saveConfig = useCallback(async () => {
    const currentOwner = owner.current
    if (
      !searchApp ||
      !currentOwner ||
      currentOwner.epoch !== state.epoch ||
      activeSave.current
    )
      return
    const { config, basicInfo } = state.draft
    if (!config.kb_ids?.length) {
      toast.error(t('searchPage.feedback.knowledgeRequired'))
      return
    }
    const trimmedName = (basicInfo.name || '').trim()
    if (!trimmedName) {
      toast.error(t('searchPage.feedback.saveFailedTitle'), {
        description: t('searchPage.feedback.nameRequired'),
      })
      return
    }

    const ownSave = {}
    const saveId = ++requestRevision.current
    activeSave.current = ownSave
    const ownsSave = () =>
      owner.current === currentOwner && activeSave.current === ownSave
    setState((prev) => ({ ...prev, saveId }))
    try {
      const normalizedConfig = normalizeModelConfig(config)
      const response = await updateSearch({
        search_id: searchApp.id,
        name: trimmedName,
        description: (basicInfo.description || '').trim() || undefined,
        avatar: basicInfo.avatar || '',
        tenant_id: searchApp.tenant_id,
        search_config: normalizedConfig as unknown as Record<string, unknown>,
      })
      if (!ownsSave()) return
      if (!isSaveAcknowledgement(response, searchApp))
        throw new Error('INVALID_SEARCH_SAVE_ACKNOWLEDGEMENT')
      const saved = getSnapshot(response)
      setState((prev) =>
        prev.epoch === state.epoch && prev.saveId === saveId
          ? {
              ...prev,
              saveId: null,
              saved,
              draft: prev.revision === state.revision ? saved : prev.draft,
              confirmedAt: getUpdateTime(response),
            }
          : prev,
      )
      toast.success(t('searchPage.feedback.saveTitle'), {
        description: t('searchPage.feedback.saveSuccess'),
      })
    } catch {
      if (!ownsSave()) return
      setState((prev) =>
        prev.epoch === state.epoch && prev.saveId === saveId
          ? { ...prev, saveId: null }
          : prev,
      )
      toast.error(t('searchPage.feedback.saveFailedTitle'), {
        description: t('searchPage.feedback.saveFailed'),
      })
    } finally {
      if (ownsSave()) activeSave.current = null
    }
  }, [t, state, searchApp, updateSearch])

  return {
    basicInfo: state.draft.basicInfo,
    config: state.draft.config,
    appliedConfig: state.saved.config,
    updateBasicInfo,
    updateConfig,
    saveConfig,
    isSaving: state.saveId !== null,
    isDirty: hasDraftChanges(state),
  }
}
