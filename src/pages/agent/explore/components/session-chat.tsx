import { EntityAvatar } from '@/components/patterns/entity-avatar'
import {
  EmptyStart,
  type EmptyStartPath,
} from '@/components/patterns/empty-start'
import { useCurrentUserAvatar } from '@/hooks/use-current-user-avatar'
import { useTranslation } from 'react-i18next'
import {
  AppScene,
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
import { ChatScrollViewport } from '@/components/patterns/chat/chat-scroll-viewport'
import { MessageSquarePlus, Pencil } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
import type { RuntimeChatDraft } from '../../components/runtime-chat/types'

interface SessionChatProps {
  canvasId: string
  agentName?: string
  agentDescription?: string
  /** The agent's avatar, shown on the first-use start screen. */
  agentAvatar?: string
  /** The canvas editor, the second start path when the reader may edit. */
  editorPath?: string
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
  /** The composer draft, owned by the page so it survives remounts. */
  draft: RuntimeChatDraft
  onDraftChange: (update: (draft: RuntimeChatDraft) => RuntimeChatDraft) => void
  onSend: (request: ExploreSendRequest) => Promise<void>
  onStop: () => Promise<void>
}

export function SessionChat({
  canvasId,
  agentName,
  agentDescription,
  agentAvatar,
  editorPath,
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
  draft,
  onDraftChange,
  onSend,
  onStop,
}: SessionChatProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useCurrentUserAvatar()
  const startPaths: EmptyStartPath[] = []
  if (onCreateSession)
    startPaths.push({
      key: 'new-chat',
      icon: <MessageSquarePlus />,
      iconClassName: 'bg-components-avatar-6-bg text-components-avatar-6-text',
      title: t('agent.explore.newChat'),
      description: t('agent.explore.start.newChatDescription'),
      cta: t('agent.explore.start.newChatCta'),
      onSelect: onCreateSession,
      primary: true,
    })
  if (editorPath)
    startPaths.push({
      key: 'edit-agent',
      icon: <Pencil />,
      iconClassName: 'bg-components-avatar-7-bg text-components-avatar-7-text',
      title: t('agent.explore.editAgent'),
      description: t('agent.explore.start.editDescription'),
      cta: t('agent.explore.start.editCta'),
      onSelect: () => navigate(editorPath),
    })
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
        className={cn(
          'min-h-0',
          readyEmpty ? 'mt-auto shrink-0' : 'flex flex-1 flex-col',
        )}
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
          <EmptyStart
            className="min-h-0 flex-1 overflow-auto"
            illustration={
              <EntityAvatar
                name={agentName}
                src={agentAvatar}
                seed={canvasId}
                badge="agent"
                size="2xl"
              />
            }
            title={agentName || t('agent.explore.selectSession')}
            description={
              agentDescription || t('agent.explore.selectSessionDescription')
            }
            paths={startPaths}
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
          <ChatScrollViewport
            anchorKey={
              messages.findLast((message) => message.role === 'user')?.id
            }
            isStreaming={status === AgentRuntimeStatus.RUNNING}
            className="h-full"
          >
            <RuntimeChatMessageList
              canvasId={canvasId}
              messages={messages}
              userAvatar={<EntityAvatar {...user} shape="circle" />}
              userId={user.seed}
              status={status}
              className="max-w-3xl"
              onSubmitAwaitingInputs={onSubmitAwaitingInputs}
              onXCardAction={onXCardAction}
            />
          </ChatScrollViewport>
        )}
      </div>

      {active && !loadingSession && !sessionError ? (
        <div className={cn('shrink-0', readyEmpty && 'mb-auto')}>
          <RuntimeChatComposer
            canvasId={canvasId}
            status={status}
            disabled={Boolean(messages.at(-1)?.awaitingInputs?.length)}
            isTaskMode={isTaskMode}
            className="border-t-0 px-space-md md:px-space-lg"
            contentClassName="max-w-3xl"
            placeholder={t(
              isTaskMode
                ? 'agent.explore.taskPlaceholder'
                : 'agent.explore.messagePlaceholder',
            )}
            draft={draft}
            onDraftChange={onDraftChange}
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
