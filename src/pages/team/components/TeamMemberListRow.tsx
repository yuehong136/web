/**
 * 团队成员列表行组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import {
  MoreVertical,
  Trash2,
  User,
  ShieldPlus,
  ShieldMinus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type TeamMember, type TeamPermissions } from '@/types/team'
import type { TimeFormat } from '@/stores/team'
import { formatTeamTime } from '../utils'

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
        'hover:bg-surface-secondary/60 hover:border-state-focus hover:shadow-sm',
      )}
    >
      {/* 成员信息列 */}
      <div className="flex min-w-0 items-center gap-4">
        <Avatar className="h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={member.avatar || undefined} alt={member.nickname} />
          <AvatarFallback className="bg-status-info-subtle">
            <User className="h-5 w-5 text-status-info" />
          </AvatarFallback>
        </Avatar>

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
          <Dropdown
            trigger={
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          >
            {canChangeRole &&
              member.role === TenantRole.Normal &&
              onChangeRole && (
                <DropdownItem
                  icon={<ShieldPlus className="h-4 w-4" />}
                  onClick={() =>
                    onChangeRole(member.user_id, member.nickname, member.role)
                  }
                >
                  设为管理员
                </DropdownItem>
              )}
            {canChangeRole &&
              member.role === TenantRole.Admin &&
              onChangeRole && (
                <DropdownItem
                  icon={<ShieldMinus className="h-4 w-4" />}
                  onClick={() =>
                    onChangeRole(member.user_id, member.nickname, member.role)
                  }
                >
                  取消管理员
                </DropdownItem>
              )}
            {canRemove && onRemove && (
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => onRemove(member.user_id, member.nickname)}
                danger
              >
                {member.role === TenantRole.Invite ? '撤销邀请' : '移除成员'}
              </DropdownItem>
            )}
          </Dropdown>
        )}
      </div>
    </div>
  )
}

TeamMemberListRow.displayName = 'TeamMemberListRow'
