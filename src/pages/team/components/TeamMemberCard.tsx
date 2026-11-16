/**
 * 团队成员卡片组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Mail, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TeamMemberActionsMenu } from './team-member-actions-menu'
import { TenantRole, type TeamMember, type TeamPermissions } from '@/types/team'
import type { TimeFormat } from '@/stores/team'
import { formatTeamTime } from '../utils'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface TeamMemberCardProps {
  member: TeamMember
  currentUserId?: string
  permissions: TeamPermissions
  onRemove?: (userId: string, nickname: string) => void
  onChangeRole?: (
    userId: string,
    nickname: string,
    currentRole: TenantRole,
  ) => void
  timeFormat?: TimeFormat
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  currentUserId,
  permissions,
  onRemove,
  onChangeRole,
  timeFormat = 'detailed',
}) => {
  const isSelf = member.user_id === currentUserId
  // 不能对自己执行移除或角色变更操作
  const canRemove =
    permissions.canRemove && member.role !== TenantRole.Owner && !isSelf
  const canChangeRole =
    permissions.canChangeRole &&
    member.role !== TenantRole.Owner &&
    member.role !== TenantRole.Invite &&
    !isSelf
  const hasActions = canRemove || canChangeRole
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-200',
        'hover:-translate-y-0.5 hover:shadow-elevation-medium',
        isHovered && 'ring-2 ring-state-focus/20',
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered
          ? 'var(--color-state-focus)'
          : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        {/* 头部：头像 + 名称 + 角色 + 操作菜单 */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <EntityAvatar
              name={member.nickname || member.email}
              src={member.avatar}
              seed={member.user_id}
              size="xl"
              shape="circle"
            />
            <div className="min-w-0 flex-1">
              <h3
                className="truncate font-semibold"
                style={{ color: 'var(--color-text-primary)' }}
                title={member.nickname}
              >
                {member.nickname || '未命名用户'}
                {isSelf && (
                  <span className="ml-1 text-xs font-normal text-text-tertiary">
                    （我）
                  </span>
                )}
              </h3>
              <RoleBadge role={member.role} className="mt-1" />
            </div>
          </div>

          {/* 操作菜单 */}
          {hasActions && (
            <div onClick={(e) => e.stopPropagation()}>
              <TeamMemberActionsMenu
                member={member}
                canChangeRole={canChangeRole}
                canRemove={canRemove}
                onChangeRole={onChangeRole}
                onRemove={onRemove}
              />
            </div>
          )}
        </div>

        {/* 成员信息 */}
        <div
          className="space-y-2 text-sm"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate" title={member.email}>
              {member.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {formatTeamTime(
                member.update_date,
                member.delta_seconds,
                timeFormat,
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

TeamMemberCard.displayName = 'TeamMemberCard'
