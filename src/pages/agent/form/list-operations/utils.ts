import { ListOperations, ListOperationsVersion } from '../../constant'
import type { IListOperationsForm } from './types'

export function getListOperationsVersion(form: IListOperationsForm = {}) {
  return form.operations_version === undefined
    ? ListOperationsVersion.Legacy
    : form.operations_version
}

export function isListOperationsVersionValid(version: unknown) {
  return (
    version === ListOperationsVersion.Legacy ||
    version === ListOperationsVersion.Current
  )
}

// Undefined denotes a newly constructed node; even an empty persisted form is legacy.
export function prepareListOperationsForm(
  form?: Record<string, unknown>,
): Record<string, unknown> {
  const version =
    form === undefined
      ? ListOperationsVersion.Current
      : getListOperationsVersion(form)
  return {
    ...form,
    operations_version: version,
    ...(form?.operations === undefined
      ? {
          operations:
            version === ListOperationsVersion.Legacy
              ? ListOperations.TopN
              : ListOperations.Nth,
        }
      : {}),
    ...(form?.n === undefined ? { n: 0 } : {}),
  }
}

export function getListOperation(form: IListOperationsForm) {
  const version = getListOperationsVersion(form)
  const operation =
    form.operations === undefined
      ? version === ListOperationsVersion.Legacy
        ? ListOperations.TopN
        : ListOperations.Nth
      : String(form.operations ?? '').trim()
  if (operation.toLowerCase() === 'topn') {
    return version === ListOperationsVersion.Legacy
      ? ListOperations.TopN
      : ListOperations.Head
  }
  return !operation && version === ListOperationsVersion.Current
    ? ListOperations.Nth
    : operation
}

export function getListOperationLabelKey(form: IListOperationsForm) {
  const version = getListOperationsVersion(form)
  if (!isListOperationsVersionValid(version))
    return 'flow.listOperationsConfig.invalidVersion'
  const operation = getListOperation(form)
  const key =
    operation === ListOperations.DropDuplicates ? 'dropDuplicates' : operation
  const legacy =
    version === ListOperationsVersion.Legacy &&
    [ListOperations.TopN, ListOperations.Head, ListOperations.Tail].some(
      (value) => value === operation,
    )
  return `flow.${legacy ? 'ListOperationsLegacyOptions' : 'ListOperationsOptions'}.${key}`
}

export function getListStrictValue(value: unknown) {
  return typeof value === 'string'
    ? ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase())
    : Boolean(value)
}

export function parseListCountInput(value: string) {
  if (!/^[+-]?\d+$/.test(value)) return undefined
  const number = Number(value)
  return Number.isSafeInteger(number) ? number : undefined
}
