import { BeginQueryType } from '../constant'
import type { AgentShareInputField, AgentShareSummary } from '@/types/agent'

export type ShareFormValue = string | number | boolean | unknown[]
export type ShareFormValues = Record<string, ShareFormValue>

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

export function getShareInputEntries(inputs?: AgentShareSummary['inputs']) {
  return Object.entries(inputs || {}).map(([key, field]) => ({
    key,
    field: {
      ...field,
      key: field.key || key,
      label: field.label || field.name || key,
      name: field.name || field.label || key,
    },
  }))
}

export function getDefaultShareInputValue(
  field: AgentShareInputField,
): ShareFormValue {
  if (field.value !== undefined) {
    return field.value
  }

  switch (field.type) {
    case BeginQueryType.Integer:
      return ''
    case BeginQueryType.Boolean:
      return false
    case BeginQueryType.File:
      return []
    case BeginQueryType.PersonData:
      return []
    case BeginQueryType.Options:
      return Array.isArray(field.options) && field.options.length > 0
        ? String(field.options[0])
        : ''
    default:
      return ''
  }
}

export function buildInitialShareValues(
  inputs?: AgentShareSummary['inputs'],
  presetData: Record<string, string> = {},
): ShareFormValues {
  return Object.fromEntries(
    getShareInputEntries(inputs).map(({ key, field }) => [
      key,
      presetData[key] ?? getDefaultShareInputValue(field),
    ]),
  )
}

export function buildShareInputsPayload(
  fields: AgentShareSummary['inputs'],
  values: ShareFormValues,
) {
  return Object.fromEntries(
    getShareInputEntries(fields).map(({ key, field }) => {
      const value = values[key] ?? getDefaultShareInputValue(field)

      return [
        key,
        {
          ...field,
          key: undefined,
          value,
        },
      ]
    }),
  )
}

export function formatShareInputSummary(values: ShareFormValues) {
  return Object.entries(values)
    .filter(([, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== undefined && value !== null && value !== ''
    })
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value
          .map((item) => {
            if (isRecord(item)) {
              return (
                item.name || item.filename || item.id || JSON.stringify(item)
              )
            }
            return String(item)
          })
          .join(', ')}`
      }

      return `${key}: ${String(value)}`
    })
    .join('\n')
}

export function isRequiredShareInput(field: AgentShareInputField) {
  return field.required !== false && !field.optional
}
