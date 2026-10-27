import { useTranslation } from 'react-i18next'
import {
  PageEmptyState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'
import { AgentTags } from './agent-tags'
import { AgentAvatar } from './agent-avatar'
import { AgentActions, type AgentActionProps } from './agent-actions'
import { AgentKind, AgentMetadata } from './agent-metadata'
import type { AgentTimeFormat } from './agent-card'
export type { AgentTimeFormat }
interface AgentListViewProps extends Omit<AgentActionProps, 'flow'> {
  data: AgentFlow[]
  isLoading?: boolean
  timeFormat?: AgentTimeFormat
  currentUserId?: string
}
export function AgentListView({
  data,
  isLoading = false,
  timeFormat = 'detailed',
  currentUserId,
  onEditTags,
  ...actions
}: AgentListViewProps) {
  const { t } = useTranslation()
  if (isLoading)
    return (
      <PageLoadingState
        title={t('agents.loadingTitle')}
        description={t('agents.loadingDescription')}
      />
    )
  if (!data.length)
    return (
      <PageEmptyState
        title={t('agents.emptyTitle')}
        description={t('agents.emptyDescription')}
      />
    )
  return (
    <ul className="divide-y divide-border-subtle rounded-radius-lg border border-border-default bg-background-surface">
      {data.map((flow) => {
        const title = resolveLocalizedText(flow.title, t('agents.unnamedAgent'))
        const description = resolveLocalizedText(flow.description, '')
        return (
          <li
            key={flow.id}
            className="relative flex flex-col gap-space-sm p-space-md md:flex-row md:items-center md:gap-space-lg"
          >
            <div className="flex min-w-0 flex-1 items-center gap-space-sm pr-[var(--control-height-sm)] md:pr-0">
              <AgentAvatar
                avatar={flow.avatar}
                pipeline={isPipelineFlow(flow)}
              />
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => actions.onOpen(flow)}
                    className="max-w-full truncate rounded-radius-sm text-left outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
                  >
                    {title}
                  </button>
                </h2>
                <p className="truncate text-sm text-text-secondary">
                  {description || t('agents.noDescription')}
                </p>
                <AgentTags tags={flow.tags} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-space-sm md:max-w-80 md:justify-end">
              <AgentKind flow={flow} />
              <AgentMetadata flow={flow} timeFormat={timeFormat} />
            </div>
            <div className="absolute top-space-md right-space-md md:static md:shrink-0">
              <AgentActions
                flow={flow}
                title={title}
                onEditTags={
                  currentUserId &&
                  (flow.user_id || flow.tenant_id) === currentUserId
                    ? onEditTags
                    : undefined
                }
                {...actions}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
