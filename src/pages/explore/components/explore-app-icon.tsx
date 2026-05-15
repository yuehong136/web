import { Sparkles } from 'lucide-react'
import type { DialogApp } from '@/types/api'

export const getExploreAppIcon = (
  app: Pick<DialogApp, 'icon' | 'name'> | null | undefined,
  size: 'sm' | 'md' = 'sm',
) => {
  const sizeClass = size === 'md' ? 'h-6 w-6' : 'h-4 w-4'

  if (app?.icon) {
    const iconSrc =
      app.icon.startsWith('data:') || app.icon.startsWith('http')
        ? app.icon
        : `data:image/png;base64,${app.icon}`

    return (
      <img
        src={iconSrc}
        alt={app.name}
        className={`${sizeClass} rounded object-cover`}
        onError={(event) => {
          event.currentTarget.style.display = 'none'
        }}
      />
    )
  }

  return (
    <Sparkles
      className={sizeClass}
      style={{ color: 'var(--color-components-button-primary-bg)' }}
    />
  )
}
