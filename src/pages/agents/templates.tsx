import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  AppScene,
  PageEmptyState,
  PageErrorState,
  PageHeader,
  PageLoadingState,
  PageToolbar,
  SectionCard,
} from '@/components/patterns'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useFetchAgentTemplates, useSetAgent } from '@/hooks/use-agent-request'
import { buildInitialDsl, resolveLocalizedText } from '@/lib/agent'
import { AgentCanvasType, type AgentTemplate } from '@/types/agent'
import {
  ArrowLeft,
  LayoutTemplate,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react'
import { CreateAgentDialog } from './components/create-agent-dialog'

type TemplateFilter = 'all' | 'agent' | 'pipeline'

export default function AgentTemplatesPage() {
  const navigate = useNavigate()
  const templatesQuery = useFetchAgentTemplates()
  const setAgent = useSetAgent()
  const [keyword, setKeyword] = useState('')
  const [filter, setFilter] = useState<TemplateFilter>('all')
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)

  const filteredTemplates = useMemo(() => {
    return templatesQuery.data.filter((template) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'pipeline'
          ? template.canvas_type === AgentCanvasType.PIPELINE || template.canvas_category === 'Ingestion'
          : template.canvas_type !== AgentCanvasType.PIPELINE && template.canvas_category !== 'Ingestion')

      if (!matchesFilter) {
        return false
      }

      if (!keyword.trim()) {
        return true
      }

      const text = `${resolveLocalizedText(template.title)} ${resolveLocalizedText(template.description, '')}`
      return text.toLowerCase().includes(keyword.trim().toLowerCase())
    })
  }, [filter, keyword, templatesQuery.data])

  const handleCreateFromTemplate = async (payload: {
    title: string
    kind: AgentCanvasType
  }) => {
    const template = selectedTemplate
    if (!template) {
      return
    }

    const flow = await setAgent.setAgent({
      title: payload.title,
      canvas_type: payload.kind,
      avatar: template.avatar,
      description: resolveLocalizedText(template.description, ''),
      dsl: template.dsl || buildInitialDsl(payload.kind),
    })

    navigate(`/agent/${flow.id}`)
  }

  const content = (() => {
    if (templatesQuery.isLoading) {
      return (
        <PageLoadingState
          scene={AppScene.CONSOLE}
          title="正在加载模板"
          description="先把模板资产整理进新的 Agent 创建链路。"
        />
      )
    }

    if (templatesQuery.isError) {
      return (
        <PageErrorState
          scene={AppScene.CONSOLE}
          title="模板加载失败"
          description="请检查 `/v1/canvas/templates` 接口。"
          onRetry={() => {
            void templatesQuery.refetch()
          }}
        />
      )
    }

    if (!filteredTemplates.length) {
      return (
        <PageEmptyState
          scene={AppScene.CONSOLE}
          title="没有匹配的模板"
          description="可以先回到 Agent Center 从空白骨架创建。"
          action={
            <Button onClick={() => navigate('/agents')}>
              <ArrowLeft className="mr-space-xs h-4 w-4" />
              返回 Agent Center
            </Button>
          }
        />
      )
    }

    return (
      <div className="grid gap-space-lg md:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map((template) => {
          const title = resolveLocalizedText(template.title)
          const description = resolveLocalizedText(template.description, '模板描述将在后续增量补齐。')

          return (
            <Card
              key={template.id}
              variant="interactive"
              padding="default"
              className="flex flex-col gap-space-md rounded-radius-xl"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-center gap-space-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-radius-xl bg-state-info-subtle text-state-info">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text-primary">{title}</p>
                  <p className="text-sm text-text-secondary">
                    {template.canvas_type === AgentCanvasType.PIPELINE ? 'Pipeline 模板' : 'Agent 模板'}
                  </p>
                </div>
              </div>

              <p className="line-clamp-3 min-h-[60px] text-sm text-text-secondary">
                {description}
              </p>

              <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-space-base">
                <span className="text-sm text-text-tertiary">
                  {template.dsl.graph?.nodes.length || 0} 节点
                </span>
                <Button variant="outline">
                  <Plus className="mr-space-xs h-4 w-4" />
                  使用模板
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    )
  })()

  return (
    <>
      <ConsolePageTemplate
        header={
          <PageHeader
            title="Agent Templates"
            description="模板页先接入标准创建骨架，后续再细化分类、预览和推荐策略。"
            actions={
              <Button variant="outline" onClick={() => navigate('/agents')}>
                <ArrowLeft className="mr-space-xs h-4 w-4" />
                返回 Agent Center
              </Button>
            }
          />
        }
        toolbar={
          <PageToolbar
            left={
              <div className="relative max-w-md flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  className="pl-9"
                  placeholder="搜索模板标题或用途"
                />
              </div>
            }
            right={
              <div className="flex items-center gap-space-sm">
                {(['all', 'agent', 'pipeline'] as const).map((item) => (
                  <Button
                    key={item}
                    variant={filter === item ? 'secondary' : 'outline'}
                    onClick={() => setFilter(item)}
                  >
                    {item === 'all' ? '全部' : item === 'agent' ? 'Agent' : 'Pipeline'}
                  </Button>
                ))}
              </div>
            }
          />
        }
      >
        <div className="p-space-lg">
          <SectionCard
            title="模板资产"
            actions={
              <div className="flex items-center gap-space-xs text-sm text-text-secondary">
                <LayoutTemplate className="h-4 w-4" />
                {filteredTemplates.length} 个结果
              </div>
            }
          >
            {content}
          </SectionCard>
        </div>
      </ConsolePageTemplate>

      <CreateAgentDialog
        open={Boolean(selectedTemplate)}
        onOpenChange={(open) => !open && setSelectedTemplate(null)}
        onConfirm={handleCreateFromTemplate}
        defaultTitle={
          selectedTemplate ? resolveLocalizedText(selectedTemplate.title) : ''
        }
        initialKind={
          selectedTemplate?.canvas_type === AgentCanvasType.PIPELINE ||
          selectedTemplate?.canvas_category === 'Ingestion'
            ? AgentCanvasType.PIPELINE
            : AgentCanvasType.AGENT
        }
        allowKindChange={false}
        title="基于模板创建"
        description="先复制模板骨架，再在新的编辑器壳层里增量替换节点与配置。"
      />
    </>
  )
}
