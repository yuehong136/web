import type { LocalizedText } from '@/types/agent'
import { APIError } from '@/api/client'
import { isRecord } from './draft'

export type ParserPipeline = {
  id: string
  title: LocalizedText
  tenantId: string
}
export type ParserPipelinePage = {
  rows: ParserPipeline[]
  total: number
  page: number
  pageSize: number
}

export function normalizeParserPipelinePage(
  data: unknown,
  tenantId: string,
  page: number,
  pageSize: number,
): ParserPipelinePage {
  if (
    !isRecord(data) ||
    !Array.isArray(data.canvas) ||
    typeof data.total !== 'number' ||
    !Number.isSafeInteger(data.total) ||
    data.total < 0
  )
    throw new APIError(
      502,
      'INVALID_PIPELINE_CATALOG',
      'Invalid pipeline catalog',
    )
  const rows: ParserPipeline[] = []
  for (const row of data.canvas) {
    if (
      !isRecord(row) ||
      row.tenant_id !== tenantId ||
      row.canvas_category !== 'dataflow_canvas' ||
      typeof row.id !== 'string' ||
      !/^[0-9a-f]{32}$/.test(row.id)
    )
      continue
    if (typeof row.title !== 'string' && !isRecord(row.title)) continue
    rows.push({ id: row.id, title: row.title as LocalizedText, tenantId })
  }
  return { rows, total: data.total, page, pageSize }
}
