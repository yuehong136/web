import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayKey } from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  useRevokeGatewayKey,
  useUpdateGatewayKey,
} from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import { PREFIX, gatewayErrorKey } from '../../utils'

/** Edit, disable/enable, rotate and revoke one key. */
export function KeyActions({
  gatewayKey: key,
  onEdit,
  onRotate,
}: {
  gatewayKey: GatewayKey
  onEdit: () => void
  onRotate: () => void
}) {
  const { t } = useTranslation()
  const updateMutation = useUpdateGatewayKey()
  const revokeMutation = useRevokeGatewayKey()
  const [confirming, setConfirming] = useState(false)
  const revoked = key.status === 'revoked'
  const busy = updateMutation.isPending || revokeMutation.isPending

  const toggle = async () => {
    const activating = key.status !== 'active'
    try {
      await updateMutation.mutateAsync({
        id: key.id,
        input: { status: activating ? 'active' : 'disabled' },
      })
      toast.success(
        t(
          activating
            ? `${PREFIX}.messages.enabled`
            : `${PREFIX}.messages.disabled`,
        ),
      )
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'key')))
    }
  }

  const revoke = async () => {
    try {
      await revokeMutation.mutateAsync(key.id)
      toast.success(t(`${PREFIX}.messages.revoked`))
      setConfirming(false)
    } catch (error) {
      if (getMutationErrorNotice(error))
        toast.error(t(gatewayErrorKey(error, 'key')))
    }
  }

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex flex-wrap gap-space-sm">
        <Button
          size="sm"
          variant="outline"
          disabled={busy || revoked}
          onClick={onEdit}
        >
          {t(`${PREFIX}.common.edit`)}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || revoked}
          onClick={() => void toggle()}
        >
          {t(
            key.status === 'active'
              ? `${PREFIX}.common.disable`
              : `${PREFIX}.common.enable`,
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy || revoked}
          onClick={onRotate}
        >
          {t(`${PREFIX}.keys.detail.rotate`)}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-danger-fg hover:text-danger-fg"
          disabled={busy || revoked}
          onClick={() => setConfirming(true)}
        >
          {t(`${PREFIX}.keys.detail.revoke`)}
        </Button>
      </div>
      {revoked ? null : (
        <p className="text-xs text-fg-subtle">
          {t(`${PREFIX}.keys.detail.rotateHint`)}
        </p>
      )}
      <ConfirmDialog
        variant="destructive"
        open={confirming}
        onOpenChange={setConfirming}
        title={t(`${PREFIX}.keys.revokeTitle`)}
        description={t(`${PREFIX}.keys.revokeDescription`, {
          name: key.name,
        })}
        cancelLabel={t('common.cancel')}
        confirmLabel={t(`${PREFIX}.keys.detail.revoke`)}
        pending={revokeMutation.isPending}
        onConfirm={() => void revoke()}
      />
    </div>
  )
}
