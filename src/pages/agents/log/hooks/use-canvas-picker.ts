import { useMemo, useState } from 'react'
import { useFetchAgentList } from '@/hooks/use-agent-request'

export function useCanvasPicker() {
  const [keyword, setKeyword] = useState('')
  const query = useFetchAgentList({
    page: 1,
    page_size: 50,
    keywords: keyword,
    orderby: 'update_time',
    desc: true,
  })

  const recentAgents = useMemo(
    () =>
      [...query.agents]
        .sort((a, b) => (b.update_time || 0) - (a.update_time || 0))
        .slice(0, 5),
    [query.agents],
  )

  return {
    keyword,
    setKeyword,
    agents: query.agents,
    recentAgents,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}
