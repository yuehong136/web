import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { adminAPI, getAdminToken } from '@/api/admin'
import { Button } from '@/components/ui/button'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { SegmentedControl } from '@/components/ui/segmented-control'
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
        description={null}
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
    <SettingsTemplate
      description={
        <>
          {t('sandbox.description')}{' '}
          <span className="text-text-tertiary">
            {t('sandbox.active', {
              provider: config.data.effective_provider_type,
            })}
          </span>
        </>
      }
    >
      <SettingSection>
        <SettingRow label={t('sandbox.providers')}>
          <SegmentedControl
            aria-label={t('sandbox.providers')}
            size="sm"
            value={provider ?? ''}
            onValueChange={setSelected}
            options={providers.data.map((item) => ({
              value: item.id,
              label: item.available
                ? item.name
                : `${item.name} · ${t('sandbox.disabled')}`,
            }))}
          />
        </SettingRow>
      </SettingSection>
      <div className="mt-space-lg">
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
    </SettingsTemplate>
  )
}
