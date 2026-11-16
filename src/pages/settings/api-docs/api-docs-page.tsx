import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { RefreshCw } from 'lucide-react'
import { InlineStats } from '@/components/patterns/inline-stats'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  ModernEnvironmentSelector,
  NewEnvironmentManager,
} from '@/components/environment'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { useEnvironmentResolver } from '@/hooks/use-environment-request'
import {
  apiDocumentationKeys,
  convertToAPIEndpoints,
  loadApiSpecification,
} from '@/pages/settings/api-documentation-data'
import { ApiDocsToc } from './api-docs-toc'
import { ApiEndpointSection } from './api-endpoint-section'
import { groupEndpoints, resolveBaseUrl } from './api-schema'

/** Topmost visible section while scrolling; the TOC highlights it. */
function useActiveSection(
  root: React.RefObject<HTMLElement | null>,
  watch: unknown,
) {
  const [activeId, setActiveId] = useState<string | null>(null)
  useEffect(() => {
    const element = root.current
    if (!element || typeof IntersectionObserver === 'undefined') return
    const visible = new Map<string, number>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            visible.set(entry.target.id, entry.boundingClientRect.top)
          else visible.delete(entry.target.id)
        }
        const top = [...visible].sort((a, b) => a[1] - b[1])[0]
        if (top) setActiveId(top[0])
      },
      { root: element, rootMargin: '0px 0px -70% 0px' },
    )
    element
      .querySelectorAll('[data-api-section]')
      .forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [root, watch])
  return [activeId, setActiveId] as const
}

/** Reference for the workspace API: an in-page contents list beside the document. */
export function ApiDocsPage() {
  const { t } = useTranslation()
  const [dynamicSource, setDynamicSource] = useState(false)
  const [query, setQuery] = useState('')
  const [managingEnvironments, setManagingEnvironments] = useState(false)
  const scrollRoot = useRef<HTMLDivElement>(null)
  const { copiedStates, copyWithFeedback } = useCopyFeedback()

  const specQuery = useQuery({
    queryKey: apiDocumentationKeys.spec(dynamicSource),
    queryFn: ({ signal }) => loadApiSpecification(dynamicSource, signal),
    staleTime: 60_000,
  })
  const spec = specQuery.data?.spec ?? null
  const endpoints = useMemo(
    () => (spec ? convertToAPIEndpoints(spec) : []),
    [spec],
  )
  const ungrouped = t('settings.apiDocs.ungrouped')
  const groups = useMemo(
    () => groupEndpoints(endpoints, query, ungrouped),
    [endpoints, query, ungrouped],
  )
  const allGroups = useMemo(
    () => groupEndpoints(endpoints, '', ungrouped),
    [endpoints, ungrouped],
  )

  const { currentEnvironment, selectEnvironment, getVariableMap, resolveText } =
    useEnvironmentResolver()
  const baseUrl = resolveBaseUrl(
    currentEnvironment?.base_url,
    getVariableMap(),
    window.location.origin,
  )
  const urlFor = useCallback(
    (path: string) => resolveText(`${baseUrl}${path}`),
    [baseUrl, resolveText],
  )

  const [activeId, setActiveId] = useActiveSection(scrollRoot, groups)
  const navigate = (anchor: string) => {
    setActiveId(anchor)
    // Anchors only contain word characters and dashes (see endpointAnchor).
    scrollRoot.current
      ?.querySelector(`#${anchor}`)
      ?.scrollIntoView({ block: 'start' })
  }
  const tagLabel = (tag: string) =>
    t(`settings.apiDocs.tags.${tag}`, { defaultValue: tag })

  const refresh = () => {
    if (dynamicSource) void specQuery.refetch()
    else setDynamicSource(true)
  }
  const source =
    specQuery.data?.source ?? (dynamicSource ? 'dynamic' : 'static')

  let document
  if (specQuery.isPending)
    document = (
      <PageLoadingState
        compact
        title={t('settings.apiDocs.loading')}
        description={null}
      />
    )
  else if (specQuery.isError)
    document = (
      <PageErrorState
        compact
        title={t('settings.apiDocs.loadFailed')}
        description={null}
        retryLabel={t('common.retry')}
        onRetry={() => void specQuery.refetch()}
      />
    )
  else if (groups.length === 0)
    document = (
      <PageEmptyState
        compact
        title={t(
          query ? 'settings.apiDocs.noMatches' : 'settings.apiDocs.empty',
        )}
        description={null}
      />
    )
  else
    document = groups.map((group) => (
      <section
        key={group.tag}
        aria-label={tagLabel(group.tag)}
        className="mt-space-xl first:mt-0"
      >
        <h2 className="text-sm font-semibold text-text-primary">
          {tagLabel(group.tag)}
        </h2>
        {group.endpoints.map((endpoint) => (
          <ApiEndpointSection
            key={endpoint.id}
            endpoint={endpoint}
            spec={spec}
            url={urlFor(endpoint.path)}
            copiedStates={copiedStates}
            onCopy={copyWithFeedback}
          />
        ))}
      </section>
    ))

  return (
    <div className="flex h-full min-h-0 flex-col md:flex-row">
      <aside className="scroll-area max-h-64 shrink-0 overflow-y-auto border-b border-border-subtle md:max-h-none md:w-64 md:border-r md:border-b-0">
        <ApiDocsToc
          groups={groups}
          query={query}
          onQueryChange={setQuery}
          activeId={activeId}
          onNavigate={navigate}
          tagLabel={tagLabel}
        />
      </aside>
      <div
        ref={scrollRoot}
        data-scroll-root="api-docs"
        className="scroll-area min-h-0 min-w-0 flex-1 overflow-y-auto"
      >
        <article className="mx-auto w-full max-w-[calc(45rem*var(--text-scale,1))] px-space-md py-space-lg sm:px-space-xl">
          <header className="mb-space-lg flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-start gap-space-md">
              <div className="min-w-0 flex-1 basis-60">
                <h2 className="text-base font-semibold text-text-primary">
                  {spec?.info.title || t('settings.apiDocs.title')}
                </h2>
                <p className="mt-space-2xs text-sm text-text-secondary">
                  {t('settings.apiDocs.lead')}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-space-sm">
                <ModernEnvironmentSelector
                  onEnvironmentChange={(id) => {
                    if (id) selectEnvironment(id)
                  }}
                  onManageClick={() => setManagingEnvironments(true)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  loading={specQuery.isFetching}
                  leftIcon={
                    <RefreshCw className="size-icon-sm" aria-hidden="true" />
                  }
                  aria-label={t('settings.api.refreshDocumentation')}
                  onClick={refresh}
                >
                  {t('common.refresh')}
                </Button>
              </div>
            </div>
            {spec ? (
              <InlineStats
                items={[
                  {
                    key: 'version',
                    label: t('settings.apiDocs.version'),
                    value: spec.info.version,
                  },
                  {
                    key: 'endpoints',
                    label: t('settings.apiDocs.endpoints'),
                    value: endpoints.length,
                  },
                  {
                    key: 'groups',
                    label: t('settings.apiDocs.groups'),
                    value: allGroups.length,
                  },
                  {
                    key: 'source',
                    label: t('settings.apiDocs.source'),
                    value: t(`settings.apiDocs.sources.${source}`),
                  },
                  {
                    key: 'baseUrl',
                    label: t('settings.apiDocs.baseUrl'),
                    value: baseUrl,
                  },
                ]}
              />
            ) : null}
            {specQuery.data?.warning ? (
              <Alert variant="warning">
                <AlertDescription>
                  {t('settings.apiDocs.dynamicFallback')}
                </AlertDescription>
              </Alert>
            ) : null}
          </header>
          {document}
        </article>
      </div>
      <NewEnvironmentManager
        isOpen={managingEnvironments}
        onClose={() => setManagingEnvironments(false)}
      />
    </div>
  )
}
