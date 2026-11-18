import { cn } from '@/lib/utils'
import type { PropsWithChildren } from 'react'
import { forwardRef, useContext, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AgentInstanceContext } from '../../context'

export type NodeRuntimeStatus = 'idle' | 'running' | 'success' | 'error'

interface NodeWrapperProps extends PropsWithChildren {
  selected?: boolean
  className?: string
  id?: string
}

const formatElapsed = (seconds?: number) => {
  if (typeof seconds !== 'number' || seconds <= 0) {
    return undefined
  }
  if (seconds < 1) {
    return `${Math.round(seconds * 1000)}ms`
  }
  if (seconds < 60) {
    return `${seconds.toFixed(seconds >= 10 ? 1 : 2)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remaining = Math.round(seconds - minutes * 60)
  return `${minutes}m${remaining}s`
}

// Running is the AI moment of the canvas: the tide ring (and a breathing
// glow from overrides.css unless motion is reduced). Finished nodes keep a
// hairline status border and a dot; colour is never the only signal.
const STATUS_FRAME: Record<NodeRuntimeStatus, string> = {
  idle: '',
  running: 'ai-glow canvas-node-running',
  success: 'border-success-line',
  error: 'border-danger-line',
}

const STATUS_DOT: Record<Exclude<NodeRuntimeStatus, 'idle'>, string> = {
  running: 'bg-ai-tide motion-safe:animate-pulse',
  success: 'bg-success-fg',
  error: 'bg-danger-fg',
}

const STATUS_LABEL = {
  running: 'agent.canvas.status.running',
  success: 'agent.canvas.status.success',
  error: 'agent.canvas.status.error',
} as const

export const NodeWrapper = forwardRef<HTMLDivElement, NodeWrapperProps>(
  ({ children, selected, className, id }, ref) => {
    const { t } = useTranslation()
    const {
      currentSendLoading,
      startButNotFinishedNodeIds = [],
      successNodeIds = [],
      errorNodeIds = [],
      nodeElapsedMap = {},
    } = useContext(AgentInstanceContext)

    const status = useMemo<NodeRuntimeStatus>(() => {
      if (!id) return 'idle'
      if (currentSendLoading && startButNotFinishedNodeIds.includes(id)) {
        return 'running'
      }
      if (errorNodeIds.includes(id)) return 'error'
      if (successNodeIds.includes(id)) return 'success'
      return 'idle'
    }, [
      currentSendLoading,
      errorNodeIds,
      id,
      startButNotFinishedNodeIds,
      successNodeIds,
    ])

    const elapsedLabel = useMemo(() => {
      if (!id || (status !== 'success' && status !== 'error')) {
        return undefined
      }
      return formatElapsed(nodeElapsedMap[id])
    }, [id, nodeElapsedMap, status])

    const statusLabel = status === 'idle' ? undefined : t(STATUS_LABEL[status])

    return (
      <div
        ref={ref}
        data-status={status}
        className={cn(
          'group relative w-[208px] rounded-radius-lg border border-line bg-raised px-space-base py-space-base text-xs shadow-elevation-low transition-[border-color,box-shadow,outline-color] hover:shadow-elevation-medium motion-reduce:transition-none',
          !selected && STATUS_FRAME[status],
          selected &&
            'border-line-focus outline-2 -outline-offset-1 outline-line-focus',
          selected && status === 'running' && 'canvas-node-running ai-glow',
          className,
        )}
      >
        {status !== 'idle' && (
          <span
            data-slot="node-status"
            title={statusLabel}
            className={cn(
              'pointer-events-none absolute top-space-xs right-space-xs flex items-center gap-space-xs text-xs leading-none tabular-nums',
              status === 'error' ? 'text-danger-fg' : 'text-fg-subtle',
            )}
          >
            {elapsedLabel}
            <span
              aria-hidden
              className={cn(
                'size-1.5 shrink-0 rounded-radius-full',
                STATUS_DOT[status],
              )}
            />
            <span className="sr-only">{statusLabel}</span>
          </span>
        )}
        {children}
      </div>
    )
  },
)

NodeWrapper.displayName = 'NodeWrapper'
