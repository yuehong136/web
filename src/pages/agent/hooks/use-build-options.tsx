import { type ReactNode, useMemo } from 'react'
import type { Edge } from '@xyflow/react'
import { get, isEmpty } from 'lodash'
import { AgentStructuredOutputField, JsonSchemaDataType, Operator } from '../constant'
import OperatorIcon from '../operator-icon'
import useGraphStore from '../store'
import type { RAGFlowNodeType } from '../types'

type OutputOption = {
  label: string
  value: string
  parentLabel?: string
  icon?: ReactNode
  type?: string
}

function filterAllUpstreamNodeIds(edges: Edge[], nodeIds: string[]) {
  return nodeIds.reduce<string[]>((pre, nodeId) => {
    const currentEdges = edges.filter((x) => x.target === nodeId)
    const upstreamNodeIds: string[] = currentEdges.map((x) => x.source)
    const ids = upstreamNodeIds.concat(
      filterAllUpstreamNodeIds(edges, upstreamNodeIds),
    )

    ids.forEach((id) => {
      if (pre.every((x) => x !== id)) {
        pre.push(id)
      }
    })

    return pre
  }, [])
}

function isAgentStructured(nodeId?: string, label?: string) {
  return (
    label === AgentStructuredOutputField &&
    typeof nodeId === 'string' &&
    nodeId.startsWith(`${Operator.Agent}:`)
  )
}

function buildVariableValue(value: string, nodeId?: string) {
  return `${nodeId}@${value}`
}

function buildSecondaryOutputOptions(
  outputs: Record<string, any> = {},
  nodeId?: string,
  parentLabel?: string,
  icon?: ReactNode,
) {
  return Object.keys(outputs).map<OutputOption>((key) => ({
    label: key,
    value: buildVariableValue(key, nodeId),
    parentLabel,
    icon,
    type: isAgentStructured(nodeId, key)
      ? JsonSchemaDataType.Object
      : outputs[key]?.type,
  }))
}

function buildOutputOptions(node: RAGFlowNodeType) {
  return {
    label: node.data.name,
    value: node.id,
    title: node.data.name,
    options: buildSecondaryOutputOptions(
      get(node, 'data.form.outputs', {}),
      node.id,
      node.data.name,
      <OperatorIcon name={node.data.label as Operator} />,
    ),
  }
}

function buildNodeOutputOptions({
  nodes,
  nodeIds,
}: {
  nodes: RAGFlowNodeType[]
  nodeIds: string[]
}) {
  const nodeWithOutputList = nodes.filter(
    (x) => nodeIds.some((y) => y === x.id) && !isEmpty(x.data?.form?.outputs),
  )

  return nodeWithOutputList.map((node) => buildOutputOptions(node))
}

function buildUpstreamNodeOutputOptions({
  nodes,
  edges,
  nodeId,
}: {
  nodes: RAGFlowNodeType[]
  edges: Edge[]
  nodeId?: string
}) {
  if (!nodeId) return []
  const upstreamIds = filterAllUpstreamNodeIds(edges, [nodeId])
  return buildNodeOutputOptions({ nodes, nodeIds: upstreamIds })
}

export function useBuildNodeOutputOptions(nodeId?: string) {
  const nodes = useGraphStore((state) => state.nodes)
  const edges = useGraphStore((state) => state.edges)

  return useMemo(() => {
    return buildUpstreamNodeOutputOptions({ nodes, edges, nodeId })
  }, [edges, nodeId, nodes])
}
