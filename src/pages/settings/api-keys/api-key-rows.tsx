import { useTranslation } from 'react-i18next'
import { Check, Copy, KeyRound } from 'lucide-react'
import { EntityAvatar } from '@/components/patterns/entity-avatar'
import { SettingRow } from '@/components/patterns/setting-row'
import { Button } from '@/components/ui/button'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import { getCurrentLanguage } from '@/locales/i18n'
import { apiKeysCapabilities } from '@/pages/settings/api-keys-capabilities'
import type { ApiKey } from '@/pages/settings/api-keys-types'
import type { ApiKeyAction } from '@/pages/settings/components/api-key-action-dialog'
import { ApiKeyRowActions } from '@/pages/settings/components/api-key-row-actions'

/** Only the masked form is ever rendered; the full token is copied, never shown. */
export const maskToken = (token: string) => {
  if (token.length <= 8) return '•'.repeat(token.length)
  return `${token.slice(0, 4)}${'•'.repeat(12)}${token.slice(-4)}`
}

const formatDate = (value: string | null) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(getCurrentLanguage(), {
    dateStyle: 'medium',
  }).format(date)
}

interface ApiKeyRowsProps {
  apiKeys: ApiKey[]
  pendingTokens: Set<string>
  onAction: (action: ApiKeyAction) => void
}

/** One setting row per key: name and notes on the left, token and actions on the right. */
export const ApiKeyRows = ({
  apiKeys,
  pendingTokens,
  onAction,
}: ApiKeyRowsProps) => {
  const { t } = useTranslation()
  const { copiedStates, copyWithFeedback } = useCopyFeedback()
  return (
    <ul aria-label={t('settings.apiKeys.page.listLabel')}>
      {apiKeys.map((apiKey) => {
        const copyKey = `token-${apiKey.token}`
        const created = formatDate(apiKey.create_date)
        const meta = [
          apiKey.description,
          created && t('settings.apiKeys.page.createdOn', { date: created }),
        ].filter(Boolean)
        return (
          <li key={apiKey.token} data-slot="api-key-row">
            <SettingRow
              leading={
                <EntityAvatar
                  name={apiKey.name}
                  seed={`${apiKey.name}:${apiKey.create_date ?? ''}`}
                  icon={<KeyRound aria-hidden="true" />}
                  size="md"
                />
              }
              label={apiKey.name}
              description={meta.length ? meta.join(' · ') : undefined}
            >
              <code className="font-mono text-xs text-text-tertiary">
                {maskToken(apiKey.token)}
              </code>
              {apiKeysCapabilities.copy.enabled ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('settings.apiKeys.manager.copyToken', {
                    name: apiKey.name,
                  })}
                  onClick={() => copyWithFeedback(apiKey.token, copyKey)}
                >
                  {copiedStates[copyKey] ? (
                    <Check
                      className="size-icon-sm text-status-success"
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy className="size-icon-sm" aria-hidden="true" />
                  )}
                </Button>
              ) : null}
              <ApiKeyRowActions
                apiKey={apiKey}
                busy={pendingTokens.has(apiKey.token)}
                onAction={onAction}
              />
            </SettingRow>
          </li>
        )
      })}
    </ul>
  )
}
