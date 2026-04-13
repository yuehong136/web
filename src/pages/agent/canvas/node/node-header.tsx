import { cn } from '@/lib/utils'
import { memo } from 'react'
import { Operator } from '../../constant'
import OperatorIcon from '../../operator-icon'

interface NodeHeaderProps {
  id: string
  name: string
  label: string
  icon?: React.ReactNode
  className?: string
  wrapperClassName?: string
}

const NodeHeader = ({ name, label, icon, className, wrapperClassName }: NodeHeaderProps) => {
  return (
    <section className={cn(wrapperClassName, 'pb-space-base')}>
      <div className={cn(className, 'flex items-center gap-space-sm')}>
        {icon || <OperatorIcon name={label as Operator} />}
        <span className="truncate text-sm font-semibold leading-none text-text-primary">
          {name}
        </span>
      </div>
    </section>
  )
}

export default memo(NodeHeader)
