import type { AgentOperatorDefinition } from '@/types/agent'
import type { MCPServer } from '@/types/mcp'
import { Operator, type Operator as OperatorType } from '../../constant'
import { getOperatorDefinition } from '../../operators'
import type { RAGFlowNodeType } from '../../types'
import type { SelectedToolContext } from './types'

export const MCP_FORM_RENDERER_KEY = '__mcp_form__'

const UNKNOWN_DESCRIPTION = '当前节点仍在复用旧表单内容层。'
const MCP_DESCRIPTION = '配置 MCP Server 连接与可用工具。'

interface ResolveSelectedToolContextOptions {
  operatorType?: OperatorType
  clickedToolId?: string
  nodes: RAGFlowNodeType[]
  mcpServers?: MCPServer[]
}

interface ResolveFormSheetMetadataOptions {
  operatorType?: OperatorType
  operatorDefinition?: AgentOperatorDefinition
  toolContext?: SelectedToolContext
}

interface LegacyToolConfig {
  id?: string
  component_name?: string
  name?: string
  description?: string
  [key: string]: unknown
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
  nodes,
  mcpServers = [],
}: ResolveSelectedToolContextOptions): SelectedToolContext | undefined {
  if (operatorType !== Operator.Tool || !clickedToolId) {
    return undefined
  }

  const mcpServer = mcpServers.find((server) => server.id === clickedToolId)
  if (mcpServer) {
    return {
      id: clickedToolId,
      name: mcpServer.name,
      description: mcpServer.description,
      mcpServer,
    }
  }

  const tools = nodes
    .filter((node) => node.data?.label === Operator.Agent)
    .flatMap((node) => {
      const configuredTools = node.data?.form?.tools
      return Array.isArray(configuredTools)
        ? (configuredTools as LegacyToolConfig[])
        : []
    })

  const selectedTool = tools.find(
    (tool) => (tool.id || tool.component_name) === clickedToolId,
  )

  if (!selectedTool) {
    return undefined
  }

  return {
    id: clickedToolId,
    operator: normalizeOperator(selectedTool.component_name),
    name: selectedTool.name || selectedTool.component_name || clickedToolId,
    description: selectedTool.description,
    tool: selectedTool,
  }
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
}: ResolveFormSheetMetadataOptions) {
  if (toolContext?.mcpServer) {
    return toolContext.description || MCP_DESCRIPTION
  }

  if (toolContext?.operator) {
    return (
      toolContext.description ||
      getOperatorDefinition(toolContext.operator)?.description ||
      operatorDefinition?.description ||
      UNKNOWN_DESCRIPTION
    )
  }

  if (toolContext?.description) {
    return toolContext.description
  }

  return (
    operatorDefinition?.description ||
    (operatorType
      ? `${operatorType} 节点仍在复用旧表单内容层。`
      : UNKNOWN_DESCRIPTION)
  )
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
