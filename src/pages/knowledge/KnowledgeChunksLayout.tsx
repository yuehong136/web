import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Outlet, useNavigate, useParams } from 'react-router-dom'
import { House } from 'lucide-react'
import { WorkspacePageTemplate } from '@/components/page-templates'
import { PageHeader } from '@/components/patterns'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { knowledgeAPI } from '@/api/knowledge'
import { documentKeys } from '@/hooks/use-document-request'
import { ROUTES } from '@/constants'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'

const KnowledgeChunksLayout = () => {
  const { t } = useTranslation()
  const { id, docId } = useParams<{ id: string; docId: string }>()
  const navigate = useNavigate()
  const { knowledgeBase: currentKnowledgeBase } = useFetchKnowledgeDetail(id)

  const { data: currentDocument } = useQuery({
    queryKey: documentKeys.standaloneDetail(docId),
    enabled: Boolean(docId),
    queryFn: async () => knowledgeAPI.document.get(docId!),
  })

  const documentName =
    currentDocument?.name || docId || t('knowledge.nav.documentFallback')

  return (
    <WorkspacePageTemplate
      className="h-full"
      header={
        <PageHeader
          compact
          surface="elevated"
          titleSize="md"
          title={t('knowledge.nav.chunks')}
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
                  <BreadcrumbPage className="max-w-[320px] truncate">
                    {documentName}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
        />
      }
    >
      <div className="flex h-full min-h-0 w-full min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </WorkspacePageTemplate>
  )
}

export { KnowledgeChunksLayout }
