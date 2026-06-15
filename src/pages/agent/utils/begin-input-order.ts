export type BeginInputOrderField = {
  order?: unknown
}

export function coerceBeginInputOrder(value: unknown) {
  const order =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : undefined

  return typeof order === 'number' && Number.isFinite(order) ? order : undefined
}

export function getOrderedBeginInputEntries<T extends BeginInputOrderField>(
  inputs?: Record<string, T>,
) {
  return Object.entries(inputs || {})
    .map(([key, field], index) => ({
      key,
      field,
      index,
      order: coerceBeginInputOrder(field?.order),
    }))
    .sort((left, right) => {
      if (left.order !== undefined && right.order !== undefined) {
        return left.order - right.order || left.index - right.index
      }

      if (left.order !== undefined) {
        return -1
      }

      if (right.order !== undefined) {
        return 1
      }

      return left.index - right.index
    })
    .map(({ key, field }) => [key, field] as const)
}
