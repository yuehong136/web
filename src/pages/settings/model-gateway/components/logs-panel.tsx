import { useState } from 'react'
import { ScrollText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type {
  GatewayKey,
  GatewayLog,
  GatewayLogOutcome,
  GatewayModel,
} from '@/api/model-gateway'
import {
  ListPagination,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  PageToolbar,
} from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { StatusDot } from './status-dot'
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
import { useFetchGatewayLogs } from '@/hooks/use-model-gateway-request'
import { formatCount, formatDuration, formatInstant } from '../utils'

interface LogsPanelProps {
  keys: GatewayKey[]
  models: GatewayModel[]
}

const ALL = 'all'
const PAGE_SIZES = [20, 50, 100]

const failed = (log: GatewayLog) =>
  log.error_type !== null || log.status_code >= 400

/** Request logs: one row per call, never the request or response body. */
export const LogsPanel = ({ keys, models }: LogsPanelProps) => {
  const { t } = useTranslation()
  const [keyId, setKeyId] = useState(ALL)
  const [model, setModel] = useState(ALL)
  const [outcome, setOutcome] = useState<typeof ALL | GatewayLogOutcome>(ALL)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  const logsQuery = useFetchGatewayLogs({
    page,
    page_size: pageSize,
    key_id: keyId === ALL ? undefined : keyId,
    model: model === ALL ? undefined : model,
    outcome: outcome === ALL ? undefined : outcome,
  })
  const logs = logsQuery.data?.items ?? []
  const total = logsQuery.data?.total ?? 0

  // Changing a filter starts again from the first page.
  const selectKey = (value: string) => {
    setKeyId(value)
    setPage(1)
  }
  const selectModel = (value: string) => {
    setModel(value)
    setPage(1)
  }
  const selectOutcome = (value: string) => {
    setOutcome(value as typeof ALL | GatewayLogOutcome)
    setPage(1)
  }

  const tokens = (log: GatewayLog) =>
    log.total_tokens === null
      ? t('settings.modelGateway.logs.usageUnknown')
      : t('settings.modelGateway.logs.tokensValue', {
          // A part the upstream did not report (output tokens of an
          // embedding call, for instance) is shown as unknown, not as zero.
          prompt:
            log.prompt_tokens === null ? '-' : formatCount(log.prompt_tokens),
          completion:
            log.completion_tokens === null
              ? '-'
              : formatCount(log.completion_tokens),
          total: formatCount(log.total_tokens),
        })

  return (
    <div className="space-y-space-base">
      <PageToolbar
        wrap
        left={
          <div className="flex flex-wrap gap-space-sm">
            <Select value={keyId} onValueChange={selectKey}>
              <SelectTrigger
                className="w-48"
                aria-label={t('settings.modelGateway.logs.filterKey')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('settings.modelGateway.logs.allKeys')}
                </SelectItem>
                {keys.map((key) => (
                  <SelectItem key={key.id} value={key.id}>
                    {key.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={model} onValueChange={selectModel}>
              <SelectTrigger
                className="w-48"
                aria-label={t('settings.modelGateway.logs.filterModel')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('settings.modelGateway.logs.allModels')}
                </SelectItem>
                {models.map((item) => (
                  <SelectItem key={item.id} value={item.name}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={outcome} onValueChange={selectOutcome}>
              <SelectTrigger
                className="w-40"
                aria-label={t('settings.modelGateway.logs.filterOutcome')}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>
                  {t('settings.modelGateway.logs.allOutcomes')}
                </SelectItem>
                <SelectItem value="success">
                  {t('settings.modelGateway.logs.success')}
                </SelectItem>
                <SelectItem value="error">
                  {t('settings.modelGateway.logs.error')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {logsQuery.isPending ? (
        <PageLoadingState compact />
      ) : logsQuery.isError ? (
        <PageErrorState
          titleAs="h3"
          title={t('settings.modelGateway.logs.loadFailed')}
          retryLabel={t('common.retry')}
          onRetry={() => void logsQuery.refetch()}
        />
      ) : logs.length === 0 ? (
        <PageEmptyState
          title={t('settings.modelGateway.logs.empty')}
          description={t('settings.modelGateway.logs.emptyDescription')}
          icon={<ScrollText className="size-icon-lg" aria-hidden="true" />}
        />
      ) : (
        <>
          <Table wrapperClassName="rounded-radius-lg border border-border-subtle">
            <TableHeader className="bg-surface-secondary">
              <TableRow>
                <TableHead>{t('settings.modelGateway.logs.time')}</TableHead>
                <TableHead>{t('settings.modelGateway.keys.key')}</TableHead>
                <TableHead>{t('settings.modelGateway.logs.model')}</TableHead>
                <TableHead>
                  {t('settings.modelGateway.logs.endpoint')}
                </TableHead>
                <TableHead>{t('settings.modelGateway.logs.result')}</TableHead>
                <TableHead>{t('settings.modelGateway.logs.tokens')}</TableHead>
                <TableHead>
                  {t('settings.modelGateway.logs.duration')}
                </TableHead>
                <TableHead>{t('settings.modelGateway.logs.endUser')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm whitespace-nowrap text-text-secondary">
                    {formatInstant(log.started_at) ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-text-primary">
                    {log.key_name}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-text-secondary">
                    {log.model ?? '-'}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    <span className="font-mono">{log.endpoint}</span>
                    {log.stream ? (
                      <Badge variant="outline" className="ml-space-xs">
                        {t('settings.modelGateway.logs.stream')}
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <StatusDot
                      tone={failed(log) ? 'error' : 'success'}
                      className="font-mono"
                    >
                      {log.status_code}
                    </StatusDot>
                    {(log.error_code ?? log.error_type) ? (
                      <span className="ml-space-xs font-mono text-sm text-text-tertiary">
                        {log.error_code ?? log.error_type}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-text-secondary">
                    {tokens(log)}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap text-text-secondary">
                    {formatDuration(log.duration_ms)}
                    {log.first_token_ms !== null ? (
                      <div className="text-text-tertiary">
                        {t('settings.modelGateway.logs.firstToken', {
                          value: formatDuration(log.first_token_ms),
                        })}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-text-secondary">
                    {log.end_user ?? '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ListPagination
            total={total}
            page={page}
            pageSize={pageSize}
            pageSizeOptions={PAGE_SIZES}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        </>
      )}
    </div>
  )
}
