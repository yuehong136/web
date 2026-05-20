/**
 * 已加入团队列表行组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, Check, X, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type JoinedTeam } from '@/types/team'
import type { TimeFormat } from '@/stores/team'
import { formatTeamTime } from '../utils'

interface JoinedTeamListRowProps {
  team: JoinedTeam
  onAccept?: (tenantId: string) => void
  onReject?: (tenantId: string) => void
  onLeave?: (tenantId: string, nickname: string) => void
  onManageTeam?: (tenantId: string) => void
  timeFormat?: TimeFormat
  isLoading?: boolean
}

export const JoinedTeamListRow: React.FC<JoinedTeamListRowProps> = ({
  team,
  onAccept,
  onReject,
  onLeave,
  onManageTeam,
  timeFormat = 'detailed',
  isLoading = false,
}) => {
  const isPending = team.role === TenantRole.Invite
  const isNormal = team.role === TenantRole.Normal
  const isManager =
    team.role === TenantRole.Owner || team.role === TenantRole.Admin

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[2fr_1fr_1fr_120px_100px] items-center gap-4',
        'h-[68px] rounded-xl px-4',
        'border border-transparent',
        'transition-all duration-200 ease-out',
        'hover:bg-surface-secondary/60 hover:border-state-focus hover:shadow-sm',
        isPending && 'bg-status-info-subtle/30',
      )}
    >
      {/* 团队信息列 */}
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={team.avatar || undefined} alt={team.nickname} />
          <AvatarFallback className="bg-status-success-subtle">
            <Users className="h-5 w-5 text-status-success" />
          </AvatarFallback>
        </Avatar>

        <div className="flex h-11 min-w-0 flex-1 flex-col justify-center">
          <h3
            className="truncate font-medium text-text-primary transition-colors duration-200 group-hover:text-text-accent"
            title={team.nickname}
          >
            {team.nickname || '未命名团队'}
          </h3>
          <p className="truncate text-sm text-text-tertiary" title={team.email}>
            {team.email}
          </p>
        </div>
      </div>

      {/* 角色列 */}
      <div className="flex items-center">
        <RoleBadge role={team.role} />
      </div>

      {/* 邮箱列 */}
      <div className="truncate text-sm text-text-secondary" title={team.email}>
        {team.email}
      </div>

      {/* 更新时间列 */}
      <div className="text-sm text-text-tertiary">
        {formatTeamTime(team.update_date, team.delta_seconds, timeFormat)}
      </div>

      {/* 操作列 */}
      <div
        className="flex justify-end gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        {isPending && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onAccept?.(team.tenant_id)}
              disabled={isLoading}
              className="text-status-success hover:bg-status-success-subtle"
              title="接受邀请"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onReject?.(team.tenant_id)}
              disabled={isLoading}
              className="text-text-tertiary hover:bg-status-error-subtle hover:text-status-error"
              title="拒绝邀请"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
        {isNormal && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onLeave?.(team.tenant_id, team.nickname)}
            disabled={isLoading}
            className="text-text-tertiary opacity-0 transition-all group-hover:opacity-100 hover:bg-status-error-subtle hover:text-status-error"
            title="退出团队"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
        {isManager && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onManageTeam?.(team.tenant_id)}
            className="hover:bg-surface-secondary text-text-tertiary opacity-0 transition-all group-hover:opacity-100 hover:text-text-accent"
            title="管理团队"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

JoinedTeamListRow.displayName = 'JoinedTeamListRow'
