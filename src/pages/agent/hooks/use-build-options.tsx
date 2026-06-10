import { type ReactNode, useMemo } from 'react'
import type { Edge } from '@xyflow/react'
import get from 'lodash/get.js'
import isEmpty from 'lodash/isEmpty.js'
import {
  AgentStructuredOutputField,
  JsonSchemaDataType,
  Operator,
} from '../constant'
import OperatorIcon from '../operator-icon'
import useGraphStore from '../store'
import type { RAGFlowNodeType } from '../types'
import { getCodeNodeOutputs, type CodeOutputMap } from '../utils/code-outputs'

type OutputOption = {
  label: string
  value: string
  parentLabel?: string
  icon?: ReactNode
  type?: string
}

type OutputMap = Record<string, { type?: string } | undefined>

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
  outputs: OutputMap = {},
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
      getNodeOutputs(node),
      node.id,
      node.data.name,
      <OperatorIcon name={node.data.label as Operator} />,
    ),
  }
}

function getNodeOutputs(node: RAGFlowNodeType) {
  const outputs = get(node, 'data.form.outputs', {}) as CodeOutputMap
  if (node.data.label !== Operator.Code) {
    return outputs
  }

  return getCodeNodeOutputs(outputs)
}

function buildNodeOutputOptions({
  nodes,
  nodeIds,
}: {
  nodes: RAGFlowNodeType[]
  nodeIds: string[]
}) {
  const nodeWithOutputList = nodes.filter(
    (x) => nodeIds.some((y) => y === x.id) && !isEmpty(getNodeOutputs(x)),
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
