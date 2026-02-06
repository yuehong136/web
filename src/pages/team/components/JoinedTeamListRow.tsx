/**
 * 已加入团队列表行组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, Check, X, LogOut } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type JoinedTeam } from '@/types/team'
import type { TimeFormat } from '@/stores/team'

interface JoinedTeamListRowProps {
  team: JoinedTeam
  onAccept?: (tenantId: string) => void
  onReject?: (tenantId: string) => void
  onLeave?: (tenantId: string, nickname: string) => void
  timeFormat?: TimeFormat
  isLoading?: boolean
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

export const JoinedTeamListRow: React.FC<JoinedTeamListRowProps> = ({
  team,
  onAccept,
  onReject,
  onLeave,
  timeFormat = 'detailed',
  isLoading = false,
}) => {
  const isPending = team.role === TenantRole.Invite
  const isNormal = team.role === TenantRole.Normal
  const isOwner = team.role === TenantRole.Owner

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
        {formatTime(team.update_date, team.delta_seconds, timeFormat)}
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
        {isOwner && (
          <span className="text-xs text-text-tertiary px-2">所有者</span>
        )}
      </div>
    </div>
  )
}

JoinedTeamListRow.displayName = 'JoinedTeamListRow'
