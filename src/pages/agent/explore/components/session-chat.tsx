import { useTranslation } from 'react-i18next'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
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
  sessionError: boolean
  onRetrySession: () => void
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
  sessionError,
  onRetrySession,
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
  const { t } = useTranslation()
  return (
    <section className="bg-surface-primary flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1">
        {sessionError ? (
          <PageErrorState
            scene={AppScene.SPLIT_DETAIL}
            title={t('agent.explore.loadFailed')}
            description={t('agent.explore.loadFailedDescription')}
            retryLabel={t('common.retry')}
            onRetry={onRetrySession}
          />
        ) : loadingSession ? (
          <PageLoadingState
            scene={AppScene.SPLIT_DETAIL}
            title={t('agent.explore.loading')}
            description={t('agent.explore.loadingDescription')}
          />
        ) : !active ? (
          <PageEmptyState
            scene={AppScene.SPLIT_DETAIL}
            title={t('agent.explore.selectSession')}
            description={t('agent.explore.selectSessionDescription')}
          />
        ) : messages.length === 0 ? (
          <PageEmptyState
            scene={AppScene.SPLIT_DETAIL}
            title={t('agent.explore.noMessages')}
            description={t('agent.explore.noMessagesDescription')}
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

      {active && !loadingSession && !sessionError ? (
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
            <DialogTitle>{t('agent.explore.beginInputs')}</DialogTitle>
            <DialogDescription>
              {t('agent.explore.beginInputsDescription')}
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
                btnText={t('agent.explore.confirmSend')}
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
