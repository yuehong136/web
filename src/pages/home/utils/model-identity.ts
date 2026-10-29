import { resolveMessageModelIdentity } from '@/lib/model-identity'
import type { MyLLMProvider } from '@/stores/model'
import type { ContextManifest } from '@/lib/ai-workspace/contracts'
export { resolveModelIdentity as resolveHomeModelIdentity } from '@/lib/model-identity'

/** History belongs to its submitted snapshot, never the current selection. */
export function homeMessageIdentity(
  manifest: ContextManifest | undefined,
  providers: MyLLMProvider,
) {
  const model = manifest?.resources.find(
    (resource) => resource.kind === 'model',
  )
  if (model)
    return resolveMessageModelIdentity(
      { reference: model.id, label: model.label, provider: model.provider },
      providers,
    )
  const app = manifest?.resources.find((resource) => resource.kind === 'app')
  return { label: app?.label, provider: undefined }
}
