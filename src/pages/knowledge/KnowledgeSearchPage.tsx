import React from 'react'
import { useParams } from 'react-router-dom'
import { 
  Search, 
  Play, 
  Settings as SettingsIcon, 
  FileText, 
  Star, 
 
  ChevronDown,
  ChevronUp,
  Loader2,
  BookOpen,
  Zap,
  Layers,
  X,
  Eye,
  Code,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip } from '@/components/ui/tooltip'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { RerankModelSelector } from '@/components/knowledge/RerankModelSelector'
import { FileIcon } from '@/components/ui/file-icon'
import { HighlightText } from '@/components/knowledge/HighlightText'
import { llmAPI } from '@/api/llm'
import type { LLMModel } from '@/types/api'
import { useKnowledgeStore } from '@/stores/knowledge'
import { knowledgeAPI } from '@/api/knowledge'

interface RetrievalResult {
  chunk_id: string
  text: string
  doc_id: string
  docnm_kwd: string
  kb_id: string
  similarity: number
  vector_similarity: number
  term_similarity: number
  highlight?: string
  positions?: number[][]
}

interface SearchMode {
  type: 'sparse' | 'dense' | 'hybrid' | 'fusion'
  weight_dense?: number
  weight_sparse?: number
  weights?: string
}

const KnowledgeSearchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { currentKnowledgeBase } = useKnowledgeStore()

  // 基础搜索状态
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isSearching, setIsSearching] = React.useState(false)
  const [results, setResults] = React.useState<RetrievalResult[]>([])
  const [totalResults, setTotalResults] = React.useState(0)
  const [docAggs, setDocAggs] = React.useState<Array<{doc_name: string, doc_id: string, count: number}>>([])
  
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
    similarity_threshold: 0.0,
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
  const [showLanguageSelector, setShowLanguageSelector] = React.useState(false)
  
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
  
  // 点击外部关闭语言选择器
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showLanguageSelector && !target.closest('.language-selector')) {
        setShowLanguageSelector(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showLanguageSelector])

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
        console.log('加载的重排序模型响应:', response, 'Type:', typeof response)
        
        // API 返回的是按厂商分组的对象，需要转换为数组
        const modelArray: LLMModel[] = []
        if (response && typeof response === 'object' && !Array.isArray(response)) {
          // 遍历每个厂商的模型
          Object.values(response).forEach((providerModels: unknown) => {
            if (Array.isArray(providerModels)) {
              // 只添加 available 为 true 且 mdl_type 为 rerank 的模型
              const availableRerankModels = providerModels.filter((model: unknown) => 
                typeof model === 'object' && model !== null && 
                'available' in model && 'mdl_type' in model &&
                (model as { available: boolean; mdl_type: string }).available === true && 
                (model as { available: boolean; mdl_type: string }).mdl_type === 'rerank'
              )
              modelArray.push(...availableRerankModels)
            }
          })
        }
        
        console.log('处理后的重排序模型数组:', modelArray)
        setRerankModels(modelArray)
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

  return (
    <div className="h-full flex flex-col">
      {/* 页面头部 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">检索测试</h1>
            <p className="text-gray-600 mt-1">
              测试知识库 "{currentKnowledgeBase?.name}" 的检索效果
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {currentKnowledgeBase?.doc_num || 0} 文档
            </Badge>
          </div>
        </div>
      </div>

      {/* 主要内容区域 - 左右布局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：源文本输入区域 */}
        <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
          {/* 标题栏 */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <span className="font-medium text-gray-900">源文本</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfigPanel(true)}
              className="flex items-center space-x-2"
            >
              <SettingsIcon className="h-4 w-4" />
              <span>
                {searchMode.type === 'fusion' ? '融合检索' : 
                 searchMode.type === 'sparse' ? '稀疏检索' : 
                 searchMode.type === 'hybrid' ? '混合检索' : 
                 searchMode.type === 'dense' ? '密集检索' : '检索配置'}
              </span>
            </Button>
          </div>
          
          {/* 输入区域 */}
          <div className="flex-1 flex flex-col p-6">
            <div className="flex flex-col space-y-4">
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="请输入要检索的问题或文本...

按 Enter 开始检索，Shift+Enter 换行"
                className="h-[120px] w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none text-sm leading-relaxed"
              />
              
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {searchQuery.length} 字符
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-6"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      检索中...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      开始检索
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* 右侧：搜索结果展示 */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* 结果统计 */}
          {(results.length > 0 || isSearching) && (
            <div className="border-b border-gray-200 bg-white px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {isSearching ? '检索中...' : `找到 ${totalResults} 个相关片段`}
                    {selectedDocIds.length > 0 && (
                      <span className="text-primary-600 ml-2">
                        (已过滤到 {selectedDocIds.length} 个文档)
                      </span>
                    )}
                  </span>
                  {docAggs.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">来自</span>
                      <div className="flex items-center space-x-1">
                        {docAggs.slice(0, 3).map((doc) => (
                          <Tooltip key={doc.doc_id} content={`${doc.doc_name}: ${doc.count} 个片段`}>
                            <Badge variant="secondary" className="text-xs">
                              {doc.doc_name.length > 10 ? doc.doc_name.substring(0, 10) + '...' : doc.doc_name}
                            </Badge>
                          </Tooltip>
                        ))}
                        {docAggs.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{docAggs.length - 3} 个文档
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {searchMode.type === 'fusion' ? '融合检索' : 
                     searchMode.type === 'sparse' ? '稀疏检索' : 
                     searchMode.type === 'hybrid' ? '混合检索' : '密集检索'}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* 文档过滤条 */}
          {docAggs.length > 0 && (
            <div className="border-b border-gray-200 bg-white px-6 py-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setShowDocFilter(!showDocFilter)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <FileText className="h-4 w-4" />
                  <span>文档过滤</span>
                  {selectedDocIds.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedDocIds.length}
                    </Badge>
                  )}
                  {showDocFilter ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {selectedDocIds.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      已选择 {selectedDocIds.length} 个文档
                    </span>
                    <button
                      onClick={clearDocFilter}
                      className="text-xs text-gray-600 hover:text-gray-700"
                    >
                      清除
                    </button>
                  </div>
                )}
              </div>
              
              {showDocFilter && (
                <div className="flex flex-wrap gap-2">
                  {docAggs.map((doc) => (
                    <label 
                      key={doc.doc_id} 
                      className="flex items-center space-x-2 px-3 py-1 bg-gray-50 hover:bg-gray-100 rounded-full cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.doc_id)}
                        onChange={(e) => handleDocFilter(doc.doc_id, e.target.checked)}
                        className="text-primary-600"
                      />
                      <span className="text-sm text-gray-700 truncate max-w-[200px]">
                        {doc.doc_name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {doc.count}
                      </Badge>
                    </label>
                  ))}
                  
                  <button
                    onClick={selectAllDocs}
                    className="px-3 py-1 text-xs text-primary-600 hover:text-primary-700 border border-primary-200 hover:border-primary-300 rounded-full transition-colors"
                  >
                    全选
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 结果列表 */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {!searchQuery ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">开始检索测试</h3>
                  <p className="text-gray-500 mb-6">在左侧输入问题，选择检索模式，开始测试知识库的检索效果</p>
                  <div className="text-left max-w-md mx-auto space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      支持多种检索模式：融合、稀疏、混合检索
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      可调节相似度阈值和权重参数
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      支持高亮显示和知识图谱增强
                    </div>
                  </div>
                </div>
              </div>
            ) : isSearching ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 text-primary-600 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600">正在检索中，请稍候...</p>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关结果</h3>
                  <p className="text-gray-500 mb-4">请尝试调整搜索词或降低相似度阈值</p>
                  <div className="text-sm text-gray-400">
                    <p>搜索词："{searchQuery}"</p>
                    <p>相似度阈值：{searchParams.similarity_threshold}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {results.map((result, index) => (
                  <Card key={result.chunk_id} variant="interactive" className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-6 h-6 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">ID: {result.chunk_id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                          <Tooltip content={`总相似度: ${(result.similarity * 100).toFixed(1)}%`}>
                            <Badge 
                              variant={result.similarity > 0.8 ? 'default' : result.similarity > 0.6 ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              {(result.similarity * 100).toFixed(1)}%
                            </Badge>
                          </Tooltip>
                          <span className="flex items-center">
                            <Zap className="h-3 w-3 mr-1" />
                            向量: {(result.vector_similarity * 100).toFixed(1)}%
                          </span>
                          <span className="flex items-center">
                            <Search className="h-3 w-3 mr-1" />
                            文本: {(result.term_similarity * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-4 relative">
                        <div 
                          className="text-sm text-gray-700 leading-relaxed h-20 overflow-hidden cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          onClick={() => {
                            setSelectedResult(result)
                            setIsMarkdownPreview(false)
                          }}
                        >
                          <HighlightText
                            html={result.highlight}
                            text={result.text}
                            enableHighlight={searchParams.highlight}
                            truncate={true}
                            truncateLength={200}
                          />
                        </div>
                        {(result.text.length > 200 || (result.highlight && result.highlight.length > 200)) && (
                          <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white via-white to-transparent pl-8 pr-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2 text-xs text-primary-600 hover:text-primary-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedResult(result)
                                setIsMarkdownPreview(false)
                              }}
                            >
                              展开
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {/* 分割线 */}
                      <div className="border-t border-gray-100 pt-3 mb-3">
                        {/* 文档信息 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <FileIcon 
                              fileName={result.docnm_kwd}
                              fileType={result.docnm_kwd.split('.').pop() || 'txt'}
                              size="sm"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-700">
                                {result.docnm_kwd}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                来自文档
                              </div>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 px-2 text-xs flex-shrink-0"
                            onClick={() => {
                              // 可以添加查看详情的逻辑
                              console.log('查看详情:', result)
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            详情
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* 分页组件 */}
            {results.length > 0 && (
              <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    共 {totalResults} 个结果
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* 每页显示选择器 */}
                    <PageSizeSelector
                      pageSize={pageSize}
                      onChange={handlePageSizeChange}
                      options={[10, 20, 50, 100]}
                    />
                    
                    {/* 页码导航 */}
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                      >
                        上一页
                      </Button>
                      
                      <div className="flex items-center space-x-1">
                        {/* 页码按钮 */}
                        {Array.from({ length: Math.min(5, Math.ceil(totalResults / pageSize)) }, (_, i) => {
                          const totalPages = Math.ceil(totalResults / pageSize)
                          let pageNum
                          
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else {
                            if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(pageNum)}
                              className="min-w-[32px]"
                            >
                              {pageNum}
                            </Button>
                          )
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalResults / pageSize)}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* 配置面板 */}
          {showConfigPanel && (
            <div 
              className="absolute inset-0 z-30 flex justify-end"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowConfigPanel(false)
                }
              }}
            >
              <div className="w-[500px] bg-white shadow-lg border-l border-gray-200 flex flex-col">
              {/* 面板头部 */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SettingsIcon className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-medium text-gray-900">检索配置</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfigPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* 面板内容 */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin">
                  {/* 搜索模式选择 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      检索模式
                    </label>
                    <div className="space-y-2">
                      {searchModeOptions.map((option) => (
                        <div key={option.value}>
                          <label className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                              type="radio"
                              name="searchMode"
                              value={option.value}
                              checked={searchMode.type === option.value}
                              onChange={(e) => {
                                if (e.target.value === 'fusion') {
                                  setSearchMode({ type: 'fusion', weights: '0.05,0.95' })
                                } else if (e.target.value === 'hybrid') {
                                  setSearchMode({ type: 'hybrid', weight_dense: 0.7, weight_sparse: 0.3 })
                                } else {
                                  setSearchMode({ type: e.target.value as 'sparse' | 'dense' | 'hybrid' | 'fusion' })
                                }
                              }}
                              className="mt-0.5"
                              disabled={option.value === 'dense'}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                {option.icon}
                                <span className="text-sm font-medium text-gray-900">
                                  {option.label}
                                </span>
                                {option.value === 'dense' && (
                                  <Badge variant="secondary" className="text-xs">暂不可用</Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                            </div>
                          </label>
                          
                          {/* 混合检索权重设置 */}
                          {searchMode.type === 'hybrid' && option.value === 'hybrid' && (
                            <div className="mt-2 ml-6 space-y-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-2">
                                  向量权重
                                </label>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={searchMode.weight_dense || 0.7}
                                    onChange={(e) => {
                                      const denseWeight = Number(Number(e.target.value).toFixed(2))
                                      const sparseWeight = Number((1 - denseWeight).toFixed(2))
                                      setSearchMode(prev => ({
                                        ...prev,
                                        weight_dense: denseWeight,
                                        weight_sparse: sparseWeight
                                      }))
                                    }}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
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
                                <label className="block text-xs text-gray-600 mb-1">
                                  全文权重 (自动计算)
                                </label>
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1 h-2 bg-gray-100 rounded-lg relative">
                                    <div
                                      className="h-full bg-gray-300 rounded-lg"
                                      style={{ width: `${((searchMode.weight_sparse || 0.3) * 100).toFixed(0)}%` }}
                                    />
                                  </div>
                                  <div className="w-16 text-xs text-center py-1 px-2 bg-gray-100 rounded border">
                                    {(searchMode.weight_sparse || 0.3).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                                💡 向量权重 + 全文权重 = 1.00 (精确到小数点后2位)
                              </div>
                            </div>
                          )}
                          
                          {/* 融合检索权重设置 */}
                          {searchMode.type === 'fusion' && option.value === 'fusion' && (
                            <div className="mt-2 ml-6 space-y-3">
                              <div>
                                <label className="block text-xs text-gray-600 mb-2">
                                  文本权重
                                </label>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.01"
                                    value={parseFloat((searchMode.weights || '0.05,0.95').split(',')[0])}
                                    onChange={(e) => {
                                      const textWeight = Number(Number(e.target.value).toFixed(2))
                                      const vectorWeight = Number((1 - textWeight).toFixed(2))
                                      setSearchMode(prev => ({
                                        ...prev,
                                        weights: `${textWeight},${vectorWeight}`
                                      }))
                                    }}
                                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
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
                                <label className="block text-xs text-gray-600 mb-1">
                                  向量权重 (自动计算)
                                </label>
                                <div className="flex items-center space-x-3">
                                  <div className="flex-1 h-2 bg-gray-100 rounded-lg relative">
                                    <div
                                      className="h-full bg-gray-300 rounded-lg"
                                      style={{ width: `${(parseFloat((searchMode.weights || '0.05,0.95').split(',')[1]) * 100).toFixed(0)}%` }}
                                    />
                                  </div>
                                  <div className="w-16 text-xs text-center py-1 px-2 bg-gray-100 rounded border">
                                    {parseFloat((searchMode.weights || '0.05,0.95').split(',')[1]).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 bg-green-50 p-2 rounded">
                                💡 文本权重 + 向量权重 = 1.00 (精确到小数点后2位)
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 高级参数 */}
                  <div>
                    <button
                      onClick={() => setAdvancedOpen(!advancedOpen)}
                      className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-3"
                    >
                      <span className="flex items-center">
                        <SettingsIcon className="h-4 w-4 mr-2" />
                        高级参数
                      </span>
                      {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    {advancedOpen && (
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              页大小
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={searchParams.size}
                              onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                size: Number(e.target.value)
                              }))}
                              className="text-xs h-8"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              相似度阈值
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={searchParams.similarity_threshold}
                              onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                similarity_threshold: Number(e.target.value)
                              }))}
                              className="text-xs h-8"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              向量权重
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.1"
                              value={searchParams.vector_similarity_weight}
                              onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                vector_similarity_weight: Number(e.target.value)
                              }))}
                              className="text-xs h-8"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Top-K
                            </label>
                            <Input
                              type="number"
                              min="1"
                              max="2048"
                              value={searchParams.top_k}
                              onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                top_k: Number(e.target.value)
                              }))}
                              className="text-xs h-8"
                            />
                          </div>
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
                        
                        <div className="space-y-3">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={searchParams.use_kg}
                              onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                use_kg: e.target.checked
                              }))}
                              className="text-primary-600"
                            />
                            <span className="text-xs text-gray-700">使用知识图谱</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={searchParams.highlight}
                              onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                highlight: e.target.checked
                              }))}
                              className="text-primary-600"
                            />
                            <span className="text-xs text-gray-700">高亮匹配文本</span>
                          </label>
                          
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={searchParams.keyword}
                              onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                keyword: e.target.checked
                              }))}
                              className="text-primary-600"
                            />
                            <span className="text-xs text-gray-700">关键词增强</span>
                          </label>
                        </div>
                        
                        {/* 跨语言搜索 */}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-2">
                            跨语言翻译
                            {selectedLanguages.length > 0 && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {selectedLanguages.length}种语言
                              </Badge>
                            )}
                          </label>
                          <div className="relative language-selector">
                            <button
                              type="button"
                              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                              className="w-full px-3 py-2 text-left text-xs border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            >
                              {selectedLanguages.length === 0 
                                ? '选择翻译语言...' 
                                : `已选择 ${selectedLanguages.length} 种语言`
                              }
                              <ChevronDown className="absolute right-2 top-2.5 h-3 w-3" />
                            </button>
                            
                            {showLanguageSelector && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto scrollbar-thin">
                                {['English', 'Chinese', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Vietnamese'].map((lang) => (
                                  <label key={lang} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={selectedLanguages.includes(lang)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedLanguages(prev => [...prev, lang])
                                        } else {
                                          setSelectedLanguages(prev => prev.filter(l => l !== lang))
                                        }
                                      }}
                                      className="mr-2 text-primary-600"
                                    />
                                    <span className="text-xs text-gray-700">{lang}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {selectedLanguages.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedLanguages.map((lang) => (
                                <Badge key={lang} variant="secondary" className="text-xs">
                                  {lang}
                                  <button
                                    onClick={() => setSelectedLanguages(prev => prev.filter(l => l !== lang))}
                                    className="ml-1 hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                </Badge>
                              ))}
                              <button
                                onClick={() => setSelectedLanguages([])}
                                className="text-xs text-gray-500 hover:text-gray-700 ml-2"
                              >
                                清除全部
                              </button>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-1">
                            💡 将问题翻译成选中的语言进行检索，提高多语言内容匹配率
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
              </div>
              
              {/* 面板底部 */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
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
            <div className="absolute inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* 弹窗头部 */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileIcon 
                      fileName={selectedResult.docnm_kwd}
                      fileType={selectedResult.docnm_kwd.split('.').pop() || 'txt'}
                      size="sm"
                    />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">内容预览</h3>
                      <p className="text-sm text-gray-500">{selectedResult.docnm_kwd}</p>
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
                          isMarkdownPreview ? "bg-blue-50 text-blue-600 border-blue-300" : ""
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
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-600 font-medium">
                        Beta
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedResult(null)
                        setIsMarkdownPreview(false)
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* 弹窗内容 */}
                <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
                  {isMarkdownPreview ? (
                    <div className="w-full h-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto scrollbar-thin">
                      <div 
                        className="prose prose-sm max-w-none text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: (() => {
                            let content = selectedResult.text
                            
                            // Markdown语法处理逻辑
                            content = content
                              // 标题处理
                              .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900">$1</h3>')
                              .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2 text-gray-900">$1</h2>')
                              .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-900">$1</h1>')
                              // 列表处理
                              .replace(/^[\s]*[-*+] (.*?)$/gm, '<ul class="list-disc ml-4 my-2"><li class="my-1">$1</li></ul>')
                              .replace(/^[\s]*\d+\. (.*?)$/gm, '<ol class="list-decimal ml-4 my-2"><li class="my-1">$1</li></ol>')
                              // 代码块处理
                              .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-md my-3 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
                              // 行内代码
                              .replace(/`([^`]*)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
                              // 粗体
                              .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                              // 斜体
                              .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                              // 链接
                              .replace(/\[([^\]]*)\]\(([^)]*)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank">$1</a>')
                              // 换行处理
                              .replace(/\n\n/g, '</p><p class="mb-3">')
                              .replace(/\n/g, '<br>')
                            
                            return `<p class="mb-3">${content}</p>`
                          })()
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full px-4 py-3 border border-gray-300 rounded-md bg-white overflow-y-auto scrollbar-thin">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
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
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600">
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
                    <div className="text-xs text-gray-500">
                      字符数: {selectedResult.text.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export { KnowledgeSearchPage }