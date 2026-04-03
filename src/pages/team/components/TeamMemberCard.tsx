/**
 * 团队成员卡片组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { MoreVertical, Trash2, Mail, Clock, User, ShieldPlus, ShieldMinus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type TeamMember, type TeamPermissions } from '@/types/team'
import type { TimeFormat } from '@/stores/team'
import { formatTeamTime } from '../utils'

interface TeamMemberCardProps {
  member: TeamMember
  currentUserId?: string
  permissions: TeamPermissions
  onRemove?: (userId: string, nickname: string) => void
  onChangeRole?: (userId: string, nickname: string, currentRole: TenantRole) => void
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
  const canRemove = permissions.canRemove && member.role !== TenantRole.Owner && !isSelf
  const canChangeRole = permissions.canChangeRole && member.role !== TenantRole.Owner && member.role !== TenantRole.Invite && !isSelf
  const hasActions = canRemove || canChangeRole
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-200',
        'hover:shadow-shadow-md hover:-translate-y-0.5',
        isHovered && 'ring-2 ring-state-focus/20'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? 'var(--color-state-focus)' : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-5">
        {/* 头部：头像 + 名称 + 角色 + 操作菜单 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarImage src={member.avatar || undefined} alt={member.nickname} />
              <AvatarFallback className="bg-[var(--color-state-info-subtle)]">
                <User className="h-5 w-5" style={{ color: 'var(--color-state-info)' }} />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold truncate"
                style={{ color: 'var(--color-text-primary)' }}
                title={member.nickname}
              >
                {member.nickname || '未命名用户'}
                {isSelf && (
                  <span className="ml-1 text-xs font-normal text-text-tertiary">（我）</span>
                )}
              </h3>
              <RoleBadge role={member.role} className="mt-1" />
            </div>
          </div>

          {/* 操作菜单 */}
          {hasActions && (
            <div onClick={(e) => e.stopPropagation()}>
              <Dropdown
                trigger={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                }
              >
                {canChangeRole && member.role === TenantRole.Normal && onChangeRole && (
                  <DropdownItem
                    icon={<ShieldPlus className="h-4 w-4" />}
                    onClick={() => onChangeRole(member.user_id, member.nickname, member.role)}
                  >
                    设为管理员
                  </DropdownItem>
                )}
                {canChangeRole && member.role === TenantRole.Admin && onChangeRole && (
                  <DropdownItem
                    icon={<ShieldMinus className="h-4 w-4" />}
                    onClick={() => onChangeRole(member.user_id, member.nickname, member.role)}
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
            </div>
          )}
        </div>

        {/* 成员信息 */}
        <div className="space-y-2 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0" />
            <span className="truncate" title={member.email}>
              {member.email}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{formatTeamTime(member.update_date, member.delta_seconds, timeFormat)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

TeamMemberCard.displayName = 'TeamMemberCard'
