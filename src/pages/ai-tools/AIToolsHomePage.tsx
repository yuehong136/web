import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Star, Download, ChevronRight, Filter } from 'lucide-react'
import { Input } from '@/components/vendor/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/vendor/ui/select'
import { Segmented, SegmentedItem } from '@/components/vendor/ui/segmented'
import { Card, CardContent } from '@/components/vendor/ui/card'
import { Badge } from '@/components/vendor/ui/badge'
import { Button } from '@/components/vendor/ui/button'
import { Tag } from '@/components/vendor/ui/tag'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/vendor/ui/tooltip'
import { Skeleton } from '@/components/ui/loading'
import { cn } from '@/lib/utils'

type ServiceType = 'all' | 'hosted' | 'local'

export const AIToolsHomePage: React.FC = () => {
  const navigate = useNavigate()

  // UI state
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [serviceType, setServiceType] = React.useState<ServiceType>('all')
  const [sortBy, setSortBy] = React.useState<'最新' | '最热' | '名称'>('最新')
  const [selectedCategory, setSelectedCategory] = React.useState<'全部' | '表单与流程'>('全部')
  const [showCategoriesDrawer, setShowCategoriesDrawer] = React.useState(false)

  // analytics stubs
  React.useEffect(() => {
    // tools_impression
    // eslint-disable-next-line no-console
    console.log('tools_impression', { page: 'ai-tools' })
    const t = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(t)
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    // tools_search
    // eslint-disable-next-line no-console
    console.log('tools_search', { keyword: e.target.value })
  }

  const handleServiceTypeChange = (v: ServiceType) => {
    setServiceType(v)
    // tools_filter
    // eslint-disable-next-line no-console
    console.log('tools_filter', { serviceType: v })
  }

  const resetFilters = () => {
    setSearch('')
    setServiceType('all')
    setSortBy('最新')
    setSelectedCategory('全部')
  }

  // Tool cards (static demo)
  const tools = [
    {
      id: 'auto-fill',
      title: '自动填表',
      description: '将结构化/半结构化数据快速映射至固定模板，实现批量高效填报，适配多种字段类型。',
      tags: ['字段映射', '模板', '批量填充'],
      service: 'hosted' as const,
      stars: 4.8,
      downloads: '12.3k',
      category: '表单与流程' as const,
    },
  ]

  // visual-only filtering (does not affect the single card result)
  const filtered = tools.filter((t) => {
    const matchCategory = selectedCategory === '全部' || t.category === selectedCategory
    const matchSearch = !search || [t.title, t.description, ...t.tags].some((x) => x.toLowerCase().includes(search.toLowerCase()))
    const matchService = serviceType === 'all' || t.service === serviceType
    return matchCategory && matchSearch && matchService
  })

  // render helpers
  const renderSkeletonGrid = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-components-card-border bg-components-card-bg p-6 shadow-components-card-shadow">
          <Skeleton height="1.25rem" className="w-2/3 mb-4" />
          <Skeleton height="0.875rem" className="w-full mb-2" />
          <Skeleton height="0.875rem" className="w-5/6 mb-4" />
          <div className="flex gap-2 mb-4">
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
    <div className="flex flex-col items-center justify-center py-20 text-center bg-components-empty-bg rounded-lg border border-border-subtle">
      <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">:)</div>
      <p className="text-text-secondary mb-2">未找到匹配的工具</p>
      <p className="text-sm text-text-tertiary mb-4">试试调整搜索关键词或清空筛选条件</p>
      <Button variant="outline" onClick={resetFilters}>清空筛选</Button>
    </div>
  )

  const openTool = (id: string) => {
    // tool_open
    // eslint-disable-next-line no-console
    console.log('tool_open', { id })
    navigate(`/tools/${id}`)
  }

  return (
    <TooltipProvider>
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-text-secondary flex items-center gap-2">
        <span className="hover:text-text-primary cursor-default">首页</span>
        <ChevronRight className="h-4 w-4 text-components-breadcrumb-separator" />
        <span className="text-text-primary">工具箱</span>
      </div>

      {/* Page title and quick filter (right aligned) */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">工具箱</h1>
        <div className="hidden md:block">
          <Segmented value={serviceType} onValueChange={(v) => handleServiceTypeChange(v as ServiceType)}>
            <SegmentedItem value="all">All</SegmentedItem>
            <SegmentedItem value="hosted">Hosted</SegmentedItem>
            <SegmentedItem value="local">Local</SegmentedItem>
          </Segmented>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left categories - sticky, scrollable */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-20">
            <div className="mb-3 text-sm font-medium text-text-tertiary">分类</div>
            <nav className="bg-components-card-bg rounded-xl border border-components-card-border shadow-components-card-shadow divide-y divide-border-subtle">
              {[
                { key: '全部', count: 1, disabled: false },
                { key: '表单与流程', count: 1, disabled: false },
                { key: '数据分析', count: 0, disabled: true },
                { key: '图像与OCR', count: 0, disabled: true },
                { key: '文案与翻译', count: 0, disabled: true },
                { key: '开发与运维', count: 0, disabled: true },
              ].map((c) => {
                const active = selectedCategory === (c.key as '全部' | '表单与流程')
                return (
                  <button
                    key={c.key}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-3 text-left text-sm',
                      active && 'bg-components-sidebar-item-bg-active text-text-primary',
                      !active && 'hover:bg-components-sidebar-item-bg-hover text-text-secondary',
                      c.disabled && 'opacity-50 cursor-not-allowed'
                    )}
                    onClick={() => !c.disabled && setSelectedCategory(c.key as '全部' | '表单与流程')}
                    aria-disabled={c.disabled}
                  >
                    <span>{c.key}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs border', c.disabled ? 'text-text-tertiary border-border-subtle' : 'text-text-secondary border-border-default')}>{c.count}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1 min-w-0">
          {/* Toolbar: search + segmented (mobile) + sort + reset */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  placeholder="搜索工具…"
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-9"
                  aria-label="搜索工具"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="md:hidden">
                <Segmented value={serviceType} onValueChange={(v) => handleServiceTypeChange(v as ServiceType)}>
                  <SegmentedItem value="all">All</SegmentedItem>
                  <SegmentedItem value="hosted">Hosted</SegmentedItem>
                  <SegmentedItem value="local">Local</SegmentedItem>
                </Segmented>
              </div>
              <div className="w-40">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger aria-label="排序选项">
                    <SelectValue placeholder="排序" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="最新">最新</SelectItem>
                    <SelectItem value="最热">最热</SelectItem>
                    <SelectItem value="名称">名称</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" onClick={resetFilters}>重置</Button>
              <Button variant="secondary" className="md:hidden" onClick={() => setShowCategoriesDrawer(true)}>
                <Filter className="h-4 w-4 mr-2" />
                筛选
              </Button>
            </div>
          </div>

          {/* Cards grid */}
          {loading ? (
            renderSkeletonGrid()
          ) : filtered.length === 0 ? (
            renderEmpty()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filtered.map((tool) => (
                <Card
                  key={tool.id}
                  className="relative h-full focus-visible:ring-2 focus-visible:ring-offset-2 outline-none"
                  role="button"
                  tabIndex={0}
                  onClick={() => openTool(tool.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter') openTool(tool.id) }}
                  aria-label={`打开工具 ${tool.title}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-medium text-text-primary truncate">{tool.title}</h3>
                        <p className="mt-1 text-sm text-text-secondary leading-6 max-h-[44px] overflow-hidden">{tool.description}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="outline"
                            aria-label={tool.service === 'hosted' ? '托管服务' : '本地服务'}
                            className={cn('shrink-0', tool.service === 'hosted' ? 'border-components-badge-info-bg text-components-badge-info-text bg-components-badge-info-bg' : 'border-components-badge-success-bg text-components-badge-success-text bg-components-badge-success-bg')}
                          >
                            {tool.service === 'hosted' ? 'Hosted' : 'Local'}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>{tool.service === 'hosted' ? '云端托管服务' : '本地运行服务'}</TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {tool.tags.map((tag) => (
                        <Tag key={tag} variant="outline" aria-label={`标签 ${tag}`}>{tag}</Tag>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 text-warning-500" aria-hidden />{tool.stars}</span>
                        <span className="inline-flex items-center gap-1"><Download className="h-4 w-4" aria-hidden />{tool.downloads}</span>
                      </div>
                      <Button onClick={(e) => { e.stopPropagation(); openTool(tool.id) }}>进入</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination placeholder */}
          <div className="mt-6 flex items-center justify-between text-sm text-text-secondary">
            <span>共 1 页</span>
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled>上一页</Button>
              <Button variant="outline" disabled>下一页</Button>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile categories drawer (simple overlay) */}
      {showCategoriesDrawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCategoriesDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-components-card-bg border-r border-components-card-border shadow-large p-4 animate-slide-down">
            <div className="text-sm font-medium text-text-tertiary mb-3">分类</div>
            <div className="space-y-1">
              {['全部', '表单与流程', '数据分析', '图像与OCR', '文案与翻译', '开发与运维'].map((name) => {
                const disabled = name !== '全部' && name !== '表单与流程'
                const active = selectedCategory === name
                return (
                  <button
                    key={name}
                    className={cn('w-full text-left px-3 py-2 rounded-lg', active ? 'bg-components-sidebar-item-bg-active text-text-primary' : 'hover:bg-components-sidebar-item-bg-hover text-text-secondary', disabled && 'opacity-50 cursor-not-allowed')}
                    onClick={() => { if (!disabled) { setSelectedCategory(name as any); setShowCategoriesDrawer(false) } }}
                    aria-disabled={disabled}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => setShowCategoriesDrawer(false)}>关闭</Button>
              <Button variant="secondary" onClick={() => { resetFilters(); setShowCategoriesDrawer(false) }}>重置</Button>
            </div>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}

export default AIToolsHomePage


