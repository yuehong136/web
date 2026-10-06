import React from 'react'
import { useTranslation } from 'react-i18next'
import { X, MessageSquare, Globe, Server, Wrench } from 'lucide-react'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'

interface SelectedTagsProps {
  selectedMCPServers: MCPServer[]
  selectedApps: DialogApp[]
  onRemoveSkill: (serverId: string) => void
  onRemoveApp: (appId: string) => void
  /** 运行中的请求已按当前范围接纳，期间不允许移除 */
  disabled?: boolean
}

const removeButtonClassName =
  'rounded-full p-0.5 hover:bg-state-selected/20 disabled:cursor-not-allowed disabled:opacity-50'

// 根据服务器类型获取图标
const getServerIcon = (serverType: string) => {
  switch (serverType) {
    case 'sse':
      return <Globe className="h-3.5 w-3.5" />
    case 'streamable-http':
    case 'http':
      return <Server className="h-3.5 w-3.5" />
    default:
      return <Wrench className="h-3.5 w-3.5" />
  }
}

export const SelectedTags: React.FC<SelectedTagsProps> = ({
  selectedMCPServers,
  selectedApps,
  onRemoveSkill,
  onRemoveApp,
  disabled = false,
}) => {
  const { t } = useTranslation()
  if (selectedMCPServers.length === 0 && selectedApps.length === 0) {
    return null
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {/* 已选技能 */}
      {selectedMCPServers.map((server) => (
        <div
          key={`skill-${server.id}`}
          className="flex items-center gap-1.5 rounded-full bg-state-selected-bg px-2.5 py-1 text-xs font-medium text-state-selected-text"
        >
          {getServerIcon(server.server_type)}
          <span>{server.name}</span>
          <button
            type="button"
            onClick={() => onRemoveSkill(server.id)}
            disabled={disabled}
            aria-label={t('home.input.removeSelection', { name: server.name })}
            className={removeButtonClassName}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
      {/* 已选应用 */}
      {selectedApps.map((app) => (
        <div
          key={`app-${app.id}`}
          className="flex items-center gap-1.5 rounded-full bg-state-selected-bg px-2.5 py-1 text-xs font-medium text-state-selected-text"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>{app.name}</span>
          <button
            type="button"
            onClick={() => onRemoveApp(app.id)}
            disabled={disabled}
            aria-label={t('home.input.removeSelection', { name: app.name })}
            className={removeButtonClassName}
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
