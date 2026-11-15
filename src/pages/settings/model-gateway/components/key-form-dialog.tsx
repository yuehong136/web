import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  GatewayKey,
  GatewayKeyCreated,
  GatewayModel,
} from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateGatewayKey,
  useUpdateGatewayKey,
} from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import {
  emptyLimitDraft,
  limitDraftOf,
  parseExpiry,
  parseLimits,
  parseQuota,
  quotaDraftOf,
  toLocalInputValue,
  type LimitDraft,
  type QuotaDraft,
} from '../form-model'
import { gatewayErrorKey } from '../utils'
import { LimitFields, QuotaFields } from './limit-fields'

interface KeyFormDialogProps {
  /** The key being edited, or `null` to create one. */
  gatewayKey: GatewayKey | null
  models: GatewayModel[]
  onOpenChange: (open: boolean) => void
  /** Receives the new key, plaintext included, exactly once. */
  onCreated: (created: GatewayKeyCreated) => void
}

const ERROR_ID = 'gateway-key-form-error'

/**
 * Create or edit a gateway key. Only the name is required: scope, expiry,
 * limits and quota are optional, and a key with no model selected simply
 * cannot call anything yet.
 *
 * The owner mounts this only while it is open, so every opening starts from
 * the given key (or from an empty form) without resetting state by hand.
 */
export const KeyFormDialog = ({
  gatewayKey,
  models,
  onOpenChange,
  onCreated,
}: KeyFormDialogProps) => {
  const { t } = useTranslation()
  const editing = gatewayKey !== null
  const createMutation = useCreateGatewayKey()
  const updateMutation = useUpdateGatewayKey()
  const pending = createMutation.isPending || updateMutation.isPending

  const [name, setName] = useState(gatewayKey?.name ?? '')
  const [description, setDescription] = useState(gatewayKey?.description ?? '')
  const [allowAll, setAllowAll] = useState(
    gatewayKey?.allow_all_models ?? false,
  )
  const [allowed, setAllowed] = useState<string[]>(
    gatewayKey?.allowed_model_ids ?? [],
  )
  const [expiry, setExpiry] = useState(() =>
    toLocalInputValue(gatewayKey?.expires_at ?? null),
  )
  const [limits, setLimits] = useState<LimitDraft>(() =>
    gatewayKey ? limitDraftOf(gatewayKey) : emptyLimitDraft(),
  )
  const [quota, setQuota] = useState<QuotaDraft>(() =>
    quotaDraftOf(
      gatewayKey?.token_quota ?? null,
      gatewayKey?.quota_period ?? null,
    ),
  )
  // Which fixed message to show; never the request's own error text.
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const close = () => {
    if (!pending) onOpenChange(false)
  }

  const toggleModel = (id: string, checked: boolean) =>
    setAllowed((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    )

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName)
      return setErrorKey('settings.modelGateway.errors.nameRequired')
    const parsedLimits = parseLimits(limits)
    const parsedQuota = parseQuota(quota)
    if (!parsedLimits || !parsedQuota)
      return setErrorKey('settings.modelGateway.errors.invalidLimit')
    // An unchanged expiry of an existing key may already lie in the past.
    const expiryUnchanged =
      editing && expiry === toLocalInputValue(gatewayKey.expires_at)
    const parsedExpiry = expiryUnchanged ? undefined : parseExpiry(expiry)
    if (!expiryUnchanged && parsedExpiry === undefined)
      return setErrorKey('settings.modelGateway.errors.invalidExpiry')
    setErrorKey(null)
    // Ids of models deleted since the key was saved are dropped here.
    const known = new Set(models.map((model) => model.id))
    const input = {
      name: trimmedName,
      description: description.trim() || null,
      allow_all_models: allowAll,
      allowed_model_ids: allowed.filter((id) => known.has(id)),
      ...parsedLimits,
      ...parsedQuota,
      ...(expiryUnchanged ? {} : { expires_at: parsedExpiry ?? null }),
    }
    try {
      if (gatewayKey) {
        await updateMutation.mutateAsync({ id: gatewayKey.id, input })
        toast.success(t('settings.modelGateway.messages.saved'))
      } else {
        const created = await createMutation.mutateAsync(input)
        // The plaintext now belongs to the caller; drop it from the mutation.
        createMutation.reset()
        onCreated(created)
      }
      onOpenChange(false)
    } catch (error) {
      // Sign-in expiry and cancellation are reported elsewhere; stay quiet.
      if (getMutationErrorNotice(error))
        setErrorKey(gatewayErrorKey(error, 'key'))
    }
  }

  return (
    <Dialog open onOpenChange={(next) => (next ? undefined : close())}>
      <DialogContent
        size="lg"
        showCloseButton={!pending}
        closeOnOverlayClick={!pending}
      >
        <DialogHeader>
          <DialogTitle>
            {t(
              editing
                ? 'settings.modelGateway.keys.editTitle'
                : 'settings.modelGateway.keys.createTitle',
            )}
          </DialogTitle>
          <DialogDescription>
            {t('settings.modelGateway.keys.formDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="scroll-area max-h-[60vh] space-y-space-base overflow-y-auto px-space-lg py-space-base">
            <div className="space-y-space-xs">
              <Label htmlFor="gateway-key-name">
                {t('settings.modelGateway.common.name')}{' '}
                <span className="text-status-error" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="gateway-key-name"
                value={name}
                disabled={pending}
                maxLength={128}
                aria-required="true"
                aria-describedby={errorKey ? ERROR_ID : undefined}
                placeholder={t('settings.modelGateway.keys.namePlaceholder')}
                onChange={(event) => {
                  setName(event.target.value)
                  setErrorKey(null)
                }}
              />
            </div>

            <div className="space-y-space-xs">
              <Label htmlFor="gateway-key-description">
                {t('settings.modelGateway.common.description')}
              </Label>
              <Textarea
                id="gateway-key-description"
                value={description}
                rows={2}
                maxLength={2000}
                disabled={pending}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <fieldset className="space-y-space-sm">
              <legend className="text-sm font-medium text-text-primary">
                {t('settings.modelGateway.keys.scope')}
              </legend>
              <div className="flex items-center gap-space-sm">
                <Switch
                  id="gateway-key-allow-all"
                  size="sm"
                  checked={allowAll}
                  disabled={pending}
                  onCheckedChange={setAllowAll}
                />
                <Label htmlFor="gateway-key-allow-all">
                  {t('settings.modelGateway.keys.allowAll')}
                </Label>
              </div>
              {allowAll ? null : models.length === 0 ? (
                <p className="text-sm text-text-tertiary">
                  {t('settings.modelGateway.keys.noModels')}
                </p>
              ) : (
                <ul className="grid gap-space-xs sm:grid-cols-2">
                  {models.map((model) => (
                    <li
                      key={model.id}
                      className="flex items-center gap-space-sm"
                    >
                      <Checkbox
                        id={`gateway-key-model-${model.id}`}
                        checked={allowed.includes(model.id)}
                        disabled={pending}
                        onCheckedChange={(checked) =>
                          toggleModel(model.id, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`gateway-key-model-${model.id}`}
                        className="font-mono"
                      >
                        {model.name}
                      </Label>
                    </li>
                  ))}
                </ul>
              )}
            </fieldset>

            <div className="space-y-space-xs">
              <Label htmlFor="gateway-key-expiry">
                {t('settings.modelGateway.keys.expiresAt')}
              </Label>
              <Input
                id="gateway-key-expiry"
                type="datetime-local"
                value={expiry}
                disabled={pending}
                onChange={(event) => {
                  setExpiry(event.target.value)
                  setErrorKey(null)
                }}
              />
              <p className="text-sm text-text-tertiary">
                {t('settings.modelGateway.keys.expiresHint')}
              </p>
            </div>

            <fieldset className="space-y-space-xs">
              <legend className="text-sm font-medium text-text-primary">
                {t('settings.modelGateway.limits.keyTitle')}
              </legend>
              <LimitFields
                idPrefix="gateway-key-limit"
                value={limits}
                disabled={pending}
                onChange={(next) => {
                  setLimits(next)
                  setErrorKey(null)
                }}
              />
            </fieldset>

            <fieldset className="space-y-space-xs">
              <legend className="text-sm font-medium text-text-primary">
                {t('settings.modelGateway.quota.title')}
              </legend>
              <p className="text-sm text-text-tertiary">
                {t('settings.modelGateway.quota.hint')}
              </p>
              <QuotaFields
                idPrefix="gateway-key"
                value={quota}
                disabled={pending}
                onChange={(next) => {
                  setQuota(next)
                  setErrorKey(null)
                }}
              />
            </fieldset>

            {errorKey ? (
              <p
                id={ERROR_ID}
                role="alert"
                className="text-sm text-status-error"
              >
                {t(errorKey)}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={close}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={pending} disabled={pending}>
              {t(
                editing ? 'settings.modelGateway.common.save' : 'common.create',
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
