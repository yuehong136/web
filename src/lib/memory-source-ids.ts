export function parseMemorySourceIds(value: string, max = 32): string[] {
  const ids = value.trim() ? value.trim().split(/[\s,]+/) : []
  if (
    !ids.length ||
    ids.length > max ||
    new Set(ids).size !== ids.length ||
    ids.some(
      (id) => !/^[1-9][0-9]*$/.test(id) || BigInt(id) > 9223372036854775807n,
    )
  )
    throw new Error('invalid_source_ids')
  return ids
}
