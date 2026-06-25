import type { Edge } from '@xyflow/react'
import type { TFunction } from 'i18next'
import type { AgentOperatorDefinition } from '@/types/agent'
import type { MCPServer } from '@/types/mcp'
import { Operator, type Operator as OperatorType } from '../../constant'
import { getOperatorDefinition } from '../../operators'
import type { RAGFlowNodeType } from '../../types'
import {
  CodeAttachmentsOutputKey,
  CodeContentOutputKey,
  type CodeOutputContract,
  CodeRawResultOutputKey,
} from '../../utils/code-outputs'
import type { SelectedToolContext } from './types'

export const MCP_FORM_RENDERER_KEY = '__mcp_form__'

interface ResolveSelectedToolContextOptions {
  operatorType?: OperatorType
  clickedToolId?: string
  currentNodeId?: string
  nodes: RAGFlowNodeType[]
  edges?: Edge[]
  mcpServers?: MCPServer[]
}

interface ResolveFormSheetMetadataOptions {
  operatorType?: OperatorType
  operatorDefinition?: AgentOperatorDefinition
  toolContext?: SelectedToolContext
  t?: TFunction
}

interface LegacyToolConfig {
  id?: string
  component_name?: string
  name?: string
  description?: string
  params?: Record<string, unknown>
  [key: string]: unknown
}

interface LegacyMcpConfig {
  mcp_id?: string
  tools?: Record<string, unknown>
  [key: string]: unknown
}

const CODE_EXEC_DEBUG_SYSTEM_OUTPUT_NAMES = new Set([
  '_ERROR',
  '_ARTIFACTS',
  CodeAttachmentsOutputKey,
  '_ATTACHMENT_CONTENT',
])

export type GroupedCodeExecDebugOutput = {
  businessOutputName: string
  businessOutputValue: unknown
  hasBusinessOutput: boolean
  expectedType: string
  actualType: string
  rawResult: unknown
  content: string
  systemOutputs: Record<string, unknown>
}

function normalizeOperator(value?: string): OperatorType | undefined {
  if (!value || !getOperatorDefinition(value)) {
    return undefined
  }

  return value as OperatorType
}

export function resolveSelectedToolContext({
  operatorType,
  clickedToolId,
  currentNodeId,
  nodes,
  edges = [],
  mcpServers = [],
}: ResolveSelectedToolContextOptions): SelectedToolContext | undefined {
  if (operatorType !== Operator.Tool || !clickedToolId) {
    return undefined
  }

  const upstreamAgentId = currentNodeId
    ? edges.find((edge) => edge.target === currentNodeId)?.source
    : undefined
  const upstreamAgent = nodes.find(
    (node) =>
      node.id === upstreamAgentId && node.data?.label === Operator.Agent,
  )

  const candidateAgents = upstreamAgent
    ? [upstreamAgent]
    : nodes.filter((node) => node.data?.label === Operator.Agent)

  for (const agentNode of candidateAgents) {
    const configuredTools = Array.isArray(agentNode.data?.form?.tools)
      ? (agentNode.data.form.tools as LegacyToolConfig[])
      : []
    const toolIndex = configuredTools.findIndex(
      (tool) => (tool.id || tool.component_name) === clickedToolId,
    )

    if (toolIndex >= 0) {
      const selectedTool = configuredTools[toolIndex]

      return {
        id: clickedToolId,
        agentNodeId: agentNode.id,
        toolIndex,
        operator: normalizeOperator(selectedTool.component_name),
        name: selectedTool.name || selectedTool.component_name || clickedToolId,
        description: selectedTool.description,
        tool: selectedTool,
      }
    }

    const configuredMcp = Array.isArray(agentNode.data?.form?.mcp)
      ? (agentNode.data.form.mcp as LegacyMcpConfig[])
      : []
    const mcpIndex = configuredMcp.findIndex(
      (item) => item.mcp_id === clickedToolId,
    )

    if (mcpIndex >= 0) {
      const mcpServer = mcpServers.find((server) => server.id === clickedToolId)

      return {
        id: clickedToolId,
        agentNodeId: agentNode.id,
        mcpIndex,
        name: mcpServer?.name,
        description: mcpServer?.description,
        mcpServer,
        mcp: configuredMcp[mcpIndex],
      }
    }
  }

  return undefined
}

export function isFormSheetTitleEditable(
  operatorDefinition?: AgentOperatorDefinition,
) {
  return !operatorDefinition?.isRootNode
}

export function canShowSingleStepDebug(
  operatorDefinition?: AgentOperatorDefinition,
) {
  return Boolean(operatorDefinition?.allowSingleStepDebug)
}

export function shouldUseCodeExecDebugLayout(label?: string): boolean {
  return label === Operator.Code
}

export function groupCodeExecDebugOutput(
  data: Record<string, unknown> | undefined,
  contract: CodeOutputContract,
): GroupedCodeExecDebugOutput {
  const source = data ?? {}
  const hasContractValue = contract.name in source

  return {
    businessOutputName: contract.name,
    businessOutputValue: hasContractValue ? source[contract.name] : undefined,
    hasBusinessOutput:
      hasContractValue || source[CodeRawResultOutputKey] !== undefined,
    expectedType: contract.type,
    actualType: String(source.actual_type ?? ''),
    rawResult:
      source[CodeRawResultOutputKey] ??
      (hasContractValue ? source[contract.name] : undefined),
    content: String(source[CodeContentOutputKey] ?? ''),
    systemOutputs: Object.fromEntries(
      Object.entries(source).filter(([key]) =>
        CODE_EXEC_DEBUG_SYSTEM_OUTPUT_NAMES.has(key),
      ),
    ),
  }
}

export function resolveFormSheetIconKey({
  operatorType,
  operatorDefinition,
  toolContext,
}: ResolveFormSheetMetadataOptions) {
  if (toolContext?.mcpServer) {
    return Operator.Tool
  }

  if (toolContext?.operator) {
    return toolContext.operator
  }

  return operatorDefinition?.iconKey || operatorType || Operator.Note
}

export function resolveFormSheetDescription({
  operatorType,
  operatorDefinition,
  toolContext,
  t,
}: ResolveFormSheetMetadataOptions) {
  const translate = (
    key: string,
    fallback: string,
    options?: Record<string, unknown>,
  ) =>
    t
      ? t(key, fallback, options)
      : fallback.replace('{{type}}', String(options?.type ?? ''))
  const unknownDescription = operatorType
    ? translate(
        'flow.legacyNodeDescriptionWithType',
        '{{type}} node is still using legacy form content.',
        { type: operatorType },
      )
    : translate(
        'flow.legacyNodeDescription',
        'This node is still using legacy form content.',
      )

  if (toolContext?.mcpServer) {
    return (
      toolContext.description ||
      translate(
        'flow.mcpToolDescription',
        'Configure the MCP Server connection and available tools.',
      )
    )
  }

  if (toolContext?.operator) {
    return (
      toolContext.description ||
      getOperatorDefinition(toolContext.operator)?.description ||
      operatorDefinition?.description ||
      unknownDescription
    )
  }

  if (toolContext?.description) {
    return toolContext.description
  }

  return operatorDefinition?.description || unknownDescription
}

export function resolveLegacyRendererKey(
  operatorType?: OperatorType,
  isMcp?: boolean,
) {
  if (!operatorType) {
    return undefined
  }

  if (operatorType === Operator.Tool && isMcp) {
    return MCP_FORM_RENDERER_KEY
  }

  return operatorType
}
