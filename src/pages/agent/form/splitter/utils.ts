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

export function normalizeSplitterFormForStore(
  form: Record<string, unknown> = {},
) {
  const childrenDelimiters = normalizeDelimiterItems(form.children_delimiters)
  const imageTableContextWindow = toNumber(form.image_table_context_window)
  const tableContextSize = toNumber(
    form.table_context_size,
    imageTableContextWindow,
  )
  const imageContextSize = toNumber(
    form.image_context_size,
    imageTableContextWindow,
  )

  return {
    ...form,
    outputs: splitterOutputs,
    chunk_token_size: toNumber(form.chunk_token_size, 512),
    overlapped_percent: toNumber(form.overlapped_percent, 0),
    delimiters: normalizeDelimiterItems(form.delimiters),
    enable_children:
      typeof form.enable_children === 'boolean'
        ? form.enable_children
        : childrenDelimiters.length > 0,
    children_delimiters: childrenDelimiters,
    table_context_size: tableContextSize,
    image_context_size: imageContextSize,
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
    table_context_size: toNumber(nextForm.table_context_size),
    image_context_size: toNumber(nextForm.image_context_size),
  }
}
