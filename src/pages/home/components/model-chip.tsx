import { useModelIdentity } from '@/components/models/model-identity'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { ResourceChip } from '@/components/patterns/resource-card'

/**
 * An app's model on a card: provider logo and model name, resolved from the
 * cached model inventory. Nothing renders when the reference cannot be named.
 */
export function ModelChip({ reference }: { reference?: string | null }) {
  const identity = useModelIdentity({ reference: reference || undefined })
  if (!reference || !identity.label) return null
  return (
    <ResourceChip
      icon={
        identity.provider ? (
          <ProviderLogo provider={identity.provider} size="xs" tile={false} />
        ) : undefined
      }
    >
      {identity.label}
    </ResourceChip>
  )
}
