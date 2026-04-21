import { useMemo } from 'react'
import { useFetchMCPServers } from '@/hooks/use-mcp-request'
import { Operator } from '../../constant'
import { resolveSelectedToolContext } from '../../features/form-sheet/utils'
import useGraphStore from '../../store'
import type { RAGFlowNodeType } from '../../types'

export function useSelectedTool(node?: RAGFlowNodeType) {
  const clickedToolId = useGraphStore((state) => state.clickedToolId)
  const nodes = useGraphStore((state) => state.nodes)
  const edges = useGraphStore((state) => state.edges)
  const { data } = useFetchMCPServers({
    page_size: 200,
    enabled: Boolean(clickedToolId),
  })

  return useMemo(
    () =>
      resolveSelectedToolContext({
        operatorType: Operator.Tool,
        clickedToolId,
        currentNodeId: node?.id,
        nodes,
        edges,
        mcpServers: data?.mcp_servers,
      }),
    [clickedToolId, data?.mcp_servers, edges, node?.id, nodes],
  )
}
