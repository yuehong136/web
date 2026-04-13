import type { VariableOptionGroup } from '@/components/prompt-editor'

export type QueryVariableOptionGroup = VariableOptionGroup

export function normalizeVariableReference(value?: string) {
  if (typeof value !== 'string') {
    return ''
  }

  let nextValue = value.trim()

  while (nextValue.startsWith('{') && nextValue.endsWith('}')) {
    nextValue = nextValue.slice(1, -1).trim()
  }

  return nextValue
}

function normalizeVariableType(type?: string) {
  if (!type) {
    return ''
  }

  return type.trim().toLowerCase().replace(/\s+/g, '')
}

function isArrayLikeType(type: string) {
  return type === 'array' || type.startsWith('array<')
}

export function isQueryVariableTypeMatch(
  candidateType: string | undefined,
  filters: string[] = [],
) {
  if (!filters.length) {
    return true
  }

  const normalizedCandidate = normalizeVariableType(candidateType)

  return filters.some((filterType) => {
    const normalizedFilter = normalizeVariableType(filterType)

    if (!normalizedFilter) {
      return true
    }

    if (normalizedCandidate === normalizedFilter) {
      return true
    }

    if (isArrayLikeType(normalizedCandidate) && isArrayLikeType(normalizedFilter)) {
      return normalizedFilter === 'array' || normalizedCandidate === 'array'
    }

    return false
  })
}

export function filterQueryVariableOptionGroupsByTypes(
  groups: QueryVariableOptionGroup[],
  filters: string[] = [],
) {
  if (!filters.length) {
    return groups
  }

  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) =>
        isQueryVariableTypeMatch((option as { type?: string }).type, filters),
      ),
    }))
    .filter((group) => group.options.length > 0)
}

export function flattenQueryVariableOptions(groups: QueryVariableOptionGroup[]) {
  return groups.flatMap((group) =>
    group.options.map((option) => ({
      ...option,
      groupLabel: group.title || group.label,
    })),
  )
}

export function findQueryVariableOption(
  groups: QueryVariableOptionGroup[],
  value?: string,
) {
  const normalizedValue = normalizeVariableReference(value)

  return flattenQueryVariableOptions(groups).find(
    (option) => option.value === normalizedValue,
  )
}

export function getQueryVariableDisplayLabel(
  groups: QueryVariableOptionGroup[],
  value?: string,
) {
  const option = findQueryVariableOption(groups, value)

  if (!option) {
    return normalizeVariableReference(value)
  }

  const groupLabel = typeof option.groupLabel === 'string'
    ? option.groupLabel
    : option.value.split('@')[0]

  return `${groupLabel}.${option.label}`
}
