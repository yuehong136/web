import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog } from '@/api/model-gateway'
import { ProviderLogo } from '@/components/patterns/provider-logo'
import { Badge } from '@/components/ui/badge'
import { scopeByProvider, staleGrants, type KeyScope } from '../../catalog'
import { PREFIX } from '../../utils'

/** "All models", or "Tongyi-Qianwen all · VLLM 1". */
export function scopeSummary(
  t: TFunction,
  catalog: GatewayCatalog,
  scope: KeyScope,
): { text: string; providers: string[] } {
  if (scope.allModels)
    return {
      text: t(`${PREFIX}.keys.scopeAll`),
      providers: [
        ...new Set(
          catalog.connections.map((connection) => connection.provider),
        ),
      ],
    }
  const parts = scopeByProvider(catalog, scope)
  if (parts.length === 0)
    return { text: t(`${PREFIX}.keys.scopeNone`), providers: [] }
  return {
    text: parts
      .map((part) =>
        part.whole
          ? t(`${PREFIX}.keys.scopeProviderAll`, { provider: part.provider })
          : t(`${PREFIX}.keys.scopeProviderCount`, {
              provider: part.provider,
              value: part.count,
            }),
      )
      .join(' · '),
    providers: parts.map((part) => part.provider),
  }
}

const MAX_LOGOS = 3

/** Provider logos, the scope summary and a warning for stale grants. */
export function KeyScopeCell({
  catalog,
  scope,
}: {
  catalog: GatewayCatalog
  scope: KeyScope
}) {
  const { t } = useTranslation()
  const summary = scopeSummary(t, catalog, scope)
  const stale = staleGrants(catalog, scope).count
  return (
    <div className="flex min-w-0 items-start gap-space-sm">
      {summary.providers.length > 0 ? (
        <span
          className="mt-space-2xs flex shrink-0 -space-x-1"
          aria-hidden="true"
        >
          {summary.providers.slice(0, MAX_LOGOS).map((provider) => (
            <ProviderLogo
              key={provider}
              provider={provider}
              size="xs"
              className="ring-2 ring-surface"
            />
          ))}
        </span>
      ) : null}
      <div className="min-w-0">
        <div className="text-sm text-fg-muted">{summary.text}</div>
        {stale > 0 ? (
          <Badge tone="warning" className="mt-space-2xs">
            {t(`${PREFIX}.keys.stale`, { count: stale })}
          </Badge>
        ) : null}
      </div>
    </div>
  )
}
