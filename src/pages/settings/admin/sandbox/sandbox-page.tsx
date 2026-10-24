import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { adminAPI, getAdminToken } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { ConsolePageTemplate } from '@/components/page-templates'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { SandboxForm } from './sandbox-form'

export function SandboxPage() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string>()
  const authenticated = Boolean(getAdminToken())
  const providers = useQuery({
    queryKey: ['admin', 'sandbox', 'providers'],
    queryFn: adminAPI.listSandboxProviders,
    enabled: authenticated,
    retry: false,
  })
  const config = useQuery({
    queryKey: ['admin', 'sandbox', 'config', selected],
    queryFn: () => adminAPI.getSandboxConfig(selected),
    enabled: authenticated,
    retry: false,
    gcTime: 0,
  })
  const provider = selected ?? config.data?.provider_type
  const schema = useQuery({
    queryKey: ['admin', 'sandbox', 'schema', provider],
    queryFn: () => adminAPI.getSandboxSchema(provider!),
    enabled: Boolean(provider) && authenticated,
    retry: false,
  })
  const error = providers.error ?? config.error ?? schema.error
  if (!authenticated)
    return (
      <PageEmptyState
        title={t('sandbox.adminRequired')}
        description={t('sandbox.adminHint')}
        action={
          <Button asChild>
            <Link to="/settings/admin">{t('sandbox.adminLogin')}</Link>
          </Button>
        }
      />
    )
  if (error)
    return (
      <PageErrorState
        title={t('sandbox.loadFailed')}
        description={error.message}
        onRetry={() => {
          void providers.refetch()
          void config.refetch()
          void schema.refetch()
        }}
      />
    )
  if (!providers.data || !config.data || !schema.data)
    return <PageLoadingState />
  return (
    <ConsolePageTemplate>
      <div className="mx-auto w-full max-w-5xl space-y-space-lg p-space-base md:p-space-xl">
        <div className="space-y-space-xs">
          <h2 className="text-lg font-semibold">{t('sandbox.title')}</h2>
          <p className="text-sm text-text-secondary">
            {t('sandbox.description')}
          </p>
          <p className="text-xs text-text-caption">
            {t('sandbox.active', {
              provider: config.data.effective_provider_type,
            })}
          </p>
        </div>
        <div
          className="flex flex-wrap gap-space-sm"
          aria-label={t('sandbox.providers')}
        >
          {providers.data.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={item.id === provider ? 'default' : 'outline'}
              aria-pressed={item.id === provider}
              onClick={() => setSelected(item.id)}
            >
              {item.name}
              {!item.available ? ` · ${t('sandbox.disabled')}` : ''}
            </Button>
          ))}
        </div>
        <SandboxForm
          key={config.data.provider_type}
          saved={config.data}
          schema={schema.data}
          available={
            providers.data.find((item) => item.id === provider)?.available ??
            false
          }
        />
      </div>
    </ConsolePageTemplate>
  )
}
