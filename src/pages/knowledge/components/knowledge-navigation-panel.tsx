import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import {
  ChevronLeft,
  FileText,
  Network,
  ScrollText,
  Search,
  Settings,
} from 'lucide-react'
import { ResourceChip } from '@/components/patterns/resource-card'
import {
  EmbeddingModelLabel,
  KnowledgeAvatar,
} from '@/components/knowledge/knowledge-identity'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import type { KnowledgeBase } from '@/types/api'
import { KNOWLEDGE_SECTIONS, type KnowledgeSection } from './knowledge-sections'

const SECTION_ICONS: Record<KnowledgeSection, typeof FileText> = {
  documents: FileText,
  graph: Network,
  search: Search,
  logs: ScrollText,
  settings: Settings,
}

interface KnowledgeNavigationPanelProps {
  /** Passed in: the shell renders this outside the detail route's outlet. */
  knowledgeBaseId: string
  knowledgeBase: KnowledgeBase | null
}

/**
 * The secondary panel of a knowledge base: the way back, the base's identity
 * (avatar, name, description, counts, embedding model) and its sections.
 */
export function KnowledgeNavigationPanel({
  knowledgeBaseId,
  knowledgeBase,
}: KnowledgeNavigationPanelProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const base = `${ROUTES.KNOWLEDGE}/${knowledgeBaseId}`
  const documents = knowledgeBase?.doc_num || 0
  const chunks = knowledgeBase?.chunk_num || 0

  return (
    <div
      data-slot="knowledge-navigation"
      className="flex min-h-0 flex-1 flex-col gap-space-base overflow-y-auto px-space-sm pt-space-sm pb-space-base"
    >
      <Link
        to={ROUTES.KNOWLEDGE}
        data-nav-row
        className="flex min-h-[var(--control-height-sm)] items-center gap-space-xs self-start rounded-radius-md px-space-sm text-xs text-text-tertiary outline-hidden hover:bg-state-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus"
      >
        <ChevronLeft className="size-icon-sm" aria-hidden="true" />
        {t('knowledge.nav.allKnowledge')}
      </Link>

      {knowledgeBase ? (
        <section
          aria-label={t('knowledge.nav.identity')}
          className="flex flex-col gap-space-sm px-space-sm"
        >
          <KnowledgeAvatar knowledgeBase={knowledgeBase} size="xl" />
          <div className="flex min-w-0 flex-col gap-space-2xs">
            <p className="text-base font-semibold break-words text-text-primary">
              {knowledgeBase.name}
            </p>
            <p className="line-clamp-3 text-xs text-text-tertiary">
              {knowledgeBase.description ||
                t('knowledge.common.emptyDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-space-xs">
            <ResourceChip>
              {t('knowledge.common.documentsCount', { count: documents })}
            </ResourceChip>
            <ResourceChip>
              {t('knowledge.common.chunksCount', { count: chunks })}
            </ResourceChip>
          </div>
          <EmbeddingModelLabel modelId={knowledgeBase.embd_id} />
        </section>
      ) : null}

      <nav aria-label={t('knowledge.nav.label')}>
        <ul className="flex flex-col gap-space-2xs">
          {KNOWLEDGE_SECTIONS.map((section) => {
            const href = `${base}/${section}`
            const active = pathname === href || pathname.startsWith(`${href}/`)
            const Icon = SECTION_ICONS[section]
            return (
              <li key={section}>
                <Link
                  to={href}
                  data-nav-row
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-[var(--control-height-sm)] items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm outline-hidden focus-visible:ring-2 focus-visible:ring-state-focus',
                    active
                      ? 'bg-state-selected-bg font-medium text-state-selected-text'
                      : 'text-text-secondary hover:bg-state-hover hover:text-text-primary',
                  )}
                >
                  <Icon className="size-icon-sm shrink-0" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    {t(`knowledge.nav.${section}`)}
                  </span>
                  {section === 'documents' && knowledgeBase ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="text-xs text-text-tertiary tabular-nums"
                      >
                        {documents.toLocaleString()}
                      </span>
                      <span className="sr-only">
                        {t('knowledge.common.documentsCount', {
                          count: documents,
                        })}
                      </span>
                    </>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
