import type { ComponentType } from 'react'
import type { AgentOperatorDefinition } from '@/types/agent'
import type { MCPServer } from '@/types/mcp'
import type { Operator } from '../../constant'
import type { INextOperatorForm, RAGFlowNodeType } from '../../types'

export interface FormSheetProps {
  open: boolean
  node: RAGFlowNodeType | undefined
  onClose: () => void
  runtimeDrawerVisible?: boolean
  canvasId?: string
}

export interface SelectedToolContext {
  id: string
  operator?: Operator
  name?: string
  description?: string
  mcpServer?: MCPServer
  tool?: Record<string, unknown>
}

export interface ResolvedFormSheetContext {
  node?: RAGFlowNodeType
  operatorType?: Operator
  operatorDefinition?: AgentOperatorDefinition
  toolContext?: SelectedToolContext
  iconKey: string
  description: string
  titleEditable: boolean
  debugEnabled: boolean
  rendererKey?: string
}

export type FormRendererComponent = ComponentType<INextOperatorForm>

export interface OperatorHeaderProps {
  node?: RAGFlowNodeType
  titleEditable: boolean
  iconKey: string
  debugEnabled: boolean
  canvasId?: string
  onClose: () => void
}
