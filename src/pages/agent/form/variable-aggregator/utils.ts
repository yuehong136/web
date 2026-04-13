import { findQueryVariableOption, normalizeVariableReference, type QueryVariableOptionGroup } from '../components/query-variable-utils'
import type { OutputMap } from '../components/output'

export type VariableAggregatorGroup = {
  group_name: string
  type: string | undefined
  variables: Array<{ value: string }>
}

export function normalizeVariableAggregatorGroups(
  value: unknown,
): VariableAggregatorGroup[] {
  if (!Array.isArray(value)) {
    return [] as VariableAggregatorGroup[]
  }

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const group = item as Partial<VariableAggregatorGroup>
      const variables = Array.isArray(group.variables)
        ? group.variables
            .map((variable) => {
              if (typeof variable === 'string') {
                return { value: normalizeVariableReference(variable) }
              }

              if (variable && typeof variable === 'object') {
                return {
                  value: normalizeVariableReference(
                    (variable as { value?: string }).value,
                  ),
                }
              }

              return null
            })
            .filter((variable): variable is { value: string } => Boolean(variable))
        : []

      return {
        group_name:
          typeof group.group_name === 'string' ? group.group_name : '',
        type: typeof group.type === 'string' ? group.type : undefined,
        variables,
      }
    })
    .filter((item): item is VariableAggregatorGroup => item !== null)
}

export function buildVariableAggregatorOutputs(
  groups: VariableAggregatorGroup[],
  optionGroups: QueryVariableOptionGroup[],
) {
  return groups.reduce<OutputMap>((acc, group) => {
    if (!group.group_name) {
      return acc
    }

    const firstVariableRef = group.variables[0]?.value
    const matchedOption = findQueryVariableOption(optionGroups, firstVariableRef)
    const type =
      group.type || (matchedOption as { type?: string } | undefined)?.type || 'unknown'

    acc[group.group_name] = {
      type,
      value: '',
    }
    return acc
  }, {})
}
