/**
 * 团队成员列表行组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { MoreVertical, Trash2, User } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type TeamMember } from '@/types/team'
import type { TimeFormat } from '@/stores/team'

interface TeamMemberListRowProps {
  member: TeamMember
  isOwner: boolean
  onRemove?: (userId: string, nickname: string) => void
  timeFormat?: TimeFormat
}

// 将 delta_seconds 转换为可读时间
const formatDeltaSeconds = (deltaSeconds: number): string => {
  if (deltaSeconds < 60) return '刚刚'
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)} 分钟前`
  if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)} 小时前`
  if (deltaSeconds < 2592000) return `${Math.floor(deltaSeconds / 86400)} 天前`
  return `${Math.floor(deltaSeconds / 2592000)} 个月前`
}

// 格式化时间，支持 update_date 字符串和 delta_seconds
const formatTime = (
  updateDate: string | undefined,
  deltaSeconds: number | undefined,
  format: TimeFormat
) => {
  if (format === 'relative' && deltaSeconds !== undefined) {
    return formatDeltaSeconds(deltaSeconds)
  }
  
  if (!updateDate) return '未知时间'
  
  const date = new Date(updateDate)
  if (isNaN(date.getTime())) return updateDate
  
  switch (format) {
    case 'detailed':
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    case 'compact':
      return date.toLocaleDateString('zh-CN')
    case 'relative':
      return formatRelativeTime(date.getTime())
    default:
      return date.toLocaleString('zh-CN')
  }
}

export const TeamMemberListRow: React.FC<TeamMemberListRowProps> = ({
  member,
  isOwner,
  onRemove,
  timeFormat = 'detailed',
}) => {
  const canRemove = isOwner && member.role !== TenantRole.Owner

  return (
    <div
      className={cn(
        'group relative grid grid-cols-[2fr_1fr_1fr_120px_60px] items-center gap-4',
        'px-5 h-[72px] rounded-xl',
        'border-2 border-transparent',
        'transition-all duration-200 ease-out',
        'hover:bg-surface-secondary/80 hover:border-border-default hover:shadow-md'
      )}
    >
      {/* 成员信息列 */}
      <div className="flex items-center gap-4 min-w-0">
        <Avatar className="h-10 w-10 shrink-0 transition-transform duration-200 group-hover:scale-105">
          <AvatarImage src={member.avatar || undefined} alt={member.nickname} />
          <AvatarFallback className="bg-[var(--color-state-info-subtle)]">
            <User className="h-5 w-5" style={{ color: 'var(--color-state-info)' }} />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 h-11 flex flex-col justify-center">
          <h3
            className="font-medium text-text-primary truncate group-hover:text-text-accent transition-colors duration-200"
            title={member.nickname}
          >
            {member.nickname || '未命名用户'}
          </h3>
          <p className="text-sm text-text-tertiary truncate" title={member.email}>
            {member.email}
          </p>
        </div>
      </div>

      {/* 角色列 */}
      <div className="flex items-center">
        <RoleBadge role={member.role} />
      </div>

      {/* 邮箱列 */}
      <div className="text-sm text-text-secondary truncate" title={member.email}>
        {member.email}
      </div>

      {/* 更新时间列 */}
      <div className="text-sm text-text-tertiary">
        {formatTime(member.update_date, member.delta_seconds, timeFormat)}
      </div>

      {/* 操作列 */}
      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
        {canRemove && onRemove && (
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
            <DropdownItem
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => onRemove(member.user_id, member.nickname)}
              danger
            >
              移除成员
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </div>
  )
}

TeamMemberListRow.displayName = 'TeamMemberListRow'
