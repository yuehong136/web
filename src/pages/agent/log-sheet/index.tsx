import { SectionCard } from '@/components/patterns'
import { LegacySheetShell } from '../features/runtime-workbench/components/legacy-sheet-shell'
import type { AgentRuntimeController } from '../features/runtime-workbench/types'
import { WorkFlowTimeline } from './workflow-timeline'

interface RuntimeLogPanelProps {
  controller: AgentRuntimeController
}

interface LogSheetProps {
  hideModal?: () => void
  controller?: AgentRuntimeController
}

export function RuntimeLogPanel({ controller }: RuntimeLogPanelProps) {
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

export function LogSheet({ hideModal, controller }: LogSheetProps) {
  return (
    <LegacySheetShell
      open
      title="日志"
      description="兼容壳：正式日志路径已收敛到新的 runtime workbench。"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          hideModal?.()
        }
      }}
      className="sm:max-w-[620px]"
    >
      {controller ? (
        <RuntimeLogPanel controller={controller} />
      ) : (
        <div className="p-space-md text-sm text-text-secondary">
          请通过新的 runtime workbench 打开 Log 视图。
        </div>
      )}
    </LegacySheetShell>
  )
}
