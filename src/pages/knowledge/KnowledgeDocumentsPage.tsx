import React, { useState, useEffect, useCallback, useRef } from 'react'
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
  ArrowUpDown
} from 'lucide-react'
import { useKnowledgeStore } from '../../stores/knowledge'
import { knowledgeAPI } from '../../api/knowledge'
import type { Document, DocumentFilter } from '../../types/api'
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
  CustomSelect
} from '../../components/ui'
import { cn } from '../../lib/utils'

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
  const [showFilters, setShowFilters] = useState(false)
  
  // 分页状态
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  
  // 排序状态
  const [sortConfig, setSortConfig] = useState({
    orderby: 'create_time',
    desc: true
  })
  
  // 过滤器状态
  const [filters, setFilters] = useState<DocumentFilter>({
    run_status: [],
    types: [],
    suffix: []
  })
  
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
  
  // 检查是否有活动的筛选条件
  const hasActiveFilters = () => {
    return (filters.run_status && filters.run_status.length > 0) ||
           (filters.types && filters.types.length > 0) ||
           (filters.suffix && filters.suffix.length > 0) ||
           searchKeywords.trim() !== ''
  }
  
  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilters({
      run_status: [],
      types: [],
      suffix: []
    })
    setSearchKeywords('')
    setPage(1)
  }
  
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
        filter_params: filters
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
  }, [filters, searchKeywords])
  
  // 监听所有变化，触发数据获取
  useEffect(() => {
    if (kbId) {
      fetchDocuments()
    }
  }, [kbId, page, pageSize, sortConfig, filters, searchKeywords])
  
  // 切换文档启用状态
  const handleToggleStatus = async (doc: Document) => {
    try {
      await knowledgeAPI.document.updateStatus([doc.id], doc.status === '1' ? '0' : '1')
      fetchDocuments()
    } catch (error) {
      console.error('Failed to toggle document status:', error)
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
            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
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
                <div className="font-medium mb-2 text-gray-900">{value}</div>
                <div className="text-xs text-gray-600 space-y-1">
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
            <div className="font-medium text-gray-900 truncate cursor-help" style={{ maxWidth: '300px' }}>
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
            <span className="text-sm text-gray-600 cursor-help">
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
            <span className="text-sm text-gray-600 cursor-help">
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
                <div className="font-medium mb-2 text-gray-900">解析器: {value || '默认'}</div>
                {record.parser_config && (
                  <div className="text-xs text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                    配置: {JSON.stringify(record.parser_config, null, 2)}
                  </div>
                )}
              </div>
            }
            delayHide={600}
            maxWidth="max-w-lg"
          >
            <span className="text-sm text-gray-600 cursor-help">
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
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
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
                    <div className="font-medium mb-2 text-gray-900">处理进度: {progress}%</div>
                    {record.progress_msg && (
                      <div className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed text-gray-700">
                        {record.progress_msg}
                      </div>
                    )}
                  </div>
                }
                delayHide={800}
                maxWidth="max-w-2xl"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">运行中</span>
                    <span className="text-xs text-gray-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Tooltip>
            )
          }
          
          // 其他状态
          const statusMap = {
            '0': { text: '未开始', color: 'bg-gray-100 text-gray-800' },
            '2': { text: '已取消', color: 'bg-yellow-100 text-yellow-800' },
            '3': { text: '已完成', color: 'bg-green-100 text-green-800' },
            '4': { text: '失败', color: 'bg-red-100 text-red-800' }
          }
          
          const status = statusMap[record.run as keyof typeof statusMap] || statusMap['0']
          
          return (
            <Tooltip 
              content={
                <div className="max-w-2xl">
                  <div className="font-medium mb-2 text-gray-900">状态: {status.text}</div>
                  {record.progress_msg && (
                    <div className="text-xs whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed text-gray-700">
                      {record.progress_msg}
                    </div>
                  )}
                </div>
              }
              delayHide={800}
              maxWidth="max-w-2xl"
            >
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-help",
                status.color
              )}>
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
                <div className="font-medium mb-2 text-gray-900">创建时间</div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>创建: {formatDate(value)}</div>
                  <div>更新: {formatDate(record.update_date)}</div>
                  <div>创建者: {record.created_by || '未知'}</div>
                </div>
              </div>
            }
            delayHide={500}
            maxWidth="max-w-md"
          >
            <span className="text-sm text-gray-600 cursor-help">
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
                className="text-red-600 hover:text-red-700"
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
    <div className="p-6">
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                showFilters ? 'bg-blue-50 text-blue-600' : '',
                hasActiveFilters() ? 'bg-orange-50 text-orange-600 border-orange-300' : ''
              )}
            >
              <Filter className="h-4 w-4 mr-2" />
              筛选
              {hasActiveFilters() && (
                <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-orange-500 rounded-full">
                  {(filters.run_status?.length || 0) + (filters.types?.length || 0) + (filters.suffix?.length || 0) + (searchKeywords.trim() ? 1 : 0)}
                </span>
              )}
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={fetchDocuments}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button onClick={() => setUploadModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              导入文档
            </Button>
          </div>
        </div>
        
        {/* 展开的筛选器 */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 rounded-md">
                  <Filter className="h-4 w-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-medium text-gray-900">筛选条件</h3>
              </div>
              <div className="flex items-center space-x-2">
                {hasActiveFilters() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-3 w-3 mr-1" />
                    清除筛选
                  </Button>
                )}
                <span className="text-xs text-gray-500">
                  筛选条件会自动应用
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 运行状态筛选 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <div className="p-1 bg-green-100 rounded">
                    <Play className="h-3 w-3 text-green-600" />
                  </div>
                  <span>任务状态</span>
                </label>
                <div className="space-y-2">
                  {runStatusOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.run_status?.includes(option.value) || false}
                        onChange={(e) => {
                          const newRunStatus = e.target.checked
                            ? [...(filters.run_status || []), option.value]
                            : (filters.run_status || []).filter(s => s !== option.value)
                          setFilters({
                            ...filters,
                            run_status: newRunStatus
                          })
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 文件类型筛选 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <div className="p-1 bg-purple-100 rounded">
                    <FileText className="h-3 w-3 text-purple-600" />
                  </div>
                  <span>文件类型</span>
                </label>
                <div className="space-y-2">
                  {fileTypeOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.types?.includes(option.value) || false}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...(filters.types || []), option.value]
                            : (filters.types || []).filter(t => t !== option.value)
                          setFilters({
                            ...filters,
                            types: newTypes
                          })
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 文件后缀筛选 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <div className="p-1 bg-orange-100 rounded">
                    <Tag className="h-3 w-3 text-orange-600" />
                  </div>
                  <span>文件后缀</span>
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {suffixOptions.map(option => (
                    <label key={option.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.suffix?.includes(option.value) || false}
                        onChange={(e) => {
                          const newSuffix = e.target.checked
                            ? [...(filters.suffix || []), option.value]
                            : (filters.suffix || []).filter(s => s !== option.value)
                          setFilters({
                            ...filters,
                            suffix: newSuffix
                          })
                        }}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-sm text-gray-700">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 排序选项 */}
              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
                  <div className="p-1 bg-yellow-100 rounded">
                    <ArrowUpDown className="h-3 w-3 text-yellow-600" />
                  </div>
                  <span>排序方式</span>
                </label>
                <div className="space-y-2">
                  <CustomSelect
                    options={[
                      { value: 'create_time', label: '创建时间' },
                      { value: 'update_time', label: '更新时间' },
                      { value: 'name', label: '文件名' },
                      { value: 'size', label: '文件大小' }
                    ]}
                    value={sortConfig.orderby}
                    onChange={(value) => {
                      setSortConfig({
                        ...sortConfig,
                        orderby: value
                      })
                    }}
                  />
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={sortConfig.desc}
                      onChange={(e) => {
                        setSortConfig({
                          ...sortConfig,
                          desc: e.target.checked
                        })
                      }}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">降序排列</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* 当前筛选状态显示 */}
            {hasActiveFilters() && (
              <div className="mt-4 pt-4 border-t border-gray-200 bg-white rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="p-1 bg-blue-100 rounded">
                    <CheckCircle className="h-3 w-3 text-blue-600" />
                  </div>
                  <div className="text-sm font-medium text-gray-700">当前筛选条件</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchKeywords.trim() && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      关键词: {searchKeywords}
                    </span>
                  )}
                  {filters.run_status?.map(status => {
                    const statusLabel = runStatusOptions.find(o => o.value === status)?.label
                    return (
                      <span key={status} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        状态: {statusLabel}
                      </span>
                    )
                  })}
                  {filters.types?.map(type => {
                    const typeLabel = fileTypeOptions.find(o => o.value === type)?.label
                    return (
                      <span key={type} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        类型: {typeLabel}
                      </span>
                    )
                  })}
                  {filters.suffix?.map(suffix => {
                    const suffixLabel = suffixOptions.find(o => o.value === suffix)?.label
                    return (
                      <span key={suffix} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        后缀: {suffixLabel}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
      
      {/* 文档列表 */}
      {!loading && documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          {/* 列表头部控制 */}
          <div className="px-6 py-4 border-b border-gray-200">
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
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-600">
                    全选 ({selectedDocs.size > 0 ? `已选 ${selectedDocs.size} 个` : `共 ${total} 个文档`})
                  </span>
                </label>
              </div>
              <div className="text-sm text-gray-500">
                显示 {documents.length} / {total} 个文档
              </div>
            </div>
          </div>

          <Table<Document>
            columns={getTableColumns()}
            data={documents}
            loading={loading}
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
          
          {/* 自定义分页控件 */}
          {total > 0 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共 {total} 项{selectedDocs.size > 0 && ` • 已选择 ${selectedDocs.size} 个`}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 每页显示选择器 */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>每页显示</span>
                  <CustomSelect
                    options={[
                      { value: '10', label: '10' },
                      { value: '20', label: '20' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' }
                    ]}
                    value={pageSize.toString()}
                    onChange={(value) => {
                      setPageSize(Number(value))
                      setPage(1) // 重置到第一页
                    }}
                    size="sm"
                    className="min-w-[60px]"
                  />
                  <span>项</span>
                </div>
                
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
          )}
        </div>
      )}
      
      {/* 空状态 */}
      {!loading && documents.length === 0 && (
        <Card className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无文档
          </h3>
          <p className="text-gray-500 mb-4">
            还没有上传任何文档，开始添加文档吧
          </p>
          <Button onClick={() => setUploadModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            添加文档
          </Button>
        </Card>
      )}
      
      {/* 批量操作浮动工具栏 */}
      {selectedDocs.size > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-sm text-gray-600">
                已选择 {selectedDocs.size} 个文档
              </span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await Promise.all(
                      Array.from(selectedDocs).map(docId => {
                        const doc = documents.find(d => d.id === docId)
                        return doc ? knowledgeAPI.document.updateStatus([docId], '1') : Promise.resolve()
                      })
                    )
                    setSelectedDocs(new Set())
                    fetchDocuments()
                  } catch (error) {
                    console.error('Failed to enable documents:', error)
                  }
                }}
                className="text-green-600 border-green-300 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                启用
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    await Promise.all(
                      Array.from(selectedDocs).map(docId => {
                        const doc = documents.find(d => d.id === docId)
                        return doc ? knowledgeAPI.document.updateStatus([docId], '0') : Promise.resolve()
                      })
                    )
                    setSelectedDocs(new Set())
                    fetchDocuments()
                  } catch (error) {
                    console.error('Failed to disable documents:', error)
                  }
                }}
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
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
                className="text-blue-600 border-blue-300 hover:bg-blue-50"
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
                className="text-orange-600 border-orange-300 hover:bg-orange-50"
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
                className="text-purple-600 border-purple-300 hover:bg-purple-50"
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
                className="text-gray-500 hover:text-gray-700"
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
            <label htmlFor="newDocName" className="block text-sm font-medium text-gray-700">
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
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragOver 
                ? "border-blue-400 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                拖拽文件到此处，或点击选择文件
              </p>
              <p className="text-sm text-gray-500">
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
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                已选择 {selectedFiles.length} 个文件
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileIcon 
                        fileType={file.name.split('.').pop() || 'unknown'} 
                        className="h-8 w-8 text-blue-500 flex-shrink-0" 
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemoveFile(index)}
                      className="text-gray-400 hover:text-red-600 flex-shrink-0"
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
    </div>
  )
}

export { KnowledgeDocumentsPage }