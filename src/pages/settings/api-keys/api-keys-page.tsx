import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BookOpen, Plus, Search } from 'lucide-react'
import { systemAPI } from '@/api/system'
import { SettingsTemplate } from '@/components/page-templates/settings-template'
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns/page-states'
import { Pager } from '@/components/patterns/pager'
import { SettingRow, SettingSection } from '@/components/patterns/setting-row'
import { SETTINGS_CARD } from '@/pages/settings/components/settings-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useApiTokens,
  usePendingApiTokens,
} from '@/hooks/use-api-token-request'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { apiKeysCapabilities } from '@/pages/settings/api-keys-capabilities'
import type { ApiKey } from '@/pages/settings/api-keys-types'
import {
  ApiKeyActionDialog,
  type ApiKeyAction,
} from '@/pages/settings/components/api-key-action-dialog'
import {
  CreateApiKeyDialog,
  type CreateApiKeySubmitData,
} from '@/pages/settings/components/create-api-key-dialog'
import { KeyRevealDialog } from '@/pages/settings/components/key-reveal-dialog'
import { API_DOCS_PATH } from '@/pages/settings/settings-routes'
import { ApiKeyRows } from './api-key-rows'

const PAGE_SIZE = 10

/** Keys for calling the workspace API: create, copy, regenerate and revoke. */
export function ApiKeysPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [action, setAction] = useState<ApiKeyAction | null>(null)
  // The one-time secret stays in this component until the dialog closes.
  const [revealed, setRevealed] = useState<ApiKey | null>(null)
  const pendingTokens = usePendingApiTokens()
  const tokenQuery = useApiTokens({ enabled: true })

  const debouncedSearch = useDebouncedValue(searchQuery, 300)
  const [previousSearch, setPreviousSearch] = useState(debouncedSearch)
  if (previousSearch !== debouncedSearch) {
    setPreviousSearch(debouncedSearch)
    setPage(1)
  }
  const allKeys = tokenQuery.data ?? []
  const needle = debouncedSearch.trim().toLowerCase()
  const filteredKeys = allKeys.filter(
    (key) =>
      !needle ||
      key.name.toLowerCase().includes(needle) ||
      key.description?.toLowerCase().includes(needle),
  )
  const total = filteredKeys.length
  // Deleting the last key on the final page must not strand the view past the end.
  const currentPage = Math.min(page, Math.max(1, Math.ceil(total / PAGE_SIZE)))
  const pageKeys = filteredKeys.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const createKey = async ({ name, description }: CreateApiKeySubmitData) => {
    setCreating(true)
    try {
      const created = await systemAPI.createToken({ name, description })
      setCreateOpen(false)
      setRevealed(created)
      void tokenQuery.refetch()
    } finally {
      setCreating(false)
    }
  }

  const createLabel = t('settings.apiKeys.manager.create')
  const createButton = apiKeysCapabilities.create.enabled ? (
    <Button
      size="sm"
      leftIcon={<Plus className="size-icon-sm" aria-hidden="true" />}
      onClick={() => setCreateOpen(true)}
    >
      {createLabel}
    </Button>
  ) : null

  let keysBody
  if (tokenQuery.isPending)
    keysBody = (
      <PageLoadingState
        compact
        title={t('common.loading')}
        description={null}
      />
    )
  else if (tokenQuery.isError)
    keysBody = (
      <PageErrorState
        compact
        titleAs="h3"
        title={t('settings.apiKeys.page.loadFailed')}
        description={null}
        retryLabel={t('common.retry')}
        onRetry={() => void tokenQuery.refetch()}
      />
    )
  else if (total === 0)
    keysBody = (
      <PageEmptyState
        compact
        title={t(
          needle
            ? 'settings.apiKeys.manager.noMatches'
            : 'settings.apiKeys.manager.empty',
        )}
        description={
          needle
            ? null
            : t('settings.apiKeys.manager.emptyHint', { action: createLabel })
        }
      />
    )
  else
    keysBody = (
      <ApiKeyRows
        apiKeys={pageKeys}
        pendingTokens={pendingTokens}
        onAction={setAction}
      />
    )

  return (
    <>
      <SettingsTemplate
        width="wide"
        description={t('settings.apiKeys.page.description')}
      >
        <SettingSection
          className={SETTINGS_CARD}
          title={t('settings.apiKeys.page.keysTitle')}
          description={
            allKeys.length
              ? t('settings.apiKeys.manager.total', { count: allKeys.length })
              : undefined
          }
          actions={createButton}
        >
          {allKeys.length > 0 ? (
            <div className="pb-space-sm">
              <Input
                type="search"
                inputSize="sm"
                className="sm:w-64"
                leftIcon={
                  <Search className="size-icon-sm" aria-hidden="true" />
                }
                aria-label={t('settings.apiKeys.manager.search')}
                placeholder={t('settings.apiKeys.manager.searchPlaceholder')}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          ) : null}
          {keysBody}
          {total > PAGE_SIZE ? (
            <div className="flex justify-end border-t border-line-subtle pt-space-sm">
              <Pager
                page={currentPage}
                pageSize={PAGE_SIZE}
                total={total}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </SettingSection>

        <SettingSection
          title={t('settings.apiKeys.capabilities.title')}
          className={SETTINGS_CARD}
        >
          <SettingRow
            label={t('settings.apiKeys.capabilities.scopes')}
            description={t(apiKeysCapabilities.scopes.reasonKey)}
          />
          <SettingRow
            label={t('settings.apiKeys.capabilities.edit')}
            description={t(apiKeysCapabilities.edit.reasonKey)}
          />
          <SettingRow
            label={t('settings.apiKeys.capabilities.reference')}
            description={t('settings.apiKeys.capabilities.referenceHint')}
          >
            <Button asChild variant="outline" size="sm">
              <Link to={API_DOCS_PATH}>
                <BookOpen className="size-icon-sm" aria-hidden="true" />
                {t('settings.apiKeys.capabilities.openDocs')}
              </Link>
            </Button>
          </SettingRow>
        </SettingSection>
      </SettingsTemplate>

      <CreateApiKeyDialog
        open={createOpen}
        isLoading={creating}
        onOpenChange={setCreateOpen}
        onSubmit={createKey}
      />
      <ApiKeyActionDialog
        action={action}
        onClose={() => setAction(null)}
        onRegenerated={setRevealed}
      />
      <KeyRevealDialog
        plaintext={revealed?.token ?? null}
        labels={{
          title: t('settings.apiKeys.reveal.title', {
            name: revealed?.name ?? '',
          }),
          description: t('settings.apiKeys.reveal.description'),
          usage: t('settings.apiKeys.reveal.usage'),
          done: t('settings.apiKeys.reveal.done'),
        }}
        onClose={() => setRevealed(null)}
      />
    </>
  )
}
