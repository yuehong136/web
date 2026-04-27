import React from 'react'
import { useParams } from 'react-router-dom'
import { 
  Search, 
  Settings as SettingsIcon, 
  Star, 

  ChevronDown,
  ChevronUp,
  BookOpen,
  Zap,
  Layers,
  X,
  Eye,
  Code,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { SliderWithInput } from '@/components/ui/slider-with-input'
import { MultiSelectWithSearch, type SelectOptionGroup } from '@/components/ui/multi-select-with-search'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import {
  MetadataFilter,
  type MetadataFilterMode,
  type MetadataSemiAutoField,
} from '@/components/chat/MetadataFilter'
import { FileIcon } from '@/components/ui/file-icon'
import { HighlightText } from '@/components/knowledge/HighlightText'
import { llmAPI } from '@/api/llm'
import type { LLMModel } from '@/types/api'
import type { MetadataCondition } from '@/types/api'
import { useKnowledgeStore } from '@/stores/knowledge'
import { knowledgeAPI } from '@/api/knowledge'
import { ResultPanel, SearchPanel, type RetrievalDocAgg, type RetrievalResult, type SearchMode } from './search-workbench'

type RetrievalMetaDataFilter = {
  method: 'auto' | 'semi_auto' | 'manual'
  logic?: 'and' | 'or'
  semi_auto?: Array<string | { key: string; op?: string }>
  manual?: Array<{ key: string; op: string; value: string }>
}

interface RawLLMModel {
  id?: string
  name?: string
  llm_name?: string
  type?: string
  mdl_type?: string
  available?: boolean
  status?: string
  max_tokens?: number
}

interface RawLLMProviderPayload {
  llm?: RawLLMModel[]
}

const CROSS_LANGUAGE_OPTIONS: SelectOptionGroup[] = [
  'English',
  'Chinese',
  'Spanish',
  'French',
  'German',
  'Japanese',
  'Korean',
  'Vietnamese',
  'Arabic',
  'Turkish',
].map((language) => ({ label: language, value: language }))

const isEnabledRawLLMModel = (model: RawLLMModel) => model.available !== false && model.status !== '0'

const mapRerankModels = (response: Record<string, RawLLMProviderPayload | RawLLMModel[]>): LLMModel[] => {
  return Object.entries(response).flatMap(([providerName, providerValue]) => {
    const providerModels = Array.isArray(providerValue) ? providerValue : providerValue.llm || []

    return providerModels
      .filter((model) => {
        const modelType = model.mdl_type || model.type
        return modelType === 'rerank' && isEnabledRawLLMModel(model)
      })
      .map((model) => {
        const modelName = model.llm_name || model.name || model.id || ''
        return {
          id: model.id || `${modelName}@${providerName}`,
          llm_name: modelName,
          name: model.name,
          fid: providerName,
          mdl_type: 'rerank',
          available: model.available !== false,
          status: model.status,
          max_tokens: model.max_tokens,
        } satisfies LLMModel
      })
  })
}

const KnowledgeSearchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentKnowledgeBase } = useKnowledgeStore()

  // 基础搜索状态
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [results, setResults] = React.useState<RetrievalResult[]>([])
  const [totalResults, setTotalResults] = React.useState(0)
  const [docAggs, setDocAggs] = React.useState<RetrievalDocAgg[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(20)
  const [hasSearched, setHasSearched] = React.useState(false)
  
  // 文档过滤状态
  const [selectedDocIds, setSelectedDocIds] = React.useState<string[]>([])
  const [showDocFilter, setShowDocFilter] = React.useState(false)
  
  // 重排序模型状态
  const [rerankModels, setRerankModels] = React.useState<LLMModel[]>([])
  const [isLoadingRerankModels, setIsLoadingRerankModels] = React.useState(false)
  const [rerankModelsError, setRerankModelsError] = React.useState<string | undefined>()
  
  // 搜索参数状态
  const [advancedOpen, setAdvancedOpen] = React.useState(false)
  const [searchParams, setSearchParams] = React.useState({
    page: 1,
    size: 20,
    similarity_threshold: 0.2,
    vector_similarity_weight: 0.3,
    use_kg: false,
    top_k: 1024,
    rerank_id: null as string | null,
    highlight: true,
    keyword: false,
    cross_languages: null as string[] | null
  })
  
  // 跨语言搜索状态
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([])
  const [metadataMode, setMetadataMode] = React.useState<MetadataFilterMode>('disabled')
  const [metadataCondition, setMetadataCondition] = React.useState<MetadataCondition>({
    logic: 'and',
    conditions: [],
  })
  const [metadataSemiAutoFields, setMetadataSemiAutoFields] = React.useState<MetadataSemiAutoField[]>([])
  
  // 右侧配置弹窗状态
  const [showConfigPanel, setShowConfigPanel] = React.useState(false)
  
  // 内容预览弹窗状态
  const [selectedResult, setSelectedResult] = React.useState<RetrievalResult | null>(null)
  const [isMarkdownPreview, setIsMarkdownPreview] = React.useState(false)
  
  // 搜索模式状态
  const [searchMode, setSearchMode] = React.useState<SearchMode>({
    type: 'fusion',
    weights: '0.05,0.95'
  })

  const metadataFields = React.useMemo(() => {
    return (currentKnowledgeBase?.metadata_settings || [])
      .map((field) => field.key)
      .filter((key): key is string => Boolean(key))
  }, [currentKnowledgeBase?.metadata_settings])

  const buildMetaDataFilter = React.useCallback((): RetrievalMetaDataFilter | undefined => {
    if (metadataMode === 'disabled') return undefined

    if (metadataMode === 'auto') {
      return { method: 'auto' }
    }

    if (metadataMode === 'semi_auto') {
      const semiAuto = metadataSemiAutoFields
        .filter((item) => item.key)
        .map((item) => item.op ? { key: item.key, op: item.op } : item.key)

      if (semiAuto.length === 0) return undefined

      return {
        method: 'semi_auto',
        semi_auto: semiAuto,
      }
    }

    const manual = (metadataCondition.conditions || [])
      .map((condition) => ({
        key: condition.name?.trim() || '',
        op: condition.comparison_operator || 'is',
        value: String(condition.value ?? '').trim(),
      }))
      .filter((condition) => condition.key && (
        condition.op === 'empty' ||
        condition.op === 'not empty' ||
        condition.value
      ))

    if (manual.length === 0) return undefined

    return {
      method: 'manual',
      logic: metadataCondition.logic || 'and',
      manual,
    }
  }, [metadataCondition, metadataMode, metadataSemiAutoFields])

  const activeMetaDataFilter = React.useMemo(
    () => buildMetaDataFilter(),
    [buildMetaDataFilter]
  )

  const activeConfigBadges = React.useMemo(() => {
    const badges = [
      `阈值 ${searchParams.similarity_threshold.toFixed(2)}`,
      `向量权重 ${searchParams.vector_similarity_weight.toFixed(2)}`,
      `Top-K ${searchParams.top_k}`,
    ]

    if (searchParams.rerank_id) badges.push('Rerank')
    if (searchParams.use_kg) badges.push('知识图谱')
    if (searchParams.keyword) badges.push('关键词增强')
    if (selectedLanguages.length > 0) badges.push(`${selectedLanguages.length} 种跨语言`)
    if (activeMetaDataFilter?.method === 'auto') badges.push('自动元数据过滤')
    if (activeMetaDataFilter?.method === 'semi_auto') {
      badges.push(`${activeMetaDataFilter.semi_auto?.length || 0} 个半自动字段`)
    }
    if (activeMetaDataFilter?.method === 'manual') {
      badges.push(`${activeMetaDataFilter.manual?.length || 0} 条元数据过滤`)
    }

    return badges
  }, [activeMetaDataFilter, searchParams, selectedLanguages.length])

  // 执行搜索
  const handleSearch = async () => {
    if (!searchQuery.trim() || !id) return
    
    setIsSearching(true)
    try {
      const searchData = {
        kb_ids: [id],
        question: searchQuery.trim(),
        ...searchParams,
        page: currentPage,
        size: pageSize,
        doc_ids: selectedDocIds.length > 0 ? selectedDocIds : null,
        cross_languages: selectedLanguages.length > 0 ? selectedLanguages : null,
        meta_data_filter: activeMetaDataFilter,
        search_mode: searchMode.type !== 'fusion' ? searchMode : {
          type: 'fusion' as const,
          weights: searchMode.weights || '0.05,0.95'
        }
      }
      
      const response = await knowledgeAPI.retrievalTest.test(searchData)
      setResults(response.chunks)
      setTotalResults(response.total)
      setDocAggs(response.doc_aggs)
      setHasSearched(true)
    } catch (error) {
      console.error('搜索失败:', error)
      setResults([])
      setTotalResults(0)
      setDocAggs([])
    } finally {
      setIsSearching(false)
    }
  }

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // 重置到第一页
  }

  // 监听分页状态变化，自动重新搜索
  React.useEffect(() => {
    if (hasSearched && searchQuery.trim()) {
      handleSearch()
    }
  }, [currentPage, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 首次检索有结果时，自动展开文档过滤器
  React.useEffect(() => {
    if (docAggs.length > 0 && !showDocFilter && hasSearched) {
      setShowDocFilter(true)
    }
  }, [docAggs.length, hasSearched]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 监听文档过滤变化，自动重新搜索
  React.useEffect(() => {
    if (hasSearched && searchQuery.trim()) {
      setCurrentPage(1) // 过滤时重置到第一页
      handleSearch()
    }
  }, [selectedDocIds]) // eslint-disable-line react-hooks/exhaustive-deps
  
  // 文档过滤处理函数
  const handleDocFilter = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocIds(prev => [...prev, docId])
    } else {
      setSelectedDocIds(prev => prev.filter(id => id !== docId))
    }
  }

  const clearDocFilter = () => {
    setSelectedDocIds([])
  }

  const selectAllDocs = () => {
    setSelectedDocIds(docAggs.map(doc => doc.doc_id))
  }

  // 加载重排序模型列表
  React.useEffect(() => {
    const loadRerankModels = async () => {
      try {
        setIsLoadingRerankModels(true)
        setRerankModelsError(undefined)
        const response = await llmAPI.list({ 
          mdl_type: 'rerank',
          available: true 
        })
        setRerankModels(mapRerankModels(response))
      } catch (error) {
        console.error('加载重排序模型失败:', error)
        setRerankModelsError('加载重排序模型失败，请重试')
      } finally {
        setIsLoadingRerankModels(false)
      }
    }

    loadRerankModels()
  }, [])

  // 重排序模型选择处理
  const handleRerankModelSelect = (modelId: string | null) => {
    setSearchParams(prev => ({
      ...prev,
      rerank_id: modelId
    }))
  }

  const openResultPreview = React.useCallback((result: RetrievalResult) => {
    setShowConfigPanel(false)
    setSelectedResult(result)
    setIsMarkdownPreview(false)
  }, [])


  // 搜索模式选项
  const searchModeOptions = [
    { 
      value: 'fusion', 
      label: '融合检索', 
      description: '默认模式，传统检索融合策略',
      icon: <Layers className="h-4 w-4" />
    },
    { 
      value: 'sparse', 
      label: '稀疏检索', 
      description: '全文检索，基于关键词匹配',
      icon: <Search className="h-4 w-4" />
    },
    { 
      value: 'hybrid', 
      label: '混合检索', 
      description: '结合向量和全文检索',
      icon: <Zap className="h-4 w-4" />
    },
    { 
      value: 'dense', 
      label: '密集检索', 
      description: '纯向量检索（暂时不启用）',
      icon: <BookOpen className="h-4 w-4" />
    }
  ]

  const searchModeLabel = searchModeOptions.find((option) => option.value === searchMode.type)?.label || '检索配置'
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (currentPage <= 3) return i + 1
    if (currentPage >= totalPages - 2) return totalPages - 4 + i
    return currentPage - 2 + i
  })

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-background-surface">
      {/* 主要内容区域 - 左右布局 */}
      <div className="flex-1 min-h-0 overflow-hidden px-space-xl py-space-lg">
        <div className="flex h-full min-h-0">
          <SearchPanel
            query={searchQuery}
            isSearching={isSearching}
            searchModeLabel={searchModeLabel}
            activeConfigBadges={activeConfigBadges}
            onQueryChange={setSearchQuery}
            onSearch={handleSearch}
            onOpenConfig={() => setShowConfigPanel(true)}
          />

          <ResultPanel
            query={searchQuery}
            isSearching={isSearching}
            results={results}
            totalResults={totalResults}
            docAggs={docAggs}
            selectedDocIds={selectedDocIds}
            showDocFilter={showDocFilter}
            highlight={searchParams.highlight}
            similarityThreshold={searchParams.similarity_threshold}
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            pageNumbers={pageNumbers}
            onToggleDocFilter={() => setShowDocFilter((open) => !open)}
            onDocFilter={handleDocFilter}
            onClearDocFilter={clearDocFilter}
            onSelectAllDocs={selectAllDocs}
            onOpenResultPreview={openResultPreview}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      </div>
          
          {/* 配置面板 */}
          {showConfigPanel && (
            <div
              className="absolute inset-y-0 right-0 z-40 flex justify-end"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowConfigPanel(false)
                }
              }}
            >
              <div
                className="flex h-full w-[440px] max-w-[calc(100vw-2rem)] flex-col border-l border-border-default bg-background-surface"
              >
              {/* 面板头部 */}
              <div className="border-b border-border-default px-space-lg py-space-base">
                <div className="flex items-start justify-between gap-space-base">
                  <div className="flex items-start gap-space-sm">
                    <SettingsIcon className="mt-0.5 h-4 w-4 text-text-secondary" />
                    <div>
                      <h3 className="text-base font-semibold text-text-primary">检索配置</h3>
                      <p className="mt-space-xs text-xs text-text-tertiary">
                        当前模式：{searchModeLabel}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowConfigPanel(false)}
                    className="shrink-0 text-text-tertiary hover:text-text-secondary"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* 面板内容 */}
              <div className="min-h-0 flex-1 space-y-space-xl overflow-y-auto px-space-lg py-space-lg scrollbar-thin">
                  {/* 搜索模式选择 */}
                  <section className="space-y-space-sm">
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">检索模式</h4>
                      <p className="mt-space-xs text-xs text-text-tertiary">选择本次检索使用的召回策略。</p>
                    </div>
                    <RadioGroup
                      value={searchMode.type}
                      onValueChange={(value) => {
                        if (value === 'fusion') {
                          setSearchMode({ type: 'fusion', weights: '0.05,0.95' })
                        } else if (value === 'hybrid') {
                          setSearchMode({ type: 'hybrid', weight_dense: 0.7, weight_sparse: 0.3 })
                        } else {
                          setSearchMode({ type: value as 'sparse' | 'dense' | 'hybrid' | 'fusion' })
                        }
                      }}
                      className="space-y-2"
                    >
                      {searchModeOptions.map((option) => (
                        <div key={option.value}>
                          <label
                            className={`flex items-start gap-space-sm rounded-radius-md border px-space-sm py-space-sm transition-colors ${
                              searchMode.type === option.value
                                ? 'border-components-input-border-focus bg-components-input-bg-focus'
                                : 'border-transparent hover:bg-background-default'
                            } ${option.value === 'dense' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            <RadioGroupItem
                              value={option.value}
                              disabled={option.value === 'dense'}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-space-xs">
                                {option.icon}
                                <span className="text-sm font-medium text-text-primary">
                                  {option.label}
                                </span>
                                {option.value === 'dense' && (
                                  <Badge variant="secondary" className="text-xs">暂不可用</Badge>
                                )}
                              </div>
                              <p className="text-xs text-text-tertiary mt-1">{option.description}</p>
                            </div>
                          </label>
                          
                          {/* 混合检索权重设置 */}
                          {searchMode.type === 'hybrid' && option.value === 'hybrid' && (
                            <div className="ml-space-lg mt-space-sm space-y-space-md border-l border-border-default pl-space-base">
                              <div>
                                <label className="block text-xs text-text-secondary mb-2">
                                  向量权重
                                </label>
                                <div className="flex items-center space-x-3">
                                  <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={[searchMode.weight_dense || 0.7]}
                                    onValueChange={(value) => {
                                      const denseWeight = Number(Number(value[0]).toFixed(2))
                                      const sparseWeight = Number((1 - denseWeight).toFixed(2))
                                      setSearchMode(prev => ({
                                        ...prev,
                                        weight_dense: denseWeight,
                                        weight_sparse: sparseWeight
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={searchMode.weight_dense || 0.7}
                                    onChange={(e) => {
                                      const denseWeight = Math.min(1, Math.max(0, Number(e.target.value)))
                                      const sparseWeight = Number((1 - denseWeight).toFixed(2))
                                      setSearchMode(prev => ({
                                        ...prev,
                                        weight_dense: Number(denseWeight.toFixed(2)),
                                        weight_sparse: sparseWeight
                                      }))
                                    }}
                                    className="w-16 text-xs h-7 text-center"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-text-secondary mb-1">
                                  全文权重 (自动计算)
                                </label>
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="flex-1 h-2 rounded-radius-full relative"
                                    style={{ backgroundColor: 'var(--color-components-slider-track)' }}
                                  >
                                    <div
                                      className="h-full rounded-radius-full"
                                      style={{
                                        width: `${((searchMode.weight_sparse || 0.3) * 100).toFixed(0)}%`,
                                        backgroundColor: 'var(--color-components-slider-range)',
                                      }}
                                    />
                                  </div>
                                  <div className="w-16 rounded-radius-md border border-border-default px-space-xs py-space-xs text-center text-xs text-text-secondary">
                                    {(searchMode.weight_sparse || 0.3).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-text-tertiary">
                                向量权重 + 全文权重 = 1.00 (精确到小数点后2位)
                              </div>
                            </div>
                          )}
                          
                          {/* 融合检索权重设置 */}
                          {searchMode.type === 'fusion' && option.value === 'fusion' && (
                            <div className="ml-space-lg mt-space-sm space-y-space-md border-l border-border-default pl-space-base">
                              <div>
                                <label className="block text-xs text-text-secondary mb-2">
                                  文本权重
                                </label>
                                <div className="flex items-center space-x-3">
                                  <Slider
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={[parseFloat((searchMode.weights || '0.05,0.95').split(',')[0])]}
                                    onValueChange={(value) => {
                                      const textWeight = Number(Number(value[0]).toFixed(2))
                                      const vectorWeight = Number((1 - textWeight).toFixed(2))
                                      setSearchMode(prev => ({
                                        ...prev,
                                        weights: `${textWeight},${vectorWeight}`
                                      }))
                                    }}
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={parseFloat((searchMode.weights || '0.05,0.95').split(',')[0])}
                                    onChange={(e) => {
                                      const textWeight = Math.min(1, Math.max(0, Number(e.target.value)))
                                      const vectorWeight = Number((1 - textWeight).toFixed(2))
                                      setSearchMode(prev => ({
                                        ...prev,
                                        weights: `${Number(textWeight.toFixed(2))},${vectorWeight}`
                                      }))
                                    }}
                                    className="w-16 text-xs h-7 text-center"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-xs text-text-secondary mb-1">
                                  向量权重 (自动计算)
                                </label>
                                <div className="flex items-center space-x-3">
                                  <div
                                    className="flex-1 h-2 rounded-radius-full relative"
                                    style={{ backgroundColor: 'var(--color-components-slider-track)' }}
                                  >
                                    <div
                                      className="h-full rounded-radius-full"
                                      style={{
                                        width: `${(parseFloat((searchMode.weights || '0.05,0.95').split(',')[1]) * 100).toFixed(0)}%`,
                                        backgroundColor: 'var(--color-components-slider-range)',
                                      }}
                                    />
                                  </div>
                                  <div className="w-16 rounded-radius-md border border-border-default px-space-xs py-space-xs text-center text-xs text-text-secondary">
                                    {parseFloat((searchMode.weights || '0.05,0.95').split(',')[1]).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-text-tertiary">
                                文本权重 + 向量权重 = 1.00 (精确到小数点后2位)
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  </section>

                  {/* 高级参数 */}
                  <section className="border-t border-border-default pt-space-lg">
                    <button
                      onClick={() => setAdvancedOpen(!advancedOpen)}
                      className="mb-space-base flex w-full items-center justify-between text-sm font-semibold text-text-primary"
                    >
                      <span className="flex items-center gap-space-xs">
                        <SettingsIcon className="h-4 w-4 text-text-secondary" />
                        高级参数
                      </span>
                      {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    {advancedOpen && (
                      <div className="space-y-space-lg">
                        <div className="grid grid-cols-2 gap-space-base">
                          <div>
                            <label className="block text-xs font-medium text-text-secondary mb-1">
                              页大小
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={pageSize}
                              onChange={(e) => {
                                const nextSize = Math.min(100, Math.max(1, Number(e.target.value) || 1))
                                setPageSize(nextSize)
                                setCurrentPage(1)
                                setSearchParams(prev => ({
                                  ...prev,
                                  size: nextSize
                                }))
                              }}
                              className="text-xs h-8"
                            />
                          </div>
                          
                          <SliderWithInput
                            label="相似度阈值"
                            tooltip="低于该混合相似度的片段会被过滤，RAGFlow 默认值为 0.2。"
                            value={searchParams.similarity_threshold}
                            onChange={(value) => setSearchParams(prev => ({
                              ...prev,
                              similarity_threshold: Number(value.toFixed(2))
                            }))}
                            min={0}
                            max={1}
                            step={0.01}
                            precision={2}
                            showSwitch={false}
                          />
                        </div>
                        
                        <div className="space-y-4">
                          <SliderWithInput
                            label="向量相似度权重"
                            tooltip="用于关键词相似度与向量相似度或 rerank 分数的融合。"
                            value={searchParams.vector_similarity_weight}
                            onChange={(value) => setSearchParams(prev => ({
                              ...prev,
                              vector_similarity_weight: Number(value.toFixed(2))
                            }))}
                            min={0}
                            max={1}
                            step={0.01}
                            precision={2}
                            showSwitch={false}
                          />

                          <SliderWithInput
                            label="Top-K"
                            tooltip="初始召回或送入 rerank 模型的片段数量。"
                            value={searchParams.top_k}
                            onChange={(value) => setSearchParams(prev => ({
                              ...prev,
                              top_k: Math.max(1, Math.round(value))
                            }))}
                            min={1}
                            max={2048}
                            step={1}
                            showSwitch={false}
                            inputOnly
                            inputWidth={96}
                          />
                        </div>
                        
                        {/* 重排序模型选择器 */}
                        <div>
                          <RerankModelSelector
                            models={rerankModels}
                            selectedModelId={searchParams.rerank_id}
                            onSelect={handleRerankModelSelect}
                            loading={isLoadingRerankModels}
                            error={rerankModelsError}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-space-sm">
                          <label className="flex items-center gap-space-xs cursor-pointer">
                            <Checkbox
                              checked={searchParams.use_kg}
                              onCheckedChange={(checked) => setSearchParams(prev => ({
                                ...prev,
                                use_kg: checked as boolean
                              }))}
                            />
                            <span className="text-xs text-text-secondary">使用知识图谱</span>
                          </label>
                          
                          <label className="flex items-center gap-space-xs cursor-pointer">
                            <Checkbox
                              checked={searchParams.highlight}
                              onCheckedChange={(checked) => setSearchParams(prev => ({
                                ...prev,
                                highlight: checked as boolean
                              }))}
                            />
                            <span className="text-xs text-text-secondary">高亮匹配文本</span>
                          </label>
                          
                          <label className="flex items-center gap-space-xs cursor-pointer">
                            <Checkbox
                              checked={searchParams.keyword}
                              onCheckedChange={(checked) => setSearchParams(prev => ({
                                ...prev,
                                keyword: checked as boolean
                              }))}
                            />
                            <span className="text-xs text-text-secondary">关键词增强</span>
                          </label>
                        </div>
                        
                        {/* 跨语言搜索 */}
                        <div>
                          <label className="block text-xs font-medium text-text-secondary mb-2">
                            跨语言翻译
                            {selectedLanguages.length > 0 && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {selectedLanguages.length}种语言
                              </Badge>
                            )}
                          </label>
                          <MultiSelectWithSearch
                            options={CROSS_LANGUAGE_OPTIONS}
                            value={selectedLanguages}
                            onChange={setSelectedLanguages}
                            placeholder="选择翻译语言..."
                            emptyText="暂无语言"
                            allowClear
                            maxDisplayItems={100}
                            triggerClassName="min-h-10 bg-components-input-bg hover:bg-components-input-bg-hover focus-visible:border-components-input-border-focus focus-visible:bg-components-input-bg-focus focus-visible:ring-state-focus-subtle"
                          />
                          
                          <div className="text-xs text-text-tertiary mt-1">
                            将问题翻译成选中的语言进行检索，提高多语言内容匹配率
                          </div>
                        </div>

                        <div className="border-t border-border-default pt-space-base">
                          <MetadataFilter
                            mode={metadataMode}
                            onModeChange={setMetadataMode}
                            value={metadataCondition}
                            onChange={setMetadataCondition}
                            metadataFields={metadataFields}
                            semiAutoFields={metadataSemiAutoFields}
                            onSemiAutoFieldsChange={setMetadataSemiAutoFields}
                            enabledModes={['disabled', 'auto', 'semi_auto', 'manual']}
                          />
                          {metadataMode === 'manual' && metadataFields.length === 0 && (
                            <p className="mt-space-xs text-xs text-text-tertiary">
                              当前知识库未配置元数据模板，也可以手动输入字段名。
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
              </div>
              
              {/* 面板底部 */}
              <div className="border-t border-border-default bg-background-surface px-space-lg py-space-base">
                <div className="flex justify-end gap-space-sm">
                  <Button
                    variant="outline"
                    onClick={() => setShowConfigPanel(false)}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={() => {
                      setShowConfigPanel(false)
                      if (hasSearched && searchQuery.trim()) {
                        handleSearch()
                      }
                    }}
                  >
                    应用配置
                  </Button>
                </div>
              </div>
            </div>
            </div>
          )}
          
          {/* 内容预览弹窗 */}
          {selectedResult && (
            <div
              className="fixed inset-0 z-[1200] flex items-center justify-center bg-components-modal-overlay p-space-lg"
              onClick={() => {
                setSelectedResult(null)
                setIsMarkdownPreview(false)
              }}
            >
              <div
                className="bg-components-modal-bg border border-components-modal-border rounded-radius-lg max-w-4xl w-full max-h-[90vh] flex flex-col"
                style={{ boxShadow: 'var(--color-components-modal-shadow)' }}
                onClick={(event) => event.stopPropagation()}
              >
                {/* 弹窗头部 */}
                <div className="p-6 border-b border-border-default flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileIcon 
                      fileName={selectedResult.docnm_kwd}
                      fileType={selectedResult.docnm_kwd.split('.').pop() || 'txt'}
                      size="sm"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">内容预览</h3>
                      <p className="text-sm text-text-tertiary">{selectedResult.docnm_kwd}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* 预览/编辑切换按钮 */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                        className={`text-xs flex items-center space-x-1 ${
                          isMarkdownPreview ? "bg-state-focus-subtle text-text-accent border-border-accent" : ""
                        }`}
                      >
                        {isMarkdownPreview ? (
                          <>
                            <Code className="h-3 w-3" />
                            <span>原文</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>预览</span>
                          </>
                        )}
                      </Button>
                      <Badge variant="warning" className="text-xs">Beta</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedResult(null)
                        setIsMarkdownPreview(false)
                      }}
                      className="text-text-tertiary hover:text-text-secondary"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* 弹窗内容 */}
                <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
                  {isMarkdownPreview ? (
                    <div className="w-full h-full px-4 py-3 border border-border-default rounded-radius-md bg-background-subtle overflow-y-auto scrollbar-thin">
                      <div 
                        className="prose prose-sm max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            let content = selectedResult.text
                            
                            // Markdown语法处理逻辑
                            content = content
                              // 标题处理
                              .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-text-primary">$1</h3>')
                              .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2 text-text-primary">$1</h2>')
                              .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2 text-text-primary">$1</h1>')
                              // 列表处理
                              .replace(/^[\s]*[-*+] (.*?)$/gm, '<ul class="list-disc ml-4 my-2"><li class="my-1">$1</li></ul>')
                              .replace(/^[\s]*\d+\. (.*?)$/gm, '<ol class="list-decimal ml-4 my-2"><li class="my-1">$1</li></ol>')
                              // 代码块处理
                              .replace(/```([\s\S]*?)```/g, '<pre class="bg-components-card-bg-hover p-3 rounded-radius-md my-3 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
                              // 行内代码
                              .replace(/`([^`]*)`/g, '<code class="bg-components-card-bg-hover px-1 py-0.5 rounded-radius-sm text-sm font-mono">$1</code>')
                              // 粗体
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                              // 斜体
                              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                              // 链接
                              .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" class="text-text-accent hover:text-text-accent underline" target="_blank">$1</a>')
                              // 换行处理
                              .replace(/\n\n/g, '</p><p class="mb-3">')
                              .replace(/\n/g, '<br>')
                            
                            return `<p class="mb-3">${content}</p>`
                          })()
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full px-4 py-3 border border-border-default rounded-radius-md bg-background-subtle overflow-y-auto scrollbar-thin">
                      <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                        <HighlightText
                          html={selectedResult.highlight}
                          text={selectedResult.text}
                          enableHighlight={searchParams.highlight}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 弹窗底部信息 */}
                <div className="p-6 border-t border-border-default bg-background-subtle">
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <div className="flex items-center space-x-4">
                      <span>ID: {selectedResult.chunk_id}</span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        总相似度: {(selectedResult.similarity * 100).toFixed(1)}%
                      </span>
                      <span className="flex items-center">
                        <Zap className="h-3 w-3 mr-1" />
                        向量: {(selectedResult.vector_similarity * 100).toFixed(1)}%
                      </span>
                      <span className="flex items-center">
                        <Search className="h-3 w-3 mr-1" />
                        文本: {(selectedResult.term_similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-text-tertiary">
                      字符数: {selectedResult.text.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
    </div>
  )
}

export { KnowledgeSearchPage }
