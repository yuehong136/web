import { memo, useEffect, useMemo, useRef } from 'react'
import { Maximize2, Minimize, Minimize2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { ContextPanel } from '@/components/patterns/context-panel'
import {
  PageLoadingState,
  PageEmptyState,
} from '@/components/patterns/page-states'
import { useReturnFocus } from '@/components/chat/use-return-focus'
import IndentedTree, { type IndentedTreeRef } from './indented-tree'
import { useSearchMindmap } from './use-search-mindmap'
import { buildFallbackMindmapTree, type MindmapFallbackChunk } from './utils'

interface SearchMindmapDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  question: string
  kbIds: string[]
  searchId?: string
  isShareMode?: boolean
  fallbackChunks?: MindmapFallbackChunk[]
}

function SearchMindmapDrawer({
  open,
  onOpenChange,
  question,
  kbIds,
  searchId,
  isShareMode = false,
  fallbackChunks = [],
}: SearchMindmapDrawerProps) {
  const { t } = useTranslation()
  const tree = useRef<IndentedTreeRef>(null)
  const { mindmap, error, isLoading, request, refresh, cancel } =
    useSearchMindmap()
  const returnFocus = useReturnFocus()
  useEffect(() => {
    if (open && question.trim() && kbIds.length)
      void request({ question, kbIds, searchId, isShareMode })
    if (!open) cancel()
  }, [open, question, kbIds, searchId, isShareMode, request, cancel])
  const fallbackTree = useMemo(
    () => buildFallbackMindmapTree(question, fallbackChunks),
    [fallbackChunks, question],
  )
  const data = mindmap ?? fallbackTree
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="h-full w-full overflow-hidden bg-background-surface p-0 sm:max-w-2xl"
        {...returnFocus}
      >
        <ContextPanel
          width="full"
          scroll="none"
          onClose={() => onOpenChange(false)}
          closeLabel={t('searchPage.workspace.closeMindmap')}
          title={
            <SheetTitle asChild>
              <span>{t('searchPage.workspace.mapTitle')}</span>
            </SheetTitle>
          }
          description={
            <SheetDescription className="line-clamp-2">
              {question}
            </SheetDescription>
          }
          footer={
            <div className="flex flex-wrap gap-space-xs">
              <Button
                variant="outline"
                size="sm"
                onClick={() => tree.current?.fitView()}
                disabled={!data || isLoading}
              >
                <Minimize className="size-icon-sm" />
                {t('searchPage.workspace.fitView')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => tree.current?.expandAll()}
                disabled={!data || isLoading}
              >
                <Maximize2 className="size-icon-sm" />
                {t('searchPage.workspace.expandAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => tree.current?.collapseAll()}
                disabled={!data || isLoading}
              >
                <Minimize2 className="size-icon-sm" />
                {t('searchPage.workspace.collapseAll')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void refresh()}
                disabled={isLoading}
              >
                <RefreshCw className="size-icon-sm" />
                {t('searchPage.workspace.regenerate')}
              </Button>
            </div>
          }
        >
          {isLoading ? (
            <PageLoadingState
              title={t('searchPage.workspace.mapLoading')}
              description={null}
            />
          ) : data ? (
            <div className="flex h-full min-h-0 flex-col gap-space-base">
              {!mindmap && (
                <p
                  role="status"
                  className="rounded-radius-md bg-background-subtle p-space-base text-sm text-text-secondary"
                >
                  {t(error ?? 'searchPage.workspace.mapFallback')}{' '}
                  {error ? t('searchPage.workspace.mapFallback') : ''}
                </p>
              )}
              <div className="min-h-0 flex-1 overflow-hidden">
                <IndentedTree ref={tree} data={data} visible={open} />
              </div>
            </div>
          ) : (
            <PageEmptyState
              title={t(error ?? 'searchPage.workspace.mapEmpty')}
            />
          )}
        </ContextPanel>
      </SheetContent>
    </Sheet>
  )
}

export default memo(SearchMindmapDrawer)
