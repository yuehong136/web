import React, { useState } from 'react'
import { cn } from '@/lib/utils'

// ============================================================================
// 知识库头像组件 - 参考 ragflow 的 RAGFlowAvatar
// 支持首字母渐变头像和图片头像
// ============================================================================

// 预定义的渐变色
const PREDEFINED_COLORS = [
  { from: '#4F6DEE', to: '#67BDF9' },
  { from: '#38A04D', to: '#93DCA2' },
  { from: '#C35F2B', to: '#EDB395' },
  { from: '#633897', to: '#CBA1FF' },
]

// 根据字符串生成哈希值
const getStringHash = (str: string): number => {
  if (typeof str !== 'string') return 0
  const normalized = str.trim().toLowerCase()
  let hash = 104729
  const seed = 0x9747b28c

  for (let i = 0; i < normalized.length; i++) {
    hash ^= seed ^ normalized.charCodeAt(i)
    hash = (hash << 13) | (hash >>> 19)
    hash = (hash * 5 + 0x52dce72d) | 0
  }

  return Math.abs(hash)
}

// 根据名称获取颜色
const getColorForName = (name: string): { from: string; to: string } => {
  const hash = getStringHash(name)
  const index = hash % PREDEFINED_COLORS.length
  return PREDEFINED_COLORS[index]
}

// 获取首字母
const getInitials = (name?: string): string => {
  if (typeof name !== 'string' || !name) return ''
  const parts = name.trim().split(/\s+/)
  return parts[0][0].toUpperCase()
}

export interface KnowledgeBaseAvatarProps {
  /** 知识库名称 */
  name: string
  /** 头像图片 URL */
  avatar?: string | null
  /** 自定义类名 */
  className?: string
  /** 尺寸大小 */
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: 'w-4 h-4 text-[8px]',
  md: 'w-5 h-5 text-[10px]',
  lg: 'w-8 h-8 text-xs',
  xl: 'w-10 h-10 text-sm',
}

/**
 * 知识库头像组件
 * 支持图片头像和首字母渐变头像
 */
export const KnowledgeBaseAvatar: React.FC<KnowledgeBaseAvatarProps> = ({ 
  name, 
  avatar, 
  className,
  size = 'md'
}) => {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)
  const { from, to } = name
    ? getColorForName(name)
    : { from: 'hsl(0, 0%, 30%)', to: 'hsl(0, 0%, 80%)' }

  const sizeClass = sizeMap[size]

  // 如果有头像图片且没有加载错误，显示图片
  if (avatar && !imgError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-md overflow-hidden shrink-0',
          sizeClass,
          className
        )}
      >
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  // 否则显示首字母头像
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md text-white font-medium shrink-0',
        sizeClass,
        className
      )}
      style={{
        backgroundImage: `linear-gradient(to bottom, ${from}, ${to})`,
      }}
    >
      {initials}
    </div>
  )
}

export default KnowledgeBaseAvatar
