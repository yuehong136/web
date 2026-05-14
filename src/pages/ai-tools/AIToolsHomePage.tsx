import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Star, Download, ChevronRight, Filter } from 'lucide-react'
import { Input } from '@/components/vendor/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/vendor/ui/select'
import { Segmented, SegmentedItem } from '@/components/vendor/ui/segmented'
import { Card, CardContent } from '@/components/vendor/ui/card'
import { Badge } from '@/components/vendor/ui/badge'
import { Button } from '@/components/vendor/ui/button'
import { Tag } from '@/components/vendor/ui/tag'
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/vendor/ui/tooltip'
import { Skeleton } from '@/components/ui/loading'
import { cn } from '@/lib/utils'

type ServiceType = 'all' | 'hosted' | 'local'
type SortKey = 'latest' | 'popular' | 'name'
type CategoryKey = 'all' | 'forms'

const DESKTOP_CATEGORIES = [
  { key: 'all', count: 1, disabled: false },
  { key: 'forms', count: 1, disabled: false },
  { key: 'data', count: 0, disabled: true },
  { key: 'ocr', count: 0, disabled: true },
  { key: 'writing', count: 0, disabled: true },
  { key: 'devops', count: 0, disabled: true },
] as const

export const AIToolsHomePage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  // UI state
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [serviceType, setServiceType] = React.useState<ServiceType>('all')
  const [sortBy, setSortBy] = React.useState<SortKey>('latest')
  const [selectedCategory, setSelectedCategory] =
    React.useState<CategoryKey>('all')
  const [showCategoriesDrawer, setShowCategoriesDrawer] = React.useState(false)

  // analytics stubs
  React.useEffect(() => {
    // tools_impression

    console.log('tools_impression', { page: 'ai-tools' })
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    // tools_search

    console.log('tools_search', { keyword: e.target.value })
  }

  const handleServiceTypeChange = (v: ServiceType) => {
    setServiceType(v)
    // tools_filter

    console.log('tools_filter', { serviceType: v })
  }

  const resetFilters = () => {
    setSearch('')
    setServiceType('all')
    setSortBy('latest')
    setSelectedCategory('all')
  }

  // Tool cards (static demo)
  const tools = [
    {
      id: 'auto-fill',
      title: t('tools.card.autoFillTitle', '自动填表'),
      description: t(
        'tools.card.autoFillDescription',
        '将结构化/半结构化数据快速映射至固定模板，实现批量高效填报，适配多种字段类型。',
      ),
      tags: [
        t('tools.card.fieldMapping', '字段映射'),
        t('tools.card.template', '模板'),
        t('tools.card.batchFill', '批量填充'),
      ],
      service: 'hosted' as const,
      stars: 4.8,
      downloads: '12.3k',
      category: 'forms' as const,
    },
  ]

  // visual-only filtering (does not affect the single card result)
  const filtered = tools.filter((t) => {
    const matchCategory =
      selectedCategory === 'all' || t.category === selectedCategory
    const matchSearch =
      !search ||
      [t.title, t.description, ...t.tags].some((x) =>
        x.toLowerCase().includes(search.toLowerCase()),
      )
    const matchService = serviceType === 'all' || t.service === serviceType
    return matchCategory && matchSearch && matchService
  })

  // render helpers
  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-components-card-border bg-components-card-bg p-6 shadow-components-card-shadow"
        >
          <Skeleton height="1.25rem" className="mb-4 w-2/3" />
          <Skeleton height="0.875rem" className="mb-2 w-full" />
          <Skeleton height="0.875rem" className="mb-4 w-5/6" />
          <div className="mb-4 flex gap-2">
            <Skeleton height="1.25rem" className="w-16 rounded-full" />
            <Skeleton height="1.25rem" className="w-14 rounded-full" />
            <Skeleton height="1.25rem" className="w-16 rounded-full" />
          </div>
          <Skeleton height="2.25rem" className="w-24" />
        </div>
      ))}
    </div>
  )

  const renderEmpty = () => (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border-subtle bg-components-empty-bg py-20 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-background-subtle text-text-muted">
        :)
      </div>
      <p className="mb-2 text-text-secondary">
        {t('tools.empty.title', '未找到匹配的工具')}
      </p>
      <p className="mb-4 text-sm text-text-tertiary">
        {t('tools.empty.description', '试试调整搜索关键词或清空筛选条件')}
      </p>
      <Button variant="outline" onClick={resetFilters}>
        {t('tools.empty.clear', '清空筛选')}
      </Button>
    </div>
  )

  const openTool = (id: string) => {
    // tool_open

    console.log('tool_open', { id })
    navigate(`/tools/${id}`)
  }

  return (
    <TooltipProvider>
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <span className="cursor-default hover:text-text-primary">
            {t('tools.breadcrumbHome', '首页')}
          </span>
          <ChevronRight className="h-4 w-4 text-components-breadcrumb-separator" />
          <span className="text-text-primary">
            {t('tools.title', '工具箱')}
          </span>
        </div>

        {/* Page title and quick filter (right aligned) */}
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">
            {t('tools.title', '工具箱')}
          </h1>
          <div className="hidden md:block">
            <Segmented
              value={serviceType}
              onValueChange={(v) => handleServiceTypeChange(v as ServiceType)}
            >
              <SegmentedItem value="all">
                {t('tools.service.all', 'All')}
              </SegmentedItem>
              <SegmentedItem value="hosted">
                {t('tools.service.hosted', 'Hosted')}
              </SegmentedItem>
              <SegmentedItem value="local">
                {t('tools.service.local', 'Local')}
              </SegmentedItem>
            </Segmented>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left categories - sticky, scrollable */}
          <aside className="hidden w-60 shrink-0 md:block">
            <div className="sticky top-20">
              <div className="mb-3 text-sm font-medium text-text-tertiary">
                {t('tools.categories.title', '分类')}
              </div>
              <nav className="divide-y divide-border-subtle rounded-xl border border-components-card-border bg-components-card-bg shadow-components-card-shadow">
                {DESKTOP_CATEGORIES.map((c) => {
                  const active = selectedCategory === c.key
                  const label = t(`tools.categories.${c.key}`, c.key)
                  return (
                    <button
                      key={c.key}
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-3 text-left text-sm',
                        active &&
                          'bg-components-sidebar-item-bg-active text-text-primary',
                        !active &&
                          'text-text-secondary hover:bg-components-sidebar-item-bg-hover',
                        c.disabled && 'cursor-not-allowed opacity-50',
                      )}
                      onClick={() =>
                        !c.disabled && setSelectedCategory(c.key as CategoryKey)
                      }
                      aria-disabled={c.disabled}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-xs',
                          c.disabled
                            ? 'border-border-subtle text-text-tertiary'
                            : 'border-border-default text-text-secondary',
                        )}
                      >
                        {c.count}
                      </span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <section className="min-w-0 flex-1">
            {/* Toolbar: search + segmented (mobile) + sort + reset */}
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    placeholder={t(
                      'tools.toolbar.searchPlaceholder',
                      '搜索工具…',
                    )}
                    value={search}
                    onChange={handleSearchChange}
                    className="pl-9"
                    aria-label={t('tools.toolbar.searchLabel', '搜索工具')}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="md:hidden">
                  <Segmented
                    value={serviceType}
                    onValueChange={(v) =>
                      handleServiceTypeChange(v as ServiceType)
                    }
                  >
                    <SegmentedItem value="all">
                      {t('tools.service.all', 'All')}
                    </SegmentedItem>
                    <SegmentedItem value="hosted">
                      {t('tools.service.hosted', 'Hosted')}
                    </SegmentedItem>
                    <SegmentedItem value="local">
                      {t('tools.service.local', 'Local')}
                    </SegmentedItem>
                  </Segmented>
                </div>
                <div className="w-40">
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortKey)}
                  >
                    <SelectTrigger
                      aria-label={t('tools.sort.placeholder', '排序')}
                    >
                      <SelectValue
                        placeholder={t('tools.sort.placeholder', '排序')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">
                        {t('tools.sort.latest', '最新')}
                      </SelectItem>
                      <SelectItem value="popular">
                        {t('tools.sort.popular', '最热')}
                      </SelectItem>
                      <SelectItem value="name">
                        {t('tools.sort.name', '名称')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" onClick={resetFilters}>
                  {t('tools.toolbar.reset', '重置')}
                </Button>
                <Button
                  variant="secondary"
                  className="md:hidden"
                  onClick={() => setShowCategoriesDrawer(true)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  {t('tools.toolbar.filter', '筛选')}
                </Button>
              </div>
            </div>

            {/* Cards grid */}
            {loading ? (
              renderSkeletonGrid()
            ) : filtered.length === 0 ? (
              renderEmpty()
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((tool) => (
                  <Card
                    key={tool.id}
                    className="relative h-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    role="button"
                    tabIndex={0}
                    onClick={() => openTool(tool.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') openTool(tool.id)
                    }}
                    aria-label={t('tools.card.openLabel', '打开工具 {{name}}', {
                      name: tool.title,
                    })}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-medium text-text-primary">
                            {tool.title}
                          </h3>
                          <p className="mt-1 max-h-[44px] overflow-hidden text-sm leading-6 text-text-secondary">
                            {tool.description}
                          </p>
                        </div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              aria-label={
                                tool.service === 'hosted'
                                  ? t('tools.service.hostedLabel', '托管服务')
                                  : t('tools.service.localLabel', '本地服务')
                              }
                              className={cn(
                                'shrink-0',
                                tool.service === 'hosted'
                                  ? 'border-components-badge-info-bg bg-components-badge-info-bg text-components-badge-info-text'
                                  : 'border-components-badge-success-bg bg-components-badge-success-bg text-components-badge-success-text',
                              )}
                            >
                              {tool.service === 'hosted' ? 'Hosted' : 'Local'}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {tool.service === 'hosted'
                              ? t('tools.service.hostedTip', '云端托管服务')
                              : t('tools.service.localTip', '本地运行服务')}
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {tool.tags.map((tag) => (
                          <Tag
                            key={tag}
                            variant="outline"
                            aria-label={t(
                              'tools.card.tagLabel',
                              '标签 {{name}}',
                              { name: tag },
                            )}
                          >
                            {tag}
                          </Tag>
                        ))}
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-text-secondary">
                          <span className="inline-flex items-center gap-1">
                            <Star
                              className="h-4 w-4 text-state-warning"
                              aria-hidden
                            />
                            {tool.stars}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Download className="h-4 w-4" aria-hidden />
                            {tool.downloads}
                          </span>
                        </div>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            openTool(tool.id)
                          }}
                        >
                          {t('tools.card.enter', '进入')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination placeholder */}
            <div className="mt-6 flex items-center justify-between text-sm text-text-secondary">
              <span>
                {t('tools.pagination.totalPages', '共 {{count}} 页', {
                  count: 1,
                })}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" disabled>
                  {t('tools.pagination.previous', '上一页')}
                </Button>
                <Button variant="outline" disabled>
                  {t('tools.pagination.next', '下一页')}
                </Button>
              </div>
            </div>
          </section>
        </div>

        {/* Mobile categories drawer (simple overlay) */}
        {showCategoriesDrawer && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCategoriesDrawer(false)}
            />
            <div className="shadow-elevation-high absolute inset-y-0 left-0 w-72 animate-slide-down border-r border-components-card-border bg-components-card-bg p-4">
              <div className="mb-3 text-sm font-medium text-text-tertiary">
                {t('tools.categories.title', '分类')}
              </div>
              <div className="space-y-1">
                {DESKTOP_CATEGORIES.map((category) => {
                  const disabled = category.disabled
                  const active = selectedCategory === category.key
                  const name = t(
                    `tools.categories.${category.key}`,
                    category.key,
                  )
                  return (
                    <button
                      key={name}
                      className={cn(
                        'w-full rounded-lg px-3 py-2 text-left',
                        active
                          ? 'bg-components-sidebar-item-bg-active text-text-primary'
                          : 'text-text-secondary hover:bg-components-sidebar-item-bg-hover',
                        disabled && 'cursor-not-allowed opacity-50',
                      )}
                      onClick={() => {
                        if (!disabled) {
                          setSelectedCategory(category.key as CategoryKey)
                          setShowCategoriesDrawer(false)
                        }
                      }}
                      aria-disabled={disabled}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCategoriesDrawer(false)}
                >
                  {t('tools.drawer.close', '关闭')}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    resetFilters()
                    setShowCategoriesDrawer(false)
                  }}
                >
                  {t('tools.drawer.reset', '重置')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}

export default AIToolsHomePage
