import React from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Outlet,
  useParams,
  useNavigate,
  useLocation,
  useMatch,
} from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Search,
  Settings,
  Database,
  House,
  ScrollText,
  Network,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Loading } from '@/components/ui/loading'
import { useKnowledgeStore } from '@/stores/knowledge'
import { ROUTES } from '@/constants'
import { knowledgeAPI } from '@/api/knowledge'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  PageHeader,
  SettingsRail,
  type SettingsRailGroup,
} from '@/components/patterns'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { KnowledgeBase } from '@/types/api'

const KnowledgeAvatar: React.FC<{ kb: KnowledgeBase }> = ({ kb }) => {
  if (kb.avatar) {
    return (
      <Avatar className="h-10 w-10">
        <AvatarImage src={kb.avatar} alt={kb.name} />
        <AvatarFallback>
          <Database className="h-5 w-5" />
        </AvatarFallback>
      </Avatar>
    )
  }
  return (
    <div
      aria-hidden
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-xl',
        'bg-gradient-to-br shadow-sm',
        getAvatarGradient(kb.name),
      )}
    >
      <span className="text-lg font-semibold text-text-inverted">
        {kb.name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}

const KnowledgeStats: React.FC<{ kb: KnowledgeBase }> = ({ kb }) => (
  <div className="gap-space-base flex items-center text-sm text-text-secondary">
    <span>{kb.doc_num || 0} 个文档</span>
    <span>{kb.chunk_num || 0} 个块</span>
    <span>{(kb.token_num || 0).toLocaleString()} Token</span>
  </div>
)

const KnowledgeDetailLayout: React.FC = () => {
  const { id, docId } = useParams<{ id: string; docId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentKnowledgeBase, isLoading, getKnowledgeBase } =
    useKnowledgeStore()
  const chunksMatch = useMatch('/knowledge/:id/documents/:docId/chunks')
  const isChunksRoute = Boolean(chunksMatch)

  React.useEffect(() => {
    if (id) {
      getKnowledgeBase(id)
    }
  }, [id, getKnowledgeBase])

  const navGroups: SettingsRailGroup[] = React.useMemo(() => {
    if (!id) return []
    const base = `/knowledge/${id}`
    const startsWith = (prefix: string) => (pathname: string) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    return [
      {
        items: [
          {
            title: '文档',
            href: `${base}/documents`,
            icon: FileText,
            matcher: startsWith(`${base}/documents`),
          },
          {
            title: '知识图谱',
            href: `${base}/graph`,
            icon: Network,
            matcher: startsWith(`${base}/graph`),
          },
          {
            title: '检索测试',
            href: `${base}/search`,
            icon: Search,
            matcher: startsWith(`${base}/search`),
          },
          {
            title: '日志',
            href: `${base}/logs`,
            icon: ScrollText,
            matcher: startsWith(`${base}/logs`),
          },
          {
            title: '设置',
            href: `${base}/settings`,
            icon: Settings,
            matcher: startsWith(`${base}/settings`),
          },
        ],
      },
    ]
  }, [id])

  const { data: currentDocument } = useQuery({
    queryKey: ['documentDetail', docId],
    enabled: Boolean(isChunksRoute && docId),
    queryFn: async () => knowledgeAPI.document.get(docId!),
  })

  if (isLoading || !currentKnowledgeBase) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading variant="spinner" size="lg" />
      </div>
    )
  }

  if (isChunksRoute) {
    return (
      <div className="flex h-full min-h-0 flex-col bg-components-console-bg">
        <header
          aria-label="切片导航"
          className="px-space-lg py-space-md flex shrink-0 items-center border-b border-border-default bg-background-surface"
        >
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(ROUTES.HOME)}>
                  <House className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => navigate(ROUTES.KNOWLEDGE)}>
                  知识库
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  onClick={() => navigate(`/knowledge/${id}/documents`)}
                >
                  {currentKnowledgeBase.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="max-w-[240px] truncate"
                  onClick={() => navigate(`/knowledge/${id}/documents`)}
                >
                  {currentDocument?.name || docId || '文档'}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>切片</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <ConsolePageTemplate
      bodyOverflow="hidden"
      rail={
        <SettingsRail
          navAriaLabel="知识库导航"
          groups={navGroups}
          currentPath={location.pathname}
        />
      }
      header={
        <PageHeader
          align="center"
          compact
          surface="elevated"
          titleSize="md"
          leading={
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="返回知识库列表"
                onClick={() => navigate(ROUTES.KNOWLEDGE)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <KnowledgeAvatar kb={currentKnowledgeBase} />
            </>
          }
          title={currentKnowledgeBase.name}
          description={currentKnowledgeBase.description || '暂无描述'}
          actions={<KnowledgeStats kb={currentKnowledgeBase} />}
        />
      }
    >
      <Outlet />
    </ConsolePageTemplate>
  )
}

export { KnowledgeDetailLayout }
