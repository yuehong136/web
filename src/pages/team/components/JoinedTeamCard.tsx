/**
 * 已加入团队卡片组件
 * 展示组件 - 无 hooks、无 API、无 store
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Users, Mail, Clock, Check, X, LogOut } from 'lucide-react'
import { cn, formatRelativeTime } from '@/lib/utils'
import { RoleBadge } from './RoleBadge'
import { TenantRole, type JoinedTeam } from '@/types/team'
import type { TimeFormat } from '@/stores/team'

interface JoinedTeamCardProps {
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

export const JoinedTeamCard: React.FC<JoinedTeamCardProps> = ({
  team,
  onAccept,
  onReject,
  onLeave,
  timeFormat = 'detailed',
  isLoading = false,
}) => {
  const isPending = team.role === TenantRole.Invite
  const isNormal = team.role === TenantRole.Normal
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
            <span>{formatTime(team.update_date, team.delta_seconds, timeFormat)}</span>
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
          {team.role === TenantRole.Owner && (
            <div
              className="w-full text-center text-sm py-2 rounded-lg"
              style={{
                backgroundColor: 'var(--color-status-warning-bg)',
                color: 'var(--color-status-warning-text)',
              }}
            >
              你是此团队的所有者
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

JoinedTeamCard.displayName = 'JoinedTeamCard'
