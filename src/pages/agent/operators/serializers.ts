import { Position, type Edge } from '@xyflow/react'
import humanIdModule from 'human-id'
import type {
  AgentCanvasType,
  AgentDsl,
  AgentGlobalVariable,
  AgentGraph,
  AgentGraphNode,
  AgentNodeData,
  AgentOperator,
} from '@/types/agent'
import { AgentCanvasType as CanvasType } from '@/types/agent'
import {
  BeginId,
  FileId,
  NodeHandleId,
  Operator,
  RewriteQuestionHandleId,
  SwitchElseTo,
  type Operator as OperatorType,
} from '../constant'
import { normalizeIterationNodes } from '../iteration-layout'
import {
  buildCategorizeListFromObject,
  generateSwitchHandleText,
  isBottomSubAgent,
} from '../utils'
import {
  buildDefaultDslGlobals,
  buildDslOperatorParams,
  mergeOperatorFormWithDefaults,
} from './defaults'
import { inferCanvasTypeFromGraph } from './canvas-type'
import {
  normalizeLegacyChunkerDsl,
  normalizeLegacyOperatorName,
} from './legacy-chunker-migration'
import {
  getOperatorDefinition,
  isDslOperator,
  isPersistedGraphOperator,
} from './registry'
import type {
  BuildGraphNodeOptions,
  DeserializeDslOptions,
  ReconstructedGraph,
  SerializeGraphOptions,
} from './types'

const DEFAULT_GRAPH_POSITION = { x: 120, y: 120 }
const DEFAULT_EDGE_TYPE = 'buttonEdge'
const COMPONENT_GRID_X_GAP = 280
const COMPONENT_GRID_Y_GAP = 180
const AGENT_CHILD_Y_OFFSET = 140
const AGENT_CHILD_X_OFFSET = 82
const AGENT_CHILD_X_GAP = 262
const TOOL_CHILD_X_OFFSET = -82
const createHumanId =
  (humanIdModule as { default?: () => string; humanId?: () => string })
    .default ||
  (humanIdModule as { humanId?: () => string }).humanId ||
  (() => crypto.randomUUID())

type FormRecord = Record<string, unknown>
type AgentToolEntry = {
  component_name?: string
  id?: string
  name?: string
  params?: FormRecord
}

export { normalizeLegacyChunkerDsl } from './legacy-chunker-migration'
export { inferCanvasTypeFromGraph } from './canvas-type'

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

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string' && value) {
    return [value]
  }

  return []
}

function buildGridPosition(index: number) {
  return {
    x: DEFAULT_GRAPH_POSITION.x + (index % 4) * COMPONENT_GRID_X_GAP,
    y: DEFAULT_GRAPH_POSITION.y + Math.floor(index / 4) * COMPONENT_GRID_Y_GAP,
  }
}

function buildEdgeId(
  source: string,
  target: string,
  sourceHandle?: string,
  targetHandle?: string,
) {
  return [
    source,
    sourceHandle || 'default-source',
    target,
    targetHandle || 'default-target',
  ].join(':')
}

function createGraphEdge({
  source,
  target,
  sourceHandle,
  targetHandle,
}: {
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}) {
  return normalizeEdge({
    id: buildEdgeId(source, target, sourceHandle, targetHandle),
    source,
    target,
    sourceHandle,
    targetHandle,
  })
}

function getDefaultSourceHandleId(operator?: OperatorType) {
  if (operator === Operator.RewriteQuestion) {
    return RewriteQuestionHandleId.Right
  }

  return NodeHandleId.Start
}

function getDefaultTargetHandleId(operator?: OperatorType) {
  if (operator === Operator.RewriteQuestion) {
    return RewriteQuestionHandleId.Left
  }

  return NodeHandleId.End
}

function canBuildDefaultDownstreamEdges(operator?: OperatorType) {
  return (
    operator !== Operator.Switch &&
    operator !== Operator.Categorize &&
    operator !== Operator.Message &&
    operator !== Operator.Tokenizer &&
    operator !== Operator.ExitLoop &&
    operator !== Operator.Tool &&
    operator !== Operator.Placeholder
  )
}

function normalizeComponentFormForGraph(
  operator: OperatorType,
  form?: FormRecord,
): FormRecord {
  const nextForm = { ...(form || {}) }

  if (operator === Operator.Agent && Array.isArray(nextForm.tools)) {
    nextForm.tools = (nextForm.tools as AgentToolEntry[]).filter(
      (tool) => tool?.component_name !== Operator.Agent,
    )
  }

  if (
    operator === Operator.Categorize &&
    !Array.isArray(nextForm.items) &&
    nextForm.category_description &&
    typeof nextForm.category_description === 'object'
  ) {
    nextForm.items = buildCategorizeListFromObject(
      nextForm.category_description as Record<string, never>,
    )
  }

  return nextForm
}

export function createDefaultNodeData(
  operator: OperatorType,
  overrides: Partial<AgentNodeData> = {},
): AgentNodeData {
  const definition = getOperatorDefinition(operator)
  const { form, ...restOverrides } = overrides

  return {
    label: operator,
    name: definition?.defaultName || operator,
    ...restOverrides,
    form: mergeOperatorFormWithDefaults(
      operator,
      form as Record<string, unknown> | undefined,
    ),
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
    ...(options.parentId ? { extent: 'parent' as const } : {}),
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
  const nodes: AgentGraphNode[] = []
  const edges: Edge[] = []
  const nodeMap = new Map<string, AgentGraphNode>()
  const edgeMap = new Map<string, Edge>()

  const ensureNode = (node: AgentGraphNode) => {
    if (!nodeMap.has(node.id)) {
      nodeMap.set(node.id, node)
      nodes.push(node)
    }

    return nodeMap.get(node.id) as AgentGraphNode
  }

  const ensureEdge = (edge: Edge) => {
    const normalizedEdge = normalizeEdge(edge)
    if (!edgeMap.has(normalizedEdge.id)) {
      edgeMap.set(normalizedEdge.id, normalizedEdge)
      edges.push(normalizedEdge)
    }
  }

  const buildAttachmentGraph = (
    parentNode: AgentGraphNode,
    form: FormRecord,
  ) => {
    const tools = Array.isArray(form.tools)
      ? (form.tools as AgentToolEntry[])
      : []
    const childAgents = tools.filter(
      (tool) => tool?.component_name === Operator.Agent,
    )
    const hasToolSummary =
      tools.some((tool) => tool?.component_name !== Operator.Agent) ||
      (Array.isArray(form.mcp) && form.mcp.length > 0)

    if (hasToolSummary) {
      const toolNode = ensureNode(
        buildGraphNode(Operator.Tool, {
          id: `${Operator.Tool}:${parentNode.id}`,
          parentId: parentNode.parentId,
          position: {
            x: parentNode.position.x + TOOL_CHILD_X_OFFSET,
            y: parentNode.position.y + AGENT_CHILD_Y_OFFSET,
          },
        }),
      )

      ensureEdge(
        createGraphEdge({
          source: parentNode.id,
          target: toolNode.id,
          sourceHandle: NodeHandleId.Tool,
          targetHandle: NodeHandleId.End,
        }),
      )
    }

    childAgents.forEach((tool, index) => {
      const childNode = ensureNode(
        buildGraphNode(Operator.Agent, {
          id: tool.id || buildNodeId(Operator.Agent),
          name: tool.name,
          form: normalizeComponentFormForGraph(Operator.Agent, tool.params),
          parentId: parentNode.parentId,
          position: {
            x:
              parentNode.position.x +
              AGENT_CHILD_X_OFFSET +
              index * AGENT_CHILD_X_GAP,
            y: parentNode.position.y + AGENT_CHILD_Y_OFFSET,
          },
        }),
      )

      ensureEdge(
        createGraphEdge({
          source: parentNode.id,
          target: childNode.id,
          sourceHandle: NodeHandleId.AgentBottom,
          targetHandle: NodeHandleId.AgentTop,
        }),
      )

      buildAttachmentGraph(childNode, tool.params || {})
    })

    toStringArray(form.exception_goto)
      .filter((target) => nodeMap.has(target))
      .forEach((target) => {
        ensureEdge(
          createGraphEdge({
            source: parentNode.id,
            target,
            sourceHandle: NodeHandleId.AgentException,
            targetHandle: NodeHandleId.End,
          }),
        )
      })
  }

  entries.forEach(([id, component], index) => {
    const operator = component.obj.component_name as OperatorType
    ensureNode(
      buildGraphNode(operator, {
        id,
        form: normalizeComponentFormForGraph(operator, component.obj.params),
        parentId: component.parent_id,
        position: buildGridPosition(index),
      }),
    )
  })

  entries.forEach(([id, component]) => {
    const node = nodeMap.get(id)
    const operator = component.obj.component_name as OperatorType
    const form = component.obj.params as FormRecord

    if (node) {
      if (canBuildDefaultDownstreamEdges(operator)) {
        ;(component.downstream || []).forEach((target) => {
          const targetNode = nodeMap.get(target)
          if (!targetNode) {
            return
          }

          ensureEdge(
            createGraphEdge({
              source: id,
              target,
              sourceHandle: getDefaultSourceHandleId(operator),
              targetHandle: getDefaultTargetHandleId(
                targetNode.data.label as OperatorType,
              ),
            }),
          )
        })
      }

      if (operator === Operator.Switch) {
        const conditions = Array.isArray(form.conditions)
          ? (form.conditions as Array<Record<string, unknown>>)
          : []

        conditions.forEach((condition, index) => {
          toStringArray(condition.to)
            .filter((target) => nodeMap.has(target))
            .forEach((target) => {
              ensureEdge(
                createGraphEdge({
                  source: id,
                  target,
                  sourceHandle: generateSwitchHandleText(index),
                  targetHandle: NodeHandleId.End,
                }),
              )
            })
        })

        toStringArray(form[SwitchElseTo] || form.end_cpn_ids || form.end_cpn_id)
          .filter((target) => nodeMap.has(target))
          .forEach((target) => {
            ensureEdge(
              createGraphEdge({
                source: id,
                target,
                sourceHandle: SwitchElseTo,
                targetHandle: NodeHandleId.End,
              }),
            )
          })
      }

      if (operator === Operator.Categorize) {
        const items = buildCategorizeListFromObject(
          (form.category_description || {}) as Record<string, never>,
        )

        items.forEach((item, index) => {
          const itemWithUuid = item as { uuid?: string; to?: string[] }
          const sourceHandle = itemWithUuid.uuid || `cat-${index}`

          toStringArray(itemWithUuid.to)
            .filter((target) => nodeMap.has(target))
            .forEach((target) => {
              ensureEdge(
                createGraphEdge({
                  source: id,
                  target,
                  sourceHandle,
                  targetHandle: NodeHandleId.End,
                }),
              )
            })
        })
      }

      if (operator === Operator.Agent) {
        buildAttachmentGraph(node, form)
      }
    }
  })

  return { nodes, edges }
}

export function deserializeDslToGraph(
  dsl: Partial<AgentDsl> | undefined,
  options: DeserializeDslOptions = {},
): ReconstructedGraph {
  const normalizedDsl = normalizeLegacyChunkerDsl(dsl)
  const graph = normalizedDsl?.graph

  if (graph?.nodes?.length || graph?.edges?.length) {
    const nodes = normalizeIterationNodes(
      (graph.nodes || []).map((node) => {
        const component = normalizedDsl?.components?.[node.id]
        const operator = (node.data?.label ||
          component?.obj?.component_name ||
          Operator.Note) as OperatorType
        const definition = getOperatorDefinition(operator)
        // Legacy DSLs persisted iteration containers under xyflow's built-in
        // `group` type, which inherits a default 150px width that conflicts
        // with NodeResizeControl. Migrate them onto our dedicated type.
        const nextType =
          node.type === 'group' && operator === Operator.Iteration
            ? 'iterationNode'
            : node.type || definition?.nodeType || 'ragNode'

        return {
          ...node,
          type: nextType,
          data: {
            ...node.data,
            label: operator,
            name: node.data?.name || definition?.defaultName || operator,
            form: mergeOperatorFormWithDefaults(
              operator,
              normalizeComponentFormForGraph(
                operator,
                (node.data?.form as FormRecord | undefined) ||
                  (component?.obj?.params as FormRecord | undefined),
              ),
            ),
          },
        } as AgentGraphNode
      }) as AgentGraphNode[],
    ) as AgentGraphNode[]

    return {
      graph: {
        nodes,
        edges: (graph.edges || []).map(normalizeEdge),
      },
      isReconstructed: false,
    }
  }

  const canvasType = options.canvasType || inferCanvasTypeFromGraph(undefined)
  if (
    !normalizedDsl?.components ||
    Object.keys(normalizedDsl.components).length === 0
  ) {
    return {
      graph: buildInitialGraph(canvasType),
      isReconstructed: true,
    }
  }

  const reconstructed = reconstructGraphFromComponents(
    normalizedDsl?.components || {},
  )

  return {
    graph: {
      ...reconstructed,
      nodes: normalizeIterationNodes(
        reconstructed.nodes as AgentGraphNode[],
      ) as AgentGraphNode[],
    },
    isReconstructed: true,
  }
}

export function buildDslComponentsByGraph(
  nodes: AgentGraphNode[],
  edges: Edge[],
): NonNullable<AgentDsl['components']> {
  const buildAgentExceptionGoto = (nodeId: string) =>
    edges
      .filter(
        (edge) =>
          edge.source === nodeId &&
          edge.sourceHandle === NodeHandleId.AgentException,
      )
      .map((edge) => edge.target)

  const buildComponentDownstreamOrUpstream = (
    nodeId: string,
    isBuildDownstream = true,
  ) =>
    edges
      .filter((edge) => {
        const node = nodes.find((item) => item.id === nodeId)
        const targetNode = nodes.find((item) => item.id === edge.target)
        let isNotUpstreamTool = true
        let isNotUpstreamAgent = true
        let isNotExceptionGoto = true

        if (isBuildDownstream && node?.data.label === Operator.Agent) {
          isNotExceptionGoto = edge.sourceHandle !== NodeHandleId.AgentException
          isNotUpstreamTool = targetNode?.data.label !== Operator.Tool
          isNotUpstreamAgent = !(
            targetNode?.data.label === Operator.Agent &&
            edge.targetHandle === NodeHandleId.AgentTop
          )
        }

        return (
          edge[isBuildDownstream ? 'source' : 'target'] === nodeId &&
          isNotUpstreamTool &&
          isNotUpstreamAgent &&
          isNotExceptionGoto
        )
      })
      .map((edge) => edge[isBuildDownstream ? 'target' : 'source'])

  const buildAgentTools = (nodeId: string): AgentToolEntry[] => {
    const node = nodes.find((item) => item.id === nodeId)
    const form = { ...((node?.data.form as FormRecord | undefined) || {}) }
    const tools = Array.isArray(form.tools)
      ? (form.tools as AgentToolEntry[]).filter(
          (tool) => tool?.component_name !== Operator.Agent,
        )
      : []

    const childAgents = edges
      .filter(
        (edge) =>
          edge.source === nodeId &&
          edge.sourceHandle === NodeHandleId.AgentBottom,
      )
      .flatMap((edge) => {
        const childNode = nodes.find((item) => item.id === edge.target)
        if (!childNode || childNode.data.label !== Operator.Agent) {
          return []
        }

        return [
          {
            component_name: Operator.Agent,
            id: childNode.id,
            name: childNode.data.name,
            params: buildAgentFormForDsl(childNode.id),
          },
        ]
      })

    return tools.concat(childAgents)
  }

  const buildAgentFormForDsl = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId)
    const form = { ...((node?.data.form as FormRecord | undefined) || {}) }

    return {
      ...form,
      tools: buildAgentTools(nodeId),
      exception_goto: buildAgentExceptionGoto(nodeId),
    }
  }

  const buildCategorizeFormForDsl = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId)
    const form = { ...((node?.data.form as FormRecord | undefined) || {}) }
    const items = Array.isArray(form.items)
      ? (form.items as Array<Record<string, unknown>>)
      : (buildCategorizeListFromObject(
          (form.category_description || {}) as Record<string, never>,
        ) as unknown as Array<Record<string, unknown>>)

    const categoryDescription = items.reduce<Record<string, unknown>>(
      (result, item, index) => {
        const name = typeof item.name === 'string' ? item.name : ''
        if (!name) {
          return result
        }

        const sourceHandle =
          typeof item.uuid === 'string' && item.uuid
            ? item.uuid
            : `cat-${index}`

        result[name] = {
          ...item,
          examples: Array.isArray(item.examples)
            ? (item.examples as Array<{ value: unknown }>).map(
                (example) => example.value,
              )
            : [],
          to: edges
            .filter(
              (edge) =>
                edge.source === nodeId && edge.sourceHandle === sourceHandle,
            )
            .map((edge) => edge.target),
        }
        delete (result[name] as Record<string, unknown>).name

        return result
      },
      {},
    )

    const nextForm: FormRecord = {
      ...form,
      category_description: categoryDescription,
    }
    delete nextForm.items

    return nextForm
  }

  const buildSwitchFormForDsl = (nodeId: string) => {
    const node = nodes.find((item) => item.id === nodeId)
    const form = { ...((node?.data.form as FormRecord | undefined) || {}) }
    const validNodeIds = new Set(
      nodes
        .filter((item) => item.data.label !== Operator.Placeholder)
        .map((item) => item.id),
    )

    const conditions = Array.isArray(form.conditions)
      ? (form.conditions as Array<Record<string, unknown>>).map(
          (condition) => ({
            ...condition,
            to: toStringArray(condition.to).filter((target) =>
              validNodeIds.has(target),
            ),
          }),
        )
      : []

    return {
      ...form,
      conditions,
      [SwitchElseTo]: toStringArray(
        form[SwitchElseTo] || form.end_cpn_ids || form.end_cpn_id,
      ).filter((target) => validNodeIds.has(target)),
    }
  }

  return nodes.reduce<NonNullable<AgentDsl['components']>>(
    (components, node) => {
      const operator = normalizeLegacyOperatorName(node.data.label)
      if (
        !getOperatorDefinition(operator) ||
        !isDslOperator(operator) ||
        isBottomSubAgent(edges, node.id)
      ) {
        return components
      }

      let form = node.data.form as FormRecord | undefined
      switch (operator) {
        case Operator.Agent:
          form = buildAgentFormForDsl(node.id)
          break
        case Operator.Categorize:
          form = buildCategorizeFormForDsl(node.id)
          break
        case Operator.Switch:
          form = buildSwitchFormForDsl(node.id)
          break
        default:
          break
      }

      const params = buildDslOperatorParams(operator, form)
      if (operator === Operator.Categorize) {
        delete (params as FormRecord).items
      }

      components[node.id] = {
        obj: {
          component_name: operator,
          params,
        },
        downstream: buildComponentDownstreamOrUpstream(node.id, true),
        upstream: buildComponentDownstreamOrUpstream(node.id, false),
        parent_id: node.parentId,
      } satisfies AgentOperator

      return components
    },
    {},
  )
}

function isSystemGlobalKey(key: string) {
  return key.startsWith('sys.')
}

function buildDslGlobalsWithConversationVariables({
  baseGlobals,
  globalVariables,
}: {
  baseGlobals?: Record<string, unknown>
  globalVariables?: Record<string, AgentGlobalVariable>
}) {
  const systemGlobals = Object.entries({
    ...buildDefaultDslGlobals(),
    ...(baseGlobals || {}),
  }).reduce<Record<string, unknown>>((acc, [key, value]) => {
    if (isSystemGlobalKey(key)) {
      acc[key] = value
    }
    return acc
  }, {})

  if (!globalVariables) {
    return {
      ...buildDefaultDslGlobals(),
      ...(baseGlobals || {}),
    }
  }

  return Object.entries(globalVariables).reduce<Record<string, unknown>>(
    (acc, [key, variable]) => {
      acc[`env.${key}`] = variable?.value
      return acc
    },
    systemGlobals,
  )
}

export function serializeGraphToDsl({
  graph,
  baseDsl,
  globalVariables,
}: SerializeGraphOptions): AgentDsl {
  const filteredNodes = (graph.nodes || []).filter((node) => {
    return isPersistedGraphOperator(node.data.label as OperatorType)
  })
  const filteredNodeIds = new Set(filteredNodes.map((node) => node.id))
  const filteredEdges = (graph.edges || [])
    .filter(
      (edge) =>
        filteredNodeIds.has(edge.source) && filteredNodeIds.has(edge.target),
    )
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
    globals: buildDslGlobalsWithConversationVariables({
      baseGlobals: baseDsl?.globals,
      globalVariables,
    }),
    variables:
      globalVariables ?? ((baseDsl?.variables as AgentDsl['variables']) || {}),
    retrieval: baseDsl?.retrieval || [],
  }
}

export function buildInitialGraph(kind: AgentCanvasType): AgentGraph {
  if (kind === CanvasType.PIPELINE) {
    const fileNode = buildGraphNode(Operator.File, {
      id: FileId,
    })
    const parserNode = buildGraphNode(Operator.Parser, {
      id: 'Parser:initial',
      name: 'Parser_0',
      position: {
        x: DEFAULT_GRAPH_POSITION.x + COMPONENT_GRID_X_GAP,
        y: DEFAULT_GRAPH_POSITION.y,
      },
    })

    return {
      nodes: [fileNode, parserNode],
      edges: [
        createGraphEdge({
          source: fileNode.id,
          target: parserNode.id,
          sourceHandle: NodeHandleId.Start,
          targetHandle: NodeHandleId.End,
        }),
      ],
    }
  }

  return {
    nodes: [buildGraphNode(Operator.Begin, { id: BeginId })],
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
      globals: buildDefaultDslGlobals(),
      variables: {},
      retrieval: [],
      path: [],
    },
  })
}
