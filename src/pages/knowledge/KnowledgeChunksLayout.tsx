import { useTranslation } from 'react-i18next'
import { Link, Outlet, useParams } from 'react-router-dom'
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
import { ROUTES } from '@/constants'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'

const KnowledgeChunksLayout = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { knowledgeBase: currentKnowledgeBase } = useFetchKnowledgeDetail(id)

  return (
    <WorkspacePageTemplate
      className="h-full"
      header={
        <PageHeader
          compact
          surface="elevated"
          titleSize="md"
          title={null}
          breadcrumb={
            <Breadcrumb aria-label={t('knowledge.nav.breadcrumbLabel')}>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={ROUTES.HOME} aria-label={t('layout.nav.home')}>
                      <House className="size-icon-sm" />
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={ROUTES.KNOWLEDGE}>
                      {t('knowledge.nav.knowledge')}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to={`/knowledge/${id}/documents`}
                      className="max-w-48 truncate"
                    >
                      {currentKnowledgeBase?.name ||
                        t('knowledge.nav.documentFallback')}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('knowledge.nav.chunks')}</BreadcrumbPage>
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
