import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, MoreHorizontal, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ActionMenu,
  ActionMenuContent,
  ActionMenuItem,
  ActionMenuTrigger,
} from '@/components/ui/action-menu'
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
            <Loader2 className="size-icon-sm animate-spin text-text-tertiary" />
          ) : (
            <MoreHorizontal className="size-icon-sm" />
          )}
        </Button>
      </ActionMenuTrigger>
      <ActionMenuContent align="end" className="min-w-40">
        <ActionMenuItem onSelect={() => request('regenerate')}>
          <RefreshCw className="size-icon-sm" />
          {t('settings.apiKeys.actions.regenerate')}
        </ActionMenuItem>
        <ActionMenuItem danger onSelect={() => request('delete')}>
          <Trash2 className="size-icon-sm" />
          {t('settings.apiKeys.actions.delete')}
        </ActionMenuItem>
      </ActionMenuContent>
    </ActionMenu>
  )
}
