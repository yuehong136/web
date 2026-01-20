import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  Upload,
  Plus,
  Search,
  Filter,
  Play,
  Square,
  Download,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  CheckCircle,
  XCircle,
  Tag,
  ArrowUpDown,
  Settings2
} from 'lucide-react'
import { Progress } from 'antd'
import { useKnowledgeStore } from '@/stores/knowledge'
import { knowledgeAPI } from '@/api/knowledge'
import { toast } from '@/lib/toast'
import type { Document, DocumentFilter, MetadataManageType, IDocumentInfoFilter } from '@/types/api'
import { MetadataManageType as MetadataType } from '@/types/api'
import { ManageMetadataModal, DocumentMetadataModal } from './metadata'
import { 
  Button,
  Input, 
  Card,
  Table,
  FileIcon,
  type Column,
  Tooltip,
  Modal,
  ConfirmModal,
  PageSizeSelector,
  CustomSelect
} from '../../components/ui'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp, Funnel } from 'lucide-react'
// import { cn } from '@/lib/utils' // 已移除硬编码样式，不再需要

// ============================================================================
// 筛选器常量 - 参照 ragflow 的 use-select-filters.ts
// ============================================================================

/** 特殊筛选字段：无元数据 */
const EMPTY_METADATA_FIELD = 'empty_metadata'

// ============================================================================
// 筛选器类型定义 - 参照 ragflow 的 interface.ts
// ============================================================================

interface FilterType {
  id: string
  field?: string
  label: string
  list?: FilterType[]
  value?: string | string[]
  count?: number
}

interface FilterCollection {
  field: string
  label: string
  list: FilterType[]
}

type FilterValue = Record<string, Array<string> | Record<string, Array<string>>>

// ============================================================================
// FilterField 组件 - 参照 ragflow 的 filter-field.tsx，支持递归嵌套
// ============================================================================

interface FilterFieldProps {
  item: FilterType
  parent: FilterType & { field: string }
  level?: number
  value: FilterValue
  onChange: (value: FilterValue) => void
}

const FilterField: React.FC<FilterFieldProps> = ({
  item,
  parent,
  level = 0,
  value,
  onChange
}) => {
  const [showAll, setShowAll] = useState(false)
  const hasNestedList = item.list && item.list.length > 0

  // 处理 checkbox 变化
  const handleCheckChange = (checked: boolean, isNestedField = false, parentId = '') => {
    if (isNestedField && parentId) {
      // 嵌套字段（如 metadata.author）
      const fieldName = parent.field // 'metadata'
      const currentValue = (value[fieldName] as Record<string, string[]>) || {}
      const currentParentValues = currentValue[parentId] || []

      const newParentValues = checked
        ? [...currentParentValues, item.id.toString()]
        : currentParentValues.filter(v => v !== item.id.toString())

      const newFieldValue = newParentValues.length > 0
        ? { ...currentValue, [parentId]: newParentValues }
        : (() => {
            const { [parentId]: _, ...rest } = currentValue
            return rest
          })()

      onChange({
        ...value,
        [fieldName]: Object.keys(newFieldValue).length > 0 ? newFieldValue : {}
      })
    } else {
      // 普通字段（如 type, run）
      const fieldName = parent.field
      const currentValues = (value[fieldName] as string[]) || []
      
      const newValues = checked
        ? [...currentValues, item.id.toString()]
        : currentValues.filter(v => v !== item.id.toString())

      onChange({
        ...value,
        [fieldName]: newValues
      })
    }
  }

  // 检查是否选中
  const isChecked = () => {
    const fieldName = parent.field
    const fieldValue = value[fieldName]
    
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(item.id.toString())
    }
    return false
  }

  // 渲染嵌套列表（如 metadata 字段）
  if (hasNestedList) {
    return (
      <div className={`flex flex-col gap-2 ${level > 0 ? 'ml-1' : ''}`}>
        <div
          className="flex items-center justify-between cursor-pointer py-1 hover:bg-[var(--color-surface-secondary)] rounded transition-colors"
          onClick={() => setShowAll(!showAll)}
        >
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {item.label}
          </span>
          <div className="flex items-center gap-2">
            {item.count !== undefined && (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {item.count}
              </span>
            )}
            {showAll ? (
              <ChevronUp className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
            ) : (
              <ChevronDown className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
            )}
          </div>
        </div>
        {showAll && item.list?.map(child => (
          <FilterField
            key={child.id}
            item={child}
            parent={{
              ...item,
              id: item.id,
              field: parent.field, // 保持父级 field 为 'metadata'
            }}
            level={level + 1}
            value={value}
            onChange={onChange}
          />
        ))}
      </div>
    )
  }

  // 渲染叶子节点（checkbox）
  // 判断是否是嵌套字段的子项（如 metadata.author 下的具体值）
  const isNestedChild = level > 0
  const parentId = isNestedChild ? parent.id : ''

  // 检查嵌套字段是否选中
  const isNestedChecked = () => {
    if (!isNestedChild) return false
    const fieldName = parent.field
    const fieldValue = value[fieldName]
    if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
      const parentValues = fieldValue[parentId] || []
      return parentValues.includes(item.id.toString())
    }
    return false
  }

  const checked = isNestedChild ? isNestedChecked() : isChecked()
  // 生成唯一的 checkbox id 用于 label 关联
  const checkboxId = `filter-${parent.field}-${parentId || 'root'}-${item.id}`

  return (
    <div className={`flex items-center justify-between text-xs group ${level > 0 ? 'ml-4' : ''}`}>
      {/* 使用 flex 容器包裹 Checkbox 和 label，实现点击任意位置都能触发选中 */}
      <div 
        className="flex items-center gap-2 flex-1 min-w-0 py-1.5 px-1 -mx-1 rounded cursor-pointer hover:bg-[var(--color-surface-secondary)] transition-colors"
        onClick={() => handleCheckChange(!checked, isNestedChild, parentId)}
      >
        <Checkbox
          id={checkboxId}
          checked={checked}
          onCheckedChange={(c) => handleCheckChange(!!c, isNestedChild, parentId)}
          onClick={(e) => e.stopPropagation()} // 防止冒泡导致双击
          className="shrink-0"
        />
        <span 
          className="truncate select-none" 
          style={{ color: 'var(--color-text-primary)' }}
          title={item.label}
        >
          {item.label}
        </span>
      </div>
      {item.count !== undefined && (
        <span className="text-xs ml-2 tabular-nums" style={{ color: 'var(--color-text-tertiary)' }}>
          {item.count}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// FilterPopover 组件 - 参照 ragflow 的 filter-popover.tsx，支持 filterGroup 分组
// ============================================================================

interface FilterPopoverProps {
  filters: FilterCollection[]
  value: FilterValue
  onChange: (value: FilterValue) => void
  onOpenChange?: (open: boolean) => void
  /** 筛选器分组配置，key 为组名，value 为该组包含的 field 数组 */
  filterGroup?: Record<string, string[]>
}

const FilterPopover: React.FC<React.PropsWithChildren<FilterPopoverProps>> = ({
  children,
  filters,
  value,
  onChange,
  onOpenChange,
  filterGroup
}) => {
  const [open, setOpen] = useState(false)
  const [localValue, setLocalValue] = useState<FilterValue>(value)

  // 同步外部 value 变化
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen)
    setOpen(newOpen)
    if (newOpen) {
      setLocalValue(value)
    }
  }

  const handleSubmit = () => {
    onChange(localValue)
    setOpen(false)
  }

  const handleReset = () => {
    const emptyValue: FilterValue = {}
    filters.forEach(f => {
      const hasNested = f.list?.some(item => item.list && item.list.length > 0)
      emptyValue[f.field] = hasNested ? {} : []
    })
    onChange(emptyValue)
    setOpen(false)
  }

  // 计算属于分组的 field 列表
  const groupedFields = useMemo(() => {
    if (!filterGroup) return new Set<string>()
    return Object.values(filterGroup).reduce<Set<string>>((pre, cur) => {
      cur.forEach(item => pre.add(item))
      return pre
    }, new Set())
  }, [filterGroup])

  // 不属于任何分组的筛选器
  const ungroupedFilters = useMemo(() => {
    return filters.filter(f => !groupedFields.has(f.field))
  }, [filters, groupedFields])

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="px-4 py-3 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {/* 渲染分组筛选器 */}
          {filterGroup && Object.entries(filterGroup).map(([groupName, fieldKeys]) => {
            const groupFilters = filters.filter(f => fieldKeys.includes(f.field))
            if (groupFilters.length === 0) return null
            
            return (
              <div 
                key={groupName} 
                className="flex flex-col space-y-3 border-b pb-4"
                style={{ borderColor: 'var(--color-border-default)' }}
              >
                {/* 组标题 */}
                <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {groupName}
                </div>
                {/* 组内筛选器 */}
                <div className="flex flex-col space-y-3">
                  {groupFilters.map(collection => (
                    <FilterField
                      key={collection.field}
                      item={{ ...collection, id: collection.field }}
                      parent={{ ...collection, id: collection.field, field: '' }}
                      value={localValue}
                      onChange={setLocalValue}
                    />
                  ))}
                </div>
              </div>
            )
          })}

          {/* 渲染未分组的筛选器 */}
          {ungroupedFilters.map(collection => (
            <div key={collection.field} className="space-y-3">
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {collection.label}
              </div>
              <div className="space-y-1">
                {collection.list?.map(item => (
                  <FilterField
                    key={item.id}
                    item={item}
                    parent={{ ...collection, id: collection.field }}
                    value={localValue}
                    onChange={setLocalValue}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-4 py-3 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <Button variant="outline" size="sm" onClick={handleReset}>
            清除
          </Button>
          <Button size="sm" onClick={handleSubmit}>
            确定
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const KnowledgeDocumentsPage: React.FC = () => {
  const { id: kbId } = useParams<{ id: string }>()
  const { } = useKnowledgeStore()
  const navigate = useNavigate()
  
  // 状态管理
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
  const [searchKeywords, setSearchKeywords] = useState('')
  
  // 分页状态
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 排序状态
  const [sortConfig, setSortConfig] = useState({
    orderby: 'create_time',
    desc: true
  })
  
  // 筛选值状态 - 使用 ragflow 的 FilterValue 结构
  const [filterValue, setFilterValue] = useState<FilterValue>({
    type: [],
    run: [],
    metadata: {}
  })
  
  // 筛选选项（从后端动态获取）
  const [filterOptions, setFilterOptions] = useState<IDocumentInfoFilter | null>(null)
  const [filterOptionsLoading, setFilterOptionsLoading] = useState(false)
  
  // 定时器引用
  const refreshInterval = useRef<NodeJS.Timeout | null>(null)
  
  // 模态框状态
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renamingDoc, setRenamingDoc] = useState<Document | null>(null)
  const [newDocName, setNewDocName] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingDocId, setDeletingDocId] = useState<string>('')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  // Metadata 模态框状态
  const [metadataModalOpen, setMetadataModalOpen] = useState(false)
  const [docMetadataModalOpen, setDocMetadataModalOpen] = useState(false)
  const [editingDocMeta, setEditingDocMeta] = useState<Document | null>(null)
  
  // 运行状态选项 - 匹配后端 TaskStatus 枚举
  const runStatusOptions = [
    { value: '0', label: '未开始' },    // UNSTART
    { value: '1', label: '运行中' },    // RUNNING
    { value: '2', label: '已取消' },    // CANCEL
    { value: '3', label: '已完成' },    // DONE
    { value: '4', label: '失败' }       // FAIL
  ]
  
  // 文件类型选项 - 匹配后端 FileType 枚举
  const fileTypeOptions = [
    { value: 'pdf', label: 'PDF文档' },      // PDF
    { value: 'doc', label: '文档' },         // DOC
    { value: 'visual', label: '视觉文件' },   // VISUAL (图片/视频)
    { value: 'aural', label: '音频文件' },    // AURAL
    { value: 'virtual', label: '虚拟文件' },  // VIRTUAL
    { value: 'folder', label: '文件夹' },     // FOLDER
    { value: 'other', label: '其他' }        // OTHER
  ]

  // 文件后缀选项
  const suffixOptions = [
    { value: 'pdf', label: '.pdf' },
    { value: 'docx', label: '.docx' },
    { value: 'doc', label: '.doc' },
    { value: 'txt', label: '.txt' },
    { value: 'md', label: '.md' },
    { value: 'csv', label: '.csv' },
    { value: 'xlsx', label: '.xlsx' },
    { value: 'xls', label: '.xls' },
    { value: 'ppt', label: '.ppt' },
    { value: 'pptx', label: '.pptx' }
  ]
  
  // 构建筛选器列表 - 参照 ragflow 的 use-select-filters.ts
  const filterCollections = useMemo<FilterCollection[]>(() => {
    if (!filterOptions) {
      return [
        { field: 'type', label: '文件类型', list: suffixOptions.map(o => ({ id: o.value, label: o.label })) },
        { field: 'run', label: '任务状态', list: runStatusOptions.map(o => ({ id: o.value, label: o.label })) },
        { field: 'metadata', label: '元数据', list: [] }
      ]
    }
    
    // 从后端数据构建 fileTypes
    const fileTypes: FilterType[] = filterOptions.suffix 
      ? Object.entries(filterOptions.suffix).map(([suffix, count]) => ({
          id: suffix,
          label: suffix.toUpperCase(),
          count
        }))
      : []
    
    // 从后端数据构建 fileStatus（包含运行状态 + 无元数据筛选）
    const fileStatus: FilterType[] = []
    
    // 添加运行状态选项
    if (filterOptions.run_status) {
      Object.entries(filterOptions.run_status).forEach(([status, count]) => {
        fileStatus.push({
          id: status,
          label: runStatusOptions.find(o => o.value === status)?.label || `状态${status}`,
          count
        })
      })
    }
    
    // 添加"无元数据"筛选选项（从 metadata.empty_metadata 获取）
    const emptyMetadataInfo = filterOptions.metadata?.[EMPTY_METADATA_FIELD]
    if (emptyMetadataInfo) {
      const emptyCount = emptyMetadataInfo['true'] ?? 0
      if (emptyCount > 0) {
        fileStatus.push({
          id: EMPTY_METADATA_FIELD,
          label: '无元数据',
          count: emptyCount
        })
      }
    }
    
    // 从后端数据构建 metaDataList - 嵌套结构
    const metaDataList: FilterType[] = filterOptions.metadata
      ? Object.entries(filterOptions.metadata)
          .filter(([fieldName]) => fieldName !== 'empty_metadata')
          .map(([fieldName, fieldValues]) => ({
            id: fieldName,
            field: fieldName,
            label: fieldName,
            list: Object.entries(fieldValues).map(([value, count]) => ({
              id: value,
              field: value,
              label: value,
              value: [value],
              count
            })),
            count: Object.values(fieldValues).reduce((acc, c) => acc + c, 0)
          }))
      : []
    
    return [
      { field: 'type', label: '文件类型', list: fileTypes },
      { field: 'run', label: '任务状态', list: fileStatus },
      { field: 'metadata', label: '元数据', list: metaDataList }
    ]
  }, [filterOptions])
  
  // 筛选器分组配置 - 参照 ragflow 的 use-select-filters.ts
  const filterGroup = useMemo<Record<string, string[]>>(() => ({
    '系统属性': ['type', 'run'],
    // '元数据字段': ['metadata'],  // metadata 单独显示，不放入分组
  }), [])
  
  // 计算筛选数量 - 参照 ragflow 的 filterCount 计算逻辑
  const filterCount = useMemo(() => {
    return typeof filterValue === 'object' && filterValue !== null
      ? Object.values(filterValue).reduce((pre, cur) => {
          if (Array.isArray(cur)) {
            return pre + cur.length
          }
          if (typeof cur === 'object') {
            return pre + Object.values(cur).reduce((innerPre, innerCur) => {
              return innerPre + (innerCur?.length || 0)
            }, 0)
          }
          return pre
        }, 0)
      : 0
  }, [filterValue])

  // 检查是否有活动的筛选条件
  const hasActiveFilters = () => {
    return filterCount > 0 || searchKeywords.trim() !== ''
  }
  
  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilterValue({
      type: [],
      run: [],
      metadata: {}
    })
    setSearchKeywords('')
    setPage(1)
  }
  
  // 获取筛选选项
  const fetchFilterOptions = async () => {
    if (!kbId) return
    
    try {
      setFilterOptionsLoading(true)
      const response = await knowledgeAPI.document.getFilter(kbId)
      setFilterOptions(response.filter)
    } catch (error) {
      console.error('Failed to fetch filter options:', error)
    } finally {
      setFilterOptionsLoading(false)
    }
  }
  
  // 将 filterValue 转换为 API 需要的 DocumentFilter 格式
  const getDocumentFilter = useCallback((): DocumentFilter => {
    const typeValues = filterValue.type as string[] || []
    const rawRunValues = filterValue.run as string[] || []
    const metadataValues = filterValue.metadata as Record<string, string[]> || {}
    
    // 处理"无元数据"特殊筛选值
    // 如果选中了"无元数据"，需要从 run_status 中移除并设置 return_empty_metadata
    let returnEmptyMetadata = false
    const runValues = rawRunValues.filter(value => {
      if (value === EMPTY_METADATA_FIELD) {
        returnEmptyMetadata = true
        return false
      }
      return true
    })
    
    return {
      suffix: typeValues,
      run_status: runValues.length > 0 ? runValues : undefined,
      metadata: Object.keys(metadataValues).length > 0 ? metadataValues : undefined,
      return_empty_metadata: returnEmptyMetadata || undefined
    }
  }, [filterValue])
  
  // 格式化文件大小
  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
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
  
  // 获取文档列表
  const fetchDocuments = async () => {
    if (!kbId) return
    
    try {
      setLoading(true)
      const response = await knowledgeAPI.document.list({
        kb_id: kbId,
        keywords: searchKeywords,
        page: page - 1,
        page_size: pageSize,
        orderby: sortConfig.orderby,
        desc: sortConfig.desc,
        filter_params: getDocumentFilter()
      })
      
      setDocuments(response.docs || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error('Failed to fetch documents:', error)
      setDocuments([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }
  
  // 监听进度变化，自动刷新正在处理的文档
  const startProgressMonitoring = useCallback(() => {
    const hasParsingDocs = documents.some(doc => doc.run === '1')
    if (hasParsingDocs) {
      const timer = setInterval(() => {
        fetchDocuments()
      }, 3000) // 每3秒刷新一次
      refreshInterval.current = timer
    }
  }, [documents])
  
  // 停止进度监控
  const stopProgressMonitoring = useCallback(() => {
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current)
      refreshInterval.current = null
    }
  }, [])
  
  // 清理定时器
  useEffect(() => {
    return () => {
      stopProgressMonitoring()
    }
  }, [stopProgressMonitoring])
  
  // 监控任务进度
  useEffect(() => {
    stopProgressMonitoring()
    startProgressMonitoring()
  }, [documents, startProgressMonitoring, stopProgressMonitoring])
  
  // 监听筛选条件变化，重置页码
  useEffect(() => {
    setPage(1)
  }, [filterValue, searchKeywords])
  
  // 页面加载时获取筛选选项
  useEffect(() => {
    if (kbId) {
      fetchFilterOptions()
    }
  }, [kbId])
  
  // 监听所有变化，触发数据获取
  useEffect(() => {
    if (kbId) {
      fetchDocuments()
    }
  }, [kbId, page, pageSize, sortConfig, filterValue, searchKeywords])
  
  // 切换文档启用状态
  const handleToggleStatus = async (doc: Document) => {
    try {
      const newStatus = doc.status === '1' ? 0 : 1
      const result = await knowledgeAPI.document.changeStatus({
        doc_ids: [doc.id],
        status: newStatus
      })
      
      // 检查操作结果
      const docResult = result[doc.id]
      if (docResult?.error) {
        console.error('Failed to toggle document status:', docResult.error)
        toast.error(`状态切换失败: ${docResult.error}`)
        return
      }
      
      // 显示成功提示
      toast.success(`文档已${newStatus === 1 ? '启用' : '禁用'}`)
      
      fetchDocuments()
          } catch (error) {
        console.error('Failed to toggle document status:', error)
        toast.error('状态切换失败，请重试')
      }
  }
  
  // 开始/停止任务
  const handleToggleParse = async (doc: Document) => {
    try {
      if (doc.run === '1') {
        // 停止任务 (run = 0)
        await knowledgeAPI.document.run([doc.id], 0)
      } else {
        // 开始任务 (run = 1)
        await knowledgeAPI.document.run([doc.id], 1)
      }
      fetchDocuments()
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }
  
  // 重新处理文档
  const handleReprocess = async (doc: Document) => {
    const confirmed = window.confirm(`确定要重新处理文档 "${doc.name}" 吗？这将清除历史处理数据并重新开始解析。`)
    if (confirmed) {
      try {
        await knowledgeAPI.document.run([doc.id], 1, true)
        fetchDocuments()
      } catch (error) {
        console.error('Failed to reprocess document:', error)
      }
    }
  }
  
  // 删除文档
  const handleDelete = async () => {
    if (!deletingDocId) return
    
    try {
      await knowledgeAPI.document.delete([deletingDocId])
      setDeleteConfirmOpen(false)
      setDeletingDocId('')
      fetchDocuments()
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }
  
  // 重命名文档
  const handleRename = async () => {
    if (!renamingDoc || !newDocName) return
    
    try {
      await knowledgeAPI.document.rename(renamingDoc.id, newDocName)
      setRenameModalOpen(false)
      setRenamingDoc(null)
      setNewDocName('')
      fetchDocuments()
    } catch (error) {
      console.error('Failed to rename document:', error)
    }
  }
  
  // 下载文档
  const handleDownload = async (doc: Document) => {
    try {
      await knowledgeAPI.document.download(doc.id, doc.name)
    } catch (error) {
      console.error('Failed to download document:', error)
    }
  }
  
  // 选择文档
  const handleSelectDoc = (docId: string, checked: boolean) => {
    if (checked) {
      setSelectedDocs(new Set([...selectedDocs, docId]))
    } else {
      const newSet = new Set(selectedDocs)
      newSet.delete(docId)
      setSelectedDocs(newSet)
    }
  }

  // 文件验证函数
  const validateFiles = (files: File[]) => {
    return files.filter(file => {
      // 检查文件大小 (100MB限制)
      const maxSize = 100 * 1024 * 1024
      if (file.size > maxSize) {
        alert(`文件 "${file.name}" 超过100MB大小限制`)
        return false
      }
      
      // 检查文件名长度
      if (file.name.length > 255) {
        alert(`文件名 "${file.name}" 过长，请使用更短的文件名`)
        return false
      }
      
      return true
    })
  }

  // 文件上传处理
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const validFiles = validateFiles(files)
    setSelectedFiles(validFiles)
  }

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    const validFiles = validateFiles(files)
    setSelectedFiles(prev => [...prev, ...validFiles])
  }

  // 移除文件
  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (!kbId || selectedFiles.length === 0) return
    
    try {
      setUploading(true)
      
      // 使用修复后的API客户端
      const uploadedDocs = await knowledgeAPI.document.upload(kbId, selectedFiles)
      
      if (uploadedDocs && uploadedDocs.length > 0) {
        console.log(`成功上传 ${uploadedDocs.length} 个文档`)
        // 成功后关闭模态框并刷新列表
        setUploadModalOpen(false)
        setSelectedFiles([])
        fetchDocuments() // 刷新文档列表
      } else {
        console.error('上传响应为空或无效')
        alert('上传失败：服务器响应异常')
      }
    } catch (error) {
      console.error('文档上传失败:', error)
      let errorMessage = '文档上传失败'
      
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setUploading(false)
    }
  }
  

  
  // 批量操作
  const handleBulkDelete = async () => {
    if (selectedDocs.size === 0) return
    
    const confirmed = window.confirm(`确定要删除选中的 ${selectedDocs.size} 个文档吗？`)
    if (!confirmed) return
    
    try {
      // 一次性删除所有选中的文档
      await knowledgeAPI.document.delete(Array.from(selectedDocs))
      setSelectedDocs(new Set())
      fetchDocuments()
    } catch (error) {
      console.error('Failed to delete documents:', error)
      alert('批量删除失败，请重试')
    }
  }
  
  // 获取表格列配置
  const getTableColumns = (): Column<Document>[] => {
    return [
      {
        key: 'select',
        title: '选择',
        width: 60,
        fixed: 'left',
        render: (_, record) => (
          <input
            type="checkbox"
            checked={selectedDocs.has(record.id)}
            onChange={(e) => handleSelectDoc(record.id, e.target.checked)}
            className="w-4 h-4 rounded focus:outline-none"
            style={{
              backgroundColor: selectedDocs.has(record.id) 
                ? 'var(--color-components-checkbox-bg-checked)' 
                : 'var(--color-components-checkbox-bg)',
              borderColor: selectedDocs.has(record.id) 
                ? 'var(--color-components-checkbox-border-checked)' 
                : 'var(--color-components-checkbox-border)',
              borderWidth: '1px',
              color: selectedDocs.has(record.id) 
                ? 'var(--color-components-checkbox-icon)' 
                : 'transparent'
            }}
          />
        )
      },
      {
        key: 'icon',
        title: '',
        width: 50,
        render: (_, record) => (
          <Tooltip content={`文件类型: ${record.type || '未知'}`}>
            <FileIcon 
              fileType={record.suffix || record.type || 'txt'} 
              fileName={record.name}
              size="sm"
            />
          </Tooltip>
        )
      },
      {
        key: 'name',
        title: '文件名',
        dataIndex: 'name',
        sortable: true,
        render: (value, record) => (
          <Tooltip 
            content={
              <div className="max-w-md">
                <div className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>{value}</div>
                <div className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <div>大小: {formatFileSize(record.size || 0)}</div>
                  <div>类型: {record.type || '未知'}</div>
                  <div>分块: {record.chunk_num || 0}</div>
                  <div>创建: {formatDate(record.create_date)}</div>
                </div>
              </div>
            }
            delayHide={500}
            maxWidth="max-w-md"
          >
            <div 
              className="font-medium truncate cursor-pointer transition-colors" 
              style={{ 
                maxWidth: '300px',
                color: 'var(--color-text-primary)'
              }}
              onClick={() => navigate(`/knowledge/${kbId}/documents/${record.id}/chunks`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)'
              }}
            >
              {value}
            </div>
          </Tooltip>
        )
      },
      {
        key: 'size',
        title: '大小',
        dataIndex: 'size',
        sortable: true,
        width: 120,
        render: (value) => (
          <Tooltip content={`文件大小: ${value || 0} 字节`}>
            <span className="text-sm cursor-help" style={{ color: 'var(--color-text-secondary)' }}>
              {formatFileSize(value || 0)}
            </span>
          </Tooltip>
        )
      },
      {
        key: 'chunk_num',
        title: '分块数',
        dataIndex: 'chunk_num',
        width: 100,
        render: (value, record) => (
          <Tooltip content={`文档已分为 ${value || 0} 个文本块，Token数: ${record.token_num || 0}`}>
            <span className="text-sm cursor-help" style={{ color: 'var(--color-text-secondary)' }}>
              {value || 0}
            </span>
          </Tooltip>
        )
      },
      {
        key: 'parser_id',
        title: '切片方法',
        dataIndex: 'parser_id',
        width: 120,
        render: (value, record) => (
          <Tooltip 
            content={
              <div className="max-w-lg">
                <div className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>解析器: {value || '默认'}</div>
                {record.parser_config && (
                  <div className="text-xs whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-thin" style={{ color: 'var(--color-text-secondary)' }}>
                    配置: {JSON.stringify(record.parser_config, null, 2)}
                  </div>
                )}
              </div>
            }
            delayHide={600}
            maxWidth="max-w-lg"
          >
            <span className="text-sm cursor-help" style={{ color: 'var(--color-text-secondary)' }}>
              {value || '默认'}
            </span>
          </Tooltip>
        )
      },
      {
        key: 'status',
        title: '启用',
        width: 100,
        render: (_, record) => (
          <Tooltip content={record.status === '1' ? '点击禁用文档' : '点击启用文档'}>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={record.status === '1'}
                onChange={() => handleToggleStatus(record)}
                className="sr-only peer"
              />
              <div 
                className="w-9 h-5 rounded-full relative cursor-pointer transition-colors duration-200"
                style={{
                  backgroundColor: record.status === '1' 
                    ? 'var(--color-components-switch-bg-checked)' 
                    : 'var(--color-components-switch-bg)'
                }}
              >
                <div 
                  className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                  style={{
                    backgroundColor: record.status === '1' 
                      ? 'var(--color-components-switch-thumb-checked)'
                      : 'var(--color-components-switch-thumb)',
                    transform: record.status === '1' ? 'translateX(16px)' : 'translateX(0)'
                  }}
                />
              </div>
            </label>
          </Tooltip>
        )
      },
      {
        key: 'run',
        title: '任务状态',
        width: 180,
        render: (_, record) => {
          if (record.run === '1') {
            // 运行中，显示进度条
            const progress = Math.round(record.progress * 100)
            return (
              <Tooltip 
                content={
                  <div className="max-w-2xl">
                    <div className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>处理进度: {progress}%</div>
                    {record.progress_msg && (
                      <div className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-thin leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {record.progress_msg}
                      </div>
                    )}
                  </div>
                }
                delayHide={800}
                maxWidth="max-w-2xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--color-text-accent)' }}>运行中</span>
                  </div>
                  <Progress 
                    percent={progress}
                    size="small"
                    status="active"
                    strokeColor="#2563eb"
                    showInfo={true}
                    format={(percent) => `${percent}%`}
                  />
                </div>
              </Tooltip>
            )
          }
          
          // 其他状态
          const statusMap = {
            '0': { text: '未开始', bgColor: 'var(--color-components-badge-neutral-bg)', textColor: 'var(--color-components-badge-neutral-text)' },
            '2': { text: '已取消', bgColor: 'var(--color-components-badge-warning-bg)', textColor: 'var(--color-components-badge-warning-text)' },
            '3': { text: '已完成', bgColor: 'var(--color-components-badge-success-bg)', textColor: 'var(--color-components-badge-success-text)' },
            '4': { text: '失败', bgColor: 'var(--color-components-badge-error-bg)', textColor: 'var(--color-components-badge-error-text)' }
          }
          
          const status = statusMap[record.run as keyof typeof statusMap] || statusMap['0']
          
          return (
            <Tooltip 
              content={
                <div className="max-w-2xl">
                  <div className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>状态: {status.text}</div>
                  {record.progress_msg && (
                    <div className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto scrollbar-thin leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {record.progress_msg}
                    </div>
                  )}
                </div>
              }
              delayHide={800}
              maxWidth="max-w-2xl"
            >
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help" style={{
                backgroundColor: status.bgColor,
                color: status.textColor
              }}>
                {status.text}
              </span>
            </Tooltip>
          )
        }
      },
      {
        key: 'create_date',
        title: '创建时间',
        dataIndex: 'create_date',
        sortable: true,
        width: 180,
        render: (value, record) => (
          <Tooltip 
            content={
              <div className="max-w-md">
                <div className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>创建时间</div>
                <div className="text-xs space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <div>创建: {formatDate(value)}</div>
                  <div>更新: {formatDate(record.update_date)}</div>
                  <div>创建者: {record.created_by || '未知'}</div>
                </div>
              </div>
            }
            delayHide={500}
            maxWidth="max-w-md"
          >
            <span className="text-sm cursor-help" style={{ color: 'var(--color-text-secondary)' }}>
              {formatDate(value)}
            </span>
          </Tooltip>
        )
      },
      {
        key: 'actions',
        title: '操作',
        width: 200,
        fixed: 'right',
        align: 'right',
        render: (_, record) => (
          <div className="flex items-center justify-end space-x-2">
            <Tooltip content={record.run === '1' ? '停止当前任务' : '开始处理任务'}>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleToggleParse(record)}
              >
                {record.run === '1' ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </Tooltip>
            <Tooltip content="重新处理文档（清除历史数据）">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleReprocess(record)}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="重命名文档">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setRenamingDoc(record)
                  setNewDocName(record.name)
                  setRenameModalOpen(true)
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="下载文档到本地">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDownload(record)}
              >
                <Download className="h-4 w-4" />
              </Button>
            </Tooltip>
            <Tooltip content="删除文档（不可恢复）">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setDeletingDocId(record.id)
                  setDeleteConfirmOpen(true)
                }}
                style={{ color: 'var(--color-text-error)' }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Tooltip>
          </div>
        )
      }
    ]
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* 搜索和筛选栏 */}
      <Card className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="max-w-md flex-1">
              <Input
                type="search"
                placeholder="搜索文档..."
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchDocuments()
                  }
                }}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>
            {/* 筛选按钮 - 使用 FilterPopover，支持 filterGroup 分组 */}
            <FilterPopover
              filters={filterCollections}
              value={filterValue}
              onChange={setFilterValue}
              filterGroup={filterGroup}
              onOpenChange={(open) => {
                if (open) {
                  fetchFilterOptions()
                }
              }}
            >
              <Button
                variant="outline"
                size="sm"
                style={filterCount > 0 ? {
                  backgroundColor: 'var(--color-state-warning-subtle)',
                  color: 'var(--color-state-warning)',
                  borderColor: 'var(--color-border-warning)'
                } : {}}
              >
                <Funnel className="h-4 w-4 mr-2" />
                筛选
                {filterCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full" style={{
                    color: 'var(--color-components-badge-warning-text)',
                    backgroundColor: 'var(--color-state-warning)'
                  }}>
                    {filterCount}
                  </span>
                )}
              </Button>
            </FilterPopover>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={fetchDocuments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" onClick={() => setMetadataModalOpen(true)}>
              <Tag className="h-4 w-4 mr-2" />
              管理元数据
            </Button>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              导入文档
            </Button>
          </div>
        </div>
      </Card>
      
      {/* 文档列表 */}
      {!loading && documents.length > 0 && (
        <div className="rounded-lg shadow-sm overflow-hidden flex flex-col flex-1 min-h-0" style={{ backgroundColor: 'var(--color-background-surface)' }}>
          {/* 列表头部控制 */}
          <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedDocs.size === documents.length && documents.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedDocs(new Set(documents.map(doc => doc.id)))
                      } else {
                        setSelectedDocs(new Set())
                      }
                    }}
                    className="w-4 h-4 rounded focus:outline-none"
                    style={{
                      backgroundColor: (selectedDocs.size === documents.length && documents.length > 0)
                        ? 'var(--color-components-checkbox-bg-checked)' 
                        : 'var(--color-components-checkbox-bg)',
                      borderColor: (selectedDocs.size === documents.length && documents.length > 0)
                        ? 'var(--color-components-checkbox-border-checked)' 
                        : 'var(--color-components-checkbox-border)',
                      borderWidth: '1px',
                      color: (selectedDocs.size === documents.length && documents.length > 0)
                        ? 'var(--color-components-checkbox-icon)' 
                        : 'transparent'
                    }}
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    全选 ({selectedDocs.size > 0 ? `已选 ${selectedDocs.size} 个` : `共 ${total} 个文档`})
                  </span>
                </label>
              </div>
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                显示 {documents.length} / {total} 个文档
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <Table<Document>
              columns={getTableColumns()}
              data={documents}
              rowKey="id"
              sortConfig={{
                field: sortConfig.orderby,
                direction: sortConfig.desc ? 'desc' : 'asc'
              }}
              onSort={(field, direction) => {
                setSortConfig({
                  orderby: field,
                  desc: direction === 'desc'
                })
              }}
              striped
              hoverable
              className="min-w-full"
            />
          </div>
          
          {/* 自定义分页控件 - sticky 粘性定位 */}
          {total > 0 && (
            <div className="sticky bottom-0 backdrop-blur-sm shadow-lg" style={{
              borderTop: '1px solid var(--color-components-pagination-border)',
              backgroundColor: 'var(--color-components-pagination-bg)',
              backdropFilter: 'blur(12px)'
            }}>
              <div className="px-6 py-4 flex items-center justify-between">
                <div className="text-sm" style={{ color: 'var(--color-components-pagination-text)' }}>
                  共 {total} 项{selectedDocs.size > 0 && ` • 已选择 ${selectedDocs.size} 个`}
                </div>
                
                <div className="flex items-center space-x-4">
                {/* 每页显示选择器 */}
                <PageSizeSelector
                  pageSize={pageSize}
                  onChange={(size) => {
                    setPageSize(size)
                    setPage(1) // 重置到第一页
                  }}
                  options={[10, 20, 50, 100]}
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
      )}
      
      {/* 空状态 */}
      {!loading && documents.length === 0 && (
        <Card className="flex-1 flex items-center justify-center">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              暂无文档
            </h3>
            <p className="mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              还没有上传任何文档，开始添加文档吧
            </p>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加文档
            </Button>
          </div>
        </Card>
      )}
      
      {/* 批量操作浮动工具栏 */}
      {selectedDocs.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 rounded-lg shadow-lg p-4 z-50" style={{
          backgroundColor: 'var(--color-background-surface)',
          border: '1px solid var(--color-border-default)'
        }}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: 'var(--color-state-info-subtle)' }}>
                <FileText className="h-4 w-4" style={{ color: 'var(--color-state-info)' }} />
              </div>
              <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                已选择 {selectedDocs.size} 个文档
              </span>
            </div>
            <div className="h-6 w-px" style={{ backgroundColor: 'var(--color-border-default)' }} />
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const docIds = Array.from(selectedDocs)
                    const result = await knowledgeAPI.document.changeStatus({
                      doc_ids: docIds,
                      status: 1
                    })
                    
                    // 统计操作结果
                    let successCount = 0
                    let errorCount = 0
                    const errors: string[] = []
                    
                    Object.entries(result).forEach(([docId, res]) => {
                      if (res.error) {
                        errorCount++
                        errors.push(`${docId}: ${res.error}`)
                      } else {
                        successCount++
                      }
                    })
                    
                    // 显示操作结果
                    if (errorCount > 0) {
                      console.error('Some documents failed to enable:', errors)
                      toast.warning(`批量启用完成: 成功 ${successCount} 个，失败 ${errorCount} 个`, { duration: 5000 })
                    } else {
                      toast.success(`成功启用 ${successCount} 个文档`)
                    }
                    
                    setSelectedDocs(new Set())
                    fetchDocuments()
                  } catch (error) {
                    console.error('Failed to enable documents:', error)
                    toast.error('批量启用失败，请重试')
                  }
                }}
                style={{ 
                  color: 'var(--color-text-success)', 
                  borderColor: 'var(--color-border-success)'
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                启用
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    const docIds = Array.from(selectedDocs)
                    const result = await knowledgeAPI.document.changeStatus({
                      doc_ids: docIds,
                      status: 0
                    })
                    
                    // 统计操作结果
                    let successCount = 0
                    let errorCount = 0
                    const errors: string[] = []
                    
                    Object.entries(result).forEach(([docId, res]) => {
                      if (res.error) {
                        errorCount++
                        errors.push(`${docId}: ${res.error}`)
                      } else {
                        successCount++
                      }
                    })
                    
                    // 显示操作结果
                    if (errorCount > 0) {
                      console.error('Some documents failed to disable:', errors)
                      toast.warning(`批量禁用完成: 成功 ${successCount} 个，失败 ${errorCount} 个`, { duration: 5000 })
                    } else {
                      toast.success(`成功禁用 ${successCount} 个文档`)
                    }
                    
                    setSelectedDocs(new Set())
                    fetchDocuments()
                  } catch (error) {
                    console.error('Failed to disable documents:', error)
                    toast.error('批量禁用失败，请重试')
                  }
                }}
                style={{ 
                  color: 'var(--color-text-secondary)', 
                  borderColor: 'var(--color-border-default)'
                }}
              >
                <XCircle className="h-4 w-4 mr-1" />
                禁用
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await knowledgeAPI.document.run(Array.from(selectedDocs), 1)
                    setSelectedDocs(new Set())
                    fetchDocuments()
                  } catch (error) {
                    console.error('Failed to start tasks:', error)
                  }
                }}
                style={{ 
                  color: 'var(--color-text-accent)', 
                  borderColor: 'var(--color-border-accent)'
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                开始任务
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await knowledgeAPI.document.run(Array.from(selectedDocs), 0)
                    setSelectedDocs(new Set())
                    fetchDocuments()
                  } catch (error) {
                    console.error('Failed to stop tasks:', error)
                  }
                }}
                style={{ 
                  color: 'var(--color-text-warning)', 
                  borderColor: 'var(--color-border-warning)'
                }}
              >
                <Square className="h-4 w-4 mr-1" />
                停止任务
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const confirmed = window.confirm(`确定要重新处理选中的 ${selectedDocs.size} 个文档吗？这将清除历史处理数据并重新开始解析。`)
                  if (confirmed) {
                    try {
                      await knowledgeAPI.document.run(Array.from(selectedDocs), 1, true)
                      setSelectedDocs(new Set())
                      fetchDocuments()
                    } catch (error) {
                      console.error('Failed to reprocess documents:', error)
                    }
                  }
                }}
                style={{ 
                  color: 'var(--color-text-accent)', 
                  borderColor: 'var(--color-border-accent)'
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                重新处理
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleBulkDelete()}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                删除
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDocs(new Set())}
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                <X className="h-4 w-4 mr-1" />
                取消选择
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 重命名模态框 */}
      <Modal
        open={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="重命名文档"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="newDocName" className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              新名称
            </label>
            <Input
              id="newDocName"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="输入新名称"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRenameModalOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRename}>
              确定
            </Button>
          </div>
        </div>
      </Modal>
 
      {/* 删除确认模态框 */}
      <ConfirmModal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title="确认删除"
        description="确定要删除这个文档吗？此操作不可逆。"
      />

      {/* 文件上传模态框 */}
      <Modal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="上传文档"
        size="lg"
      >
        <div className="space-y-6">
          {/* 拖拽上传区域 */}
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center transition-colors"
            style={{
              borderColor: dragOver 
                ? 'var(--color-border-accent)' 
                : 'var(--color-border-default)',
              backgroundColor: dragOver 
                ? 'var(--color-state-info-subtle)' 
                : 'transparent'
            }}
            onMouseEnter={(e) => {
              if (!dragOver) {
                e.currentTarget.style.borderColor = 'var(--color-border-accent)'
              }
            }}
            onMouseLeave={(e) => {
              if (!dragOver) {
                e.currentTarget.style.borderColor = 'var(--color-border-default)'
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <div className="space-y-2">
              <p className="text-lg font-medium" style={{ color: 'var(--color-text-primary)' }}>
                拖拽文件到此处，或点击选择文件
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                支持 PDF、Word、Excel、PPT、文本文件等多种格式
              </p>
            </div>
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              accept=".pdf,.docx,.doc,.txt,.md,.csv,.xlsx,.xls,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
            />
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              选择文件
            </Button>
          </div>

          {/* 文件列表 */}
          {selectedFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
                已选择 {selectedFiles.length} 个文件
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background-subtle)' }}>
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileIcon 
                        fileType={file.name.split('.').pop() || 'unknown'} 
                        className="h-8 w-8 text-blue-500 flex-shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                          {file.name}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveFile(index)}
                      className="flex-shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadModalOpen(false)
                setSelectedFiles([])
              }} 
              disabled={uploading}
            >
              取消
            </Button>
            <Button 
              onClick={handleUpload} 
              loading={uploading} 
              disabled={selectedFiles.length === 0}
            >
              {uploading ? '上传中...' : `上传 ${selectedFiles.length} 个文件`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Metadata 管理模态框 */}
      {kbId && (
        <ManageMetadataModal
          open={metadataModalOpen}
          onClose={() => setMetadataModalOpen(false)}
          kbId={kbId}
          mode={MetadataType.MANAGE}
          onSuccess={() => {
            fetchDocuments()
          }}
          onNavigateToSettings={() => {
            navigate(`/knowledge/${kbId}/settings?openMetadata=true`)
          }}
        />
      )}

      {/* 单文档 Metadata 编辑模态框 */}
      {editingDocMeta && kbId && (
        <DocumentMetadataModal
          open={docMetadataModalOpen}
          onClose={() => {
            setDocMetadataModalOpen(false)
            setEditingDocMeta(null)
          }}
          docId={editingDocMeta.id}
          docName={editingDocMeta.name}
          kbId={kbId}
          metaFields={editingDocMeta.meta_fields || {}}
          onSuccess={() => {
            fetchDocuments()
          }}
        />
      )}
    </div>
  )
}

export { KnowledgeDocumentsPage }