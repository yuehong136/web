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
      return <Globe className="w-3.5 h-3.5" />
    case 'streamable-http':
    case 'http':
      return <Server className="w-3.5 h-3.5" />
    default:
      return <Wrench className="w-3.5 h-3.5" />
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
    <div className="flex flex-wrap gap-2 mb-3">
      {/* 已选技能 */}
      {selectedMCPServers.map((server) => (
        <div
          key={`skill-${server.id}`}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-state-focus-subtle text-state-focus rounded-full text-xs font-medium"
        >
          {getServerIcon(server.server_type)}
          <span>{server.name}</span>
          <button
            onClick={() => onRemoveSkill(server.id)}
            className="hover:bg-state-focus/20 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
      {/* 已选应用 */}
      {selectedApps.map((app) => (
        <div
          key={`app-${app.id}`}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-state-success-subtle text-state-success rounded-full text-xs font-medium"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{app.name}</span>
          <button
            onClick={() => onRemoveApp(app.id)}
            className="hover:bg-state-success/20 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  )
}
