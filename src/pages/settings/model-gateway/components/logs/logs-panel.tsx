import { useEffect, useRef, useState } from 'react'
import { Download, RefreshCw, ScrollText, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  GATEWAY_WINDOWS,
  type GatewayCatalog,
  type GatewayKey,
  type GatewayLog,
  type GatewayWindow,
} from '@/api/model-gateway'
import {
  FilterChip,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  Pager,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFetchGatewayLogs } from '@/hooks/use-model-gateway-request'
import { downloadCsvFile } from '@/lib/download'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { PREFIX, formatCount } from '../../utils'
import {
  EXPORT_MAX_ROWS,
  collectLogs,
  type ExportProgress,
} from './export-logs'
import { logsToCsv } from './log-csv'
import { LogRow } from './log-row'
import { LOG_PAGE_SIZE, logQueryOf, useLogFilters } from './use-log-filters'

/** Statuses the gateway itself answers with, plus the usual upstream ones. */
const STATUS_CODES = [200, 400, 401, 403, 404, 413, 429, 499, 502, 503, 504]

interface LogsPanelProps {
  keys: GatewayKey[]
  catalog: GatewayCatalog
  selectedId: string | null
  onSelect: (log: GatewayLog) => void
}

/** Request logs: one row per call, never the request or response body. */
export function LogsPanel({
  keys,
  catalog,
  selectedId,
  onSelect,
}: LogsPanelProps) {
  const { t } = useTranslation()
  const { filters, setFilters, setPage } = useLogFilters()
  // Live by default: the list follows new calls until it is switched off.
  const [live, setLive] = useState(true)
  const query = logQueryOf(filters)
  const logsQuery = useFetchGatewayLogs(query, live)
  const logs = logsQuery.data?.items ?? []
  const total = logsQuery.data?.total ?? 0
  // The end-user field is applied on Enter or when it loses focus.
  const [endUser, setEndUser] = useState(filters.endUser ?? '')
  const commitEndUser = () => {
    const value = endUser.trim() || null
    if (value !== filters.endUser) setFilters({ endUser: value })
  }

  const modelNames = [
    ...new Set([
      ...catalog.models.map((model) => model.call_name),
      ...(filters.model ? [filters.model] : []),
    ]),
  ]
  const keyOptions = keys.map((key) => ({ value: key.id, label: key.name }))
  if (filters.keyId && !keys.some((key) => key.id === filters.keyId))
    keyOptions.push({ value: filters.keyId, label: filters.keyId })

  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const exporting = useRef<AbortController | null>(null)
  useEffect(() => () => exporting.current?.abort(), [])

  // Every matching row, not just the page on screen; a second click cancels.
  const exportCsv = async () => {
    if (exporting.current) {
      exporting.current.abort()
      return
    }
    const controller = new AbortController()
    exporting.current = controller
    setProgress({ loaded: 0, total: Math.min(total, EXPORT_MAX_ROWS) })
    try {
      const { page: _page, page_size: _size, ...match } = query
      const exported = await collectLogs(match, {
        signal: controller.signal,
        onProgress: setProgress,
      })
      downloadCsvFile(
        logsToCsv(t, exported.logs),
        `gateway-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      )
      if (exported.truncated)
        toast.success(
          t(`${PREFIX}.logs.exportTruncated`, {
            value: formatCount(EXPORT_MAX_ROWS),
          }),
        )
    } catch {
      if (!controller.signal.aborted)
        toast.error(t(`${PREFIX}.logs.exportFailed`))
    } finally {
      exporting.current = null
      setProgress(null)
    }
  }

  let body
  if (logsQuery.isPending) body = <PageLoadingState compact />
  else if (logsQuery.isError && !logsQuery.data)
    body = (
      <PageErrorState
        compact
        titleAs="h3"
        title={t(`${PREFIX}.logs.loadFailed`)}
        retryLabel={t('common.retry')}
        onRetry={() => void logsQuery.refetch()}
      />
    )
  else if (logs.length === 0)
    body = (
      <PageEmptyState
        compact
        title={t(`${PREFIX}.logs.empty`)}
        description={t(`${PREFIX}.logs.emptyDescription`)}
        icon={<ScrollText className="size-icon-lg" aria-hidden="true" />}
      />
    )
  else
    body = (
      <>
        <Table
          aria-label={t(`${PREFIX}.tabs.logs`)}
          aria-busy={logsQuery.isPlaceholderData || undefined}
          wrapperClassName="rounded-radius-lg border border-line-subtle"
        >
          <TableHeader className="bg-sunken">
            <TableRow>
              <TableHead>{t(`${PREFIX}.logs.columns.time`)}</TableHead>
              <TableHead>{t(`${PREFIX}.logs.columns.status`)}</TableHead>
              <TableHead>{t(`${PREFIX}.logs.columns.key`)}</TableHead>
              <TableHead>{t(`${PREFIX}.logs.columns.model`)}</TableHead>
              <TableHead>{t(`${PREFIX}.logs.columns.usage`)}</TableHead>
              <TableHead className="text-right">
                {t(`${PREFIX}.logs.columns.cost`)}
              </TableHead>
              <TableHead className="text-right">
                {t(`${PREFIX}.logs.columns.duration`)}
              </TableHead>
              <TableHead className="w-8">
                <span className="sr-only">{t(`${PREFIX}.common.more`)}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                selected={log.id === selectedId}
                onSelect={() => onSelect(log)}
              />
            ))}
          </TableBody>
        </Table>
        <Pager
          className="self-end"
          page={filters.page}
          pageSize={LOG_PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </>
    )

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center gap-space-sm">
        <FilterChip
          filter={{
            key: 'range',
            label: t(`${PREFIX}.logs.range`),
            selection: 'single',
            value: [String(filters.range)],
            options: GATEWAY_WINDOWS.map((days) => ({
              value: String(days),
              label: t(`${PREFIX}.logs.ranges.${days}`),
            })),
          }}
          onChange={([value]) =>
            setFilters({
              range: value ? (Number(value) as GatewayWindow) : undefined,
            })
          }
        />
        <FilterChip
          filter={{
            key: 'key',
            label: t(`${PREFIX}.logs.key`),
            selection: 'single',
            value: filters.keyId ? [filters.keyId] : [],
            options: keyOptions,
          }}
          onChange={([value]) => setFilters({ keyId: value ?? null })}
        />
        <FilterChip
          filter={{
            key: 'model',
            label: t(`${PREFIX}.logs.model`),
            selection: 'single',
            value: filters.model ? [filters.model] : [],
            options: modelNames.map((name) => ({ value: name, label: name })),
          }}
          onChange={([value]) => setFilters({ model: value ?? null })}
        />
        <FilterChip
          filter={{
            key: 'outcome',
            label: t(`${PREFIX}.logs.outcome`),
            selection: 'single',
            value: filters.outcome ? [filters.outcome] : [],
            options: (['success', 'error'] as const).map((value) => ({
              value,
              label: t(`${PREFIX}.logs.outcomes.${value}`),
            })),
          }}
          onChange={([value]) =>
            setFilters({
              outcome: value === 'success' || value === 'error' ? value : null,
            })
          }
        />
        <FilterChip
          filter={{
            key: 'status',
            label: t(`${PREFIX}.logs.statusCode`),
            selection: 'single',
            value: filters.statusCode ? [String(filters.statusCode)] : [],
            options: [
              ...new Set([
                ...STATUS_CODES,
                ...(filters.statusCode ? [filters.statusCode] : []),
              ]),
            ].map((code) => ({ value: String(code), label: String(code) })),
          }}
          onChange={([value]) =>
            setFilters({ statusCode: value ? Number(value) : null })
          }
        />
        <div className="w-full sm:w-48">
          <Input
            type="search"
            inputSize="sm"
            aria-label={t(`${PREFIX}.logs.endUser`)}
            placeholder={t(`${PREFIX}.logs.endUserPlaceholder`)}
            value={endUser}
            leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
            onChange={(event) => setEndUser(event.target.value)}
            onBlur={commitEndUser}
            onKeyDown={(event) => {
              if (event.key === 'Enter') commitEndUser()
            }}
          />
        </div>
        <div className="ml-auto flex items-center gap-space-sm">
          <div
            className="flex items-center gap-space-xs text-sm text-fg-muted"
            title={t(`${PREFIX}.logs.liveHint`)}
          >
            <Switch
              size="sm"
              checked={live}
              aria-label={t(`${PREFIX}.logs.liveHint`)}
              onCheckedChange={setLive}
            />
            <span aria-hidden="true">{t(`${PREFIX}.logs.live`)}</span>
          </div>
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={t(`${PREFIX}.logs.refresh`)}
            title={t(`${PREFIX}.logs.refresh`)}
            onClick={() => void logsQuery.refetch()}
          >
            <RefreshCw
              className={cn(
                'size-icon-sm',
                logsQuery.isFetching &&
                  'animate-spin motion-reduce:animate-none',
              )}
              aria-hidden="true"
            />
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={logs.length === 0}
            title={t(`${PREFIX}.logs.exportHint`, {
              value: formatCount(EXPORT_MAX_ROWS),
            })}
            leftIcon={
              progress ? (
                <X className="size-icon-sm" aria-hidden="true" />
              ) : (
                <Download className="size-icon-sm" aria-hidden="true" />
              )
            }
            onClick={() => void exportCsv()}
          >
            {progress
              ? t(`${PREFIX}.logs.exporting`, {
                  loaded: formatCount(progress.loaded),
                  total: formatCount(progress.total),
                })
              : t(`${PREFIX}.logs.export`)}
          </Button>
        </div>
      </div>
      {body}
    </div>
  )
}
