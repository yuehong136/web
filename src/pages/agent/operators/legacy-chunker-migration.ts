import type { AgentDsl, AgentGraphNode, AgentOperator } from '@/types/agent'
import { Operator, type Operator as OperatorType } from '../constant'

const LEGACY_COMPONENT_RENAMES: Record<string, OperatorType> = {
  Splitter: Operator.TokenChunker,
  HierarchicalMerger: Operator.TitleChunker,
}
const LEGACY_NODE_TYPE_RENAMES: Record<string, string> = {
  splitterNode: 'chunkerNode',
}
const VARIABLE_REF_PATTERN =
  /(\{+\s*)([A-Za-z0-9:_-]+)(@[A-Za-z0-9_.-]+)(\s*\}+)/g

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
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

export function normalizeLegacyOperatorName(
  value?: string | null,
): OperatorType {
  const nextValue = value || Operator.Note
  return LEGACY_COMPONENT_RENAMES[nextValue] || (nextValue as OperatorType)
}

function normalizeLegacyNodeType(value?: string | null) {
  if (!value) {
    return value
  }

  return LEGACY_NODE_TYPE_RENAMES[value] || value
}

function buildLegacyComponentIdMap(dsl: Partial<AgentDsl>) {
  const componentIdMap = new Map<string, string>()
  const addComponentId = (componentId: unknown) => {
    if (typeof componentId !== 'string') {
      return
    }

    const [prefix = '', ...rest] = componentId.split(':')
    const renamedPrefix = LEGACY_COMPONENT_RENAMES[prefix]
    componentIdMap.set(
      componentId,
      renamedPrefix && rest.length > 0
        ? `${renamedPrefix}:${rest.join(':')}`
        : componentId,
    )
  }

  Object.keys(dsl.components || {}).forEach(addComponentId)
  dsl.graph?.nodes?.forEach((node) => addComponentId(node.id))
  return componentIdMap
}

function rewriteLegacyChunkerString(
  value: string,
  componentIdMap: Map<string, string>,
) {
  if (componentIdMap.has(value)) {
    return componentIdMap.get(value) as string
  }

  return value.replace(
    VARIABLE_REF_PATTERN,
    (
      _match: string,
      open: string,
      componentId: string,
      field: string,
      close: string,
    ) => {
      const nextComponentId = componentIdMap.get(componentId) || componentId
      return `${open}${nextComponentId}${field}${close}`
    },
  )
}

function rewriteLegacyChunkerValue(
  value: unknown,
  componentIdMap: Map<string, string>,
): unknown {
  if (typeof value === 'string') {
    return rewriteLegacyChunkerString(value, componentIdMap)
  }

  if (Array.isArray(value)) {
    return value.map((item) => rewriteLegacyChunkerValue(item, componentIdMap))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        rewriteLegacyChunkerValue(item, componentIdMap),
      ]),
    )
  }

  return value
}

export function normalizeLegacyChunkerDsl(
  dsl: Partial<AgentDsl> | undefined,
): Partial<AgentDsl> | undefined {
  if (!dsl) {
    return dsl
  }

  const normalized = cloneValue(dsl)
  const componentIdMap = buildLegacyComponentIdMap(normalized)

  if (normalized.components) {
    const rewrittenComponents: NonNullable<AgentDsl['components']> = {}
    Object.entries(normalized.components).forEach(
      ([componentId, component]) => {
        const nextComponentId = componentIdMap.get(componentId) || componentId
        const nextComponent = rewriteLegacyChunkerValue(
          component,
          componentIdMap,
        ) as AgentOperator
        nextComponent.obj.component_name = normalizeLegacyOperatorName(
          nextComponent.obj.component_name,
        )
        nextComponent.downstream = toStringArray(nextComponent.downstream).map(
          (target) => componentIdMap.get(target) || target,
        )
        nextComponent.upstream = toStringArray(nextComponent.upstream).map(
          (source) => componentIdMap.get(source) || source,
        )
        if (typeof nextComponent.parent_id === 'string') {
          nextComponent.parent_id =
            componentIdMap.get(nextComponent.parent_id) ||
            nextComponent.parent_id
        }
        rewrittenComponents[nextComponentId] = nextComponent
      },
    )
    normalized.components = rewrittenComponents
  }

  if (normalized.path) {
    normalized.path = rewriteLegacyChunkerValue(
      normalized.path,
      componentIdMap,
    ) as AgentDsl['path']
  }

  if (normalized.graph) {
    normalized.graph.nodes = (normalized.graph.nodes || []).map((node) => {
      const nextId = componentIdMap.get(node.id) || node.id
      const data = node.data || { label: Operator.Note, name: Operator.Note }
      const nextLabel = normalizeLegacyOperatorName(data.label)
      const nextName =
        typeof data.name === 'string' && LEGACY_COMPONENT_RENAMES[data.name]
          ? LEGACY_COMPONENT_RENAMES[data.name]
          : data.name

      return {
        ...node,
        id: nextId,
        parentId:
          typeof node.parentId === 'string'
            ? componentIdMap.get(node.parentId) || node.parentId
            : node.parentId,
        type: normalizeLegacyNodeType(node.type) || node.type,
        data: {
          ...data,
          label: nextLabel,
          name: nextName,
          form: rewriteLegacyChunkerValue(data.form, componentIdMap),
        },
      } as AgentGraphNode
    })

    const replacements = Array.from(componentIdMap.entries()).sort(
      ([left], [right]) => right.length - left.length,
    )
    normalized.graph.edges = (normalized.graph.edges || []).map((edge) => {
      let edgeId = edge.id
      replacements.forEach(([oldComponentId, nextComponentId]) => {
        edgeId = edgeId.replace(oldComponentId, nextComponentId)
      })

      return {
        ...edge,
        id: edgeId,
        source: componentIdMap.get(edge.source) || edge.source,
        target: componentIdMap.get(edge.target) || edge.target,
      }
    })
  }

  ;(['history', 'messages', 'reference'] as const).forEach((key) => {
    if (normalized[key]) {
      normalized[key] = rewriteLegacyChunkerValue(
        normalized[key],
        componentIdMap,
      ) as never
    }
  })

  return normalized
}
