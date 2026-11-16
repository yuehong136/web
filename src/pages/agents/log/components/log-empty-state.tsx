import { useTranslation } from 'react-i18next'
import { ClipboardList } from 'lucide-react'
import {
  PageEmptyState,
  ResourceList,
  ResourceRow,
} from '@/components/patterns'
import { isPipelineFlow, resolveLocalizedText } from '@/lib/agent'
import type { AgentFlow } from '@/types/agent'

interface LogEmptyStateProps {
  recentAgents: AgentFlow[]
  onSelectAgent: (canvasId: string) => void
}

/** Shown before an agent is chosen: the prompt and recently updated agents. */
export function LogEmptyState({
  recentAgents,
  onSelectAgent,
}: LogEmptyStateProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col items-center gap-space-md pb-space-xl">
      <PageEmptyState
        compact
        className="h-auto min-h-0"
        icon={<ClipboardList className="size-icon-lg" />}
        title={t('agents.runLogs.pickTitle')}
        description={
          recentAgents.length
            ? t('agents.runLogs.pickDescription')
            : t('agents.runLogs.noRecentAgents')
        }
      />
      {recentAgents.length > 0 ? (
        <section
          aria-label={t('agents.runLogs.recent')}
          className="w-full max-w-2xl overflow-hidden rounded-radius-xl border border-border-default"
        >
          <h2 className="border-b border-border-subtle px-space-md py-space-xs text-xs font-medium text-text-tertiary">
            {t('agents.runLogs.recent')}
          </h2>
          <ResourceList label={t('agents.runLogs.recent')}>
            {recentAgents.map((agent) => (
              <ResourceRow
                key={agent.id}
                density="compact"
                className="last:border-b-0"
                name={resolveLocalizedText(
                  agent.title,
                  t('agents.unnamedAgent'),
                )}
                description={<span className="font-mono">{agent.id}</span>}
                avatar={{
                  src: agent.avatar,
                  seed: agent.id,
                  badge: isPipelineFlow(agent) ? 'workflow' : 'agent',
                }}
                onOpen={() => onSelectAgent(agent.id)}
              />
            ))}
          </ResourceList>
        </section>
      ) : null}
    </div>
  )
}
