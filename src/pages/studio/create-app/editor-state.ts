import { buildChatSaveRequest } from './save-payload'
import type { AppConfig } from './types'

// Compare the wire representation, so disabled parameter values are not changes.
export const configSignature = (config: AppConfig, knowledgeBlock: string) =>
  JSON.stringify(
    buildChatSaveRequest(config, knowledgeBlock),
    (_key, value: unknown) => {
      if (value && typeof value === 'object' && !Array.isArray(value))
        return Object.fromEntries(
          Object.entries(value).sort(([left], [right]) =>
            left.localeCompare(right),
          ),
        )
      return value
    },
  )

export const hasRequiredPreviewVariables = (config: AppConfig) =>
  config.prompt_config.parameters.some(
    ({ key, optional }) => key !== 'knowledge' && !optional,
  )

export type SaveStatus =
  | 'unsaved'
  | 'saving'
  | 'saved'
  | 'failed'
  | 'unconfirmed'
export type PreviewStatus =
  | 'idle'
  | 'preparing'
  | 'streaming'
  | 'completed'
  | 'interrupted'
  | 'failed'

export interface ConfirmedSave {
  id: string
  config: AppConfig
  signature: string
}
