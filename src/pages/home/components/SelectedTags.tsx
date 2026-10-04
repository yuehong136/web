import React from 'react'
import { X, MessageSquare, Globe, Server, Wrench } from 'lucide-react'
import type { DialogApp } from '@/types/api'
import type { MCPServer } from '@/types/mcp'

interface SelectedTagsProps {
  selectedMCPServers: MCPServer[]
  selectedApps: DialogApp[]
  onRemoveSkill: (serverId: string) => void
  onRemoveApp: (appId: string) => void
}

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
}) => {
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
            onClick={() => onRemoveSkill(server.id)}
            className="rounded-full p-0.5 hover:bg-state-selected/20"
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
            onClick={() => onRemoveApp(app.id)}
            className="rounded-full p-0.5 hover:bg-state-selected/20"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
