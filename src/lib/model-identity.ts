import {
  getLLMModelLabel,
  getLLMModelValue,
  parseLLMValue,
  type MyLLMProvider,
} from '@/stores/model'

const readable = (value?: string) =>
  value && !/^#?\d+$/.test(value.trim()) ? value : undefined

/** Resolve identity only; disabled models still have a name and provider. */
export function resolveModelIdentity(
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

export interface ModelIdentitySnapshot {
  reference?: string
  label?: string
  provider?: string
}
export function resolveMessageModelIdentity(
  snapshot: ModelIdentitySnapshot,
  providers: MyLLMProvider,
) {
  const resolved = resolveModelIdentity(providers, snapshot.reference)
  return {
    label:
      (snapshot.label !== snapshot.reference
        ? readable(snapshot.label)
        : undefined) ?? resolved.label,
    provider: snapshot.provider ?? resolved.provider,
  }
}

/** Display metadata is stored with the turn, never used to choose a provider. */
export function modelIdentityPayload(snapshot?: ModelIdentitySnapshot) {
  return snapshot?.reference
    ? {
        model_identity: {
          reference: snapshot.reference,
          ...(snapshot.label ? { label: snapshot.label } : {}),
          ...(snapshot.provider ? { provider: snapshot.provider } : {}),
        },
      }
    : {}
}

function readModelIdentity(value: unknown): ModelIdentitySnapshot | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return
  const record = value as Record<string, unknown>
  if (typeof record.reference !== 'string' || !record.reference.trim()) return
  return {
    reference: record.reference,
    ...(typeof record.label === 'string' ? { label: record.label } : {}),
    ...(typeof record.provider === 'string'
      ? { provider: record.provider }
      : {}),
  }
}

/** The completion API stores the submitted user's metadata; its reply shares the turn id. */
export function historyModelIdentities(
  messages: readonly { role?: string; id?: string; model_identity?: unknown }[],
): (ModelIdentitySnapshot | undefined)[] {
  let user: { id?: string; identity?: ModelIdentitySnapshot } | undefined
  return messages.map((message) => {
    const identity = readModelIdentity(message.model_identity)
    if (message.role === 'user') user = { id: message.id, identity }
    return (
      identity ??
      (message.role === 'assistant' && message.id && message.id === user?.id
        ? user.identity
        : undefined)
    )
  })
}
