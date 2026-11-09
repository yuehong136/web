import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Copy, MessageSquare, Braces } from 'lucide-react'
import { memoryAPI } from '@/api/memory'
import { memoryKeys } from '@/hooks/use-memory'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { MemoryStatusBadge, MemoryTypeBadge } from './memory-labels'
import { parseMemoryConversation } from './memory-lifecycle'
import type { MemoryMessage } from '@/types/memory'

export function MemoryMessageInspector({
  memoryId,
  message,
  onClose,
  onCloseAutoFocus,
}: {
  memoryId: string
  message: MemoryMessage | null
  onClose: () => void
  onCloseAutoFocus?: (event: Event) => void
}) {
  const { t } = useTranslation()
  const { copyWithFeedback } = useCopyFeedback()
  const query = useQuery({
    queryKey: memoryKeys.messageContent(
      memoryId,
      String(message?.message_id ?? ''),
    ),
    queryFn: () => memoryAPI.message.getContent(memoryId, message!.message_id),
    enabled: !!message,
  })
  const content = query.data?.content ?? message?.content ?? ''
  const parsed = parseMemoryConversation(content)
  const vector = query.data?.content_embed
  return (
    <Sheet
      open={!!message}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SheetContent
        onCloseAutoFocus={onCloseAutoFocus}
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        closeLabel={t('common.close')}
      >
        <SheetHeader className="pr-space-3xl border-b border-border-subtle p-space-lg">
          <SheetTitle>{t('memory.workspace.inspect')}</SheetTitle>
          <SheetDescription>
            {t('memory.workspace.inspectDescription')}
          </SheetDescription>
        </SheetHeader>
        {message && (
          <div className="min-h-0 flex-1 space-y-space-lg overflow-auto p-space-lg">
            <div className="flex flex-wrap gap-space-sm">
              <MemoryTypeBadge type={message.message_type} />
              <MemoryStatusBadge message={message} />
            </div>
            <dl className="grid grid-cols-2 gap-space-base text-xs">
              <div>
                <dt className="text-text-tertiary">
                  {t('memory.messages.validDate')}
                </dt>
                <dd className="mt-space-xs text-text-primary">
                  {message.valid_at || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-tertiary">
                  {t('memory.messages.forgetAt')}
                </dt>
                <dd className="mt-space-xs text-text-primary">
                  {message.forget_at && message.forget_at !== 'None'
                    ? message.forget_at
                    : '—'}
                </dd>
              </div>
              <div className="col-span-2 min-w-0">
                <dt className="text-text-tertiary">
                  {t('memory.messages.sessionId')}
                </dt>
                <dd className="mt-space-xs flex items-center gap-space-sm font-mono break-all">
                  {message.session_id}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('common.copy')}
                    onClick={() =>
                      copyWithFeedback(message.session_id, 'inspector-session')
                    }
                  >
                    <Copy className="size-icon-sm" />
                  </Button>
                </dd>
              </div>
            </dl>
            {query.isPending ? (
              <PageLoadingState />
            ) : query.isError ? (
              <PageErrorState
                description={t('memory.messages.loadContentFailed')}
                onRetry={() => query.refetch()}
              />
            ) : (
              <>
                {message.message_type === 'raw' && parsed.user ? (
                  <div className="space-y-space-base">
                    <section className="rounded-radius-lg bg-background-subtle p-space-base">
                      <h3 className="mb-space-sm text-xs font-medium text-text-secondary">
                        {t('memory.messages.userInput')}
                      </h3>
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {parsed.user}
                      </p>
                    </section>
                    <section>
                      <h3 className="mb-space-sm flex items-center gap-space-sm text-xs font-medium text-text-secondary">
                        <MessageSquare className="size-icon-sm" />
                        {t('memory.messages.agentResponse')}
                      </h3>
                      <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                        {parsed.answer}
                      </p>
                    </section>
                  </div>
                ) : (
                  <p className="text-base leading-relaxed break-words whitespace-pre-wrap">
                    {content || t('memory.workspace.noContent')}
                  </p>
                )}
                <details className="rounded-radius-lg border border-border-subtle p-space-base">
                  <summary className="cursor-pointer text-xs text-text-secondary">
                    {t('memory.workspace.technicalDetails')}
                  </summary>
                  <div className="mt-space-base space-y-space-base">
                    <p className="text-xs text-text-tertiary">
                      {t('memory.workspace.messageId')}: {message.message_id} ·{' '}
                      {message.source_id ?? '—'}
                    </p>
                    <pre className="max-h-64 overflow-auto text-xs break-words whitespace-pre-wrap">
                      {content}
                    </pre>
                    {vector && (
                      <div className="text-xs text-text-secondary">
                        <Braces className="mb-space-xs size-icon-sm" />
                        <pre className="max-h-32 overflow-auto break-all whitespace-pre-wrap">
                          {Array.isArray(vector)
                            ? JSON.stringify(vector)
                            : vector}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
