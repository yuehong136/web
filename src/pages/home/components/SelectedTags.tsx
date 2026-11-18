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
  'inline-flex h-7 max-w-full min-w-0 items-center gap-space-xs rounded-radius-full border border-line-subtle bg-sunken ps-space-2xs pe-space-2xs text-xs text-fg'
const REMOVE =
  'grid size-5 shrink-0 place-items-center rounded-radius-full text-fg-subtle hover:bg-fill-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-line-focus disabled:cursor-not-allowed disabled:opacity-50'

// 根据服务器类型获取图标：图标块按 MCP 类型取色，字形区分传输方式
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
          <EntityAvatar
            name={server.name}
            kind="mcp"
            tone="kind"
            icon={getServerIcon(server.server_type)}
            size="xs"
            shape="circle"
          />
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
            size="xs"
            shape="circle"
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
