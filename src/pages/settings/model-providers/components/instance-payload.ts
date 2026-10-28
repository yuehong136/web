import { modelProvidersAPI } from '@/api/llm-providers'
import type {
  InstanceInput,
  ConnectionCandidate,
} from '@/api/llm-provider-types'
import { modelTypeSchema } from '@/api/llm-provider-types'

/** Only exact official hosts imply a region; custom endpoints require an explicit choice. */
export function resolveInstanceRegion(
  provider: string,
  baseUrl: string,
  region: string,
): string {
  if (provider !== 'SILICONFLOW') return region
  if (!['', 'default', 'cn', 'intl'].includes(region))
    throw Error('invalid-region')
  let official: 'cn' | 'intl' | undefined
  if (baseUrl) {
    let url: URL
    try {
      url = new URL(baseUrl)
    } catch {
      throw Error('invalid-base-url')
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw Error('invalid-base-url')
    if (url.hostname === 'api.siliconflow.com') official = 'intl'
    if (url.hostname === 'api.siliconflow.cn') official = 'cn'
  }
  const explicit = region ? (region === 'intl' ? 'intl' : 'cn') : undefined
  if (official && explicit && official !== explicit)
    throw Error('region-url-conflict')
  return explicit ?? official ?? 'cn'
}

/** Keep complete provider credential envelopes isolated to the selected instance. */
export function buildConnectionCandidate(
  provider: string,
  key: string,
  baseUrl: string | undefined,
  fields: Record<string, unknown>,
  region: string,
): ConnectionCandidate {
  const credential = fields.api_key ?? key
  if (
    provider === 'SILICONFLOW' &&
    (typeof credential !== 'string' || credential.trim().startsWith('{'))
  )
    throw Error('raw-credential-required')
  const endpoint = (baseUrl ?? String(fields.api_base ?? '')).trim()
  const resolvedRegion = resolveInstanceRegion(provider, endpoint, region)
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
    'region',
    'source_fid',
    'verify',
  ])
  for (const [field, value] of Object.entries(fields))
    if (!reserved.has(field) && value !== undefined) envelope[field] = value
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
    api_key:
      Object.keys(envelope).length === 1 && typeof envelope.api_key === 'string'
        ? envelope.api_key
        : Object.keys(envelope).length
          ? JSON.stringify(envelope)
          : '',
    base_url: endpoint,
    region: resolvedRegion,
    ...(typeof modelName === 'string' && modelName.trim()
      ? {
          model_ids: [],
          custom_model: {
            model_name: modelName.trim(),
            model_types: [...new Set(modelTypes)],
            max_tokens: maxTokens,
            is_tools: fields.is_tools === true,
          },
        }
      : {}),
  }
}

export function buildInstancePayload(
  provider: string,
  name: string,
  key: string,
  baseUrl: string | undefined,
  fields: Record<string, unknown>,
  region: string,
): { instance: InstanceInput } {
  if (!name.trim()) throw new Error('instance-name-required')
  return {
    instance: {
      instance_name: name.trim(),
      ...buildConnectionCandidate(provider, key, baseUrl, fields, region),
    },
  }
}

export async function saveProviderInstance({
  provider,
  payload,
  isCurrent,
  api = modelProvidersAPI,
}: {
  provider: string
  payload: ReturnType<typeof buildInstancePayload>
  isCurrent: () => boolean
  api?: Pick<typeof modelProvidersAPI, 'createInstance'>
}) {
  const current = () => {
    if (!isCurrent()) throw new DOMException('Request superseded', 'AbortError')
  }
  current()
  await api.createInstance(provider, payload.instance)
  current()
}
