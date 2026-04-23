import { cn } from '@/lib/utils'
import type { NodeProps } from '@xyflow/react'
import { NodeResizeControl, Position } from '@xyflow/react'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useShallow } from 'zustand/react/shallow'
import { NodeHandleId, Operator } from '../../constant'
import OperatorIcon from '../../operator-icon'
import {
  getIterationChildSize,
  getIterationContentChildren,
  ITERATION_MIN_SIZE,
} from '../../iteration-layout'
import useGraphStore from '../../store'
import { needsSingleStepDebugging, showCopyIcon } from '../../utils'
import type { IIterationNode, IIterationStartNode } from '../../types'
import { CommonHandle, LeftEndHandle } from './handle'
import { NodeWrapper } from './node-wrapper'
import { ResizeIcon, controlStyle } from './resize-icon'
import { ToolBar } from './toolbar'

const MIN_PADDING = 40

export function InnerIterationNode({
  id,
  data,
  isConnectable = true,
  selected,
}: NodeProps<IIterationNode>) {
  const { t } = useTranslation()

  // Narrow the store selector to this container's children so unrelated node
  // updates don't re-render every iteration node on the canvas.
  const children = useGraphStore(
    useShallow((s) => getIterationContentChildren(s.nodes, id)),
  )

  const hasUserChildren = children.length > 0

  const dynamicMin = useMemo(() => {
    if (children.length === 0) {
      return {
        width: ITERATION_MIN_SIZE.width,
        height: ITERATION_MIN_SIZE.height,
      }
    }

    const maxRight = Math.max(
      ...children.map((child) => {
        const size = getIterationChildSize(child)
        return child.position.x + size.width
      }),
    )
    const maxBottom = Math.max(
      ...children.map((child) => {
        const size = getIterationChildSize(child)
        return child.position.y + size.height
      }),
    )
    return {
      width: Math.max(ITERATION_MIN_SIZE.width, maxRight + MIN_PADDING),
      height: Math.max(ITERATION_MIN_SIZE.height, maxBottom + MIN_PADDING),
    }
  }, [children])

  return (
    <ToolBar
      selected={selected}
      id={id}
      label={data.label}
      showRun={needsSingleStepDebugging(data.label)}
      showCopy={showCopyIcon(data.label)}
      className="h-full w-full"
    >
      <section
        className={cn(
          'group relative h-full w-full rounded-radius-lg border border-dashed border-border-primary transition-[border-color,outline-color]',
          'bg-gradient-to-br from-surface-secondary/40 via-transparent to-components-system-accent-soft/20',
        )}
        style={
          selected
            ? {
                borderStyle: 'solid',
                borderColor:
                  'var(--color-components-canvas-node-border-selected)',
                outline:
                  '2px solid var(--color-components-canvas-node-border-selected)',
                outlineOffset: '-1px',
              }
            : undefined
        }
      >
        <NodeResizeControl
          style={controlStyle}
          minWidth={dynamicMin.width}
          minHeight={dynamicMin.height}
        >
          <ResizeIcon />
        </NodeResizeControl>

        <LeftEndHandle nodeId={id} />
        <CommonHandle
          id={NodeHandleId.Start}
          type="source"
          position={Position.Right}
          isConnectable={isConnectable}
          nodeId={id}
        />

        <div
          className={cn(
            'absolute left-0 top-0 z-10 inline-flex max-w-[60%] items-center gap-space-xs rounded-bl-none rounded-br-radius-md rounded-tl-radius-lg rounded-tr-none bg-components-system-accent-soft px-space-sm py-1 text-components-system-accent-text shadow-elevation-low',
          )}
        >
          <OperatorIcon name={data.label as Operator} />
          <span className="truncate text-xs font-semibold leading-none">
            {data.name}
          </span>
        </div>

        {!hasUserChildren && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-space-xs rounded-radius-md border border-dashed border-border-subtle bg-surface-primary/40 px-space-md py-space-sm text-center">
              <span className="text-xs text-text-secondary">
                {t(
                  'flow.iterationEmptyHint',
                  '拖入节点到此区域，或从右侧面板添加子节点',
                )}
              </span>
              <span className="text-[10px] text-text-disabled">
                {t(
                  'flow.iterationEmptySubHint',
                  '左侧 Start 锚点会作为每轮迭代的入口',
                )}
              </span>
            </div>
          </div>
        )}
      </section>
    </ToolBar>
  )
}

export function InnerIterationStartNode({
  isConnectable = true,
  id,
  selected,
}: NodeProps<IIterationStartNode>) {
  return (
    <NodeWrapper
      className="!w-9 !rounded-full !p-0 flex size-9 items-center justify-center !bg-components-system-accent-soft !border-components-system-accent-text"
      selected={selected}
      id={id}
    >
      <CommonHandle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        isConnectableEnd={false}
        id={NodeHandleId.Start}
        nodeId={id}
      />
      <div className="flex items-center justify-center text-components-system-accent-text">
        <OperatorIcon name={Operator.Begin} />
      </div>
    </NodeWrapper>
  )
}

export const IterationStartNode = memo(InnerIterationStartNode)
export const IterationNode = memo(InnerIterationNode)
