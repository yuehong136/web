import { cn } from '@/lib/utils'
import { CSSProperties } from 'react'

interface IconFontProps {
  name: string
  className?: string
  style?: CSSProperties
}

/**
 * 基础 IconFont 组件
 * 通过 iconfont.js 中定义的 symbol 名称渲染图标
 */
export const IconFont = ({ name, className, style }: IconFontProps) => (
  <svg className={cn('size-4', className)} style={style}>
    <use xlinkHref={`#icon-${name}`} />
  </svg>
)

interface IconFontFillProps extends IconFontProps {
  isFill?: boolean
}

/**
 * 带 fill 属性的 IconFont 组件
 * isFill=true 时使用 currentColor 填充，图标颜色跟随文字颜色
 */
export function IconFontFill({
  name,
  className,
  isFill = true,
}: IconFontFillProps) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)}>
      <svg
        className={cn('size-full', className)}
        style={{ fill: isFill ? 'currentColor' : '' }}
      >
        <use xlinkHref={`#icon-${name}`} />
      </svg>
    </span>
  )
}

