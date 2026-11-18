import type { ReactNode } from 'react'

interface SectionHeaderProps {
  icon: ReactNode
  title: string
  description?: string
  badge?: ReactNode
}

export function SectionHeader({
  icon,
  title,
  description,
  badge,
}: SectionHeaderProps) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-space-base">
      <div className="flex min-w-0 items-start gap-space-sm">
        <span className="mt-space-xs flex size-icon-xl shrink-0 items-center justify-center rounded-radius-md bg-accent-soft text-accent-fg">
          {icon}
        </span>
        <div className="min-w-0 space-y-space-xs">
          <h4 className="text-base leading-6 font-semibold text-fg">{title}</h4>
          {description ? (
            <p className="text-sm leading-6 text-fg-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  )
}
