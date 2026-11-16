import type {
  SystemStatusResponse,
  SystemVersionResponse,
  TaskExecutorHeartbeat,
} from '@/api/system'

export type Health = 'green' | 'yellow' | 'red'

export interface ComponentRow {
  id: 'database' | 'database_pool' | 'doc_engine' | 'redis' | 'storage'
  /** Engine or product shown in the name, e.g. MYSQL or Elasticsearch. */
  engine?: string
  status: Health
  /** Milliseconds, or null when the backend did not report a number. */
  latency: number | null
  version?: string
  pool?: { active: number; size: number; usage: string }
  error?: string
}

const ORDER: Record<Health, number> = { red: 0, yellow: 1, green: 2 }

const toMs = (elapsed: string | number | undefined): number | null => {
  if (elapsed === undefined || elapsed === null) return null
  const value =
    typeof elapsed === 'number'
      ? elapsed
      : Number.parseFloat(String(elapsed).replace(/[^\d.]/g, ''))
  return Number.isFinite(value) ? value : null
}

const capitalize = (value: string) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : value

/** One row per reported component, problems first, slowest first within a state. */
export function componentRows(data: SystemStatusResponse): ComponentRow[] {
  const rows: ComponentRow[] = []
  if (data.database)
    rows.push({
      id: 'database',
      engine: data.database.database?.toUpperCase(),
      status: data.database.status,
      latency: toMs(data.database.elapsed),
      error: data.database.error,
    })
  if (data.database_pool)
    rows.push({
      id: 'database_pool',
      status: data.database_pool.status,
      latency: toMs(data.database_pool.elapsed),
      pool: {
        active: data.database_pool.checked_out,
        size: data.database_pool.pool_size,
        usage: data.database_pool.usage_rate,
      },
      error: data.database_pool.error,
    })
  if (data.doc_engine)
    rows.push({
      id: 'doc_engine',
      engine: capitalize(data.doc_engine.type ?? ''),
      status: data.doc_engine.status,
      latency: toMs(data.doc_engine.elapsed),
      version: data.doc_engine.version || undefined,
      error: data.doc_engine.error,
    })
  if (data.redis)
    rows.push({
      id: 'redis',
      status: data.redis.status,
      latency: toMs(data.redis.elapsed),
      error: data.redis.error,
    })
  if (data.storage)
    rows.push({
      id: 'storage',
      engine: data.storage.storage?.toUpperCase(),
      status: data.storage.status,
      latency: toMs(data.storage.elapsed),
      error: data.storage.error,
    })
  return rows.sort(
    (a, b) =>
      ORDER[a.status] - ORDER[b.status] || (b.latency ?? 0) - (a.latency ?? 0),
  )
}

export interface VersionInfo {
  version: string
  commit?: string
  commits?: string
  build?: string
}

/** Accepts "v1.2.3-45-gabc123 build" strings or the structured response. */
export function parseVersion(
  data: SystemVersionResponse | string | undefined,
): VersionInfo | null {
  if (!data) return null
  if (typeof data === 'string') {
    const [head, build] = data.split(' ')
    const match = head?.match(/^(v[\d.]+)(?:-(\d+)-g([a-f0-9]+))?/)
    return {
      version: match?.[1] || head || '',
      commits: match?.[2],
      commit: match?.[3],
      build,
    }
  }
  return {
    version: typeof data.version === 'string' ? data.version : '',
    commit:
      typeof data.git_commit === 'string'
        ? data.git_commit.slice(0, 8)
        : undefined,
    build: typeof data.platform === 'string' ? data.platform : undefined,
  }
}

export interface ExecutorRow {
  id: string
  name: string
  status: Health
  pending: number
  lag: number
  done: number
  failed: number
  bootAt?: string
  current: Record<string, unknown>
  /** Pending queue length over the last heartbeats, oldest first. */
  pendingTrend: number[]
}

/** Failures mark an executor red; a lag of five seconds or more, yellow. */
export function executorRows(
  heartbeats: Record<string, TaskExecutorHeartbeat[]> | undefined,
): ExecutorRow[] {
  return Object.entries(heartbeats ?? {}).map(([id, beats]) => {
    const ordered = [...beats]
      .sort((a, b) => new Date(a.now).getTime() - new Date(b.now).getTime())
      .slice(-20)
    const latest = ordered[ordered.length - 1]
    const failed = latest?.failed ?? 0
    const lag = latest?.lag ?? 0
    return {
      id,
      name: latest?.name || id,
      status: failed > 0 ? 'red' : lag >= 5 ? 'yellow' : 'green',
      pending: latest?.pending ?? 0,
      lag,
      done: latest?.done ?? 0,
      failed,
      bootAt: latest?.boot_at,
      current: (latest?.current ?? {}) as Record<string, unknown>,
      pendingTrend: ordered.map((beat) => beat.pending),
    }
  })
}

export function healthCounts(rows: { status: Health }[]) {
  return rows.reduce(
    (counts, row) => ({ ...counts, [row.status]: counts[row.status] + 1 }),
    { green: 0, yellow: 0, red: 0 } as Record<Health, number>,
  )
}
