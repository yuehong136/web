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
        'flex flex-col gap-space-xs rounded-radius-lg border border-border-subtle bg-background-subtle px-space-base py-space-base',
        className,
      )}
      {...props}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      <div className="text-sm font-medium text-text-primary">
        {value || '-'}
      </div>
      {hint ? <p className="text-xs text-text-secondary">{hint}</p> : null}
    </div>
  )
}
