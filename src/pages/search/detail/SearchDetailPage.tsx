import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BrainCircuit,
  ClipboardList,
  Lightbulb,
  RotateCcw,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { Tooltip } from '@/components/ui/tooltip'
import { ReferenceDetailSheet } from '@/components/chat/ReferenceDetailSheet'
import { useFetchSearchAppDetail } from '@/hooks/use-search-request'
import { useSearchStore } from '@/stores/search'
import { ROUTES } from '@/constants'
import { SearchExecutionPhase, type ChunkResult } from '@/types/search'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import SearchComposer from './components/search-composer'
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

const STARTER_PROMPTS = [
  {
    title: '总结某个主题',
    description: '提炼核心结论与证据来源',
    query: '请基于当前知识库，总结这套资料最核心的 5 个结论，并给出引用依据。',
    icon: ClipboardList,
  },
  {
    title: '定位关键信息',
    description: '快速找出关键段落与原文',
    query: '请找出与“系统架构与性能瓶颈”最相关的文档片段，并按重要性排序。',
    icon: Lightbulb,
  },
  {
    title: '多文档对比',
    description: '比较异同并给出建议',
    query: '请对比不同文档在功能设计上的差异，并输出可执行的改进建议。',
    icon: Sparkles,
  },
] as const

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

  const kbCount = appliedConfig?.kb_ids?.length || 0

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

  const handlePrefillFromCard = useCallback((query: string) => {
    setPrefillText(query)
    setPrefillVersion((prev) => prev + 1)
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
            <Button
              variant={settingsOpen ? 'outline' : 'ghost'}
              size="icon-sm"
              onClick={() => setSettingsOpen(!settingsOpen)}
              title={settingsOpen ? '收起配置' : '配置'}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex bg-surface-primary">
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="relative flex-1 min-h-0 overflow-y-auto px-space-base py-space-lg bg-surface-primary">
            {!hasTurns ? (
              <div className="h-full flex items-center justify-center">
                <div className="relative w-full max-w-5xl">
                  <div className="text-center mb-space-2xl">
                    <p
                      className="text-2xl font-semibold tracking-tight text-transparent bg-clip-text"
                      style={{ backgroundImage: 'linear-gradient(90deg, var(--color-text-accent), var(--color-state-info))' }}
                    >
                      AI SEARCH
                    </p>
                    <h3 className="mt-space-sm text-3xl font-semibold tracking-tight text-text-primary">开始一次深度检索</h3>
                    <p className="mt-space-base text-base text-text-secondary">
                      融合知识检索、证据引用与结构化总结，快速产出高质量答案。
                    </p>
                  </div>

                  <div className="mt-space-xl w-full max-w-4xl mx-auto rounded-radius-xl border border-border-default bg-components-card-bg p-space-xl">
                    <SearchComposer
                      variant="hero"
                      onSearch={handleSearch}
                      onStop={stop}
                      isSearching={isSearching}
                      prefillText={prefillText}
                      prefillVersion={prefillVersion}
                    />
                  </div>

                  <div className="mt-space-2xl grid grid-cols-1 md:grid-cols-3 gap-space-xl">
                    {STARTER_PROMPTS.map((prompt) => {
                      const Icon = prompt.icon
                      return (
                        <button
                          key={prompt.title}
                          type="button"
                          onClick={() => handlePrefillFromCard(prompt.query)}
                          className="group rounded-radius-xl border border-border-default bg-surface-primary p-space-lg text-left transition-all duration-200 hover:border-border-accent hover:bg-[var(--color-state-focus-10)]"
                        >
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-radius-lg bg-surface-secondary text-text-accent transition-colors group-hover:bg-[var(--color-state-focus-10)] group-hover:text-text-accent">
                            <Icon className="h-4 w-4" />
                          </span>
                          <p className="mt-space-sm text-base font-medium text-text-primary group-hover:text-text-accent">{prompt.title}</p>
                          <p className="mt-space-xs text-xs text-text-secondary leading-relaxed">{prompt.description}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto space-y-space-sm pb-space-base">
                <div className="flex items-center justify-between rounded-radius-lg border border-border-default bg-surface-secondary px-space-sm py-space-xs">
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
                <SearchComposer onSearch={handleSearch} onStop={stop} isSearching={isSearching} />
              </div>
            </footer>
          ) : null}
        </div>

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

        <SearchMindmapDrawer
          open={mindmapOpen}
          onOpenChange={setMindmapOpen}
          question={latestTurn?.query || ''}
          kbIds={latestTurn?.kbIdsSnapshot || []}
          searchId={searchApp.id}
          isShareMode={isShareMode}
          fallbackChunks={latestTurn?.chunks || []}
        />
      </div>

      {canOpenMindmap && !mindmapOpen ? (
        <Tooltip content="查看当前问题思维导图" position="left">
          <button
            type="button"
            onClick={() => setMindmapOpen(true)}
            className="fixed right-space-lg bottom-24 z-40 inline-flex h-12 w-12 items-center justify-center rounded-radius-full border border-border-default bg-surface-primary text-text-accent shadow-elevation-medium transition-transform hover:scale-105 hover:bg-surface-secondary"
            aria-label="打开思维导图"
          >
            <BrainCircuit className="h-5 w-5" />
          </button>
        </Tooltip>
      ) : null}

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
