import React from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Database, 
  FileText, 
  Clock, 
  Users,
  Trash2,
  Filter,
  Settings,
  Grid3X3,
  List as ListIcon,
  Layers,
  Target,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  X,
  Globe,
  Zap,
  Brain,
  CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loading } from '@/components/ui/loading'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dropdown, DropdownItem } from '@/components/ui/dropdown'
import { QuickEditModal, KnowledgeListView } from '@/components/knowledge'
import { CreateKnowledgeModal } from './components/CreateKnowledgeModal'
import { PageSizeSelector } from '@/components/ui/page-size-selector'
import { CustomSelect } from '@/components/ui/custom-select'
import { Checkbox } from '@/components/ui/checkbox'
import { ViewToggle } from '@/components/ui/view-toggle'
import { useKnowledgeStore } from '@/stores/knowledge'
import { useUIStore } from '@/stores/ui'
import { cn, formatTimestamp, formatTimestampDetailed, formatTimestampCompact, formatRelativeTime } from '@/lib/utils'
import { ROUTES } from '@/constants'
import { getAvatarGradient } from '@/components/ui/resource-list'
import type { KnowledgeBase } from '@/types/api'

interface FilterState {
  permissions: string[]
  languages: string[]
  parser_ids: string[]
  embd_ids: string[]
  doc_num_range: string[]
  time_range: string
}

// 知识库卡片组件 - 参考 MCP 服务器卡片的悬停交互效果
interface KnowledgeCardProps {
  kb: KnowledgeBase
  selected: boolean
  onSelect: (checked: boolean) => void
  onClick: () => void
  onSettings: () => void
  onDelete: () => void
  formatTime: (timestamp: number) => string
  getStatusColor: (kb: KnowledgeBase) => string
  getStatusText: (kb: KnowledgeBase) => string
}

const KnowledgeCard: React.FC<KnowledgeCardProps> = ({
  kb,
  selected,
  onSelect,
  onClick,
  onSettings,
  onDelete,
  formatTime,
  getStatusColor,
  getStatusText,
}) => {
  const [isHovered, setIsHovered] = React.useState(false)
  const gradient = getAvatarGradient(kb.name)

  return (
    <div
      className={cn(
        'group relative rounded-2xl border transition-all duration-300 cursor-pointer',
        'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        isHovered && 'ring-2 ring-blue-500/20',
        selected && 'ring-2 ring-text-accent'
      )}
      style={{
        backgroundColor: 'var(--color-components-card-bg)',
        borderColor: isHovered ? 'var(--color-state-focus)' : 'var(--color-components-card-border)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              onClick={(e) => e.stopPropagation()}
            />
            {kb.avatar ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={kb.avatar} alt={kb.name} />
                <AvatarFallback><Database className="h-5 w-5" /></AvatarFallback>
              </Avatar>
            ) : (
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-gradient-to-br shadow-sm',
                  gradient
                )}
              >
                <span className="text-white font-semibold text-lg">
                  {kb.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                {kb.name}
              </h3>
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
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
                onClick={onSettings}
              >
                设置
              </DropdownItem>
              <DropdownItem
                icon={<Trash2 className="h-4 w-4" />}
                onClick={onDelete}
                danger
              >
                删除
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {kb.description ? (
          <p className="text-sm mb-4 line-clamp-2 text-text-secondary">
            {kb.description}
          </p>
        ) : null}

        <div className={cn('grid grid-cols-2 gap-3 text-sm text-text-tertiary', !kb.description && 'mt-4')}>
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-1.5" />
            {kb.doc_num || 0} 文档
          </div>
          <div className="flex items-center">
            <Layers className="h-4 w-4 mr-1.5" />
            {kb.chunk_num || 0} 块
          </div>
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-1.5" />
            {(kb.token_num || 0).toLocaleString()} Token
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1.5" />
            {formatTime(kb.update_time)}
          </div>
        </div>
      </div>
    </div>
  )
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
  const [filterPopoverOpen, setFilterPopoverOpen] = React.useState(false)
  const [timeFormat, setTimeFormat] = React.useState<'detailed' | 'compact' | 'relative'>('detailed')
  const [editingKnowledgeBase, setEditingKnowledgeBase] = React.useState<KnowledgeBase | null>(null)
  const [showCreateModal, setShowCreateModal] = React.useState(false)
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

  const backendFilterParams = React.useMemo(() => ({
    permissions: filters.permissions.length > 0 ? filters.permissions : undefined,
    languages: filters.languages.length > 0 ? filters.languages : undefined,
    parser_ids: filters.parser_ids.length > 0 ? filters.parser_ids : undefined,
    embd_ids: filters.embd_ids.length > 0 ? filters.embd_ids : undefined,
  }), [filters])

  React.useEffect(() => {
    loadKnowledgeBases({
      page: currentPage,
      page_size: pageSize,
      orderby: sortBy,
      desc: sortDesc,
      keywords: searchQuery,
      filter_params: backendFilterParams,
    })
  }, [loadKnowledgeBases, currentPage, pageSize, sortBy, sortDesc, searchQuery, backendFilterParams])

  // Reset to first page when search query or filters change
  React.useEffect(() => {
    setCurrentPage((prevPage) => (prevPage === 1 ? prevPage : 1))
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
    setShowCreateModal(true)
  }

  const handleCreateSuccess = (kbId: string) => {
    // 刷新列表
    loadKnowledgeBases({
      page: currentPage,
      page_size: pageSize,
      orderby: sortBy,
      desc: sortDesc,
      keywords: searchQuery,
      filter_params: backendFilterParams,
    })
    // 导航到新创建的知识库
    navigate(`${ROUTES.KNOWLEDGE}/${kbId}`)
  }

  const handleView = (id: string) => {
    navigate(`${ROUTES.KNOWLEDGE}/${id}`)
  }

  const _handleEdit = (id: string) => {
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

  const filteredKnowledgeBases = React.useMemo(() => {
    const now = Date.now()
    return knowledgeBases.filter((kb) => {
      // 前端兜底：后端不支持的筛选条件继续在前端执行（以及后端失效时兜底）
      if (filters.permissions.length > 0 && !filters.permissions.includes(kb.permission)) {
        return false
      }
      if (filters.languages.length > 0) {
        if (!kb.language || !filters.languages.includes(kb.language)) {
          return false
        }
      }
      if (filters.parser_ids.length > 0 && !filters.parser_ids.includes(kb.parser_id)) {
        return false
      }
      if (filters.embd_ids.length > 0 && !filters.embd_ids.includes(kb.embd_id)) {
        return false
      }

      if (filters.doc_num_range.length > 0) {
        const matchesDocRange = filters.doc_num_range.some((range) => {
          const docNum = kb.doc_num || 0
          if (range === '0') return docNum === 0
          if (range === '1-5') return docNum >= 1 && docNum <= 5
          if (range === '6-20') return docNum >= 6 && docNum <= 20
          if (range === '21+') return docNum >= 21
          return true
        })
        if (!matchesDocRange) return false
      }

      if (filters.time_range !== 'all') {
        const updatedAt =
          kb.update_time < 1_000_000_000_000
            ? kb.update_time * 1000
            : kb.update_time
        const diff = now - updatedAt
        const day = 24 * 60 * 60 * 1000
        if (filters.time_range === 'today' && diff > day) return false
        if (filters.time_range === 'week' && diff > 7 * day) return false
        if (filters.time_range === 'month' && diff > 30 * day) return false
        if (filters.time_range === 'quarter' && diff > 90 * day) return false
      }

      return true
    })
  }, [knowledgeBases, filters])

  const getStatusColor = (kb: KnowledgeBase) => {
    // 由于API没有明确的status字段，我们基于其他字段判断状态
    if (kb.doc_num > 0) {
      return 'text-text-success bg-[var(--color-state-success-10)]'
    } else if (kb.permission === 'me') {
      return 'text-text-accent bg-[var(--color-state-info-10)]'
    } else {
      return 'text-text-secondary bg-background-subtle'
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

  const _getLanguages = () => {
    const languages = new Set(knowledgeBases.map(kb => kb.language).filter(Boolean))
    return Array.from(languages)
  }

  const _getPermissions = () => {
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

  const _getDocNumRangeOptions = () => [
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

  const getActiveFilterCount = () => {
    return (
      (filters.permissions?.length || 0) +
      (filters.languages?.length || 0) +
      (filters.parser_ids?.length || 0) +
      (filters.embd_ids?.length || 0) +
      (filters.doc_num_range?.length || 0) +
      (filters.time_range !== 'all' ? 1 : 0) +
      (searchQuery.trim() ? 1 : 0)
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

  // 统计卡片悬浮状态
  const [hoveredCardIndex, setHoveredCardIndex] = React.useState<number | null>(null)

  // 统计卡片数据配置 - 使用语义化设计令牌
  const statsCards = [
    {
      title: '知识库总数',
      value: total,
      icon: Database,
      // 使用 components-stats-card-* 语义化令牌
      gradient: 'var(--color-components-stats-card-blue-bg)',
      iconBg: 'var(--color-components-stats-card-blue-icon-bg)',
      iconColor: 'var(--color-components-stats-card-blue-icon-text)',
      shadow: 'var(--color-components-stats-card-blue-shadow)',
      borderHover: 'var(--color-components-stats-card-blue-border-hover)',
    },
    {
      title: '总文档数',
      value: knowledgeBases.reduce((sum, kb) => sum + (kb.doc_num || 0), 0),
      icon: FileText,
      gradient: 'var(--color-components-stats-card-green-bg)',
      iconBg: 'var(--color-components-stats-card-green-icon-bg)',
      iconColor: 'var(--color-components-stats-card-green-icon-text)',
      shadow: 'var(--color-components-stats-card-green-shadow)',
      borderHover: 'var(--color-components-stats-card-green-border-hover)',
    },
    {
      title: '总块数',
      value: knowledgeBases.reduce((sum, kb) => sum + (kb.chunk_num || 0), 0),
      icon: Layers,
      gradient: 'var(--color-components-stats-card-purple-bg)',
      iconBg: 'var(--color-components-stats-card-purple-icon-bg)',
      iconColor: 'var(--color-components-stats-card-purple-icon-text)',
      shadow: 'var(--color-components-stats-card-purple-shadow)',
      borderHover: 'var(--color-components-stats-card-purple-border-hover)',
    },
    {
      title: '总Token',
      value: knowledgeBases.reduce((sum, kb) => sum + (kb.token_num || 0), 0),
      icon: Target,
      gradient: 'var(--color-components-stats-card-orange-bg)',
      iconBg: 'var(--color-components-stats-card-orange-icon-bg)',
      iconColor: 'var(--color-components-stats-card-orange-icon-text)',
      shadow: 'var(--color-components-stats-card-orange-shadow)',
      borderHover: 'var(--color-components-stats-card-orange-border-hover)',
    },
  ]

  const renderStatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {statsCards.map((stat, index) => {
        const IconComponent = stat.icon
        const isHovered = hoveredCardIndex === index
        return (
          <div
            key={stat.title}
            className={cn(
              'relative overflow-hidden rounded-2xl p-5 transition-all duration-300',
              'hover:-translate-y-1',
              'border'
            )}
            style={{
              backgroundColor: 'var(--color-components-card-bg)',
              borderColor: isHovered ? stat.borderHover : 'var(--color-components-card-border)',
              boxShadow: isHovered ? stat.shadow : 'none',
              animationDelay: `${index * 50}ms`,
            }}
            onMouseEnter={() => setHoveredCardIndex(index)}
            onMouseLeave={() => setHoveredCardIndex(null)}
          >
            {/* 背景渐变装饰 - 使用设计令牌中的渐变 */}
            <div
              className={cn(
                'absolute -right-4 -top-4 w-28 h-28 rounded-full blur-2xl transition-all duration-300',
                isHovered ? 'opacity-80 scale-110' : 'opacity-50'
              )}
              style={{ background: stat.gradient }}
            />
            
            <div className="relative flex items-center gap-4">
              {/* 图标 - 使用渐变背景令牌 */}
              <div
                className={cn(
                  'flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300',
                  isHovered && 'scale-110'
                )}
                style={{ background: stat.iconBg }}
              >
                <IconComponent className="h-6 w-6" style={{ color: stat.iconColor }} />
              </div>

              {/* 文本 */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {stat.title}
                </p>
                <p
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  const renderFilters = () => (
      <div className="bg-background-subtle rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md" style={{ backgroundColor: 'var(--color-state-info-subtle)' }}>
              <Filter className="h-4 w-4" style={{ color: 'var(--color-state-info)' }} />
            </div>
            <h3 className="text-sm font-medium text-text-primary">筛选条件</h3>
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-text-tertiary hover:text-text-secondary"
              >
                <X className="h-3 w-3 mr-1" />
                清除筛选
              </Button>
            )}
            <span className="text-xs text-text-tertiary">
              筛选条件会自动应用
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* 权限筛选 */}
          <div className="rounded-lg p-3" style={{
            backgroundColor: 'var(--color-background-surface)',
            border: '1px solid var(--color-border-default)'
          }}>
            <label className="flex items-center space-x-2 text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              <div className="p-1 rounded" style={{ backgroundColor: 'var(--color-state-success-subtle)' }}>
                <Users className="h-3 w-3" style={{ color: 'var(--color-state-success)' }} />
              </div>
              <span>权限</span>
            </label>
            <div className="space-y-2">
              {getPermissionOptions().map(option => (
                <label 
                  key={option.value} 
                  className="flex items-center gap-2 py-1 px-1 -mx-1 rounded cursor-pointer hover:bg-[var(--color-state-hover)] transition-colors"
                  onClick={() => {
                    const checked = filters.permissions?.includes(option.value) || false
                    const newPermissions = !checked
                      ? [...(filters.permissions || []), option.value]
                      : (filters.permissions || []).filter(p => p !== option.value)
                    setFilters({
                      ...filters,
                      permissions: newPermissions
                    })
                  }}
                >
                  <Checkbox
                    checked={filters.permissions?.includes(option.value) || false}
                    onCheckedChange={(checked) => {
                      const newPermissions = checked
                        ? [...(filters.permissions || []), option.value]
                        : (filters.permissions || []).filter(p => p !== option.value)
                      setFilters({
                        ...filters,
                        permissions: newPermissions
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 语言筛选 */}
          <div className="rounded-lg p-3" style={{
            backgroundColor: 'var(--color-background-surface)',
            border: '1px solid var(--color-border-default)'
          }}>
            <label className="flex items-center space-x-2 text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              <div className="p-1 rounded" style={{ backgroundColor: 'var(--color-state-info-subtle)' }}>
                <Globe className="h-3 w-3" style={{ color: 'var(--color-state-info)' }} />
              </div>
              <span>语言</span>
            </label>
            <div className="space-y-2">
              {getLanguageOptions().map(option => (
                <label 
                  key={option.value} 
                  className="flex items-center gap-2 py-1 px-1 -mx-1 rounded cursor-pointer hover:bg-[var(--color-state-hover)] transition-colors"
                  onClick={() => {
                    const checked = filters.languages?.includes(option.value) || false
                    const newLanguages = !checked
                      ? [...(filters.languages || []), option.value]
                      : (filters.languages || []).filter(l => l !== option.value)
                    setFilters({
                      ...filters,
                      languages: newLanguages
                    })
                  }}
                >
                  <Checkbox
                    checked={filters.languages?.includes(option.value) || false}
                    onCheckedChange={(checked) => {
                      const newLanguages = checked
                        ? [...(filters.languages || []), option.value]
                        : (filters.languages || []).filter(l => l !== option.value)
                      setFilters({
                        ...filters,
                        languages: newLanguages
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 解析器筛选 */}
          <div className="rounded-lg p-3" style={{
            backgroundColor: 'var(--color-background-surface)',
            border: '1px solid var(--color-border-default)'
          }}>
            <label className="flex items-center space-x-2 text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              <div className="p-1 rounded" style={{ backgroundColor: 'var(--color-state-warning-subtle)' }}>
                <Zap className="h-3 w-3" style={{ color: 'var(--color-state-warning)' }} />
              </div>
              <span>解析器</span>
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
              {getParserOptions().map(option => (
                <label 
                  key={option.value} 
                  className="flex items-center gap-2 py-1 px-1 -mx-1 rounded cursor-pointer hover:bg-[var(--color-state-hover)] transition-colors"
                  onClick={() => {
                    const checked = filters.parser_ids?.includes(option.value) || false
                    const newParserIds = !checked
                      ? [...(filters.parser_ids || []), option.value]
                      : (filters.parser_ids || []).filter(p => p !== option.value)
                    setFilters({
                      ...filters,
                      parser_ids: newParserIds
                    })
                  }}
                >
                  <Checkbox
                    checked={filters.parser_ids?.includes(option.value) || false}
                    onCheckedChange={(checked) => {
                      const newParserIds = checked
                        ? [...(filters.parser_ids || []), option.value]
                        : (filters.parser_ids || []).filter(p => p !== option.value)
                      setFilters({
                        ...filters,
                        parser_ids: newParserIds
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 嵌入模型筛选 */}
          <div className="rounded-lg p-3" style={{
            backgroundColor: 'var(--color-background-surface)',
            border: '1px solid var(--color-border-default)'
          }}>
            <label className="flex items-center space-x-2 text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              <div className="p-1 rounded" style={{ backgroundColor: 'var(--color-state-info-subtle)' }}>
                <Brain className="h-3 w-3" style={{ color: 'var(--color-state-info)' }} />
              </div>
              <span>嵌入模型</span>
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
              {getEmbeddingOptions().map(option => (
                <label 
                  key={option.value} 
                  className="flex items-center gap-2 py-1 px-1 -mx-1 rounded cursor-pointer hover:bg-[var(--color-state-hover)] transition-colors"
                  onClick={() => {
                    const checked = filters.embd_ids?.includes(option.value) || false
                    const newEmbdIds = !checked
                      ? [...(filters.embd_ids || []), option.value]
                      : (filters.embd_ids || []).filter(e => e !== option.value)
                    setFilters({
                      ...filters,
                      embd_ids: newEmbdIds
                    })
                  }}
                >
                  <Checkbox
                    checked={filters.embd_ids?.includes(option.value) || false}
                    onCheckedChange={(checked) => {
                      const newEmbdIds = checked
                        ? [...(filters.embd_ids || []), option.value]
                        : (filters.embd_ids || []).filter(e => e !== option.value)
                      setFilters({
                        ...filters,
                        embd_ids: newEmbdIds
                      })
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  />
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 时间范围筛选 */}
          <div className="rounded-lg p-3" style={{
            backgroundColor: 'var(--color-background-surface)',
            border: '1px solid var(--color-border-default)'
          }}>
            <label className="flex items-center space-x-2 text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
              <div className="p-1 rounded" style={{ backgroundColor: 'var(--color-state-warning-subtle)' }}>
                <Clock className="h-3 w-3" style={{ color: 'var(--color-state-warning)' }} />
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
          <div 
            className="mt-4 pt-4 border-t rounded-lg p-3"
            style={{
              borderColor: 'var(--color-border-default)',
              backgroundColor: 'var(--color-background-surface)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1 rounded" style={{ backgroundColor: 'var(--color-state-info-subtle)' }}>
                <CheckCircle className="h-3 w-3" style={{ color: 'var(--color-state-info)' }} />
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>当前筛选条件</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {searchQuery.trim() && (
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-state-info-subtle)', color: 'var(--color-state-info)' }}
                >
                  关键词: {searchQuery}
                </span>
              )}
              {filters.permissions?.map(permission => (
                <span 
                  key={permission} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-state-success-subtle)', color: 'var(--color-state-success)' }}
                >
                  权限: {permission}
                </span>
              ))}
              {filters.languages?.map(language => (
                <span 
                  key={language} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-state-info-subtle)', color: 'var(--color-state-info)' }}
                >
                  语言: {language}
                </span>
              ))}
              {filters.parser_ids?.map(parser => (
                <span 
                  key={parser} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-state-warning-subtle)', color: 'var(--color-state-warning)' }}
                >
                  解析器: {parser}
                </span>
              ))}
              {filters.embd_ids?.map(embd => (
                <span 
                  key={embd} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-state-error-subtle)', color: 'var(--color-state-error)' }}
                >
                  嵌入模型: {embd}
                </span>
              ))}
              {filters.time_range !== 'all' && (
                <span 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: 'var(--color-state-warning-subtle)', color: 'var(--color-state-warning)' }}
                >
                  时间: {getTimeRangeOptions().find(opt => opt.value === filters.time_range)?.label}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filteredKnowledgeBases.map((kb) => (
        <KnowledgeCard
          key={kb.id}
          kb={kb}
          selected={selectedBases.includes(kb.id)}
          onSelect={(checked) => {
            if (checked) {
              setSelectedBases([...selectedBases, kb.id])
            } else {
              setSelectedBases(selectedBases.filter(id => id !== kb.id))
            }
          }}
          onClick={() => handleView(kb.id)}
          onSettings={() => setEditingKnowledgeBase(kb)}
          onDelete={() => handleDelete(kb.id)}
          formatTime={formatTime}
          getStatusColor={getStatusColor}
          getStatusText={getStatusText}
        />
      ))}
    </div>
  )

  const renderTableView = () => (
    <KnowledgeListView
      data={filteredKnowledgeBases}
      onEdit={setEditingKnowledgeBase}
      onDelete={(kb) => handleDelete(kb.id)}
      selectedIds={selectedBases}
      onSelect={(id) => {
        if (selectedBases.includes(id)) {
          setSelectedBases(selectedBases.filter((x) => x !== id))
        } else {
          setSelectedBases([...selectedBases, id])
        }
      }}
      onSelectAll={() => {
        if (selectedBases.length === filteredKnowledgeBases.length) {
          setSelectedBases([])
        } else {
          setSelectedBases(filteredKnowledgeBases.map((kb) => kb.id))
        }
      }}
      isLoading={isLoading}
      timeFormat={timeFormat}
      getStatusColor={getStatusColor}
      getStatusText={getStatusText}
    />
  )

  return (
    <div className="h-full flex flex-col p-6">
      {/* 页面头部 */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">知识库管理</h1>
          <p className="text-sm text-text-secondary mt-1">
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
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              创建知识库
            </Button>
          </div>
      </div>

      {/* 统计卡片 */}
      <div className="mb-4">
        {renderStatsCards()}
      </div>

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
            <Popover open={filterPopoverOpen} onOpenChange={setFilterPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9"
                  style={
                    hasActiveFilters()
                      ? {
                          backgroundColor: 'var(--color-state-focus-10)',
                          color: 'var(--color-state-focus)',
                          borderColor: 'var(--color-state-focus)',
                        }
                      : undefined
                  }
                >
                  <Filter className="h-4 w-4 mr-2" />
                  筛选
                  {hasActiveFilters() && (
                    <span
                      className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full"
                      style={{
                        backgroundColor: 'var(--color-state-focus)',
                        color: '#ffffff',
                      }}
                    >
                      {getActiveFilterCount()}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[980px] p-0" align="end">
                {renderFilters()}
              </PopoverContent>
            </Popover>

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

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDesc((prev) => !prev)}
              className="h-9 px-2 flex items-center gap-1 text-xs"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span>{sortDesc ? '倒序' : '正序'}</span>
            </Button>
            
            <ViewToggle
              value={viewMode}
              onChange={setViewMode}
              size="md"
              options={[
                { value: 'grid', icon: <Grid3X3 />, label: '网格视图' },
                { value: 'table', icon: <ListIcon />, label: '表格视图' },
              ]}
            />
          </div>
        </div>

      {/* 内容区域 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loading variant="spinner" size="lg" />
        </div>
      ) : filteredKnowledgeBases.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Database className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>
              {searchQuery || hasActiveFilters() ? '未找到匹配的知识库' : '还没有知识库'}
            </h3>
            <p className="mb-4" style={{ color: 'var(--color-text-tertiary)' }}>
              {searchQuery || hasActiveFilters() ? '尝试调整搜索条件或筛选器' : '创建您的第一个知识库开始使用'}
            </p>
            {!searchQuery && !hasActiveFilters() && (
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                创建知识库
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 可滚动内容区域 - pt-1 pb-2 为悬停效果留出空间 */}
          <div className="flex-1 overflow-y-auto pt-1 pb-2 -mx-1 px-1">
            {viewMode === 'grid' ? renderGridView() : renderTableView()}
          </div>
          
          {/* 分页控件 - 固定在底部 */}
          <div className="mt-4 rounded-lg border shadow-sm" style={{
            borderColor: 'var(--color-components-card-border)',
            backgroundColor: 'var(--color-components-card-bg)'
          }}>
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="text-sm" style={{ color: 'var(--color-components-pagination-text)' }}>
                共 {total} 项{selectedBases.length > 0 && ` • 已选择 ${selectedBases.length} 个`}
              </div>
              
              <div className="flex items-center space-x-4">
              {/* 每页显示选择器 */}
              <PageSizeSelector
                pageSize={pageSize}
                onChange={(size) => handlePageSizeChange(size)}
                options={[6, 12, 24, 48]}
              />
              
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
                {Array.from({ length: Math.max(1, Math.min(7, totalPages)) }, (_, i) => {
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
                disabled={currentPage === totalPages || totalPages === 0}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
              </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Quick Edit Modal */}
      {editingKnowledgeBase && (
        <QuickEditModal
          isOpen={true}
          onClose={() => setEditingKnowledgeBase(null)}
          knowledgeBase={editingKnowledgeBase}
        />
      )}

      {/* Create Knowledge Modal */}
      <CreateKnowledgeModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
