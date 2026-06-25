import type { VariableOptionGroup, VariableOptionItem } from './types'

const VARIABLE_REFERENCE_REGEX = /{([^}]*)}/g
const STRUCTURED_OUTPUT_FIELD = 'structured'
const PROMPT_VARIABLE_LEADING_PATH_REGEX =
  /^(?<pathSuffix>(?:\.(?:\d+|[A-Za-z_][A-Za-z0-9_]*))+)/

type PromptVariablePathParts = {
  rootValue: string
  pathSuffix: string
}

type PromptVariableLeadingPathMatch = {
  pathSuffix: string
  remainingText: string
}

function normalizeSearchValue(value?: string | null) {
  return value?.trim().toLowerCase() ?? ''
}

function buildSearchText(option: VariableOptionItem) {
  return [option.parentLabel, option.label, option.value, option.type]
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

function splitPromptVariablePath(value: string): PromptVariablePathParts {
  const [nodeId, variable = ''] = value.split('@')

  if (!nodeId || !variable) {
    return {
      rootValue: value,
      pathSuffix: '',
    }
  }

  const dotIndex = variable.indexOf('.')
  if (dotIndex < 0) {
    return {
      rootValue: value,
      pathSuffix: '',
    }
  }

  return {
    rootValue: `${nodeId}@${variable.slice(0, dotIndex)}`,
    pathSuffix: variable.slice(dotIndex),
  }
}

export function extractLeadingPromptVariablePath(
  text: string,
): PromptVariableLeadingPathMatch | undefined {
  const match = PROMPT_VARIABLE_LEADING_PATH_REGEX.exec(text)
  const pathSuffix = match?.groups?.pathSuffix

  if (!pathSuffix) {
    return undefined
  }

  return {
    pathSuffix,
    remainingText: text.slice(pathSuffix.length),
  }
}

export function appendPromptVariablePath(
  option: VariableOptionItem,
  pathSuffix: string,
): VariableOptionItem {
  if (!pathSuffix) {
    return option
  }

  return {
    ...option,
    value: `${option.value}${pathSuffix}`,
    label: `${option.label}${pathSuffix}`,
  }
}

export function resolvePromptVariableOption(
  value: string,
  options: VariableOptionItem[],
): VariableOptionItem | undefined {
  const exactMatch = options.find((option) => option.value === value)
  if (exactMatch) {
    return exactMatch
  }

  const { rootValue, pathSuffix } = splitPromptVariablePath(value)
  if (!pathSuffix) {
    return undefined
  }

  const rootOption = options.find((option) => option.value === rootValue)
  if (!rootOption) {
    return undefined
  }

  return appendPromptVariablePath(rootOption, pathSuffix)
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
    if (
      lookup[reference] ||
      resolvePromptVariableOption(reference, flatOptions)
    ) {
      return false
    }

    const structured = parseStructuredOutputReference(reference)
    return (
      !structured ||
      !flatOptions.some((option) => option.value === structured.baseValue)
    )
  })
}
