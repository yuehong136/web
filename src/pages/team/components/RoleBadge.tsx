/**
 * 角色徽章组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Crown, UserCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TenantRole } from '@/types/team'

interface RoleBadgeProps {
  role: TenantRole
  className?: string
}

const roleConfig = {
  [TenantRole.Owner]: {
    label: '所有者',
    icon: Crown,
    className: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning-text)]',
  },
  [TenantRole.Normal]: {
    label: '成员',
    icon: UserCheck,
    className: 'bg-[var(--color-background-subtle)] text-[var(--color-text-secondary)]',
  },
  [TenantRole.Invite]: {
    label: '待接受',
    icon: Clock,
    className: 'bg-[var(--color-components-badge-blue-bg)] text-[var(--color-components-badge-blue-text)]',
  },
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, className }) => {
  const config = roleConfig[role] || roleConfig[TenantRole.Normal]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  )
}

RoleBadge.displayName = 'RoleBadge'
