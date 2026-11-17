import type { VariableType } from '@/types/api'

/** An environment variable before it is saved. */
export interface VariableDraft {
  key_name: string
  key_value: string
  description: string
  is_secret: boolean
  variable_type: VariableType
}

/** A variable of an environment that is still being created (not saved yet). */
export interface CreateModeVariable extends VariableDraft {
  /** Temporary id for list keys and removal. */
  id: string
}

export interface ResolveResult {
  resolved_text: string
  variables_used: string[]
  missing_variables: string[]
}

export const VARIABLE_TYPES: readonly VariableType[] = [
  'string',
  'number',
  'boolean',
]

export const emptyVariableDraft = (): VariableDraft => ({
  key_name: '',
  key_value: '',
  description: '',
  is_secret: false,
  variable_type: 'string',
})

const VARIABLE_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/
const VARIABLE_REFERENCE = /\{\{(\w+)\}\}/g

/** Whether a value can be stored as the given variable type. */
export function isValueOfType(value: string, type: VariableType): boolean {
  switch (type) {
    case 'number':
      return value.trim() !== '' && !Number.isNaN(Number(value))
    case 'boolean':
      return ['true', 'false'].includes(value.toLowerCase())
    default:
      return true
  }
}

export type VariableDraftProblem =
  | 'nameRequired'
  | 'nameInvalid'
  | 'nameExists'
  | 'typeMismatch'

/**
 * The first problem that blocks saving a variable, as a key under
 * `environment.variables`, or null when it can be saved.
 */
export function variableDraftProblem(
  draft: Pick<VariableDraft, 'key_name' | 'key_value' | 'variable_type'>,
  otherNames: Iterable<string>,
): VariableDraftProblem | null {
  if (!draft.key_name.trim()) return 'nameRequired'
  if (!VARIABLE_NAME.test(draft.key_name)) return 'nameInvalid'
  for (const name of otherNames) {
    if (name === draft.key_name) return 'nameExists'
  }
  if (!isValueOfType(draft.key_value, draft.variable_type))
    return 'typeMismatch'
  return null
}

/** Resolves `{{name}}` references against variables that are not saved yet. */
export function resolveLocally(
  text: string,
  variables: ReadonlyArray<Pick<VariableDraft, 'key_name' | 'key_value'>>,
): ResolveResult {
  const values = new Map(variables.map((v) => [v.key_name, v.key_value]))
  const references = [...text.matchAll(VARIABLE_REFERENCE)].map(
    (match) => match[1],
  )
  return {
    resolved_text: text.replace(VARIABLE_REFERENCE, (match, key: string) =>
      values.has(key) ? (values.get(key) as string) : match,
    ),
    variables_used: [...values.keys()].filter((key) =>
      references.includes(key),
    ),
    missing_variables: [
      ...new Set(references.filter((key) => !values.has(key))),
    ],
  }
}

/** Empty is allowed; otherwise an http(s) URL. */
export function isValidBaseUrl(url: string): boolean {
  if (!url) return true
  try {
    const { protocol } = new URL(url)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** The placeholder and example used for base URLs. */
export const BASE_URL_EXAMPLE = 'http://192.168.188.192:8123'

/** Masks a secret value: one dot per character, at most eight. */
export const maskSecret = (value: string) =>
  '•'.repeat(Math.min(value.length, 8))
