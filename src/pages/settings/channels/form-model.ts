import { z } from 'zod'
import type {
  ChannelJsonSchemaProperty,
  ChannelProviderManifest,
  ChatChannel,
  ChannelTargetType,
} from '@/api/channel'
import type { AgentFlow, AgentVersionSummary } from '@/types/agent'

export type ProviderFieldKind = 'text' | 'secret' | 'string_list'

export interface ProviderFieldDefinition {
  key: string
  kind: ProviderFieldKind
  required: boolean
  defaultValue: string
  title?: string
  description?: string
}

export interface ChannelFormValues {
  name: string
  provider: string
  config: Record<string, string>
  secrets: Record<string, string>
  targetType: ChannelTargetType
  targetId: string
  targetRevisionId: string
  privateChatOnly: boolean
}

export const getLatestReleasedRevision = (
  versions: readonly AgentVersionSummary[],
): AgentVersionSummary | undefined => {
  const released = versions.filter(
    (version) =>
      version.release === true &&
      Boolean(version.id) &&
      !/^version-\d+$/.test(version.id),
  )
  return released.reduce<AgentVersionSummary | undefined>((latest, version) => {
    if (!latest) return version
    const latestCreated = latest.create_time
    const candidateCreated = version.create_time
    if (
      typeof latestCreated === 'number' &&
      typeof candidateCreated === 'number' &&
      candidateCreated > latestCreated
    ) {
      return version
    }
    return latest
  }, undefined)
}

type AgentPublishState = Pick<
  AgentFlow,
  'release' | 'release_time' | 'last_publish_time'
>

export const isPublishedAgent = (agent: AgentPublishState): boolean =>
  agent.release === true ||
  agent.release_time != null ||
  agent.last_publish_time != null

export const resolveCanvasRevisionGuard = (
  currentRevisionId: string,
  latestReleasedRevision: AgentVersionSummary | undefined,
): string => currentRevisionId || latestReleasedRevision?.id || ''

const FEISHU_CREDENTIAL_PROPERTIES: Record<string, ChannelJsonSchemaProperty> =
  {
    app_id: { type: 'string' },
    app_secret: { type: 'string', format: 'password', writeOnly: true },
  }

const FEISHU_PUBLIC_PROPERTIES: Record<string, ChannelJsonSchemaProperty> = {
  domain: { type: 'string', default: 'feishu' },
  allowed_open_ids: { type: 'array', items: { type: 'string' } },
}

export const FEISHU_FALLBACK_MANIFEST: ChannelProviderManifest = {
  provider: 'feishu',
  display_name: 'Feishu',
  capabilities: { private_chat: true, text: true },
  config_schema: {
    type: 'object',
    required: ['credential'],
    properties: {
      credential: {
        type: 'object',
        required: ['app_id', 'app_secret'],
        properties: FEISHU_CREDENTIAL_PROPERTIES,
      },
      ...FEISHU_PUBLIC_PROPERTIES,
    },
  },
}

const isSecretProperty = (key: string, property: ChannelJsonSchemaProperty) =>
  property.writeOnly === true ||
  property['x-secret'] === true ||
  property.format === 'password' ||
  /(?:secret|token|password|private_key)$/i.test(key)

const resolveProperty = (
  manifest: ChannelProviderManifest,
  property: ChannelJsonSchemaProperty | undefined,
): ChannelJsonSchemaProperty | undefined => {
  if (!property?.$ref) return property
  const prefix = '#/$defs/'
  if (!property.$ref.startsWith(prefix)) return property
  return manifest.config_schema.$defs?.[property.$ref.slice(prefix.length)]
}

const getFeishuProperties = (
  manifest: ChannelProviderManifest,
): Record<string, ChannelJsonSchemaProperty> => {
  const rootProperties = manifest.config_schema.properties ?? {}
  const credential = resolveProperty(manifest, rootProperties.credential)
  const credentialProperties = credential?.properties ?? {}

  return {
    app_id: {
      ...FEISHU_CREDENTIAL_PROPERTIES.app_id,
      ...credentialProperties.app_id,
    },
    app_secret: {
      ...FEISHU_CREDENTIAL_PROPERTIES.app_secret,
      ...credentialProperties.app_secret,
      writeOnly: true,
    },
    domain: {
      ...FEISHU_PUBLIC_PROPERTIES.domain,
      ...rootProperties.domain,
    },
    allowed_open_ids: {
      ...FEISHU_PUBLIC_PROPERTIES.allowed_open_ids,
      ...rootProperties.allowed_open_ids,
    },
  }
}

export const getProviderFields = (
  manifest: ChannelProviderManifest,
): ProviderFieldDefinition[] => {
  const properties =
    manifest.provider === 'feishu'
      ? getFeishuProperties(manifest)
      : (manifest.config_schema.properties ?? {})
  const required =
    manifest.provider === 'feishu'
      ? new Set(['app_id', 'app_secret'])
      : new Set(manifest.config_schema.required ?? [])
  return Object.entries(properties).map(([key, property]) => ({
    key,
    kind: isSecretProperty(key, property)
      ? 'secret'
      : property.type === 'array'
        ? 'string_list'
        : 'text',
    required: required.has(key),
    defaultValue: typeof property.default === 'string' ? property.default : '',
    title: property.title,
    description: property.description,
  }))
}

export const getChannelFormDefaults = (
  manifest: ChannelProviderManifest,
  channel?: ChatChannel | null,
): ChannelFormValues => {
  const config: Record<string, string> = {}
  const secrets: Record<string, string> = {}
  const credential = channel?.config.credential
  const storedCredential =
    credential && typeof credential === 'object' && !Array.isArray(credential)
      ? (credential as Record<string, unknown>)
      : {}
  for (const field of getProviderFields(manifest)) {
    if (field.kind === 'secret') {
      secrets[field.key] = ''
      continue
    }
    const storedValue =
      field.key === 'app_id'
        ? storedCredential.app_id
        : channel?.config[field.key]
    config[field.key] = Array.isArray(storedValue)
      ? storedValue.filter((value) => typeof value === 'string').join('\n')
      : typeof storedValue === 'string'
        ? storedValue
        : field.defaultValue
  }

  return {
    name: channel?.name ?? '',
    provider: manifest.provider,
    config,
    secrets,
    targetType: channel?.binding?.target_type ?? 'multirag.canvas_agent',
    targetId: channel?.binding?.target_id ?? '',
    targetRevisionId: channel?.binding?.target_revision_id ?? '',
    privateChatOnly: channel?.binding?.policy.private_chat_only !== false,
  }
}

export const createChannelFormSchema = (
  manifest: ChannelProviderManifest,
  secretConfigured: boolean,
  requiredMessage: string,
) =>
  z
    .object({
      name: z.string().trim().min(1, requiredMessage),
      provider: z.string().trim().min(1, requiredMessage),
      config: z.record(z.string(), z.string()),
      secrets: z.record(z.string(), z.string()),
      targetType: z.enum(['multirag.canvas_agent', 'multirag.dialog']),
      targetId: z.string().trim().min(1, requiredMessage),
      targetRevisionId: z.string(),
      privateChatOnly: z.boolean(),
    })
    .superRefine((values, context) => {
      for (const field of getProviderFields(manifest)) {
        if (!field.required) continue
        const value =
          field.kind === 'secret'
            ? values.secrets[field.key]
            : values.config[field.key]
        if (value?.trim() || (field.kind === 'secret' && secretConfigured)) {
          continue
        }
        context.addIssue({
          code: 'custom',
          path: [field.kind === 'secret' ? 'secrets' : 'config', field.key],
          message: requiredMessage,
        })
      }

      if (
        values.targetType === 'multirag.canvas_agent' &&
        !values.targetRevisionId.trim()
      ) {
        context.addIssue({
          code: 'custom',
          path: ['targetRevisionId'],
          message: requiredMessage,
        })
      }

      if (
        values.targetType === 'multirag.dialog' &&
        values.targetRevisionId.trim()
      ) {
        context.addIssue({
          code: 'custom',
          path: ['targetRevisionId'],
          message: requiredMessage,
        })
      }
    })
