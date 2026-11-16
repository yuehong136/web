import type { MCPServer } from '@/types/mcp'

export const MCP_TABS = ['tools', 'batch', 'test'] as const
export type MCPTab = (typeof MCP_TABS)[number]

export const isMCPTab = (value: string | null): value is MCPTab =>
  (MCP_TABS as readonly string[]).includes(value ?? '')

/** Backend timestamps arrive as seconds, milliseconds or ISO strings. */
export function parseServerTime(raw?: string): number {
  if (!raw) return 0
  const numeric = Number(raw)
  if (!Number.isNaN(numeric) && numeric > 0)
    return numeric < 1_000_000_000_000 ? numeric * 1000 : numeric
  const parsed = new Date(raw).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

export const serverSortTime = (server: MCPServer) =>
  parseServerTime(server.update_time || server.create_time)

export const protocolLabel = (type: string) =>
  type === 'streamable-http' ? 'HTTP' : type.toUpperCase()

/** Key/value rows edited in a form, kept as strings until the request. */
export interface KeyValueEntry {
  key: string
  value: string
}

export const toEntries = (record?: Record<string, unknown>): KeyValueEntry[] =>
  Object.entries(record ?? {}).map(([key, value]) => ({
    key,
    value: typeof value === 'string' ? value : JSON.stringify(value),
  }))

export const toHeaders = (entries: KeyValueEntry[]) =>
  Object.fromEntries(
    entries
      .filter((entry) => entry.key.trim())
      .map((entry) => [entry.key, entry.value]),
  )

/** Variable values may be JSON; anything else is sent as a string. */
export const toVariables = (entries: KeyValueEntry[]) =>
  Object.fromEntries(
    entries
      .filter((entry) => entry.key.trim())
      .map((entry) => {
        try {
          return [entry.key, JSON.parse(entry.value) as unknown]
        } catch {
          return [entry.key, entry.value]
        }
      }),
  )

/** Saves exported server configuration as a JSON file. */
export function downloadJson(content: string, filename: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Parses tool arguments; returns null when the text is not a JSON object. */
export function parseToolArguments(
  text: string,
): Record<string, unknown> | null {
  if (!text.trim()) return {}
  try {
    const value: unknown = JSON.parse(text)
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null
  } catch {
    return null
  }
}
