import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { agentAPI } from '@/api/agent'
import { normalizeParserPipelinePage } from '@/components/knowledge/document-parser/catalog'

const PAGE_SIZE = 50
export const documentParserPipelineKeys = {
  scope: (actorKey: number, datasetId: string, tenantId: string) =>
    [
      'document-parser-pipelines',
      actorKey,
      datasetId,
      tenantId,
      'dataflow_canvas',
    ] as const,
  list: (
    actorKey: number,
    datasetId: string,
    tenantId: string,
    keywords: string,
  ) =>
    [
      ...documentParserPipelineKeys.scope(actorKey, datasetId, tenantId),
      'list',
      keywords,
      PAGE_SIZE,
    ] as const,
  selected: (
    actorKey: number,
    datasetId: string,
    tenantId: string,
    id: string,
  ) =>
    [
      ...documentParserPipelineKeys.scope(actorKey, datasetId, tenantId),
      'selected',
      id,
      PAGE_SIZE,
    ] as const,
}

export function useDocumentParserPipelines({
  enabled,
  datasetId,
  tenantId,
  actorKey,
  keywords,
  selectedId,
}: {
  enabled: boolean
  datasetId: string
  tenantId: string
  actorKey: number
  keywords: string
  selectedId: string
}) {
  const fetchPage = async (page: number, search: string) =>
    normalizeParserPipelinePage(
      await agentAPI.listAgents({
        page,
        page_size: PAGE_SIZE,
        keywords: search,
        canvas_category: 'dataflow_canvas',
      }),
      tenantId,
      page,
      PAGE_SIZE,
    )
  const active = enabled && !!datasetId && !!tenantId
  const list = useInfiniteQuery({
    queryKey: documentParserPipelineKeys.list(
      actorKey,
      datasetId,
      tenantId,
      keywords,
    ),
    enabled: active,
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchPage(pageParam, keywords),
    getNextPageParam: (page) =>
      page.page * page.pageSize < page.total ? page.page + 1 : undefined,
    retry: false,
  })
  // Search and the first page cannot establish that a retained selection disappeared.
  const selected = useQuery({
    queryKey: documentParserPipelineKeys.selected(
      actorKey,
      datasetId,
      tenantId,
      selectedId,
    ),
    enabled: active && !!selectedId,
    queryFn: async () => {
      let page = 1
      while (true) {
        const result = await fetchPage(page, '')
        const found = result.rows.find((row) => row.id === selectedId)
        if (found) return found
        if (page * PAGE_SIZE >= result.total) return null
        page += 1
      }
    },
    retry: false,
  })
  const rows = list.data?.pages.flatMap((page) => page.rows) ?? []
  const selectedRow = selected.data ?? rows.find((row) => row.id === selectedId)
  return {
    ...list,
    isPending: active && list.isPending,
    rows,
    selectedRow,
    selectedLoading: active && !!selectedId && selected.isPending,
    selectedUnavailable:
      !!selectedId &&
      (!active || selected.isError || (!selected.isPending && !selectedRow)),
  }
}
