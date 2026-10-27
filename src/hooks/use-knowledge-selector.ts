import { useEffect, useMemo, useState } from 'react'
import {
  useInfiniteQuery,
  useQueries,
  useQueryClient,
} from '@tanstack/react-query'
import { knowledgeAPI } from '@/api/knowledge'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { knowledgeKeys } from '@/hooks/use-knowledge-request'
import type { KnowledgeBase } from '@/types/api'

type LoadKnowledge = (
  search?: string,
  page?: number,
) => Promise<{ kbs: KnowledgeBase[]; total: number }>

const loadKnowledge: LoadKnowledge = (keywords, page) =>
  knowledgeAPI.knowledgeBase.list({ keywords, page, page_size: 20 })

export function useKnowledgeSelector(
  selectedIds: string[],
  initial: KnowledgeBase[],
  extra: KnowledgeBase[],
  open: boolean,
  load: LoadKnowledge = loadKnowledge,
) {
  const [searchValue, setSearchValue] = useState('')
  const keywords = useDebouncedValue(searchValue.trim(), 300)
  const queryClient = useQueryClient()
  const query = useInfiniteQuery({
    queryKey: [...knowledgeKeys.lists(), 'selector', keywords],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => load(keywords, pageParam),
    getNextPageParam: (last, pages) =>
      last.kbs.length > 0 &&
      pages.reduce((count, page) => count + page.kbs.length, 0) < last.total
        ? pages.length + 1
        : undefined,
    enabled: open,
  })
  const known = useMemo(
    () =>
      new Map(
        [
          ...initial,
          ...extra,
          ...(query.data?.pages.flatMap((page) => page.kbs) ?? []),
        ].map((kb) => [kb.id, kb]),
      ),
    [initial, extra, query.data],
  )
  const details = useQueries({
    queries: selectedIds.map((id) => ({
      queryKey: knowledgeKeys.detail(id),
      queryFn: () => knowledgeAPI.knowledgeBase.get(id),
      enabled: !known.has(id),
      staleTime: 5 * 60 * 1000,
    })),
  })
  const selectedKbs = selectedIds.map(
    (id, index) => known.get(id) ?? details[index].data,
  )
  useEffect(() => {
    for (const id of selectedIds) {
      const kb = known.get(id)
      if (kb && queryClient.getQueryData(knowledgeKeys.detail(id)) !== kb) {
        queryClient.setQueryData(knowledgeKeys.detail(id), kb)
      }
    }
  }, [known, queryClient, selectedIds])
  // Unknown selected models fail closed until their detail is resolved.
  const unresolved = selectedKbs.some((kb) => !kb?.embd_id)
  const selectedModels = new Set(selectedKbs.map((kb) => kb?.embd_id))
  const isDisabled = (kb: KnowledgeBase) =>
    !selectedIds.includes(kb.id) &&
    selectedIds.length > 0 &&
    (unresolved || selectedModels.size !== 1 || !selectedModels.has(kb.embd_id))
  const isSearching = query.isFetching || keywords !== searchValue.trim()
  const displayKbs = [
    ...new Map(
      (query.data?.pages.flatMap((page) => page.kbs) ?? initial)
        .filter((kb) => kb.parser_id !== 'tag')
        .map((kb) => [kb.id, kb]),
    ).values(),
  ]
  return {
    searchValue,
    setSearchValue,
    selectedKbs,
    isDisabled,
    isSearching,
    displayKbs: keywords === searchValue.trim() ? displayKbs : [],
    isError: query.isError,
    retry: () => void query.refetch(),
    hasNextPage: query.hasNextPage,
    loadMore: () => void query.fetchNextPage(),
  }
}
