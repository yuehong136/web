import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bug, Maximize2, Minimize2, RotateCcw } from 'lucide-react'
import { StudioPanelShell } from '@/components/patterns'
import { ChatScrollViewport } from '@/components/patterns/chat/chat-scroll-viewport'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ChatComposer } from '@/components/chat/chat-composer'
import { ModelIdentity } from '@/components/models/model-identity'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import { PreviewThread } from './preview-thread'

type PreviewBindings = Pick<
  CreateAppPageController,
  | 'savedConfig'
  | 'isDirty'
  | 'previewStale'
  | 'requiredVariables'
  | 'saving'
  | 'previewMessages'
  | 'inputValue'
  | 'setInputValue'
  | 'isStreaming'
  | 'status'
  | 'runDetails'
  | 'handleSendPreviewMessage'
  | 'handleStopOutput'
  | 'handleRetryPreview'
  | 'handleSaveAndPreview'
>
export interface PreviewPaneProps extends PreviewBindings {
  onReset: () => void
  focused: boolean
  onFocus: () => void
}
export function PreviewPane(props: PreviewPaneProps) {
  const {
    savedConfig,
    isDirty,
    previewStale,
    requiredVariables,
    saving,
    previewMessages,
    inputValue,
    setInputValue,
    isStreaming,
    status,
    runDetails,
    handleSendPreviewMessage,
    handleStopOutput,
    handleRetryPreview,
    handleSaveAndPreview,
    onReset,
    focused,
    onFocus,
  } = props
  const { t } = useTranslation()
  const [stoppedMessageId, setStoppedMessageId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [reference, setReference] = useState<{
    chunk: ReferenceChunk
    references: ReferenceChunk[]
  } | null>(null)
  const viewReference = useCallback(
    (chunk: ReferenceChunk, references: ReferenceChunk[]) =>
      setReference({ chunk, references }),
    [],
  )
  const blocked =
    isDirty || !savedConfig || previewStale || requiredVariables || saving
  const send = (value: string) => {
    if (!blocked && !isStreaming) void handleSendPreviewMessage(value)
  }
  const requestStatus = status === 'failed' ? 'runFailed' : status
  const lastAssistant = previewMessages.findLastIndex(
    (message) => message.role === 'assistant',
  )
  const lastQuestion = previewMessages.findLast(
    (message) => message.role === 'user',
  )?.id
  return (
    <StudioPanelShell
      density="compact"
      title={
        <span className="flex flex-wrap items-center gap-space-sm">
          <span>{t('studio.editor.preview')}</span>
          <span className="text-xs font-normal text-text-secondary">
            {t(
              `studio.editor.${!savedConfig ? 'unsaved' : previewStale ? 'oldConfig' : 'savedConfig'}`,
            )}
          </span>
        </span>
      }
      actions={
        <>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('studio.editor.details')}
            title={t('studio.editor.details')}
            onClick={() => setDetailsOpen(true)}
          >
            <Bug className="size-icon-sm" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t('studio.editor.newChat')}
            title={t('studio.editor.newChat')}
            onClick={onReset}
            disabled={isStreaming || !savedConfig}
          >
            <RotateCcw className="size-icon-sm" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t(
              `studio.editor.${focused ? 'restore' : 'expandPreview'}`,
            )}
            title={t(`studio.editor.${focused ? 'restore' : 'expandPreview'}`)}
            onClick={onFocus}
          >
            {focused ? (
              <Minimize2 className="size-icon-sm" />
            ) : (
              <Maximize2 className="size-icon-sm" />
            )}
          </Button>
        </>
      }
      bodyClassName="relative flex min-h-0 flex-col"
    >
      {/* Same scrolling as Home and Explore: a new question is anchored near
          the top while its answer streams in below. */}
      <ChatScrollViewport
        anchorKey={lastQuestion}
        isStreaming={isStreaming}
        className="app-chat-area overscroll-contain p-space-base"
        contentClassName="mx-auto max-w-prose"
      >
        <PreviewThread
          messages={previewMessages}
          app={savedConfig ?? undefined}
          isStreaming={isStreaming}
          status={status}
          stoppedMessageId={stoppedMessageId}
          canRegenerate={!blocked}
          onRegenerate={handleRetryPreview}
          onViewReference={viewReference}
        />
        {(status === 'failed' || status === 'interrupted') && (
          <Alert variant="warning" className="mt-space-base space-y-space-sm">
            <output className="block text-sm">
              {t(`studio.editor.${requestStatus}`)}
            </output>
            <Button
              variant="outline"
              size="sm"
              disabled={blocked || isStreaming}
              onClick={handleRetryPreview}
            >
              {t('studio.editor.retry')}
            </Button>
          </Alert>
        )}
      </ChatScrollViewport>
      <div className="shrink-0 space-y-space-sm p-space-sm">
        {requiredVariables ? (
          <output className="text-xs leading-relaxed text-status-warning">
            {t('studio.editor.requiredVariables')}
          </output>
        ) : isDirty || !savedConfig ? (
          <div className="space-y-space-sm">
            <p className="text-xs leading-relaxed text-text-secondary">
              {t('studio.editor.dirtyNotice')} {t('studio.editor.saveEffect')}
            </p>
            <Button
              className="h-auto w-full whitespace-normal"
              size="sm"
              variant="outline"
              loading={saving}
              disabled={saving || isStreaming}
              onClick={() => {
                void handleSaveAndPreview()
              }}
            >
              {t('studio.editor.saveAndPreview')}
            </Button>
          </div>
        ) : previewStale ? (
          <div className="space-y-space-sm">
            <p className="text-xs text-text-secondary">
              {t('studio.editor.staleNotice')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={isStreaming}
            >
              {t('studio.editor.newChat')}
            </Button>
          </div>
        ) : null}
        <ChatComposer
          value={inputValue}
          onChange={(value) => setInputValue(value)}
          placeholder={t('studio.editor.messagePlaceholder')}
          onSubmit={send}
          state={
            isStreaming
              ? {
                  kind: 'running',
                  stop: () => {
                    setStoppedMessageId(
                      previewMessages[lastAssistant]?.id ?? null,
                    )
                    handleStopOutput()
                  },
                }
              : blocked
                ? { kind: 'blocked' }
                : { kind: 'ready' }
          }
          labels={{
            submit: t('studio.editor.send'),
            stop: t('studio.editor.stop'),
          }}
          slots={{
            hint: isStreaming
              ? t(`studio.editor.${status}`)
              : t('studio.editor.keyboardHint'),
          }}
          autoSize={{ minRows: 2, maxRows: 6 }}
        />
      </div>
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent
          className="flex flex-col overflow-y-auto"
          closeLabel={t('common.close')}
        >
          <SheetHeader>
            <SheetTitle>{t('studio.editor.details')}</SheetTitle>
            <SheetDescription>
              {t('studio.editor.detailsDescription')}
            </SheetDescription>
          </SheetHeader>
          {runDetails ? (
            <dl className="space-y-space-base py-space-lg">
              {[
                [
                  t('studio.editor.requestModel'),
                  <ModelIdentity
                    {...(runDetails.modelIdentity ?? {
                      reference: runDetails.model,
                    })}
                  />,
                ],
                [
                  t('studio.editor.duration'),
                  `${(runDetails.elapsedMs / 1000).toFixed(2)} s`,
                ],
                [t('studio.editor.knowledgeCount'), runDetails.knowledgeCount],
                [
                  t('studio.editor.references'),
                  previewMessages[lastAssistant]?.references?.length ?? 0,
                ],
                [
                  t('studio.editor.preview'),
                  t(
                    `studio.editor.${runDetails.status === 'failed' ? 'runFailed' : runDetails.status}`,
                  ),
                ],
                ...(
                  [
                    'temperature',
                    'top_p',
                    'presence_penalty',
                    'frequency_penalty',
                    'max_tokens',
                  ] as const
                ).map((field) => [
                  t(`studio.editor.${field}`),
                  runDetails.overrides[field] ??
                    t('studio.editor.modelDefault'),
                ]),
              ].map(([label, value]) => (
                <div key={String(label)} className="space-y-space-xs">
                  <dt className="text-xs text-text-secondary">{label}</dt>
                  <dd className="text-sm break-words text-text-primary">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="py-space-lg text-sm text-text-secondary">
              {t('studio.editor.noRun')}
            </p>
          )}
        </SheetContent>
      </Sheet>
      <ReferenceDetailSheet
        open={!!reference}
        onOpenChange={(open) => {
          if (!open) setReference(null)
        }}
        chunk={reference?.chunk ?? null}
        allChunks={reference?.references ?? []}
      />
    </StudioPanelShell>
  )
}
