import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useOutletContext, useParams } from 'react-router-dom'
import {
  DetailTemplate,
  type DetailTemplateProps,
} from '@/components/page-templates'
import { RouteTabs, type PageTitleCrumb } from '@/components/patterns'
import { ROUTES } from '@/constants'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'
import { KNOWLEDGE_SECTIONS } from './knowledge-sections'

export interface KnowledgeDetailOutletContext {
  /** True when the shell's secondary panel shows the sections and the way back. */
  navigationManaged: boolean
}

export type KnowledgeSectionTemplateProps = Omit<
  DetailTemplateProps,
  'crumbs' | 'tabs' | 'title'
> & {
  /** The section name (h1); the knowledge base name is its crumb. */
  title: ReactNode
}

/**
 * The head every knowledge-base section shares: "Base / Section" crumbs and
 * the section title. When the shell panel lists the sections it also owns
 * the way back; without it (standalone layouts, tests) the crumbs link to the
 * list and route tabs replace the panel.
 */
export function KnowledgeSectionTemplate(props: KnowledgeSectionTemplateProps) {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const context = useOutletContext<KnowledgeDetailOutletContext | undefined>()
  const managed = context?.navigationManaged ?? false
  const { knowledgeBase } = useFetchKnowledgeDetail(id)
  const baseCrumb: PageTitleCrumb = {
    label: knowledgeBase?.name || t('knowledge.nav.knowledge'),
  }
  const crumbs: PageTitleCrumb[] = managed
    ? [baseCrumb]
    : [{ label: t('knowledge.nav.knowledge'), to: ROUTES.KNOWLEDGE }, baseCrumb]
  const tabs =
    managed || !id ? undefined : (
      <RouteTabs
        label={t('knowledge.nav.label')}
        tabs={KNOWLEDGE_SECTIONS.map((section) => ({
          to: `${ROUTES.KNOWLEDGE}/${id}/${section}`,
          label: t(`knowledge.nav.${section}`),
        }))}
      />
    )
  return <DetailTemplate {...props} crumbs={crumbs} tabs={tabs} />
}
