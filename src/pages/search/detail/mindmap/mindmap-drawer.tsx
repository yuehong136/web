import React, { memo, useEffect, useMemo, useRef } from 'react'
import {
  BrainCircuit,
  Maximize2,
  Minimize,
  Minimize2,
  RefreshCw,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
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

const SearchMindmapDrawer: React.FC<SearchMindmapDrawerProps> = ({
  open,
  onOpenChange,
  question,
  kbIds,
  searchId,
  isShareMode = false,
  fallbackChunks = [],
}) => {
  const treeRef = useRef<IndentedTreeRef | null>(null)
  const { mindmap, error, progress, isLoading, request, refresh } =
    useSearchMindmap()

  const shouldRequest = useMemo(
    () => open && question.trim() && kbIds.length > 0,
    [kbIds.length, open, question],
  )

  useEffect(() => {
    if (!shouldRequest) return
    request({
      question: question.trim(),
      kbIds,
      searchId,
      isShareMode,
    })
  }, [isShareMode, kbIds, question, request, searchId, shouldRequest])

  useEffect(() => {
    if (!open) return
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onOpenChange, open])

  const fallbackTree = useMemo(
    () => buildFallbackMindmapTree(question, fallbackChunks),
    [fallbackChunks, question],
  )
  const treeData = mindmap || fallbackTree

  if (!open) return null

  return (
    <aside className="bg-surface-primary h-full w-[480px] shrink-0 border-l border-border-default lg:w-[520px] xl:w-[580px]">
      <div className="flex h-full min-h-0 flex-col">
        <header className="px-space-base py-space-sm bg-surface-primary shrink-0 border-b border-border-default">
          <div className="gap-space-sm flex items-start justify-between">
            <div className="min-w-0">
              <h3 className="gap-space-sm flex items-center text-base font-semibold text-text-primary">
                <span className="rounded-radius-md bg-surface-accent-subtle inline-flex h-8 w-8 items-center justify-center text-text-accent">
                  <BrainCircuit className="h-4 w-4" />
                </span>
                问题思维导图
              </h3>
              <p className="mt-space-xs line-clamp-2 text-xs text-text-tertiary">
                {question || '当前轮次暂无问题内容'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-radius-md hover:bg-surface-secondary inline-flex h-8 w-8 items-center justify-center text-text-tertiary transition-colors hover:text-text-primary"
              aria-label="关闭思维导图"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-space-sm gap-space-xs flex flex-wrap items-center">
            <Button
              variant="outline"
              size="sm"
              className="px-space-sm h-8"
              onClick={() => treeRef.current?.fitView()}
            >
              <Minimize className="mr-1 h-3.5 w-3.5" />
              适配视图
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-space-sm h-8"
              onClick={() => treeRef.current?.expandAll()}
            >
              <Maximize2 className="mr-1 h-3.5 w-3.5" />
              全部展开
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-space-sm h-8"
              onClick={() => treeRef.current?.collapseAll()}
            >
              <Minimize2 className="mr-1 h-3.5 w-3.5" />
              全部折叠
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-space-sm h-8"
              onClick={refresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`mr-1 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
              />
              重新生成
            </Button>
          </div>
        </header>

        <div className="p-space-base min-h-0 flex-1">
          {isLoading ? (
            <div className="rounded-radius-xl bg-surface-secondary p-space-base h-full border border-border-default">
              <p className="mb-space-sm text-xs text-text-tertiary">
                正在分析问题结构并生成脑图...
              </p>
              <Progress value={progress || 20} className="h-1.5" />
              <div className="mt-space-base space-y-space-sm">
                <div className="rounded-radius-md bg-surface-primary h-6 animate-pulse" />
                <div className="rounded-radius-md bg-surface-primary h-6 w-4/5 animate-pulse" />
                <div className="rounded-radius-md bg-surface-primary h-6 w-3/5 animate-pulse" />
              </div>
            </div>
          ) : null}

          {!isLoading && !treeData ? (
            <div className="rounded-radius-xl bg-surface-secondary p-space-lg flex h-full items-center justify-center border border-border-default">
              <p className="text-sm text-text-tertiary">
                当前暂无可展示的思维导图数据。
              </p>
            </div>
          ) : null}

          {!isLoading && treeData ? (
            <div className="rounded-radius-xl bg-surface-secondary p-space-sm h-full overflow-hidden border border-border-default">
              {error ? (
                <div className="mb-space-xs rounded-radius-md px-space-sm py-space-xs border border-status-warning bg-status-warning-subtle text-xs text-text-secondary">
                  脑图接口暂不可用，当前展示基于检索结果的本地结构图。
                </div>
              ) : null}
              <div className={error ? 'h-[calc(100%-32px)]' : 'h-full'}>
                <IndentedTree ref={treeRef} data={treeData} visible={open} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  )
}

export default memo(SearchMindmapDrawer)
