import type { AgentGraphNode } from '@/types/agent'
import { Operator } from '../../constant'
import type { QueryVariableOptionGroup } from '../components/query-variable-utils'
import { normalizeVariableReference } from '../components/query-variable-utils'
import type { OutputMap } from '../components/output'

export type IterationOutputItem = {
  name: string
  ref: string
  type: string
}

function buildIterationType(type?: string) {
  return `Array<${type || 'unknown'}>`
}

export function normalizeIterationOutputItems(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const record = item as Partial<IterationOutputItem>
        return {
          name: typeof record.name === 'string' ? record.name : '',
          ref: normalizeVariableReference(record.ref),
          type:
            typeof record.type === 'string'
              ? record.type
              : buildIterationType(),
        }
      })
      .filter((item): item is IterationOutputItem => Boolean(item))
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, { ref?: string; type?: string }>).map(
      ([name, item]) => ({
        name,
        ref: normalizeVariableReference(item?.ref),
        type:
          typeof item?.type === 'string'
            ? item.type
            : buildIterationType(),
      }),
    )
  }

  return []
}

export function buildIterationOutputs(items: IterationOutputItem[]) {
  return items.reduce<OutputMap>((acc, item) => {
    if (!item.name || !item.ref) {
      return acc
    }

    acc[item.name] = {
      ref: normalizeVariableReference(item.ref),
      type: item.type || buildIterationType(),
    }
    return acc
  }, {})
}

export function buildIterationChildOutputGroups(
  nodes: AgentGraphNode[],
  parentId?: string,
): QueryVariableOptionGroup[] {
  if (!parentId) {
    return []
  }

  return nodes
    .filter((node) => {
      return (
        node.parentId === parentId &&
        node.data.label !== Operator.IterationStart &&
        node.data.form &&
        typeof node.data.form === 'object' &&
        (node.data.form as Record<string, unknown>).outputs
      )
    })
    .map((node) => {
      const outputs =
        ((node.data.form as Record<string, unknown>).outputs as Record<
          string,
          { type?: string }
        >) || {}

      return {
        label: node.data.name,
        title: node.data.name,
        options: Object.entries(outputs).map(([key, value]) => ({
          label: key,
          value: `${node.id}@${key}`,
          type: value?.type,
        })),
      }
    })
    .filter((group) => group.options.length > 0)
}

export function buildSuggestedIterationOutputItems(
  groups: QueryVariableOptionGroup[],
) {
  const seenNames = new Set<string>()

  return groups.flatMap((group) =>
    group.options.map((option) => {
      const baseName = option.label
      const groupTitle =
        typeof group.title === 'string' ? group.title : option.value.split('@')[0]
      const name = seenNames.has(baseName)
        ? `${groupTitle}_${baseName}`
        : baseName

      seenNames.add(name)

      return {
        name,
        ref: option.value,
        type: buildIterationType((option as { type?: string }).type),
      }
    }),
  )
}
