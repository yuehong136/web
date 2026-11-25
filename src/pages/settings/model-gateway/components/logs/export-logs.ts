import {
  modelGatewayAPI,
  type GatewayLog,
  type GatewayLogQuery,
} from '@/api/model-gateway'

/** Rows asked for per request; the server's page size limit. */
export const EXPORT_PAGE_SIZE = 100
/** An export stops here; larger extracts belong to the usage API. */
export const EXPORT_MAX_ROWS = 10_000

export interface ExportProgress {
  loaded: number
  /** Rows the export will contain: the match count, capped. */
  total: number
}

export interface ExportResult {
  logs: GatewayLog[]
  /** More rows matched than the cap allows. */
  truncated: boolean
}

type FetchPage = typeof modelGatewayAPI.queryLogs

/**
 * Every row matching the filters, read page by page from the newest. The
 * window end is pinned before the first page so calls arriving meanwhile do
 * not shift later pages. Aborting the signal rejects with its reason.
 */
export async function collectLogs(
  query: Omit<GatewayLogQuery, 'page' | 'page_size'>,
  options: {
    signal?: AbortSignal
    onProgress?: (progress: ExportProgress) => void
    fetchPage?: FetchPage
    now?: Date
  } = {},
): Promise<ExportResult> {
  const fetchPage = options.fetchPage ?? modelGatewayAPI.queryLogs
  const pinned = {
    ...query,
    end: query.end ?? (options.now ?? new Date()).toISOString(),
  }
  const logs: GatewayLog[] = []
  let matched = 0
  for (let page = 1; logs.length < EXPORT_MAX_ROWS; page++) {
    options.signal?.throwIfAborted()
    const result = await fetchPage(
      { ...pinned, page, page_size: EXPORT_PAGE_SIZE },
      options.signal,
    )
    matched = result.total
    logs.push(...result.items.slice(0, EXPORT_MAX_ROWS - logs.length))
    options.onProgress?.({
      loaded: logs.length,
      total: Math.min(matched, EXPORT_MAX_ROWS),
    })
    if (result.items.length < EXPORT_PAGE_SIZE || logs.length >= matched) break
  }
  return { logs, truncated: matched > logs.length }
}
