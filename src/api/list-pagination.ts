import { APIError } from './client-types'
import { apiClient } from './client'

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
  const isCurrentOwner = apiClient.captureOwner()
  const assertOwner = () => {
    if (!isCurrentOwner()) throw new DOMException('Aborted', 'AbortError')
  }
  const size = params.page_size!
  const start = ((params.page ?? 1) - 1) * size
  const end = start + size
  let page = Math.floor(start / 100) + 1
  let first: T | undefined
  const items: unknown[] = []
  const seen = new Set<string>()
  do {
    assertOwner()
    const result = await load({ page, page_size: 100 })
    assertOwner()
    const batch = result[key]
    if (
      !Array.isArray(batch) ||
      !Number.isSafeInteger(result.total) ||
      result.total! < 0 ||
      batch.length > 100 ||
      (first !== undefined && result.total !== first.total) ||
      (batch.length > 0 && result.total! < (page - 1) * 100 + batch.length)
    ) {
      throw new APIError(
        502,
        'INVALID_LIST_RESPONSE',
        'Invalid paginated list response',
      )
    }
    // These seven REST domains all expose stable, nonempty string IDs.
    // Validate the entire fetched page, including rows outside the requested slice.
    const records: unknown[] = batch
    for (const item of records) {
      if (
        !item ||
        typeof item !== 'object' ||
        !('id' in item) ||
        typeof item.id !== 'string' ||
        !item.id.trim() ||
        item.id.trim() !== item.id ||
        seen.has(item.id)
      ) {
        throw new APIError(
          502,
          'INVALID_LIST_RESPONSE',
          'Invalid paginated list identity',
        )
      }
      seen.add(item.id)
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
