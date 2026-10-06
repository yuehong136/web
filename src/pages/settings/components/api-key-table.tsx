import { useTranslation } from 'react-i18next'
import { Check, Copy, Key, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCopyFeedback } from '@/hooks/use-copy-feedback'
import type { ApiKey } from '@/pages/settings/api-keys-types'
import type { ApiKeyAction } from '@/pages/settings/components/api-key-action-dialog'
import { ApiKeyRowActions } from '@/pages/settings/components/api-key-row-actions'

const ROW_GRID = 'grid grid-cols-12 gap-space-base p-space-md'

/** Only the masked form is ever rendered; the full token is copied, never shown. */
const maskToken = (token: string) => {
  if (token.length <= 8) return '•'.repeat(token.length)
  return token.slice(0, 4) + '•'.repeat(20) + token.slice(-4)
}

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr)
  if (!dateStr || Number.isNaN(date.getTime())) return dateStr
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface ApiKeyTableProps {
  apiKeys: ApiKey[]
  loading: boolean
  /** A search is active, so an empty list means "no matches", not "no keys". */
  searching: boolean
  pendingTokens: Set<string>
  onAction: (action: ApiKeyAction) => void
}

export const ApiKeyTable = ({
  apiKeys,
  loading,
  searching,
  pendingTokens,
  onAction,
}: ApiKeyTableProps) => {
  const { t } = useTranslation()
  const { copiedStates, copyWithFeedback } = useCopyFeedback()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-space-md text-center">
          <Loader2 className="mx-auto size-icon-xl animate-spin text-text-tertiary" />
          <p className="text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-border-default bg-background-subtle">
        <div className={`${ROW_GRID} text-sm font-semibold`}>
          <div className="col-span-2">
            {t('settings.apiKeys.manager.columns.name')}
          </div>
          <div className="col-span-3">
            {t('settings.apiKeys.manager.columns.token')}
          </div>
          <div className="col-span-2">
            {t('settings.apiKeys.manager.columns.description')}
          </div>
          <div className="col-span-2">
            {t('settings.apiKeys.manager.columns.created')}
          </div>
          <div className="col-span-2">
            {t('settings.apiKeys.manager.columns.updated')}
          </div>
          <div className="col-span-1 text-center">
            {t('settings.apiKeys.manager.columns.actions')}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {apiKeys.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center text-text-secondary">
              <Key className="mx-auto mb-space-md size-icon-2xl opacity-30" />
              {searching ? (
                <p>{t('settings.apiKeys.manager.noMatches')}</p>
              ) : (
                <>
                  <p>{t('settings.apiKeys.manager.empty')}</p>
                  <p className="mt-space-xs text-sm">
                    {t('settings.apiKeys.manager.emptyHint', {
                      action: t('settings.apiKeys.manager.create'),
                    })}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border-default">
            {apiKeys.map((apiKey) => {
              const copyKey = `token-${apiKey.token}`
              return (
                <div
                  key={apiKey.token}
                  className={`${ROW_GRID} transition-colors hover:bg-state-hover`}
                >
                  <div className="col-span-2 font-medium">{apiKey.name}</div>

                  <div className="col-span-3 flex items-center gap-space-sm">
                    <code className="flex-1 truncate rounded-radius-sm bg-background-subtle px-space-sm py-space-xs font-mono text-sm">
                      {maskToken(apiKey.token)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label={t('settings.apiKeys.manager.copyToken', {
                        name: apiKey.name,
                      })}
                      onClick={() => copyWithFeedback(apiKey.token, copyKey)}
                    >
                      {copiedStates[copyKey] ? (
                        <Check className="size-icon-xs text-status-success" />
                      ) : (
                        <Copy className="size-icon-xs" />
                      )}
                    </Button>
                  </div>

                  <div className="col-span-2 min-w-0 text-sm text-text-secondary">
                    {apiKey.description ? (
                      // The trigger itself must be the truncating block, and a
                      // button so keyboard users can reveal the full text.
                      <TooltipProvider delayDuration={200}>
                        <TooltipRoot>
                          <TooltipTrigger className="block w-full cursor-help truncate text-left">
                            {apiKey.description}
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-sm">
                            {apiKey.description}
                          </TooltipContent>
                        </TooltipRoot>
                      </TooltipProvider>
                    ) : (
                      '—'
                    )}
                  </div>

                  <div className="col-span-2 font-mono text-sm text-text-secondary">
                    {formatDateTime(apiKey.create_date)}
                  </div>

                  <div className="col-span-2 font-mono text-sm text-text-secondary">
                    {apiKey.update_date
                      ? formatDateTime(apiKey.update_date)
                      : '—'}
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <ApiKeyRowActions
                      apiKey={apiKey}
                      busy={pendingTokens.has(apiKey.token)}
                      onAction={onAction}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
