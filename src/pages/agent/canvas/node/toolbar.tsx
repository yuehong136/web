import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Copy, Play, Trash2 } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import { memo, useCallback } from 'react'
import { Operator } from '../../constant'
import useGraphStore from '../../store'

interface ToolBarProps extends PropsWithChildren {
  selected?: boolean
  id: string
  label: string
  showRun?: boolean
  showCopy?: boolean
  className?: string
}

function IconWrapper({ className, ...props }: ButtonProps) {
  return (
    <Button
      variant="secondary"
      size="icon-sm"
      className={cn(
        'bg-surface-primary size-7 p-0 text-text-secondary hover:text-text-primary',
        className,
      )}
      {...props}
    />
  )
}

export const ToolBar = memo(
  ({
    children,
    selected,
    id,
    label,
    showRun,
    showCopy,
    className,
  }: ToolBarProps) => {
    const { deleteNodeById, deleteIterationNodeById, duplicateNode } =
      useGraphStore()

    const handleDelete = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        if (label === Operator.Iteration || label === Operator.Loop) {
          deleteIterationNodeById(id)
        } else {
          deleteNodeById(id)
        }
      },
      [deleteIterationNodeById, deleteNodeById, id, label],
    )

    const handleDuplicate = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        duplicateNode(id, label)
      },
      [duplicateNode, id, label],
    )

    const toolbarVisible = selected

    return (
      <div className={cn('group relative', className)}>
        {children}
        {label !== Operator.Begin && (
          <div
            className={cn(
              'gap-space-xs rounded-radius-md border-border-primary bg-surface-primary px-space-xs py-space-xs shadow-elevation-low absolute -top-10 left-1/2 flex -translate-x-1/2 items-center border transition-opacity',
              toolbarVisible
                ? 'pointer-events-auto opacity-100'
                : 'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100',
            )}
          >
            {showRun && (
              <IconWrapper title="调试节点">
                <Play className="size-3.5" data-play />
              </IconWrapper>
            )}
            {showCopy && (
              <IconWrapper onClick={handleDuplicate} title="复制节点">
                <Copy className="size-3.5" />
              </IconWrapper>
            )}
            <IconWrapper
              className="hover:text-status-error"
              onClick={handleDelete}
              title="删除节点"
            >
              <Trash2 className="size-3.5" />
            </IconWrapper>
          </div>
        )}
      </div>
    )
  },
)

ToolBar.displayName = 'ToolBar'
