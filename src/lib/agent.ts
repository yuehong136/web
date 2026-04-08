import type {
  AgentFlow,
  AgentGraph,
  AgentVersionSummary,
  LocalizedText,
} from '@/types/agent'
import {
  AgentCanvasCategory,
  AgentCanvasType,
} from '@/types/agent'
import {
  buildInitialDsl as buildInitialDslFromOperators,
  buildInitialGraph as buildInitialGraphFromOperators,
  inferCanvasTypeFromGraph as inferCanvasTypeFromOperators,
} from '@/pages/agent/operators'

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

export function isPipelineFlow(flow?: Pick<AgentFlow, 'canvas_type' | 'canvas_category'> | null) {
  if (!flow) {
    return false
  }

  return (
    flow.canvas_type === AgentCanvasType.PIPELINE ||
    flow.canvas_category === AgentCanvasCategory.INGESTION
  )
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

export function inferCanvasTypeFromGraph(graph: AgentGraph | undefined): AgentCanvasType {
  return inferCanvasTypeFromOperators(graph)
}

export function formatVersionLabel(version: AgentVersionSummary, index: number): string {
  return (
    version.title ||
    version.description ||
    version.version_id ||
    `版本 ${index + 1}`
  )
}
