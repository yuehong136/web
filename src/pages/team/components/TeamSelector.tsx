/**
 * 团队选择器组件
 * 用于在「团队管理」tab 中切换当前管理的团队
 */

import React from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { ChevronDown, Crown, Shield, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TenantRole, type TenantInfo, type JoinedTeam } from '@/types/team'
import { RoleBadge } from './RoleBadge'

interface TeamSelectorProps {
  ownTenant: TenantInfo | null
  manageableTeams: JoinedTeam[]
  selectedTenantId: string | null
  onSelectTenant: (tenantId: string) => void
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  ownTenant,
  manageableTeams,
  selectedTenantId,
  onSelectTenant,
}) => {
  const [open, setOpen] = React.useState(false)

  // 找到当前选中的团队信息
  const selectedTeam = React.useMemo(() => {
    if (!selectedTenantId || selectedTenantId === ownTenant?.tenant_id) {
      return ownTenant
        ? { name: ownTenant.name, role: TenantRole.Owner, avatar: null as string | null }
        : null
    }
    const team = manageableTeams.find((t) => t.tenant_id === selectedTenantId)
    return team
      ? { name: team.nickname, role: team.role, avatar: team.avatar }
      : null
  }, [selectedTenantId, ownTenant, manageableTeams])

  const handleSelect = (tenantId: string) => {
    onSelectTenant(tenantId)
    setOpen(false)
  }

  // 如果只有自己的团队，不显示选择器
  if (manageableTeams.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedTeam && (
              <>
                <span className="truncate text-sm font-medium">
                  {selectedTeam.name || '未命名团队'}
                </span>
                <RoleBadge role={selectedTeam.role} />
              </>
            )}
          </div>
          <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-1" align="start">
        {/* 我的团队 */}
        {ownTenant && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-text-tertiary">
              我的团队
            </div>
            <button
              onClick={() => handleSelect(ownTenant.tenant_id)}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors',
                'hover:bg-surface-secondary',
                selectedTenantId === ownTenant.tenant_id && 'bg-surface-secondary'
              )}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-[var(--color-status-warning-bg)]">
                  <Crown className="h-4 w-4" style={{ color: 'var(--color-status-warning-text)' }} />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text-primary truncate">
                  {ownTenant.name || '我的团队'}
                </div>
              </div>
              <RoleBadge role={TenantRole.Owner} />
            </button>
          </>
        )}

        {/* 管理的团队 */}
        {manageableTeams.length > 0 && (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-text-tertiary mt-1">
              管理的团队
            </div>
            {manageableTeams.map((team) => (
              <button
                key={team.tenant_id}
                onClick={() => handleSelect(team.tenant_id)}
                className={cn(
                  'w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors',
                  'hover:bg-surface-secondary',
                  selectedTenantId === team.tenant_id && 'bg-surface-secondary'
                )}
              >
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={team.avatar || undefined} alt={team.nickname} />
                  <AvatarFallback className="bg-state-success-subtle">
                    {team.role === TenantRole.Admin ? (
                      <Shield className="h-4 w-4 text-[var(--color-components-badge-purple-text)]" />
                    ) : (
                      <Users className="h-4 w-4 text-state-success" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {team.nickname || '未命名团队'}
                  </div>
                  <div className="text-xs text-text-tertiary truncate">
                    {team.email}
                  </div>
                </div>
                <RoleBadge role={team.role} />
              </button>
            ))}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

TeamSelector.displayName = 'TeamSelector'
