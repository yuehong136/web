import { useMemo, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GatewayUsageGroup, GatewayUsageRow } from '@/api/model-gateway'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageToolbar,
  StatCard,
  StatGrid,
} from '@/components/patterns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useFetchGatewayUsage } from '@/hooks/use-model-gateway-request'
import { formatCount } from '../utils'

const GROUPS: GatewayUsageGroup[] = ['key', 'model', 'day', 'end_user']
const RANGES = ['1', '7', '30'] as const
type RangeDays = (typeof RANGES)[number]
const DAY_MS = 24 * 60 * 60 * 1000

/** Start of the UTC day `days - 1` days ago: the server groups by UTC day. */
function rangeStart(days: number, now: number = Date.now()): string {
  const start = new Date(now - (days - 1) * DAY_MS)
  start.setUTCHours(0, 0, 0, 0)
  return start.toISOString()
}

const SUMMED = [
  'requests',
  'errors',
  'prompt_tokens',
  'completion_tokens',
  'total_tokens',
  'usage_unknown',
] as const

/** Usage aggregated by key, model, day or end user over a recent range. */
export const UsagePanel = () => {
  const { t } = useTranslation()
  const [group, setGroup] = useState<GatewayUsageGroup>('key')
  const [days, setDays] = useState<RangeDays>('7')
  // Recomputed only when the range changes, so the query key stays stable.
  const start = useMemo(() => rangeStart(Number(days)), [days])
  const usageQuery = useFetchGatewayUsage({ group_by: group, start })
  const rows = useMemo(() => usageQuery.data?.items ?? [], [usageQuery.data])

  const totals = useMemo(() => {
    const sum = Object.fromEntries(SUMMED.map((field) => [field, 0])) as Record<
      (typeof SUMMED)[number],
      number
    >
    for (const row of rows) for (const field of SUMMED) sum[field] += row[field]
    return sum
  }, [rows])

  const label = (row: GatewayUsageRow): string => {
    if (group === 'key') return row.key_name ?? row.key_id ?? '-'
    if (group === 'model') return row.model ?? '-'
    if (group === 'day') return row.day ?? '-'
    return row.end_user ?? t('settings.modelGateway.usage.noEndUser')
  }

  return (
    <div className="space-y-space-base">
      <PageToolbar
        wrap
        left={
          <div className="flex flex-wrap gap-space-sm">
            <Select
              value={group}
              onValueChange={(value) => setGroup(value as GatewayUsageGroup)}
            >
              <SelectTrigger
                className="w-44"
                aria-label={t('settings.modelGateway.usage.groupBy')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GROUPS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`settings.modelGateway.usage.groups.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={days}
              onValueChange={(value) => setDays(value as RangeDays)}
            >
              <SelectTrigger
                className="w-44"
                aria-label={t('settings.modelGateway.usage.range')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`settings.modelGateway.usage.ranges.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {usageQuery.isPending ? (
        <PageLoadingState compact />
      ) : usageQuery.isError ? (
        <PageErrorState
          titleAs="h3"
          title={t('settings.modelGateway.usage.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void usageQuery.refetch()}
        />
      ) : rows.length === 0 ? (
        <PageEmptyState
          title={t('settings.modelGateway.usage.empty')}
          description={t('settings.modelGateway.usage.emptyDescription')}
          icon={<BarChart3 className="size-icon-lg" aria-hidden="true" />}
        />
      ) : (
        <>
          <StatGrid columns={4}>
            <StatCard
              title={t('settings.modelGateway.usage.requests')}
              value={formatCount(totals.requests)}
            />
            <StatCard
              title={t('settings.modelGateway.usage.errors')}
              value={formatCount(totals.errors)}
              tone={totals.errors > 0 ? 'warning' : 'neutral'}
            />
            <StatCard
              title={t('settings.modelGateway.usage.totalTokens')}
              value={formatCount(totals.total_tokens)}
            />
            <StatCard
              title={t('settings.modelGateway.usage.unknown')}
              value={formatCount(totals.usage_unknown)}
              description={t('settings.modelGateway.usage.unknownHint')}
            />
          </StatGrid>
          <Table wrapperClassName="rounded-radius-lg border border-border-subtle">
            <TableHeader className="bg-surface-secondary">
              <TableRow>
                <TableHead>
                  {t(`settings.modelGateway.usage.groups.${group}`)}
                </TableHead>
                <TableHead className="text-right">
                  {t('settings.modelGateway.usage.requests')}
                </TableHead>
                <TableHead className="text-right">
                  {t('settings.modelGateway.usage.errors')}
                </TableHead>
                <TableHead className="text-right">
                  {t('settings.modelGateway.usage.promptTokens')}
                </TableHead>
                <TableHead className="text-right">
                  {t('settings.modelGateway.usage.completionTokens')}
                </TableHead>
                <TableHead className="text-right">
                  {t('settings.modelGateway.usage.totalTokens')}
                </TableHead>
                <TableHead className="text-right">
                  {t('settings.modelGateway.usage.unknown')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow
                  key={`${group}:${row.key_id ?? row.model ?? row.day ?? row.end_user ?? index}`}
                >
                  <TableCell className="text-sm text-text-primary">
                    {label(row)}
                  </TableCell>
                  {SUMMED.map((field) => (
                    <TableCell
                      key={field}
                      className="text-right text-sm text-text-secondary tabular-nums"
                    >
                      {formatCount(row[field])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
