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
  const isManager = team.role === TenantRole.Owner || team.role === TenantRole.Admin

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[2fr_1fr_1fr_120px_100px] items-center gap-4',
        'px-4 h-[68px] rounded-xl',
        'border border-transparent',
        'transition-all duration-200 ease-out',
        'hover:bg-surface-secondary/60 hover:border-state-focus hover:shadow-sm',
        isPending && 'bg-state-info-subtle/30'
      )}
    >
      {/* 团队信息列 */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={team.avatar || undefined} alt={team.nickname} />
          <AvatarFallback className="bg-state-success-subtle">
            <Users className="h-5 w-5 text-state-success" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 h-11 flex flex-col justify-center">
          <h3
            className="font-medium text-text-primary truncate group-hover:text-text-accent transition-colors duration-200"
            title={team.nickname}
          >
            {team.nickname || '未命名团队'}
          </h3>
          <p className="text-sm text-text-tertiary truncate" title={team.email}>
            {team.email}
          </p>
        </div>
      </div>

      {/* 角色列 */}
      <div className="flex items-center">
        <RoleBadge role={team.role} />
      </div>

      {/* 邮箱列 */}
      <div className="text-sm text-text-secondary truncate" title={team.email}>
        {team.email}
      </div>

      {/* 更新时间列 */}
      <div className="text-sm text-text-tertiary">
        {formatTeamTime(team.update_date, team.delta_seconds, timeFormat)}
      </div>

      {/* 操作列 */}
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {isPending && (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onAccept?.(team.tenant_id)}
              disabled={isLoading}
              className="text-state-success hover:bg-state-success-subtle"
              title="接受邀请"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onReject?.(team.tenant_id)}
              disabled={isLoading}
              className="text-text-tertiary hover:text-state-error hover:bg-state-error-subtle"
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
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-state-error hover:bg-state-error-subtle transition-all"
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
            className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-text-accent hover:bg-surface-secondary transition-all"
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
