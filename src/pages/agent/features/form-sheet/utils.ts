import type { Edge } from '@xyflow/react'
import type { TFunction } from 'i18next'
import type { AgentOperatorDefinition } from '@/types/agent'
import type { MCPServer } from '@/types/mcp'
import { Operator, type Operator as OperatorType } from '../../constant'
import { getOperatorDefinition } from '../../operators'
import type { RAGFlowNodeType } from '../../types'
import {
  CodeActualTypeOutputKey,
  CodeAttachmentsOutputKey,
  CodeContentOutputKey,
  type CodeOutputContract,
  CodeRawResultOutputKey,
} from '../../utils/code-outputs'
import type { SelectedToolContext } from './types'

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
  CodeActualTypeOutputKey,
  CodeContentOutputKey,
  CodeRawResultOutputKey,
  CodeAttachmentsOutputKey,
  '_ATTACHMENT_CONTENT',
])

export const CodeExecDebugStatus = {
  Succeeded: 'succeeded',
  ExecutionError: 'execution_error',
  ContractError: 'contract_error',
  Empty: 'empty',
} as const

export type CodeExecDebugStatus =
  (typeof CodeExecDebugStatus)[keyof typeof CodeExecDebugStatus]

export type CodeExecContractMismatch = {
  expectedType: string
  actualType: string
}

export type CodeExecAttachmentLink = {
  label: string
  href?: string
}

export type GroupedCodeExecDebugOutput = {
  businessOutputName: string
  businessOutputValue: unknown
  hasBusinessOutput: boolean
  expectedType: string
  actualType: string
  rawResult: unknown
  content: string
  errorMessage: string
  status: CodeExecDebugStatus
  contractMismatch?: CodeExecContractMismatch
  suggestedType?: string
  attachments: string[]
  systemOutputs: Record<string, unknown>
}

const CODE_EXEC_CONTRACT_TYPE_MAP: Record<string, string> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  object: 'object',
  array: 'array',
  'array<string>': 'array<string>',
  'array<number>': 'array<number>',
  'array<boolean>': 'array<boolean>',
  'array<object>': 'array<object>',
}

function isEmptyDebugPayload(source: Record<string, unknown>) {
  return Object.keys(source).length === 0
}

function normalizeErrorMessage(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeCodeExecTypeName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, '')
    .replace(/^Array<(.+)>$/i, (_, inner: string) => `array<${inner}>`)
    .toLowerCase()
}

export function normalizeCodeExecActualTypeForContract(
  actualType: string,
): string | undefined {
  const normalized = normalizeCodeExecTypeName(actualType)

  return CODE_EXEC_CONTRACT_TYPE_MAP[normalized]
}

export function parseCodeExecContractMismatch(
  errorMessage: string,
): CodeExecContractMismatch | undefined {
  const match = errorMessage.match(
    /expected type\s+([^,]+),\s+got\s+([^\s.]+)/i,
  )

  if (!match) {
    return undefined
  }

  return {
    expectedType: match[1].trim(),
    actualType: match[2].trim(),
  }
}

function normalizeAttachments(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === 'string')
}

function isSafeAttachmentHref(href: string) {
  return href.startsWith('/') || /^https?:\/\//i.test(href)
}

export function parseCodeExecAttachmentLink(
  attachment: string,
): CodeExecAttachmentLink {
  const markdownMatch = attachment.match(/!?\[([^\]]+)\]\(([^)]+)\)/)

  if (markdownMatch) {
    const href = markdownMatch[2].trim()

    return {
      label: markdownMatch[1].trim() || href,
      href: isSafeAttachmentHref(href) ? href : undefined,
    }
  }

  const value = attachment.trim()

  if (isSafeAttachmentHref(value)) {
    return {
      label: value.split('/').pop() || value,
      href: value,
    }
  }

  return { label: value || attachment }
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
  const errorMessage = normalizeErrorMessage(source._ERROR)
  const contractMismatch = parseCodeExecContractMismatch(errorMessage)
  const actualType = String(
    source[CodeActualTypeOutputKey] ?? contractMismatch?.actualType ?? '',
  )
  const status = errorMessage
    ? contractMismatch
      ? CodeExecDebugStatus.ContractError
      : CodeExecDebugStatus.ExecutionError
    : isEmptyDebugPayload(source)
      ? CodeExecDebugStatus.Empty
      : CodeExecDebugStatus.Succeeded
  const attachments = normalizeAttachments(source[CodeAttachmentsOutputKey])

  return {
    businessOutputName: contract.name,
    businessOutputValue: hasContractValue ? source[contract.name] : undefined,
    hasBusinessOutput:
      hasContractValue || source[CodeRawResultOutputKey] !== undefined,
    expectedType: contract.type,
    actualType,
    rawResult:
      source[CodeRawResultOutputKey] ??
      (hasContractValue ? source[contract.name] : undefined),
    content: String(source[CodeContentOutputKey] ?? ''),
    errorMessage,
    status,
    contractMismatch,
    suggestedType: contractMismatch
      ? normalizeCodeExecActualTypeForContract(contractMismatch.actualType)
      : undefined,
    attachments,
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

export function resolveLegacyRendererKey(operatorType?: OperatorType) {
  return operatorType
}
