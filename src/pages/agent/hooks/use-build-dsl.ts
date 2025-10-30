import { useCallback } from 'react'
import type { RAGFlowNodeType, DSLComponents } from '../types'
import { Operator } from '../constant'
import type { Edge } from '@xyflow/react'
import useGraphStore from '../store'

// 构建DSL组件
const buildDslComponentsByGraph = (
  nodes: RAGFlowNodeType[],
  edges: Edge[],
): DSLComponents => {
  const components: DSLComponents = {}

  const ExcludeOperators = [Operator.Note, Operator.Tool, Operator.Placeholder]

  nodes
    ?.filter((x) => !ExcludeOperators.some((y) => y === x.data.label))
    .forEach((x) => {
      const id = x.id
      const operatorName = x.data.label
      const params = x?.data.form ?? {}

      // 构建downstream和upstream
      const downstream = edges
        .filter((y) => y.source === id)
        .map((y) => y.target)

      const upstream = edges
        .filter((y) => y.target === id)
        .map((y) => y.source)

      components[id] = {
        obj: {
          component_name: operatorName,
          params: params ?? {},
        },
        downstream,
        upstream,
        parent_id: x?.parentId,
      }
    })

  return components
}

export const useBuildDslData = () => {
  const { nodes, edges } = useGraphStore((state) => state)

  const buildDslData = useCallback(
    (currentNodes?: RAGFlowNodeType[]) => {
      const nodesToProcess = currentNodes ?? nodes

      // 过滤掉Placeholder节点
      const filteredNodes = nodesToProcess.filter(
        (node) => node.data?.label !== Operator.Placeholder,
      )

      const filteredEdges = edges.filter((edge) => {
        const sourceNode = nodesToProcess.find(
          (node) => node.id === edge.source,
        )
        const targetNode = nodesToProcess.find(
          (node) => node.id === edge.target,
        )
        return (
          sourceNode?.data?.label !== Operator.Placeholder &&
          targetNode?.data?.label !== Operator.Placeholder
        )
      })

      const dslComponents = buildDslComponentsByGraph(
        filteredNodes,
        filteredEdges,
      )

      return {
        components: dslComponents,
        history: [],
        graph: { nodes: filteredNodes, edges: filteredEdges },
        messages: [],
        reference: [],
        globals: {},
        retrieval: [],
      }
    },
    [edges, nodes],
  )

  return { buildDslData }
}

