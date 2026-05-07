import type { AgentGlobalVariable } from '@/types/agent'
import { TypesWithArray } from '../constant'
import { DEFAULT_GLOBAL_VARIABLE_FORM_VALUES } from './constants'

export type GlobalVariableFormValues = {
  name: string
  type: string
  value: string
  description?: string
}

export function normalizeGlobalVariables(
  variables?: Record<string, AgentGlobalVariable>,
) {
  return Object.entries(variables || {}).reduce<
    Record<string, AgentGlobalVariable>
  >((acc, [key, variable]) => {
    acc[key] = {
      ...variable,
      name: variable?.name || key,
      type: variable?.type || TypesWithArray.String,
      description: variable?.description || '',
    }
    return acc
  }, {})
}

export function getDefaultValueForType(type: string) {
  switch (type) {
    case TypesWithArray.Number:
      return '0'
    case TypesWithArray.Boolean:
      return 'false'
    case TypesWithArray.Object:
      return '{}'
    case TypesWithArray.ArrayString:
    case TypesWithArray.ArrayNumber:
    case TypesWithArray.ArrayBoolean:
    case TypesWithArray.ArrayObject:
      return '[]'
    default:
      return ''
  }
}

export function formatGlobalVariableFormValue(
  variable?: Partial<AgentGlobalVariable> | null,
): GlobalVariableFormValues {
  if (!variable) {
    return DEFAULT_GLOBAL_VARIABLE_FORM_VALUES
  }

  const value = variable.value
  return {
    name: variable.name || '',
    type: variable.type || TypesWithArray.String,
    value:
      typeof value === 'string'
        ? value
        : value === undefined
          ? getDefaultValueForType(variable.type || TypesWithArray.String)
          : JSON.stringify(value, null, 2),
    description:
      typeof variable.description === 'string' ? variable.description : '',
  }
}

export function parseGlobalVariableValue(type: string, rawValue: string) {
  switch (type) {
    case TypesWithArray.Number:
      return Number(rawValue || 0)
    case TypesWithArray.Boolean:
      return rawValue === 'true'
    case TypesWithArray.Object:
      return assertPlainObject(
        rawValue.trim() ? JSON.parse(rawValue) : JSON.parse(getDefaultValueForType(type)),
      )
    case TypesWithArray.ArrayString:
      return assertArrayOf(
        rawValue.trim() ? JSON.parse(rawValue) : JSON.parse(getDefaultValueForType(type)),
        'string',
      )
    case TypesWithArray.ArrayNumber:
      return assertArrayOf(
        rawValue.trim() ? JSON.parse(rawValue) : JSON.parse(getDefaultValueForType(type)),
        'number',
      )
    case TypesWithArray.ArrayBoolean:
      return assertArrayOf(
        rawValue.trim() ? JSON.parse(rawValue) : JSON.parse(getDefaultValueForType(type)),
        'boolean',
      )
    case TypesWithArray.ArrayObject:
      return assertArrayOfObjects(
        rawValue.trim() ? JSON.parse(rawValue) : JSON.parse(getDefaultValueForType(type)),
      )
    default:
      return rawValue
  }
}

function assertPlainObject(value: unknown) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected object')
  }
  return value
}

function assertArrayOf(value: unknown, itemType: string) {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === itemType)
  ) {
    throw new Error(`Expected array<${itemType}>`)
  }
  return value
}

function assertArrayOfObjects(value: unknown) {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) => typeof item === 'object' && item !== null && !Array.isArray(item),
    )
  ) {
    throw new Error('Expected array<object>')
  }
  return value
}

export function buildGlobalVariableFromForm(
  values: GlobalVariableFormValues,
): AgentGlobalVariable {
  return {
    name: values.name,
    type: values.type,
    value: parseGlobalVariableValue(values.type, values.value),
    description: values.description || '',
  }
}
