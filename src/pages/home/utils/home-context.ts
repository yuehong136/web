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
  selectedModelId: string
  selectedMCPIds: readonly string[]
  selectedMCPServers?: readonly MCPServer[]
}

/** Mirror the two real transports: app configuration or explicit model/MCP IDs. */
export function getHomeContextResources({
  selectedApp,
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
    if (id)
      resources.push({
        kind,
        id,
        label: label || id,
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

/** A turn owns one immutable display snapshot; only role/content go to the API. */
export function createHomeTurn({
  content,
  scope,
  resources,
}: {
  content: string
  scope: WorkspaceScope
  resources: readonly ContextResource[]
}): { userMessage: ChatMessage; assistantMessage: ChatMessage } {
  const assistantId = crypto.randomUUID()
  const contextManifest = createContextManifest({
    scope,
    messageId: assistantId,
    stage: 'submitted',
    resources,
  })
  const timestamp = new Date().toLocaleTimeString(getCurrentLanguage())
  return {
    userMessage: {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp,
      contextManifest,
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
    },
  }
}
