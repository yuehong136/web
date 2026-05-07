import { memo, useMemo } from 'react'
import { XCard } from '@ant-design/x-card'
import { AlertTriangle } from 'lucide-react'
import { agentXCardComponents } from './components'
import { enrichContextWithLabels, normalizeCommandsForXCardRenderer } from './normalize'
import type { AgentXCardActionPayload, AgentXCardCommand } from './types'

interface AgentXCardRendererProps {
  commands?: AgentXCardCommand[]
  surfaceIds?: string[]
  status?: string
  onAction?: (payload: AgentXCardActionPayload) => void | Promise<void>
}

function AgentXCardRendererBase({
  commands = [],
  surfaceIds = [],
  status,
  onAction,
}: AgentXCardRendererProps) {
  const visibleSurfaceIds = useMemo(
    () => surfaceIds.filter(Boolean),
    [surfaceIds],
  )
  const normalizedCommands = useMemo(
    () => normalizeCommandsForXCardRenderer(commands),
    [commands],
  )

  if (!normalizedCommands.length || !visibleSurfaceIds.length) {
    return null
  }

  if (status === 'error') {
    return (
      <div className="mt-space-sm flex items-center gap-space-sm rounded-radius-md border border-status-error bg-surface-secondary p-space-sm text-sm text-status-error">
        <AlertTriangle className="size-4" />
        卡片渲染失败
      </div>
    )
  }

  return (
    <div className="mt-space-sm">
      <XCard.Box
        commands={normalizedCommands}
        components={agentXCardComponents}
        onAction={(payload) => {
          void onAction?.({
            ...payload,
            displayContext: enrichContextWithLabels(normalizedCommands, payload),
          })
        }}
      >
        {visibleSurfaceIds.map((surfaceId) => (
          <XCard.Card key={surfaceId} id={surfaceId} />
        ))}
      </XCard.Box>
    </div>
  )
}

export const AgentXCardRenderer = memo(AgentXCardRendererBase)
