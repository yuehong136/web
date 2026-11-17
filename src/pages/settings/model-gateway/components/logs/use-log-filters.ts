import { useSearchParams } from 'react-router-dom'
import {
  GATEWAY_WINDOWS,
  type GatewayLogOutcome,
  type GatewayLogQuery,
  type GatewayWindow,
} from '@/api/model-gateway'
import { LOG_PARAMS } from '../../constants'

export const LOG_PAGE_SIZE = 20
const MINUTE = 60_000

export interface LogFilters {
  range: GatewayWindow
  keyId: string | null
  model: string | null
  outcome: GatewayLogOutcome | null
  endUser: string | null
  page: number
}

export type LogFilterPatch = Partial<Omit<LogFilters, 'page'>>

const readRange = (value: string | null): GatewayWindow =>
  GATEWAY_WINDOWS.find((days) => String(days) === value) ?? 1

const readOutcome = (value: string | null): GatewayLogOutcome | null =>
  value === 'success' || value === 'error' ? value : null

export function readLogFilters(params: URLSearchParams): LogFilters {
  const page = Number(params.get(LOG_PARAMS.page))
  return {
    range: readRange(params.get(LOG_PARAMS.range)),
    keyId: params.get(LOG_PARAMS.key) || null,
    model: params.get(LOG_PARAMS.model) || null,
    outcome: readOutcome(params.get(LOG_PARAMS.outcome)),
    endUser: params.get(LOG_PARAMS.endUser) || null,
    page: Number.isInteger(page) && page > 1 ? page : 1,
  }
}

/**
 * The query for a filter set. The window start is rounded down to the minute
 * so re-renders keep the same query key.
 */
export function logQueryOf(
  filters: LogFilters,
  now: number = Date.now(),
): GatewayLogQuery {
  const start = Math.floor(now / MINUTE) * MINUTE - filters.range * 86_400_000
  return {
    page: filters.page,
    page_size: LOG_PAGE_SIZE,
    start: new Date(start).toISOString(),
    ...(filters.keyId ? { key_id: filters.keyId } : {}),
    ...(filters.model ? { model: filters.model } : {}),
    ...(filters.outcome ? { outcome: filters.outcome } : {}),
    ...(filters.endUser ? { end_user: filters.endUser } : {}),
  }
}

/**
 * Request log filters kept in the URL, so a filtered view can be shared.
 * Changing a filter returns to the first page.
 */
export function useLogFilters() {
  const [params, setParams] = useSearchParams()
  const filters = readLogFilters(params)

  const write = (patch: Record<string, string | null>) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [name, value] of Object.entries(patch)) {
          if (value === null || value === '') next.delete(name)
          else next.set(name, value)
        }
        return next
      },
      { replace: true },
    )

  const setFilters = (patch: LogFilterPatch) => {
    const values: Record<string, string | null> = { [LOG_PARAMS.page]: null }
    if ('range' in patch)
      values[LOG_PARAMS.range] =
        patch.range === undefined ? null : String(patch.range)
    if ('keyId' in patch) values[LOG_PARAMS.key] = patch.keyId ?? null
    if ('model' in patch) values[LOG_PARAMS.model] = patch.model ?? null
    if ('outcome' in patch) values[LOG_PARAMS.outcome] = patch.outcome ?? null
    if ('endUser' in patch) values[LOG_PARAMS.endUser] = patch.endUser ?? null
    write(values)
  }

  const setPage = (page: number) =>
    write({ [LOG_PARAMS.page]: page > 1 ? String(page) : null })

  return { filters, setFilters, setPage }
}
