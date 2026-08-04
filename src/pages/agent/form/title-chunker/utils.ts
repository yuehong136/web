import {
  TitleChunkerMethod,
  initialTitleChunkerRules,
  type TitleChunkerMethod as TitleChunkerMethodType,
} from '../chunker-constants'
import type { OutputMap } from '../components/output'

export type TitleChunkerLevel = {
  expression: string
}

export type TitleChunkerRule = {
  levels: TitleChunkerLevel[]
}

export const titleChunkerOutputs: OutputMap = {
  chunks: { type: 'Array<Object>', value: [] },
}

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value)
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function isTitleChunkerMethod(value: unknown): value is TitleChunkerMethodType {
  return (
    value === TitleChunkerMethod.Hierarchy || value === TitleChunkerMethod.Group
  )
}

function normalizeExpressionItems(value: unknown): TitleChunkerLevel[] {
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
      .filter((item): item is TitleChunkerLevel => item !== null)

    return nextValues.length ? nextValues : [{ expression: '' }]
  }

  return [{ expression: '' }]
}

function normalizeRules(value: unknown): TitleChunkerRule[] {
  if (!Array.isArray(value)) {
    return cloneValue(initialTitleChunkerRules)
  }

  const nextRules = value
    .map((item) => {
      if (Array.isArray(item)) {
        return {
          levels: normalizeExpressionItems(item),
        }
      }

      if (item && typeof item === 'object') {
        if (Array.isArray((item as { levels?: unknown }).levels)) {
          return {
            levels: normalizeExpressionItems(
              (item as { levels?: unknown }).levels,
            ),
          }
        }

        if (Array.isArray((item as { expressions?: unknown }).expressions)) {
          return {
            levels: normalizeExpressionItems(
              (item as { expressions?: unknown }).expressions,
            ),
          }
        }
      }

      return null
    })
    .filter((item): item is TitleChunkerRule => item !== null)

  return nextRules.length ? nextRules : cloneValue(initialTitleChunkerRules)
}

function serializeRulesForDsl(value: unknown) {
  return normalizeRules(value)
    .map((rule) =>
      rule.levels.map((item) => item.expression.trim()).filter(Boolean),
    )
    .filter((levels) => levels.length > 0)
}

function normalizeHierarchyValue(value: unknown, fallback: string) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  return fallback
}

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const nextValue = Number(value)
    if (Number.isFinite(nextValue)) {
      return nextValue
    }
  }

  return fallback
}

export function normalizeTitleChunkerFormForStore(
  form: Record<string, unknown> = {},
) {
  const method = isTitleChunkerMethod(form.method)
    ? form.method
    : TitleChunkerMethod.Hierarchy
  const legacyHierarchy = normalizeHierarchyValue(form.hierarchy, '3')
  const legacyRules =
    form.rules !== undefined
      ? normalizeRules(form.rules)
      : normalizeRules(form.levels)
  const hierarchyRules =
    form.hierarchyRules !== undefined
      ? normalizeRules(form.hierarchyRules)
      : method === TitleChunkerMethod.Hierarchy
        ? legacyRules
        : cloneValue(initialTitleChunkerRules)
  const groupRules =
    form.groupRules !== undefined
      ? normalizeRules(form.groupRules)
      : method === TitleChunkerMethod.Group
        ? legacyRules
        : cloneValue(initialTitleChunkerRules)

  return {
    outputs: titleChunkerOutputs,
    method,
    hierarchyHierarchy: normalizeHierarchyValue(
      form.hierarchyHierarchy,
      method === TitleChunkerMethod.Hierarchy ? legacyHierarchy : '3',
    ),
    hierarchyGroup: normalizeHierarchyValue(
      form.hierarchyGroup,
      method === TitleChunkerMethod.Group ? legacyHierarchy : '0',
    ),
    include_heading_content: Boolean(form.include_heading_content),
    root_chunk_as_heading: Boolean(form.root_chunk_as_heading),
    hierarchyRules,
    groupRules,
  }
}

export function serializeTitleChunkerFormForDsl(
  form: Record<string, unknown> = {},
) {
  const nextForm = normalizeTitleChunkerFormForStore(form)
  const activeRules =
    nextForm.method === TitleChunkerMethod.Group
      ? nextForm.groupRules
      : nextForm.hierarchyRules
  const hierarchy =
    nextForm.method === TitleChunkerMethod.Group
      ? nextForm.hierarchyGroup
      : nextForm.hierarchyHierarchy

  return {
    outputs: titleChunkerOutputs,
    method: nextForm.method,
    hierarchy: toNumber(hierarchy, 0),
    include_heading_content: Boolean(nextForm.include_heading_content),
    root_chunk_as_heading: Boolean(nextForm.root_chunk_as_heading),
    levels: serializeRulesForDsl(activeRules),
  }
}

export function getTitleChunkerHierarchyOptions(
  rules: TitleChunkerRule[] | undefined,
  includeAutomatic = false,
) {
  const maxLevel = Math.max(
    1,
    ...(rules || []).map((rule) => rule.levels.length),
  )
  const options = Array.from({ length: maxLevel }, (_, index) => ({
    label: `H${index + 1}`,
    value: String(index + 1),
  }))

  return includeAutomatic
    ? [{ label: 'Automatic', value: '0' }, ...options]
    : options
}
