import type { Edge } from '@xyflow/react'
import { NodeHandleId, Operator } from '../constant'

// 递归删除Agent节点的所有下游Agent和Tool节点
export function deleteAllDownstreamAgentsAndTool(
  nodeId: string,
  edges: Edge[],
): {
  downstreamAgentAndToolNodeIds: string[]
  downstreamAgentAndToolEdges: Edge[]
} {
  const downstreamAgentAndToolNodeIds: string[] = []
  const downstreamAgentAndToolEdges: Edge[] = []

  // 找到该Agent节点的所有工具节点
  const toolEdges = edges.filter(
    (x) => x.source === nodeId && x.sourceHandle === NodeHandleId.Tool,
  )
  toolEdges.forEach((edge) => {
    downstreamAgentAndToolNodeIds.push(edge.target)
    downstreamAgentAndToolEdges.push(edge)
  })

  // 找到该Agent节点的所有子Agent节点
  const agentEdges = edges.filter(
    (x) =>
      x.source === nodeId &&
      x.sourceHandle === NodeHandleId.AgentBottom &&
      x.target.startsWith(Operator.Agent),
  )

  agentEdges.forEach((edge) => {
    downstreamAgentAndToolNodeIds.push(edge.target)
    downstreamAgentAndToolEdges.push(edge)

    // 递归删除子Agent的下游节点
    const childResult = deleteAllDownstreamAgentsAndTool(edge.target, edges)
    downstreamAgentAndToolNodeIds.push(
      ...childResult.downstreamAgentAndToolNodeIds,
    )
    downstreamAgentAndToolEdges.push(...childResult.downstreamAgentAndToolEdges)
  })

  return {
    downstreamAgentAndToolNodeIds,
    downstreamAgentAndToolEdges,
  }
}

// 判断节点是否是Agent的子节点
export function isBottomSubAgent(edges: Edge[], nodeId?: string) {
  const edge = edges.find(
    (x) => x.target === nodeId && x.targetHandle === NodeHandleId.AgentTop,
  )
  return !!edge
}

// 判断节点是否有子Agent或Tool
export function hasSubAgentOrTool(edges: Edge[], nodeId?: string) {
  const edge = edges.find(
    (x) =>
      x.source === nodeId &&
      (x.sourceHandle === NodeHandleId.Tool ||
        x.sourceHandle === NodeHandleId.AgentBottom),
  )
  return !!edge
}

// 判断节点是否有子Agent
export function hasSubAgent(edges: Edge[], nodeId?: string) {
  const edge = edges.find(
    (x) => x.source === nodeId && x.sourceHandle === NodeHandleId.AgentBottom,
  )
  return !!edge
}

