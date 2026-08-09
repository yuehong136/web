import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { useFetchSearchAppDetail } from '@/hooks/use-search-request'
import { useSearchStore } from '@/stores/search'
import { ROUTES } from '@/constants'
import {
  SearchExecutionMode,
  SearchExecutionPhase,
  SearchSourceMode,
  type ChunkResult,
} from '@/types/search'
import { copyToClipboard } from '@/lib/utils'
import { toast } from '@/lib/toast'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import SearchComposer from './components/search-composer'
import SearchDetailHeader from './components/search-detail-header'
import SearchStarterView from './components/search-starter-view'
import SearchTurnItem from './components/search-turn-item'
import SearchSettingsSheet from './components/SearchSettingsSheet'
import SearchMindmapDrawer from './mindmap/mindmap-drawer'
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
  const location = useLocation()
  const { settingsOpen, setSettingsOpen } = useSearchStore()
  const { searchApp, isLoading } = useFetchSearchAppDetail()
  const { basicInfo, config, appliedConfig, updateBasicInfo, updateConfig, saveConfig, isSaving, isDirty } = useSearchSettings(searchApp)
  const { turns, phase, isSearching, search, stop, clear } = useSearchExecution(searchApp, appliedConfig)

  const [docFilterByTurnId, setDocFilterByTurnId] = useState<Record<string, string[]>>({})
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedChunk, setSelectedChunk] = useState<ReferenceChunk | null>(null)
  const [selectedChunkList, setSelectedChunkList] = useState<ReferenceChunk[]>([])
  const [prefillText, setPrefillText] = useState('')
  const [prefillVersion, setPrefillVersion] = useState(0)
  const [expandedByTurnId, setExpandedByTurnId] = useState<Record<string, boolean>>({})
  const [mindmapOpen, setMindmapOpen] = useState(false)
  const executionMode = SearchExecutionMode.DEEP_RESEARCH
  const sourceMode = SearchSourceMode.KNOWLEDGE_BASE

  const kbCount = appliedConfig?.kb_ids?.length || 0

  const handleSearch = useCallback(
    (query: string) => {
      search(query, {
        executionMode,
        sourceMode,
      })
    },
    [executionMode, search, sourceMode]
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

  const handlePrefillFromCard = useCallback((query: string) => {
    setPrefillText(query)
    setPrefillVersion((prev) => prev + 1)
  }, [])

  const handleToggleSettings = useCallback(() => {
    setSettingsOpen(!settingsOpen)
    if (!settingsOpen) {
      setMindmapOpen(false)
    }
  }, [setSettingsOpen, settingsOpen])

  const handleShare = useCallback(async () => {
    try {
      await copyToClipboard(window.location.href)
      toast.success('链接已复制')
    } catch {
      toast.error('复制失败')
    }
  }, [])

  const handleExport = useCallback(() => {
    toast.info('导出功能即将支持')
  }, [])

  useEffect(() => {
    setExpandedByTurnId((prev) => {
      if (!turns.length) return {}

      const latestTurnId = turns[turns.length - 1].id
      const isNewTurn = !Object.prototype.hasOwnProperty.call(prev, latestTurnId)

      const next: Record<string, boolean> = {}
      if (isNewTurn) {
        turns.forEach((turn, idx) => {
          next[turn.id] = idx === turns.length - 1
        })
        return next
      }

      turns.forEach((turn, idx) => {
        next[turn.id] = prev[turn.id] ?? idx === turns.length - 1
      })
      return next
    })
  }, [turns])

  const handleToggleTurnExpand = useCallback((turnId: string) => {
    setExpandedByTurnId((prev) => ({ ...prev, [turnId]: !prev[turnId] }))
  }, [])

  const handleExpandAllTurns = useCallback(() => {
    setExpandedByTurnId(
      turns.reduce<Record<string, boolean>>((acc, turn) => {
        acc[turn.id] = true
        return acc
      }, {})
    )
  }, [turns])

  const handleCollapseAllTurns = useCallback(() => {
    setExpandedByTurnId(
      turns.reduce<Record<string, boolean>>((acc, turn) => {
        acc[turn.id] = false
        return acc
      }, {})
    )
  }, [turns])

  const allExpanded = useMemo(
    () => turns.length > 0 && turns.every((turn) => expandedByTurnId[turn.id]),
    [expandedByTurnId, turns]
  )

  const allCollapsed = useMemo(
    () => turns.length > 0 && turns.every((turn) => !expandedByTurnId[turn.id]),
    [expandedByTurnId, turns]
  )

  const hasTurns = useMemo(() => turns.length > 0, [turns.length])
  const latestTurn = turns.length ? turns[turns.length - 1] : null
  const isShareMode = useMemo(() => new URLSearchParams(location.search).has('shared_id'), [location.search])
  const canOpenMindmap = Boolean(
    hasTurns &&
      latestTurn?.mindmapEnabled &&
      latestTurn?.query.trim() &&
      (latestTurn?.kbIdsSnapshot.length || 0) > 0
  )

  const handleToggleMindmap = useCallback(() => {
    if (!canOpenMindmap && !mindmapOpen) return
    setMindmapOpen((prev) => {
      const next = !prev
      if (next) {
        setSettingsOpen(false)
      }
      return next
    })
  }, [canOpenMindmap, mindmapOpen, setSettingsOpen])

  useEffect(() => {
    if (canOpenMindmap) return
    setMindmapOpen(false)
  }, [canOpenMindmap])

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
    <div className="h-full flex flex-col bg-surface-primary">
      <SearchDetailHeader
        appName={searchApp.name}
        kbCount={kbCount}
        phaseLabel={phaseLabelMap[phase] || phaseLabelMap[SearchExecutionPhase.IDLE]}
        hasTurns={hasTurns}
        canOpenMindmap={canOpenMindmap}
        mindmapOpen={mindmapOpen}
        settingsOpen={settingsOpen}
        onBack={() => navigate(ROUTES.SEARCH)}
        onClear={handleClear}
        onToggleMindmap={handleToggleMindmap}
        onShare={handleShare}
        onExport={handleExport}
        onToggleSettings={handleToggleSettings}
      />

      <div className="flex-1 min-h-0 flex bg-surface-primary">
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="relative flex-1 min-h-0 overflow-y-auto px-space-base py-space-lg bg-surface-primary">
            {!hasTurns ? (
              <SearchStarterView
                onSearch={handleSearch}
                onStop={stop}
                isSearching={isSearching}
                prefillText={prefillText}
                prefillVersion={prefillVersion}
                onPrefill={handlePrefillFromCard}
              />
            ) : (
              <div className="max-w-6xl mx-auto space-y-space-base pb-space-base">
                <div className="flex items-center justify-between rounded-radius-lg border border-border-default bg-surface-secondary px-space-base py-space-xs">
                  <p className="text-xs text-text-secondary">
                    共 {turns.length} 轮查询，可折叠查看历史轮次
                  </p>
                  <div className="flex items-center gap-space-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExpandAllTurns}
                      disabled={allExpanded}
                      className="h-7 px-space-sm text-xs"
                    >
                      全部展开
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCollapseAllTurns}
                      disabled={allCollapsed}
                      className="h-7 px-space-sm text-xs"
                    >
                      全部折叠
                    </Button>
                  </div>
                </div>

                {turns.map((turn, index) => (
                  <SearchTurnItem
                    key={turn.id}
                    index={index}
                    isLatest={index === turns.length - 1}
                    expanded={expandedByTurnId[turn.id] ?? index === turns.length - 1}
                    turn={turn}
                    selectedDocIds={docFilterByTurnId[turn.id] || []}
                    onToggleExpand={() => handleToggleTurnExpand(turn.id)}
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

          {hasTurns ? (
            <footer className="shrink-0 bg-surface-primary px-space-base py-space-sm">
              <div className="max-w-5xl mx-auto">
                <SearchComposer
                  onSearch={handleSearch}
                  onStop={stop}
                  isSearching={isSearching}
                  enableSemanticMode={false}
                />
              </div>
            </footer>
          ) : null}
        </div>

        <SearchMindmapDrawer
          open={mindmapOpen}
          onOpenChange={setMindmapOpen}
          question={latestTurn?.query || ''}
          kbIds={latestTurn?.kbIdsSnapshot || []}
          searchId={searchApp.id}
          isShareMode={isShareMode}
          fallbackChunks={latestTurn?.chunks || []}
        />

        <SearchSettingsSheet
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          name={basicInfo.name}
          description={basicInfo.description}
          avatar={basicInfo.avatar || undefined}
          onBasicInfoChange={updateBasicInfo}
          config={config}
          onConfigChange={updateConfig}
          onSave={saveConfig}
          isSaving={isSaving}
          isDirty={isDirty}
        />
      </div>

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
