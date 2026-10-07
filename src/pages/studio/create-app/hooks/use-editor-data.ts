import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { dialogAPI } from '@/api/dialog'
import { knowledgeAPI } from '@/api/knowledge'
import { llmAPI } from '@/api/llm'
import { dialogKeys } from '@/hooks/use-dialog-apps'
import { knowledgeKeys } from '@/hooks/use-knowledge-request'
import { llmKeys } from '@/hooks/use-llm-request'
import {
  buildKnowledgeFallback,
  mapLLMProviders,
  type DialogDetailResponse,
} from '../data'
import { KNOWLEDGE_PAGE_SIZE } from '../constants'

export function useEditorData(
  id: string | null,
  kbIds: string[],
  search: string,
  page: number,
  pickerOpen: boolean,
) {
  const detail = useQuery({
    queryKey: dialogKeys.detail(id ?? ''),
    queryFn: () => dialogAPI.getDetail(id!),
    enabled: !!id,
    refetchOnWindowFocus: false,
  })
  const models = useQuery({
    queryKey: llmKeys.myLLMs(),
    queryFn: () => llmAPI.getMyLLMs(),
  })
  const mappedModels = useMemo(
    () => mapLLMProviders(models.data ?? {}),
    [models.data],
  )
  const params = {
    keywords: search,
    page,
    page_size: KNOWLEDGE_PAGE_SIZE,
    orderby: 'create_time',
    desc: true,
  }
  const knowledge = useQuery({
    queryKey: knowledgeKeys.list(params),
    queryFn: () => knowledgeAPI.knowledgeBase.list(params),
    enabled: pickerOpen,
  })
  const selectedQueries = useQueries({
    queries: kbIds.map((kbId) => ({
      queryKey: knowledgeKeys.detail(kbId),
      queryFn: () => knowledgeAPI.knowledgeBase.get(kbId),
    })),
  })
  const knowledgeBases = kbIds.map(
    (kbId, index) =>
      selectedQueries[index].data ??
      buildKnowledgeFallback(
        (detail.data ?? {}) as DialogDetailResponse,
        kbId,
        index,
      ),
  )
  return { detail, models, mappedModels, knowledge, knowledgeBases }
}
