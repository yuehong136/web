import { Position, type Edge } from '@xyflow/react'
import humanIdModule from 'human-id'
import merge from 'lodash/merge'
import type {
  AgentCanvasType,
  AgentDsl,
  AgentGraph,
  AgentGraphNode,
  AgentNodeData,
  AgentOperator,
} from '@/types/agent'
import { AgentCanvasType as CanvasType } from '@/types/agent'
import { BeginId, Operator, type Operator as OperatorType } from '../constant'
import { getOperatorDefaultForm, mergeOperatorFormWithDefaults } from './defaults'
import { getOperatorDefinition } from './registry'
import type {
  BuildGraphNodeOptions,
  DeserializeDslOptions,
  ReconstructedGraph,
  SerializeGraphOptions,
} from './types'

const DEFAULT_GRAPH_POSITION = { x: 120, y: 120 }
const DEFAULT_EDGE_TYPE = 'buttonEdge'
const createHumanId =
  (humanIdModule as { default?: () => string; humanId?: () => string }).default ||
  (humanIdModule as { humanId?: () => string }).humanId ||
  (() => crypto.randomUUID())

function normalizeEdge(edge: Edge): Edge {
  return {
    ...edge,
    type: edge.type || DEFAULT_EDGE_TYPE,
  }
}

function buildNodeId(operator: OperatorType) {
  if (operator === Operator.Begin) {
    return BeginId
  }

  return `${operator}:${createHumanId()}`
}

export function createDefaultNodeData(
  operator: OperatorType,
  overrides: Partial<AgentNodeData> = {},
): AgentNodeData {
  const definition = getOperatorDefinition(operator)
  const baseForm = getOperatorDefaultForm(operator)

  return {
    label: operator,
    name: definition?.defaultName || operator,
    form: merge({}, baseForm, overrides.form || {}),
    ...overrides,
  }
}

export function buildGraphNode(
  operator: OperatorType,
  options: BuildGraphNodeOptions = {},
): AgentGraphNode {
  const definition = getOperatorDefinition(operator)
  const position = options.position || DEFAULT_GRAPH_POSITION

  return {
    id: options.id || buildNodeId(operator),
    type: options.type || definition?.nodeType || 'ragNode',
    position,
    parentId: options.parentId,
    data: createDefaultNodeData(operator, {
      name: options.name || definition?.defaultName || operator,
      form: options.form,
    }),
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }
}

function reconstructGraphFromComponents(
  components: NonNullable<AgentDsl['components']>,
): AgentGraph {
  const entries = Object.entries(components)
  const nodes = entries.map(([id, component], index) => {
    const operator = component.obj.component_name as OperatorType
    return buildGraphNode(operator, {
      id,
      form: component.obj.params,
      parentId: component.parent_id,
      position: {
        x: DEFAULT_GRAPH_POSITION.x + (index % 4) * 280,
        y: DEFAULT_GRAPH_POSITION.y + Math.floor(index / 4) * 180,
      },
    })
  })

  const edges = entries.flatMap(([id, component]) =>
    (component.downstream || []).map((target, edgeIndex) => ({
      id: `${id}:${target}:${edgeIndex}`,
      source: id,
      target,
      type: DEFAULT_EDGE_TYPE,
    })),
  )

  return { nodes, edges }
}

export function deserializeDslToGraph(
  dsl: Partial<AgentDsl> | undefined,
  options: DeserializeDslOptions = {},
): ReconstructedGraph {
  const graph = dsl?.graph

  if (graph?.nodes?.length || graph?.edges?.length) {
    const nodes = (graph.nodes || []).map((node) => {
      const component = dsl?.components?.[node.id]
      const operator = (node.data?.label || component?.obj?.component_name || Operator.Note) as OperatorType
      const definition = getOperatorDefinition(operator)

      return {
        ...node,
        type: node.type || definition?.nodeType || 'ragNode',
        data: {
          ...node.data,
          label: operator,
          name: node.data?.name || definition?.defaultName || operator,
          form: mergeOperatorFormWithDefaults(
            operator,
            (component?.obj?.params as Record<string, unknown>) ||
              (node.data?.form as Record<string, unknown> | undefined),
          ),
        },
      }
    })

    return {
      graph: {
        nodes,
        edges: (graph.edges || []).map(normalizeEdge),
      },
      isReconstructed: false,
    }
  }

  const canvasType = options.canvasType || inferCanvasTypeFromGraph(undefined)
  if (!dsl?.components || Object.keys(dsl.components).length === 0) {
    return {
      graph: buildInitialGraph(canvasType),
      isReconstructed: true,
    }
  }

  return {
    graph: reconstructGraphFromComponents(dsl?.components || {}),
    isReconstructed: true,
  }
}

export function buildDslComponentsByGraph(
  nodes: AgentGraphNode[],
  edges: Edge[],
): NonNullable<AgentDsl['components']> {
  return nodes.reduce<NonNullable<AgentDsl['components']>>((components, node) => {
    const operator = node.data.label as OperatorType
    if (!getOperatorDefinition(operator) || getOperatorDefinition(operator)?.excludeFromDsl) {
      return components
    }

    components[node.id] = {
      obj: {
        component_name: operator,
        params: mergeOperatorFormWithDefaults(
          operator,
          node.data.form as Record<string, unknown> | undefined,
        ),
      },
      downstream: edges.filter((edge) => edge.source === node.id).map((edge) => edge.target),
      upstream: edges.filter((edge) => edge.target === node.id).map((edge) => edge.source),
      parent_id: node.parentId,
    } satisfies AgentOperator

    return components
  }, {})
}

export function serializeGraphToDsl({
  graph,
  baseDsl,
}: SerializeGraphOptions): AgentDsl {
  const filteredNodes = (graph.nodes || []).filter((node) => {
    return !getOperatorDefinition(node.data.label as OperatorType)?.excludeFromDsl
  })
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id))
  const filteredEdges = (graph.edges || [])
    .filter((edge) => filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target))
    .map(normalizeEdge)

  return {
    components: buildDslComponentsByGraph(filteredNodes, filteredEdges),
    history: baseDsl?.history || [],
    path: baseDsl?.path ?? [],
    answer: baseDsl?.answer,
    graph: {
      nodes: filteredNodes,
      edges: filteredEdges,
    },
    messages: baseDsl?.messages || [],
    reference: baseDsl?.reference || [],
    globals: baseDsl?.globals || {},
    variables: (baseDsl?.variables as AgentDsl['variables']) || {},
    retrieval: baseDsl?.retrieval || [],
  }
}

export function buildInitialGraph(kind: AgentCanvasType): AgentGraph {
  const rootOperator =
    kind === CanvasType.PIPELINE ? Operator.File : Operator.Begin
  return {
    nodes: [buildGraphNode(rootOperator)],
    edges: [],
  }
}

export function buildInitialDsl(kind: AgentCanvasType): AgentDsl {
  return serializeGraphToDsl({
    graph: buildInitialGraph(kind),
    baseDsl: {
      history: [],
      messages: [],
      reference: [],
      globals: {},
      variables: {},
      retrieval: [],
      path: [],
    },
  })
}

export function inferCanvasTypeFromGraph(graph: AgentGraph | undefined): AgentCanvasType {
  const labels = new Set((graph?.nodes || []).map((node) => node.data.label))
  if (
    labels.has(Operator.File) ||
    labels.has(Operator.Parser) ||
    labels.has(Operator.Tokenizer) ||
    labels.has(Operator.Splitter) ||
    labels.has(Operator.Extractor)
  ) {
    return CanvasType.PIPELINE
  }
  return CanvasType.AGENT
}
