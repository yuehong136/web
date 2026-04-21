import type { BeginQuery } from '../../types'

type BeginOptionValue = string | number | boolean

export interface BeginInputEditorItem
  extends Omit<BeginQuery, 'options'> {
  options?: Array<{ value: BeginOptionValue }>
}

type WebhookSchemaSection = Array<{
  key?: string
  type?: string
  required?: boolean
}>

type BeginSchema = {
  query?: WebhookSchemaSection
  headers?: WebhookSchemaSection
  body?: WebhookSchemaSection
}

function normalizeOptionValue(value: unknown): BeginOptionValue {
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }

  if (value && typeof value === 'object' && 'value' in value) {
    const nextValue = (value as { value?: unknown }).value
    if (
      typeof nextValue === 'string' ||
      typeof nextValue === 'number' ||
      typeof nextValue === 'boolean'
    ) {
      return nextValue
    }
  }

  return ''
}

export function createDefaultBeginInput(): BeginInputEditorItem {
  return {
    key: '',
    name: '',
    value: '',
    type: 'line',
    optional: false,
    options: [],
  }
}

export function normalizeBeginInputsForEditor(
  inputs: unknown,
): BeginInputEditorItem[] {
  if (Array.isArray(inputs)) {
    return inputs.map((item) => {
      const nextItem = (item || {}) as Partial<BeginQuery>

      return {
        key: nextItem.key || '',
        name: nextItem.name || '',
        value: typeof nextItem.value === 'string' ? nextItem.value : '',
        type: nextItem.type || 'line',
        optional: Boolean(nextItem.optional),
        options: Array.isArray(nextItem.options)
          ? nextItem.options.map((option) => ({
              value: normalizeOptionValue(option),
            }))
          : [],
      }
    })
  }

  if (!inputs || typeof inputs !== 'object') {
    return []
  }

  return Object.entries(inputs as Record<string, BeginQuery>).map(
    ([key, value]) => ({
      key,
      name: value?.name || key,
      value: typeof value?.value === 'string' ? value.value : '',
      type: value?.type || 'line',
      optional: Boolean(value?.optional),
      label: value?.label,
      required: value?.required,
      options: Array.isArray(value?.options)
        ? value.options.map((option) => ({
            value: normalizeOptionValue(option),
          }))
        : [],
    }),
  )
}

export function serializeBeginInputsForStore(
  inputs: BeginInputEditorItem[] = [],
) {
  return inputs.reduce<Record<string, Omit<BeginQuery, 'key'>>>(
    (result, item) => {
      const key = item.key?.trim()

      if (!key) {
        return result
      }

      result[key] = {
        name: item.name?.trim() || key,
        value: typeof item.value === 'string' ? item.value : '',
        type: item.type || 'line',
        optional: Boolean(item.optional),
        label: item.label,
        required: item.required,
        options: Array.isArray(item.options)
          ? item.options
              .map((option) => normalizeOptionValue(option))
              .filter((option) => `${option}`.trim().length > 0)
          : [],
      }

      return result
    },
    {},
  )
}

export function buildBeginWebhookOutputs(schema?: BeginSchema) {
  const outputs: Record<string, { type?: string }> = {}

  ;(['query', 'headers', 'body'] as const).forEach((sectionKey) => {
    const section = schema?.[sectionKey]
    if (!Array.isArray(section)) {
      return
    }

    section.forEach((item) => {
      const key = item?.key?.trim()
      if (!key) {
        return
      }

      outputs[`${sectionKey}.${key}`] = {
        type: item?.type,
      }
    })
  })

  return outputs
}
