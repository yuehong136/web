import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFetchAgentTemplates } from '@/hooks/use-agent-request'
import { resolveLocalizedText } from '@/lib/agent'
import { ROUTES } from '@/constants'
import type { AgentTemplate } from '@/types/agent'
import {
  RECOMMENDED_KEY,
  normalizeCategoryKey,
} from '@/pages/agents/components/template-category-config'
import { TemplateCreateDialog } from '@/pages/agents/components/template-create-dialog'
import { TemplateTile } from '@/pages/agents/components/template-tile'

/** How many templates the Studio row suggests. */
const SUGGESTED = 3

/** Recommended templates first, then the rest in their served order. */
export function pickSuggestedTemplates(templates: AgentTemplate[]) {
  const recommended = (template: AgentTemplate) =>
    normalizeCategoryKey(template.canvas_type) === RECOMMENDED_KEY
  return [
    ...templates.filter(recommended),
    ...templates.filter((template) => !recommended(template)),
  ].slice(0, SUGGESTED)
}

/**
 * "Start from a template" under the Studio grid: a few agent templates that
 * open the same create dialog as the template gallery. Hidden when the
 * backend serves no templates or the request fails.
 */
export function TemplateStartRow() {
  const { t } = useTranslation()
  const templates = useFetchAgentTemplates()
  const [selected, setSelected] = useState<AgentTemplate | null>(null)
  const suggested = pickSuggestedTemplates(templates.data)
  if (templates.isError || !suggested.length) return null
  const title = t('studio.templates.title')
  return (
    <section
      aria-label={title}
      data-slot="studio-template-row"
      className="flex flex-col gap-space-sm px-space-md pb-space-lg"
    >
      <div className="flex min-w-0 items-baseline gap-space-sm">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <span className="text-xs text-text-tertiary tabular-nums">
          {t('studio.templates.count', { count: templates.data.length })}
        </span>
        <span aria-hidden="true" className="flex-1" />
        <Link
          to={ROUTES.AGENT_TEMPLATES}
          className="rounded-radius-sm text-xs font-medium text-text-accent outline-hidden hover:underline focus-visible:ring-2 focus-visible:ring-state-focus"
        >
          {t('studio.templates.all')}
        </Link>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(17.5rem,100%),1fr))] gap-space-base">
        {suggested.map((template) => {
          const name = resolveLocalizedText(
            template.title,
            t('agents.unnamedTemplate'),
          )
          const descriptionId = `studio-template-${template.id}-description`
          return (
            <li key={template.id} className="min-w-0">
              <button
                type="button"
                aria-label={t('studio.templates.useNamed', { name })}
                aria-describedby={descriptionId}
                onClick={() => setSelected(template)}
                className="group/template flex h-full w-full min-w-0 items-center gap-space-sm rounded-radius-xl border border-border-subtle bg-background-surface p-space-sm text-left outline-hidden transition-[border-color,box-shadow,transform] duration-150 hover:border-border-strong hover:shadow-elevation-medium focus-visible:ring-2 focus-visible:ring-state-focus motion-safe:hover:-translate-y-px"
              >
                <TemplateTile template={template} size="md" />
                <span className="flex min-w-0 flex-1 flex-col gap-space-2xs">
                  <span className="truncate text-sm font-medium text-text-primary">
                    {name}
                  </span>
                  <span
                    id={descriptionId}
                    className="truncate text-xs text-text-tertiary"
                  >
                    {resolveLocalizedText(
                      template.description,
                      t('agents.templateDescriptionFallback'),
                    )}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xs font-medium text-text-accent"
                >
                  {t('studio.templates.use')}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <TemplateCreateDialog
        template={selected}
        onClose={() => setSelected(null)}
      />
    </section>
  )
}
