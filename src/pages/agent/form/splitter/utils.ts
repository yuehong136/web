import type { OutputMap } from '../components/output'

export type DelimiterItem = {
  value: string
}

export const splitterOutputs: OutputMap = {
  chunks: { type: 'Array<Object>', value: [] },
}

function normalizeDelimiterItems(value: unknown): DelimiterItem[] {
  if (Array.isArray(value)) {
    const nextValues = value
      .map((item) => {
        if (typeof item === 'string') {
          return { value: item }
        }

        if (item && typeof item === 'object') {
          return {
            value:
              typeof (item as { value?: unknown }).value === 'string'
                ? (item as { value?: string }).value
                : '',
          }
        }

        return null
      })
      .filter((item): item is DelimiterItem => item !== null)

    return nextValues.length ? nextValues : [{ value: '\n' }]
  }

  return [{ value: '\n' }]
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

function resolveContextWindow(form: Record<string, unknown>) {
  if (form.image_table_context_window !== undefined) {
    return toNumber(form.image_table_context_window, 0)
  }

  const table = toNumber(form.table_context_size, 0)
  const image = toNumber(form.image_context_size, 0)
  return Math.max(table, image)
}

export function normalizeSplitterFormForStore(
  form: Record<string, unknown> = {},
) {
  const childrenDelimiters = normalizeDelimiterItems(form.children_delimiters)
  const rest = { ...form }
  delete rest.table_context_size
  delete rest.image_context_size

  return {
    ...rest,
    outputs: splitterOutputs,
    chunk_token_size: toNumber(form.chunk_token_size, 512),
    overlapped_percent: toNumber(form.overlapped_percent, 0),
    delimiters: normalizeDelimiterItems(form.delimiters),
    enable_children:
      typeof form.enable_children === 'boolean'
        ? form.enable_children
        : childrenDelimiters.length > 0,
    children_delimiters: childrenDelimiters,
    image_table_context_window: resolveContextWindow(form),
  }
}

export function serializeSplitterFormForDsl(
  form: Record<string, unknown> = {},
) {
  const nextForm = normalizeSplitterFormForStore(form)
  const rest: Record<string, unknown> = { ...nextForm }
  delete rest.enable_children
  const delimiters = normalizeDelimiterItems(nextForm.delimiters).map(
    (item) => item.value || '',
  )
  const childrenDelimiters = nextForm.enable_children
    ? normalizeDelimiterItems(nextForm.children_delimiters).map(
        (item) => item.value || '',
      )
    : []

  return {
    ...rest,
    outputs: splitterOutputs,
    delimiters,
    children_delimiters: childrenDelimiters,
    image_table_context_window: toNumber(nextForm.image_table_context_window),
  }
}
