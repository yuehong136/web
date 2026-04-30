import type { ActionPayload, XAgentCommand_v0_9 } from '@ant-design/x-card'

export const A2UI_CATALOG_ID = 'https://a2ui.org/specification/v0_9/basic_catalog.json'

export enum XCardStatus {
  IDLE = 'idle',
  STREAMING = 'streaming',
  READY = 'ready',
  ERROR = 'error',
}

export type AgentXCardCommand = XAgentCommand_v0_9

export interface A2UICommandEventData {
  surface_id?: string
  surface_ids?: string[]
  commands?: AgentXCardCommand[]
}

export interface AgentXCardActionPayload extends ActionPayload {
  sourceComponentId: string
  timestamp: string
  displayContext?: Record<string, unknown>
}
