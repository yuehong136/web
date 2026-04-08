import type { AgentRuntimeController } from '../features/runtime-workbench/types'
import { LegacySheetShell } from '../features/runtime-workbench/components/legacy-sheet-shell'
import AgentChatBox from './box'

interface ChatSheetProps {
  hideModal?: () => void
  controller?: AgentRuntimeController
}

export function ChatSheet({ hideModal, controller }: ChatSheetProps) {
  return (
    <LegacySheetShell
      open
      title="Conversation"
      description="兼容壳：正式对话路径已收敛到新的 runtime workbench。"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          hideModal?.()
        }
      }}
      className="sm:max-w-[620px]"
    >
      {controller ? (
        <AgentChatBox controller={controller} />
      ) : (
        <div className="p-space-md text-sm text-text-secondary">
          请通过新的 runtime workbench 打开 Conversation 视图。
        </div>
      )}
    </LegacySheetShell>
  )
}
