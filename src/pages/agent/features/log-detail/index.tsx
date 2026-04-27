import { SectionCard } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import type { LogDetailSource, LogDetailViewModel } from './types'
import { ErrorBanner } from './components/error-banner'
import { InputsSummary } from './components/inputs-summary'
import { LatestOutput } from './components/latest-output'
import { LogDetailActions } from './components/log-detail-actions'
import { TraceTimeline } from './components/trace-timeline'
import { Transcript } from './components/transcript'
import { useLogDetail } from './hooks/use-log-detail'

type LogDetailProps = LogDetailSource

const STATUS_LABEL_MAP: Record<LogDetailViewModel['status'], string> = {
  running: '运行中',
  success: '成功',
  error: '失败',
  unknown: '未知',
  idle: '待运行',
}

const STATUS_VARIANT_MAP: Record<
  LogDetailViewModel['status'],
  'secondary' | 'warning' | 'success' | 'destructive' | 'outline'
> = {
  running: 'warning',
  success: 'success',
  error: 'destructive',
  unknown: 'outline',
  idle: 'secondary',
}

export function LogDetail(props: LogDetailProps) {
  const { viewModel, isLoading, isError, error, refetchTrace } = useLogDetail(props)

  if (isLoading && props.mode === 'session' && !viewModel.sessionId) {
    return (
      <div className="p-space-md text-sm text-text-secondary">
        正在加载会话详情...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-space-md text-sm text-status-error">
        {error instanceof Error ? error.message : '会话详情加载失败'}
      </div>
    )
  }

  return (
    <div className="space-y-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-space-xs">
            <h3 className="truncate text-sm font-medium text-text-primary">
              {viewModel.sessionName || '运行日志'}
            </h3>
            <Badge variant={STATUS_VARIANT_MAP[viewModel.status]}>
              {STATUS_LABEL_MAP[viewModel.status]}
            </Badge>
            {viewModel.source ? (
              <Badge variant="outline">{viewModel.source}</Badge>
            ) : null}
          </div>
          {viewModel.sessionId ? (
            <p className="mt-space-xs truncate text-xs text-text-tertiary">
              {viewModel.sessionId}
            </p>
          ) : null}
        </div>
        <LogDetailActions
          source={props}
          viewModel={viewModel}
          onRefetchTrace={() => {
            void refetchTrace()
          }}
        />
      </div>

      <ErrorBanner message={viewModel.errorMessage} />

      <SectionCard title="Inputs" padding="default">
        <InputsSummary inputs={viewModel.inputs} files={viewModel.files} />
      </SectionCard>

      <SectionCard title="Latest Output" padding="default">
        <LatestOutput output={viewModel.latestOutput} />
      </SectionCard>

      <SectionCard title="Trace Timeline" padding="default">
        <TraceTimeline
          items={viewModel.traceItems}
          unavailableReason={viewModel.traceUnavailableReason}
        />
      </SectionCard>

      <SectionCard title="Transcript" padding="default">
        <Transcript messages={viewModel.transcript} />
      </SectionCard>
    </div>
  )
}

export type { LogDetailSource, LogDetailViewModel } from './types'
