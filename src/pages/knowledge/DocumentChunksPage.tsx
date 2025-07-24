import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Tag
} from 'lucide-react'
import { knowledgeAPI } from '../../api/knowledge'
import type { DocumentChunk, Document } from '../../types/api'
import { 
  Button,
  Input, 
  Card,
  Modal,
  ConfirmModal,
  Tooltip,
  PageSizeSelector
} from '../../components/ui'
import { cn } from '../../lib/utils'

// 新的Chunk数据类型（匹配新API）
interface ChunkData {
  chunk_id: string
  content_with_weight: string
  doc_id: string
  docnm_kwd: string
  important_kwd: string[]
  question_kwd: string[]
  img_id: string
  available_int: number
  positions: number[][]
}


const DocumentChunksPage: React.FC = () => {
  const { id: kbId, docId } = useParams<{ id: string; docId: string }>()
  const navigate = useNavigate()
  
  // 状态管理
  const [docInfo, setDocInfo] = useState<any>(null)
  const [chunks, setChunks] = useState<ChunkData[]>([])
  const [filteredChunks, setFilteredChunks] = useState<ChunkData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 分页状态
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 模态框状态
  const [addChunkModalOpen, setAddChunkModalOpen] = useState(false)
  const [editChunkModalOpen, setEditChunkModalOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingChunkId, setDeletingChunkId] = useState<string>('')
  
  // 表单状态
  const [newChunkContent, setNewChunkContent] = useState('')
  const [editingChunkContent, setEditingChunkContent] = useState('')
  
  // 切片配置展开状态
  const [showParserConfig, setShowParserConfig] = useState(false)
  
  
  
  // 应用筛选
  useEffect(() => {
    let filtered = chunks
    
    // 状态筛选
    if (filterStatus !== 'all') {
      filtered = filtered.filter(chunk => {
        if (filterStatus === 'enabled') {
          return chunk.available_int === 1
        } else {
          return chunk.available_int === 0
        }
      })
    }
    
    setFilteredChunks(filtered)
  }, [chunks, filterStatus])
  
  // 监听搜索关键词变化，重新获取数据
  useEffect(() => {
    if (page !== 1) {
      setPage(1) // 重置页码
    }
  }, [searchKeyword, page])
  
  // 监听分页参数变化，重新获取数据
  useEffect(() => {
    const loadChunks = async () => {
      if (!docId || !kbId) return
      
      try {
        setLoading(true)
        // 使用新的listChunks API
        const response = await knowledgeAPI.document.listChunks({
          doc_id: docId,
          page,
          size: pageSize,
          keywords: searchKeyword || undefined
        })
        
        setChunks(response.chunks)
        setTotal(response.total)
        setDocInfo(response.doc)
      } catch (error) {
        console.error('Failed to fetch chunks:', error)
        // 如果API调用失败，使用模拟数据
        const mockTotal = 156 // 模拟总数
        const startIndex = (page - 1) * pageSize
        const mockChunks: ChunkData[] = Array.from({ length: Math.min(pageSize, mockTotal - startIndex) }, (_, i) => ({
          chunk_id: `chunk-${startIndex + i + 1}`,
          content_with_weight: `这是第 ${startIndex + i + 1} 个文档分段的内容。包含了文档的重要信息和上下文，用于向量检索和知识问答。内容可能会很长，需要合理的显示和编辑功能。这里是更多的示例文本，用来展示分段的实际长度和格式。在这个分段中，我们可以看到更多详细的内容展示，包括各种类型的文本处理和显示效果。`,
          doc_id: docId,
          docnm_kwd: '测试文档.docx',
          important_kwd: ['关键词', '文档', '分段'],
          question_kwd: [],
          img_id: '',
          available_int: Math.random() > 0.3 ? 1 : 0,
          positions: []
        }))
        setChunks(mockChunks)
        setTotal(mockTotal)
        setDocInfo({
          id: docId,
          name: '测试文档.docx',
          kb_id: kbId || ''
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadChunks()
  }, [docId, page, pageSize, searchKeyword, kbId])
  
  // 切换分段状态
  const handleToggleChunkStatus = async (chunk: ChunkData) => {
    try {
      const newStatus = chunk.available_int === 1 ? 0 : 1
      
      // 模拟API调用
      // await api.chunk.switch(chunk.chunk_id, newStatus)
      
      setChunks(prev => prev.map(c => 
        c.chunk_id === chunk.chunk_id 
          ? { ...c, available_int: newStatus }
          : c
      ))
    } catch (error) {
      console.error('Failed to toggle chunk status:', error)
    }
  }
  
  // 创建分段
  const handleCreateChunk = async () => {
    if (!newChunkContent.trim()) return
    
    try {
      // 模拟API调用
      // const newChunk = await api.chunk.create({ content: newChunkContent, doc_id: docId })
      
      const newChunk: ChunkData = {
        chunk_id: `chunk-new-${Date.now()}`,
        content_with_weight: newChunkContent,
        doc_id: docId!,
        docnm_kwd: docInfo?.name || '',
        important_kwd: [],
        question_kwd: [],
        img_id: '',
        available_int: 1,
        positions: []
      }
      
      setChunks(prev => [...prev, newChunk])
      setNewChunkContent('')
      setAddChunkModalOpen(false)
    } catch (error) {
      console.error('Failed to create chunk:', error)
    }
  }
  
  // 编辑分段
  const handleEditChunk = async () => {
    if (!selectedChunk || !editingChunkContent.trim()) return
    
    try {
      // 模拟API调用 - 待实现chunk.set接口
      // await api.chunk.set(selectedChunk.chunk_id, { content: editingChunkContent })
      
      setChunks(prev => prev.map(c => 
        c.chunk_id === selectedChunk.chunk_id 
          ? { ...c, content_with_weight: editingChunkContent }
          : c
      ))
      
      setIsEditMode(false)
      setSelectedChunk(null)
      setEditingChunkContent('')
    } catch (error) {
      console.error('Failed to edit chunk:', error)
    }
  }
  
  // 删除分段
  const handleDeleteChunk = async () => {
    if (!deletingChunkId) return
    
    try {
      // 模拟API调用 - 待实现chunk.delete接口
      // await api.chunk.delete(deletingChunkId)
      
      setChunks(prev => prev.filter(c => c.chunk_id !== deletingChunkId))
      setDeleteConfirmOpen(false)
      setDeletingChunkId('')
    } catch (error) {
      console.error('Failed to delete chunk:', error)
    }
  }
  
  // 格式化日期
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* 页面标题栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/knowledge/${kbId}/documents`)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回文档列表
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {docInfo?.name || '文档解析块'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                共 {total} 个分段
              </p>
            </div>
          </div>
          
          {/* 添加分段按钮 */}
          <Button
            onClick={() => setAddChunkModalOpen(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加分段
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* 左侧分段列表区域 */}
        <div className="w-full lg:w-[70%] flex flex-col bg-white border-r border-gray-200 min-h-0">
          {/* 筛选器工具栏 */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* 状态筛选按钮组 */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                      filterStatus === 'all'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setFilterStatus('enabled')}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                      filterStatus === 'enabled'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    启用
                  </button>
                  <button
                    onClick={() => setFilterStatus('disabled')}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                      filterStatus === 'disabled'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    禁用
                  </button>
                </div>
                
                {/* 搜索框 */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索分段内容..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                
                {/* 结果统计和展开折叠控制 */}
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    显示 {filteredChunks.length} / {chunks.length} 个分段
                  </div>
                  
                  <Tooltip content={isExpanded ? '折叠分段' : '展开分段'}>
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* 分段列表和分页容器 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                加载中...
              </div>
            ) : filteredChunks.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>暂无匹配的分段</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredChunks.map((chunk) => (
                  <div
                    key={chunk.chunk_id}
                    className={cn(
                      "group relative bg-white rounded-lg border border-gray-200 p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                      selectedChunk?.chunk_id === chunk.chunk_id && "ring-2 ring-blue-500 border-blue-500"
                    )}
                    onClick={() => {
                      setSelectedChunk(chunk)
                      setIsEditMode(true)
                      setEditingChunkContent(chunk.content_with_weight)
                    }}
                  >
                    {/* 分段头部 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          {chunk.chunk_id.slice(-8)}
                        </span>
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 rounded text-xs font-medium",
                          chunk.available_int === 1
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        )}>
                          {chunk.available_int === 1 ? '启用' : '禁用'}
                        </span>
                      </div>
                      
                      {/* 悬停时显示的操作按钮 */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                        <Tooltip content={chunk.available_int === 1 ? '禁用分段' : '启用分段'}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleChunkStatus(chunk)
                            }}
                          >
                            {chunk.available_int === 1 ? 
                              <ToggleRight className="h-4 w-4 text-green-600" /> : 
                              <ToggleLeft className="h-4 w-4 text-gray-400" />
                            }
                          </Button>
                        </Tooltip>
                        <Tooltip content="编辑分段">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedChunk(chunk)
                              setEditingChunkContent(chunk.content_with_weight)
                              setEditChunkModalOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4 text-blue-600" />
                          </Button>
                        </Tooltip>
                        <Tooltip content="删除分段">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingChunkId(chunk.chunk_id)
                              setDeleteConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* 分段内容预览 */}
                    <div className="text-sm text-gray-700 leading-relaxed">
                      <div className={isExpanded ? "" : "line-clamp-3"}>
                        {chunk.content_with_weight}
                      </div>
                    </div>
                    
                    {/* 分段关键词 */}
                    {chunk.important_kwd && chunk.important_kwd.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          {chunk.important_kwd.map((keyword, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700">
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            )}
            </div>
            
            {/* 分页组件 - sticky 粘性定位 */}
            {total > 0 && (
              <div className="sticky bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    共 {total} 个分段
                  </div>
                  
                  <div className="flex items-center space-x-4">
                  {/* 每页显示选择器 */}
                  <PageSizeSelector
                    pageSize={pageSize}
                    onChange={(size) => {
                      setPageSize(size)
                      setPage(1) // 重置到第一页
                    }}
                    options={[10, 20, 30, 50]}
                  />
                  
                  {/* 页码导航 */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      上一页
                    </Button>
                    
                    <div className="flex items-center space-x-1">
                      {/* 页码按钮 */}
                      {Array.from({ length: Math.min(5, Math.ceil(total / pageSize)) }, (_, i) => {
                        const totalPages = Math.ceil(total / pageSize)
                        let pageNum
                        
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else {
                          if (page <= 3) {
                            pageNum = i + 1
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = page - 2 + i
                          }
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
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
                      onClick={() => setPage(page + 1)}
                      disabled={page >= Math.ceil(total / pageSize)}
                    >
                      下一页
                    </Button>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 右侧操作面板 */}
        <div className="w-full lg:w-[30%] bg-gray-50 flex flex-col relative">
          {/* 编辑模式覆盖层 */}
          {isEditMode && selectedChunk && (
            <div className="absolute inset-0 bg-white z-30 flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    编辑分段 {selectedChunk.chunk_id.slice(-8)}
                  </h3>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setIsEditMode(false)
                      setSelectedChunk(null)
                      setEditingChunkContent('')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分段内容
                    </label>
                    <textarea
                      value={editingChunkContent}
                      onChange={(e) => setEditingChunkContent(e.target.value)}
                      className="w-full h-80 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                      placeholder="请输入分段内容..."
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditMode(false)
                      setSelectedChunk(null)
                      setEditingChunkContent('')
                    }}
                  >
                    取消
                  </Button>
                  <Button 
                    onClick={handleEditChunk}
                    disabled={!editingChunkContent.trim()}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* 默认内容区域 */}
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            {/* 元数据标注区域 */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">元数据</h3>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <p>元数据是关于文档的数据，用于描述文档的属性。元数据可以帮助您更好地组织和管理文档。</p>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      // TODO: 实现元数据标注功能
                      alert('元数据标注功能开发中...')
                    }}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    开始标注
                  </Button>
                </div>
              </div>
            </Card>

            {/* 文档信息区域 */}
            {docInfo && (
              <Card>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">文档信息</h3>
                  <div className="space-y-4">
                    
                    {/* 元数据信息 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">元数据信息</h4>
                      <div className="bg-gray-50 rounded-lg p-3">
                        {Object.keys(docInfo.meta_fields || {}).length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {Object.entries(docInfo.meta_fields || {}).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{key}:</span>
                                <span className="text-gray-900">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">暂无元数据</span>
                        )}
                      </div>
                    </div>

                    {/* 文件信息 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">文件信息</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">文件名：</span>
                          <span className="text-gray-900 font-medium break-all text-right ml-2">{docInfo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">创建者：</span>
                          <span className="text-gray-900">{docInfo.created_by}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">创建时间：</span>
                          <span className="text-gray-900">{formatDate(docInfo.create_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">更新时间：</span>
                          <span className="text-gray-900">{formatDate(docInfo.update_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">文件大小：</span>
                          <span className="text-gray-900">{formatFileSize(docInfo.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">来源：</span>
                          <span className="text-gray-900">{docInfo.source_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* 技术参数 */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">技术参数</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">切片方法：</span>
                          <span className="text-gray-900">{docInfo.parser_id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">详细切片配置：</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowParserConfig(!showParserConfig)}
                            className="text-xs h-6 px-2 text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            {showParserConfig ? (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                收起
                              </>
                            ) : (
                              <>
                                <ChevronRight className="h-3 w-3" />
                                展开
                              </>
                            )}
                          </Button>
                        </div>
                        
                        {/* 可折叠的配置详情 */}
                        {showParserConfig && (
                          <div className="mt-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                              {JSON.stringify(docInfo.parser_config, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">段落数量：</span>
                          <span className="text-gray-900">{docInfo.chunk_num}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">嵌入花费：</span>
                          <span className="text-gray-900">{docInfo.token_num} tokens</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 添加分段模态框 */}
      <Modal
        open={addChunkModalOpen}
        onClose={() => setAddChunkModalOpen(false)}
        title="添加新分段"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分段内容
            </label>
            <textarea
              value={newChunkContent}
              onChange={(e) => setNewChunkContent(e.target.value)}
              placeholder="输入分段内容..."
              className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setAddChunkModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateChunk} disabled={!newChunkContent.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              添加分段
            </Button>
          </div>
        </div>
      </Modal>

      {/* 编辑分段模态框 */}
      <Modal
        open={editChunkModalOpen}
        onClose={() => setEditChunkModalOpen(false)}
        title={`编辑分段 ${selectedChunk?.chunk_id.slice(-8)}`}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分段内容
            </label>
            <textarea
              value={editingChunkContent}
              onChange={(e) => setEditingChunkContent(e.target.value)}
              className="w-full h-48 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => setEditChunkModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditChunk} disabled={!editingChunkContent.trim()}>
              <Save className="h-4 w-4 mr-2" />
              保存修改
            </Button>
          </div>
        </div>
      </Modal>

      {/* 删除确认模态框 */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteChunk}
        title="确认删除"
        description="确定要删除这个分段吗？此操作不可逆。"
      />
    </div>
  )
}

export { DocumentChunksPage }