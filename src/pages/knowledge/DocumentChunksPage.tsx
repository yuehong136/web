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
  ChevronDown,
  ChevronRight,
  Tag,
  Eye,
  Code
} from 'lucide-react'
import { knowledgeAPI } from '../../api/knowledge'
import { 
  Button,
  Input, 
  Card,
  Modal,
  ConfirmModal,
  Tooltip,
  PageSizeSelector,
  ToggleSwitch
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingChunkId, setDeletingChunkId] = useState<string>('')
  
  // 表单状态
  const [newChunkContent, setNewChunkContent] = useState('')
  const [editingChunkContent, setEditingChunkContent] = useState('')
  
  // 切片配置展开状态
  const [showParserConfig, setShowParserConfig] = useState(false)
  
  // Markdown预览状态
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false)
  
  // 元数据标注状态
  const [metaModalOpen, setMetaModalOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<Array<{id: string; key: string; value: any}>>([])
  const [nextMetaId, setNextMetaId] = useState(1)
  
  // 计算筛选后的分段数据（状态筛选在前端，搜索在后端）
  const filteredChunks = React.useMemo(() => {
    // 只应用状态筛选，搜索已在后端完成
    if (filterStatus === 'all') {
      return chunks
    }
    
    return chunks.filter(chunk => {
      if (filterStatus === 'enabled') {
        return chunk.available_int === 1
      } else {
        return chunk.available_int === 0
      }
    })
  }, [chunks, filterStatus])
  
  
  
  // 监听搜索关键词变化，重置到第一页
  useEffect(() => {
    if (page !== 1) {
      setPage(1)
    }
  }, [searchKeyword])
  
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
          keywords: searchKeyword.trim() || undefined
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
    if (!docId) return
    
    try {
      const newStatus = chunk.available_int === 1 ? 0 : 1
      
      // 调用真实的switch API
      await knowledgeAPI.document.switchChunks({
        doc_id: docId,
        chunk_ids: [chunk.chunk_id],
        available_int: newStatus
      })
      
      // 更新本地状态（filteredChunks会自动重新计算）
      setChunks(prev => prev.map(c => 
        c.chunk_id === chunk.chunk_id 
          ? { ...c, available_int: newStatus }
          : c
      ))
      
    } catch (error) {
      console.error('Failed to toggle chunk status:', error)
      alert('切换分段状态失败，请重试')
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
    if (!selectedChunk || !editingChunkContent.trim() || !docId) return
    
    try {
      // 调用 chunk set 接口
      await knowledgeAPI.document.setChunk({
        doc_id: docId,
        chunk_id: selectedChunk.chunk_id,
        content_with_weight: editingChunkContent
      })
      
      // 更新本地状态（filteredChunks会自动重新计算）
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
      alert('保存分段失败，请重试')
    }
  }
  
  // 删除分段
  const handleDeleteChunk = async () => {
    if (!deletingChunkId || !docId) return
    
    try {
      // 调用真实的删除API
      await knowledgeAPI.document.deleteChunks({
        doc_id: docId,
        chunk_ids: [deletingChunkId]
      })
      
      // 更新本地状态
      setChunks(prev => prev.filter(c => c.chunk_id !== deletingChunkId))
      setTotal(prev => prev - 1) // 更新总数
      
      setDeleteConfirmOpen(false)
      setDeletingChunkId('')
      
      // 可选：显示成功提示
      // toast.success('分段删除成功')
      
    } catch (error) {
      console.error('Failed to delete chunk:', error)
      alert('删除分段失败，请重试')
    }
  }
  
  // 开始元数据标注
  const handleStartMetaAnnotation = () => {
    // 初始化编辑状态，将对象转换为数组格式
    const currentMeta = docInfo?.meta_fields || {}
    const metaArray = Object.entries(currentMeta).map(([key, value], index) => ({
      id: `meta_${index + 1}`,
      key,
      value
    }))
    setEditingMeta(metaArray)
    setNextMetaId(metaArray.length + 1)
    setMetaModalOpen(true)
  }
  
  // 保存元数据
  const handleSaveMeta = async () => {
    if (!docId) return
    
    try {
      // 将数组格式转换回对象格式
      const metaObject = editingMeta.reduce((acc, item) => {
        if (item.key.trim()) {
          acc[item.key] = item.value
        }
        return acc
      }, {} as Record<string, any>)
      
      await knowledgeAPI.document.setDocumentMeta({
        doc_id: docId,
        meta: metaObject
      })
      
      // 更新本地文档信息
      if (docInfo) {
        setDocInfo({
          ...docInfo,
          meta_fields: metaObject
        })
      }
      
      setMetaModalOpen(false)
      setEditingMeta([])
    } catch (error) {
      console.error('Failed to save meta:', error)
      alert('保存元数据失败，请重试')
    }
  }
  
  // 添加元数据字段
  const handleAddMetaField = () => {
    const newId = `meta_${nextMetaId}`
    setEditingMeta(prev => [...prev, {
      id: newId,
      key: `field_${nextMetaId}`,
      value: ''
    }])
    setNextMetaId(prev => prev + 1)
  }
  
  // 删除元数据字段
  const handleRemoveMetaField = (id: string) => {
    setEditingMeta(prev => prev.filter(item => item.id !== id))
  }
  
  // 更新元数据字段的key
  const handleUpdateMetaKey = (id: string, newKey: string) => {
    setEditingMeta(prev => prev.map(item => 
      item.id === id ? { ...item, key: newKey } : item
    ))
  }
  
  // 更新元数据字段的value
  const handleUpdateMetaValue = (id: string, newValue: any) => {
    setEditingMeta(prev => prev.map(item => 
      item.id === id ? { ...item, value: newValue } : item
    ))
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
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-2",
                      filterStatus === 'all'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <span>全部</span>
                    <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                      {chunks.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFilterStatus('enabled')}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-2",
                      filterStatus === 'enabled'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                      启用
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      {chunks.filter(c => c.available_int === 1).length}
                    </span>
                  </button>
                  <button
                    onClick={() => setFilterStatus('disabled')}
                    className={cn(
                      "px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center space-x-2",
                      filterStatus === 'disabled'
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <span className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5" />
                      禁用
                    </span>
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      {chunks.filter(c => c.available_int === 0).length}
                    </span>
                  </button>
                </div>
                
                {/* 搜索框 */}
                <div className="w-full sm:w-64">
                  <Input
                    type="search"
                    placeholder="搜索分段内容..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        // 触发搜索（实际上会通过 useEffect 自动触发）
                        e.preventDefault()
                      }
                    }}
                    leftIcon={<Search className="h-4 w-4" />}
                    className="w-full"
                  />
                </div>
                
                {/* 结果统计和展开折叠控制 */}
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    显示 {filteredChunks.length} / {total} 个分段
                    {searchKeyword.trim() && (
                      <span className="ml-2 text-blue-600">
                        (搜索: "{searchKeyword.trim()}")
                      </span>
                    )}
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
                      setIsMarkdownPreview(false) // 重置为编辑模式
                    }}
                  >
                    {/* 分段头部 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Tooltip content={`完整ID: ${chunk.chunk_id}`}>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 cursor-help">
                            {chunk.chunk_id.length > 16 
                              ? `${chunk.chunk_id.slice(0, 8)}...${chunk.chunk_id.slice(-8)}`
                              : chunk.chunk_id
                            }
                          </span>
                        </Tooltip>
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm",
                          chunk.available_int === 1
                            ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                            : "bg-red-100 text-red-700 ring-1 ring-red-200"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full mr-1.5",
                            chunk.available_int === 1 ? "bg-green-500" : "bg-red-500"
                          )} />
                          {chunk.available_int === 1 ? '启用' : '禁用'}
                        </span>
                      </div>
                      
                      {/* 悬停时显示的操作按钮 */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                        <div onClick={(e) => e.stopPropagation()}>
                          <ToggleSwitch
                            checked={chunk.available_int === 1}
                            onChange={() => handleToggleChunkStatus(chunk)}
                            size="sm"
                            leftLabel="禁用"
                            rightLabel="启用"
                            className="bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-md border border-gray-200"
                          />
                        </div>
                        <Tooltip content="编辑分段">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedChunk(chunk)
                              setIsEditMode(true)
                              setEditingChunkContent(chunk.content_with_weight)
                              setIsMarkdownPreview(false) // 重置为编辑模式
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
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900">
                      编辑分段
                    </h3>
                    <Tooltip content={`完整ID: ${selectedChunk.chunk_id}`}>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-help">
                        {selectedChunk.chunk_id.length > 16 
                          ? `${selectedChunk.chunk_id.slice(0, 8)}...${selectedChunk.chunk_id.slice(-8)}`
                          : selectedChunk.chunk_id
                        }
                      </span>
                    </Tooltip>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setIsEditMode(false)
                      setSelectedChunk(null)
                      setEditingChunkContent('')
                      setIsMarkdownPreview(false) // 重置预览状态
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      分段内容
                    </label>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                        className={cn(
                          "text-xs flex items-center space-x-1",
                          isMarkdownPreview ? "bg-blue-50 text-blue-600 border-blue-300" : ""
                        )}
                      >
                        {isMarkdownPreview ? (
                          <>
                            <Code className="h-3 w-3" />
                            <span>编辑</span>
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
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    {isMarkdownPreview ? (
                      <div className="w-full h-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 overflow-y-auto">
                        <div 
                          className="prose prose-sm max-w-none text-sm leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              let content = editingChunkContent
                              
                              // 表格处理（需要在其他处理之前）
                              content = content.replace(/(\|[^\n]*\|\n\|[-:\s|]+\|\n(?:\|[^\n]*\|\n?)*)/g, (match) => {
                                const lines = match.trim().split('\n')
                                if (lines.length < 3) return match
                                
                                const headers = lines[0].split('|').map(h => h.trim()).filter(h => h !== '')
                                const separators = lines[1].split('|').map(s => s.trim()).filter(s => s !== '')
                                const rows = lines.slice(2).map(line => 
                                  line.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
                                )
                                
                                // 检查是否是有效的表格格式
                                if (headers.length === 0 || separators.length === 0 || separators.every(s => !/^[-:]+$/.test(s))) {
                                  return match
                                }
                                
                                let tableHtml = '<table class="min-w-full border-collapse border border-gray-300 my-4">'
                                
                                // 表头
                                tableHtml += '<thead class="bg-gray-50">'
                                tableHtml += '<tr>'
                                headers.forEach(header => {
                                  tableHtml += `<th class="border border-gray-300 px-3 py-2 text-left font-semibold text-gray-900">${header}</th>`
                                })
                                tableHtml += '</tr>'
                                tableHtml += '</thead>'
                                
                                // 表格内容
                                tableHtml += '<tbody>'
                                rows.forEach((row, index) => {
                                  tableHtml += `<tr class="${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">`
                                  row.forEach((cell, cellIndex) => {
                                    if (cellIndex < headers.length) {
                                      tableHtml += `<td class="border border-gray-300 px-3 py-2 text-gray-700">${cell}</td>`
                                    }
                                  })
                                  // 填充空单元格
                                  for (let i = row.length; i < headers.length; i++) {
                                    tableHtml += '<td class="border border-gray-300 px-3 py-2 text-gray-700"></td>'
                                  }
                                  tableHtml += '</tr>'
                                })
                                tableHtml += '</tbody>'
                                tableHtml += '</table>'
                                
                                return tableHtml
                              })
                              
                              // 其他 Markdown 语法处理
                              content = content
                                // 标题
                                .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-900">$1</h3>')
                                .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2 text-gray-900">$1</h2>')
                                .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2 text-gray-900">$1</h1>')
                                // 列表
                                .replace(/^[\s]*[-*+] (.*?)$/gm, '<ul class="list-disc ml-4 my-2"><li class="my-1">$1</li></ul>')
                                .replace(/^[\s]*\d+\. (.*?)$/gm, '<ol class="list-decimal ml-4 my-2"><li class="my-1">$1</li></ol>')
                                // 代码块
                                .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-md my-3 overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
                                // 行内代码
                                .replace(/`(.*?)`/g, '<code class="bg-gray-200 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
                                // 粗体和斜体
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                                .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                                // 链接
                                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>')
                                // 换行
                                .replace(/\n\n/g, '<br><br>')
                                .replace(/\n/g, '<br>')
                              
                              return content
                            })()
                          }}
                        />
                      </div>
                    ) : (
                      <textarea
                        value={editingChunkContent}
                        onChange={(e) => setEditingChunkContent(e.target.value)}
                        className="w-full h-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm font-mono leading-relaxed"
                        placeholder="请输入分段内容...&#10;&#10;支持 Markdown 语法：&#10;# 标题1  ## 标题2  ### 标题3&#10;**粗体** *斜体* `行内代码`&#10;```代码块```&#10;- 列表项  1. 数字列表&#10;[链接文本](URL)&#10;| 表头1 | 表头2 |&#10;|-------|-------|&#10;| 数据1 | 数据2 |"
                        style={{ minHeight: '300px' }}
                      />
                    )}
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
                      setIsMarkdownPreview(false) // 重置预览状态
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
                    onClick={handleStartMetaAnnotation}
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


      {/* 删除确认模态框 */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteChunk}
        title="确认删除分段"
        description={`确定要删除分段 "${deletingChunkId}" 吗？此操作不可逆。`}
      />

      {/* 元数据标注模态框 */}
      <Modal
        open={metaModalOpen}
        onClose={() => setMetaModalOpen(false)}
        title="文档元数据标注"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-sm text-gray-600">
            为文档添加结构化元数据，便于后续的检索和分析。
          </div>
          
          {/* 元数据字段列表 */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {editingMeta.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      字段名
                    </label>
                    <Input
                      value={item.key}
                      onChange={(e) => handleUpdateMetaKey(item.id, e.target.value)}
                      placeholder="字段名..."
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      字段值
                    </label>
                    <Input
                      value={typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
                      onChange={(e) => {
                        let newValue: any = e.target.value
                        // 尝试解析JSON，如果失败则作为字符串
                        try {
                          if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                            newValue = JSON.parse(e.target.value)
                          }
                        } catch {
                          // 保持为字符串
                        }
                        handleUpdateMetaValue(item.id, newValue)
                      }}
                      placeholder="字段值..."
                      className="text-sm"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleRemoveMetaField(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {editingMeta.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p>暂无元数据字段</p>
                <p className="text-sm">点击下方按钮添加第一个字段</p>
              </div>
            )}
          </div>
          
          {/* 添加字段按钮 */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={handleAddMetaField}
              className="w-full text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              添加元数据字段
            </Button>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setMetaModalOpen(false)
                setEditingMeta([])
              }}
            >
              取消
            </Button>
            <Button onClick={handleSaveMeta}>
              <Save className="h-4 w-4 mr-2" />
              保存元数据
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { DocumentChunksPage }