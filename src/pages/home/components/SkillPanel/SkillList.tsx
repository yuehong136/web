import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Server, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MCPServer } from '@/types/mcp'

interface SkillListProps {
  servers: MCPServer[]
  selectedSkillIds: string[]
  onSelectSkill: (server: MCPServer) => void
  isLoading: boolean
  searchTerm: string
}

// 根据服务器类型获取图标
const getServerIcon = (serverType: string) => {
  switch (serverType) {
    case 'sse':
      return <Globe className="h-4 w-4" />
    case 'streamable-http':
    case 'http':
      return <Server className="h-4 w-4" />
    default:
      return <Wrench className="h-4 w-4" />
  }
}

export const SkillList: React.FC<SkillListProps> = ({
  servers,
  selectedSkillIds,
  onSelectSkill,
  isLoading,
  searchTerm,
}) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" />
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Wrench className="mb-2 h-8 w-8 text-text-tertiary" />
        <p className="text-sm text-text-secondary">
          {searchTerm
            ? t('home.skillPanel.noSkillMatch', '没有找到匹配的技能')
            : t('home.skillPanel.noSkills', '暂无可用技能')}
        </p>
      </div>
    )
  }

  return (
    <div className="py-1">
      {servers.map((server) => {
        const isSelected = selectedSkillIds.includes(server.id)
        return (
          <button
            key={server.id}
            onClick={() => onSelectSkill(server)}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
              isSelected
                ? 'bg-state-focus-subtle'
                : 'hover:bg-background-subtle',
            )}
          >
            <div
              className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
                isSelected
                  ? 'bg-state-focus text-text-inverted'
                  : 'bg-background-subtle text-text-secondary',
              )}
            >
              {getServerIcon(server.server_type)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-text-primary">
                {server.name}
              </div>
              {server.description && (
                <div className="truncate text-xs text-text-tertiary">
                  {server.description}
                </div>
              )}
            </div>
            {isSelected && (
              <div className="h-2 w-2 flex-shrink-0 rounded-full bg-state-focus" />
            )}
          </button>
        )
      })}
    </div>
  )
}
