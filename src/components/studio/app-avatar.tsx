import { useState } from 'react'
import { AppWindow } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppAvatar({
  name,
  icon,
  className,
}: {
  name: string
  icon?: string
  className?: string
}) {
  const [failed, setFailed] = useState<string | undefined>()
  const source =
    icon &&
    (icon.startsWith('data:') || /^https?:\/\//i.test(icon)
      ? icon
      : `data:image/png;base64,${icon}`)
  return (
    <span
      className={cn(
        'flex size-icon-2xl shrink-0 items-center justify-center overflow-hidden rounded-radius-lg border border-border-subtle bg-background-subtle text-text-secondary',
        className,
      )}
    >
      {source && source !== failed ? (
        <img
          src={source}
          alt=""
          className="size-full object-cover"
          onError={() => setFailed(source)}
        />
      ) : (
        <AppWindow className="size-icon-md" aria-hidden="true" />
      )}
      <span className="sr-only">{name}</span>
    </span>
  )
}
