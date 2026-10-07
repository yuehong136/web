/**
 * 已加入团队卡片组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Button } from '@/components/ui/button'
import { Mail, Clock, Check, X, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type JoinedTeam } from '@/types/team'
import type { TimeFormat } from '@/stores/team'
import { formatTeamTime } from '../utils'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface JoinedTeamCardProps {
  team: JoinedTeam
  onAccept?: (tenantId: string) => void
  onReject?: (tenantId: string) => void
  onLeave?: (tenantId: string, nickname: string) => void
  onManageTeam?: (tenantId: string) => void
  timeFormat?: TimeFormat
  isLoading?: boolean
}

export const JoinedTeamCard: React.FC<JoinedTeamCardProps> = ({
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
        'group relative rounded-2xl border bg-components-card-bg transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-elevation-medium',
        isPending
          ? 'border-status-info-border ring-2 ring-status-info-subtle'
          : 'border-components-card-border hover:border-state-focus hover:ring-2 hover:ring-state-focus/20',
      )}
    >
      <div className="p-5">
        {/* 头部：头像 + 团队名称 + 角色 */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <EntityAvatar
              name={team.nickname || team.email}
              src={team.avatar}
              seed={team.tenant_id}
              size="xl"
              shape="circle"
            />
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
                title={team.nickname}
              >
                {team.nickname || '未命名团队'}
              </h3>
              <RoleBadge role={team.role} className="mt-1" />
            </div>
          </div>
        </div>

        {/* 团队信息 */}
        <div
          className="mb-4 space-y-2 text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate" title={team.email}>
              {team.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {formatTeamTime(team.update_date, team.delta_seconds, timeFormat)}
            </span>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {isPending && (
            <>
              <Button
                size="sm"
                onClick={() => onAccept?.(team.tenant_id)}
                disabled={isLoading}
                className="flex-1"
              >
                <Check className="mr-1 h-4 w-4" />
                接受
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.(team.tenant_id)}
                disabled={isLoading}
                className="flex-1"
              >
                <X className="mr-1 h-4 w-4" />
                拒绝
              </Button>
            </>
          )}
          {isNormal && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onLeave?.(team.tenant_id, team.nickname)}
              disabled={isLoading}
              className="w-full border-status-error-border text-status-error hover:border-status-error hover:bg-status-error-subtle"
            >
              <LogOut className="mr-1 h-4 w-4" />
              退出团队
            </Button>
          )}
          {isManager && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onManageTeam?.(team.tenant_id)}
              className="w-full"
            >
              <Settings className="mr-1 h-4 w-4" />
              管理团队
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

JoinedTeamCard.displayName = 'JoinedTeamCard'
