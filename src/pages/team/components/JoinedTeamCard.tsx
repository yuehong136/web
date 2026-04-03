/**
 * 已加入团队卡片组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, Mail, Clock, Check, X, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type JoinedTeam } from '@/types/team'
import type { TimeFormat } from '@/stores/team'
import { formatTeamTime } from '../utils'

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
  const isManager = team.role === TenantRole.Owner || team.role === TenantRole.Admin
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-200',
        'hover:shadow-shadow-md hover:-translate-y-0.5',
        isPending ? 'ring-2 ring-state-info/20' : isHovered && 'ring-2 ring-state-focus/20'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isPending
          ? 'var(--color-state-info)'
          : isHovered
            ? 'var(--color-state-focus)'
            : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        {/* 头部：头像 + 团队名称 + 角色 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={team.avatar || undefined} alt={team.nickname} />
              <AvatarFallback className="bg-[var(--color-state-success-subtle)]">
                <Users className="h-5 w-5" style={{ color: 'var(--color-state-success)' }} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold truncate"
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
        <div className="space-y-2 text-sm mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate" title={team.email}>
              {team.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{formatTeamTime(team.update_date, team.delta_seconds, timeFormat)}</span>
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
                <Check className="h-4 w-4 mr-1" />
                接受
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject?.(team.tenant_id)}
                disabled={isLoading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
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
              className="w-full text-state-error border-state-error/30 hover:bg-state-error-subtle hover:border-state-error/50"
            >
              <LogOut className="h-4 w-4 mr-1" />
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
              <Settings className="h-4 w-4 mr-1" />
              管理团队
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

JoinedTeamCard.displayName = 'JoinedTeamCard'
