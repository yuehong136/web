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
    <div className="gap-space-base flex min-w-0 items-start justify-between">
      <div className="gap-space-sm flex min-w-0 items-start">
        <span className="rounded-radius-md mt-space-xs flex size-icon-xl shrink-0 items-center justify-center bg-components-system-accent-soft text-components-system-accent-text">
          {icon}
        </span>
        <div className="space-y-space-xs min-w-0">
          <h4 className="text-base font-semibold leading-6 text-text-primary">
            {title}
          </h4>
          {description ? (
            <p className="text-sm leading-6 text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  )
}
