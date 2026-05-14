import React from 'react'
import { useTranslation } from 'react-i18next'
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
import {
  MultiSelectWithSearch,
  type SelectOptionGroup,
} from '@/components/ui/multi-select-with-search'
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
import {
  ResultPanel,
  SearchPanel,
  type RetrievalDocAgg,
  type RetrievalResult,
  type SearchMode,
} from './search-workbench'
import { SplitDetailPageTemplate } from '@/components/page-templates'

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

const isEnabledRawLLMModel = (model: RawLLMModel) =>
  model.available !== false && model.status !== '0'

const mapRerankModels = (
  response: Record<string, RawLLMProviderPayload | RawLLMModel[]>,
): LLMModel[] => {
  return Object.entries(response).flatMap(([providerName, providerValue]) => {
    const providerModels = Array.isArray(providerValue)
      ? providerValue
      : providerValue.llm || []

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
  const { t } = useTranslation()
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
  const [isLoadingRerankModels, setIsLoadingRerankModels] =
    React.useState(false)
  const [rerankModelsError, setRerankModelsError] = React.useState<
    string | undefined
  >()

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
    cross_languages: null as string[] | null,
  })

  // 跨语言搜索状态
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>([])
  const [metadataMode, setMetadataMode] =
    React.useState<MetadataFilterMode>('disabled')
  const [metadataCondition, setMetadataCondition] =
    React.useState<MetadataCondition>({
      logic: 'and',
      conditions: [],
    })
  const [metadataSemiAutoFields, setMetadataSemiAutoFields] = React.useState<
    MetadataSemiAutoField[]
  >([])

  // 右侧配置弹窗状态
  const [showConfigPanel, setShowConfigPanel] = React.useState(false)

  // 内容预览弹窗状态
  const [selectedResult, setSelectedResult] =
    React.useState<RetrievalResult | null>(null)
  const [isMarkdownPreview, setIsMarkdownPreview] = React.useState(false)

  // 搜索模式状态
  const [searchMode, setSearchMode] = React.useState<SearchMode>({
    type: 'fusion',
    weights: '0.05,0.95',
  })

  const metadataFields = React.useMemo(() => {
    return (currentKnowledgeBase?.metadata_settings || [])
      .map((field) => field.key)
      .filter((key): key is string => Boolean(key))
  }, [currentKnowledgeBase?.metadata_settings])

  const buildMetaDataFilter = React.useCallback(():
    | RetrievalMetaDataFilter
    | undefined => {
    if (metadataMode === 'disabled') return undefined

    if (metadataMode === 'auto') {
      return { method: 'auto' }
    }

    if (metadataMode === 'semi_auto') {
      const semiAuto = metadataSemiAutoFields
        .filter((item) => item.key)
        .map((item) => (item.op ? { key: item.key, op: item.op } : item.key))

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
      .filter(
        (condition) =>
          condition.key &&
          (condition.op === 'empty' ||
            condition.op === 'not empty' ||
            condition.value),
      )

    if (manual.length === 0) return undefined

    return {
      method: 'manual',
      logic: metadataCondition.logic || 'and',
      manual,
    }
  }, [metadataCondition, metadataMode, metadataSemiAutoFields])

  const activeMetaDataFilter = React.useMemo(
    () => buildMetaDataFilter(),
    [buildMetaDataFilter],
  )

  const activeConfigBadges = React.useMemo(() => {
    const badges = [
      t('knowledge.search.badges.threshold', {
        value: searchParams.similarity_threshold.toFixed(2),
      }),
      t('knowledge.search.badges.vectorWeight', {
        value: searchParams.vector_similarity_weight.toFixed(2),
      }),
      t('knowledge.search.badges.topK', { value: searchParams.top_k }),
    ]

    if (searchParams.rerank_id) badges.push('Rerank')
    if (searchParams.use_kg)
      badges.push(t('knowledge.search.badges.knowledgeGraph'))
    if (searchParams.keyword) badges.push(t('knowledge.search.badges.keyword'))
    if (selectedLanguages.length > 0) {
      badges.push(
        t('knowledge.search.badges.crossLanguages', {
          count: selectedLanguages.length,
        }),
      )
    }
    if (activeMetaDataFilter?.method === 'auto')
      badges.push(t('knowledge.search.badges.metadataAuto'))
    if (activeMetaDataFilter?.method === 'semi_auto') {
      badges.push(
        t('knowledge.search.badges.metadataSemiAuto', {
          count: activeMetaDataFilter.semi_auto?.length || 0,
        }),
      )
    }
    if (activeMetaDataFilter?.method === 'manual') {
      badges.push(
        t('knowledge.search.badges.metadataManual', {
          count: activeMetaDataFilter.manual?.length || 0,
        }),
      )
    }

    return badges
  }, [activeMetaDataFilter, searchParams, selectedLanguages.length, t])

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
        cross_languages:
          selectedLanguages.length > 0 ? selectedLanguages : null,
        meta_data_filter: activeMetaDataFilter,
        search_mode:
          searchMode.type !== 'fusion'
            ? searchMode
            : {
                type: 'fusion' as const,
                weights: searchMode.weights || '0.05,0.95',
              },
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
      setSelectedDocIds((prev) => [...prev, docId])
    } else {
      setSelectedDocIds((prev) => prev.filter((id) => id !== docId))
    }
  }

  const clearDocFilter = () => {
    setSelectedDocIds([])
  }

  const selectAllDocs = () => {
    setSelectedDocIds(docAggs.map((doc) => doc.doc_id))
  }

  // 加载重排序模型列表
  React.useEffect(() => {
    const loadRerankModels = async () => {
      try {
        setIsLoadingRerankModels(true)
        setRerankModelsError(undefined)
        const response = await llmAPI.list({
          mdl_type: 'rerank',
          available: true,
        })
        setRerankModels(mapRerankModels(response))
      } catch (error) {
        console.error('Failed to load rerank models:', error)
        setRerankModelsError(t('knowledge.search.rerank.loadError'))
      } finally {
        setIsLoadingRerankModels(false)
      }
    }

    loadRerankModels()
  }, [t])

  // 重排序模型选择处理
  const handleRerankModelSelect = (modelId: string | null) => {
    setSearchParams((prev) => ({
      ...prev,
      rerank_id: modelId,
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
      label: t('knowledge.search.modes.fusion.label'),
      description: t('knowledge.search.modes.fusion.description'),
      icon: <Layers className="h-4 w-4" />,
    },
    {
      value: 'sparse',
      label: t('knowledge.search.modes.sparse.label'),
      description: t('knowledge.search.modes.sparse.description'),
      icon: <Search className="h-4 w-4" />,
    },
    {
      value: 'hybrid',
      label: t('knowledge.search.modes.hybrid.label'),
      description: t('knowledge.search.modes.hybrid.description'),
      icon: <Zap className="h-4 w-4" />,
    },
    {
      value: 'dense',
      label: t('knowledge.search.modes.dense.label'),
      description: t('knowledge.search.modes.dense.description'),
      icon: <BookOpen className="h-4 w-4" />,
    },
  ]

  const searchModeLabel =
    searchModeOptions.find((option) => option.value === searchMode.type)
      ?.label || t('knowledge.search.config.fallbackMode')
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize))
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => {
      if (totalPages <= 5) return i + 1
      if (currentPage <= 3) return i + 1
      if (currentPage >= totalPages - 2) return totalPages - 4 + i
      return currentPage - 2 + i
    },
  )

  return (
    <SplitDetailPageTemplate
      leftWidth={420}
      minLeft={360}
      leftPane={
        <SearchPanel
          query={searchQuery}
          isSearching={isSearching}
          searchModeLabel={searchModeLabel}
          activeConfigBadges={activeConfigBadges}
          onQueryChange={setSearchQuery}
          onSearch={handleSearch}
          onOpenConfig={() => setShowConfigPanel(true)}
        />
      }
      rightPane={
        <div className="relative h-full min-h-0 overflow-hidden bg-background-surface">
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
              <div className="flex h-full w-[440px] max-w-[calc(100vw-2rem)] flex-col border-l border-border-default bg-background-surface">
                {/* 面板头部 */}
                <div className="px-space-lg py-space-base border-b border-border-default">
                  <div className="gap-space-base flex items-start justify-between">
                    <div className="gap-space-sm flex items-start">
                      <SettingsIcon className="mt-0.5 h-4 w-4 text-text-secondary" />
                      <div>
                        <h3 className="text-base font-semibold text-text-primary">
                          {t('knowledge.search.configTitle')}
                        </h3>
                        <p className="mt-space-xs text-xs text-text-tertiary">
                          {t('knowledge.search.currentMode', {
                            mode: searchModeLabel,
                          })}
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
                <div className="space-y-space-xl px-space-lg py-space-lg min-h-0 flex-1 overflow-y-auto scrollbar-thin">
                  {/* 搜索模式选择 */}
                  <section className="space-y-space-sm">
                    <div>
                      <h4 className="text-sm font-semibold text-text-primary">
                        {t('knowledge.search.config.mode')}
                      </h4>
                      <p className="mt-space-xs text-xs text-text-tertiary">
                        {t('knowledge.search.config.modeDescription')}
                      </p>
                    </div>
                    <RadioGroup
                      value={searchMode.type}
                      onValueChange={(value) => {
                        if (value === 'fusion') {
                          setSearchMode({
                            type: 'fusion',
                            weights: '0.05,0.95',
                          })
                        } else if (value === 'hybrid') {
                          setSearchMode({
                            type: 'hybrid',
                            weight_dense: 0.7,
                            weight_sparse: 0.3,
                          })
                        } else {
                          setSearchMode({
                            type: value as
                              | 'sparse'
                              | 'dense'
                              | 'hybrid'
                              | 'fusion',
                          })
                        }
                      }}
                      className="space-y-2"
                    >
                      {searchModeOptions.map((option) => (
                        <div key={option.value}>
                          <label
                            className={`gap-space-sm rounded-radius-md px-space-sm py-space-sm flex items-start border transition-colors ${
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
                            <div className="min-w-0 flex-1">
                              <div className="gap-space-xs flex items-center">
                                {option.icon}
                                <span className="text-sm font-medium text-text-primary">
                                  {option.label}
                                </span>
                                {option.value === 'dense' && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t('knowledge.search.config.unavailable')}
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-1 text-xs text-text-tertiary">
                                {option.description}
                              </p>
                            </div>
                          </label>

                          {/* 混合检索权重设置 */}
                          {searchMode.type === 'hybrid' &&
                            option.value === 'hybrid' && (
                              <div className="ml-space-lg mt-space-sm space-y-space-md pl-space-base border-l border-border-default">
                                <div>
                                  <label className="mb-2 block text-xs text-text-secondary">
                                    {t('knowledge.search.config.vectorWeight')}
                                  </label>
                                  <div className="flex items-center space-x-3">
                                    <Slider
                                      min={0}
                                      max={1}
                                      step={0.01}
                                      value={[searchMode.weight_dense || 0.7]}
                                      onValueChange={(value) => {
                                        const denseWeight = Number(
                                          Number(value[0]).toFixed(2),
                                        )
                                        const sparseWeight = Number(
                                          (1 - denseWeight).toFixed(2),
                                        )
                                        setSearchMode((prev) => ({
                                          ...prev,
                                          weight_dense: denseWeight,
                                          weight_sparse: sparseWeight,
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
                                        const denseWeight = Math.min(
                                          1,
                                          Math.max(0, Number(e.target.value)),
                                        )
                                        const sparseWeight = Number(
                                          (1 - denseWeight).toFixed(2),
                                        )
                                        setSearchMode((prev) => ({
                                          ...prev,
                                          weight_dense: Number(
                                            denseWeight.toFixed(2),
                                          ),
                                          weight_sparse: sparseWeight,
                                        }))
                                      }}
                                      className="h-7 w-16 text-center text-xs"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-text-secondary">
                                    {t('knowledge.search.config.sparseWeight')}
                                  </label>
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className="rounded-radius-full relative h-2 flex-1"
                                      style={{
                                        backgroundColor:
                                          'var(--color-components-slider-track)',
                                      }}
                                    >
                                      <div
                                        className="rounded-radius-full h-full"
                                        style={{
                                          width: `${((searchMode.weight_sparse || 0.3) * 100).toFixed(0)}%`,
                                          backgroundColor:
                                            'var(--color-components-slider-range)',
                                        }}
                                      />
                                    </div>
                                    <div className="rounded-radius-md px-space-xs py-space-xs w-16 border border-border-default text-center text-xs text-text-secondary">
                                      {(
                                        searchMode.weight_sparse || 0.3
                                      ).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-text-tertiary">
                                  {t(
                                    'knowledge.search.config.hybridWeightHint',
                                  )}
                                </div>
                              </div>
                            )}

                          {/* 融合检索权重设置 */}
                          {searchMode.type === 'fusion' &&
                            option.value === 'fusion' && (
                              <div className="ml-space-lg mt-space-sm space-y-space-md pl-space-base border-l border-border-default">
                                <div>
                                  <label className="mb-2 block text-xs text-text-secondary">
                                    {t(
                                      'knowledge.search.config.fusionTextWeight',
                                    )}
                                  </label>
                                  <div className="flex items-center space-x-3">
                                    <Slider
                                      min={0}
                                      max={1}
                                      step={0.01}
                                      value={[
                                        parseFloat(
                                          (
                                            searchMode.weights || '0.05,0.95'
                                          ).split(',')[0],
                                        ),
                                      ]}
                                      onValueChange={(value) => {
                                        const textWeight = Number(
                                          Number(value[0]).toFixed(2),
                                        )
                                        const vectorWeight = Number(
                                          (1 - textWeight).toFixed(2),
                                        )
                                        setSearchMode((prev) => ({
                                          ...prev,
                                          weights: `${textWeight},${vectorWeight}`,
                                        }))
                                      }}
                                      className="flex-1"
                                    />
                                    <Input
                                      type="number"
                                      min="0"
                                      max="1"
                                      step="0.01"
                                      value={parseFloat(
                                        (
                                          searchMode.weights || '0.05,0.95'
                                        ).split(',')[0],
                                      )}
                                      onChange={(e) => {
                                        const textWeight = Math.min(
                                          1,
                                          Math.max(0, Number(e.target.value)),
                                        )
                                        const vectorWeight = Number(
                                          (1 - textWeight).toFixed(2),
                                        )
                                        setSearchMode((prev) => ({
                                          ...prev,
                                          weights: `${Number(textWeight.toFixed(2))},${vectorWeight}`,
                                        }))
                                      }}
                                      className="h-7 w-16 text-center text-xs"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1 block text-xs text-text-secondary">
                                    {t(
                                      'knowledge.search.config.fusionVectorWeight',
                                    )}
                                  </label>
                                  <div className="flex items-center space-x-3">
                                    <div
                                      className="rounded-radius-full relative h-2 flex-1"
                                      style={{
                                        backgroundColor:
                                          'var(--color-components-slider-track)',
                                      }}
                                    >
                                      <div
                                        className="rounded-radius-full h-full"
                                        style={{
                                          width: `${(parseFloat((searchMode.weights || '0.05,0.95').split(',')[1]) * 100).toFixed(0)}%`,
                                          backgroundColor:
                                            'var(--color-components-slider-range)',
                                        }}
                                      />
                                    </div>
                                    <div className="rounded-radius-md px-space-xs py-space-xs w-16 border border-border-default text-center text-xs text-text-secondary">
                                      {parseFloat(
                                        (
                                          searchMode.weights || '0.05,0.95'
                                        ).split(',')[1],
                                      ).toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-xs text-text-tertiary">
                                  {t(
                                    'knowledge.search.config.fusionWeightHint',
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </RadioGroup>
                  </section>

                  {/* 高级参数 */}
                  <section className="pt-space-lg border-t border-border-default">
                    <button
                      onClick={() => setAdvancedOpen(!advancedOpen)}
                      className="mb-space-base flex w-full items-center justify-between text-sm font-semibold text-text-primary"
                    >
                      <span className="gap-space-xs flex items-center">
                        <SettingsIcon className="h-4 w-4 text-text-secondary" />
                        {t('knowledge.search.config.advanced')}
                      </span>
                      {advancedOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {advancedOpen && (
                      <div className="space-y-space-lg">
                        <div className="gap-space-base grid grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-text-secondary">
                              {t('knowledge.search.config.pageSize')}
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={pageSize}
                              onChange={(e) => {
                                const nextSize = Math.min(
                                  100,
                                  Math.max(1, Number(e.target.value) || 1),
                                )
                                setPageSize(nextSize)
                                setCurrentPage(1)
                                setSearchParams((prev) => ({
                                  ...prev,
                                  size: nextSize,
                                }))
                              }}
                              className="h-8 text-xs"
                            />
                          </div>

                          <SliderWithInput
                            label={t(
                              'knowledge.search.config.similarityThreshold',
                            )}
                            tooltip={t(
                              'knowledge.search.config.similarityThresholdTooltip',
                            )}
                            value={searchParams.similarity_threshold}
                            onChange={(value) =>
                              setSearchParams((prev) => ({
                                ...prev,
                                similarity_threshold: Number(value.toFixed(2)),
                              }))
                            }
                            min={0}
                            max={1}
                            step={0.01}
                            precision={2}
                            showSwitch={false}
                          />
                        </div>

                        <div className="space-y-4">
                          <SliderWithInput
                            label={t(
                              'knowledge.search.config.vectorSimilarityWeight',
                            )}
                            tooltip={t(
                              'knowledge.search.config.vectorSimilarityWeightTooltip',
                            )}
                            value={searchParams.vector_similarity_weight}
                            onChange={(value) =>
                              setSearchParams((prev) => ({
                                ...prev,
                                vector_similarity_weight: Number(
                                  value.toFixed(2),
                                ),
                              }))
                            }
                            min={0}
                            max={1}
                            step={0.01}
                            precision={2}
                            showSwitch={false}
                          />

                          <SliderWithInput
                            label="Top-K"
                            tooltip={t('knowledge.search.config.topKTooltip')}
                            value={searchParams.top_k}
                            onChange={(value) =>
                              setSearchParams((prev) => ({
                                ...prev,
                                top_k: Math.max(1, Math.round(value)),
                              }))
                            }
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

                        <div className="gap-space-sm grid grid-cols-1">
                          <label className="gap-space-xs flex cursor-pointer items-center">
                            <Checkbox
                              checked={searchParams.use_kg}
                              onCheckedChange={(checked) =>
                                setSearchParams((prev) => ({
                                  ...prev,
                                  use_kg: checked as boolean,
                                }))
                              }
                            />
                            <span className="text-xs text-text-secondary">
                              {t('knowledge.search.config.useKg')}
                            </span>
                          </label>

                          <label className="gap-space-xs flex cursor-pointer items-center">
                            <Checkbox
                              checked={searchParams.highlight}
                              onCheckedChange={(checked) =>
                                setSearchParams((prev) => ({
                                  ...prev,
                                  highlight: checked as boolean,
                                }))
                              }
                            />
                            <span className="text-xs text-text-secondary">
                              {t('knowledge.search.config.highlight')}
                            </span>
                          </label>

                          <label className="gap-space-xs flex cursor-pointer items-center">
                            <Checkbox
                              checked={searchParams.keyword}
                              onCheckedChange={(checked) =>
                                setSearchParams((prev) => ({
                                  ...prev,
                                  keyword: checked as boolean,
                                }))
                              }
                            />
                            <span className="text-xs text-text-secondary">
                              {t('knowledge.search.config.keyword')}
                            </span>
                          </label>
                        </div>

                        {/* 跨语言搜索 */}
                        <div>
                          <label className="mb-2 block text-xs font-medium text-text-secondary">
                            {t('knowledge.search.config.crossLanguage')}
                            {selectedLanguages.length > 0 && (
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs"
                              >
                                {t('knowledge.search.config.languageCount', {
                                  count: selectedLanguages.length,
                                })}
                              </Badge>
                            )}
                          </label>
                          <MultiSelectWithSearch
                            options={CROSS_LANGUAGE_OPTIONS}
                            value={selectedLanguages}
                            onChange={setSelectedLanguages}
                            placeholder={t(
                              'knowledge.search.config.languagePlaceholder',
                            )}
                            emptyText={t(
                              'knowledge.search.config.languageEmpty',
                            )}
                            allowClear
                            maxDisplayItems={100}
                            triggerClassName="min-h-10 bg-components-input-bg hover:bg-components-input-bg-hover focus-visible:border-components-input-border-focus focus-visible:bg-components-input-bg-focus focus-visible:ring-state-focus-subtle"
                          />

                          <div className="mt-1 text-xs text-text-tertiary">
                            {t('knowledge.search.config.languageHelp')}
                          </div>
                        </div>

                        <div className="pt-space-base border-t border-border-default">
                          <MetadataFilter
                            mode={metadataMode}
                            onModeChange={setMetadataMode}
                            value={metadataCondition}
                            onChange={setMetadataCondition}
                            metadataFields={metadataFields}
                            semiAutoFields={metadataSemiAutoFields}
                            onSemiAutoFieldsChange={setMetadataSemiAutoFields}
                            enabledModes={[
                              'disabled',
                              'auto',
                              'semi_auto',
                              'manual',
                            ]}
                          />
                          {metadataMode === 'manual' &&
                            metadataFields.length === 0 && (
                              <p className="mt-space-xs text-xs text-text-tertiary">
                                {t(
                                  'knowledge.search.config.manualMetadataEmpty',
                                )}
                              </p>
                            )}
                        </div>
                      </div>
                    )}
                  </section>
                </div>

                {/* 面板底部 */}
                <div className="px-space-lg py-space-base border-t border-border-default bg-background-surface">
                  <div className="gap-space-sm flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowConfigPanel(false)}
                    >
                      {t('knowledge.common.cancel')}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowConfigPanel(false)
                        if (hasSearched && searchQuery.trim()) {
                          handleSearch()
                        }
                      }}
                    >
                      {t('knowledge.search.applyConfig')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 内容预览弹窗 */}
          {selectedResult && (
            <div
              className="p-space-lg fixed inset-0 z-[1200] flex items-center justify-center bg-components-modal-overlay"
              onClick={() => {
                setSelectedResult(null)
                setIsMarkdownPreview(false)
              }}
            >
              <div
                className="rounded-radius-lg flex max-h-[90vh] w-full max-w-4xl flex-col border border-components-modal-border bg-components-modal-bg"
                style={{ boxShadow: 'var(--color-components-modal-shadow)' }}
                onClick={(event) => event.stopPropagation()}
              >
                {/* 弹窗头部 */}
                <div className="flex items-center justify-between border-b border-border-default p-6">
                  <div className="flex items-center space-x-3">
                    <FileIcon
                      fileName={selectedResult.docnm_kwd}
                      fileType={
                        selectedResult.docnm_kwd.split('.').pop() || 'txt'
                      }
                      size="sm"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-text-primary">
                        {t('knowledge.search.previewTitle')}
                      </h3>
                      <p className="text-sm text-text-tertiary">
                        {selectedResult.docnm_kwd}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* 预览/编辑切换按钮 */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                        className={`flex items-center space-x-1 text-xs ${
                          isMarkdownPreview
                            ? 'border-border-accent bg-state-focus-subtle text-text-accent'
                            : ''
                        }`}
                      >
                        {isMarkdownPreview ? (
                          <>
                            <Code className="h-3 w-3" />
                            <span>{t('knowledge.search.raw')}</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3" />
                            <span>{t('knowledge.search.preview')}</span>
                          </>
                        )}
                      </Button>
                      <Badge variant="warning" className="text-xs">
                        Beta
                      </Badge>
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
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                  {isMarkdownPreview ? (
                    <div className="rounded-radius-md h-full w-full overflow-y-auto border border-border-default bg-background-subtle px-4 py-3 scrollbar-thin">
                      <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-text-secondary">
                        {selectedResult.text}
                      </pre>
                    </div>
                  ) : (
                    <div className="rounded-radius-md h-full w-full overflow-y-auto border border-border-default bg-background-subtle px-4 py-3 scrollbar-thin">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
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
                <div className="border-t border-border-default bg-background-subtle p-6">
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <div className="flex items-center space-x-4">
                      <span>ID: {selectedResult.chunk_id}</span>
                      <span className="flex items-center">
                        <Star className="mr-1 h-3 w-3" />
                        {t('knowledge.search.similarity')}:{' '}
                        {(selectedResult.similarity * 100).toFixed(1)}%
                      </span>
                      <span className="flex items-center">
                        <Zap className="mr-1 h-3 w-3" />
                        {t('knowledge.search.vector')}:{' '}
                        {(selectedResult.vector_similarity * 100).toFixed(1)}%
                      </span>
                      <span className="flex items-center">
                        <Search className="mr-1 h-3 w-3" />
                        {t('knowledge.search.text')}:{' '}
                        {(selectedResult.term_similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {t('knowledge.search.charsCount', {
                        count: selectedResult.text.length,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      }
    />
  )
}

export { KnowledgeSearchPage }
