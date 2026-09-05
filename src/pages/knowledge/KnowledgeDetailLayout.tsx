import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Link,
  Outlet,
  useParams,
  useNavigate,
  useLocation,
} from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  Search,
  Settings,
  Database,
  ScrollText,
  Network,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Loading } from '@/components/ui/loading'
import { useFetchKnowledgeDetail } from '@/hooks/use-knowledge-request'
import { ROUTES } from '@/constants'
import { getAvatarGradient } from '@/components/ui/resource-list'
import { cn } from '@/lib/utils'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  PageHeader,
  SettingsRail,
  type SettingsRailGroup,
} from '@/components/patterns'
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

const KnowledgeStats: React.FC<{ kb: KnowledgeBase }> = ({ kb }) => {
  const { t } = useTranslation()

  return (
    <div className="gap-space-base flex items-center text-sm text-text-secondary">
      <span>
        {t('knowledge.common.documentsCount', { count: kb.doc_num || 0 })}
      </span>
      <span>
        {t('knowledge.common.chunksCount', { count: kb.chunk_num || 0 })}
      </span>
      <span>{(kb.token_num || 0).toLocaleString()} Token</span>
    </div>
  )
}

const KnowledgeDetailLayout: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    knowledgeBase: currentKnowledgeBase,
    isError,
    refetch,
  } = useFetchKnowledgeDetail(id)

  const navGroups: SettingsRailGroup[] = React.useMemo(() => {
    if (!id) return []
    const base = `/knowledge/${id}`
    const startsWith = (prefix: string) => (pathname: string) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`)
    return [
      {
        items: [
          {
            title: t('knowledge.nav.documents'),
            href: `${base}/documents`,
            icon: FileText,
            matcher: startsWith(`${base}/documents`),
          },
          {
            title: t('knowledge.nav.graph'),
            href: `${base}/graph`,
            icon: Network,
            matcher: startsWith(`${base}/graph`),
          },
          {
            title: t('knowledge.nav.search'),
            href: `${base}/search`,
            icon: Search,
            matcher: startsWith(`${base}/search`),
          },
          {
            title: t('knowledge.nav.logs'),
            href: `${base}/logs`,
            icon: ScrollText,
            matcher: startsWith(`${base}/logs`),
          },
          {
            title: t('knowledge.nav.settings'),
            href: `${base}/settings`,
            icon: Settings,
            matcher: startsWith(`${base}/settings`),
          },
        ],
      },
    ]
  }, [id, t])

  if (isError) {
    return (
      <div
        role="alert"
        className="flex h-64 flex-col items-center justify-center gap-4"
      >
        <p>{t('knowledge.logs.loadError')}</p>
        <Button variant="outline" onClick={() => void refetch()}>
          {t('knowledge.common.retry')}
        </Button>
      </div>
    )
  }

  if (!currentKnowledgeBase) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loading variant="spinner" size="lg" />
      </div>
    )
  }

  return (
    <ConsolePageTemplate
      bodyOverflow="hidden"
      rail={
        <SettingsRail
          className="hidden md:flex"
          navAriaLabel={t('knowledge.nav.label')}
          groups={navGroups}
          currentPath={location.pathname}
        />
      }
      toolbar={
        <nav
          aria-label={t('knowledge.nav.label')}
          className="flex shrink-0 gap-1 overflow-x-auto border-b border-components-settings-rail-border px-3 py-2 md:hidden"
        >
          {navGroups
            .flatMap((group) => group.items)
            .map((item) => (
              <Button
                key={item.href}
                asChild
                variant={
                  item.matcher?.(location.pathname) ? 'secondary' : 'ghost'
                }
                size="sm"
                className="shrink-0"
              >
                <Link
                  to={item.href}
                  aria-current={
                    item.matcher?.(location.pathname) ? 'page' : undefined
                  }
                >
                  {item.title}
                </Link>
              </Button>
            ))}
        </nav>
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
                aria-label={t('knowledge.nav.backToList')}
                onClick={() => navigate(ROUTES.KNOWLEDGE)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <KnowledgeAvatar kb={currentKnowledgeBase} />
            </>
          }
          title={currentKnowledgeBase.name}
          description={
            currentKnowledgeBase.description ||
            t('knowledge.common.emptyDescription')
          }
          actions={
            <div className="hidden lg:block">
              <KnowledgeStats kb={currentKnowledgeBase} />
            </div>
          }
        />
      }
    >
      <Outlet />
    </ConsolePageTemplate>
  )
}

export { KnowledgeDetailLayout }
