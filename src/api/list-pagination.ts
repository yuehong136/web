import { APIError } from './client-types'

type ListWindow = { page?: number; page_size?: number }

export function isLargeListWindow(params?: ListWindow): boolean {
  return (
    Number.isSafeInteger(params?.page_size) &&
    (params?.page_size ?? 0) > 100 &&
    Number.isSafeInteger(params?.page ?? 1) &&
    (params?.page ?? 1) >= 1
  )
}

/** Preserve a selector's requested window while sending at most 100 items per request. */
export async function collectListWindow<
  T extends { total?: number },
  K extends keyof T,
>(
  params: ListWindow,
  load: (page: { page: number; page_size: number }) => Promise<T>,
  key: K,
): Promise<T> {
  const size = params.page_size!
  const start = ((params.page ?? 1) - 1) * size
  const end = start + size
  let page = Math.floor(start / 100) + 1
  let first: T | undefined
  const items: unknown[] = []
  do {
    const result = await load({ page, page_size: 100 })
    const batch = result[key]
    if (
      !Array.isArray(batch) ||
      !Number.isSafeInteger(result.total) ||
      result.total! < 0 ||
      batch.length > 100 ||
      (batch.length > 0 && result.total! < (page - 1) * 100 + batch.length)
    ) {
      throw new APIError(
        502,
        'INVALID_LIST_RESPONSE',
        'Invalid paginated list response',
      )
    }
    first ??= result
    const offset = (page - 1) * 100
    items.push(
      ...batch.slice(Math.max(0, start - offset), Math.max(0, end - offset)),
    )
    if (offset + batch.length >= result.total! || offset + batch.length >= end)
      break
    // A short page before the declared total must never silently truncate selectors.
    if (batch.length !== 100)
      throw new APIError(
        502,
        'INCOMPLETE_LIST_RESPONSE',
        'Incomplete paginated list response',
      )
    page += 1
  } while ((page - 1) * 100 < end)
  return { ...first, [key]: items } as T
}
