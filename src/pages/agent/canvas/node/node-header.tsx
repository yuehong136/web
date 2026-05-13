import { cn } from '@/lib/utils'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Operator } from '../../constant'
import OperatorIcon from '../../operator-icon'
import { getNodeDisplayName } from './node-display'

interface NodeHeaderProps {
  id: string
  name: string
  label: string
  icon?: React.ReactNode
  className?: string
  wrapperClassName?: string
  wrapperStyle?: React.CSSProperties
}

const NodeHeader = ({
  name,
  label,
  icon,
  className,
  wrapperClassName,
  wrapperStyle,
}: NodeHeaderProps) => {
  const { t } = useTranslation()
  const displayName = getNodeDisplayName(t, label, name)

  return (
    <section
      className={cn(wrapperClassName, 'pb-space-base')}
      style={wrapperStyle}
    >
      <div className={cn(className, 'gap-space-sm flex items-center')}>
        {icon || <OperatorIcon name={label as Operator} />}
        <span className="truncate text-sm font-semibold leading-none text-text-primary">
          {displayName}
        </span>
      </div>
    </section>
  )
}

export default memo(NodeHeader)
