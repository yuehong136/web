import { memo } from 'react'
import { SectionCard } from '@/components/patterns'
import { LegacySheetShell } from '../features/runtime-workbench/components/legacy-sheet-shell'
import type { AgentRuntimeController } from '../features/runtime-workbench/types'
import DebugContent from '../debug-content'

interface AgentRunPanelProps {
  controller: AgentRuntimeController
}

interface RunSheetProps {
  hideModal?: () => void
  showModal?: () => void
  controller?: AgentRuntimeController
}

export function AgentRunPanel({ controller }: AgentRunPanelProps) {
  return (
    <div className="space-y-space-lg p-space-md">
      <SectionCard title="Begin Inputs" padding="default">
        <div className="space-y-space-md">
          <p className="text-sm text-text-secondary">
            {controller.isTaskMode
              ? '当前 Begin 节点处于任务模式，提交参数后会直接触发一次测试运行。'
              : '这里负责同步 Begin 输入。提交后会进入 Conversation 视图，由你继续发送测试消息。'}
          </p>

          <DebugContent
            canvasId={controller.canvasId}
            parameters={controller.beginInputs}
            ok={controller.handleRun}
            isNext={false}
            loading={controller.loading || controller.saving}
            btnText={controller.isTaskMode ? '开始运行' : '进入对话'}
            className="min-h-0"
            maxHeight="max-h-none"
          />
        </div>
      </SectionCard>

      {!controller.beginInputs.length ? (
        <SectionCard title="运行说明" padding="default">
          <p className="text-sm text-text-secondary">
            当前 Begin 节点没有额外输入字段。你仍然可以提交本页，直接进入 Conversation 视图。
          </p>
        </SectionCard>
      ) : null}
    </div>
  )
}

const RunSheet = ({ hideModal, controller }: RunSheetProps) => {
  return (
    <LegacySheetShell
      open
      title="测试运行"
      description="兼容壳：正式运行路径已收敛到新的 runtime workbench。"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          hideModal?.()
        }
      }}
      className="sm:max-w-[620px]"
    >
      {controller ? (
        <AgentRunPanel controller={controller} />
      ) : (
        <div className="p-space-md text-sm text-text-secondary">
          请通过新的 runtime workbench 打开测试运行面板。
        </div>
      )}
    </LegacySheetShell>
  )
}

export default memo(RunSheet)
