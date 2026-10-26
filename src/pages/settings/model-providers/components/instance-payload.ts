import { modelProvidersAPI } from '@/api/llm-providers'
import type {
  InstanceModelInput,
  InstanceInput,
} from '@/api/llm-provider-types'
import { modelTypeSchema } from '@/api/llm-provider-types'

/** Keep complete provider credential envelopes isolated to the selected instance. */
export function buildInstancePayload(
  provider: string,
  name: string,
  key: string,
  baseUrl: string | undefined,
  fields: Record<string, unknown>,
  region: string,
): { instance: InstanceInput; model?: InstanceModelInput } {
  if (!name.trim()) throw new Error('instance-name-required')
  const credential = fields.api_key ?? key
  let envelope: Record<string, unknown> = {}
  if (
    typeof credential === 'object' &&
    credential !== null &&
    !Array.isArray(credential)
  )
    envelope = { ...credential }
  else if (
    typeof credential === 'string' &&
    credential.trim().startsWith('{')
  ) {
    const decoded: unknown = JSON.parse(credential)
    if (typeof decoded !== 'object' || !decoded || Array.isArray(decoded))
      throw new Error('invalid-credential-envelope')
    envelope = { ...decoded }
  } else if (credential !== undefined && credential !== '')
    envelope.api_key = credential
  const reserved = new Set([
    'llm_factory',
    'llm_name',
    'model_name',
    'model_type',
    'mdl_type',
    'max_tokens',
    'is_tools',
    'api_base',
    'base_url',
    'api_key',
  ])
  for (const [field, value] of Object.entries(fields))
    if (!reserved.has(field) && value !== undefined) envelope[field] = value
  if (provider === 'SILICONFLOW')
    envelope.source_fid = (baseUrl ?? '')
      .toLowerCase()
      .includes('api.siliconflow.com')
      ? 'siliconflow_intl'
      : provider
  const modelName = fields.llm_name ?? fields.model_name
  const modelTypes = modelTypeSchema
    .array()
    .nonempty()
    .parse(
      Array.isArray(fields.model_type)
        ? fields.model_type
        : String(fields.mdl_type ?? fields.model_type ?? 'chat').split(','),
    )
  const maxTokens = fields.max_tokens ?? 0
  if (
    typeof maxTokens !== 'number' ||
    !Number.isSafeInteger(maxTokens) ||
    maxTokens < 0
  )
    throw new Error('invalid-max-tokens')
  return {
    instance: {
      instance_name: name.trim(),
      api_key:
        Object.keys(envelope).length === 1 &&
        typeof envelope.api_key === 'string'
          ? envelope.api_key
          : Object.keys(envelope).length
            ? JSON.stringify(envelope)
            : '',
      base_url: baseUrl ?? String(fields.api_base ?? ''),
      region,
      ...(modelName ? { model_ids: [] } : {}),
    },
    ...(typeof modelName === 'string' && modelName.trim()
      ? {
          model: {
            model_name: modelName.trim(),
            model_types: [...new Set(modelTypes)],
            max_tokens: maxTokens,
            is_tools: fields.is_tools === true,
          },
        }
      : {}),
  }
}

export async function saveProviderInstance({
  provider,
  providerExists,
  payload,
  createdIdentity,
  isCurrent,
  onCreated,
  api = modelProvidersAPI,
}: {
  provider: string
  providerExists: boolean
  payload: ReturnType<typeof buildInstancePayload>
  createdIdentity: string | null
  isCurrent: () => boolean
  onCreated: (identity: string) => void
  api?: Pick<
    typeof modelProvidersAPI,
    'createProvider' | 'createInstance' | 'updateInstance' | 'addModel'
  >
}) {
  const current = () => {
    if (!isCurrent()) throw new DOMException('Request superseded', 'AbortError')
  }
  current()
  if (!providerExists) await api.createProvider(provider)
  current()
  const identity = `${provider}\u0000${payload.instance.instance_name}`
  if (createdIdentity !== identity) {
    await api.createInstance(provider, payload.instance)
    current()
    onCreated(identity)
  } else {
    // A prior model write failed. Persist the currently submitted instance edits before retrying it.
    const { api_key, base_url, region } = payload.instance
    await api.updateInstance(provider, payload.instance.instance_name, {
      api_key,
      base_url,
      region,
    })
  }
  current()
  if (payload.model)
    await api.addModel(provider, payload.instance.instance_name, payload.model)
  current()
}
