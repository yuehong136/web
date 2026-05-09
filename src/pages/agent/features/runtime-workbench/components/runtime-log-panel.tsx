import { SectionCard } from '@/components/patterns'
import { LogDetail } from '../../log-detail'
import { AgentRuntimeStatus, type AgentRuntimeController } from '../types'
import { WorkFlowTimeline } from './workflow-timeline'

interface RuntimeLogPanelProps {
  controller: AgentRuntimeController
}

export function RuntimeLogPanel({ controller }: RuntimeLogPanelProps) {
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
      <SectionCard title="节点时间线" padding="default">
        <WorkFlowTimeline
          currentEventListWithoutMessage={controller.logEvents}
          sendLoading={controller.loading}
        />
      </SectionCard>
    </div>
  )
}
