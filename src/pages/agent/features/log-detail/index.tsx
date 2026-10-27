import {
  AlertTriangle,
  FileText,
  GitBranch,
  Hash,
  MessageSquare,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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

const STATUS_LABEL_KEYS: Record<LogDetailViewModel['status'], string> = {
  running: 'agent.logDetail.status.running',
  success: 'agent.logDetail.status.success',
  error: 'agent.logDetail.status.error',
  unknown: 'agent.logDetail.status.unknown',
  idle: 'agent.logDetail.status.idle',
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
  const { t } = useTranslation()
  return (
    <aside className="hidden w-[300px] shrink-0 border-l border-components-split-pane-border bg-components-console-surface xl:flex xl:flex-col">
      <div className="border-b border-border-subtle px-space-lg py-space-base">
        <h4 className="text-sm font-semibold text-text-primary">
          {t('agent.logDetail.runSummary')}
        </h4>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="border-b border-border-subtle px-space-lg py-space-base">
          <h5 className="mb-space-sm text-xs font-semibold tracking-wide text-text-tertiary uppercase">
            {t('agent.logDetail.basicInfo')}
          </h5>
          <div className="grid grid-cols-[72px_1fr] gap-x-space-sm gap-y-space-xs">
            <SummaryRow
              label={t('agent.logDetail.fields.status')}
              value={
                <span
                  className={cn(
                    'inline-flex items-center gap-space-xs rounded-radius-full border px-space-xs py-[2px] text-[11px] font-medium',
                    STATUS_CLASS_MAP[viewModel.status],
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-radius-full bg-current" />
                  {t(STATUS_LABEL_KEYS[viewModel.status])}
                </span>
              }
            />
            <SummaryRow
              label={t('agent.logDetail.fields.source')}
              value={viewModel.source || '-'}
            />
            <SummaryRow
              label={t('agent.logDetail.fields.user')}
              value={String(session?.user_id || session?.exp_user_id || '-')}
            />
            <SummaryRow
              label={t('agent.logDetail.fields.start')}
              value={formatTime(session?.create_time || session?.create_date)}
            />
            <SummaryRow
              label={t('agent.logDetail.fields.end')}
              value={formatTime(session?.update_time || session?.update_date)}
            />
            <SummaryRow
              label={t('agent.logDetail.fields.duration')}
              value={formatDuration(session?.duration)}
            />
            <SummaryRow
              label={t('agent.logDetail.fields.tokens')}
              value={session?.tokens ?? '-'}
            />
            <SummaryRow
              label={t('agent.logDetail.fields.rounds')}
              value={session?.round ?? session?.message_count ?? '-'}
            />
          </div>
        </div>

        {viewModel.errorMessage ? (
          <div className="border-b border-border-subtle px-space-lg py-space-base">
            <div className="rounded-radius-md border border-status-error-border bg-status-error-subtle p-space-sm text-xs text-status-error">
              <div className="mb-space-xs flex items-center gap-space-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('agent.logDetail.errorSummary')}
              </div>
              <p className="font-mono leading-relaxed">
                {viewModel.errorMessage}
              </p>
            </div>
          </div>
        ) : null}

        <div className="border-b border-border-subtle px-space-lg py-space-base">
          <h5 className="mb-space-sm flex items-center gap-space-xs text-xs font-semibold tracking-wide text-text-tertiary uppercase">
            {t('agent.logDetail.traceTimeline')}
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
            {t('agent.logDetail.identifiers')}
          </h5>
          <div className="grid grid-cols-[72px_1fr] gap-x-space-sm gap-y-space-xs">
            <SummaryRow
              label={t('agent.trace.session')}
              value={
                <span className="font-mono">{viewModel.sessionId || '-'}</span>
              }
            />
            <SummaryRow
              label={t('agent.logDetail.fields.canvas')}
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
  const { t } = useTranslation()
  const { viewModel, isLoading, isError, error, isTraceLoading, refetchTrace } =
    useLogDetail(props)
  const session = asSession(viewModel.rawSession)

  if (isLoading && props.mode === 'session' && !viewModel.sessionId) {
    return (
      <div className="p-space-md text-sm text-text-secondary">
        {t('agent.logDetail.loading')}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-space-md text-sm text-status-error">
        {error instanceof Error
          ? error.message
          : t('agent.logDetail.loadFailed')}
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
                {t(STATUS_LABEL_KEYS[viewModel.status])}
              </Badge>
              <h3 className="truncate text-sm font-semibold text-text-primary">
                {viewModel.sessionName || t('agent.logDetail.defaultTitle')}
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
            label={t('agent.logDetail.sections.transcript')}
            count={viewModel.transcript.length}
          />
          <DetailTab
            icon={GitBranch}
            label={t('agent.trace.trace')}
            count={viewModel.traceItems.length}
          />
          <DetailTab
            icon={FileText}
            label={t('agent.logDetail.sections.inputsOutputs')}
          />
          <DetailTab icon={Hash} label={t('agent.trace.raw')} />
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-[920px] py-space-lg">
            <div className="px-space-xl">
              <ErrorBanner message={viewModel.errorMessage} />
            </div>
            <DetailSection title={t('agent.logDetail.sections.transcript')}>
              <Transcript messages={viewModel.transcript} />
            </DetailSection>
            <DetailSection title={t('agent.logDetail.sections.inputs')}>
              <InputsSummary
                inputs={viewModel.inputs}
                files={viewModel.files}
              />
            </DetailSection>
            <DetailSection title={t('agent.logDetail.sections.latestOutput')}>
              <LatestOutput output={viewModel.latestOutput} />
            </DetailSection>
            <DetailSection title={t('agent.trace.trace')}>
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
