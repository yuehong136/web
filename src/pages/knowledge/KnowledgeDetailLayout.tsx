import { useMemo, type FC } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useParams } from 'react-router-dom'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'
import { PageErrorState, PageLoadingState } from '@/components/patterns'
import { useRegisterSecondaryNavigation } from '@/components/layout/workbench-navigation'
import { usePageEntityTitle } from '@/components/layout/route-document'
import type { KnowledgeDetailOutletContext } from './components/knowledge-section-template'
import { KnowledgeNavigationPanel } from './components/knowledge-navigation-panel'

/**
 * Loads the knowledge base and hands the shell's secondary panel its
 * identity and sections (with the single way back to the list). Each section
 * page renders its own `DetailTemplate` head, so there is no stacked layout
 * header.
 */
const KnowledgeDetailLayout: FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const {
    knowledgeBase: currentKnowledgeBase,
    isError,
    refetch,
  } = useFetchKnowledgeDetail(id)
  usePageEntityTitle(currentKnowledgeBase?.name)

  const navigationManaged = useRegisterSecondaryNavigation(
    useMemo(
      () =>
        id
          ? {
              section: 'knowledge' as const,
              title: currentKnowledgeBase?.name || t('layout.nav.knowledge'),
              groups: [],
              contentOnly: true,
              content: (
                <KnowledgeNavigationPanel
                  knowledgeBaseId={id}
                  knowledgeBase={currentKnowledgeBase ?? null}
                />
              ),
            }
          : null,
      [id, currentKnowledgeBase, t],
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
