import React from 'react'
import { cn } from '@/lib/utils'

interface ProfileFieldRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
}

export const ProfileFieldRow: React.FC<ProfileFieldRowProps> = ({
  label,
  value,
  hint,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'grid gap-space-xs py-space-base sm:grid-cols-[10rem_minmax(0,1fr)] sm:items-start sm:gap-space-lg',
        className,
      )}
      {...props}
    >
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="min-w-0 text-sm text-text-primary">
        {value || '-'}
        {hint ? (
          <p className="mt-space-xs text-xs text-text-secondary">{hint}</p>
        ) : null}
      </dd>
    </div>
  )
}
