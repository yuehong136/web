import { useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useParams } from 'react-router-dom'
import { FileText, Search, Settings, ScrollText, Network } from 'lucide-react'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'
import { ROUTES } from '@/constants'
import {
  PageErrorState,
  PageLoadingState,
  type ContextRailGroup,
} from '@/components/patterns'
import { useRegisterSecondaryNavigation } from '@/components/layout/workbench-navigation'
import type { KnowledgeDetailOutletContext } from './components/knowledge-section-template'
import { KNOWLEDGE_SECTIONS } from './components/knowledge-sections'

const SECTION_ICONS = {
  documents: FileText,
  graph: Network,
  search: Search,
  logs: ScrollText,
  settings: Settings,
} as const

/**
 * Loads the knowledge base and hands its sections to the shell's secondary
 * panel (with the single way back to the list). Each section page renders
 * its own `DetailTemplate` head, so there is no stacked layout header.
 */
const KnowledgeDetailLayout: FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const {
    knowledgeBase: currentKnowledgeBase,
    isError,
    refetch,
  } = useFetchKnowledgeDetail(id)

  const navGroups: ContextRailGroup[] = useMemo(() => {
    if (!id) return []
    const base = `${ROUTES.KNOWLEDGE}/${id}`
    const startsWith = (prefix: string) => (pathname: string) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    return [
      {
        items: KNOWLEDGE_SECTIONS.map((section) => ({
          title: t(`knowledge.nav.${section}`),
          href: `${base}/${section}`,
          icon: SECTION_ICONS[section],
          matcher: startsWith(`${base}/${section}`),
        })),
      },
    ]
  }, [id, t])

  const navigationManaged = useRegisterSecondaryNavigation(
    useMemo(
      () =>
        id
          ? {
              section: 'knowledge' as const,
              title: currentKnowledgeBase?.name || t('layout.nav.knowledge'),
              groups: navGroups,
              backLink: {
                href: ROUTES.KNOWLEDGE,
                label: t('knowledge.nav.backToList'),
              },
            }
          : null,
      [id, currentKnowledgeBase?.name, navGroups, t],
    ),
  )

  const outletContext = useMemo<KnowledgeDetailOutletContext>(
    () => ({ navigationManaged }),
    [navigationManaged],
  )

  if (isError) {
    return (
      <PageErrorState
        title={t('knowledge.detail.errorTitle')}
        description={t('knowledge.detail.errorDescription')}
        retryLabel={t('knowledge.common.retry')}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!currentKnowledgeBase) {
    return (
      <PageLoadingState
        title={t('knowledge.common.loading')}
        description={t('knowledge.common.preparing')}
      />
    )
  }

  return <Outlet context={outletContext} />
}

export { KnowledgeDetailLayout }
