import { useState, type FC } from 'react'
import { cn } from '@/lib/utils'

const PREDEFINED_GRADIENTS = [
  'from-components-avatar-gradient-purple-from to-components-avatar-gradient-purple-to',
  'from-components-avatar-gradient-blue-from to-components-avatar-gradient-blue-to',
  'from-components-avatar-gradient-green-from to-components-avatar-gradient-green-to',
  'from-components-avatar-gradient-orange-from to-components-avatar-gradient-orange-to',
  'from-components-avatar-gradient-indigo-from to-components-avatar-gradient-indigo-to',
]

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

const getGradientForName = (name: string): string => {
  const hash = getStringHash(name)
  const index = hash % PREDEFINED_GRADIENTS.length
  return PREDEFINED_GRADIENTS[index]
}

const getInitials = (name?: string): string => {
  if (typeof name !== 'string' || !name) return ''
  const parts = name.trim().split(/\s+/)
  return parts[0][0].toUpperCase()
}

export interface KnowledgeBaseAvatarProps {
  name: string
  avatar?: string | null
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: 'w-4 h-4 text-[9px]',
  md: 'w-5 h-5 text-[11px]',
  lg: 'w-8 h-8 text-sm',
  xl: 'w-10 h-10 text-base',
}

export const KnowledgeBaseAvatar: FC<KnowledgeBaseAvatarProps> = ({
  name,
  avatar,
  className,
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false)
  const initials = getInitials(name)
  const gradientClass = name
    ? getGradientForName(name)
    : PREDEFINED_GRADIENTS[0]
  const sizeClass = sizeMap[size]

  if (avatar && !imgError) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-md',
          sizeClass,
          className,
        )}
      >
        <img
          src={avatar}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br font-medium text-white',
        gradientClass,
        sizeClass,
        className,
      )}
    >
      {initials}
    </div>
  )
}
