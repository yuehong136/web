/**
 * Turning the server's field list into form state, and back into a payload.
 *
 * Pure functions only — no React, no imports from components — so they are
 * reachable from `src/api/__tests__/`, which is the only test glob CI runs for
 * channel code.
 *
 * The client does not parse JSON Schema. The server sends an ordered, flattened
 * `manifest.form.fields`; everything here is bookkeeping over that list. See
 * `MultiRAG:docs/channel-program/CONTRACT.md` §5.
 */

import type {
  ChannelFormField,
  ChannelProviderManifest,
  ChatChannel,
} from '@/api/channel'

/** Split a value out of nested config by dotted path. */
export const readPath = (source: unknown, path: string): unknown => {
  let cursor = source
  for (const part of path.split('.')) {
    if (typeof cursor !== 'object' || cursor === null) return undefined
    cursor = (cursor as Record<string, unknown>)[part]
  }
  return cursor
}

const writePath = (
  target: Record<string, unknown>,
  path: string,
  value: unknown,
): void => {
  const parts = path.split('.')
  let cursor = target
  for (const part of parts.slice(0, -1)) {
    const nested = cursor[part]
    if (
      typeof nested !== 'object' ||
      nested === null ||
      Array.isArray(nested)
    ) {
      cursor[part] = {}
    }
    cursor = cursor[part] as Record<string, unknown>
  }
  cursor[parts.at(-1)!] = value
}

/**
 * Split a textarea value into a deduplicated list.
 *
 * Newline *and* comma, because administrators paste both. Preserved verbatim
 * from the previous hardcoded serializer — the existing contract test asserts
 * `'ou_1\nou_2, ou_1'` collapses to `['ou_1','ou_2']`.
 */
export const parseStringList = (value: string): string[] => [
  ...new Set(
    value
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean),
  ),
]

/**
 * The fields to render for a provider.
 *
 * When the server sends `form`, that is the whole answer. When it does not —
 * an older backend — fall back to the legacy Feishu compile so this ships
 * before the backend does. The fallback is deleted in CHN-P7, once
 * `manifest.form` is deployed everywhere.
 */
export const resolveFormFields = (
  manifest: ChannelProviderManifest,
  legacy: (manifest: ChannelProviderManifest) => ChannelFormField[],
): ChannelFormField[] => manifest.form?.fields ?? legacy(manifest)

/** Form state key for a field. `/` is not a react-hook-form path separator. */
export const fieldKey = (field: ChannelFormField): string =>
  field.path.replaceAll('.', '/')

/**
 * Seed form state from a stored channel.
 *
 * Secrets always start blank: the server never echoes them, so a populated
 * secret input could only ever be a lie. Blank on submit means "keep".
 */
export const buildFormValues = (
  fields: readonly ChannelFormField[],
  channel?: ChatChannel | null,
): {
  config: Record<string, string | boolean>
  secrets: Record<string, string>
} => {
  const config: Record<string, string | boolean> = {}
  const secrets: Record<string, string> = {}

  for (const field of fields) {
    const key = fieldKey(field)
    if (field.secret) {
      secrets[key] = ''
      continue
    }
    const stored = channel ? readPath(channel.config, field.path) : undefined
    if (field.kind === 'switch') {
      config[key] =
        typeof stored === 'boolean' ? stored : field.default === true
      continue
    }
    if (field.kind === 'string_list') {
      config[key] = Array.isArray(stored)
        ? stored
            .filter((item): item is string => typeof item === 'string')
            .join('\n')
        : ''
      continue
    }
    config[key] =
      typeof stored === 'string'
        ? stored
        : typeof field.default === 'string'
          ? field.default
          : ''
  }

  return { config, secrets }
}

/**
 * Rebuild the nested config the server expects.
 *
 * Blank secrets are omitted entirely rather than sent empty — an empty string
 * would read as "clear this credential", and the whole point is that blank
 * means unchanged.
 */
export const assembleConfig = (
  fields: readonly ChannelFormField[],
  values: {
    config: Record<string, string | boolean>
    secrets: Record<string, string>
  },
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {}

  for (const field of fields) {
    const key = fieldKey(field)
    if (field.secret) {
      const secret = values.secrets[key]?.trim()
      if (secret) writePath(payload, field.path, secret)
      continue
    }

    const raw = values.config[key]
    if (field.kind === 'switch') {
      writePath(payload, field.path, Boolean(raw))
      continue
    }
    if (field.kind === 'string_list') {
      writePath(payload, field.path, parseStringList(String(raw ?? '')))
      continue
    }
    const text = String(raw ?? '').trim()
    // A blank optional text field is left out rather than sent as "", which the
    // server would store as a real empty value.
    if (text || field.required) writePath(payload, field.path, text)
  }

  return payload
}

/** Paths whose value is still missing, for client-side required checks. */
export const missingRequiredFields = (
  fields: readonly ChannelFormField[],
  values: {
    config: Record<string, string | boolean>
    secrets: Record<string, string>
  },
  secretConfigured: boolean,
): string[] =>
  fields
    .filter((field) => {
      if (!field.required) return false
      const key = fieldKey(field)
      if (field.secret) {
        // Already stored counts as present: the input is blank by design.
        return !secretConfigured && !values.secrets[key]?.trim()
      }
      const raw = values.config[key]
      if (typeof raw === 'boolean') return false
      return !String(raw ?? '').trim()
    })
    .map((field) => field.path)
