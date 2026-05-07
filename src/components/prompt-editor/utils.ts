import type { VariableOptionGroup, VariableOptionItem } from './types'

const VARIABLE_REFERENCE_REGEX = /{([^}]*)}/g
const STRUCTURED_OUTPUT_FIELD = 'structured'

function normalizeSearchValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function buildSearchText(option: VariableOptionItem) {
  return [
    option.parentLabel,
    option.label,
    option.value,
    option.type,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function filterVariableOptionGroups(
  groups: VariableOptionGroup[],
  query?: string | null,
) {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return groups.map((group) => ({
      ...group,
      options: group.options.map((option) => ({
        ...option,
        parentLabel: option.parentLabel ?? group.title,
      })),
    }))
  }

  return groups
    .map((group) => ({
      ...group,
      options: group.options
        .map((option) => ({
          ...option,
          parentLabel: option.parentLabel ?? group.title,
        }))
        .filter((option) => buildSearchText(option).includes(normalizedQuery)),
    }))
    .filter((group) => group.options.length > 0)
}

export function flattenVariableOptions(groups: VariableOptionGroup[]) {
  return groups.flatMap((group) =>
    group.options.map((option) => ({
      ...option,
      parentLabel: option.parentLabel ?? group.title,
    })),
  )
}

export function buildVariableOptionLookup(groups: VariableOptionGroup[]) {
  return flattenVariableOptions(groups).reduce<
    Record<string, VariableOptionItem>
  >((acc, option) => {
    acc[option.value] = option
    return acc
  }, {})
}

export function buildVariableOptionSignature(groups: VariableOptionGroup[]) {
  return flattenVariableOptions(groups)
    .map((option) =>
      [
        option.value,
        option.label,
        option.parentLabel,
        option.type,
        option.insertMode,
      ]
        .filter(Boolean)
        .join(':'),
    )
    .join('|')
}

export function normalizeVariableReference(value?: string | null) {
  if (typeof value !== 'string') {
    return ''
  }

  let nextValue = value.trim()
  while (nextValue.startsWith('{') || nextValue.endsWith('}')) {
    if (nextValue.startsWith('{')) {
      nextValue = nextValue.slice(1).trim()
    }
    if (nextValue.endsWith('}')) {
      nextValue = nextValue.slice(0, -1).trim()
    }
  }
  return nextValue
}

export function parsePromptVariableReferences(value?: string | null) {
  const text = value ?? ''
  const references: string[] = []
  let match: RegExpExecArray | null

  while ((match = VARIABLE_REFERENCE_REGEX.exec(text)) !== null) {
    const reference = normalizeVariableReference(match[1])
    if (reference && !references.includes(reference)) {
      references.push(reference)
    }
  }

  VARIABLE_REFERENCE_REGEX.lastIndex = 0
  return references
}

export function parseStructuredOutputReference(value?: string | null) {
  const normalizedValue = normalizeVariableReference(value)
  const separatorIndex = normalizedValue.indexOf('@')

  if (separatorIndex < 0) {
    return undefined
  }

  const nodeId = normalizedValue.slice(0, separatorIndex)
  const field = normalizedValue.slice(separatorIndex + 1)

  if (
    !nodeId ||
    !(
      field === STRUCTURED_OUTPUT_FIELD ||
      field.startsWith(`${STRUCTURED_OUTPUT_FIELD}.`) ||
      field.startsWith(`${STRUCTURED_OUTPUT_FIELD}[`)
    )
  ) {
    return undefined
  }

  return {
    nodeId,
    field,
    baseValue: `${nodeId}@${STRUCTURED_OUTPUT_FIELD}`,
    path: field.slice(STRUCTURED_OUTPUT_FIELD.length).replace(/^\./, ''),
  }
}

export function isStructuredOutputReference(value?: string | null) {
  return Boolean(parseStructuredOutputReference(value))
}

export function extractMissingVariableReferences(
  value: string | undefined,
  groups: VariableOptionGroup[],
) {
  const lookup = buildVariableOptionLookup(groups)
  const flatOptions = flattenVariableOptions(groups)

  return parsePromptVariableReferences(value).filter((reference) => {
    if (lookup[reference]) {
      return false
    }

    const structured = parseStructuredOutputReference(reference)
    return !structured || !flatOptions.some((option) => option.value === structured.baseValue)
  })
}
