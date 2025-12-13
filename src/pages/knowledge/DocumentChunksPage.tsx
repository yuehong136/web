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
  PanelRightOpen
} from 'lucide-react'
import { knowledgeAPI } from '@/api/knowledge'
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
  Label
} from '../../components/ui'
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
}


const DocumentChunksPage: React.FC = () => {
  const { docId } = useParams<{ id: string; docId: string }>()
  const queryClient = useQueryClient()
  
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
  const [infoPanelWidth, setInfoPanelWidth] = useState(240) // 右侧信息面板更窄

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
        setInfoPanelWidth(Math.min(360, Math.max(200, next)))
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
  
  const invalidateChunkList = React.useCallback(() => {
    if (!docId) return
    queryClient.invalidateQueries({ queryKey: ['documentChunks', docId] })
  }, [docId, queryClient])

  const switchChunkMutation = useMutation({
    mutationFn: async (params: { chunkId: string; availableInt: number }) => {
      if (!docId) return false
      return knowledgeAPI.document.switchChunks({
        doc_id: docId,
        chunk_ids: [params.chunkId],
        available_int: params.availableInt,
      })
    },
    onSuccess: invalidateChunkList,
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
      invalidateChunkList()
    },
  })

  const setChunkMutation = useMutation({
    mutationFn: async (params: { chunkId: string; content: string }) => {
      if (!docId) return false
      return knowledgeAPI.document.setChunk({
        doc_id: docId,
        chunk_id: params.chunkId,
        content_with_weight: params.content,
      })
    },
    onSuccess: invalidateChunkList,
  })

  const deleteChunksMutation = useMutation({
    mutationFn: async (chunkIds: string[]) => {
      if (!docId) return false
      return knowledgeAPI.document.deleteChunks({
        doc_id: docId,
        chunk_ids: chunkIds,
      })
    },
    onSuccess: invalidateChunkList,
  })

  const createChunkMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!docId) return false
      return knowledgeAPI.document.createChunk({
        doc_id: docId,
        content_with_weight: content,
        available_int: 1,
      })
    },
    onSuccess: invalidateChunkList,
  })

  const setMetaMutation = useMutation({
    mutationFn: async (meta: Record<string, unknown>) => {
      if (!docId) return false
      return knowledgeAPI.document.setDocumentMeta({
        doc_id: docId,
        meta,
      })
    },
    onSuccess: invalidateChunkList,
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
  
  // 创建分段
  const handleCreateChunk = async () => {
    if (!newChunkContent.trim()) return
    
    try {
      await createChunkMutation.mutateAsync(newChunkContent.trim())
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
      await setChunkMutation.mutateAsync({
        chunkId: selectedChunk.chunk_id,
        content: editingChunkContent.trim(),
      })
      
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
                      // 单击选中并在右侧面板显示预览
                      setSelectedChunk(chunk)
                      setEditingChunkContent(chunk.content_with_weight)
                      setIsMarkdownPreview(false)
                    }}
                    onDoubleClick={(e) => {
                      // 双击进入编辑模式
                      e.stopPropagation()
                      setSelectedChunk(chunk)
                      setIsEditMode(true)
                      setEditingChunkContent(chunk.content_with_weight)
                      setIsMarkdownPreview(false)
                    }}
                  >
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
                              setIsMarkdownPreview(false) // 重置为编辑模式
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
                    <div className="flex gap-3">
                      {/* 缩略图预览 (如果有 img_id) */}
                      {chunk.img_id && (
                        <div className="relative flex-shrink-0 group/thumb">
                          <img
                            src={`/v1/document/image/${chunk.img_id}`}
                            alt="切片缩略图"
                            className="w-16 h-16 object-cover rounded border"
                            style={{
                              borderColor: 'var(--color-border-default)',
                              backgroundColor: 'var(--color-background-subtle)'
                            }}
                            onError={(e) => {
                              // 隐藏加载失败的图片
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                          {/* Hover 时显示大图预览 */}
                          <div className="absolute left-0 top-full mt-2 z-50 opacity-0 invisible group-hover/thumb:opacity-100 group-hover/thumb:visible transition-all duration-200 pointer-events-none">
                            <img
                              src={`/v1/document/image/${chunk.img_id}`}
                              alt="切片预览"
                              className="max-w-xs max-h-64 object-contain rounded-lg shadow-xl border"
                              style={{
                                borderColor: 'var(--color-border-default)',
                                backgroundColor: 'var(--color-background-surface)'
                              }}
                            />
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
                    
                    {/* 分段关键词 */}
                    {chunk.important_kwd && chunk.important_kwd.length > 0 && (
                      <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-subtle)' }}>
                        <div className="flex flex-wrap gap-2">
                          {chunk.important_kwd.map((keyword, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs" style={{
                              backgroundColor: 'var(--color-components-badge-info-bg)',
                              color: 'var(--color-components-badge-info-text)'
                            }}>
                              {keyword}
                            </span>
                          ))}
                        </div>
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
                      setIsMarkdownPreview(false) // 重置预览状态
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto scrollbar-thin">
                <div className="space-y-4 h-full flex flex-col">
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
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-600 font-medium">
                        Beta
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-h-0">
                    {isMarkdownPreview ? (
                      <div className="w-full h-full px-4 py-3 rounded-md overflow-y-auto scrollbar-thin" style={{
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
                        className="w-full h-full px-3 py-2 rounded-md resize-none text-sm font-mono leading-relaxed"
                        style={{
                          border: '1px solid var(--color-components-input-border)',
                          backgroundColor: 'var(--color-components-input-bg)',
                          color: 'var(--color-components-input-text)',
                          minHeight: '300px'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'var(--color-components-input-border-focus)'
                          e.target.style.outline = 'none'
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'var(--color-components-input-border)'
                        }}
                        placeholder="请输入分段内容...&#10;&#10;支持 Markdown 语法：&#10;# 标题1  ## 标题2  ### 标题3&#10;**粗体** *斜体* `行内代码`&#10;```代码块```&#10;- 列表项  1. 数字列表&#10;[链接文本](URL)&#10;| 表头1 | 表头2 |&#10;|-------|-------|&#10;| 数据1 | 数据2 |"
                      />
                    )}
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
          
          {/* 选中分段预览区域 (单击时显示) */}
          {isInfoPanelOpen && selectedChunk && !isEditMode && (
            <div className="p-4 border-b border-border-default">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  分段预览
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditMode(true)
                      setEditingChunkContent(selectedChunk.content_with_weight)
                    }}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    编辑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedChunk(null)
                      setEditingChunkContent('')
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div 
                className="text-sm leading-relaxed rounded-lg p-3 max-h-48 overflow-y-auto scrollbar-thin"
                style={{ 
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-background-subtle)'
                }}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(selectedChunk.content_with_weight, {
                    ALLOWED_TAGS: ['em', 'strong', 'b', 'i', 'br'],
                    ALLOWED_ATTR: [],
                  })
                }}
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-text-tertiary">
                <Tooltip content={`完整ID: ${selectedChunk.chunk_id}`}>
                  <span className="cursor-help">
                    ID: {selectedChunk.chunk_id.slice(0, 8)}...
                  </span>
                </Tooltip>
                <span>•</span>
                <span className={selectedChunk.available_int === 1 ? 'text-green-600' : 'text-red-500'}>
                  {selectedChunk.available_int === 1 ? '已启用' : '已禁用'}
                </span>
              </div>
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
                        {showParserConfig && (
                          <div className="mt-2 rounded-lg p-3" style={{
                            backgroundColor: 'var(--color-background-subtle)',
                            border: '1px solid var(--color-border-default)'
                          }}>
                            <pre className="text-xs whitespace-pre-wrap overflow-x-auto scrollbar-thin" style={{ color: 'var(--color-text-secondary)' }}>
                              {JSON.stringify(docInfo.parser_config, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>段落数量：</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{docInfo.chunk_num}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-secondary)' }}>嵌入花费：</span>
                          <span style={{ color: 'var(--color-text-primary)' }}>{docInfo.token_num} tokens</span>
                        </div>
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
              className="w-full h-48 px-3 py-2 rounded-md resize-none"
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
    </div>
  )
}

export { DocumentChunksPage }