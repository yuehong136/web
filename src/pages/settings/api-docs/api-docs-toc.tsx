import { useTranslation } from 'react-i18next'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MethodBadge } from '@/components/ui/method-badge'
import { cn } from '@/lib/utils'
import { endpointAnchor, type EndpointGroup } from './api-schema'

interface ApiDocsTocProps {
  groups: EndpointGroup[]
  query: string
  onQueryChange: (query: string) => void
  activeId: string | null
  onNavigate: (anchor: string) => void
  tagLabel: (tag: string) => string
}

/** In-page table of contents: one link per endpoint, grouped by tag. */
export function ApiDocsToc({
  groups,
  query,
  onQueryChange,
  activeId,
  onNavigate,
  tagLabel,
}: ApiDocsTocProps) {
  const { t } = useTranslation()
  return (
    <nav
      aria-label={t('settings.apiDocs.toc')}
      className="flex min-h-0 flex-col gap-space-sm p-space-sm"
    >
      <Input
        type="search"
        inputSize="sm"
        leftIcon={<Search className="size-icon-sm" aria-hidden="true" />}
        aria-label={t('settings.apiDocs.search')}
        placeholder={t('settings.apiDocs.search')}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
      {groups.length === 0 ? (
        <p className="px-space-xs text-sm text-text-tertiary">
          {t('settings.apiDocs.noMatches')}
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.tag} className="flex flex-col gap-space-2xs">
            <p className="px-space-xs pt-space-xs text-xs font-medium text-text-tertiary">
              {tagLabel(group.tag)}
            </p>
            <ul className="flex flex-col">
              {group.endpoints.map((endpoint) => {
                const anchor = endpointAnchor(endpoint)
                const active = anchor === activeId
                return (
                  <li key={endpoint.id}>
                    <a
                      href={`#${anchor}`}
                      aria-current={active ? 'location' : undefined}
                      onClick={(event) => {
                        event.preventDefault()
                        onNavigate(anchor)
                      }}
                      className={cn(
                        'flex min-h-[var(--control-height-sm)] items-center gap-space-xs rounded-radius-sm px-space-xs text-sm text-text-secondary outline-hidden hover:bg-state-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-state-focus',
                        active &&
                          'bg-state-selected-bg font-medium text-text-primary',
                      )}
                    >
                      <MethodBadge
                        method={endpoint.method}
                        size="sm"
                        className="w-14"
                      />
                      <span className="min-w-0 truncate">
                        {endpoint.summary}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}
    </nav>
  )
}
