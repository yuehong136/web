import type { TFunction } from 'i18next'
import type { GatewayLog } from '@/api/model-gateway'
import { PREFIX, endpointPath, errorCodeOf } from '../../utils'

/**
 * One CSV cell. Text that a spreadsheet would run as a formula (=, +, -, @,
 * tab, CR) is prefixed with a quote; key names and end users are free text.
 */
export function csvCell(value: string | number | boolean | null): string {
  if (value === null) return ''
  let text = String(value)
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const COLUMNS: Array<
  [string, (log: GatewayLog) => string | number | boolean | null]
> = [
  ['time', (log) => log.started_at],
  ['status', (log) => log.status_code],
  ['code', (log) => errorCodeOf(log)],
  ['key', (log) => log.key_name],
  ['model', (log) => log.model],
  ['upstream', (log) => log.upstream_model_name],
  ['endpoint', (log) => endpointPath(log.endpoint)],
  ['stream', (log) => log.stream],
  ['promptTokens', (log) => log.prompt_tokens],
  ['completionTokens', (log) => log.completion_tokens],
  ['totalTokens', (log) => log.total_tokens],
  ['durationMs', (log) => log.duration_ms],
  ['firstTokenMs', (log) => log.first_token_ms],
  ['endUser', (log) => log.end_user],
  ['requestId', (log) => log.id],
]

/** The shown page of request logs as CSV, with localized headers. */
export function logsToCsv(t: TFunction, logs: GatewayLog[]): string {
  const header = COLUMNS.map(([name]) =>
    csvCell(t(`${PREFIX}.logs.csv.${name}`)),
  )
  const rows = logs.map((log) =>
    COLUMNS.map(([, read]) => csvCell(read(log))).join(','),
  )
  return [header.join(','), ...rows].join('\r\n')
}
