import { v4 as uuidv4 } from 'uuid'
import { resolveHomeModelIdentity } from './model-identity'
import type { MyLLMProvider } from '@/stores/model'
import i18n from '@/locales/i18n'
import {
  createContextManifest,
  type ContextResource,
  type WorkspaceScope,
} from '@/lib/ai-workspace/contracts'
import { getCurrentLanguage } from '@/locales/i18n'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'
import type { ChatMessage } from '@/pages/home/types'
export interface HomeContextSelection {
  selectedApp?: DialogApp | null
  modelProviders?: MyLLMProvider
  selectedModelId: string
  selectedMCPIds: readonly string[]
  selectedMCPServers?: readonly MCPServer[]
}

/** Mirror the two real transports: app configuration or explicit model/MCP IDs. */
export function getHomeContextResources({
  selectedApp,
  modelProviders = {},
  selectedModelId,
  selectedMCPIds,
  selectedMCPServers = [],
}: HomeContextSelection): ContextResource[] {
  const resources: ContextResource[] = []
  const add = (
    kind: ContextResource['kind'],
    id: string | undefined,
    label: string | undefined,
    origin: ContextResource['origin'],
  ) => {
    const identity =
      kind === 'model'
        ? resolveHomeModelIdentity(modelProviders, id)
        : undefined
    if (id)
      resources.push({
        kind,
        id,
        label: identity
          ? (identity.label ?? i18n.t('common.modelPicker.savedModel'))
          : label || id,
        ...(identity?.provider ? { provider: identity.provider } : {}),
        // Configuration and cached tool names are not live availability probes.
        availability: 'unknown',
        origin,
      })
  }
  if (selectedApp) {
    add('app', selectedApp.id, selectedApp.name, 'turn')
    add('model', selectedApp.llm_id, selectedApp.llm_id, 'inherited')
    const ids = selectedApp.dataset_ids ?? selectedApp.kb_ids ?? []
    ids.forEach((id, index) =>
      add('knowledgeBase', id, selectedApp.kb_names?.[index], 'inherited'),
    )
  } else {
    add('model', selectedModelId, selectedModelId, 'turn')
    for (const id of new Set(selectedMCPIds)) {
      const server = selectedMCPServers.find((item) => item.id === id)
      add('tool', id, server?.name, 'turn')
    }
  }
  return resources
}

/** A turn owns its context snapshot; API serializers explicitly persist model attribution only. */
export function createHomeTurn({
  content,
  scope,
  resources,
}: {
  content: string
  scope: WorkspaceScope
  resources: readonly ContextResource[]
}): { userMessage: ChatMessage; assistantMessage: ChatMessage } {
  const assistantId = uuidv4()
  const contextManifest = createContextManifest({
    scope,
    messageId: assistantId,
    stage: 'submitted',
    resources,
  })
  const model = resources.find((resource) => resource.kind === 'model')
  const modelIdentity = model
    ? { reference: model.id, label: model.label, provider: model.provider }
    : undefined
  const timestamp = new Date().toLocaleTimeString(getCurrentLanguage())
  return {
    userMessage: {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp,
      contextManifest,
      modelIdentity,
    },
    assistantMessage: {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp,
      references: [],
      thinking: '',
      timelineNodes: [],
      isStreaming: true,
      contextManifest,
      modelIdentity,
    },
  }
}
