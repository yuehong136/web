import { useTranslation } from 'react-i18next'
import { FilterBar } from '@/components/patterns'
import type { AgentFlow } from '@/types/agent'
import {
  AgentLogStatus,
  type AgentLogParamPatch,
  type AgentLogParams,
} from '../types'
import { CanvasSelector } from './canvas-selector'

interface LogToolbarProps {
  agent?: AgentFlow
  params: AgentLogParams
  onChange: (patch: AgentLogParamPatch) => void
}

const STATUSES = [
  AgentLogStatus.OK,
  AgentLogStatus.ERR,
  AgentLogStatus.RUN,
  AgentLogStatus.WARN,
]
/** Session origins the backend records in `session.source`. */
const SOURCES = ['explore', 'share', 'webhook', 'editor']

/** Agent picker, then the session search and status chip once one is chosen. */
export function LogToolbar({ agent, params, onChange }: LogToolbarProps) {
  const { t } = useTranslation()
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-space-sm">
      <CanvasSelector
        selectedAgent={agent}
        selectedCanvasId={params.canvas}
        onSelect={(canvas) => onChange({ canvas, page: 1 })}
      />
      {params.canvas ? (
        <FilterBar
          className="min-w-0 flex-1"
          search={{
            value: params.keywords || '',
            onChange: (keywords) => onChange({ keywords }),
            placeholder: t('agents.runLogs.searchPlaceholder'),
          }}
          filters={[
            {
              key: 'status',
              label: t('agents.runLogs.status'),
              selection: 'single',
              value:
                params.status === AgentLogStatus.ALL ? [] : [params.status],
              options: STATUSES.map((status) => ({
                value: status,
                label: t(`agents.runLogs.statuses.${status}`),
              })),
            },
            {
              key: 'source',
              label: t('agents.runLogs.source'),
              selection: 'single',
              value: params.source ? [params.source] : [],
              options: SOURCES.map((value) => ({
                value,
                label: t(`agents.runLogs.sources.${value}`),
              })),
            },
          ]}
          onFilterChange={(key, value) =>
            onChange(
              key === 'status'
                ? {
                    status:
                      (value[0] as AgentLogStatus | undefined) ??
                      AgentLogStatus.ALL,
                  }
                : { source: value[0] },
            )
          }
          onClearFilters={() =>
            onChange({
              status: AgentLogStatus.ALL,
              source: undefined,
              from: undefined,
              to: undefined,
              user: undefined,
              page: 1,
            })
          }
        />
      ) : null}
    </div>
  )
}
