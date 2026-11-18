import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { XCard } from '@ant-design/x-card'
import { AlertTriangle } from 'lucide-react'
import { agentXCardComponents } from './components'
import {
  enrichContextWithLabels,
  normalizeCommandsForXCardRenderer,
} from './normalize'
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
  const { t } = useTranslation()
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
      <div className="mt-space-sm flex items-center gap-space-sm rounded-radius-md border border-danger-line bg-danger-soft p-space-sm text-sm text-danger-fg">
        <AlertTriangle aria-hidden className="size-icon-sm" />
        {t('agent.xCard.renderFailed')}
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
            displayContext: enrichContextWithLabels(
              normalizedCommands,
              payload,
            ),
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
