import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  GatewayCatalogModel,
  GatewayCatalogModelUpdate,
} from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateCatalogModel } from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import {
  ALIAS_PATTERN,
  limitDraftOf,
  parseLimits,
  type LimitDraft,
} from '../../form-model'
import { PREFIX, gatewayErrorKey } from '../../utils'
import { CopyField } from '../copy-field'
import { LimitFields } from '../limit-fields'

const ERROR_ID = 'gateway-model-settings-error'

/**
 * Alias, preference among same-named models, description and model-level
 * limits of one catalog model. Only changed fields are sent.
 */
export function ModelSettingsDialog({
  model,
  onClose,
}: {
  model: GatewayCatalogModel
  onClose: () => void
}) {
  const { t } = useTranslation()
  const mutation = useUpdateCatalogModel()
  const [alias, setAlias] = useState(model.alias ?? '')
  const [preferred, setPreferred] = useState(model.preferred)
  const [description, setDescription] = useState(model.description ?? '')
  const [limits, setLimits] = useState<LimitDraft>(() => limitDraftOf(model))
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const pending = mutation.isPending

  const close = () => {
    if (!pending) onClose()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextAlias = alias.trim() || null
    if (nextAlias !== null && !ALIAS_PATTERN.test(nextAlias))
      return setErrorKey(`${PREFIX}.errors.invalidAlias`)
    const parsed = parseLimits(limits)
    if (!parsed) return setErrorKey(`${PREFIX}.errors.invalidLimit`)
    setErrorKey(null)
    const input: GatewayCatalogModelUpdate = {}
    if (nextAlias !== model.alias) input.alias = nextAlias
    if (model.shares_name && preferred !== model.preferred)
      input.preferred = preferred
    const nextDescription = description.trim() || null
    if (nextDescription !== model.description)
      input.description = nextDescription
    if (parsed.rpm_limit !== model.rpm_limit) input.rpm_limit = parsed.rpm_limit
    if (parsed.tpm_limit !== model.tpm_limit) input.tpm_limit = parsed.tpm_limit
    if (parsed.max_parallel_requests !== model.max_parallel_requests)
      input.max_parallel_requests = parsed.max_parallel_requests
    if (Object.keys(input).length === 0) return onClose()
    try {
      await mutation.mutateAsync({ modelId: model.model_id, input })
      toast.success(t(`${PREFIX}.messages.saved`))
      onClose()
    } catch (error) {
      if (getMutationErrorNotice(error))
        setErrorKey(gatewayErrorKey(error, 'model'))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent size="md" showCloseButton={!pending}>
        <DialogHeader>
          <DialogTitle>
            {t(`${PREFIX}.models.settings.title`, { name: model.call_name })}
          </DialogTitle>
          <DialogDescription>
            {t(`${PREFIX}.models.settings.description`, {
              provider: model.provider,
              instance: model.instance_name,
              model: model.model_name,
            })}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="space-y-space-lg">
            <div className="space-y-space-xs">
              <Label htmlFor="gateway-model-alias">
                {t(`${PREFIX}.models.settings.alias`)}
              </Label>
              <Input
                id="gateway-model-alias"
                className="font-mono"
                value={alias}
                maxLength={128}
                disabled={pending}
                aria-describedby="gateway-model-alias-hint"
                onChange={(event) => {
                  setAlias(event.target.value)
                  setErrorKey(null)
                }}
              />
              <p
                id="gateway-model-alias-hint"
                className="text-xs text-text-tertiary"
              >
                {t(`${PREFIX}.models.settings.aliasHint`)}
              </p>
            </div>

            {model.shares_name ? (
              <div className="flex items-start gap-space-sm">
                <Checkbox
                  id="gateway-model-preferred"
                  checked={preferred}
                  disabled={pending}
                  className="mt-space-2xs"
                  onCheckedChange={(checked) => setPreferred(checked === true)}
                />
                <div className="space-y-space-2xs">
                  <Label htmlFor="gateway-model-preferred">
                    {t(`${PREFIX}.models.settings.preferred`)}
                  </Label>
                  <p className="text-xs text-text-tertiary">
                    {t(`${PREFIX}.models.settings.preferredHint`)}
                  </p>
                </div>
              </div>
            ) : null}

            <section className="space-y-space-xs">
              <h3 className="text-sm font-medium text-text-primary">
                {t(`${PREFIX}.models.settings.names`)}
              </h3>
              <ul className="space-y-space-xs">
                {model.names.map((name) => (
                  <li key={name}>
                    <CopyField
                      value={name}
                      copyLabel={t(`${PREFIX}.models.settings.copyName`, {
                        name,
                      })}
                    />
                  </li>
                ))}
              </ul>
            </section>

            <div className="space-y-space-xs">
              <Label htmlFor="gateway-model-description">
                {t(`${PREFIX}.common.description`)}
              </Label>
              <Textarea
                id="gateway-model-description"
                rows={2}
                maxLength={2000}
                value={description}
                disabled={pending}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <fieldset className="space-y-space-xs">
              <legend className="text-sm font-medium text-text-primary">
                {t(`${PREFIX}.models.settings.limitsTitle`)}
              </legend>
              <p className="text-xs text-text-tertiary">
                {t(`${PREFIX}.models.settings.limitsHint`)}
              </p>
              <LimitFields
                idPrefix="gateway-model-limit"
                value={limits}
                disabled={pending}
                onChange={(next) => {
                  setLimits(next)
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
            <Button type="submit" loading={pending} disabled={pending}>
              {t(`${PREFIX}.common.save`)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
