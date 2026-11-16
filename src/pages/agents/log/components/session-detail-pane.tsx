import { useTranslation } from 'react-i18next'
import { MessageSquare } from 'lucide-react'
import { PageEmptyState } from '@/components/patterns'
import { LogDetail } from '@/pages/agent/features/log-detail'

interface SessionDetailPaneProps {
  canvasId?: string
  sessionId?: string
}

export function SessionDetailPane({
  canvasId,
  sessionId,
}: SessionDetailPaneProps) {
  const { t } = useTranslation()
  if (!canvasId || !sessionId)
    return (
      <PageEmptyState
        icon={<MessageSquare className="size-icon-lg" />}
        title={t('agents.runLogs.detailTitle')}
        description={t('agents.runLogs.detailDescription')}
      />
    )
  return <LogDetail mode="session" canvasId={canvasId} sessionId={sessionId} />
}
