import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Database, 
  FileText, 
  Clock, 
  Users,
  Eye,
  Edit,
  Trash2,
  Filter,
  Settings,
  Copy,
  Upload,
  Download,
  BarChart3,
  ChevronDown,
  Grid3X3,
  List,
  SortAsc,
  SortDesc,
  Calendar,
  FileIcon,
  Layers,
  Target,
  ChevronLeft,
  ChevronRight,
  X,
  Globe,
  Zap,
  Brain,
  CheckCircle
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card } from '../../components/ui/card'
import { Loading } from '../../components/ui/loading'
import { Table } from '../../components/ui/table'
import { Avatar } from '../../components/ui/avatar'
import { Dropdown, DropdownItem } from '../../components/ui/dropdown'
import { QuickEditModal } from '../../components/knowledge/QuickEditModal'
import { CustomSelect } from '../../components/ui/custom-select'
import { useKnowledgeStore } from '../../stores/knowledge'
import { useUIStore } from '../../stores/ui'
import { cn, formatTimestamp, formatTimestampDetailed, formatTimestampCompact, formatRelativeTime, formatBytes } from '../../lib/utils'
import { ROUTES } from '../../constants'
import type { KnowledgeBase } from '../../types/api'

interface FilterState {
  permissions: string[]
  languages: string[]
  parser_ids: string[]
  embd_ids: string[]
  doc_num_range: string[]
  time_range: string
}

export const KnowledgeListPage: React.FC = () => {
  const navigate = useNavigate()
  const { 
    knowledgeBases, 
    isLoading, 
    searchQuery,
    total,
    setSearchQuery,
    loadKnowledgeBases,
    deleteKnowledgeBase 
  } = useKnowledgeStore()
  const { addNotification } = useUIStore()

  const [viewMode, setViewMode] = React.useState<'grid' | 'table'>('grid')
  const [selectedBases, setSelectedBases] = React.useState<string[]>([])
  const [sortBy, setSortBy] = React.useState<'create_time' | 'update_time' | 'name' | 'doc_num'>('update_time')
  const [sortDesc, setSortDesc] = React.useState(true)
  const [showFilters, setShowFilters] = React.useState(false)
  const [timeFormat, setTimeFormat] = React.useState<'detailed' | 'compact' | 'relative'>('detailed')
  const [editingKnowledgeBase, setEditingKnowledgeBase] = React.useState<KnowledgeBase | null>(null)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [pageSize, setPageSize] = React.useState(12)
  const [filters, setFilters] = React.useState<FilterState>({
    permissions: [],
    languages: [],
    parser_ids: [],
    embd_ids: [],
    doc_num_range: [],
    time_range: 'all'
  })

  React.useEffect(() => {
    loadKnowledgeBases({
      page: currentPage,
      page_size: pageSize,
      orderby: sortBy,
      desc: sortDesc,
      keywords: searchQuery
    })
  }, [loadKnowledgeBases, currentPage, pageSize, sortBy, sortDesc, searchQuery])

  // Reset to first page when search query or filters change
  React.useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [searchQuery, filters])

  const totalPages = Math.ceil(total / pageSize)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleCreate = () => {
    navigate(`${ROUTES.KNOWLEDGE}/create`)
  }

  const handleView = (id: string) => {
    navigate(`${ROUTES.KNOWLEDGE}/${id}`)
  }

  const handleEdit = (id: string) => {
    navigate(`${ROUTES.KNOWLEDGE}/${id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个知识库吗？此操作不可撤销。')) {
      try {
        await deleteKnowledgeBase(id)
        addNotification({
          type: 'success',
          title: '删除成功',
          message: '知识库已成功删除'
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: '删除失败',
          message: '删除知识库时发生错误'
        })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedBases.length === 0) return
    
    if (confirm(`确定要删除选中的 ${selectedBases.length} 个知识库吗？此操作不可撤销。`)) {
      try {
        await Promise.all(selectedBases.map(id => deleteKnowledgeBase(id)))
        setSelectedBases([])
        addNotification({
          type: 'success',
          title: '批量删除成功',
          message: `已成功删除 ${selectedBases.length} 个知识库`
        })
      } catch (error) {
        addNotification({
          type: 'error',
          title: '批量删除失败',
          message: '删除知识库时发生错误'
        })
      }
    }
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDesc(!sortDesc)
    } else {
      setSortBy(field)
      setSortDesc(true)
    }
    setCurrentPage(1) // Reset to first page when sorting changes
  }

  // Use knowledgeBases directly since server-side pagination handles filtering
  const filteredKnowledgeBases = knowledgeBases

  const getStatusColor = (kb: KnowledgeBase) => {
    // 由于API没有明确的status字段，我们基于其他字段判断状态
    if (kb.doc_num > 0) {
      return 'text-green-600 bg-green-100'
    } else if (kb.permission === 'me') {
      return 'text-blue-600 bg-blue-100'
    } else {
      return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (kb: KnowledgeBase) => {
    if (kb.doc_num > 0) {
      return '有内容'
    } else if (kb.permission === 'me') {
      return '空知识库'
    } else {
      return '未知'
    }
  }

  // 移除本地的formatSize函数，使用utils中的formatBytes

  const getLanguages = () => {
    const languages = new Set(knowledgeBases.map(kb => kb.language).filter(Boolean))
    return Array.from(languages)
  }

  const getPermissions = () => {
    const permissions = new Set(knowledgeBases.map(kb => kb.permission).filter(Boolean))
    return Array.from(permissions)
  }

  // 新的筛选器选项获取函数
  const getPermissionOptions = () => {
    const allPermissions = knowledgeBases.map(kb => kb.permission).filter(Boolean)
    const uniquePermissions = [...new Set(allPermissions)]
    return uniquePermissions.map(p => ({ value: p, label: p === 'me' ? '我的' : p === 'team' ? '团队' : p }))
  }

  const getLanguageOptions = () => {
    const allLanguages = knowledgeBases.map(kb => kb.language).filter(Boolean) as string[]
    const uniqueLanguages = [...new Set(allLanguages)]
    return uniqueLanguages.map(l => ({ value: l, label: l }))
  }

  const getParserOptions = () => {
    const allParsers = knowledgeBases.map(kb => kb.parser_id).filter(Boolean)
    const uniqueParsers = [...new Set(allParsers)]
    return uniqueParsers.map(p => ({ value: p, label: p }))
  }

  const getEmbeddingOptions = () => {
    const allEmbeddings = knowledgeBases.map(kb => kb.embd_id).filter(Boolean)
    const uniqueEmbeddings = [...new Set(allEmbeddings)]
    return uniqueEmbeddings.map(e => ({ value: e, label: e }))
  }

  const getDocNumRangeOptions = () => [
    { value: '0', label: '0 个文档' },
    { value: '1-5', label: '1-5 个文档' },
    { value: '6-20', label: '6-20 个文档' },
    { value: '21+', label: '21+ 个文档' }
  ]

  const getTimeRangeOptions = () => [
    { value: 'all', label: '全部时间' },
    { value: 'today', label: '今天' },
    { value: 'week', label: '最近一周' },
    { value: 'month', label: '最近一月' },
    { value: 'quarter', label: '最近三月' }
  ]

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = () => {
    return (
      filters.permissions.length > 0 ||
      filters.languages.length > 0 ||
      filters.parser_ids.length > 0 ||
      filters.embd_ids.length > 0 ||
      filters.doc_num_range.length > 0 ||
      filters.time_range !== 'all' ||
      searchQuery.trim() !== ''
    )
  }

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setFilters({
      permissions: [],
      languages: [],
      parser_ids: [],
      embd_ids: [],
      doc_num_range: [],
      time_range: 'all'
    })
    setSearchQuery('')
  }

  const formatTime = (timestamp: number) => {
    switch (timeFormat) {
      case 'detailed':
        return formatTimestampDetailed(timestamp)
      case 'compact':
        return formatTimestampCompact(timestamp)
      case 'relative':
        return formatRelativeTime(timestamp)
      default:
        return formatTimestamp(timestamp)
    }
  }

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">知识库总数</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="h-5 w-5 text-green-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">总文档数</p>
            <p className="text-2xl font-bold text-gray-900">
              {knowledgeBases.reduce((sum, kb) => sum + (kb.doc_num || 0), 0)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Layers className="h-5 w-5 text-purple-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">总块数</p>
            <p className="text-2xl font-bold text-gray-900">
              {knowledgeBases.reduce((sum, kb) => sum + (kb.chunk_num || 0), 0)}
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Target className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">总Token</p>
            <p className="text-2xl font-bold text-gray-900">
              {knowledgeBases.reduce((sum, kb) => sum + (kb.token_num || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderFilters = () => (
    showFilters && (
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
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* 权限筛选 */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <div className="p-1 bg-green-100 rounded">
                <Users className="h-3 w-3 text-green-600" />
              </div>
              <span>权限</span>
            </label>
            <div className="space-y-2">
              {getPermissionOptions().map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.permissions?.includes(option.value) || false}
                    onChange={(e) => {
                      const newPermissions = e.target.checked
                        ? [...(filters.permissions || []), option.value]
                        : (filters.permissions || []).filter(p => p !== option.value)
                      setFilters({
                        ...filters,
                        permissions: newPermissions
                      })
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 语言筛选 */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <div className="p-1 bg-purple-100 rounded">
                <Globe className="h-3 w-3 text-purple-600" />
              </div>
              <span>语言</span>
            </label>
            <div className="space-y-2">
              {getLanguageOptions().map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.languages?.includes(option.value) || false}
                    onChange={(e) => {
                      const newLanguages = e.target.checked
                        ? [...(filters.languages || []), option.value]
                        : (filters.languages || []).filter(l => l !== option.value)
                      setFilters({
                        ...filters,
                        languages: newLanguages
                      })
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 解析器筛选 */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <div className="p-1 bg-orange-100 rounded">
                <Zap className="h-3 w-3 text-orange-600" />
              </div>
              <span>解析器</span>
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {getParserOptions().map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.parser_ids?.includes(option.value) || false}
                    onChange={(e) => {
                      const newParserIds = e.target.checked
                        ? [...(filters.parser_ids || []), option.value]
                        : (filters.parser_ids || []).filter(p => p !== option.value)
                      setFilters({
                        ...filters,
                        parser_ids: newParserIds
                      })
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 嵌入模型筛选 */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <div className="p-1 bg-pink-100 rounded">
                <Brain className="h-3 w-3 text-pink-600" />
              </div>
              <span>嵌入模型</span>
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {getEmbeddingOptions().map(option => (
                <label key={option.value} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.embd_ids?.includes(option.value) || false}
                    onChange={(e) => {
                      const newEmbdIds = e.target.checked
                        ? [...(filters.embd_ids || []), option.value]
                        : (filters.embd_ids || []).filter(e => e !== option.value)
                      setFilters({
                        ...filters,
                        embd_ids: newEmbdIds
                      })
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 时间范围筛选 */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <div className="p-1 bg-yellow-100 rounded">
                <Clock className="h-3 w-3 text-yellow-600" />
              </div>
              <span>时间范围</span>
            </label>
            <div className="space-y-2">
              <CustomSelect
                options={getTimeRangeOptions()}
                value={filters.time_range}
                onChange={(value) => {
                  setFilters({
                    ...filters,
                    time_range: value
                  })
                }}
              />
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
              {searchQuery.trim() && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  关键词: {searchQuery}
                </span>
              )}
              {filters.permissions?.map(permission => (
                <span key={permission} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  权限: {permission}
                </span>
              ))}
              {filters.languages?.map(language => (
                <span key={language} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  语言: {language}
                </span>
              ))}
              {filters.parser_ids?.map(parser => (
                <span key={parser} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  解析器: {parser}
                </span>
              ))}
              {filters.embd_ids?.map(embd => (
                <span key={embd} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                  嵌入模型: {embd}
                </span>
              ))}
              {filters.time_range !== 'all' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  时间: {getTimeRangeOptions().find(opt => opt.value === filters.time_range)?.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredKnowledgeBases.map((kb) => (
        <Card 
          key={kb.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => handleView(kb.id)}
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3 flex-1">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={selectedBases.includes(kb.id)}
                  onChange={(e) => {
                    e.stopPropagation() // 防止事件冒泡
                    if (e.target.checked) {
                      setSelectedBases([...selectedBases, kb.id])
                    } else {
                      setSelectedBases(selectedBases.filter(id => id !== kb.id))
                    }
                  }}
                  onClick={(e) => e.stopPropagation()} // 防止点击事件冒泡
                />
                <Avatar 
                  src={kb.avatar}
                  alt={kb.name}
                  size="lg"
                  fallback={<Database className="h-5 w-5" />}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {kb.name}
                  </h3>
                  <span className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    getStatusColor(kb)
                  )}>
                    {getStatusText(kb)}
                  </span>
                </div>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Dropdown
                  trigger={
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                >
                  <DropdownItem
                    icon={<Settings className="h-4 w-4" />}
                    onClick={() => setEditingKnowledgeBase(kb)}
                  >
                    设置
                  </DropdownItem>
                  <DropdownItem
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(kb.id)}
                    danger
                  >
                    删除
                  </DropdownItem>
                </Dropdown>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4 line-clamp-2">
              {kb.description || '暂无描述'}
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                {kb.doc_num || 0} 文档
              </div>
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-1" />
                {kb.chunk_num || 0} 块
              </div>
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-1" />
                {(kb.token_num || 0).toLocaleString()} Token
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(kb.update_time)}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )

  const renderTableView = () => (
    <Card>
      <Table
        columns={[
          {
            key: 'select',
            title: (
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedBases.length === filteredKnowledgeBases.length && filteredKnowledgeBases.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedBases(filteredKnowledgeBases.map(kb => kb.id))
                  } else {
                    setSelectedBases([])
                  }
                }}
              />
            ),
            render: (_, record: KnowledgeBase) => (
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={selectedBases.includes(record.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedBases([...selectedBases, record.id])
                  } else {
                    setSelectedBases(selectedBases.filter(id => id !== record.id))
                  }
                }}
              />
            )
          },
          {
            key: 'name',
            title: (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('name')}
                className="p-0 h-auto font-medium hover:bg-transparent"
              >
                名称
                {sortBy === 'name' && (
                  sortDesc ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />
                )}
              </Button>
            ),
            render: (value: string, record: KnowledgeBase) => (
              <div className="flex items-center space-x-3">
                <Avatar 
                  src={record.avatar}
                  alt={record.name}
                  size="md"
                  fallback={<Database className="h-4 w-4" />}
                />
                <div>
                  <div className="font-medium text-gray-900">{value}</div>
                  <div className="text-sm text-gray-500 max-w-xs truncate">{record.description}</div>
                </div>
              </div>
            )
          },
          {
            key: 'status',
            title: '状态',
            render: (_, record: KnowledgeBase) => (
              <span className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                getStatusColor(record)
              )}>
                {getStatusText(record)}
              </span>
            )
          },
          {
            key: 'doc_num',
            title: (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('doc_num')}
                className="p-0 h-auto font-medium hover:bg-transparent"
              >
                文档数
                {sortBy === 'doc_num' && (
                  sortDesc ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />
                )}
              </Button>
            ),
            render: (value: number) => (
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-1 text-gray-400" />
                {value || 0}
              </div>
            )
          },
          {
            key: 'chunk_num',
            title: '块数',
            render: (value: number) => (
              <div className="flex items-center">
                <Layers className="h-4 w-4 mr-1 text-gray-400" />
                {value || 0}
              </div>
            )
          },
          {
            key: 'token_num',
            title: 'Token数',
            render: (value: number) => (
              <div className="text-sm text-gray-600">
                {(value || 0).toLocaleString()}
              </div>
            )
          },
          {
            key: 'update_time',
            title: (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('update_time')}
                className="p-0 h-auto font-medium hover:bg-transparent"
              >
                更新时间
                {sortBy === 'update_time' && (
                  sortDesc ? <SortDesc className="ml-1 h-3 w-3" /> : <SortAsc className="ml-1 h-3 w-3" />
                )}
              </Button>
            ),
            render: (value: number) => (
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {formatTime(value)}
              </div>
            )
          },
          {
            key: 'actions',
            title: '操作',
            render: (_, record: KnowledgeBase) => (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleView(record.id)}
                  title="查看详情"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Dropdown
                  trigger={
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  }
                >
                  <DropdownItem
                    icon={<Settings className="h-4 w-4" />}
                    onClick={() => setEditingKnowledgeBase(record)}
                  >
                    设置
                  </DropdownItem>
                  <DropdownItem
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(record.id)}
                    danger
                  >
                    删除
                  </DropdownItem>
                </Dropdown>
              </div>
            )
          }
        ]}
        data={filteredKnowledgeBases}
        loading={isLoading}
      />
    </Card>
  )

  return (
    <div className="p-6">
      {/* 页面头部 */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">知识库管理</h1>
            <p className="text-gray-600 mt-1">
              管理您的知识库，上传文档，配置检索参数
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedBases.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除 ({selectedBases.length})
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate(`${ROUTES.KNOWLEDGE}/import`)}>
              <Upload className="h-4 w-4 mr-2" />
              导入
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建知识库
            </Button>
          </div>
        </div>

        {/* 统计卡片 */}
        {renderStatsCards()}

        {/* 搜索和筛选 */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 max-w-md">
            <Input
              type="search"
              placeholder="搜索知识库..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          
          <div className="flex items-center space-x-2">
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
                  {(filters.permissions?.length || 0) + 
                   (filters.languages?.length || 0) + 
                   (filters.parser_ids?.length || 0) + 
                   (filters.embd_ids?.length || 0) + 
                   (filters.doc_num_range?.length || 0) + 
                   (filters.time_range !== 'all' ? 1 : 0) + 
                   (searchQuery.trim() ? 1 : 0)}
                </span>
              )}
            </Button>

            {/* 时间格式选择器 */}
            <CustomSelect
              options={[
                { value: 'detailed', label: '详细时间' },
                { value: 'compact', label: '简洁时间' },
                { value: 'relative', label: '相对时间' }
              ]}
              value={timeFormat}
              onChange={(value) => setTimeFormat(value as 'detailed' | 'compact' | 'relative')}
              size="sm"
              className="min-w-[100px]"
            />
            
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 筛选面板 */}
        {renderFilters()}
      </div>

      {/* 内容区域 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loading variant="spinner" size="lg" />
        </div>
      ) : filteredKnowledgeBases.length === 0 ? (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || showFilters ? '未找到匹配的知识库' : '还没有知识库'}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || showFilters? '尝试调整搜索条件或筛选器' : '创建您的第一个知识库开始使用'}
          </p>
          {!searchQuery && !showFilters && (
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建知识库
            </Button>
          )}
        </div>
      ) : (
        <div>
          {viewMode === 'grid' ? renderGridView() : renderTableView()}
          
          {/* 分页控件 */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共 {total} 项{selectedBases.length > 0 && ` • 已选择 ${selectedBases.length} 个`}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* 每页显示选择器 */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>每页显示</span>
                  <CustomSelect
                    options={[
                      { value: '6', label: '6' },
                      { value: '12', label: '12' },
                      { value: '24', label: '24' },
                      { value: '48', label: '48' }
                    ]}
                    value={pageSize.toString()}
                    onChange={(value) => handlePageSizeChange(Number(value))}
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
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一页
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let pageNum = i + 1
                    
                    // Show first page, last page, current page and surrounding pages
                    if (totalPages > 7) {
                      if (currentPage <= 4) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 3) {
                        pageNum = totalPages - 6 + i
                      } else {
                        pageNum = currentPage - 3 + i
                      }
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="min-w-[40px]"
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
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRight className="h-4 w-4" />
                </Button>
                </div>
              </div>
            </div>
          )}

          {/* 分页信息 */}
          {filteredKnowledgeBases.length > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>按 {
                  sortBy === 'create_time' ? '创建时间' :
                  sortBy === 'update_time' ? '更新时间' :
                  sortBy === 'name' ? '名称' :
                  sortBy === 'doc_num' ? '文档数' : '未知字段'
                } {sortDesc ? '降序' : '升序'} 排列</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Quick Edit Modal */}
      {editingKnowledgeBase && (
        <QuickEditModal
          isOpen={true}
          onClose={() => setEditingKnowledgeBase(null)}
          knowledgeBase={editingKnowledgeBase}
        />
      )}
    </div>
  )
}