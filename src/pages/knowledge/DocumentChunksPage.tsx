import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { 
  FileText, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Tag,
  Eye,
  Code,
  ListFilter,
  CheckCircle,
  Ban,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  MessageCircleQuestion,
  Key,
  Image as ImageIcon,
  ZoomIn,
} from 'lucide-react'
import { knowledgeAPI } from '@/api/knowledge'
import { API_BASE_URL, API_VERSION } from '@/constants'
import { 
  Button,
  Input, 
  Card,
  Modal,
  ConfirmModal,
  Tooltip,
  PageSizeSelector,
  ToggleSwitch,
  Checkbox,
  Label,
  TagEditor,
  ImageUploader
} from '../../components/ui'
import { fileToBase64 } from '@/lib/utils'
import { 
  Popover, 
  PopoverTrigger, 
  PopoverContent 
} from '../../components/ui/popover'
import { cn } from '@/lib/utils'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { Segmented, SegmentedItem } from '@/components/vendor/ui/segmented'
import DOMPurify from 'dompurify'
import { DocumentPreview } from '@/components/knowledge/DocumentPreview'

type CSSVarStyle = React.CSSProperties & Record<`--${string}`, string>

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
  /** 分块类型：text | image | table 等 */
  doc_type_kwd?: string
}


const DocumentChunksPage: React.FC = () => {
  const { docId } = useParams<{ id: string; docId: string }>()
  const _queryClient = useQueryClient()
  
  // 状态管理
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [deleteSelectedConfirmOpen, setDeleteSelectedConfirmOpen] = useState(false)
  
  // 文本显示模式：full=全文, ellipse=省略
  const [textMode, setTextMode] = useState<'full' | 'ellipse'>('ellipse')
  
  // 筛选状态
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all')
  const [searchKeyword, setSearchKeyword] = useState('')
  const debouncedSearchKeyword = useDebouncedValue(searchKeyword.trim(), 400)
  
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
  const [editingImportantKwd, setEditingImportantKwd] = useState<string[]>([])
  const [editingQuestionKwd, setEditingQuestionKwd] = useState<string[]>([])
  
  // 新建分块的关键词和问题
  const [newImportantKwd, setNewImportantKwd] = useState<string[]>([])
  const [newQuestionKwd, setNewQuestionKwd] = useState<string[]>([])
  
  // 图片上传状态（仅用于编辑 image 类型分块）
  const [editingImage, setEditingImage] = useState<File[]>([])
  
  // 图片预览弹窗状态
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  
  // 切片配置展开状态
  const [showParserConfig, setShowParserConfig] = useState(false)
  
  // Markdown预览状态
  const [isMarkdownPreview, setIsMarkdownPreview] = useState(false)
  
  // 元数据标注状态
  const [metaModalOpen, setMetaModalOpen] = useState(false)
  const [editingMeta, setEditingMeta] = useState<Array<{id: string; key: string; value: unknown}>>([])
  const [nextMetaId, setNextMetaId] = useState(1)
  
  // 文档预览面板状态
  const [isPreviewPanelOpen, setIsPreviewPanelOpen] = useState(true)
  const [previewPanelWidth, setPreviewPanelWidth] = useState(560) // 参考 ragflow 40% 比例，给文档预览更大空间
  
  // 右侧信息面板状态
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(true)
  const [infoPanelWidth, setInfoPanelWidth] = useState(320) // 右侧信息面板

  const resizeRef = useRef<null | {
    target: 'preview' | 'info'
    startX: number
    startWidth: number
  }>(null)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return

      const { target, startX, startWidth } = resizeRef.current
      if (target === 'preview') {
        // 参考 ragflow 的 40% 预览比例，允许更大的预览空间
        const next = startWidth + (e.clientX - startX)
        setPreviewPanelWidth(Math.min(720, Math.max(320, next)))
      } else {
        // 右侧：拖拽分隔条向左移动 => 变宽；向右移动 => 变窄
        const next = startWidth + (startX - e.clientX)
        setInfoPanelWidth(Math.min(420, Math.max(240, next)))
      }
    }

    const onMouseUp = () => {
      if (!resizeRef.current) return
      resizeRef.current = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const availableInt = React.useMemo(() => {
    if (filterStatus === 'enabled') return 1
    if (filterStatus === 'disabled') return 0
    return undefined
  }, [filterStatus])

  const {
    data: chunkListData,
    isFetching,
    isLoading,
    error: chunkListError,
    refetch: refetchChunkList,
  } = useQuery({
    queryKey: ['documentChunks', docId, page, pageSize, debouncedSearchKeyword, availableInt],
    enabled: Boolean(docId),
    gcTime: 0, // 与 ragflow 保持一致，防止缓存问题
    queryFn: async () => {
      return knowledgeAPI.document.listChunks({
        doc_id: docId!,
        page,
        size: pageSize,
        keywords: debouncedSearchKeyword || undefined,
        available_int: availableInt,
      })
    },
    placeholderData: (previousData) => previousData,
  })
  
  // 延迟刷新列表（与 ragflow 保持一致，后端可能需要时间更新索引）
  const delayedRefetchChunkList = React.useCallback(() => {
    setTimeout(() => {
      refetchChunkList()
    }, 500)
  }, [refetchChunkList])

  const chunks = useMemo(() => chunkListData?.chunks ?? [], [chunkListData])
  const total = chunkListData?.total ?? 0
  const docInfo = chunkListData?.doc ?? null
  const loading = (isLoading || isFetching) && !chunkListData
  
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
    setPage(1)
    setSelectedChunkIds([])
  }, [searchKeyword])

  // 监听筛选状态变化，重置到第一页
  useEffect(() => {
    setPage(1)
    setSelectedChunkIds([])
  }, [filterStatus])

  // 分页变化时清空批量选择
  useEffect(() => {
    setSelectedChunkIds([])
  }, [page, pageSize])
  

  const switchChunkMutation = useMutation({
    mutationFn: async (params: { chunkId: string; availableInt: number }) => {
      if (!docId) return false
      return knowledgeAPI.document.switchChunks({
        doc_id: docId,
        chunk_ids: [params.chunkId],
        available_int: params.availableInt,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })

  const bulkSwitchChunksMutation = useMutation({
    mutationFn: async (params: { chunkIds: string[]; availableInt: number }) => {
      if (!docId) return false
      return knowledgeAPI.document.switchChunks({
        doc_id: docId,
        chunk_ids: params.chunkIds,
        available_int: params.availableInt,
      })
    },
    onSuccess: () => {
      setSelectedChunkIds([])
      delayedRefetchChunkList()
    },
  })

  const setChunkMutation = useMutation({
    mutationFn: async (params: { 
      chunkId: string
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
      /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀） */
      image_base64?: string
    }) => {
      if (!docId) return false
      return knowledgeAPI.document.setChunk({
        doc_id: docId,
        chunk_id: params.chunkId,
        content_with_weight: params.content,
        important_kwd: params.important_kwd,
        question_kwd: params.question_kwd,
        image_base64: params.image_base64,
      })
    },
    // 不在这里刷新，由 handleEditChunk 中手动控制刷新时机
  })

  const deleteChunksMutation = useMutation({
    mutationFn: async (chunkIds: string[]) => {
      if (!docId) return false
      return knowledgeAPI.document.deleteChunks({
        doc_id: docId,
        chunk_ids: chunkIds,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })

  const createChunkMutation = useMutation({
    mutationFn: async (params: {
      content: string
      important_kwd?: string[]
      question_kwd?: string[]
      /** 图片 Base64 编码（纯 Base64，不含 Data URL 前缀） */
      image_base64?: string
    }) => {
      if (!docId) return false
      return knowledgeAPI.document.createChunk({
        doc_id: docId,
        content_with_weight: params.content,
        important_kwd: params.important_kwd,
        question_kwd: params.question_kwd,
        available_int: 1,
        image_base64: params.image_base64,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })

  const setMetaMutation = useMutation({
    mutationFn: async (meta: Record<string, unknown>) => {
      if (!docId) return false
      return knowledgeAPI.document.setDocumentMeta({
        doc_id: docId,
        meta,
      })
    },
    onSuccess: delayedRefetchChunkList,
  })
  
  // 切换分段状态
  const handleToggleChunkStatus = async (chunk: ChunkData) => {
    if (!docId) return
    
    try {
      const newStatus = chunk.available_int === 1 ? 0 : 1
      
      // 调用真实的switch API
      await switchChunkMutation.mutateAsync({ chunkId: chunk.chunk_id, availableInt: newStatus })
      
    } catch (error) {
      console.error('Failed to toggle chunk status:', error)
      alert('切换分段状态失败，请重试')
    }
  }
  
  // 创建分段（与 ragflow 保持一致，新建时不支持上传图片，chunk 类型由解析器自动决定）
  const handleCreateChunk = async () => {
    if (!newChunkContent.trim()) return
    
    try {
      await createChunkMutation.mutateAsync({
        content: newChunkContent.trim(),
        important_kwd: newImportantKwd,
        question_kwd: newQuestionKwd,
      })
      setNewChunkContent('')
      setNewImportantKwd([])
      setNewQuestionKwd([])
      setAddChunkModalOpen(false)
    } catch (error) {
      console.error('Failed to create chunk:', error)
    }
  }
  
  // 编辑分段
  const handleEditChunk = async () => {
    if (!selectedChunk || !editingChunkContent.trim() || !docId) return
    
    try {
      // 如果有上传新图片，转换为 Base64
      let imageBase64: string | undefined
      if (editingImage.length > 0) {
        imageBase64 = await fileToBase64(editingImage[0])
      }
      
      // 调用 chunk set 接口
      await setChunkMutation.mutateAsync({
        chunkId: selectedChunk.chunk_id,
        content: editingChunkContent.trim(),
        important_kwd: editingImportantKwd,
        question_kwd: editingQuestionKwd,
        image_base64: imageBase64,
      })
      
      // 先关闭编辑模式
      setIsEditMode(false)
      setSelectedChunk(null)
      setEditingChunkContent('')
      setEditingImportantKwd([])
      setEditingQuestionKwd([])
      setEditingImage([])
      
      // 延迟刷新列表数据（与 ragflow 保持一致，后端需要时间更新索引）
      setTimeout(() => {
        refetchChunkList()
      }, 500)
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
      await deleteChunksMutation.mutateAsync([deletingChunkId])
      
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
      }, {} as Record<string, unknown>)
      
      await setMetaMutation.mutateAsync(metaObject)
      
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
  const handleUpdateMetaValue = (id: string, newValue: unknown) => {
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

  // 批量操作相关
  const isAllSelected = filteredChunks.length > 0 && selectedChunkIds.length === filteredChunks.length
  const isPartialSelected = selectedChunkIds.length > 0 && selectedChunkIds.length < filteredChunks.length
  const hasSelected = selectedChunkIds.length > 0

  const previewPanelStyle = useMemo((): CSSVarStyle => {
    return { '--preview-panel-width': `${previewPanelWidth}px` }
  }, [previewPanelWidth])

  const infoPanelStyle = useMemo((): CSSVarStyle => {
    return { '--info-panel-width': `${infoPanelWidth}px` }
  }, [infoPanelWidth])

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedChunkIds(filteredChunks.map(c => c.chunk_id))
    } else {
      setSelectedChunkIds([])
    }
  }

  // 单个 checkbox 点击
  const handleSingleCheckboxClick = (chunkId: string, checked: boolean) => {
    setSelectedChunkIds(prev => {
      const idx = prev.indexOf(chunkId)
      if (checked && idx === -1) {
        return [...prev, chunkId]
      } else if (!checked && idx !== -1) {
        return prev.filter(id => id !== chunkId)
      }
      return prev
    })
  }

  // 批量启用
  const handleBulkEnable = async () => {
    if (selectedChunkIds.length === 0) return
    try {
      await bulkSwitchChunksMutation.mutateAsync({
        chunkIds: selectedChunkIds,
        availableInt: 1,
      })
    } catch (error) {
      console.error('Failed to bulk enable chunks:', error)
      alert('批量启用失败，请重试')
    }
  }

  // 批量禁用
  const handleBulkDisable = async () => {
    if (selectedChunkIds.length === 0) return
    try {
      await bulkSwitchChunksMutation.mutateAsync({
        chunkIds: selectedChunkIds,
        availableInt: 0,
      })
    } catch (error) {
      console.error('Failed to bulk disable chunks:', error)
      alert('批量禁用失败，请重试')
    }
  }

  // 批量删除
  const handleBulkDelete = async () => {
    if (selectedChunkIds.length === 0) return
    try {
      await deleteChunksMutation.mutateAsync(selectedChunkIds)
      setSelectedChunkIds([])
      setDeleteSelectedConfirmOpen(false)
    } catch (error) {
      console.error('Failed to bulk delete chunks:', error)
      alert('批量删除失败，请重试')
    }
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-background-default)' }}>
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        {/* 左侧文档预览面板 - 可折叠 */}
        {isPreviewPanelOpen && docInfo && (
          <div 
            className="hidden lg:flex flex-col border-r border-border-default bg-background-default lg:w-[var(--preview-panel-width)]"
            style={previewPanelStyle}
          >
            {/* 预览内容 */}
            <div className="flex-1 overflow-hidden">
              <DocumentPreview
                docId={docId!}
                docName={docInfo.name}
                docType={docInfo.type}
                selectedChunkId={selectedChunk?.chunk_id}
                highlights={selectedChunk?.positions?.map((pos) => ({
                  page: pos[0] || 1,
                  x1: pos[1] || 0,
                  x2: pos[2] || 0,
                  y1: pos[3] || 0,
                  y2: pos[4] || 0,
                }))}
                onClose={() => setIsPreviewPanelOpen(false)}
                className="h-full"
              />
            </div>
          </div>
        )}

        {/* 左侧预览面板拖拽条 */}
        {isPreviewPanelOpen && (
          <div
            className="hidden lg:block w-1 cursor-col-resize bg-transparent hover:bg-border-subtle"
            onMouseDown={(e) => {
              e.preventDefault()
              resizeRef.current = { target: 'preview', startX: e.clientX, startWidth: previewPanelWidth }
              document.body.style.cursor = 'col-resize'
              document.body.style.userSelect = 'none'
            }}
          />
        )}
        
        {/* 中间分段列表区域 */}
        <div className="flex-1 flex flex-col bg-background-surface min-h-0">
          {/* ragflow 风格工具栏 */}
          <div className="border-b border-border-default px-4 py-3">
            {/* 第一行：预览切换 + 全文/省略切换 + 搜索 + 筛选 + 添加 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* 预览面板切换按钮 */}
                {!isPreviewPanelOpen && (
                  <Tooltip content="显示文档预览">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPreviewPanelOpen(true)}
                      className="hidden lg:flex"
                    >
                      <PanelLeftOpen className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                )}
                
                {/* 全文/省略 Segmented 切换 */}
                <Segmented
                  value={textMode}
                  onValueChange={(val) => setTextMode(val as 'full' | 'ellipse')}
                >
                  <SegmentedItem value="full">全文</SegmentedItem>
                  <SegmentedItem value="ellipse">省略</SegmentedItem>
                </Segmented>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 搜索框 - 可展开收起 */}
                {isSearchOpen ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="search"
                      placeholder="搜索分段内容..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                        }
                        if (e.key === 'Escape') {
                          setIsSearchOpen(false)
                          setSearchKeyword('')
                        }
                      }}
                      leftIcon={<Search className="h-4 w-4" />}
                      className="w-48"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsSearchOpen(false)
                        setSearchKeyword('')
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Tooltip content="搜索">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchOpen(true)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                )}
                
                {/* 筛选 Popover */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={cn(
                        filterStatus !== 'all' && 'text-text-accent'
                      )}
                    >
                      <ListFilter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2" align="end">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => setFilterStatus('all')}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                          filterStatus === 'all'
                            ? "bg-state-active text-text-primary"
                            : "hover:bg-state-hover text-text-secondary"
                        )}
                      >
                        <span className="flex-1">全部</span>
                        <span className="text-xs text-text-tertiary">{total}</span>
                      </button>
                      <button
                        onClick={() => setFilterStatus('enabled')}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                          filterStatus === 'enabled'
                            ? "bg-state-active text-text-primary"
                            : "hover:bg-state-hover text-text-secondary"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-state-success)' }} />
                        <span className="flex-1">已启用</span>
                      </button>
                      <button
                        onClick={() => setFilterStatus('disabled')}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left",
                          filterStatus === 'disabled'
                            ? "bg-state-active text-text-primary"
                            : "hover:bg-state-hover text-text-secondary"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-state-error)' }} />
                        <span className="flex-1">已禁用</span>
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* 添加分段按钮 */}
                <Tooltip content="添加分段">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddChunkModalOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>
            
            {/* 第二行：批量操作区（全选 + 批量启用/禁用/删除） */}
            <div className="flex items-center gap-8 mt-3 py-2 border-t border-border-subtle">
              {/* 全选 Checkbox */}
              <div className="flex items-center gap-2 cursor-pointer text-text-secondary hover:text-text-primary">
                <Checkbox
                  id="select-all-chunks"
                  checked={isAllSelected}
                  indeterminate={isPartialSelected}
                  onCheckedChange={handleSelectAll}
                />
                <Label 
                  htmlFor="select-all-chunks" 
                  className="cursor-pointer text-sm"
                >
                  全选
                </Label>
                {hasSelected && (
                  <span className="text-xs text-text-tertiary ml-1">
                    ({selectedChunkIds.length})
                  </span>
                )}
              </div>

              {/* 批量操作按钮 - 仅在选中时显示 */}
              {hasSelected && (
                <>
                  <button
                    onClick={handleBulkEnable}
                    disabled={bulkSwitchChunksMutation.isPending}
                    className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>启用</span>
                  </button>
                  <button
                    onClick={handleBulkDisable}
                    disabled={bulkSwitchChunksMutation.isPending}
                    className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary cursor-pointer disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4" />
                    <span>禁用</span>
                  </button>
                  <button
                    onClick={() => setDeleteSelectedConfirmOpen(true)}
                    disabled={deleteChunksMutation.isPending}
                    className="flex items-center gap-1 text-sm text-red-400 hover:text-red-500 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>删除</span>
                  </button>
                </>
              )}

              {/* 结果统计 */}
              <div className="ml-auto text-sm text-text-tertiary">
                共 {total} 个分段
                {searchKeyword.trim() && (
                  <span className="ml-2 text-text-accent">
                    (搜索: "{searchKeyword.trim()}")
                  </span>
                )}
                {filterStatus !== 'all' && (
                  <span className="ml-2 text-text-accent">
                    (筛选: {filterStatus === 'enabled' ? '已启用' : '已禁用'})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 分段列表和分页容器 */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-text-accent)' }}></div>
                加载中...
              </div>
            ) : chunkListError ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <p className="mb-4">加载分段失败，请稍后重试</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    refetchChunkList()
                  }}
                >
                  重试
                </Button>
              </div>
            ) : filteredChunks.length === 0 ? (
              <div className="p-8 text-center" style={{ color: 'var(--color-text-tertiary)' }}>
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
                <p>暂无匹配的分段</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredChunks.map((chunk) => {
                  const isSelected = selectedChunkIds.includes(chunk.chunk_id)
                  return (
                  <div
                    key={chunk.chunk_id}
                    className={cn(
                      "group relative rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                      selectedChunk?.chunk_id === chunk.chunk_id && "ring-2",
                      isSelected && "ring-1 ring-text-accent/50"
                    )}
                    style={{
                      backgroundColor: isSelected 
                        ? 'var(--color-state-active)' 
                        : 'var(--color-components-card-bg)',
                      border: selectedChunk?.chunk_id === chunk.chunk_id 
                        ? '2px solid var(--color-text-accent)' 
                        : '1px solid var(--color-components-card-border)'
                    }}
                    onClick={() => {
                      // 单击选中分块，可以在文档预览中高亮
                      setSelectedChunk(chunk)
                      setEditingChunkContent(chunk.content_with_weight)
                      setEditingImportantKwd(chunk.important_kwd || [])
                      setEditingQuestionKwd(chunk.question_kwd || [])
                      setIsMarkdownPreview(false)
                      // 如果右侧面板已折叠，自动打开
                      if (!isInfoPanelOpen) setIsInfoPanelOpen(true)
                    }}
                    onDoubleClick={(e) => {
                      // 双击进入编辑模式
                      e.stopPropagation()
                      setSelectedChunk(chunk)
                      setIsEditMode(true)
                      setEditingChunkContent(chunk.content_with_weight)
                      setEditingImportantKwd(chunk.important_kwd || [])
                      setEditingQuestionKwd(chunk.question_kwd || [])
                      setIsMarkdownPreview(false)
                      // 如果右侧面板已折叠，自动打开
                      if (!isInfoPanelOpen) setIsInfoPanelOpen(true)
                    }}
                  >
                    {/* 分块类型标签 - 右上角 */}
                    {(() => {
                      const chunkType = ((chunk as any).doc_type_kwd?.toLowerCase() as 'image' | 'text' | 'table') || 'text'
                      const getTypeStyles = () => {
                        switch (chunkType) {
                          case 'image':
                            return {
                              bg: 'var(--color-components-badge-warning-bg)',
                              text: 'var(--color-components-badge-warning-text)'
                            }
                          case 'table':
                            return {
                              bg: 'var(--color-components-badge-success-bg)',
                              text: 'var(--color-components-badge-success-text)'
                            }
                          default:
                            return {
                              bg: 'var(--color-background-subtle)',
                              text: 'var(--color-text-tertiary)'
                            }
                        }
                      }
                      const styles = getTypeStyles()
                      return (
                        <span 
                          className="absolute top-0 right-0 px-3 py-1 text-xs font-medium rounded-bl-xl rounded-tr-lg"
                          style={{
                            backgroundColor: styles.bg,
                            color: styles.text,
                            borderLeft: '1px solid var(--color-border-default)',
                            borderBottom: '1px solid var(--color-border-default)'
                          }}
                        >
                          {chunkType === 'image' ? 'Image' : chunkType === 'table' ? 'Table' : 'Text'}
                        </span>
                      )
                    })()}
                    
                    {/* 分段头部 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {/* Checkbox for batch selection */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSingleCheckboxClick(chunk.chunk_id, !isSelected)
                          }}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSingleCheckboxClick(chunk.chunk_id, !!checked)}
                          />
                        </div>
                        <Tooltip content={`完整ID: ${chunk.chunk_id}`}>
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium cursor-help" style={{
                            backgroundColor: 'var(--color-background-subtle)',
                            color: 'var(--color-text-primary)'
                          }}>
                            {chunk.chunk_id.length > 16 
                              ? `${chunk.chunk_id.slice(0, 8)}...${chunk.chunk_id.slice(-8)}`
                              : chunk.chunk_id
                            }
                          </span>
                        </Tooltip>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm" style={{
                          backgroundColor: chunk.available_int === 1
                            ? 'var(--color-components-badge-success-bg)'
                            : 'var(--color-components-badge-error-bg)',
                          color: chunk.available_int === 1
                            ? 'var(--color-components-badge-success-text)'
                            : 'var(--color-components-badge-error-text)'
                        }}>
                          <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{
                            backgroundColor: chunk.available_int === 1
                              ? 'var(--color-state-success)'
                              : 'var(--color-state-error)'
                          }} />
                          {chunk.available_int === 1 ? '启用' : '禁用'}
                        </span>
                      </div>
                      
                      {/* 悬停时显示的操作按钮 */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-2">
                        <div onClick={(e) => e.stopPropagation()}>
                          <div className="backdrop-blur-sm rounded-lg px-2 py-1 shadow-md" style={{
                            backgroundColor: 'var(--color-background-surface)',
                            border: '1px solid var(--color-border-default)'
                          }}>
                            <ToggleSwitch
                              checked={chunk.available_int === 1}
                              onChange={() => handleToggleChunkStatus(chunk)}
                              size="sm"
                              leftLabel="禁用"
                              rightLabel="启用"
                            />
                          </div>
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
                              setEditingImportantKwd(chunk.important_kwd || [])
                              setEditingQuestionKwd(chunk.question_kwd || [])
                              setIsMarkdownPreview(false) // 重置为编辑模式
                              // 如果右侧面板已折叠，自动打开
                              if (!isInfoPanelOpen) setIsInfoPanelOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" style={{ color: 'var(--color-text-accent)' }} />
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
                            <Trash2 className="h-4 w-4" style={{ color: 'var(--color-text-error)' }} />
                          </Button>
                        </Tooltip>
                      </div>
                    </div>
                    
                    {/* 分段内容区域 - 包含可选的缩略图和内容 */}
                    <div className="flex gap-3 items-stretch">
                      {/* 缩略图预览 (如果有 img_id) - 点击放大 */}
                      {chunk.img_id && (
                        <div 
                          className="relative flex-shrink-0 group/thumb cursor-pointer self-stretch"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewImageUrl(`${API_BASE_URL}/${API_VERSION}/document/image/${chunk.img_id}`)
                          }}
                          style={{
                            minHeight: '64px',
                            minWidth: textMode === 'full' ? '120px' : '64px',
                            maxWidth: textMode === 'full' ? '160px' : '64px',
                          }}
                        >
                          <img
                            src={`${API_BASE_URL}/${API_VERSION}/document/image/${chunk.img_id}`}
                            alt="切片缩略图"
                            className="w-full h-full object-cover rounded border transition-all duration-200 group-hover/thumb:ring-2 group-hover/thumb:ring-text-accent"
                            style={{
                              borderColor: 'var(--color-border-default)',
                              backgroundColor: 'var(--color-background-subtle)'
                            }}
                            onError={(e) => {
                              // 隐藏加载失败的图片
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          {/* 悬停时显示放大图标 */}
                          <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-all duration-200 rounded flex items-center justify-center opacity-0 group-hover/thumb:opacity-100">
                            <ZoomIn className="w-5 h-5 text-white drop-shadow-lg" />
                          </div>
                        </div>
                      )}
                      
                      {/* 分段内容预览 - 根据 textMode 切换显示方式，使用 DOMPurify 安全渲染 */}
                      <div className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        <div 
                          className={textMode === 'full' ? "" : "line-clamp-3"}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(chunk.content_with_weight, {
                              ALLOWED_TAGS: ['em', 'strong', 'b', 'i', 'br'],
                              ALLOWED_ATTR: [],
                            })
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* 分段关键词和匹配问题 */}
                    {((chunk.important_kwd && chunk.important_kwd.length > 0) || 
                      (chunk.question_kwd && chunk.question_kwd.length > 0)) && (
                      <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                        {/* 关键词 */}
                        {chunk.important_kwd && chunk.important_kwd.length > 0 && (
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                              <Key className="h-3 w-3" />
                              <span>关键词</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {chunk.important_kwd.map((keyword, index) => (
                                <Tooltip key={index} content={keyword}>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs max-w-24 truncate" style={{
                                    backgroundColor: 'var(--color-components-badge-info-bg)',
                                    color: 'var(--color-components-badge-info-text)'
                                  }}>
                                    {keyword}
                                  </span>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* 匹配问题 */}
                        {chunk.question_kwd && chunk.question_kwd.length > 0 && (
                          <div className="flex items-start gap-2">
                            <div className="flex items-center gap-1 text-xs flex-shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                              <MessageCircleQuestion className="h-3 w-3" />
                              <span>问题</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {chunk.question_kwd.map((question, index) => (
                                <Tooltip key={index} content={question}>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs max-w-32 truncate" style={{
                                    backgroundColor: 'var(--color-components-badge-warning-bg)',
                                    color: 'var(--color-components-badge-warning-text)'
                                  }}>
                                    {question}
                                  </span>
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                  </div>
                  )
                })}
              </div>
            )}
            </div>
            
            {/* 分页组件 - sticky 粘性定位 */}
            {total > 0 && (
              <div className="sticky bottom-0 backdrop-blur-sm shadow-lg" style={{
                borderTop: '1px solid var(--color-components-pagination-border)',
                backgroundColor: 'var(--color-components-pagination-bg)',
                backdropFilter: 'blur(12px)'
              }}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="text-sm" style={{ color: 'var(--color-components-pagination-text)' }}>
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

        {/* 右侧信息面板拖拽条（仅展开时） */}
        {isInfoPanelOpen && (
          <div
            className="hidden lg:block w-1 cursor-col-resize bg-transparent hover:bg-border-subtle"
            onMouseDown={(e) => {
              e.preventDefault()
              resizeRef.current = { target: 'info', startX: e.clientX, startWidth: infoPanelWidth }
              document.body.style.cursor = 'col-resize'
              document.body.style.userSelect = 'none'
            }}
          />
        )}

        {/* 右侧操作面板 */}
        <div className={cn(
          "bg-background-subtle flex flex-col relative transition-all duration-200 border-l border-border-default",
          isInfoPanelOpen ? "w-full lg:w-[var(--info-panel-width)]" : "w-10 lg:w-10 lg:min-w-10"
        )}
        style={isInfoPanelOpen ? infoPanelStyle : undefined}
        >
          {/* 折叠状态时的展开按钮 */}
          {!isInfoPanelOpen && (
            <div className="flex flex-col items-center pt-2">
              <Tooltip content="展开信息面板">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInfoPanelOpen(true)}
                >
                  <PanelRightOpen className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          )}
          
          {/* 编辑模式覆盖层 */}
          {isInfoPanelOpen && isEditMode && selectedChunk && (
            <div className="absolute inset-0 bg-background-surface z-30 flex flex-col">
              <div className="p-6 border-b border-border-default">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-text-primary">
                      编辑分段
                    </h3>
                    <Tooltip content={`完整ID: ${selectedChunk.chunk_id}`}>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium cursor-help" style={{
                        backgroundColor: 'var(--color-components-badge-info-bg)',
                        color: 'var(--color-components-badge-info-text)'
                      }}>
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
                      setEditingImportantKwd([])
                      setEditingQuestionKwd([])
                      setEditingImage([])
                      setIsMarkdownPreview(false) // 重置预览状态
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
                <div className="space-y-5">
                  {/* 分段内容编辑区 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-text-secondary">
                        分段内容
                      </label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsMarkdownPreview(!isMarkdownPreview)}
                          className={cn(
                            "text-xs flex items-center space-x-1",
                            isMarkdownPreview ? "bg-state-hover text-text-accent border-border-accent" : ""
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
                      </div>
                    </div>
                    
                    <div className="min-h-[200px]">
                      {isMarkdownPreview ? (
                        <div className="w-full h-full min-h-[200px] px-4 py-3 rounded-md overflow-y-auto scrollbar-thin" style={{
                          border: '1px solid var(--color-components-input-border)',
                          backgroundColor: 'var(--color-background-subtle)'
                        }}>
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
                                  .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-md my-3 overflow-x-auto scrollbar-thin"><code class="text-sm font-mono">$1</code></pre>')
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
                          className="w-full px-3 py-2 rounded-md resize-none text-sm font-mono leading-relaxed"
                          style={{
                            border: '1px solid var(--color-components-input-border)',
                            backgroundColor: 'var(--color-components-input-bg)',
                            color: 'var(--color-components-input-text)',
                            minHeight: '200px'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = 'var(--color-components-input-border-focus)'
                            e.target.style.outline = 'none'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = 'var(--color-components-input-border)'
                          }}
                          placeholder="请输入分段内容..."
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* 图片上传区域 - 仅当分块类型是 image 时才允许更新图片（与 ragflow 保持一致） */}
                  {selectedChunk.doc_type_kwd === 'image' && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" style={{ color: 'var(--color-text-accent)' }} />
                        <label className="block text-sm font-medium text-text-secondary">
                          图片
                        </label>
                        <Tooltip content="为图片类型分块上传或替换图片">
                          <span className="text-xs cursor-help rounded-full w-4 h-4 flex items-center justify-center border" style={{ 
                            borderColor: 'var(--color-border-default)',
                            color: 'var(--color-text-tertiary)'
                          }}>?</span>
                        </Tooltip>
                      </div>
                      
                      {/* 图片预览与上传区域 */}
                      <div className="space-y-3">
                        {/* 现有图片预览 - 仅当没有上传新图片时显示 */}
                        {selectedChunk.img_id && editingImage.length === 0 && (
                          <div 
                            className="relative group cursor-pointer rounded-lg overflow-hidden"
                            onClick={() => setPreviewImageUrl(`${API_BASE_URL}/${API_VERSION}/document/image/${selectedChunk.img_id}`)}
                            style={{ 
                              backgroundColor: 'var(--color-background-default)',
                              border: '1px solid var(--color-border-subtle)'
                            }}
                          >
                            {/* 图片预览 */}
                            <div className="aspect-video flex items-center justify-center p-4" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                              <img
                                src={`${API_BASE_URL}/${API_VERSION}/document/image/${selectedChunk.img_id}`}
                                alt="分块图片"
                                className="max-w-full max-h-full object-contain rounded shadow-sm"
                              />
                            </div>
                            
                            {/* 悬停遮罩层 */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex items-center gap-2 px-4 py-2 rounded-full shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
                                <ZoomIn className="w-4 h-4" style={{ color: 'var(--color-text-accent)' }} />
                                <span className="text-sm font-medium" style={{ color: 'var(--color-text-accent)' }}>点击放大</span>
                              </div>
                            </div>
                            
                            {/* 底部信息栏 */}
                            <div className="px-3 py-2 flex items-center justify-between" style={{ borderTop: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-background-default)' }}>
                              <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                                当前图片
                              </span>
                              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                                点击查看大图
                              </span>
                            </div>
                          </div>
                        )}
                        
                        {/* 图片上传组件 - 使用紧凑模式 */}
                        <ImageUploader
                          value={editingImage}
                          onValueChange={setEditingImage}
                          maxFileCount={1}
                          hideDropzoneOnMaxFileCount={true}
                          variant={selectedChunk.img_id ? "compact" : "default"}
                          title={selectedChunk.img_id ? "上传新图片替换" : undefined}
                          description={selectedChunk.img_id ? "PNG、JPG、WebP、GIF，最大 10MB" : undefined}
                          dropzoneHeight="h-36"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* 关键词编辑区 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" style={{ color: 'var(--color-text-accent)' }} />
                      <label className="block text-sm font-medium text-text-secondary">
                        关键词
                      </label>
                      <Tooltip content="添加关键词可以提升检索召回效果">
                        <span className="text-xs cursor-help rounded-full w-4 h-4 flex items-center justify-center border" style={{ 
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-tertiary)'
                        }}>?</span>
                      </Tooltip>
                    </div>
                    <div className="p-3 rounded-lg" style={{ 
                      backgroundColor: 'var(--color-background-subtle)',
                      border: '1px solid var(--color-border-default)'
                    }}>
                      <TagEditor
                        value={editingImportantKwd}
                        onChange={setEditingImportantKwd}
                        placeholder="输入关键词后按回车..."
                        variant="info"
                      />
                    </div>
                  </div>
                  
                  {/* 匹配问题编辑区 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageCircleQuestion className="h-4 w-4" style={{ color: 'var(--color-text-warning)' }} />
                      <label className="block text-sm font-medium text-text-secondary">
                        匹配问题
                      </label>
                      <Tooltip content="添加该分块可以回答的问题，用于提升问答匹配精度">
                        <span className="text-xs cursor-help rounded-full w-4 h-4 flex items-center justify-center border" style={{ 
                          borderColor: 'var(--color-border-default)',
                          color: 'var(--color-text-tertiary)'
                        }}>?</span>
                      </Tooltip>
                    </div>
                    <div className="p-3 rounded-lg" style={{ 
                      backgroundColor: 'var(--color-background-subtle)',
                      border: '1px solid var(--color-border-default)'
                    }}>
                      <TagEditor
                        value={editingQuestionKwd}
                        onChange={setEditingQuestionKwd}
                        placeholder="输入问题后按回车..."
                        variant="warning"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6" style={{
                borderTop: '1px solid var(--color-border-default)',
                backgroundColor: 'var(--color-background-subtle)'
              }}>
                <div className="flex justify-end space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditMode(false)
                      setSelectedChunk(null)
                      setEditingChunkContent('')
                      setEditingImportantKwd([])
                      setEditingQuestionKwd([])
                      setEditingImage([])
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
          
          {/* 面板标题和折叠按钮 */}
          {isInfoPanelOpen && (
            <div className="flex items-center justify-between px-4 py-2 border-b border-border-default bg-background-surface">
              <span className="text-sm font-medium text-text-primary">文档信息</span>
              <Tooltip content="折叠面板">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsInfoPanelOpen(false)}
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </Tooltip>
            </div>
          )}
          
          {/* 选中分段提示 - 简化为仅显示提示信息 */}
          {isInfoPanelOpen && selectedChunk && !isEditMode && (
            <div className="p-4 border-b border-border-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  <FileText className="h-4 w-4" style={{ color: 'var(--color-text-accent)' }} />
                  <span>已选中分段</span>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-xs",
                    selectedChunk.available_int === 1 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  )}>
                    {selectedChunk.available_int === 1 ? '启用' : '禁用'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setSelectedChunk(null)
                    setEditingChunkContent('')
                    setEditingImportantKwd([])
                    setEditingQuestionKwd([])
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                双击分块或点击编辑按钮进入编辑模式
              </p>
            </div>
          )}

          {/* 默认内容区域 */}
          {isInfoPanelOpen && (
          <div className="p-6 space-y-6 h-full overflow-y-auto scrollbar-thin">
            {/* 元数据标注区域 */}
            <Card>
              <div className="p-4">
                <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>元数据</h3>
                <div className="space-y-4">
                  <div className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
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
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--color-text-primary)' }}>文档信息</h3>
                  <div className="space-y-4">
                    
                    {/* 元数据信息 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>元数据信息</h4>
                      <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                        {Object.keys(docInfo.meta_fields || {}).length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {Object.entries(docInfo.meta_fields || {}).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span style={{ color: 'var(--color-text-secondary)' }}>{key}:</span>
                                <span style={{ color: 'var(--color-text-primary)' }}>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>暂无元数据</span>
                        )}
                      </div>
                    </div>

                    {/* 文件信息 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>文件信息</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>文件名：</span>
                          <span className="font-medium break-all text-right ml-2" style={{ color: 'var(--color-text-primary)' }}>{docInfo.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>创建时间：</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{formatDate(docInfo.create_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>更新时间：</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{formatDate(docInfo.update_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>文件大小：</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{formatFileSize(docInfo.size)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>来源：</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{docInfo.source_type}</span>
                        </div>
                      </div>
                    </div>

                    {/* 技术参数 */}
                    <div>
                      <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>技术参数</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>切片方法：</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{docInfo.parser_id}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span style={{ color: 'var(--color-text-secondary)' }}>详细切片配置：</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowParserConfig(!showParserConfig)}
                            className="text-xs h-6 px-2 flex items-center gap-1"
                            style={{ color: 'var(--color-text-accent)' }}
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
                        {showParserConfig && docInfo.parser_config && (
                          <div className="mt-2 rounded-lg p-3 space-y-3" style={{
                            backgroundColor: 'var(--color-background-subtle)',
                            border: '1px solid var(--color-border-default)'
                          }}>
                            {/* 基础配置 */}
                            <div className="space-y-2">
                              {docInfo.parser_config.layout_recognize && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>布局识别</span>
                                  <span className="text-xs px-2 py-0.5 rounded" style={{ 
                                    backgroundColor: 'var(--color-primary-subtle)',
                                    color: 'var(--color-text-accent)'
                                  }}>{docInfo.parser_config.layout_recognize}</span>
                                </div>
                              )}
                              {docInfo.parser_config.chunk_token_num !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>分块大小</span>
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{docInfo.parser_config.chunk_token_num} tokens</span>
                                </div>
                              )}
                              {docInfo.parser_config.delimiter !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>分隔符</span>
                                  <code className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                    backgroundColor: 'var(--color-background-muted)',
                                    color: 'var(--color-text-secondary)'
                                  }}>{docInfo.parser_config.delimiter === '\n' ? '\\n' : docInfo.parser_config.delimiter}</code>
                                </div>
                              )}
                              {docInfo.parser_config.topn_tags !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>标签数量</span>
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{docInfo.parser_config.topn_tags}</span>
                                </div>
                              )}
                              {docInfo.parser_config.auto_keywords !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>自动关键词</span>
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{docInfo.parser_config.auto_keywords}</span>
                                </div>
                              )}
                              {docInfo.parser_config.auto_questions !== undefined && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>自动问题</span>
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{docInfo.parser_config.auto_questions}</span>
                                </div>
                              )}
                              {docInfo.parser_config.html4excel && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Excel 转 HTML</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981'
                                  }}>已启用</span>
                                </div>
                              )}
                              {docInfo.parser_config.toc_extraction && (
                                <div className="flex justify-between items-center">
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>目录提取</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                    color: '#10b981'
                                  }}>已启用</span>
                                </div>
                              )}
                            </div>

                            {/* RAPTOR 配置 */}
                            {docInfo.parser_config.raptor?.use_raptor && (
                              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8b5cf6' }} />
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>RAPTOR 增强</span>
                                </div>
                                <div className="space-y-1.5 pl-3">
                                  {docInfo.parser_config.raptor.scope !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>范围</span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                        {docInfo.parser_config.raptor.scope === 'file' ? '单文件' : '全局'}
                                      </span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.raptor.max_token !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>最大 Token</span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{docInfo.parser_config.raptor.max_token}</span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.raptor.threshold !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>聚类阈值</span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{docInfo.parser_config.raptor.threshold}</span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.raptor.max_cluster !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>最大聚类数</span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{docInfo.parser_config.raptor.max_cluster}</span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.raptor.random_seed !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>随机种子</span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{docInfo.parser_config.raptor.random_seed}</span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.raptor.prompt && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>提示词</span>
                                      <div className="text-xs p-2 rounded max-h-20 overflow-y-auto scrollbar-thin" style={{ 
                                        backgroundColor: 'var(--color-background-muted)',
                                        color: 'var(--color-text-secondary)',
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word'
                                      }}>{docInfo.parser_config.raptor.prompt}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* GraphRAG 配置 */}
                            {docInfo.parser_config.graphrag?.use_graphrag && (
                              <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                <div className="flex items-center gap-1.5 mb-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#f59e0b' }} />
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>GraphRAG 增强</span>
                                </div>
                                <div className="space-y-1.5 pl-3">
                                  {docInfo.parser_config.graphrag.method !== undefined && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>方法</span>
                                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                        {docInfo.parser_config.graphrag.method === 'light' ? '轻量级' : '标准'}
                                      </span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.graphrag.resolution && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>实体归一化</span>
                                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981'
                                      }}>已启用</span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.graphrag.community && (
                                    <div className="flex justify-between">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>社区报告</span>
                                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10b981'
                                      }}>已启用</span>
                                    </div>
                                  )}
                                  {docInfo.parser_config.graphrag.entity_types && docInfo.parser_config.graphrag.entity_types.length > 0 && (
                                    <div className="flex flex-col gap-1">
                                      <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>实体类型</span>
                                      <div className="flex flex-wrap gap-1">
                                        {docInfo.parser_config.graphrag.entity_types.map((type: string, index: number) => (
                                          <span key={index} className="text-xs px-1.5 py-0.5 rounded" style={{ 
                                            backgroundColor: 'var(--color-background-muted)',
                                            color: 'var(--color-text-secondary)'
                                          }}>{type}</span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
          )}
        </div>
      </div>

      {/* 添加分段模态框 */}
      <Modal
        open={addChunkModalOpen}
        onClose={() => {
          setAddChunkModalOpen(false)
          setNewChunkContent('')
          setNewImportantKwd([])
          setNewQuestionKwd([])
        }}
        title="添加新分段"
        size="lg"
      >
        <div className="space-y-5">
          {/* 分段内容 */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              分段内容
            </label>
            <textarea
              value={newChunkContent}
              onChange={(e) => setNewChunkContent(e.target.value)}
              placeholder="输入分段内容..."
              className="w-full h-40 px-3 py-2 rounded-md resize-none text-sm"
              style={{
                border: '1px solid var(--color-components-input-border)',
                backgroundColor: 'var(--color-components-input-bg)',
                color: 'var(--color-components-input-text)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--color-components-input-border-focus)'
                e.target.style.outline = 'none'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--color-components-input-border)'
              }}
            />
          </div>
          
          {/* 关键词 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="h-4 w-4" style={{ color: 'var(--color-text-accent)' }} />
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                关键词
              </label>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                (可选)
              </span>
            </div>
            <div className="p-3 rounded-lg" style={{ 
              backgroundColor: 'var(--color-background-subtle)',
              border: '1px solid var(--color-border-default)'
            }}>
              <TagEditor
                value={newImportantKwd}
                onChange={setNewImportantKwd}
                placeholder="输入关键词后按回车..."
                variant="info"
              />
            </div>
          </div>
          
          {/* 匹配问题 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageCircleQuestion className="h-4 w-4" style={{ color: 'var(--color-text-warning)' }} />
              <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                匹配问题
              </label>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                (可选)
              </span>
            </div>
            <div className="p-3 rounded-lg" style={{ 
              backgroundColor: 'var(--color-background-subtle)',
              border: '1px solid var(--color-border-default)'
            }}>
              <TagEditor
                value={newQuestionKwd}
                onChange={setNewQuestionKwd}
                placeholder="输入问题后按回车..."
                variant="warning"
              />
            </div>
          </div>
          
          {/* 图片上传已移除 - 与 ragflow 保持一致，新建分块时不允许上传图片，chunk 类型由解析器自动决定 */}
          
          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="outline" onClick={() => {
              setAddChunkModalOpen(false)
              setNewChunkContent('')
              setNewImportantKwd([])
              setNewQuestionKwd([])
            }}>
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

      {/* 批量删除确认模态框 */}
      <ConfirmModal
        open={deleteSelectedConfirmOpen}
        onClose={() => setDeleteSelectedConfirmOpen(false)}
        onConfirm={handleBulkDelete}
        title="确认批量删除"
        description={`确定要删除选中的 ${selectedChunkIds.length} 个分段吗？此操作不可逆。`}
      />

      {/* 元数据标注模态框 */}
      <Modal
        open={metaModalOpen}
        onClose={() => setMetaModalOpen(false)}
        title="文档元数据标注"
        size="lg"
      >
        <div className="space-y-6">
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            为文档添加结构化元数据，便于后续的检索和分析。
          </div>
          
          {/* 元数据字段列表 */}
          <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
            {editingMeta.map((item) => (
              <div key={item.id} className="flex items-center space-x-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
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
                    <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>
                      字段值
                    </label>
                    <Input
                      value={typeof item.value === 'string' ? item.value : JSON.stringify(item.value)}
                      onChange={(e) => {
                        let newValue: unknown = e.target.value
                        // 尝试解析JSON，如果失败则作为字符串
                        try {
                          if (e.target.value.startsWith('{') || e.target.value.startsWith('[')) {
                            newValue = JSON.parse(e.target.value) as unknown
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
                  style={{ color: 'var(--color-text-error)' }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            {editingMeta.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--color-text-tertiary)' }}>
                <Tag className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
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
              className="w-full"
              style={{ 
                color: 'var(--color-text-accent)', 
                borderColor: 'var(--color-border-accent)'
              }}
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

      {/* 图片预览弹窗 */}
      <Modal
        open={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
        title="图片预览"
        size="xl"
      >
        <div className="flex flex-col items-center gap-4">
          {previewImageUrl && (
            <div className="relative w-full flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '70vh' }}>
              <img
                src={previewImageUrl}
                alt="图片预览"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                style={{ 
                  backgroundColor: 'var(--color-background-subtle)',
                }}
              />
            </div>
          )}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                if (previewImageUrl) {
                  window.open(previewImageUrl, '_blank')
                }
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              在新标签页打开
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreviewImageUrl(null)}
            >
              关闭
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export { DocumentChunksPage }