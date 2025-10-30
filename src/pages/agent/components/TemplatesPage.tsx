import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Search,
  Sparkles,
  Box,
  MessageCircleCode,
  ChartPie,
  Component,
  Route,
  PencilRuler,
} from 'lucide-react'
import { agentAPI } from '@/api/agent'
import { toast } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { IFlow } from '../types'

interface TemplatesPageProps {
  onBack: () => void
  onTemplateSelected: () => void
}

// 模版分类菜单
const TemplateCategory = {
  Recommended: 'Recommended',
  Agent: 'Agent',
  CustomerSupport: 'Customer Support',
  Marketing: 'Marketing',
  ConsumerApp: 'Consumer App',
  Pipeline: 'Ingestion Pipeline',
  Other: 'Other',
} as const

type TemplateCategory = (typeof TemplateCategory)[keyof typeof TemplateCategory]

const categoryMenu = [
  { key: TemplateCategory.Recommended, label: '推荐', icon: Sparkles },
  { key: TemplateCategory.Agent, label: '智能体', icon: Box },
  { key: TemplateCategory.CustomerSupport, label: '客服支持', icon: MessageCircleCode },
  { key: TemplateCategory.Marketing, label: '营销', icon: ChartPie },
  { key: TemplateCategory.ConsumerApp, label: '消费应用', icon: Component },
  { key: TemplateCategory.Pipeline, label: 'Ingestion Pipeline', icon: Route },
  { key: TemplateCategory.Other, label: '其他', icon: PencilRuler },
]

export const TemplatesPage = ({ onBack }: TemplatesPageProps) => {
  const navigate = useNavigate()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory>(TemplateCategory.Recommended)
  const [selectedTemplate, setSelectedTemplate] = useState<IFlow | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newAgentName, setNewAgentName] = useState('')

  // 获取模版列表
  const { data: templatesData, isLoading, error } = useQuery({
    queryKey: ['agentTemplates'],
    queryFn: async () => {
      console.log('🔍 请求模版列表: /v1/canvas/templates')
      const result = await agentAPI.fetchTemplates()
      console.log('📦 模版API返回:', result)
      return result
    },
  })

  // apiClient已经自动提取了data字段，所以templatesData直接是IFlow[]数组
  const templates = templatesData || []

  // 获取模版标题（处理多语言）
  const getTemplateTitle = (template: IFlow) => {
    if (typeof template.title === 'object') {
      return template.title.zh || template.title.en || '未命名'
    }
    return template.title || '未命名'
  }

  // 获取模版描述（处理多语言）
  const getTemplateDescription = (template: IFlow) => {
    if (typeof template.description === 'object') {
      return template.description.zh || template.description.en || ''
    }
    return template.description || ''
  }

  // 根据分类和搜索过滤模版 - 照抄RAGFlow逻辑
  const filteredTemplates = useMemo(() => {
    let result = templates

    // 按分类过滤 - RAGFlow的逻辑
    if (!selectedCategory || selectedCategory === TemplateCategory.Recommended) {
      // 推荐：显示所有
      result = templates
    } else {
      // 其他分类：按canvas_type过滤（转小写比较）
      result = templates.filter(
        (item) =>
          item.canvas_type?.toLowerCase() === selectedCategory?.toLowerCase(),
      )
    }

    // 按搜索关键词过滤
    if (searchKeyword) {
      result = result.filter((template) => {
        const title = getTemplateTitle(template).toLowerCase()
        const desc = getTemplateDescription(template).toLowerCase()
        const keyword = searchKeyword.toLowerCase()
        return title.includes(keyword) || desc.includes(keyword)
      })
    }

    return result
  }, [templates, selectedCategory, searchKeyword])

  // 点击模版卡片
  const handleTemplateClick = (template: IFlow) => {
    setSelectedTemplate(template)
    setCreateDialogOpen(true)
    setNewAgentName(getTemplateTitle(template))
  }

  // 从模版创建 - 照抄RAGFlow逻辑
  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newAgentName.trim()) {
      return
    }

    try {
      const description = getTemplateDescription(selectedTemplate)

      console.log('🎨 [从模版创建] 开始创建', {
        title: newAgentName.trim(),
        canvas_type: selectedTemplate.canvas_type,
        canvas_category: selectedTemplate.canvas_category,
        dsl类型: typeof selectedTemplate.dsl,
      })

      const result = await agentAPI.setAgent({
        title: newAgentName.trim(),
        description,
        canvas_type: selectedTemplate.canvas_type === 'pipeline' ? 'pipeline' : 'agent',
        dsl: selectedTemplate.dsl,  // 直接传递dsl，API层会处理
        avatar: selectedTemplate.avatar,
      })

      console.log('✅ [从模版创建] 创建成功:', result)

      if (result?.id) {
        toast.success('创建成功')
        setCreateDialogOpen(false)
        setSelectedTemplate(null)
        setNewAgentName('')
        
        // 照抄RAGFlow：创建成功后直接跳转到画布页面
        console.log('🚀 [从模版创建] 跳转到画布:', result.id)
        navigate(`/agent/${result.id}`)
      }
    } catch (error) {
      console.error('❌ [从模版创建] 创建失败:', error)
      toast.error('创建失败')
    }
  }

  return (
    <div className="flex h-full">
      {/* 左侧分类边栏 */}
      <aside className="w-64 bg-card border-r border-border flex flex-col flex-shrink-0">
        {/* 返回按钮 */}
        <div className="p-4 border-b border-border">
          <Button variant="ghost" size="sm" onClick={onBack} className="w-full justify-start">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回
          </Button>
        </div>

        {/* 分类菜单 */}
        <nav className="flex-1 overflow-auto py-2">
          {categoryMenu.map((item) => {
            const Icon = item.icon
            const isActive = selectedCategory === item.key
            return (
              <button
                key={item.key}
                onClick={() => setSelectedCategory(item.key)}
                className={cn(
                  'w-full flex items-center gap-4 px-6 py-4 transition-all relative',
                  'hover:bg-muted/50',
                  isActive && 'bg-secondary text-secondary-foreground font-medium',
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && (
                  <div className="absolute right-0 w-1 h-12 bg-primary rounded-l-lg shadow-lg shadow-primary/50" />
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* 右侧主内容区 */}
      <main className="flex-1 flex flex-col bg-background overflow-hidden">
        {/* 顶部标题和搜索 */}
        <div className="px-8 py-6 border-b border-border bg-card flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">创建智能体</h2>
              <p className="text-sm text-muted-foreground mt-1">
                选择一个模版快速开始
              </p>
            </div>

            {/* 搜索框 */}
            <div className="w-80 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索模版..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* 统计信息 */}
          <div className="text-sm text-muted-foreground">
            找到 <span className="font-semibold text-foreground">{filteredTemplates.length}</span> 个模版
          </div>
        </div>

        {/* 模版网格 */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <div className="text-sm text-muted-foreground">加载模版中...</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">加载模版失败</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                重试
              </Button>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Sparkles className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchKeyword ? '没有找到匹配的模版' : '该分类下暂无模版'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => {
                const templateTitle = getTemplateTitle(template)
                const templateDesc = getTemplateDescription(template)
                
                return (
                  <Card
                    key={template.id}
                    className="group relative overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border hover:border-primary/50 bg-card"
                    onClick={() => handleTemplateClick(template)}
                  >
                    <div className="p-6">
                      {/* 头部：小图标 + 标题 */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Avatar小图标 - 参考RAGFlow策略 */}
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {template.avatar ? (
                            <img
                              src={template.avatar}
                              alt={templateTitle}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 图片加载失败时显示fallback
                                const target = e.currentTarget
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = '<svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>'
                                }
                              }}
                            />
                          ) : (
                            <Sparkles className="w-6 h-6 text-white" />
                          )}
                        </div>
                        
                        {/* 标题 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                            {templateTitle}
                          </h3>
                          
                          {/* 推荐标签 */}
                          {template.canvas_type === 'Recommended' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                              <Sparkles className="w-3 h-3" />
                              推荐
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 描述 */}
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[3.75rem] leading-relaxed">
                        {templateDesc || '暂无描述'}
                      </p>

                      {/* 底部：类型标签 */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50">
                        <span
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold',
                            template.canvas_type === 'pipeline' || template.canvas_category === 'Ingestion'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                          )}
                        >
                          {template.canvas_type === 'pipeline' || template.canvas_category === 'Ingestion'
                            ? 'Ingestion Pipeline'
                            : '智能体流程'}
                        </span>
                      </div>
                    </div>

                    {/* 悬停遮罩和按钮 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                      <Button
                        size="lg"
                        className="shadow-2xl bg-white text-gray-900 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTemplateClick(template)
                        }}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        使用此模版
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* 创建确认对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">创建智能体</DialogTitle>
            <DialogDescription className="text-base">
              基于模版
              <span className="font-semibold text-foreground mx-1">
                "{selectedTemplate && getTemplateTitle(selectedTemplate)}"
              </span>
              创建新的智能体
            </DialogDescription>
          </DialogHeader>

          {/* 模版预览 */}
          {selectedTemplate && (
            <div className="py-4">
              <div className="rounded-lg border border-border p-4 bg-muted/30 mb-4">
                <div className="flex items-start gap-4">
                  {/* 模版图标 */}
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    {selectedTemplate.avatar ? (
                      <img
                        src={selectedTemplate.avatar}
                        alt={getTemplateTitle(selectedTemplate)}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Sparkles className="w-8 h-8 text-white" />
                    )}
                  </div>
                  
                  {/* 模版信息 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground mb-1 truncate">
                      {getTemplateTitle(selectedTemplate)}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {getTemplateDescription(selectedTemplate)}
                    </p>
                  </div>
                </div>
              </div>

              {/* 名称输入 */}
              <div>
                <Label htmlFor="new-agent-name" className="text-sm font-medium mb-2 block">
                  <span className="text-destructive">*</span> 智能体名称
                </Label>
                <Input
                  id="new-agent-name"
                  placeholder="请输入名称"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newAgentName.trim()) {
                      handleCreateFromTemplate()
                    }
                  }}
                  className="text-base"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateFromTemplate} disabled={!newAgentName.trim()}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
