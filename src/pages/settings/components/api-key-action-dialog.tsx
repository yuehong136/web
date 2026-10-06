import { useTranslation } from 'react-i18next'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import {
  ApiTokenRevokeError,
  useDeleteApiToken,
  useRegenerateApiToken,
} from '@/hooks/use-api-token-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import type { ApiKey } from '@/pages/settings/api-keys-types'

export interface ApiKeyAction {
  kind: 'delete' | 'regenerate'
  apiKey: ApiKey
  returnFocus: HTMLElement | null
}

const confirmationCopy = {
  delete: {
    title: 'settings.apiKeys.delete.title',
    description: 'settings.apiKeys.delete.description',
    confirm: 'settings.apiKeys.delete.confirm',
  },
  regenerate: {
    title: 'settings.apiKeys.regenerate.title',
    description: 'settings.apiKeys.regenerate.description',
    confirm: 'settings.apiKeys.regenerate.confirm',
  },
} as const

interface ApiKeyActionDialogProps {
  action: ApiKeyAction | null
  onClose: () => void
}

export const ApiKeyActionDialog = ({
  action,
  onClose,
}: ApiKeyActionDialogProps) => {
  const { t } = useTranslation()
  const deleteToken = useDeleteApiToken()
  const regenerateToken = useRegenerateApiToken()
  const revokeToken = useDeleteApiToken()
  const pending = deleteToken.isPending || regenerateToken.isPending
  const copy = action ? confirmationCopy[action.kind] : null

  const regenerate = async (apiKey: ApiKey) => {
    try {
      await regenerateToken.mutateAsync(apiKey)
      toast.success(t('settings.apiKeys.regenerate.success'))
    } catch (error) {
      if (!(error instanceof ApiTokenRevokeError)) {
        if (getMutationErrorNotice(error)) {
          toast.error(t('settings.apiKeys.regenerate.failed'))
        }
        throw error
      }
      // The replacement exists, so retrying the dialog would mint another key.
      toast.warning(t('settings.apiKeys.regenerate.partial'), {
        description: t('settings.apiKeys.regenerate.partialDescription'),
        duration: Infinity,
        action: {
          label: t('settings.apiKeys.regenerate.retryRevoke'),
          onClick: () =>
            revokeToken.mutate(
              { token: apiKey.token },
              {
                onSuccess: () =>
                  toast.success(t('settings.apiKeys.regenerate.revoked')),
              },
            ),
        },
      })
    }
  }

  const confirm = async () => {
    if (!action) return
    try {
      if (action.kind === 'regenerate') {
        await regenerate(action.apiKey)
      } else {
        await deleteToken.mutateAsync({ token: action.apiKey.token })
        toast.success(t('settings.apiKeys.delete.success'))
      }
      onClose()
    } catch {
      // Feedback is already shown; keep the dialog open for review and retry.
    }
  }

  return (
    <ConfirmationDialog
      open={Boolean(action)}
      onOpenChange={(open) => {
        if (!open && !pending) onClose()
      }}
      title={copy ? t(copy.title) : ''}
      description={
        copy ? t(copy.description, { name: action?.apiKey.name }) : ''
      }
      cancelLabel={t('common.cancel')}
      confirmLabel={copy ? t(copy.confirm) : ''}
      pending={pending}
      returnFocus={action?.returnFocus}
      onConfirm={() => void confirm()}
    />
  )
}
