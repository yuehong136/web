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
import { Button } from '@/components/ui/button'
import { Bot, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
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
  agentName?: string
  agentDescription?: string
  onCreateSession?: () => void
  active: boolean
  isTaskMode: boolean
  loadingSession: boolean
  sessionError: boolean
  sourceError?: string
  runError?: string
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
  agentName,
  agentDescription,
  onCreateSession,
  active,
  isTaskMode,
  loadingSession,
  sessionError,
  sourceError,
  runError,
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
  const readyEmpty =
    active && !loadingSession && !sessionError && messages.length === 0
  return (
    <section
      className={cn(
        'flex h-full min-h-0 flex-col bg-components-console-surface',
        readyEmpty && 'overflow-auto',
      )}
    >
      {runError &&
      status === AgentRuntimeStatus.ERROR &&
      !messages.some((message) => message.error) ? (
        <p role="alert" className="p-space-md text-sm text-status-error">
          {runError}
        </p>
      ) : null}
      <div
        className={cn('min-h-0', readyEmpty ? 'mt-auto shrink-0' : 'flex-1')}
      >
        {sessionError ? (
          <PageErrorState
            scene={AppScene.SPLIT_DETAIL}
            title={t('agent.explore.loadFailed')}
            description={
              sourceError || t('agent.explore.loadFailedDescription')
            }
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
            icon={<Bot className="size-icon-lg" />}
            title={agentName || t('agent.explore.selectSession')}
            description={
              agentDescription || t('agent.explore.selectSessionDescription')
            }
            action={
              onCreateSession ? (
                <Button onClick={onCreateSession}>
                  <Plus className="size-icon-sm" />
                  {t('agent.explore.newChat')}
                </Button>
              ) : undefined
            }
          />
        ) : messages.length === 0 ? (
          <header className="mx-auto w-full max-w-3xl px-space-lg pt-space-2xl pb-space-md text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance text-text-primary sm:text-3xl">
              {t(
                isTaskMode
                  ? 'agent.explore.taskWelcome'
                  : 'agent.explore.welcome',
                { name: agentName || t('agent.agent') },
              )}
            </h2>
            <p className="mx-auto mt-space-sm max-w-xl text-sm leading-relaxed text-text-secondary">
              {agentDescription || t('agent.explore.noMessagesDescription')}
            </p>
          </header>
        ) : (
          <ScrollArea
            className="h-full"
            aria-live="polite"
            aria-busy={status === AgentRuntimeStatus.RUNNING}
          >
            <RuntimeChatMessageList
              canvasId={canvasId}
              messages={messages}
              status={status}
              className="max-w-3xl"
              onSubmitAwaitingInputs={onSubmitAwaitingInputs}
              onXCardAction={onXCardAction}
            />
          </ScrollArea>
        )}
      </div>

      {active && !loadingSession && !sessionError ? (
        <div className={cn('shrink-0', readyEmpty && 'mb-auto')}>
          <RuntimeChatComposer
            canvasId={canvasId}
            status={status}
            isTaskMode={isTaskMode}
            className="border-t-0 px-space-md md:px-space-lg"
            contentClassName="max-w-3xl"
            placeholder={t(
              isTaskMode
                ? 'agent.explore.taskPlaceholder'
                : 'agent.explore.messagePlaceholder',
            )}
            onSend={onSend}
            onStop={onStop}
          />
          <p className="px-space-md pb-space-base text-center text-xs text-text-secondary">
            {t('agent.explore.composerHint')}
          </p>
        </div>
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
