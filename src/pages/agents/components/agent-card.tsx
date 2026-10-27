import { useTranslation } from 'react-i18next'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import { AgentTags } from './agent-tags'
import { AgentAvatar } from './agent-avatar'
import { AgentActions, type AgentActionProps } from './agent-actions'
import { AgentKind, AgentMetadata } from './agent-metadata'
export type AgentTimeFormat = 'detailed' | 'compact' | 'relative'
interface AgentCardProps extends AgentActionProps {
  timeFormat?: AgentTimeFormat
}

export function AgentCard({
  flow,
  timeFormat = 'detailed',
  ...actions
}: AgentCardProps) {
  const { t } = useTranslation()
  const title = resolveLocalizedText(flow.title, t('agents.unnamedAgent'))
  const description = resolveLocalizedText(flow.description, '')
  return (
    <article className="flex min-w-0 flex-col gap-space-md rounded-radius-lg border border-components-card-border bg-components-card-bg p-space-md transition-colors hover:border-border-strong">
      <div className="flex items-center gap-space-sm">
        <AgentAvatar avatar={flow.avatar} pipeline={isPipelineFlow(flow)} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-text-primary">
            <button
              type="button"
              onClick={() => actions.onOpen(flow)}
              className="max-w-full truncate rounded-radius-sm text-left outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
            >
              {title}
            </button>
          </h2>
        </div>
        <AgentActions flow={flow} title={title} {...actions} />
      </div>
      <p className="line-clamp-2 min-h-[2.5em] text-sm leading-relaxed text-text-secondary">
        {description || t('agents.noDescription')}
      </p>
      <div className="flex flex-wrap items-start gap-space-xs">
        <AgentKind flow={flow} />
        <AgentTags tags={flow.tags} />
      </div>
      <div className="mt-auto border-t border-border-subtle pt-space-sm">
        <AgentMetadata flow={flow} timeFormat={timeFormat} />
      </div>
    </article>
  )
}
