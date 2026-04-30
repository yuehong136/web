import {
  AppScene,
  PageEmptyState,
  PageLoadingState,
  SectionCard,
} from '@/components/patterns'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import DebugContent from '../../debug-content'
import type { BeginQuery } from '../../types'
import { AgentRuntimeStatus } from '../../features/runtime-workbench/types'
import type { RuntimeMessage } from '../../features/runtime-workbench/types'
import type { AgentXCardActionPayload } from '../../x-card'
import type { ExploreSendRequest } from '../types'
import {
  RuntimeChatComposer,
  RuntimeChatMessageList,
} from '../../components/runtime-chat'

interface SessionChatProps {
  canvasId: string
  active: boolean
  isTaskMode: boolean
  loadingSession: boolean
  messages: RuntimeMessage[]
  status: AgentRuntimeStatus
  beginInputs: BeginQuery[]
  parameterDialogOpen: boolean
  onParameterDialogOpenChange: (open: boolean) => void
  onParametersOk: (values: BeginQuery[]) => void | Promise<void>
  onSubmitAwaitingInputs: (
    messageId: string,
    values: BeginQuery[],
  ) => void | Promise<void>
  onXCardAction?: (payload: AgentXCardActionPayload) => void | Promise<void>
  onSend: (request: ExploreSendRequest) => Promise<void>
  onStop: () => Promise<void>
}

export function SessionChat({
  canvasId,
  active,
  isTaskMode,
  loadingSession,
  messages,
  status,
  beginInputs,
  parameterDialogOpen,
  onParameterDialogOpenChange,
  onParametersOk,
  onSubmitAwaitingInputs,
  onXCardAction,
  onSend,
  onStop,
}: SessionChatProps) {
  return (
    <section className="flex h-full min-h-0 flex-col bg-surface-primary">
      <div className="min-h-0 flex-1">
        {loadingSession ? (
          <PageLoadingState
            scene={AppScene.SPLIT_DETAIL}
            title="正在加载会话"
            description="正在恢复历史消息。"
          />
        ) : !active ? (
          <PageEmptyState
            scene={AppScene.SPLIT_DETAIL}
            title="选择或新建会话"
            description="左侧选择历史会话，或新建会话后开始发送消息。"
          />
        ) : messages.length === 0 ? (
          <PageEmptyState
            scene={AppScene.SPLIT_DETAIL}
            title="还没有消息"
            description="发送第一条消息后会创建或继续持久化会话。"
          />
        ) : (
          <ScrollArea className="h-full">
            <RuntimeChatMessageList
              canvasId={canvasId}
              messages={messages}
              status={status}
              onSubmitAwaitingInputs={onSubmitAwaitingInputs}
              onXCardAction={onXCardAction}
            />
          </ScrollArea>
        )}
      </div>

      {active ? (
        <RuntimeChatComposer
          canvasId={canvasId}
          status={status}
          isTaskMode={isTaskMode}
          onSend={onSend}
          onStop={onStop}
        />
      ) : null}

      <Dialog
        open={parameterDialogOpen}
        onOpenChange={onParameterDialogOpenChange}
      >
        <DialogContent size="xl" closeOnOverlayClick={false}>
          <DialogHeader>
            <DialogTitle>填写 Begin 输入</DialogTitle>
            <DialogDescription>
              Explore 首次发送前需要补齐当前 Agent 的 Begin 参数。
            </DialogDescription>
          </DialogHeader>
          <div className="px-space-lg pb-space-lg">
            <SectionCard padding="default">
              <DebugContent
                canvasId={canvasId}
                parameters={beginInputs}
                ok={onParametersOk}
                isNext={false}
                loading={status === AgentRuntimeStatus.RUNNING}
                btnText="确认并发送"
                className="min-h-0"
                maxHeight="max-h-[60vh]"
              />
            </SectionCard>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
