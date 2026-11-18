import { cn } from '@/lib/utils'
import { memo } from 'react'
import { OperatorTile } from '../../operator-icon'

interface NodeHeaderProps {
  id: string
  name: string
  label: string
  /** Glyph inside the operator tile; defaults to the operator's own. */
  icon?: React.ReactNode
  className?: string
  wrapperClassName?: string
  wrapperStyle?: React.CSSProperties
}

// The tile is 20px tall like the icon it replaced: categorize, switch and
// agent nodes place their handles at fixed offsets below the header.
const NodeHeader = ({
  name,
  label,
  icon,
  className,
  wrapperClassName,
  wrapperStyle,
}: NodeHeaderProps) => (
  <section
    className={cn(wrapperClassName, 'pb-space-base')}
    style={wrapperStyle}
  >
    <div className={cn(className, 'flex items-center gap-space-sm')}>
      <OperatorTile name={label} icon={icon} />
      <span
        className="truncate text-sm leading-none font-semibold text-fg"
        title={name}
      >
        {name}
      </span>
    </div>
  </section>
)

export default memo(NodeHeader)
