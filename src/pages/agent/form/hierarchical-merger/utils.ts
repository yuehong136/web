import type { OutputMap } from '../components/output'

export type HierarchicalLevel = {
  expressions: Array<{ expression: string }>
}

export const hierarchicalMergerOutputs: OutputMap = {
  chunks: { type: 'Array<Object>', value: [] },
}

function normalizeExpressions(value: unknown) {
  if (Array.isArray(value)) {
    const nextValues = value
      .map((item) => {
        if (typeof item === 'string') {
          return { expression: item }
        }

        if (item && typeof item === 'object') {
          const expression = (item as { expression?: unknown }).expression
          return {
            expression: typeof expression === 'string' ? expression : '',
          }
        }

        return null
      })
      .filter((item): item is { expression: string } => Boolean(item))

    return nextValues.length ? nextValues : [{ expression: '' }]
  }

  return [{ expression: '' }]
}

export function normalizeHierarchicalLevelsForStore(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (Array.isArray(item)) {
        return {
          expressions: normalizeExpressions(item),
        }
      }

      if (item && typeof item === 'object') {
        return {
          expressions: normalizeExpressions(
            (item as { expressions?: unknown }).expressions,
          ),
        }
      }

      return { expressions: [{ expression: '' }] }
    })
  }

  return [
    { expressions: [{ expression: '^#[^#]' }] },
    { expressions: [{ expression: '^##[^#]' }] },
    { expressions: [{ expression: '^###[^#]' }] },
    { expressions: [{ expression: '^####[^#]' }] },
  ]
}

export function serializeHierarchicalLevelsForDsl(value: unknown) {
  return normalizeHierarchicalLevelsForStore(value).map((level) =>
    level.expressions
      .map((item) => item.expression.trim())
      .filter(Boolean),
  )
}

export function normalizeHierarchicalMergerFormForStore(
  form: Record<string, unknown> = {},
) {
  return {
    ...form,
    outputs: hierarchicalMergerOutputs,
    hierarchy: String(form.hierarchy || '3'),
    levels: normalizeHierarchicalLevelsForStore(form.levels),
  }
}

export function serializeHierarchicalMergerFormForDsl(
  form: Record<string, unknown> = {},
) {
  return {
    ...form,
    outputs: hierarchicalMergerOutputs,
    hierarchy: String(form.hierarchy || '3'),
    levels: serializeHierarchicalLevelsForDsl(form.levels),
  }
}
