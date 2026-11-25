import { expect, it, vi } from 'vitest'
import type { GatewayLog, GatewayLogPage } from '@/api/model-gateway'
import {
  EXPORT_MAX_ROWS,
  EXPORT_PAGE_SIZE,
  collectLogs,
} from '../components/logs/export-logs'
import { readLogFilters, logQueryOf } from '../components/logs/use-log-filters'

const rows = (count: number, from = 0) =>
  Array.from({ length: count }, (_, index) => ({
    id: `req_${from + index}`,
  })) as GatewayLog[]

/** A server holding `total` rows, served newest first in pages. */
const server = (total: number) =>
  vi.fn(
    async (query: {
      page: number
      page_size: number
    }): Promise<GatewayLogPage> => {
      const start = (query.page - 1) * query.page_size
      return {
        items: rows(
          Math.max(0, Math.min(query.page_size, total - start)),
          start,
        ),
        total,
        page: query.page,
        page_size: query.page_size,
      }
    },
  )

it('reads every matching row page by page under one pinned window end', async () => {
  const fetchPage = server(250)
  const progress: number[] = []
  const now = new Date('2026-11-24T08:00:00Z')

  const result = await collectLogs(
    { start: '2026-11-23T08:00:00.000Z', outcome: 'error' },
    { fetchPage, now, onProgress: ({ loaded }) => progress.push(loaded) },
  )

  expect(result.logs).toHaveLength(250)
  expect(result.truncated).toBe(false)
  expect(new Set(result.logs.map((log) => log.id)).size).toBe(250)
  expect(progress).toEqual([100, 200, 250])
  expect(fetchPage.mock.calls.map(([query]) => query)).toEqual(
    [1, 2, 3].map((page) => ({
      start: '2026-11-23T08:00:00.000Z',
      outcome: 'error',
      end: now.toISOString(),
      page,
      page_size: EXPORT_PAGE_SIZE,
    })),
  )
})

it('stops at the cap and says more rows matched', async () => {
  const fetchPage = server(EXPORT_MAX_ROWS + 5)
  const result = await collectLogs({}, { fetchPage })

  expect(result.logs).toHaveLength(EXPORT_MAX_ROWS)
  expect(result.truncated).toBe(true)
  expect(fetchPage).toHaveBeenCalledTimes(EXPORT_MAX_ROWS / EXPORT_PAGE_SIZE)
})

it('stops asking once the export is cancelled', async () => {
  const controller = new AbortController()
  const fetchPage = server(500)
  const pending = collectLogs(
    {},
    {
      fetchPage,
      signal: controller.signal,
      onProgress: () => controller.abort(),
    },
  )

  await expect(pending).rejects.toThrow()
  expect(fetchPage).toHaveBeenCalledTimes(1)
})

it('reads a status code filter from the link and sends it to the server', () => {
  const filters = readLogFilters(new URLSearchParams('status=429&range=7'))
  expect(filters.statusCode).toBe(429)
  expect(logQueryOf(filters).status_code).toBe(429)
  expect(readLogFilters(new URLSearchParams('status=abc')).statusCode).toBe(
    null,
  )
  expect(readLogFilters(new URLSearchParams('status=42')).statusCode).toBe(null)
})
