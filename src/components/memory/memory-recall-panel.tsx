import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Search, SlidersHorizontal } from 'lucide-react'
import { memoryAPI } from '@/api/memory'
import { memoryKeys } from '@/hooks/use-memory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { MemoryTypeBadge } from './memory-labels'
import type { MemoryMessage } from '@/types/memory'

export function MemoryRecallPanel({
  memoryId,
  open,
  onOpenChange,
  onInspect,
}: {
  memoryId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onInspect: (message: MemoryMessage) => void
}) {
  const { t } = useTranslation()
  const [question, setQuestion] = useState('')
  const [threshold, setThreshold] = useState(0.2)
  const [submitted, setSubmitted] = useState<{
    query: string
    similarity_threshold: number
  } | null>(null)
  const result = useQuery({
    queryKey: [...memoryKeys.messages(memoryId), 'recall', submitted],
    queryFn: ({ signal }) =>
      memoryAPI.message.search(
        {
          memory_id: [memoryId],
          query: submitted!.query,
          similarity_threshold: submitted!.similarity_threshold,
          top_n: 5,
        },
        signal,
      ),
    enabled: open && !!submitted,
    retry: false,
    refetchOnWindowFocus: false,
  })
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-xl"
        closeLabel={t('common.close')}
      >
        <SheetHeader className="pr-space-3xl border-b border-border-subtle p-space-lg">
          <SheetTitle>{t('memory.workspace.testRecall')}</SheetTitle>
          <SheetDescription>
            {t('memory.workspace.recallDescription')}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto p-space-lg">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              if (question.trim()) {
                const next = {
                  query: question.trim(),
                  similarity_threshold: threshold,
                }
                if (
                  submitted?.query === next.query &&
                  submitted.similarity_threshold === threshold
                )
                  void result.refetch()
                else setSubmitted(next)
              }
            }}
            className="space-y-space-base"
          >
            <Label htmlFor="memory-recall-query">
              {t('memory.workspace.recallQuestion')}
            </Label>
            <div className="flex gap-space-sm">
              <Input
                id="memory-recall-query"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t('memory.workspace.recallPlaceholder')}
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={!question.trim() || result.isFetching}
              >
                <Search className="size-icon-sm" />
                {t('memory.workspace.recall')}
              </Button>
            </div>
            <details className="text-xs text-text-secondary">
              <summary className="cursor-pointer">
                <SlidersHorizontal className="mr-space-xs inline size-icon-xs" />
                {t('memory.workspace.recallOptions')}
              </summary>
              <div className="mt-space-base flex items-center justify-between gap-space-base">
                <Label htmlFor="recall-threshold">
                  {t('memory.workspace.threshold')}
                </Label>
                <Input
                  id="recall-threshold"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-24"
                  value={threshold}
                  onChange={(e) =>
                    setThreshold(
                      Math.min(1, Math.max(0, Number(e.target.value))),
                    )
                  }
                />
              </div>
            </details>
          </form>
          <div
            className="mt-space-xl"
            aria-live="polite"
            aria-busy={result.isFetching}
          >
            {!submitted ? (
              <PageEmptyState
                title={t('memory.workspace.recallReady')}
                description={t('memory.workspace.recallBoundary')}
                icon={<Search className="size-icon-lg" />}
              />
            ) : result.isFetching ? (
              <PageLoadingState />
            ) : result.isError ? (
              <PageErrorState
                description={t('memory.workspace.recallError')}
                onRetry={() => result.refetch()}
              />
            ) : (
              <>
                <p className="mb-space-base text-xs text-text-secondary">
                  {t('memory.workspace.recallResults', {
                    count: result.data?.length ?? 0,
                    query: submitted.query,
                  })}
                </p>
                {!result.data?.length ? (
                  <PageEmptyState
                    title={t('memory.workspace.noRecall')}
                    description={t('memory.workspace.noRecallDescription')}
                  />
                ) : (
                  <div className="space-y-space-base">
                    {result.data.map((message, index) => (
                      <button
                        key={`${message.memory_id}-${message.message_id}`}
                        onClick={() => {
                          onOpenChange(false)
                          onInspect(message)
                        }}
                        className="block w-full space-y-space-sm rounded-radius-xl border border-border-subtle bg-background-surface p-space-base text-left hover:border-border-default focus-visible:ring-2 focus-visible:ring-state-focus"
                      >
                        <div className="flex items-center justify-between gap-space-sm">
                          <div className="flex items-center gap-space-sm">
                            <span className="text-xs text-text-tertiary">
                              {index + 1}
                            </span>
                            <MemoryTypeBadge type={message.message_type} />
                          </div>
                          <ArrowUpRight className="size-icon-sm text-text-tertiary" />
                        </div>
                        <p className="line-clamp-5 text-sm leading-relaxed break-words whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-space-lg text-xs leading-relaxed text-text-tertiary">
                  {t('memory.workspace.recallBoundary')}
                </p>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
