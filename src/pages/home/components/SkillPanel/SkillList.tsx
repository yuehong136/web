import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Globe, Server, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MCPServer } from '@/types/mcp'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { MCP_PATH } from '@/pages/settings/settings-routes'

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
      return <Globe aria-hidden="true" />
    case 'streamable-http':
    case 'http':
      return <Server aria-hidden="true" />
    default:
      return <Wrench aria-hidden="true" />
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
            ? t('home.skillPanel.noSkillMatch')
            : t('home.skillPanel.noSkills')}
        </p>
        {!searchTerm && (
          <Link
            to={MCP_PATH}
            className="mt-space-xs text-xs text-text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-state-focus"
          >
            {t('home.skillPanel.addInSettings')}
          </Link>
        )}
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
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelectSkill(server)}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
              isSelected
                ? 'bg-state-focus-subtle'
                : 'hover:bg-background-subtle',
            )}
          >
            <EntityAvatar
              name={server.name}
              kind="mcp"
              tone="kind"
              icon={getServerIcon(server.server_type)}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-space-xs">
                <span className="truncate text-sm font-medium text-text-primary">
                  {server.name}
                </span>
                <span className="shrink-0 rounded-radius-sm bg-background-subtle px-space-xs font-mono text-xs text-text-tertiary">
                  {server.server_type}
                </span>
              </div>
              {server.description && (
                <div className="truncate text-xs text-text-tertiary">
                  {server.description}
                </div>
              )}
              {server.url && (
                <div className="truncate font-mono text-xs text-text-tertiary">
                  {server.url}
                </div>
              )}
            </div>
            {isSelected && (
              <div className="h-2 w-2 shrink-0 rounded-full bg-state-focus" />
            )}
          </button>
        )
      })}
    </div>
  )
}
