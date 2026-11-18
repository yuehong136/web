import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Cpu,
  Database,
  DatabaseZap,
  HardDrive,
  RefreshCw,
  ScanSearch,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { InlineStats } from '@/components/patterns/inline-stats'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { SETTINGS_CARD } from '@/pages/settings/components/settings-card'
import { Button } from '@/components/ui/button'
import {
  useRefreshSystemStatus,
  useSystemStatus,
  useSystemVersion,
} from '@/hooks/use-system-status'
import { cn } from '@/lib/utils'
import { getCurrentLanguage } from '@/locales/i18n'
import { Sparkline } from './components/sparkline'
import {
  componentRows,
  executorRows,
  healthCounts,
  parseVersion,
  type ComponentRow,
  type ExecutorRow,
  type Health,
} from './system-status'
import { useLatencyHistory } from './use-latency-history'

const DOT: Record<Health, string> = {
  green: 'bg-success-fg',
  yellow: 'bg-warning-fg',
  red: 'bg-danger-fg',
}

const COMPONENT_ICON: Record<ComponentRow['id'], LucideIcon> = {
  database: Database,
  database_pool: DatabaseZap,
  doc_engine: ScanSearch,
  redis: Zap,
  storage: HardDrive,
}

const TILE: Record<Health, string> = {
  green: 'bg-sunken text-fg-muted',
  yellow: 'bg-warning-soft text-warning-fg',
  red: 'bg-danger-soft text-danger-fg',
}

/** The component's icon on a tile tinted by its health. */
function HealthTile({
  icon: Icon,
  status,
}: {
  icon: LucideIcon
  status: Health
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-radius-md [&_svg]:size-icon-sm',
        TILE[status],
      )}
    >
      <Icon strokeWidth={1.75} />
    </span>
  )
}

function HealthLabel({ status }: { status: Health }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center gap-space-xs text-sm text-fg-muted">
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0 rounded-radius-full', DOT[status])}
      />
      {t(`settings.system.health.${status}`)}
    </span>
  )
}

function ComponentStatusRow({
  row,
  trend,
}: {
  row: ComponentRow
  trend: number[] | undefined
}) {
  const { t } = useTranslation()
  const name = t(`settings.system.components.${row.id}`, {
    engine: row.engine ?? '',
  })
  const detail = row.error
    ? row.error
    : row.pool
      ? t('settings.system.poolUsage', row.pool)
      : undefined
  return (
    <SettingRow
      leading={<HealthTile icon={COMPONENT_ICON[row.id]} status={row.status} />}
      label={name}
      description={detail}
      tone={row.error ? 'error' : 'default'}
    >
      {row.version ? (
        <span className="font-mono text-xs text-fg-subtle">{row.version}</span>
      ) : null}
      {trend ? (
        <Sparkline
          values={trend}
          className="text-fg-subtle"
          label={t('settings.system.latencyTrend', {
            name,
            from: trend[0],
            to: trend[trend.length - 1],
          })}
        />
      ) : null}
      <span className="w-16 text-right text-sm text-fg-muted tabular-nums">
        {row.latency === null
          ? '—'
          : t('settings.system.milliseconds', { value: row.latency })}
      </span>
      <HealthLabel status={row.status} />
    </SettingRow>
  )
}

function ExecutorStatusRow({ row }: { row: ExecutorRow }) {
  const { t } = useTranslation()
  const current = Object.entries(row.current)
  const boot = row.bootAt ? new Date(row.bootAt) : null
  const meta = [
    t('settings.system.executor.pending', { count: row.pending }),
    t('settings.system.executor.lag', { value: row.lag }),
    t('settings.system.executor.done', { count: row.done }),
    t('settings.system.executor.failed', { count: row.failed }),
    boot && !Number.isNaN(boot.getTime())
      ? t('settings.system.executor.started', {
          date: new Intl.DateTimeFormat(getCurrentLanguage(), {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(boot),
        })
      : null,
  ].filter(Boolean)
  return (
    <div className="flex flex-col">
      <SettingRow
        leading={<HealthTile icon={Cpu} status={row.status} />}
        label={row.name}
        description={meta.join(' · ')}
        tone={row.status === 'red' ? 'error' : 'default'}
      >
        <Sparkline
          values={row.pendingTrend}
          className="text-fg-subtle"
          label={t('settings.system.executor.pendingTrend', {
            name: row.name,
          })}
        />
        <HealthLabel status={row.status} />
      </SettingRow>
      {current.length ? (
        <details className="pb-space-sm text-xs">
          <summary className="cursor-pointer text-fg-muted">
            {t('settings.system.executor.current')}
          </summary>
          <dl className="mt-space-xs grid grid-cols-[auto_minmax(0,1fr)] gap-x-space-md gap-y-space-2xs">
            {current.map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="font-mono text-fg-subtle">{key}</dt>
                <dd className="min-w-0 font-mono break-all text-fg-muted">
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  )
}

/** Health of each service behind the workspace, one row per component. */
export function SystemPage() {
  const { t } = useTranslation()
  const { data, isPending, isError, isRefetching, dataUpdatedAt } =
    useSystemStatus()
  const version = parseVersion(useSystemVersion().data)
  const refresh = useRefreshSystemStatus()
  const components = useMemo(() => (data ? componentRows(data) : []), [data])
  const executors = useMemo(
    () => executorRows(data?.task_executor_heartbeats),
    [data],
  )
  const history = useLatencyHistory(components, dataUpdatedAt)
  const counts = healthCounts(components)

  const actions = (
    <Button
      variant="outline"
      size="sm"
      loading={isRefetching}
      leftIcon={<RefreshCw className="size-icon-sm" aria-hidden="true" />}
      onClick={() => void refresh()}
    >
      {t('common.refresh')}
    </Button>
  )
  const updated =
    dataUpdatedAt > 0
      ? t('settings.system.updatedAt', {
          time: new Intl.DateTimeFormat(getCurrentLanguage(), {
            timeStyle: 'medium',
          }).format(dataUpdatedAt),
        })
      : null

  let body
  if (isPending)
    body = (
      <PageLoadingState
        compact
        title={t('common.loading')}
        description={null}
      />
    )
  else if (isError)
    body = (
      <PageErrorState
        compact
        title={t('settings.system.loadFailed')}
        description={null}
        retryLabel={t('common.retry')}
        onRetry={() => void refresh()}
      />
    )
  else
    body = (
      <>
        <SettingSection
          title={t('settings.system.componentsTitle')}
          className={SETTINGS_CARD}
        >
          <div className="pb-space-sm">
            <InlineStats
              items={[
                {
                  key: 'green',
                  label: t('settings.system.health.green'),
                  value: counts.green,
                  tone: 'success',
                },
                ...(counts.yellow
                  ? [
                      {
                        key: 'yellow',
                        label: t('settings.system.health.yellow'),
                        value: counts.yellow,
                        tone: 'warning' as const,
                      },
                    ]
                  : []),
                ...(counts.red
                  ? [
                      {
                        key: 'red',
                        label: t('settings.system.health.red'),
                        value: counts.red,
                        tone: 'error' as const,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
          {components.map((row) => (
            <ComponentStatusRow
              key={row.id}
              row={row}
              trend={history[row.id]}
            />
          ))}
        </SettingSection>

        <SettingSection
          title={t('settings.system.executorsTitle')}
          className={SETTINGS_CARD}
        >
          {executors.length ? (
            executors.map((row) => <ExecutorStatusRow key={row.id} row={row} />)
          ) : (
            <PageEmptyState
              compact
              title={t('settings.system.noExecutors')}
              description={null}
            />
          )}
        </SettingSection>

        {version ? (
          <SettingSection
            title={t('settings.system.versionTitle')}
            className={SETTINGS_CARD}
          >
            <SettingRow label={t('settings.system.version')}>
              <span className="font-mono text-sm text-fg-muted">
                {version.version || '—'}
              </span>
            </SettingRow>
            {version.commit ? (
              <SettingRow
                label={t('settings.system.commit')}
                description={
                  version.commits
                    ? t('settings.system.commitsSinceTag', {
                        count: Number(version.commits),
                      })
                    : undefined
                }
              >
                <span className="font-mono text-sm text-fg-muted">
                  {version.commit}
                </span>
              </SettingRow>
            ) : null}
            {version.build ? (
              <SettingRow label={t('settings.system.build')}>
                <span className="font-mono text-sm text-fg-muted">
                  {version.build}
                </span>
              </SettingRow>
            ) : null}
          </SettingSection>
        ) : null}
      </>
    )

  return (
    <SettingsTemplate
      description={
        <>
          {t('settings.system.description')}
          {updated ? (
            <span className="ml-space-xs text-fg-subtle">
              {isRefetching ? t('settings.system.updating') : updated}
            </span>
          ) : null}
        </>
      }
      actions={actions}
    >
      {body}
    </SettingsTemplate>
  )
}
