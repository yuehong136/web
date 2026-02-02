import React from 'react'
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
      return <Globe className="w-4 h-4" />
    case 'streamable-http':
    case 'http':
      return <Server className="w-4 h-4" />
    default:
      return <Wrench className="w-4 h-4" />
  }
}

export const SkillList: React.FC<SkillListProps> = ({
  servers,
  selectedSkillIds,
  onSelectSkill,
  isLoading,
  searchTerm,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Wrench className="w-8 h-8 text-text-tertiary mb-2" />
        <p className="text-sm text-text-secondary">
          {searchTerm ? '没有找到匹配的技能' : '暂无可用技能'}
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
              'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
              isSelected
                ? 'bg-state-focus-subtle'
                : 'hover:bg-background-subtle'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                isSelected
                  ? 'bg-state-focus text-text-inverted'
                  : 'bg-background-subtle text-text-secondary'
              )}
            >
              {getServerIcon(server.server_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary truncate">
                {server.name}
              </div>
              {server.description && (
                <div className="text-xs text-text-tertiary truncate">
                  {server.description}
                </div>
              )}
            </div>
            {isSelected && (
              <div className="w-2 h-2 rounded-full bg-state-focus flex-shrink-0" />
            )}
          </button>
        )
      })}
    </div>
  )
}
