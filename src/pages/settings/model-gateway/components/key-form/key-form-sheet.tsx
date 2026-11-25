import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { GatewayCatalog, GatewayKeyCreated } from '@/api/model-gateway'
import { ContextPanel } from '@/components/patterns/context-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  useCreateGatewayKey,
  useUpdateGatewayKey,
} from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import type { KeyFormRequest } from '../../constants'
import { hasLimits } from '../../form-model'
import { PREFIX, gatewayErrorKey } from '../../utils'
import { ExpiryField } from './expiry-field'
import { buildKeyInput, initialDraft, type KeyDraft } from './key-draft'
import { LimitsSection } from './limits-section'
import { ScopeField } from './scope-field'

const ERROR_ID = 'gateway-key-form-error'

interface KeyFormSheetProps {
  request: KeyFormRequest
  catalog: GatewayCatalog
  onClose: () => void
  /** Receives the new key, plaintext included, exactly once. */
  onCreated: (created: GatewayKeyCreated) => void
}

/**
 * Create, edit or rotate a gateway key in a right-hand sheet. Only the name
 * is required; a custom scope with nothing picked simply cannot call
 * anything yet. The owner mounts it only while open, so every opening starts
 * from the request.
 */
export function KeyFormSheet({
  request,
  catalog,
  onClose,
  onCreated,
}: KeyFormSheetProps) {
  const { t } = useTranslation()
  const createMutation = useCreateGatewayKey()
  const updateMutation = useUpdateGatewayKey()
  const pending = createMutation.isPending || updateMutation.isPending
  const [draft, setDraft] = useState<KeyDraft>(() => initialDraft(request))
  // Which fixed message to show; never the request's own error text.
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const update = (patch: Partial<KeyDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setErrorKey(null)
  }
  const close = () => {
    if (!pending) onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = buildKeyInput(draft, request, catalog)
    if (!result.ok) return setErrorKey(result.errorKey)
    setErrorKey(null)
    try {
      if (request.mode === 'edit') {
        await updateMutation.mutateAsync({
          id: request.key.id,
          input: result.input,
        })
        toast.success(t(`${PREFIX}.messages.saved`))
      } else {
        const created = await createMutation.mutateAsync(result.input)
        // The plaintext now belongs to the caller; drop it from the mutation.
        createMutation.reset()
        onCreated(created)
      }
      onClose()
    } catch (error) {
      // Sign-in expiry and cancellation are reported elsewhere; stay quiet.
      if (getMutationErrorNotice(error))
        setErrorKey(gatewayErrorKey(error, 'key'))
    }
  }

  const title = t(`${PREFIX}.keyForm.${request.mode}Title`)
  const description = t(`${PREFIX}.keyForm.description`)
  const submitLabel = {
    create: t(`${PREFIX}.keyForm.submitCreate`),
    edit: t(`${PREFIX}.common.save`),
  }[request.mode]

  return (
    <Sheet open onOpenChange={(open) => (open ? undefined : close())}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="h-full w-full overflow-hidden bg-surface p-0 sm:max-w-2xl"
      >
        <form onSubmit={submit} className="h-full" noValidate>
          <ContextPanel
            width="full"
            className="border-l-0"
            title={
              <SheetTitle asChild>
                <span>{title}</span>
              </SheetTitle>
            }
            description={<SheetDescription>{description}</SheetDescription>}
            onClose={close}
            closeLabel={t('common.close')}
            bodyClassName="flex flex-col gap-space-xl p-space-lg"
            footer={
              <div className="flex flex-col gap-space-sm">
                {errorKey ? (
                  <p
                    id={ERROR_ID}
                    role="alert"
                    className="text-sm text-danger-fg"
                  >
                    {t(errorKey)}
                  </p>
                ) : null}
                <div className="flex justify-end gap-space-sm">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={close}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" loading={pending} disabled={pending}>
                    {submitLabel}
                  </Button>
                </div>
              </div>
            }
          >
            <div className="grid gap-space-md sm:grid-cols-2">
              <div className="space-y-space-xs">
                <Label htmlFor="gateway-key-name">
                  {t(`${PREFIX}.common.name`)}{' '}
                  <span className="text-danger-fg" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Input
                  id="gateway-key-name"
                  value={draft.name}
                  maxLength={128}
                  disabled={pending}
                  aria-required="true"
                  aria-describedby={errorKey ? ERROR_ID : undefined}
                  placeholder={t(`${PREFIX}.keyForm.namePlaceholder`)}
                  onChange={(event) => update({ name: event.target.value })}
                />
              </div>
              <div className="space-y-space-xs">
                <Label htmlFor="gateway-key-description">
                  {t(`${PREFIX}.common.description`)}
                </Label>
                <Input
                  id="gateway-key-description"
                  value={draft.description}
                  maxLength={2000}
                  disabled={pending}
                  placeholder={t(`${PREFIX}.keyForm.descriptionPlaceholder`)}
                  onChange={(event) =>
                    update({ description: event.target.value })
                  }
                />
              </div>
            </div>
            <ScopeField
              catalog={catalog}
              scope={draft.scope}
              disabled={pending}
              onChange={(scope) => update({ scope })}
            />
            <ExpiryField
              value={draft.expiry}
              disabled={pending}
              onChange={(expiry) => update({ expiry })}
            />
            <LimitsSection
              limits={draft.limits}
              quota={draft.quota}
              defaultOpen={hasLimits(draft.limits, draft.quota)}
              disabled={pending}
              onLimitsChange={(limits) => update({ limits })}
              onQuotaChange={(quota) => update({ quota })}
            />
          </ContextPanel>
        </form>
      </SheetContent>
    </Sheet>
  )
}
