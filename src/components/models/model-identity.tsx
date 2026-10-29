import { useContext, useSyncExternalStore } from 'react'
import { QueryClientContext } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bot } from 'lucide-react'
import { ProviderIcon } from '@/components/ui/provider-icon'
import {
  resolveMessageModelIdentity,
  type ModelIdentitySnapshot,
} from '@/lib/model-identity'
import type { MyLLMProvider } from '@/stores/model'
import { llmKeys } from '@/hooks/use-llm-request'

const EMPTY: MyLLMProvider = {}
const noop = () => () => {}
/** Identity may use authorized cached metadata; rendering never probes a provider. */
export function useModelIdentity(snapshot: ModelIdentitySnapshot) {
  const client = useContext(QueryClientContext)
  const providers = useSyncExternalStore(
    client ? (listener) => client.getQueryCache().subscribe(listener) : noop,
    () => client?.getQueryData<MyLLMProvider>(llmKeys.myLLMs()) ?? EMPTY,
    () => EMPTY,
  )
  return resolveMessageModelIdentity(snapshot, providers)
}
export function ModelIdentityLogo(snapshot: ModelIdentitySnapshot) {
  const identity = useModelIdentity(snapshot)
  return identity.provider ? (
    <ProviderIcon provider={identity.provider} size={24} className="size-6" />
  ) : (
    <Bot aria-hidden className="size-6 text-text-secondary" />
  )
}
export function ModelIdentity({
  showLogo = true,
  ...snapshot
}: ModelIdentitySnapshot & { showLogo?: boolean }) {
  const { t } = useTranslation()
  const identity = useModelIdentity(snapshot)
  return (
    <span
      className="inline-flex min-w-0 items-center gap-space-xs text-text-primary"
      data-model-identity
    >
      {showLogo && <ModelIdentityLogo {...snapshot} />}
      <span className="min-w-0 break-words">
        {identity.label ??
          t(
            snapshot.reference
              ? 'common.modelPicker.savedModel'
              : 'chat.transcript.assistant',
          )}
      </span>
    </span>
  )
}
export function modelMessageProps(snapshot?: ModelIdentitySnapshot) {
  return {
    header: <ModelIdentity {...snapshot} showLogo={false} />,
    avatar: <ModelIdentityLogo {...snapshot} />,
  }
}
