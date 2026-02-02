/**
 * 团队成员卡片组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { MoreVertical, Trash2, Mail, Clock, User } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type TeamMember } from '@/types/team'
import type { TimeFormat } from '@/stores/team'

interface TeamMemberCardProps {
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

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  isOwner,
  onRemove,
  timeFormat = 'detailed',
}) => {
  const canRemove = isOwner && member.role !== TenantRole.Owner
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
              </h3>
              <RoleBadge role={member.role} className="mt-1" />
            </div>
          </div>

          {/* 操作菜单 - 只有所有者可以移除成员 */}
          {canRemove && onRemove && (
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
                <DropdownItem
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => onRemove(member.user_id, member.nickname)}
                  danger
                >
                  移除成员
                </DropdownItem>
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
            <span>{formatTime(member.update_date, member.delta_seconds, timeFormat)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

TeamMemberCard.displayName = 'TeamMemberCard'
