import type { FC } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Globe, Server, Wrench } from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
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

const CHIP =
  'inline-flex h-6 max-w-full min-w-0 items-center gap-space-xs rounded-radius-md bg-background-subtle ps-space-xs pe-space-2xs text-xs text-text-primary'
const REMOVE =
  'grid size-icon-md shrink-0 place-items-center rounded-radius-sm text-text-tertiary hover:bg-state-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-state-focus disabled:cursor-not-allowed disabled:opacity-50'

// 根据服务器类型获取图标
const getServerIcon = (serverType: string) => {
  const className = 'size-icon-xs shrink-0 text-text-secondary'
  switch (serverType) {
    case 'sse':
      return <Globe aria-hidden="true" className={className} />
    case 'streamable-http':
    case 'http':
      return <Server aria-hidden="true" className={className} />
    default:
      return <Wrench aria-hidden="true" className={className} />
  }
}

/** Context chips above the composer: the app or MCP services this turn uses. */
export const SelectedTags: FC<SelectedTagsProps> = ({
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
    <div className="mb-space-sm flex flex-wrap gap-space-xs">
      {selectedMCPServers.map((server) => (
        <span key={`skill-${server.id}`} className={CHIP}>
          {getServerIcon(server.server_type)}
          <span className="truncate">{server.name}</span>
          <button
            type="button"
            onClick={() => onRemoveSkill(server.id)}
            disabled={disabled}
            aria-label={t('home.input.removeSelection', { name: server.name })}
            className={REMOVE}
          >
            <X aria-hidden="true" className="size-icon-xs" />
          </button>
        </span>
      ))}
      {selectedApps.map((app) => (
        <span key={`app-${app.id}`} className={CHIP}>
          <EntityAvatar
            name={app.name}
            src={app.icon}
            seed={app.id}
            size="2xs"
          />
          <span className="truncate">{app.name}</span>
          <button
            type="button"
            onClick={() => onRemoveApp(app.id)}
            disabled={disabled}
            aria-label={t('home.input.removeSelection', { name: app.name })}
            className={REMOVE}
          >
            <X aria-hidden="true" className="size-icon-xs" />
          </button>
        </span>
      ))}
    </div>
  )
}
