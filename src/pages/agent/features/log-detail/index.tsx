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
  running: 'bg-state-info-subtle text-state-info border-state-info',
  success: 'bg-state-success-subtle text-state-success border-state-success',
  error: 'bg-state-error-subtle text-state-error border-state-error',
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
        'gap-space-xs px-space-sm flex h-10 items-center border-b-2 text-sm font-medium',
        active
          ? 'border-state-focus text-text-primary'
          : 'border-transparent text-text-tertiary',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {typeof count === 'number' ? (
        <span className="text-text-caption font-mono text-xs">{count}</span>
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
    <section className="px-space-xl py-space-base border-b border-border-subtle last:border-b-0">
      <h4 className="mb-space-sm text-xs font-semibold uppercase tracking-wide text-text-tertiary">
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
      <div className="min-w-0 break-words text-xs text-text-primary">
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
      <div className="px-space-lg py-space-base border-b border-border-subtle">
        <h4 className="text-sm font-semibold text-text-primary">运行摘要</h4>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="px-space-lg py-space-base border-b border-border-subtle">
          <h5 className="mb-space-sm text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            基本信息
          </h5>
          <div className="gap-x-space-sm gap-y-space-xs grid grid-cols-[72px_1fr]">
            <SummaryRow
              label="状态"
              value={
                <span
                  className={cn(
                    'gap-space-xs rounded-radius-full px-space-xs inline-flex items-center border py-[2px] text-[11px] font-medium',
                    STATUS_CLASS_MAP[viewModel.status],
                  )}
                >
                  <span className="rounded-radius-full h-1.5 w-1.5 bg-current" />
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
          <div className="px-space-lg py-space-base border-b border-border-subtle">
            <div className="rounded-radius-md p-space-sm border border-state-error bg-state-error-subtle text-xs text-state-error">
              <div className="mb-space-xs gap-space-xs flex items-center font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                错误摘要
              </div>
              <p className="font-mono leading-relaxed">
                {viewModel.errorMessage}
              </p>
            </div>
          </div>
        ) : null}

        <div className="px-space-lg py-space-base border-b border-border-subtle">
          <h5 className="mb-space-sm gap-space-xs flex items-center text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            Trace 时间线
            <span className="text-text-caption ml-auto font-mono text-[11px]">
              {viewModel.traceItems.length}
            </span>
          </h5>
          <TraceTimeline
            items={viewModel.traceItems}
            unavailableReason={viewModel.traceUnavailableReason}
          />
        </div>

        <div className="px-space-lg py-space-base">
          <h5 className="mb-space-sm text-xs font-semibold uppercase tracking-wide text-text-tertiary">
            标识
          </h5>
          <div className="gap-x-space-sm gap-y-space-xs grid grid-cols-[72px_1fr]">
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
      <div className="p-space-md text-status-error text-sm">
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
        <div className="gap-space-sm px-space-lg flex min-h-[56px] items-center justify-between border-b border-components-split-pane-border bg-components-console-surface">
          <div className="min-w-0">
            <div className="gap-space-xs flex min-w-0 items-center">
              <Badge variant={STATUS_VARIANT_MAP[viewModel.status]}>
                {STATUS_LABEL_MAP[viewModel.status]}
              </Badge>
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {viewModel.sessionName || '运行日志'}
              </h3>
            </div>
            <div className="mt-space-xs gap-space-xs flex min-w-0 items-center text-xs text-text-tertiary">
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

        <div className="px-space-lg flex shrink-0 items-center border-b border-border-subtle bg-components-console-surface">
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
          <div className="py-space-lg mx-auto max-w-[920px]">
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
