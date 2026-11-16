/**
 * 已加入的团队 Tab 内容
 * 包含搜索工具栏和团队列表
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ResourceListContainer,
  ResourceListHeader,
  ResourceListBody,
} from '@/components/ui/resource-list'
import { Search, Grid3X3, List as ListIcon, ArrowUpDown } from 'lucide-react'
import { useTeamStore } from '@/stores/team'
import { useFilteredJoinedTeams } from './hooks'
import type { JoinedTeam } from '@/types/team'
import {
  JoinedTeamCard,
  JoinedTeamListRow,
  TeamEmptyState,
  MemberSkeleton,
} from './components'

const TIME_FORMAT_OPTIONS = [
  { value: 'detailed', label: '详细时间' },
  { value: 'compact', label: '简洁时间' },
  { value: 'relative', label: '相对时间' },
]

interface JoinedTeamsTabProps {
  joinedTeams: JoinedTeam[]
  teamsLoading: boolean
  respondLoading: boolean
  onAccept: (tenantId: string) => void
  onReject: (tenantId: string) => void
  onLeave: (tenantId: string, nickname: string) => void
  onManageTeam: (tenantId: string) => void
}

export const JoinedTeamsTab: React.FC<JoinedTeamsTabProps> = ({
  joinedTeams,
  teamsLoading,
  respondLoading,
  onAccept,
  onReject,
  onLeave,
  onManageTeam,
}) => {
  const { t } = useTranslation()
  const {
    joinedTeamsViewMode,
    setJoinedTeamsViewMode,
    teamSearchQuery,
    setTeamSearchQuery,
    timeFormat,
    setTimeFormat,
  } = useTeamStore()

  const [joinedTeamSortDesc, setJoinedTeamSortDesc] = React.useState(true)
  const filteredJoinedTeams = useFilteredJoinedTeams(
    joinedTeams,
    teamSearchQuery,
    joinedTeamSortDesc,
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* 工具栏 */}
      <div className="mb-4 flex items-center space-x-4">
        <div className="max-w-md flex-1">
          <Input
            type="search"
            placeholder="搜索团队..."
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex items-center space-x-2">
          <Select
            value={timeFormat}
            onValueChange={(value) =>
              setTimeFormat(value as 'detailed' | 'compact' | 'relative')
            }
          >
            <SelectTrigger className="min-w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_FORMAT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setJoinedTeamSortDesc((prev) => !prev)}
            className="flex h-9 items-center gap-1 px-2 text-xs"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{joinedTeamSortDesc ? '倒序' : '正序'}</span>
          </Button>
          <SegmentedControl
            aria-label={t('common.viewToggle')}
            iconOnly
            value={joinedTeamsViewMode}
            onValueChange={setJoinedTeamsViewMode}
            options={[
              { value: 'grid', icon: <Grid3X3 />, label: '网格视图' },
              { value: 'list', icon: <ListIcon />, label: '列表视图' },
            ]}
          />
        </div>
      </div>

      {/* 团队列表 */}
      <div className="-mx-1 flex-1 overflow-y-auto px-1 pt-1 pb-2">
        {teamsLoading ? (
          <MemberSkeleton viewMode={joinedTeamsViewMode} count={6} />
        ) : filteredJoinedTeams.length === 0 ? (
          <TeamEmptyState
            type={teamSearchQuery ? 'search' : 'joined-teams'}
            searchQuery={teamSearchQuery}
          />
        ) : joinedTeamsViewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredJoinedTeams.map((team) => (
              <JoinedTeamCard
                key={team.tenant_id}
                team={team}
                onAccept={onAccept}
                onReject={onReject}
                onLeave={onLeave}
                onManageTeam={onManageTeam}
                timeFormat={timeFormat}
                isLoading={respondLoading}
              />
            ))}
          </div>
        ) : (
          <ResourceListContainer>
            <ResourceListHeader
              columns={[
                { key: 'team', label: '团队' },
                { key: 'role', label: '角色' },
                { key: 'email', label: '邮箱' },
                { key: 'join_time', label: '加入时间' },
                { key: 'actions', label: '操作' },
              ]}
              showSelect={false}
              gridCols="grid-cols-[2fr_1fr_1fr_120px_100px]"
            />
            <ResourceListBody>
              {filteredJoinedTeams.map((team) => (
                <JoinedTeamListRow
                  key={team.tenant_id}
                  team={team}
                  onAccept={onAccept}
                  onReject={onReject}
                  onLeave={onLeave}
                  onManageTeam={onManageTeam}
                  timeFormat={timeFormat}
                  isLoading={respondLoading}
                />
              ))}
            </ResourceListBody>
          </ResourceListContainer>
        )}
      </div>
    </div>
  )
}

JoinedTeamsTab.displayName = 'JoinedTeamsTab'
