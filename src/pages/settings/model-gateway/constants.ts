import type { GatewayKey, GatewayLog } from '@/api/model-gateway'

export const GATEWAY_TABS = ['overview', 'models', 'keys', 'logs'] as const
export type GatewayTab = (typeof GATEWAY_TABS)[number]

export const parseTab = (value: string | null): GatewayTab =>
  GATEWAY_TABS.find((tab) => tab === value) ?? 'overview'

/** Search parameters of the request log filters, shared by links into it. */
export const LOG_PARAMS = {
  range: 'range',
  key: 'key',
  model: 'model',
  outcome: 'outcome',
  status: 'status',
  endUser: 'user',
  page: 'page',
} as const

/** Moves to a tab, optionally with that tab's search parameters. */
export type GatewayNavigate = (
  tab: GatewayTab,
  params?: Record<string, string>,
) => void

/** What the key form sheet was opened for. */
export type KeyFormRequest =
  { mode: 'create' } | { mode: 'edit'; key: GatewayKey }

/** The row shown in the right-hand detail panel. */
export type GatewaySelection =
  { kind: 'key'; id: string } | { kind: 'log'; log: GatewayLog }
