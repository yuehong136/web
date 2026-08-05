import { z } from 'zod'
import type {
  ChannelFormField,
  ChatChannel,
  ChannelTargetType,
} from '@/api/channel'
import { buildFormValues, fieldKey, missingRequiredFields } from './form-spec'
import type { AgentFlow, AgentVersionSummary } from '@/types/agent'

export interface ChannelFormValues {
  name: string
  provider: string
  /**
   * Keyed by a field's dotted path with `.` replaced by `/` (react-hook-form
   * treats `.` as a path separator). Booleans are in here because a provider
   * can declare a `switch` field — the previous `Record<string, string>` could
   * not represent that, nor any nesting, at the type level.
   */
  config: Record<string, string | boolean>
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

export const getChannelFormDefaults = (
  fields: readonly ChannelFormField[],
  provider: string,
  channel?: ChatChannel | null,
): ChannelFormValues => {
  const { config, secrets } = buildFormValues(fields, channel)

  return {
    name: channel?.name ?? '',
    provider,
    config,
    secrets,
    targetType: channel?.binding?.target_type ?? 'multirag.canvas_agent',
    targetId: channel?.binding?.target_id ?? '',
    targetRevisionId: channel?.binding?.target_revision_id ?? '',
    privateChatOnly: channel?.binding?.policy.private_chat_only !== false,
  }
}

/**
 * Build the form schema for one provider.
 *
 * Takes the resolved field list rather than a manifest, so the caller cannot
 * accidentally validate against a different provider than it renders — which
 * is exactly what used to happen: the schema was built from `providers[0]`
 * while the form rendered the selected provider, so choosing any other one
 * produced zod issues on unmounted fields. `handleSubmit` then never reached
 * its success branch and never surfaced an error either, so the Save button
 * silently did nothing, permanently.
 */
export const createChannelFormSchema = (
  fields: readonly ChannelFormField[],
  secretConfigured: boolean,
  requiredMessage: string,
) =>
  z
    .object({
      name: z.string().trim().min(1, requiredMessage),
      provider: z.string().trim().min(1, requiredMessage),
      config: z.record(z.string(), z.union([z.string(), z.boolean()])),
      secrets: z.record(z.string(), z.string()),
      targetType: z.enum(['multirag.canvas_agent', 'multirag.dialog']),
      targetId: z.string().trim().min(1, requiredMessage),
      targetRevisionId: z.string(),
      privateChatOnly: z.boolean(),
    })
    .superRefine((values, context) => {
      for (const path of missingRequiredFields(
        fields,
        values,
        secretConfigured,
      )) {
        const field = fields.find((item) => item.path === path)
        if (!field) continue
        context.addIssue({
          code: 'custom',
          path: [field.secret ? 'secrets' : 'config', fieldKey(field)],
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
