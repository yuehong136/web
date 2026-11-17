import { SectionCard } from '@/components/patterns'
import { useTranslation } from 'react-i18next'
import { LogDetail } from '../../log-detail'
import { AgentRuntimeStatus, type AgentRuntimeController } from '../types'
import { WorkFlowTimeline } from './workflow-timeline'

interface RuntimeLogPanelProps {
  controller: AgentRuntimeController
}

export function RuntimeLogPanel({ controller }: RuntimeLogPanelProps) {
  const { t } = useTranslation()
  const terminal =
    controller.status === AgentRuntimeStatus.SUCCESS ||
    controller.status === AgentRuntimeStatus.ERROR ||
    controller.status === AgentRuntimeStatus.STOPPED

  if (terminal) {
    return (
      <div className="p-space-md">
        <LogDetail mode="live" controller={controller} />
      </div>
    )
  }

  return (
    <div className="p-space-md">
      <SectionCard
        title={t('agent.runtimePanel.logPanel.nodeTimeline')}
        padding="default"
      >
        <WorkFlowTimeline
          currentEventListWithoutMessage={controller.logEvents}
          sendLoading={controller.loading}
        />
      </SectionCard>
    </div>
  )
}
