import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Sparkles } from 'lucide-react'
import { ListPageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useFetchAgentTemplates, useSetAgent } from '@/hooks/use-agent-request'
import {
  buildAgentCanvasPath,
  buildInitialDsl,
  inferCanvasTypeFromGraph,
  resolveCanvasCategory,
  resolveCanvasKind,
  resolveLocalizedText,
} from '@/lib/agent'
import { AgentCanvasType, type AgentTemplate } from '@/types/agent'
import { CreateAgentDialog } from './components/create-agent-dialog'
import { TemplateCard } from './components/template-card'
import { TemplateCategorySidebar } from './components/template-category-sidebar'
import { AgentEmptyState } from './components/agent-empty-state'
import {
  ALL_CATEGORY_KEY,
  RECOMMENDED_KEY,
  getCategory,
  normalizeCategoryKey,
} from './components/template-category-config'

function resolveTemplateKind(template: AgentTemplate | null) {
  if (!template) {
    return AgentCanvasType.AGENT
  }

  const graphKind = inferCanvasTypeFromGraph(template.dsl?.graph)
  if (graphKind === AgentCanvasType.PIPELINE) {
    return graphKind
  }

  return resolveCanvasKind(template)
}

export default function AgentTemplatesPage() {
  const navigate = useNavigate()
  const templatesQuery = useFetchAgentTemplates()
  const setAgent = useSetAgent()
  const [keyword, setKeyword] = useState('')
  const [selectedKey, setSelectedKey] = useState<string>(ALL_CATEGORY_KEY)
  const [selectedTemplate, setSelectedTemplate] =
    useState<AgentTemplate | null>(null)

  const templates = useMemo(
    () => templatesQuery.data || [],
    [templatesQuery.data],
  )

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      [ALL_CATEGORY_KEY]: templates.length,
      [RECOMMENDED_KEY]: 0,
    }
    templates.forEach((template) => {
      const key = normalizeCategoryKey(template.canvas_type)
      counts[key] = (counts[key] || 0) + 1
    })
    return counts
  }, [templates])

  const keywordMatches = (template: AgentTemplate) => {
    if (!keyword.trim()) return true
    const text = `${resolveLocalizedText(template.title)} ${resolveLocalizedText(template.description, '')}`
    return text.toLowerCase().includes(keyword.trim().toLowerCase())
  }

  const recommendedTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          normalizeCategoryKey(template.canvas_type) === RECOMMENDED_KEY &&
          keywordMatches(template),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [templates, keyword],
  )

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (!keywordMatches(template)) return false
      if (selectedKey === ALL_CATEGORY_KEY) return true
      return normalizeCategoryKey(template.canvas_type) === selectedKey
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templates, keyword, selectedKey])

  const handleCreateFromTemplate = async (payload: {
    title: string
    kind: AgentCanvasType
  }) => {
    const template = selectedTemplate
    if (!template) {
      return
    }

    const templateKind = resolveTemplateKind(template)
    const templateCategory = resolveCanvasCategory(templateKind)

    const flow = await setAgent.setAgent({
      title: payload.title,
      canvas_category: templateCategory,
      avatar: template.avatar,
      description: resolveLocalizedText(template.description, ''),
      dsl: template.dsl || buildInitialDsl(templateKind),
    })

    navigate(buildAgentCanvasPath(flow.id, templateCategory))
  }

  const showRecommendedSection =
    selectedKey === ALL_CATEGORY_KEY && recommendedTemplates.length > 0

  const selectedCategory = getCategory(selectedKey)
  const mainSectionTitle =
    selectedKey === ALL_CATEGORY_KEY ? '全部模板' : selectedCategory.label
  const mainSectionTemplates =
    selectedKey === ALL_CATEGORY_KEY
      ? filteredTemplates.filter(
          (template) =>
            normalizeCategoryKey(template.canvas_type) !== RECOMMENDED_KEY,
        )
      : filteredTemplates

  const gridClasses =
    'grid grid-cols-1 gap-space-lg md:grid-cols-2 xl:grid-cols-3'

  const renderSectionHeader = (
    title: string,
    count: number,
    tone?: ReactNode,
  ) => (
    <div className="gap-space-sm flex min-w-0 items-center">
      {tone}
      <h2 className="truncate text-base font-semibold text-text-primary">
        {title}
      </h2>
      <span className="text-sm font-medium text-text-tertiary">
        {count} 个模板
      </span>
    </div>
  )

  const renderContent = () => (
    <div className="gap-space-2xl pb-space-md flex flex-col">
      {showRecommendedSection ? (
        <section className="gap-space-lg flex flex-col">
          {renderSectionHeader(
            '精选推荐',
            recommendedTemplates.length,
            <Sparkles className="h-4 w-4 text-components-badge-purple-text" />,
          )}
          <div className={gridClasses}>
            {recommendedTemplates.map((template) => (
              <TemplateCard
                key={`recommended-${template.id}`}
                template={template}
                onSelect={setSelectedTemplate}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="gap-space-lg flex flex-col">
        {renderSectionHeader(mainSectionTitle, mainSectionTemplates.length)}
        <div className={gridClasses}>
          {mainSectionTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={setSelectedTemplate}
            />
          ))}
        </div>
      </section>
    </div>
  )

  const pageState: 'content' | 'loading' | 'empty' | 'error' = (() => {
    if (templatesQuery.isLoading) return 'loading'
    if (templatesQuery.isError) return 'error'
    if (!filteredTemplates.length && !recommendedTemplates.length)
      return 'empty'
    return 'content'
  })()

  return (
    <>
      <div className="flex h-full min-h-0 bg-components-console-bg">
        <TemplateCategorySidebar
          value={selectedKey}
          onChange={setSelectedKey}
          counts={categoryCounts}
        />

        <div className="min-w-0 flex-1">
          <ListPageTemplate
            title="Agent Templates"
            description="从官方模板库出发快速构建 Agent 与 Pipeline,按分类浏览或搜索关键词。"
            headerActions={
              <Button variant="outline" onClick={() => navigate('/agents')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回 Agent Center
              </Button>
            }
            toolbarLeft={
              <Input
                type="search"
                placeholder="搜索模板标题或用途"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            }
            state={pageState}
            loadingState={
              <PageLoadingState
                scene={AppScene.CONSOLE}
                title="正在加载模板"
                description="先把模板资产整理进新的 Agent 创建链路。"
              />
            }
            errorState={
              <PageErrorState
                scene={AppScene.CONSOLE}
                title="模板加载失败"
                description="请检查 `/api/v1/agents/templates` 接口。"
                onRetry={() => {
                  void templatesQuery.refetch()
                }}
              />
            }
            emptyState={
              <AgentEmptyState
                type={
                  keyword || selectedKey !== ALL_CATEGORY_KEY
                    ? 'search'
                    : 'list'
                }
                onCreate={() => navigate('/agents?create=1')}
              />
            }
          >
            {renderContent()}
          </ListPageTemplate>
        </div>
      </div>

      <CreateAgentDialog
        key={selectedTemplate?.id || 'template-create-dialog'}
        open={Boolean(selectedTemplate)}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
        onConfirm={handleCreateFromTemplate}
        defaultTitle={
          selectedTemplate ? resolveLocalizedText(selectedTemplate.title) : ''
        }
        initialKind={resolveTemplateKind(selectedTemplate)}
        allowKindChange={false}
        title="基于模板创建"
        description="先复制模板骨架,再在新的编辑器壳层里增量替换节点与配置。"
      />
    </>
  )
}
