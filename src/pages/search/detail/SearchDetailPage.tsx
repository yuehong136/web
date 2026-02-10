import React, { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RotateCcw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { useFetchSearchAppDetail } from '@/hooks/use-search-request'
import { useSearchStore } from '@/stores/search'
import { ROUTES } from '@/constants'
import { SearchExecutionPhase, type ChunkResult } from '@/types/search'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import SearchComposer from './components/search-composer'
import SearchTurnItem from './components/search-turn-item'
import SearchSettingsSheet from './components/SearchSettingsSheet'
import { useSearchExecution } from './hooks/useSearchExecution'
import { useSearchSettings } from './hooks/useSearchSettings'

const toReferenceChunk = (chunk: ChunkResult): ReferenceChunk => ({
  id: chunk.chunk_id,
  content: chunk.content_with_weight || chunk.highlight || chunk.text,
  document_id: chunk.doc_id,
  document_name: chunk.docnm_kwd,
  dataset_id: chunk.kb_id,
  image_id: chunk.img_id,
  positions: chunk.positions,
  similarity: chunk.similarity,
  vector_similarity: chunk.vector_similarity,
  term_similarity: chunk.term_similarity,
})

const phaseLabelMap: Record<SearchExecutionPhase, string> = {
  [SearchExecutionPhase.IDLE]: '空闲',
  [SearchExecutionPhase.RETRIEVING]: '检索中',
  [SearchExecutionPhase.SUMMARIZING]: '总结中',
  [SearchExecutionPhase.RELATED]: '生成相关问题',
  [SearchExecutionPhase.COMPLETE]: '完成',
  [SearchExecutionPhase.STOPPED]: '已停止',
  [SearchExecutionPhase.ERROR]: '错误',
}

export const SearchDetailPage: React.FC = () => {
  const navigate = useNavigate()
  const { settingsOpen, setSettingsOpen } = useSearchStore()
  const { searchApp, isLoading } = useFetchSearchAppDetail()
  const { turns, phase, isSearching, search, stop, clear } = useSearchExecution(searchApp)
  const { config, updateConfig, saveConfig, isSaving, isDirty } = useSearchSettings(searchApp)

  const [docFilterByTurnId, setDocFilterByTurnId] = useState<Record<string, string[]>>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ReferenceChunk | null>(null)
  const [selectedChunkList, setSelectedChunkList] = useState<ReferenceChunk[]>([])

  const kbCount = searchApp?.search_config?.kb_ids?.length || 0

  const handleSearch = useCallback(
    (query: string) => {
      search(query)
    },
    [search]
  )

  const handleClear = useCallback(() => {
    clear()
    setDocFilterByTurnId({})
  }, [clear])

  const handleOpenChunkDetail = useCallback((chunk: ChunkResult, chunks: ChunkResult[]) => {
    const mappedChunk = toReferenceChunk(chunk)
    const mappedChunks = chunks.map(toReferenceChunk)
    setSelectedChunk(mappedChunk)
    setSelectedChunkList(mappedChunks)
    setDetailOpen(true)
  }, [])

  const hasTurns = useMemo(() => turns.length > 0, [turns.length])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (!searchApp) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-space-sm">
        <p className="text-text-secondary">搜索应用不存在或已被删除</p>
        <Button variant="outline" onClick={() => navigate(ROUTES.SEARCH)}>
          返回列表
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background-subtle">
      <header className="shrink-0 border-b border-border-default bg-surface-primary px-space-base py-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm min-w-0">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate(ROUTES.SEARCH)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-text-primary truncate">{searchApp.name}</h2>
              <p className="text-xs text-text-tertiary">
                {kbCount} 个知识库 · 当前状态 {phaseLabelMap[phase] || phaseLabelMap[SearchExecutionPhase.IDLE]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasTurns ? (
              <Button variant="ghost" size="icon-sm" onClick={handleClear} title="清空当前会话">
                <RotateCcw className="h-4 w-4" />
              </Button>
            ) : null}
            <Button variant="ghost" size="icon-sm" onClick={() => setSettingsOpen(true)} title="设置">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-space-base py-space-base">
        {!hasTurns ? (
          <div className="h-full flex items-center justify-center">
            <div className="max-w-2xl text-center">
              <h3 className="text-2xl font-semibold text-text-primary">开始一次深度检索</h3>
              <p className="mt-space-sm text-sm text-text-secondary">
                输入问题后将同时执行 chunk 检索和 AI 总结，并生成下一步相关问题。
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-space-sm pb-space-base">
            {turns.map((turn, index) => (
              <SearchTurnItem
                key={turn.id}
                index={index}
                turn={turn}
                selectedDocIds={docFilterByTurnId[turn.id] || []}
                onDocFilterChange={(turnId, docIds) =>
                  setDocFilterByTurnId((prev) => ({ ...prev, [turnId]: docIds }))
                }
                onAskRelated={handleSearch}
                onViewChunkDetail={handleOpenChunkDetail}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="shrink-0 border-t border-border-default bg-surface-primary px-space-base py-space-sm">
        <div className="max-w-4xl mx-auto">
          <SearchComposer onSearch={handleSearch} onStop={stop} isSearching={isSearching} />
        </div>
      </footer>

      <SearchSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        config={config}
        onConfigChange={updateConfig}
        onSave={saveConfig}
        isSaving={isSaving}
        isDirty={isDirty}
      />

      <ReferenceDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        chunk={selectedChunk}
        allChunks={selectedChunkList}
      />
    </div>
  )
}

export default SearchDetailPage
