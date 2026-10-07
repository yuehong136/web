import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ArrowDown,
  Bug,
  ArrowUp,
  Copy,
  Maximize2,
  Minimize2,
  RotateCcw,
  Square,
} from 'lucide-react'
import { StudioPanelShell } from '@/components/patterns'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import type { CreateAppPageController } from '../hooks/use-create-app-page'
import { renderMarkdown } from '../utils'
import { PreviewAnswer } from './preview-answer'

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
  const scrollRef = useRef<HTMLDivElement>(null)
  const following = useRef(true)
  const [showBottom, setShowBottom] = useState(false)
  const composing = useRef(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [reference, setReference] = useState<{
    chunk: ReferenceChunk
    references: ReferenceChunk[]
  } | null>(null)
  const blocked =
    isDirty || !savedConfig || previewStale || requiredVariables || saving
  useEffect(() => {
    const element = scrollRef.current
    if (element && following.current) element.scrollTop = element.scrollHeight
  }, [previewMessages, status])
  const send = () => {
    if (!blocked && !isStreaming && !composing.current)
      void handleSendPreviewMessage(inputValue)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      !composing.current &&
      event.keyCode !== 229
    ) {
      event.preventDefault()
      send()
    }
  }
  const requestStatus = status === 'failed' ? 'runFailed' : status
  const lastAssistant = previewMessages.findLastIndex(
    (message) => message.role === 'assistant',
  )
  return (
    <StudioPanelShell
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
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-space-base"
        onScroll={() => {
          const element = scrollRef.current
          if (!element) return
          following.current =
            element.scrollHeight - element.scrollTop - element.clientHeight < 64
          setShowBottom(!following.current)
        }}
      >
        <div
          className="mx-auto max-w-prose space-y-space-lg"
          aria-live="polite"
          aria-busy={isStreaming}
        >
          {previewMessages.map((message, index) => {
            const active = isStreaming && index === lastAssistant
            const user = message.role === 'user'
            return (
              <div
                key={message.id}
                className={`flex flex-col gap-space-sm ${user ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={
                    user
                      ? 'max-w-full rounded-radius-lg bg-background-subtle px-space-base py-space-sm'
                      : 'w-full min-w-0 text-sm leading-relaxed text-text-primary'
                  }
                >
                  {message.thinking && (
                    <details className="mb-space-sm text-xs text-text-secondary">
                      <summary className="cursor-pointer py-space-xs">
                        {t('studio.editor.thinking')}
                      </summary>
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {message.thinking}
                      </p>
                    </details>
                  )}
                  {user ? (
                    renderMarkdown(message.content)
                  ) : (
                    <PreviewAnswer
                      content={message.content}
                      references={message.references}
                      isStreaming={active}
                      onViewReference={(chunk, references) =>
                        setReference({ chunk, references })
                      }
                    />
                  )}
                  {active && !message.content && !message.thinking && (
                    <p className="text-sm text-text-secondary">
                      {t('studio.editor.streaming')}
                    </p>
                  )}
                </div>
                {!user &&
                  !active &&
                  message.content &&
                  !message.id.startsWith('prologue-') && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('studio.editor.copy')}
                      title={t('studio.editor.copy')}
                      onClick={() => {
                        void copyToClipboardWithFeedback(
                          message.content,
                          t('common.copied'),
                          t('common.copyFailed'),
                        )
                      }}
                    >
                      <Copy className="size-icon-sm" />
                    </Button>
                  )}
              </div>
            )
          })}
          {(status === 'failed' || status === 'interrupted') && (
            <Alert variant="warning" className="space-y-space-sm">
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
        </div>
      </div>
      {showBottom && (
        <div className="flex shrink-0 justify-center py-space-xs">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const element = scrollRef.current
              if (element) element.scrollTop = element.scrollHeight
              following.current = true
              setShowBottom(false)
            }}
          >
            <ArrowDown className="mr-space-xs size-icon-sm" />
            {t('studio.editor.bottom')}
          </Button>
        </div>
      )}
      <div className="shrink-0 space-y-space-sm border-t border-border-subtle p-space-base">
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
        <div className="relative">
          <Textarea
            aria-label={t('studio.editor.messagePlaceholder')}
            placeholder={t('studio.editor.messagePlaceholder')}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={onKeyDown}
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={() => {
              composing.current = false
            }}
            rows={3}
            className="max-h-48 min-h-24 resize-none pr-space-2xl"
          />
          <div className="absolute right-space-sm bottom-space-sm">
            <Button
              size="icon-sm"
              variant={isStreaming ? 'outline' : 'default'}
              disabled={!isStreaming && (blocked || !inputValue.trim())}
              aria-label={t(`studio.editor.${isStreaming ? 'stop' : 'send'}`)}
              title={t(`studio.editor.${isStreaming ? 'stop' : 'send'}`)}
              onClick={isStreaming ? handleStopOutput : send}
            >
              {isStreaming ? (
                <Square className="size-icon-sm" />
              ) : (
                <ArrowUp className="size-icon-sm" />
              )}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-space-xs text-xs text-text-secondary">
          <span>
            {isStreaming
              ? t(`studio.editor.${status}`)
              : t('studio.editor.keyboardHint')}
          </span>
        </div>
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
                [t('studio.editor.requestModel'), runDetails.model],
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
