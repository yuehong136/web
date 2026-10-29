import {
  getLLMModelLabel,
  getLLMModelValue,
  parseLLMValue,
  type MyLLMProvider,
} from '@/stores/model'
import type { ContextManifest } from '@/lib/ai-workspace/contracts'

const readable = (value?: string) =>
  value && !/^#?\d+$/.test(value.trim()) ? value : undefined

/** Resolve identity only; disabled models still have a name and provider. */
export function resolveHomeModelIdentity(
  providers: MyLLMProvider,
  reference?: string,
) {
  const rows = Object.entries(providers).flatMap(([provider, data]) =>
    data.llm.map((model) => ({ provider, model })),
  )
  const exact = rows.filter(
    ({ provider, model }) => getLLMModelValue(model, provider) === reference,
  )
  const parsed = parseLLMValue(reference)
  const legacy = rows.filter(
    ({ provider, model }) =>
      model.name === parsed.modelName &&
      (!parsed.providerName || provider === parsed.providerName),
  )
  const matches = [
    ...new Map(
      (exact.length ? exact : legacy).map((row) => [
        getLLMModelValue(row.model, row.provider),
        row,
      ]),
    ).values(),
  ]
  if (matches.length === 1)
    return {
      label: getLLMModelLabel(matches[0].model),
      provider: matches[0].provider,
    }
  return {
    label: readable(parsed.modelName),
    provider: parsed.providerName ?? undefined,
  }
}

export function homeMessageIdentity(
  manifest: ContextManifest | undefined,
  providers: MyLLMProvider,
  fallbackReference?: string,
  fallbackAppName?: string,
) {
  const app = manifest?.resources.find((resource) => resource.kind === 'app')
  if (app) return { label: app.label, provider: undefined }
  const model = manifest?.resources.find(
    (resource) => resource.kind === 'model',
  )
  const resolved = resolveHomeModelIdentity(
    providers,
    model?.id ?? fallbackReference,
  )
  return {
    label: model
      ? ((model.label !== model.id ? readable(model.label) : undefined) ??
        resolved.label)
      : fallbackAppName || resolved.label,
    provider: model?.provider ?? resolved.provider,
  }
}
