import React, { memo, useEffect, useMemo, useRef } from 'react'
import { BrainCircuit, Maximize2, Minimize, Minimize2, RefreshCw, X } from 'lucide-react'
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
  const { mindmap, error, progress, isLoading, request, refresh } = useSearchMindmap()

  const shouldRequest = useMemo(() => open && question.trim() && kbIds.length > 0, [kbIds.length, open, question])

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
    [fallbackChunks, question]
  )
  const treeData = mindmap || fallbackTree

  if (!open) return null

  return (
    <aside className="h-full w-[480px] lg:w-[520px] xl:w-[580px] shrink-0 border-l border-border-default bg-surface-primary">
      <div className="h-full min-h-0 flex flex-col">
        <header className="shrink-0 border-b border-border-default px-space-base py-space-sm bg-surface-primary">
          <div className="flex items-start justify-between gap-space-sm">
            <div className="min-w-0">
              <h3 className="flex items-center gap-space-sm text-text-primary text-base font-semibold">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-radius-md bg-surface-accent-subtle text-text-accent">
                  <BrainCircuit className="h-4 w-4" />
                </span>
                问题思维导图
              </h3>
              <p className="mt-space-xs text-xs text-text-tertiary line-clamp-2">
                {question || '当前轮次暂无问题内容'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-radius-md text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
              aria-label="关闭思维导图"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-space-sm flex flex-wrap items-center gap-space-xs">
            <Button variant="outline" size="sm" className="h-8 px-space-sm" onClick={() => treeRef.current?.fitView()}>
              <Minimize className="h-3.5 w-3.5 mr-1" />
              适配视图
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-space-sm" onClick={() => treeRef.current?.expandAll()}>
              <Maximize2 className="h-3.5 w-3.5 mr-1" />
              全部展开
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-space-sm" onClick={() => treeRef.current?.collapseAll()}>
              <Minimize2 className="h-3.5 w-3.5 mr-1" />
              全部折叠
            </Button>
            <Button variant="outline" size="sm" className="h-8 px-space-sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              重新生成
            </Button>
          </div>
        </header>

        <div className="flex-1 min-h-0 p-space-base">
          {isLoading ? (
            <div className="h-full rounded-radius-xl border border-border-default bg-surface-secondary p-space-base">
              <p className="text-xs text-text-tertiary mb-space-sm">正在分析问题结构并生成脑图...</p>
              <Progress value={progress || 20} className="h-1.5" />
              <div className="mt-space-base space-y-space-sm">
                <div className="h-6 rounded-radius-md bg-surface-primary animate-pulse" />
                <div className="h-6 rounded-radius-md bg-surface-primary animate-pulse w-4/5" />
                <div className="h-6 rounded-radius-md bg-surface-primary animate-pulse w-3/5" />
              </div>
            </div>
          ) : null}

          {!isLoading && !treeData ? (
            <div className="h-full rounded-radius-xl border border-border-default bg-surface-secondary p-space-lg flex items-center justify-center">
              <p className="text-sm text-text-tertiary">当前暂无可展示的思维导图数据。</p>
            </div>
          ) : null}

          {!isLoading && treeData ? (
            <div className="h-full rounded-radius-xl border border-border-default bg-surface-secondary p-space-sm overflow-hidden">
              {error ? (
                <div className="mb-space-xs rounded-radius-md border border-state-warning bg-state-warning-subtle px-space-sm py-space-xs text-xs text-text-secondary">
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
