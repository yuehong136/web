import { normalizeVariableReference } from '../components/query-variable-utils'
import type { OutputMap } from '../components/output'

export const invokeDefaultHeaders = `{
  "Accept": "*/*",
  "Cache-Control": "no-cache",
  "Connection": "keep-alive"
}`

export const invokeDatatypeOptions = ['json', 'formdata'] as const

export type InvokeVariable = {
  key: string
  ref: string
  value: string
}

export const invokeOutputs: OutputMap = {
  result: {
    value: '',
    type: 'string',
  },
}

function normalizeInvokeHeaders(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return invokeDefaultHeaders
}

function normalizeInvokeVariable(value: unknown): InvokeVariable {
  const item = (value && typeof value === 'object' ? value : {}) as Partial<InvokeVariable>

  return {
    key: typeof item.key === 'string' ? item.key : '',
    ref: normalizeVariableReference(item.ref),
    value: typeof item.value === 'string' ? item.value : '',
  }
}

function normalizeNumber(value: unknown, fallback: number) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim()) {
    const nextValue = Number(value)
    if (Number.isFinite(nextValue)) {
      return nextValue
    }
  }

  return fallback
}

export function normalizeInvokeFormForStore(
  form: Record<string, unknown> = {},
) {
  const datatype = typeof form.datatype === 'string'
    ? form.datatype.toLowerCase()
    : 'json'

  return {
    ...form,
    url: typeof form.url === 'string' ? form.url : '',
    method: typeof form.method === 'string' ? form.method.toUpperCase() : 'GET',
    timeout: normalizeNumber(form.timeout, 60),
    headers: normalizeInvokeHeaders(form.headers),
    proxy: typeof form.proxy === 'string' ? form.proxy : '',
    clean_html: Boolean(form.clean_html),
    datatype: invokeDatatypeOptions.includes(datatype as (typeof invokeDatatypeOptions)[number])
      ? datatype
      : 'json',
    variables: Array.isArray(form.variables)
      ? form.variables.map(normalizeInvokeVariable)
      : [],
    outputs: invokeOutputs,
  }
}

export function serializeInvokeFormForDsl(
  form: Record<string, unknown> = {},
) {
  const nextForm = normalizeInvokeFormForStore(form)

  return {
    ...nextForm,
    outputs: invokeOutputs,
    variables: nextForm.variables.map((item) => ({
      key: item.key,
      ref: normalizeVariableReference(item.ref),
      value: item.value,
    })),
  }
}
