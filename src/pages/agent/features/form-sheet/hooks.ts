import { useMemo } from 'react'
import { useFetchMCPServers } from '@/hooks/use-mcp-request'
import { useTranslation } from 'react-i18next'
import { Operator, type Operator as OperatorType } from '../../constant'
import { useCalculateSheetRight } from '../../hooks/use-calculate-sheet-right'
import { getOperatorDefinition } from '../../operators'
import useGraphStore from '../../store'
import type { RAGFlowNodeType } from '../../types'
import type { ResolvedFormSheetContext } from './types'
import {
  canShowSingleStepDebug,
  isFormSheetTitleEditable,
  resolveFormSheetDescription,
  resolveFormSheetIconKey,
  resolveLegacyRendererKey,
  resolveSelectedToolContext,
} from './utils'

export function useFormSheetOffsetClass(runtimeDrawerVisible = false) {
  const runtimeDrawerOffset = useCalculateSheetRight()

  return runtimeDrawerVisible ? runtimeDrawerOffset : ''
}

export function useResolvedFormSheetContext(
  node?: RAGFlowNodeType,
): ResolvedFormSheetContext {
  const { t } = useTranslation()
  const operatorType = node?.data?.label as OperatorType | undefined
  const operatorDefinition = useMemo(
    () => getOperatorDefinition(operatorType),
    [operatorType],
  )
  const nodes = useGraphStore((state) => state.nodes)
  const edges = useGraphStore((state) => state.edges)
  const clickedToolId = useGraphStore((state) => state.clickedToolId)
  const { data: mcpServersData } = useFetchMCPServers({
    page_size: 200,
    enabled: operatorType === Operator.Tool && Boolean(clickedToolId),
  })
  const mcpServers = mcpServersData?.mcp_servers

  const toolContext = useMemo(
    () =>
      resolveSelectedToolContext({
        operatorType,
        clickedToolId,
        currentNodeId: node?.id,
        nodes,
        edges,
        mcpServers,
      }),
    [clickedToolId, edges, mcpServers, node?.id, nodes, operatorType],
  )

  return useMemo(
    () => ({
      node,
      operatorType,
      operatorDefinition,
      toolContext,
      iconKey: resolveFormSheetIconKey({
        operatorType,
        operatorDefinition,
        toolContext,
      }),
      description: resolveFormSheetDescription({
        operatorType,
        operatorDefinition,
        toolContext,
        t,
      }),
      titleEditable: isFormSheetTitleEditable(operatorDefinition),
      debugEnabled: canShowSingleStepDebug(operatorDefinition),
      rendererKey: resolveLegacyRendererKey(operatorType),
    }),
    [node, operatorType, operatorDefinition, toolContext, t],
  )
}
