import React from 'react'
import { cn } from '@/lib/utils'

interface SvgIconProps {
  src: string
  width?: string | number
  height?: string | number
  className?: string
  alt?: string
}

/**
 * SVG 图标组件
 * 
 * @example
 * import s3Icon from '@/assets/svg/data-source/s3.svg'
 * <SvgIcon src={s3Icon} width={24} height={24} />
 */
const SvgIcon: React.FC<SvgIconProps> = ({
  src,
  width = 24,
  height = 24,
  className = '',
  alt = 'icon',
}) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('inline-block', className)}
    />
  )
}

export default SvgIcon
