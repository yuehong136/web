import { IconFontFill } from '@/components/ui/icon-font'
import { cn } from '@/lib/utils'
import { HousePlus } from 'lucide-react'
import { Component, type ReactNode } from 'react'
import { Operator } from './constant'
import { LucideIconMap, OperatorIconFontMap } from './operator-icon.constants'

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

const OperatorIcon = ({ name, className }: IProps) => {
  const iconFontName =
    OperatorIconFontMap[name as keyof typeof OperatorIconFontMap]
  const LucideIcon = LucideIconMap[name as keyof typeof LucideIconMap]

  // Begin 节点特殊样式
  if (name === Operator.Begin) {
    return (
      <div
        className={cn(
          'bg-surface-accent rounded-radius-sm inline-flex items-center justify-center p-1',
          className,
        )}
      >
        <HousePlus className="text-text-on-accent size-3" />
      </div>
    )
  }

  // 优先使用 IconFont（如果存在）
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

  // 使用 Lucide 图标
  if (LucideIcon) {
    return (
      <IconErrorBoundary fallback={<Empty />}>
        <LucideIcon className={cn('size-5', className)} />
      </IconErrorBoundary>
    )
  }

  return <Empty />
}

export default OperatorIcon
