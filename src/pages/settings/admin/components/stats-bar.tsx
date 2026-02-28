import React, { memo } from 'react'
import { Users, UserCheck, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminUser } from '../types'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number
  highlight?: boolean
}

const StatCard: React.FC<StatCardProps> = memo(({ icon, label, value, highlight }) => (
  <div
    className={cn(
      'flex items-center gap-space-md rounded-xl p-space-lg',
      highlight
        ? 'bg-background-subtle'
        : 'bg-background-surface'
    )}
  >
    <div
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0',
        highlight ? 'bg-state-success-subtle' : 'bg-background-default'
      )}
    >
      <span className={highlight ? 'text-text-success' : 'text-text-secondary'}>{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-3xl font-bold tabular-nums text-text-primary leading-none">{value}</p>
      <p className="mt-0.5 text-sm text-text-tertiary truncate">{label}</p>
    </div>
  </div>
))
StatCard.displayName = 'StatCard'

interface StatsBarProps {
  users: AdminUser[]
}

export const StatsBar: React.FC<StatsBarProps> = memo(({ users }) => {
  const total = users.length
  const active = users.filter(u => u.is_active).length
  const inactive = users.filter(u => !u.is_active).length

  return (
    <div className="grid grid-cols-3 gap-space-md">
      <StatCard
        icon={<Users className="h-5 w-5" />}
        label="总用户"
        value={total}
      />
      <StatCard
        icon={<UserCheck className="h-5 w-5" />}
        label="活跃用户"
        value={active}
        highlight={active > 0}
      />
      <StatCard
        icon={<UserX className="h-5 w-5" />}
        label="已停用"
        value={inactive}
      />
    </div>
  )
})
StatsBar.displayName = 'StatsBar'
