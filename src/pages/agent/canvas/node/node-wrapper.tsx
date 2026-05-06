import { cn } from '@/lib/utils'
import { Check, Loader, X } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { forwardRef, useContext, useMemo } from 'react'
import { AgentInstanceContext } from '../../context'

type NodeRuntimeStatus = 'idle' | 'running' | 'success' | 'error'

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

export const NodeWrapper = forwardRef<HTMLDivElement, NodeWrapperProps>(
  ({ children, selected, className, id }, ref) => {
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

    return (
      <div
        ref={ref}
        className={cn(
          'group relative w-[208px] rounded-radius-lg border border-components-canvas-node-border bg-components-canvas-node-bg px-space-base py-space-base text-xs shadow-elevation-low transition-[border-color,box-shadow,outline-color]',
          status === 'running' && 'canvas-node-running',
          status === 'success' && !selected && 'canvas-node-success',
          status === 'error' && !selected && 'canvas-node-error',
          className,
        )}
        style={
          selected
            ? {
                borderColor: 'var(--color-components-canvas-node-border-selected)',
                outline: '2px solid var(--color-components-canvas-node-border-selected)',
                outlineOffset: '-1px',
              }
            : undefined
        }
      >
        {status === 'running' && (
          <div className="absolute right-0 top-0 flex items-center justify-end p-space-xs">
            <Loader
              size={12}
              className="animate-spin text-components-canvas-node-status-running-icon"
            />
          </div>
        )}
        {status === 'success' && (
          <div className="absolute right-0 top-0 flex items-center gap-space-xs p-space-xs">
            {elapsedLabel && (
              <span className="rounded-radius-sm bg-components-canvas-node-status-success-bg px-space-xs text-xs leading-tight text-components-canvas-node-status-success-text">
                {elapsedLabel}
              </span>
            )}
            <Check
              size={12}
              className="text-components-canvas-node-status-success-border"
            />
          </div>
        )}
        {status === 'error' && (
          <div className="absolute right-0 top-0 flex items-center gap-space-xs p-space-xs">
            {elapsedLabel && (
              <span className="rounded-radius-sm bg-components-canvas-node-status-error-bg px-space-xs text-xs leading-tight text-components-canvas-node-status-error-text">
                {elapsedLabel}
              </span>
            )}
            <X
              size={12}
              className="text-components-canvas-node-status-error-border"
            />
          </div>
        )}
        {children}
      </div>
    )
  },
)

NodeWrapper.displayName = 'NodeWrapper'
