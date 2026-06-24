import {
  TokenChunkerDelimiterMode,
  type TokenChunkerDelimiterMode as TokenChunkerDelimiterModeType,
} from '../chunker-constants'
import type { OutputMap } from '../components/output'

export type DelimiterItem = {
  value: string
}

export const tokenChunkerOutputs: OutputMap = {
  chunks: { type: 'Array<Object>', value: [] },
}

function normalizeDelimiterItems(
  value: unknown,
  fallback: DelimiterItem[] = [{ value: '\n' }],
): DelimiterItem[] {
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

    return nextValues.length ? nextValues : fallback
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

function normalizeOverlapPercent(value: unknown) {
  const nextValue = toNumber(value, 0)
  if (nextValue > 0 && nextValue < 1) {
    return Math.round(nextValue * 100)
  }
  return nextValue
}

function resolveContextWindow(form: Record<string, unknown>) {
  if (form.image_table_context_window !== undefined) {
    return toNumber(form.image_table_context_window, 0)
  }

  const table = toNumber(form.table_context_size, 0)
  const image = toNumber(form.image_context_size, 0)
  return Math.max(table, image)
}

function isDelimiterMode(
  value: unknown,
): value is TokenChunkerDelimiterModeType {
  return (
    value === TokenChunkerDelimiterMode.TokenSize ||
    value === TokenChunkerDelimiterMode.Delimiter ||
    value === TokenChunkerDelimiterMode.One
  )
}

function resolveDelimiterMode(form: Record<string, unknown>) {
  if (isDelimiterMode(form.delimiter_mode)) {
    return form.delimiter_mode
  }

  const delimiters = normalizeDelimiterItems(form.delimiters, [])
  if (delimiters.some((item) => item.value)) {
    return TokenChunkerDelimiterMode.Delimiter
  }

  return TokenChunkerDelimiterMode.TokenSize
}

export function normalizeTokenChunkerFormForStore(
  form: Record<string, unknown> = {},
) {
  const delimiterMode = resolveDelimiterMode(form)
  const childrenDelimiters = normalizeDelimiterItems(
    form.children_delimiters,
    [],
  )

  return {
    outputs: tokenChunkerOutputs,
    delimiter_mode: delimiterMode,
    chunk_token_size: toNumber(form.chunk_token_size, 512),
    overlapped_percent: normalizeOverlapPercent(form.overlapped_percent),
    delimiters: normalizeDelimiterItems(form.delimiters),
    enable_children:
      typeof form.enable_children === 'boolean'
        ? form.enable_children
        : childrenDelimiters.some((item) => item.value),
    children_delimiters: childrenDelimiters,
    image_table_context_window: resolveContextWindow(form),
  }
}

export function serializeTokenChunkerFormForDsl(
  form: Record<string, unknown> = {},
) {
  const nextForm = normalizeTokenChunkerFormForStore(form)
  const imageTableContextWindow = toNumber(
    nextForm.image_table_context_window,
    0,
  )
  const delimiterMode = nextForm.delimiter_mode
  const useDelimiterMode = delimiterMode === TokenChunkerDelimiterMode.Delimiter
  const useOneMode = delimiterMode === TokenChunkerDelimiterMode.One
  const delimiters = useDelimiterMode
    ? normalizeDelimiterItems(nextForm.delimiters, [])
        .map((item) => item.value || '')
        .filter(Boolean)
    : []
  const childrenDelimiters =
    !useOneMode && nextForm.enable_children
      ? normalizeDelimiterItems(nextForm.children_delimiters, [])
          .map((item) => item.value || '')
          .filter(Boolean)
      : []

  return {
    outputs: tokenChunkerOutputs,
    chunk_token_size: toNumber(nextForm.chunk_token_size, 512),
    overlapped_percent: useOneMode
      ? 0
      : toNumber(nextForm.overlapped_percent, 0) / 100,
    delimiters,
    children_delimiters: childrenDelimiters,
    table_context_size: imageTableContextWindow,
    image_context_size: imageTableContextWindow,
  }
}
