import type {
  AgentFlow,
  AgentGraph,
  AgentVersionSummary,
  LocalizedText,
} from '@/types/agent'
import { AgentCanvasCategory, AgentCanvasType } from '@/types/agent'
import {
  buildInitialDsl as buildInitialDslFromOperators,
  buildInitialGraph as buildInitialGraphFromOperators,
  inferCanvasTypeFromGraph as inferCanvasTypeFromOperators,
} from '@/pages/agent/operators'
import { AgentCategory, AgentQuery, Operator } from '@/pages/agent/constant'
import { downloadJsonFile } from './download'

export function resolveLocalizedText(
  value: LocalizedText | null | undefined,
  fallback = '未命名',
): string {
  if (!value) {
    return fallback
  }

  if (typeof value === 'string') {
    return value || fallback
  }

  return value.zh || value.en || Object.values(value).find(Boolean) || fallback
}

export function isPipelineFlow(
  flow?: Pick<AgentFlow, 'canvas_type' | 'canvas_category'> | null,
) {
  if (!flow) {
    return false
  }

  return (
    flow.canvas_type === AgentCanvasType.PIPELINE ||
    flow.canvas_category === AgentCanvasCategory.INGESTION
  )
}

function isPipelineRouteKind(
  value?:
    | Pick<AgentFlow, 'canvas_type' | 'canvas_category'>
    | AgentCanvasType
    | string
    | null,
) {
  if (!value) {
    return false
  }

  if (typeof value === 'string') {
    return (
      value === AgentCanvasType.PIPELINE ||
      value === AgentCanvasCategory.INGESTION
    )
  }

  return isPipelineFlow(value)
}

export function resolveCanvasKind(
  value?:
    | Pick<AgentFlow, 'canvas_type' | 'canvas_category'>
    | AgentCanvasType
    | string
    | null,
): AgentCanvasType {
  return isPipelineRouteKind(value)
    ? AgentCanvasType.PIPELINE
    : AgentCanvasType.AGENT
}

export function buildAgentCanvasPath(
  id: string,
  flowOrKind?:
    | Pick<AgentFlow, 'canvas_type' | 'canvas_category'>
    | AgentCanvasType
    | string
    | null,
) {
  if (!isPipelineRouteKind(flowOrKind)) {
    return `/agent/${id}`
  }

  const searchParams = new URLSearchParams({
    [AgentQuery.Category]: AgentCategory.DataflowCanvas,
  })

  return `/agent/${id}?${searchParams.toString()}`
}

export function resolveCanvasCategory(
  kind: AgentCanvasType | string | undefined,
): string {
  return kind === AgentCanvasType.PIPELINE
    ? AgentCanvasCategory.INGESTION
    : AgentCanvasCategory.AGENT
}

export function buildInitialGraph(kind: AgentCanvasType): AgentGraph {
  return buildInitialGraphFromOperators(kind)
}

export function buildInitialDsl(kind: AgentCanvasType) {
  return buildInitialDslFromOperators(kind)
}

export function inferCanvasTypeFromGraph(
  graph: AgentGraph | undefined,
): AgentCanvasType {
  return inferCanvasTypeFromOperators(graph)
}

const DECORATIVE_OPERATOR_NAMES = new Set<string>([
  Operator.Note,
  Operator.Placeholder,
])

export function countFlowNodes(
  flow: Pick<AgentFlow, 'dsl'> | null | undefined,
): number {
  if (!flow?.dsl) return 0

  const components = flow.dsl.components || {}
  const componentEntries = Object.values(components).filter((component) => {
    const name = component?.obj?.component_name
    return !!name && !DECORATIVE_OPERATOR_NAMES.has(name)
  })
  if (componentEntries.length > 0) {
    return componentEntries.length
  }

  const graphNodes = flow.dsl.graph?.nodes || []
  return graphNodes.filter((node) => {
    const label = node.data?.label
    return !label || !DECORATIVE_OPERATOR_NAMES.has(String(label))
  }).length
}

export function formatVersionLabel(
  version: AgentVersionSummary,
  index: number,
): string {
  return (
    version.title ||
    version.description ||
    version.version_id ||
    `版本 ${index + 1}`
  )
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function downloadFlowJson(flow: AgentFlow): void {
  const title = resolveLocalizedText(flow.title, 'agent')
  const slug = slugify(title) || 'agent'
  const filename = `agent-${slug}-${flow.id.slice(0, 8)}.json`

  downloadJsonFile(
    {
      title: flow.title,
      description: flow.description,
      canvas_type: flow.canvas_type,
      canvas_category: flow.canvas_category,
      avatar: flow.avatar,
      dsl: flow.dsl,
      exportedAt: new Date().toISOString(),
      schemaVersion: '1.0',
    },
    filename,
  )
}
