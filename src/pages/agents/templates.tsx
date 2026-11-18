import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GitBranch, LayoutTemplate, Plus, Search } from 'lucide-react'
import { CollectionTemplate } from '@/components/page-templates'
import {
  FilterBar,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  ResourceCard,
  ResourceGrid,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { useFetchAgentTemplates } from '@/hooks/use-agent-request'
import { countFlowNodes, resolveLocalizedText } from '@/lib/agent'
import type { AgentTemplate } from '@/types/agent'
import { TemplateCategorySidebar } from './components/template-category-sidebar'
import {
  ALL_CATEGORY_KEY,
  RECOMMENDED_KEY,
  categoryLabelKey,
  normalizeCategoryKey,
} from './components/template-category-config'
import { TemplateCreateDialog } from './components/template-create-dialog'
import {
  TemplateCategoryMark,
  TemplateTile,
  templateEntityKind,
} from './components/template-tile'

function TemplateSection({
  title,
  templates,
  onSelect,
}: {
  title: string
  templates: AgentTemplate[]
  onSelect: (template: AgentTemplate) => void
}) {
  const { t } = useTranslation()
  return (
    <section aria-label={title}>
      <h2 className="flex items-baseline gap-space-sm px-space-md pt-space-md text-sm font-semibold text-fg">
        {title}
        <span className="text-xs font-normal text-fg-subtle tabular-nums">
          {t('agents.templatesPage.count', { count: templates.length })}
        </span>
      </h2>
      <ResourceGrid label={title}>
        {templates.map((template) => {
          const name = resolveLocalizedText(
            template.title,
            t('agents.unnamedTemplate'),
          )
          return (
            <ResourceCard
              key={template.id}
              name={name}
              description={resolveLocalizedText(
                template.description,
                t('agents.templateDescriptionFallback'),
              )}
              leading={<TemplateTile template={template} />}
              eyebrow={t(
                templateEntityKind(template) === 'workflow'
                  ? 'agents.kindPipeline'
                  : 'agents.kindAgent',
              )}
              chips={
                <TemplateCategoryMark
                  template={template}
                  label={t(
                    categoryLabelKey(
                      normalizeCategoryKey(template.canvas_type),
                    ),
                  )}
                />
              }
              onOpen={() => onSelect(template)}
              actions={
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${t('agents.templatesPage.use')}: ${name}`}
                  onClick={() => onSelect(template)}
                >
                  <Plus className="size-icon-sm" aria-hidden="true" />
                  {t('agents.templatesPage.use')}
                </Button>
              }
              meta={
                <span className="inline-flex items-center gap-space-xs">
                  <GitBranch
                    className="size-icon-xs shrink-0"
                    aria-hidden="true"
                  />
                  {t('agents.nodeCount', { count: countFlowNodes(template) })}
                </span>
              }
            />
          )
        })}
      </ResourceGrid>
    </section>
  )
}

export default function AgentTemplatesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const templatesQuery = useFetchAgentTemplates()
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

  const matching = useMemo(() => {
    const term = keyword.trim().toLowerCase()
    return templates.filter((template) => {
      if (!term) return true
      const text = `${resolveLocalizedText(template.title)} ${resolveLocalizedText(template.description, '')}`
      return text.toLowerCase().includes(term)
    })
  }, [templates, keyword])
  const isRecommended = (template: AgentTemplate) =>
    normalizeCategoryKey(template.canvas_type) === RECOMMENDED_KEY
  const recommended = matching.filter(isRecommended)
  const showAll = selectedKey === ALL_CATEGORY_KEY
  const mainTemplates = showAll
    ? matching.filter((template) => !isRecommended(template))
    : matching.filter(
        (template) =>
          normalizeCategoryKey(template.canvas_type) === selectedKey,
      )
  const visibleRecommended = showAll ? recommended : []
  const filtered = Boolean(keyword.trim()) || !showAll

  const state = templatesQuery.isError
    ? 'error'
    : templatesQuery.isLoading
      ? 'loading'
      : !mainTemplates.length && !visibleRecommended.length
        ? 'empty'
        : 'content'

  return (
    <>
      <div className="flex h-full min-h-0">
        <TemplateCategorySidebar
          value={selectedKey}
          onChange={setSelectedKey}
          counts={categoryCounts}
        />
        <div className="min-w-0 flex-1">
          <CollectionTemplate
            title={t('agents.templates')}
            crumbs={[{ label: t('agents.center'), to: '/agents' }]}
            count={templates.length}
            countLabel={t('agents.templatesPage.results', {
              count: templates.length,
            })}
            filterBar={
              <FilterBar
                search={{
                  value: keyword,
                  onChange: setKeyword,
                  placeholder: t('agents.templatesPage.searchPlaceholder'),
                }}
              />
            }
            state={state}
            loadingState={
              <PageLoadingState
                title={t('agents.templatesPage.loadingTitle')}
                description={t('agents.templatesPage.loadingDescription')}
              />
            }
            errorState={
              <PageErrorState
                title={t('agents.templatesPage.loadFailedTitle')}
                description={t('agents.templatesPage.loadFailedDescription')}
                retryLabel={t('common.retry')}
                onRetry={() => {
                  void templatesQuery.refetch()
                }}
              />
            }
            emptyState={
              filtered ? (
                <PageEmptyState
                  icon={<Search className="size-icon-lg" />}
                  title={t('agents.noMatchTitle')}
                  description={t('agents.noMatchDescription')}
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setKeyword('')
                        setSelectedKey(ALL_CATEGORY_KEY)
                      }}
                    >
                      {t('agents.resetFilters')}
                    </Button>
                  }
                />
              ) : (
                <PageEmptyState
                  icon={<LayoutTemplate className="size-icon-lg" />}
                  title={t('agents.templatesPage.emptyTitle')}
                  description={t('agents.templatesPage.emptyDescription')}
                  action={
                    <Button onClick={() => navigate('/agents?create=1')}>
                      <Plus className="size-icon-sm" aria-hidden="true" />
                      {t('agents.templatesPage.createBlank')}
                    </Button>
                  }
                />
              )
            }
          >
            {visibleRecommended.length ? (
              <TemplateSection
                title={t('agents.templatesPage.featured')}
                templates={visibleRecommended}
                onSelect={setSelectedTemplate}
              />
            ) : null}
            {mainTemplates.length ? (
              <TemplateSection
                title={t(
                  showAll
                    ? 'agents.templatesPage.all'
                    : categoryLabelKey(selectedKey),
                )}
                templates={mainTemplates}
                onSelect={setSelectedTemplate}
              />
            ) : null}
          </CollectionTemplate>
        </div>
      </div>

      <TemplateCreateDialog
        template={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </>
  )
}
