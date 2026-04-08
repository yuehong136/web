import type { AgentCanvasType, AgentGraph, AgentGraphNode } from '@/types/agent'
import type { Operator } from '../constant'

export enum AgentOperatorCategory {
  CORE = 'core',
  CONTROL = 'control',
  AGENT = 'agent',
  TOOL = 'tool',
  DATA = 'data',
  PIPELINE = 'pipeline',
  UTILITY = 'utility',
}

export enum AgentOperatorMode {
  AGENT = 'agent',
  PIPELINE = 'pipeline',
  SHARED = 'shared',
}

export interface AgentOperatorDefinition {
  type: Operator
  category: AgentOperatorCategory
  mode: AgentOperatorMode
  nodeType: string
  defaultName: string
  description: string
  iconKey: string
  allowSingleStepDebug?: boolean
  consumesBeginInputs?: boolean
  supportsStructuredOutput?: boolean
  supportsGlobalVariables?: boolean
  excludeFromDsl?: boolean
  isRootNode?: boolean
}

export interface SerializeGraphOptions {
  graph: AgentGraph
  baseDsl?: Partial<{
    history: unknown[]
    path?: string[][]
    answer?: unknown[]
    messages: unknown[]
    reference: unknown[]
    globals: Record<string, unknown>
    variables: Record<string, unknown>
    retrieval: unknown[]
  }>
}

export interface BuildGraphNodeOptions {
  id?: string
  name?: string
  position?: { x: number; y: number }
  form?: Record<string, unknown>
  parentId?: string
  type?: string
}

export interface DeserializeDslOptions {
  canvasType?: AgentCanvasType
}

export interface ReconstructedGraph {
  graph: AgentGraph
  isReconstructed: boolean
}

export type OperatorRegistry = Record<Operator, AgentOperatorDefinition>
export type OperatorNodeFactory = (
  operator: Operator,
  options?: BuildGraphNodeOptions,
) => AgentGraphNode
