import { useState, type ReactNode } from 'react'
import { Plus, PowerOff } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { isMissingRouteError } from '@/api/legacy-fallback'
import type { GatewayKey, GatewayKeyCreated } from '@/api/model-gateway'
import {
  Inspector,
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
  type InspectorPanelProps,
} from '@/components/patterns'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useFetchGatewayCatalog,
  useFetchGatewayKeys,
} from '@/hooks/use-model-gateway-request'
import { KeyCreatedDialog } from './components/key-created-dialog'
import { KeyFormSheet } from './components/key-form/key-form-sheet'
import { KeyActions } from './components/keys/key-actions'
import { RotateKeyDialog } from './components/keys/rotate-key-dialog'
import { KeyDetail } from './components/keys/key-detail'
import { KeysPanel } from './components/keys/keys-panel'
import { LogDetail, logDetailTitle } from './components/logs/log-detail'
import { LogsPanel } from './components/logs/logs-panel'
import { ModelsPanel } from './components/models/models-panel'
import { OverviewPanel } from './components/overview/overview-panel'
import {
  GATEWAY_TABS,
  parseTab,
  type GatewayNavigate,
  type GatewaySelection,
  type KeyFormRequest,
} from './constants'
import { PREFIX } from './utils'

// One scope for every selection: a changing scope would close the panel.
const SCOPE = 'model-gateway'
const CLOSED: InspectorPanelProps = {
  open: false,
  scopeKey: SCOPE,
  onOpenChange: () => {},
  title: '',
  content: null,
}

/**
 * Model gateway management: overview, the model catalog, keys and request
 * logs. Every registered model of a connected provider is in the catalog;
 * keys choose which of the open ones they may call.
 *
 * The gateway is an optional server feature. While it is off, its routes do
 * not exist, and the page says so instead of showing an error.
 */
export const ModelGatewayPage = () => {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const tab = parseTab(params.get('tab'))
  const catalogQuery = useFetchGatewayCatalog()
  const keysQuery = useFetchGatewayKeys()
  const [form, setForm] = useState<KeyFormRequest | null>(null)
  // The one-time plaintext stays in this state until the dialog closes.
  const [created, setCreated] = useState<{
    key: GatewayKeyCreated
    rotated: boolean
  } | null>(null)
  const [rotating, setRotating] = useState<GatewayKey | null>(null)
  const [selection, setSelection] = useState<GatewaySelection | null>(null)

  const navigate: GatewayNavigate = (next, extra = {}) => {
    setSelection(null)
    setParams(next === 'overview' ? extra : { tab: next, ...extra })
  }

  const error = catalogQuery.error ?? keysQuery.error
  const pending = catalogQuery.isPending || keysQuery.isPending
  const catalog = catalogQuery.data
  const keys = keysQuery.data ?? []

  let body: ReactNode = null
  if (pending)
    body = <PageLoadingState compact title={t(`${PREFIX}.loading`)} />
  else if (isMissingRouteError(error))
    body = (
      <PageEmptyState
        compact
        title={t(`${PREFIX}.disabled.title`)}
        description={t(`${PREFIX}.disabled.description`)}
        icon={<PowerOff className="size-icon-lg" aria-hidden="true" />}
      />
    )
  else if (error || !catalog)
    body = (
      <PageErrorState
        compact
        titleAs="h2"
        title={t(`${PREFIX}.loadFailed`)}
        retryLabel={t('common.retry')}
        onRetry={() => {
          void catalogQuery.refetch()
          void keysQuery.refetch()
        }}
      />
    )
  // The catalog once the page can show its tabs, otherwise null.
  const ready = body === null && catalog ? catalog : null

  const selectedKey =
    selection?.kind === 'key'
      ? keys.find((key) => key.id === selection.id)
      : undefined
  const close = () => setSelection(null)
  let inspector = CLOSED
  if (ready && tab === 'keys' && selectedKey)
    inspector = {
      open: true,
      onOpenChange: (open) => (open ? undefined : close()),
      scopeKey: SCOPE,
      title: selectedKey.name,
      description: selectedKey.redacted_key,
      content: (
        <KeyDetail
          gatewayKey={selectedKey}
          catalog={ready}
          onViewLogs={() =>
            navigate('logs', { key: selectedKey.id, range: '30' })
          }
        />
      ),
      footer: (
        <KeyActions
          gatewayKey={selectedKey}
          onEdit={() => setForm({ mode: 'edit', key: selectedKey })}
          onRotate={() => setRotating(selectedKey)}
        />
      ),
    }
  else if (ready && tab === 'logs' && selection?.kind === 'log')
    inspector = {
      open: true,
      onOpenChange: (open) => (open ? undefined : close()),
      scopeKey: SCOPE,
      title: logDetailTitle(t, selection.log),
      content: <LogDetail log={selection.log} />,
    }

  const createButton =
    ready && tab !== 'logs' ? (
      <Button
        size="sm"
        leftIcon={<Plus className="size-icon-sm" aria-hidden="true" />}
        onClick={() => setForm({ mode: 'create' })}
      >
        {t(`${PREFIX}.keys.create`)}
      </Button>
    ) : undefined

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => navigate(parseTab(value))}
      className="h-full"
    >
      <Inspector {...inspector}>
        <SettingsTemplate
          width="wide"
          actions={createButton}
          tabs={
            ready ? (
              <TabsList
                aria-label={t(`${PREFIX}.tabsLabel`)}
                className="min-h-0 border-b-0"
              >
                {GATEWAY_TABS.map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {t(`${PREFIX}.tabs.${item}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            ) : undefined
          }
        >
          {ready ? (
            <>
              <TabsContent value="overview" className="mt-0">
                <OverviewPanel
                  catalog={ready}
                  keys={keys}
                  onNavigate={navigate}
                />
              </TabsContent>
              <TabsContent value="models" className="mt-0">
                <ModelsPanel catalog={ready} />
              </TabsContent>
              <TabsContent value="keys" className="mt-0">
                <KeysPanel
                  keys={keys}
                  catalog={ready}
                  selectedId={selectedKey?.id ?? null}
                  onSelect={(id) => setSelection({ kind: 'key', id })}
                  onCreate={() => setForm({ mode: 'create' })}
                />
              </TabsContent>
              <TabsContent value="logs" className="mt-0">
                <LogsPanel
                  keys={keys}
                  catalog={ready}
                  selectedId={
                    selection?.kind === 'log' ? selection.log.id : null
                  }
                  onSelect={(log) => setSelection({ kind: 'log', log })}
                />
              </TabsContent>
            </>
          ) : (
            body
          )}
        </SettingsTemplate>
      </Inspector>
      {form && catalog ? (
        <KeyFormSheet
          request={form}
          catalog={catalog}
          onClose={() => setForm(null)}
          onCreated={(key) => setCreated({ key, rotated: false })}
        />
      ) : null}
      {rotating ? (
        <RotateKeyDialog
          gatewayKey={rotating}
          onClose={() => setRotating(null)}
          onRotated={(key) => setCreated({ key, rotated: true })}
        />
      ) : null}
      {created && catalog ? (
        <KeyCreatedDialog
          created={created.key}
          rotated={created.rotated}
          catalog={catalog}
          onClose={() => {
            setCreated(null)
            if (tab === 'keys')
              setSelection({ kind: 'key', id: created.key.id })
          }}
        />
      ) : null}
    </Tabs>
  )
}
