import type { VariableOptionGroup, VariableOptionItem } from './types'

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
