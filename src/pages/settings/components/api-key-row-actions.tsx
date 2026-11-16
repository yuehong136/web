import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
import { apiKeysCapabilities } from '@/pages/settings/api-keys-capabilities'
import type { ApiKey } from '@/pages/settings/api-keys-types'
import type { ApiKeyAction } from '@/pages/settings/components/api-key-action-dialog'

interface ApiKeyRowActionsProps {
  apiKey: ApiKey
  busy: boolean
  onAction: (action: ApiKeyAction) => void
}

export const ApiKeyRowActions = ({
  apiKey,
  busy,
  onAction,
}: ApiKeyRowActionsProps) => {
  const { t } = useTranslation()
  const trigger = React.useRef<HTMLButtonElement>(null)
  const request = (kind: ApiKeyAction['kind']) =>
    onAction({ kind, apiKey, returnFocus: trigger.current })
  return (
    <ActionMenu>
      <ActionMenuTrigger asChild>
        <Button
          ref={trigger}
          variant="ghost"
          size="icon-sm"
          disabled={busy}
          aria-busy={busy}
          aria-label={t('settings.apiKeys.actions.menu', { name: apiKey.name })}
        >
          {busy ? (
            <Spinner size="sm" />
          ) : (
            <MoreHorizontal className="size-icon-sm" />
          )}
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end" className="min-w-40">
        {apiKeysCapabilities.regenerate.enabled ? (
          <ActionMenuItem onSelect={() => request('regenerate')}>
            <RefreshCw className="size-icon-sm" />
            {t('settings.apiKeys.actions.regenerate')}
          </ActionMenuItem>
        ) : null}
        {apiKeysCapabilities.revoke.enabled ? (
          <ActionMenuItem danger onSelect={() => request('delete')}>
            <Trash2 className="size-icon-sm" />
            {t('settings.apiKeys.actions.delete')}
          </ActionMenuItem>
        ) : null}
      </ActionMenuContent>
    </ActionMenu>
  )
}
