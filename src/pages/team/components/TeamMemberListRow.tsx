/**
 * 团队成员列表行组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TeamMemberActionsMenu } from './team-member-actions-menu'
import { TenantRole, type TeamMember, type TeamPermissions } from '@/types/team'
import type { TimeFormat } from '@/stores/team'
import { formatTeamTime } from '../utils'
import { EntityAvatar } from '@/components/patterns/entity-avatar'

interface TeamMemberListRowProps {
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

export const TeamMemberListRow: React.FC<TeamMemberListRowProps> = ({
  member,
  currentUserId,
  permissions,
  onRemove,
  onChangeRole,
  timeFormat = 'detailed',
}) => {
  const isSelf = member.user_id === currentUserId
  const canRemove =
    permissions.canRemove && member.role !== TenantRole.Owner && !isSelf
  const canChangeRole =
    permissions.canChangeRole &&
    member.role !== TenantRole.Owner &&
    member.role !== TenantRole.Invite &&
    !isSelf
  const hasActions = canRemove || canChangeRole

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[2fr_1fr_1fr_120px_60px] items-center gap-4',
        'h-[68px] rounded-xl px-4',
        'border border-transparent',
        'transition-all duration-200 ease-out',
        'hover:border-state-focus hover:bg-surface-secondary/60 hover:shadow-xs',
      )}
    >
      {/* 成员信息列 */}
      <div className="flex min-w-0 items-center gap-4">
        <EntityAvatar
          name={member.nickname || member.email}
          src={member.avatar}
          seed={member.user_id}
          size="lg"
          shape="circle"
          className="transition-transform duration-200 group-hover:scale-105"
        />

        <div className="flex h-11 min-w-0 flex-1 flex-col justify-center">
          <h3
            className="truncate font-medium text-text-primary transition-colors duration-200 group-hover:text-text-accent"
            title={member.nickname}
          >
            {member.nickname || '未命名用户'}
            {isSelf && (
              <span className="ml-1 text-xs font-normal text-text-tertiary">
                （我）
              </span>
            )}
          </h3>
          <p
            className="truncate text-sm text-text-tertiary"
            title={member.email}
          >
            {member.email}
          </p>
        </div>
      </div>

      {/* 角色列 */}
      <div className="flex items-center">
        <RoleBadge role={member.role} />
      </div>

      {/* 邮箱列 */}
      <div
        className="truncate text-sm text-text-secondary"
        title={member.email}
      >
        {member.email}
      </div>

      {/* 更新时间列 */}
      <div className="text-sm text-text-tertiary">
        {formatTeamTime(member.update_date, member.delta_seconds, timeFormat)}
      </div>

      {/* 操作列 */}
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        {hasActions && (
          <TeamMemberActionsMenu
            member={member}
            canChangeRole={canChangeRole}
            canRemove={canRemove}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        )}
      </div>
    </div>
  )
}

TeamMemberListRow.displayName = 'TeamMemberListRow'
