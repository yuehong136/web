/**
 * 团队管理 Tab 内容
 * 包含团队选择器、搜索工具栏和成员列表
 */

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ViewToggle } from '@/components/ui/view-toggle'
import { CustomSelect } from '@/components/ui/custom-select'
import {
  ResourceListContainer,
  ResourceListHeader,
  ResourceListBody,
} from '@/components/ui/resource-list'
import {
  Search,
  Grid3X3,
  List as ListIcon,
  ArrowUpDown,
  UserPlus,
} from 'lucide-react'
import { useTeamStore } from '@/stores/team'
import { useFilteredMembers } from './hooks'
import type { TeamMember, TenantInfo, JoinedTeam, TenantRole, TeamPermissions } from '@/types/team'
import {
  TeamMemberCard,
  TeamMemberListRow,
  TeamEmptyState,
  MemberSkeleton,
  TeamSelector,
} from './components'

interface TeamManagementTabProps {
  tenantInfo: TenantInfo | null
  manageableTeams: JoinedTeam[]
  selectedTenantId: string | null
  currentUserId?: string
  members: TeamMember[]
  membersLoading: boolean
  permissions: TeamPermissions
  onSelectTenant: (tenantId: string) => void
  onRemoveMember: (userId: string, nickname: string) => void
  onChangeRole: (userId: string, nickname: string, currentRole: TenantRole) => void
  onOpenInviteDialog: () => void
}

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({
  tenantInfo,
  manageableTeams,
  selectedTenantId,
  currentUserId,
  members,
  membersLoading,
  permissions,
  onSelectTenant,
  onRemoveMember,
  onChangeRole,
  onOpenInviteDialog,
}) => {
  const {
    viewMode,
    setViewMode,
    memberSearchQuery,
    setMemberSearchQuery,
    timeFormat,
    setTimeFormat,
  } = useTeamStore()

  const [memberSortDesc, setMemberSortDesc] = React.useState(true)
  const filteredMembers = useFilteredMembers(members, memberSearchQuery, memberSortDesc)

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 团队选择器 + 工具栏 */}
      <div className="flex items-center space-x-4 mb-4">
        <TeamSelector
          ownTenant={tenantInfo}
          manageableTeams={manageableTeams}
          selectedTenantId={selectedTenantId}
          onSelectTenant={onSelectTenant}
        />
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="搜索成员..."
            value={memberSearchQuery}
            onChange={(e) => setMemberSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center space-x-2">
          <CustomSelect
            options={[
              { value: 'detailed', label: '详细时间' },
              { value: 'compact', label: '简洁时间' },
              { value: 'relative', label: '相对时间' },
            ]}
            value={timeFormat}
            onChange={(value) => setTimeFormat(value as 'detailed' | 'compact' | 'relative')}
            size="sm"
            className="min-w-[100px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMemberSortDesc((prev) => !prev)}
            className="h-9 px-2 flex items-center gap-1 text-xs"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{memberSortDesc ? '倒序' : '正序'}</span>
          </Button>
          <ViewToggle
            value={viewMode}
            onChange={setViewMode}
            size="md"
            options={[
              { value: 'grid', icon: <Grid3X3 />, label: '网格视图' },
              { value: 'list', icon: <ListIcon />, label: '列表视图' },
            ]}
          />
          {permissions.canInvite && (
            <Button size="sm" onClick={onOpenInviteDialog}>
              <UserPlus className="h-4 w-4 mr-1" />
              邀请成员
            </Button>
          )}
        </div>
      </div>

      {/* 成员列表 */}
      <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">
        {membersLoading ? (
          <MemberSkeleton viewMode={viewMode} count={6} />
        ) : filteredMembers.length === 0 ? (
          <TeamEmptyState
            type={memberSearchQuery ? 'search' : 'members'}
            searchQuery={memberSearchQuery}
            onInvite={permissions.canInvite ? onOpenInviteDialog : undefined}
          />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <TeamMemberCard
                key={member.user_id}
                member={member}
                currentUserId={currentUserId}
                permissions={permissions}
                onRemove={onRemoveMember}
                onChangeRole={onChangeRole}
                timeFormat={timeFormat}
              />
            ))}
          </div>
        ) : (
          <ResourceListContainer>
            <ResourceListHeader
              columns={[
                { key: 'member', label: '成员' },
                { key: 'role', label: '角色' },
                { key: 'email', label: '邮箱' },
                { key: 'join_time', label: '加入时间' },
                { key: 'actions', label: '操作' },
              ]}
              showSelect={false}
              gridCols="grid-cols-[2fr_1fr_1fr_120px_60px]"
            />
            <ResourceListBody>
              {filteredMembers.map((member) => (
                <TeamMemberListRow
                  key={member.user_id}
                  member={member}
                  currentUserId={currentUserId}
                  permissions={permissions}
                  onRemove={onRemoveMember}
                  onChangeRole={onChangeRole}
                  timeFormat={timeFormat}
                />
              ))}
            </ResourceListBody>
          </ResourceListContainer>
        )}
      </div>
    </div>
  )
}

TeamManagementTab.displayName = 'TeamManagementTab'
