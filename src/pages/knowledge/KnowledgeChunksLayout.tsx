import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { FileText, House } from 'lucide-react'
import { SplitDetailPageTemplate } from '@/components/page-templates'
import { PageHeader } from '@/components/patterns'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Loading } from '@/components/ui/loading'
import { knowledgeAPI } from '@/api/knowledge'
import { ROUTES } from '@/constants'
import { useKnowledgeStore } from '@/stores/knowledge'

const KnowledgeChunksLayout: React.FC = () => {
  const { t } = useTranslation()
  const { id, docId } = useParams<{ id: string; docId: string }>()
  const navigate = useNavigate()
  const { currentKnowledgeBase, getKnowledgeBase } = useKnowledgeStore()

  React.useEffect(() => {
    if (id) {
      getKnowledgeBase(id)
    }
  }, [getKnowledgeBase, id])

  const { data: currentDocument, isLoading } = useQuery({
    queryKey: ['documentDetail', docId],
    enabled: Boolean(docId),
    queryFn: async () => knowledgeAPI.document.get(docId!),
  })

  const documentName =
    currentDocument?.name || docId || t('knowledge.nav.documentFallback')

  return (
    <SplitDetailPageTemplate
      leftWidth={280}
      minLeft={240}
      header={
        <PageHeader
          compact
          surface="elevated"
          titleSize="md"
          title={t('knowledge.nav.chunks')}
          description={documentName}
          breadcrumb={
            <Breadcrumb aria-label={t('knowledge.nav.breadcrumbLabel')}>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigate(ROUTES.HOME)}>
                    <House className="h-4 w-4" />
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink onClick={() => navigate(ROUTES.KNOWLEDGE)}>
                    {t('knowledge.nav.knowledge')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    onClick={() => navigate(`/knowledge/${id}/documents`)}
                  >
                    {currentKnowledgeBase?.name ||
                      t('knowledge.nav.documentFallback')}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="max-w-[240px] truncate">
                    {documentName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
      }
      leftPane={
        <aside className="p-space-lg flex h-full min-h-0 flex-col bg-components-split-pane-surface">
          {isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loading variant="spinner" size="md" />
            </div>
          ) : (
            <div className="space-y-space-base">
              <div className="rounded-radius-lg flex h-12 w-12 items-center justify-center bg-components-page-state-icon-bg text-components-page-state-icon">
                <FileText className="h-6 w-6" />
              </div>
              <div className="space-y-space-xs">
                <h2 className="break-words text-base font-semibold text-text-primary">
                  {documentName}
                </h2>
                <p className="text-sm text-text-secondary">
                  {t('knowledge.nav.chunks')}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/knowledge/${id}/documents`)}
              >
                {t('knowledge.nav.documents')}
              </Button>
            </div>
          )}
        </aside>
      }
      rightPane={
        <div className="h-full min-h-0 overflow-hidden">
          <Outlet />
        </div>
      }
    />
  )
}

export { KnowledgeChunksLayout }
