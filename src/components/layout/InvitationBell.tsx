/**
 * 邀请通知铃铛组件
 * 容器组件 - 显示待处理的团队邀请通知
 */

import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useFetchJoinedTeams } from '@/hooks/use-team-request'
import { TenantRole } from '@/types/team'
import { useTeamStore } from '@/stores/team'

export const InvitationBell: React.FC = () => {
  const navigate = useNavigate()
  const { joinedTeams, isLoading } = useFetchJoinedTeams()
  const { setActiveTab } = useTeamStore()

  // 计算待处理邀请数量
  const pendingInvitations = useMemo(() => {
    return joinedTeams.filter((team) => team.role === TenantRole.Invite)
  }, [joinedTeams])

  const hasPendingInvitations = pendingInvitations.length > 0

  const handleViewInvitations = () => {
    // 切换到"已加入的团队" tab 并导航到团队页面
    setActiveTab('joined-teams')
    navigate('/settings/team')
  }

  // 不显示铃铛如果没有待处理邀请（可选：总是显示）
  // if (!hasPendingInvitations) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="团队邀请通知"
        >
          <Bell className="h-5 w-5" />
          {hasPendingInvitations && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium text-white"
              style={{ backgroundColor: 'var(--color-status-error)' }}
            >
              {pendingInvitations.length > 9 ? '9+' : pendingInvitations.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 p-0"
        style={{
          backgroundColor: 'var(--color-surface-primary)',
          borderColor: 'var(--color-border-default)',
        }}
      >
        <div
          className="border-b p-4"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <h3 className="font-semibold text-text-primary">团队邀请</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {hasPendingInvitations
              ? `你有 ${pendingInvitations.length} 个待处理的团队邀请`
              : '暂无新的邀请'}
          </p>
        </div>

        {isLoading ? (
          <div className="p-4 text-center text-sm text-text-tertiary">
            加载中...
          </div>
        ) : hasPendingInvitations ? (
          <>
            <div className="max-h-64 overflow-y-auto">
              {pendingInvitations.map((team) => (
                <div
                  key={team.tenant_id}
                  className="hover:bg-surface-secondary/50 flex items-center gap-3 border-b p-4 transition-colors"
                  style={{ borderColor: 'var(--color-border-subtle)' }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: 'var(--color-components-gradient-secondary)',
                    }}
                  >
                    <span className="text-sm font-semibold text-text-inverted">
                      {team.nickname?.[0] || 'T'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">
                      {team.nickname || '未命名团队'}
                    </p>
                    <p className="truncate text-sm text-text-tertiary">
                      {team.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div
              className="border-t p-3"
              style={{ borderColor: 'var(--color-border-subtle)' }}
            >
              <Button
                variant="default"
                size="sm"
                className="w-full"
                onClick={handleViewInvitations}
              >
                查看全部邀请
              </Button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center">
            <Bell className="text-text-quaternary mx-auto mb-3 h-10 w-10" />
            <p className="text-sm text-text-secondary">暂无待处理的邀请</p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

InvitationBell.displayName = 'InvitationBell'
