import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { knowledgeAPI } from '@/api/knowledge'
import type { InspectorPanelProps } from '@/components/patterns'
import { LogTabType, knowledgeLogKeys } from '../constants'
import type { LogDetailModalState } from '../types'
import { LogDetailBody } from './log-detail-sections'
import { LogLoadError } from './log-load-error'
import { LogTableSkeleton } from './log-table-state'

/**
 * Inspector props for the selected log, replacing the detail dialog so the
 * log list stays visible. Dataset logs load their full record on open.
 */
export function useLogInspectorPanel(
  detail: LogDetailModalState,
): InspectorPanelProps {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { open, selectedLog, activeTab, closeDetail } = detail
  const isFileLogs = activeTab === LogTabType.FILE_LOGS
  const record = useQuery({
    queryKey: knowledgeLogKeys.detail(id, selectedLog?.id),
    queryFn: () => knowledgeAPI.logs.get(id!, selectedLog!.id),
    enabled: open && !!id && !!selectedLog?.id && !isFileLogs,
  })

  let content
  if (!isFileLogs && record.isPending) content = <LogTableSkeleton rows={3} />
  else if (!isFileLogs && record.error)
    content = <LogLoadError onRetry={() => void record.refetch()} />
  else
    content = (
      <LogDetailBody
        logInfo={isFileLogs ? selectedLog : (record.data ?? null)}
        activeTab={activeTab}
      />
    )

  return {
    open,
    onOpenChange: (next) => {
      if (!next) closeDetail()
    },
    scopeKey: 'knowledge-log',
    title: isFileLogs
      ? t('knowledge.logs.detail.fileTitle')
      : t('knowledge.logs.detail.datasetTitle'),
    content: open ? content : null,
  }
}
