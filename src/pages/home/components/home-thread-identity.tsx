import { Bot } from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { ProviderIcon } from '@/components/ui/provider-icon'
import type { DialogApp } from '@/types/api'
import type { MyLLMProvider } from '@/stores/model'
import {
  homeMessageIdentity,
  resolveHomeModelIdentity,
} from '../utils/model-identity'
import type { ChatMessage } from '../types'

interface HomeThreadIdentityInput {
  app?: DialogApp
  messages: ChatMessage[]
  providers: MyLLMProvider
  selectedModelId: string
}

/**
 * Who answers this conversation, shown once in the header: the selected app,
 * or the model of the latest answer (else the model chosen for the next turn).
 * Returns null when nothing can be named.
 */
export function renderHomeThreadIdentity({
  app,
  messages,
  providers,
  selectedModelId,
}: HomeThreadIdentityInput) {
  if (app)
    return (
      <>
        <EntityAvatar name={app.name} src={app.icon} seed={app.id} size="2xs" />
        <span className="truncate">{app.name}</span>
      </>
    )
  const latest = messages.findLast((message) => message.role === 'assistant')
  const identity = latest
    ? homeMessageIdentity(
        latest.contextManifest,
        providers,
        latest.modelIdentity,
      )
    : resolveHomeModelIdentity(providers, selectedModelId)
  if (!identity.label) return null
  return (
    <>
      {identity.provider ? (
        <ProviderIcon provider={identity.provider} size={16} />
      ) : (
        <Bot aria-hidden="true" className="size-icon-xs" />
      )}
      <span className="truncate">{identity.label}</span>
    </>
  )
}
