import { Panel, type NodeProps, type PanelPosition } from '@xyflow/react'
import { type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type GroupNodeLabelProps = ComponentProps<'div'>

export function GroupNodeLabel({
  children,
  className,
  ...props
}: GroupNodeLabelProps) {
  return (
    <div className="h-full w-full" {...props}>
      <div
        className={cn(
          'bg-surface-secondary text-text-primary w-fit px-space-sm py-space-xs text-xs',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export type GroupNodeProps = Partial<NodeProps> & {
  label?: ReactNode
  position?: PanelPosition
  className?: string
  style?: React.CSSProperties
}

export function LabeledGroupNode({
  label,
  position,
  data,
  selected,
  className,
  style,
}: GroupNodeProps) {
  const getLabelClassName = (pos?: PanelPosition) => {
    switch (pos) {
      case 'top-left':
        return 'rounded-br-sm'
      case 'top-center':
        return 'rounded-b-sm'
      case 'top-right':
        return 'rounded-bl-sm'
      case 'bottom-left':
        return 'rounded-tr-sm'
      case 'bottom-right':
        return 'rounded-tl-sm'
      case 'bottom-center':
        return 'rounded-t-sm'
      default:
        return 'rounded-br-sm'
    }
  }

  const displayLabel = label ?? data?.name ?? data?.label
  const labelText = typeof displayLabel === 'string' ? displayLabel : String(displayLabel || '')

  return (
    <div
      className={cn(
        'h-full w-full rounded-radius-sm border border-border-primary bg-surface-secondary opacity-70',
        selected && 'border-border-accent',
        className,
      )}
      style={style}
    >
      {labelText && (
        <Panel className="m-0 p-0" position={position}>
          <GroupNodeLabel className={getLabelClassName(position)}>
            {labelText}
          </GroupNodeLabel>
        </Panel>
      )}
    </div>
  )
}
