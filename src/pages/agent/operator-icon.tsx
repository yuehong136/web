import { IconFontFill } from '@/components/ui/icon-font'
import { cn } from '@/lib/utils'
import { HousePlus } from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Operator } from './constant'
import {
  getOperatorCategory,
  LucideIconMap,
  OPERATOR_CATEGORY_TONE,
  OperatorIconFontMap,
} from './operator-icon.constants'

interface IProps {
  name: Operator | string
  className?: string
}

const Empty = () => {
  return <div className="hidden"></div>
}

class IconErrorBoundary extends Component<{
  children: ReactNode
  fallback?: ReactNode
}> {
  override state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  override render() {
    if (this.state.hasError) {
      return this.props.fallback || <Empty />
    }

    return this.props.children
  }
}

/** The operator's glyph alone: the icon font first, Lucide as fallback. */
function OperatorGlyph({ name, className }: IProps) {
  const iconFontName =
    OperatorIconFontMap[name as keyof typeof OperatorIconFontMap]
  const LucideIcon = LucideIconMap[name as keyof typeof LucideIconMap]

  if (iconFontName) {
    return (
      <IconErrorBoundary
        fallback={
          LucideIcon ? (
            <LucideIcon className={cn('size-5', className)} />
          ) : (
            <Empty />
          )
        }
      >
        <IconFontFill name={iconFontName} className={cn('size-5', className)} />
      </IconErrorBoundary>
    )
  }

  if (LucideIcon) {
    return (
      <IconErrorBoundary fallback={<Empty />}>
        <LucideIcon className={cn('size-5', className)} />
      </IconErrorBoundary>
    )
  }

  return <Empty />
}

const OperatorIcon = ({ name, className }: IProps) => {
  // Begin 节点特殊样式
  if (name === Operator.Begin) {
    return (
      <div
        className={cn(
          'inline-flex items-center justify-center rounded-radius-sm bg-surface-accent p-1',
          className,
        )}
      >
        <HousePlus className="size-3 text-text-on-accent" />
      </div>
    )
  }

  return <OperatorGlyph name={name} className={className} />
}

const TILE_SIZES = {
  // 20px keeps node headers at the height the fixed handle offsets assume.
  sm: {
    tile: 'size-5 rounded-radius-sm [&>svg]:size-icon-xs',
    icon: 'size-icon-xs',
  },
  md: {
    tile: 'size-7 rounded-radius-md [&>svg]:size-icon-sm',
    icon: 'size-icon-sm',
  },
  lg: {
    tile: 'size-9 rounded-radius-lg [&>svg]:size-icon-md',
    icon: 'size-icon-md',
  },
} as const

export type OperatorTileSize = keyof typeof TILE_SIZES

/**
 * The operator glyph on its family's tint (see `OPERATOR_CATEGORY_TONE`), so
 * an operator reads the same on the canvas, in menus, panels and run logs.
 * Decorative: the operator name is always shown next to it.
 */
export function OperatorTile({
  name,
  size = 'sm',
  icon,
  className,
}: IProps & {
  size?: OperatorTileSize
  /** Replaces the operator glyph, e.g. a node-specific icon. */
  icon?: ReactNode
}) {
  const category = getOperatorCategory(name)
  const spec = TILE_SIZES[size]
  return (
    <span
      aria-hidden
      data-slot="operator-tile"
      data-category={category}
      className={cn(
        'inline-flex shrink-0 items-center justify-center ring-1 ring-border-subtle ring-inset [&_svg]:shrink-0',
        OPERATOR_CATEGORY_TONE[category],
        spec.tile,
        className,
      )}
    >
      {icon ?? <OperatorGlyph name={name} className={spec.icon} />}
    </span>
  )
}

export default OperatorIcon
