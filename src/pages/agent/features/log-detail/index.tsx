import {
  AlertTriangle,
  FileText,
  GitBranch,
  Hash,
  MessageSquare,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn, formatTimestampDetailed } from '@/lib/utils'
import type { AgentSession } from '@/types/agent'
import type { LogDetailSource, LogDetailViewModel } from './types'
import { TraceWorkbench } from '../trace-workbench'
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

const STATUS_CLASS_MAP: Record<LogDetailViewModel['status'], string> = {
  running: 'bg-status-info-subtle text-status-info border-status-info-border',
  success:
    'bg-status-success-subtle text-status-success border-status-success-border',
  error: 'bg-status-error-subtle text-status-error border-status-error-border',
  unknown: 'bg-background-subtle text-text-secondary border-border-subtle',
  idle: 'bg-background-subtle text-text-secondary border-border-subtle',
}

function asSession(value: unknown): AgentSession | undefined {
  if (value && typeof value === 'object' && 'id' in value) {
    return value as AgentSession
  }

  return undefined
}

function formatDuration(duration?: number): string {
  if (!duration) {
    return '-'
  }

  return duration > 1000 ? `${(duration / 1000).toFixed(1)}s` : `${duration}ms`
}

function formatTime(value?: number | string): string {
  if (typeof value === 'number') {
    return formatTimestampDetailed(value)
  }

  return value || '-'
}

function DetailTab({
  active = false,
  icon: Icon,
  label,
  count,
}: {
  active?: boolean
  icon: typeof MessageSquare
  label: string
  count?: number
}) {
  return (
    <div
      className={cn(
        'flex h-10 items-center gap-space-xs border-b-2 px-space-sm text-sm font-medium',
        active
          ? 'border-state-focus text-text-primary'
          : 'border-transparent text-text-tertiary',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {typeof count === 'number' ? (
        <span className="font-mono text-xs text-text-caption">{count}</span>
      ) : null}
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-b border-border-subtle px-space-xl py-space-base last:border-b-0">
      <h4 className="mb-space-sm text-xs font-semibold tracking-wide text-text-tertiary uppercase">
        {title}
      </h4>
      {children}
    </section>
  )
}

function SummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <div className="text-xs text-text-tertiary">{label}</div>
      <div className="min-w-0 text-xs break-words text-text-primary">
        {value}
      </div>
    </>
  )
}

function RuntimeSummary({
  viewModel,
  session,
}: {
  viewModel: LogDetailViewModel
  session?: AgentSession
}) {
  return (
    <aside className="hidden w-[300px] shrink-0 border-l border-components-split-pane-border bg-components-console-surface xl:flex xl:flex-col">
      <div className="border-b border-border-subtle px-space-lg py-space-base">
        <h4 className="text-sm font-semibold text-text-primary">运行摘要</h4>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="border-b border-border-subtle px-space-lg py-space-base">
          <h5 className="mb-space-sm text-xs font-semibold tracking-wide text-text-tertiary uppercase">
            基本信息
          </h5>
          <div className="grid grid-cols-[72px_1fr] gap-x-space-sm gap-y-space-xs">
            <SummaryRow
              label="状态"
              value={
                <span
                  className={cn(
                    'inline-flex items-center gap-space-xs rounded-radius-full border px-space-xs py-[2px] text-[11px] font-medium',
                    STATUS_CLASS_MAP[viewModel.status],
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-radius-full bg-current" />
                  {STATUS_LABEL_MAP[viewModel.status]}
                </span>
              }
            />
            <SummaryRow label="来源" value={viewModel.source || '-'} />
            <SummaryRow
              label="用户"
              value={String(session?.user_id || session?.exp_user_id || '-')}
            />
            <SummaryRow
              label="开始"
              value={formatTime(session?.create_time || session?.create_date)}
            />
            <SummaryRow
              label="结束"
              value={formatTime(session?.update_time || session?.update_date)}
            />
            <SummaryRow
              label="耗时"
              value={formatDuration(session?.duration)}
            />
            <SummaryRow label="Token" value={session?.tokens ?? '-'} />
            <SummaryRow
              label="轮次"
              value={session?.round ?? session?.message_count ?? '-'}
            />
          </div>
        </div>

        {viewModel.errorMessage ? (
          <div className="border-b border-border-subtle px-space-lg py-space-base">
            <div className="rounded-radius-md border border-status-error-border bg-status-error-subtle p-space-sm text-xs text-status-error">
              <div className="mb-space-xs flex items-center gap-space-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                错误摘要
              </div>
              <p className="font-mono leading-relaxed">
                {viewModel.errorMessage}
              </p>
            </div>
          </div>
        ) : null}

        <div className="border-b border-border-subtle px-space-lg py-space-base">
          <h5 className="mb-space-sm flex items-center gap-space-xs text-xs font-semibold tracking-wide text-text-tertiary uppercase">
            Trace 时间线
            <span className="ml-auto font-mono text-[11px] text-text-caption">
              {viewModel.traceItems.length}
            </span>
          </h5>
          <TraceTimeline
            items={viewModel.traceItems}
            unavailableReason={viewModel.traceUnavailableReason}
          />
        </div>

        <div className="px-space-lg py-space-base">
          <h5 className="mb-space-sm text-xs font-semibold tracking-wide text-text-tertiary uppercase">
            标识
          </h5>
          <div className="grid grid-cols-[72px_1fr] gap-x-space-sm gap-y-space-xs">
            <SummaryRow
              label="Session"
              value={
                <span className="font-mono">{viewModel.sessionId || '-'}</span>
              }
            />
            <SummaryRow
              label="Canvas"
              value={
                <span className="font-mono">{session?.canvas_id || '-'}</span>
              }
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

export function LogDetail(props: LogDetailProps) {
  const { viewModel, isLoading, isError, error, isTraceLoading, refetchTrace } =
    useLogDetail(props)
  const session = asSession(viewModel.rawSession)

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

  if (props.mode === 'session') {
    return (
      <TraceWorkbench
        viewModel={viewModel.traceRun}
        isLoading={isTraceLoading}
        onRefresh={() => {
          void refetchTrace()
        }}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 bg-components-split-pane-bg">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-[56px] items-center justify-between gap-space-sm border-b border-components-split-pane-border bg-components-console-surface px-space-lg">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-space-xs">
              <Badge variant={STATUS_VARIANT_MAP[viewModel.status]}>
                {STATUS_LABEL_MAP[viewModel.status]}
              </Badge>
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {viewModel.sessionName || '运行日志'}
              </h3>
            </div>
            <div className="mt-space-xs flex min-w-0 items-center gap-space-xs text-xs text-text-tertiary">
              <span className="truncate font-mono">
                {viewModel.sessionId || '-'}
              </span>
              {viewModel.source ? (
                <>
                  <span>·</span>
                  <span>{viewModel.source}</span>
                </>
              ) : null}
            </div>
          </div>
          <LogDetailActions
            source={props}
            viewModel={viewModel}
            onRefetchTrace={() => {
              void refetchTrace()
            }}
          />
        </div>

        <div className="flex shrink-0 items-center border-b border-border-subtle bg-components-console-surface px-space-lg">
          <DetailTab
            active
            icon={MessageSquare}
            label="消息回放"
            count={viewModel.transcript.length}
          />
          <DetailTab
            icon={GitBranch}
            label="Trace"
            count={viewModel.traceItems.length}
          />
          <DetailTab icon={FileText} label="输入输出" />
          <DetailTab icon={Hash} label="Raw" />
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-[920px] py-space-lg">
            <div className="px-space-xl">
              <ErrorBanner message={viewModel.errorMessage} />
            </div>
            <DetailSection title="消息回放">
              <Transcript messages={viewModel.transcript} />
            </DetailSection>
            <DetailSection title="输入">
              <InputsSummary
                inputs={viewModel.inputs}
                files={viewModel.files}
              />
            </DetailSection>
            <DetailSection title="最新输出">
              <LatestOutput output={viewModel.latestOutput} />
            </DetailSection>
            <DetailSection title="Trace">
              <TraceTimeline
                items={viewModel.traceItems}
                unavailableReason={viewModel.traceUnavailableReason}
              />
            </DetailSection>
          </div>
        </div>
      </div>

      <RuntimeSummary viewModel={viewModel} session={session} />
    </div>
  )
}

export type { LogDetailSource, LogDetailViewModel } from './types'
