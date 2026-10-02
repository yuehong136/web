import { useContext, useEffect, useMemo, useCallback } from 'react'
import { Position } from '@xyflow/react'
import { humanId } from 'human-id'
import { hasServerTools, useFetchMCPServers } from '@/hooks/use-mcp-request'
import { AgentInstanceContext } from '../../context'
import { NodeHandleId, Operator } from '../../constant'
import { useAgentToolInitialValues } from '../../hooks/use-agent-tool-initial-values'
import useGraphStore from '../../store'
import type { IAgentForm, RAGFlowNodeType } from '../../types'

type AgentToolRecord = NonNullable<IAgentForm['tools']>[number]
type AgentMcpRecord = NonNullable<IAgentForm['mcp']>[number]

function getToolList(node?: RAGFlowNodeType) {
  const tools = node?.data?.form?.tools
  return Array.isArray(tools) ? (tools as AgentToolRecord[]) : []
}

function getMcpList(node?: RAGFlowNodeType) {
  const mcp = node?.data?.form?.mcp
  return Array.isArray(mcp) ? (mcp as AgentMcpRecord[]) : []
}

function buildToolId(operator: Operator) {
  return `${operator}:${humanId()}`
}

function buildToolName(operator: Operator, tools: AgentToolRecord[]) {
  const lastIndex = tools
    .filter((item) => item.component_name === operator)
    .reduce((maxIndex, item) => {
      const matchedIndex = item.name?.match(/(\d+)$/)?.[1]
      const nextIndex =
        typeof matchedIndex === 'string' ? Number(matchedIndex) : NaN

      return Number.isFinite(nextIndex)
        ? Math.max(maxIndex, nextIndex)
        : maxIndex
    }, -1)

  return `${operator}_${lastIndex + 1}`
}

export function useAgentToolState(node?: RAGFlowNodeType) {
  const tools = useMemo(() => getToolList(node), [node])
  const mcp = useMemo(() => getMcpList(node), [node])

  return { tools, mcp }
}

export function useAgentToolActions(node?: RAGFlowNodeType) {
  const updateNodeForm = useGraphStore((state) => state.updateNodeForm)
  const { initializeAgentToolValues } = useAgentToolInitialValues()
  const { tools, mcp } = useAgentToolState(node)
  const { data } = useFetchMCPServers({ page_size: 200 })

  const nodeId = node?.id
  const servers = data?.mcp_servers
  const appendTool = useCallback(
    (operator: Operator) => {
      if (!nodeId) {
        return
      }

      const nextTools = [
        ...tools,
        {
          component_name: operator,
          id: buildToolId(operator),
          name: buildToolName(operator, tools),
          params: initializeAgentToolValues(operator),
        },
      ]

      updateNodeForm(nodeId, nextTools, ['tools'])
    },
    [initializeAgentToolValues, nodeId, tools, updateNodeForm],
  )

  const toggleTool = useCallback(
    (operator: Operator) => {
      if (!nodeId) {
        return
      }

      if (operator === Operator.Retrieval) {
        appendTool(operator)
        return
      }

      const exists = tools.some((item) => item.component_name === operator)
      const nextTools = exists
        ? tools.filter((item) => item.component_name !== operator)
        : [
            ...tools,
            {
              component_name: operator,
              id: buildToolId(operator),
              name: operator,
              params: initializeAgentToolValues(operator),
            },
          ]

      updateNodeForm(nodeId, nextTools, ['tools'])
    },
    [appendTool, initializeAgentToolValues, nodeId, tools, updateNodeForm],
  )

  const removeTool = useCallback(
    (toolId: string) => {
      if (!nodeId) {
        return
      }

      updateNodeForm(
        nodeId,
        tools.filter((item) => item.id !== toolId),
        ['tools'],
      )
    },
    [nodeId, tools, updateNodeForm],
  )

  const setMcpIds = useCallback(
    (ids: string[]) => {
      if (!nodeId) {
        return
      }

      const nextMcp = ids.reduce<AgentMcpRecord[]>((result, id) => {
        const current = mcp.find((item) => item?.mcp_id === id)
        if (current) {
          result.push(current)
          return result
        }

        const server = servers?.find((item) => item.id === id)
        if (server && hasServerTools(server)) {
          result.push({ mcp_id: id, tools: {} })
        }

        return result
      }, [])

      updateNodeForm(nodeId, nextMcp, ['mcp'])
    },
    [servers, mcp, nodeId, updateNodeForm],
  )

  const removeMcp = useCallback(
    (mcpId: string) => {
      if (!nodeId) {
        return
      }

      updateNodeForm(
        nodeId,
        mcp.filter((item) => item?.mcp_id !== mcpId),
        ['mcp'],
      )
    },
    [mcp, nodeId, updateNodeForm],
  )

  return {
    appendTool,
    toggleTool,
    removeTool,
    setMcpIds,
    removeMcp,
  }
}

export function useSyncAgentToolNode(node?: RAGFlowNodeType) {
  const { addCanvasNode } = useContext(AgentInstanceContext)
  const { tools, mcp } = useAgentToolState(node)
  const findAgentToolNodeById = useGraphStore(
    (state) => state.findAgentToolNodeById,
  )
  const deleteAgentToolNodeById = useGraphStore(
    (state) => state.deleteAgentToolNodeById,
  )

  const toolNodeId = node?.id ? findAgentToolNodeById(node.id) : undefined
  const total = tools.length + mcp.length

  useEffect(() => {
    if (!node?.id) {
      return
    }

    if (total === 0) {
      if (toolNodeId) {
        deleteAgentToolNodeById(node.id)
      }
      return
    }

    if (!toolNodeId) {
      addCanvasNode(Operator.Tool, {
        nodeId: node.id,
        position: Position.Bottom,
        id: NodeHandleId.Tool,
      })()
    }
  }, [addCanvasNode, deleteAgentToolNodeById, node?.id, toolNodeId, total])

  return toolNodeId
}
