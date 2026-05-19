import { cn } from '@/lib/utils'

const AVATAR_CLASS_PALETTE = [
  'bg-state-focus-10 text-state-focus',
  'bg-state-success-10 text-state-success',
  'bg-state-warning-10 text-state-warning',
  'bg-state-error-10 text-state-error',
  'bg-state-neutral-10 text-text-secondary',
] as const

function getAvatarClassName(name: string): string {
  let hash = 0
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash)
  }
  return AVATAR_CLASS_PALETTE[Math.abs(hash) % AVATAR_CLASS_PALETTE.length]
}

function getInitials(name: string): string {
  if (!name) return 'G'
  if (name.toLowerCase() === 'naive') return 'G'
  return name.charAt(0).toUpperCase()
}

interface LogInitialsAvatarProps {
  name: string
  size?: 'sm' | 'md'
}

export function LogInitialsAvatar({
  name,
  size = 'sm',
}: LogInitialsAvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-medium',
        getAvatarClassName(name || 'default'),
        size === 'sm' ? 'h-5 w-5 text-xs' : 'h-6 w-6 text-sm',
      )}
    >
      {getInitials(name)}
    </div>
  )
}
