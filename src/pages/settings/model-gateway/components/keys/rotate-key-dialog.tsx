import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayKey, GatewayKeyCreated } from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useRotateGatewayKey } from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { PREFIX, gatewayErrorKey } from '../../utils'

/** How long the replaced secret keeps working, in seconds. */
export const GRACE_PERIODS = [
  { id: 'none', seconds: 0 },
  { id: 'hour', seconds: 3600 },
  { id: 'day', seconds: 86_400 },
  { id: 'week', seconds: 604_800 },
] as const
type GraceId = (typeof GRACE_PERIODS)[number]['id']

/**
 * Gives a key a new secret. The key itself — its name, scope, limits, usage
 * and logs — stays; the old secret works until the chosen grace period ends.
 */
export function RotateKeyDialog({
  gatewayKey: key,
  onClose,
  onRotated,
}: {
  gatewayKey: GatewayKey
  onClose: () => void
  onRotated: (rotated: GatewayKeyCreated) => void
}) {
  const { t } = useTranslation()
  const mutation = useRotateGatewayKey()
  const [grace, setGrace] = useState<GraceId>('day')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const pending = mutation.isPending

  const close = () => {
    if (!pending) onClose()
  }

  const rotate = async () => {
    setErrorKey(null)
    try {
      const rotated = await mutation.mutateAsync({
        id: key.id,
        gracePeriodSeconds:
          GRACE_PERIODS.find((item) => item.id === grace)?.seconds ?? 0,
      })
      // The plaintext now belongs to the caller; drop it from the mutation.
      mutation.reset()
      onRotated(rotated)
      onClose()
    } catch (error) {
      if (getMutationErrorNotice(error))
        setErrorKey(gatewayErrorKey(error, 'key'))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent size="sm" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>
            {t(`${PREFIX}.keys.rotate.title`, { name: key.name })}
          </DialogTitle>
          <DialogDescription>
            {t(`${PREFIX}.keys.rotate.description`)}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-space-md">
          <fieldset className="space-y-space-xs">
            <legend className="text-sm font-medium text-fg">
              {t(`${PREFIX}.keys.rotate.graceTitle`)}
            </legend>
            <SegmentedControl
              aria-label={t(`${PREFIX}.keys.rotate.graceTitle`)}
              size="sm"
              value={grace}
              disabled={pending}
              onValueChange={setGrace}
              options={GRACE_PERIODS.map((item) => ({
                value: item.id,
                label: t(`${PREFIX}.keys.rotate.grace.${item.id}`),
              }))}
            />
            <p className="text-xs text-fg-subtle">
              {t(
                grace === 'none'
                  ? `${PREFIX}.keys.rotate.graceNoneHint`
                  : `${PREFIX}.keys.rotate.graceHint`,
              )}
            </p>
          </fieldset>
          {errorKey ? (
            <p role="alert" className="text-sm text-danger-fg">
              {t(errorKey)}
            </p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={close}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            loading={pending}
            disabled={pending}
            onClick={() => void rotate()}
          >
            {t(`${PREFIX}.keys.rotate.confirm`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
