import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  GatewayCandidate,
  GatewayModel,
  GatewayModelType,
} from '@/api/model-gateway'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateGatewayModel,
  useFetchGatewayCandidates,
  useUpdateGatewayModel,
} from '@/hooks/use-model-gateway-request'
import { getMutationErrorNotice } from '@/lib/mutation-error-feedback'
import { toast } from '@/lib/toast'
import {
  PUBLIC_NAME_PATTERN,
  emptyLimitDraft,
  limitDraftOf,
  parseLimits,
  suggestPublicName,
  type LimitDraft,
} from '../form-model'
import { gatewayErrorKey } from '../utils'
import { LimitFields } from './limit-fields'

interface ModelFormDialogProps {
  /** The published model being edited, or `null` to publish a new one. */
  model: GatewayModel | null
  onOpenChange: (open: boolean) => void
}

const ERROR_ID = 'gateway-model-form-error'

const candidateLabel = (candidate: GatewayCandidate) =>
  `${candidate.provider} / ${candidate.model_name}`

/**
 * Publish a registered model under a public name, or edit a published one.
 * Only models the gateway can serve are selectable; the rest stay visible but
 * disabled, so it is clear why they cannot be chosen.
 *
 * The owner mounts this only while it is open, so every opening starts from
 * the given model (or from an empty form) without resetting state by hand.
 */
export const ModelFormDialog = ({
  model,
  onOpenChange,
}: ModelFormDialogProps) => {
  const { t } = useTranslation()
  const editing = model !== null
  const candidatesQuery = useFetchGatewayCandidates(!editing)
  const createMutation = useCreateGatewayModel()
  const updateMutation = useUpdateGatewayModel()
  const pending = createMutation.isPending || updateMutation.isPending

  const [candidateId, setCandidateId] = useState('')
  const [modelType, setModelType] = useState<GatewayModelType>('chat')
  const [name, setName] = useState(model?.name ?? '')
  const [nameTouched, setNameTouched] = useState(editing)
  const [description, setDescription] = useState(model?.description ?? '')
  const [limits, setLimits] = useState<LimitDraft>(() =>
    model ? limitDraftOf(model) : emptyLimitDraft(),
  )
  // Which fixed message to show; never the request's own error text.
  const [errorKey, setErrorKey] = useState<string | null>(null)

  const candidates = candidatesQuery.data ?? []
  const selected = candidates.find(
    (candidate) => String(candidate.model_id) === candidateId,
  )

  const selectCandidate = (id: string) => {
    setCandidateId(id)
    setErrorKey(null)
    const candidate = candidates.find((item) => String(item.model_id) === id)
    if (!candidate) return
    setModelType(candidate.publishable_types[0] ?? 'chat')
    if (!nameTouched) setName(suggestPublicName(candidate.model_name))
  }

  const close = () => {
    if (!pending) onOpenChange(false)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!PUBLIC_NAME_PATTERN.test(trimmedName))
      return setErrorKey('settings.modelGateway.errors.invalidName')
    const parsedLimits = parseLimits(limits)
    if (!parsedLimits)
      return setErrorKey('settings.modelGateway.errors.invalidLimit')
    if (!editing && !selected)
      return setErrorKey('settings.modelGateway.errors.modelRequired')
    setErrorKey(null)
    const shared = {
      name: trimmedName,
      description: description.trim() || null,
      ...parsedLimits,
    }
    try {
      if (model) {
        await updateMutation.mutateAsync({ id: model.id, input: shared })
        toast.success(t('settings.modelGateway.messages.saved'))
      } else if (selected) {
        await createMutation.mutateAsync({
          ...shared,
          model_id: selected.model_id,
          model_type: modelType,
        })
        toast.success(t('settings.modelGateway.messages.published'))
      }
      onOpenChange(false)
    } catch (error) {
      // Sign-in expiry and cancellation are reported elsewhere; stay quiet.
      if (getMutationErrorNotice(error))
        setErrorKey(gatewayErrorKey(error, editing ? 'model' : 'publish'))
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
                ? 'settings.modelGateway.models.editTitle'
                : 'settings.modelGateway.models.publishTitle',
            )}
          </DialogTitle>
          <DialogDescription>
            {t('settings.modelGateway.models.formDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit}>
          <div className="space-y-space-base px-space-lg py-space-base">
            {editing ? (
              <p className="text-sm text-text-secondary">
                {t('settings.modelGateway.models.targetOf', {
                  target: model.target
                    ? `${model.target.provider} / ${model.target.model_name}`
                    : t('settings.modelGateway.models.targetMissing'),
                })}
              </p>
            ) : (
              <div className="grid gap-space-base sm:grid-cols-3">
                <div className="space-y-space-xs sm:col-span-2">
                  <Label htmlFor="gateway-model-candidate">
                    {t('settings.modelGateway.models.registeredModel')}
                  </Label>
                  <Select
                    value={candidateId}
                    disabled={pending || candidatesQuery.isPending}
                    onValueChange={selectCandidate}
                  >
                    <SelectTrigger id="gateway-model-candidate">
                      <SelectValue
                        placeholder={t(
                          candidatesQuery.isPending
                            ? 'settings.modelGateway.models.loadingCandidates'
                            : 'settings.modelGateway.models.selectModel',
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem
                          key={candidate.model_id}
                          value={String(candidate.model_id)}
                          disabled={candidate.publishable_types.length === 0}
                        >
                          {candidate.publishable_types.length === 0
                            ? t('settings.modelGateway.models.notPublishable', {
                                model: candidateLabel(candidate),
                              })
                            : candidateLabel(candidate)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-space-xs">
                  <Label htmlFor="gateway-model-type">
                    {t('settings.modelGateway.models.type')}
                  </Label>
                  <Select
                    value={modelType}
                    disabled={
                      pending || (selected?.publishable_types.length ?? 0) < 2
                    }
                    onValueChange={(type) =>
                      setModelType(type as GatewayModelType)
                    }
                  >
                    <SelectTrigger id="gateway-model-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(selected?.publishable_types ?? [modelType]).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {t(`settings.modelGateway.modelTypes.${type}`)}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-space-xs">
              <Label htmlFor="gateway-model-name">
                {t('settings.modelGateway.models.publicName')}{' '}
                <span className="text-status-error" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="gateway-model-name"
                value={name}
                disabled={pending}
                maxLength={128}
                aria-required="true"
                aria-describedby={errorKey ? ERROR_ID : undefined}
                placeholder={t(
                  'settings.modelGateway.models.publicNamePlaceholder',
                )}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameTouched(true)
                  setErrorKey(null)
                }}
              />
              <p className="text-sm text-text-tertiary">
                {t('settings.modelGateway.models.publicNameHint')}
              </p>
            </div>

            <div className="space-y-space-xs">
              <Label htmlFor="gateway-model-description">
                {t('settings.modelGateway.common.description')}
              </Label>
              <Textarea
                id="gateway-model-description"
                value={description}
                rows={2}
                maxLength={2000}
                disabled={pending}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <fieldset className="space-y-space-xs">
              <legend className="text-sm font-medium text-text-primary">
                {t('settings.modelGateway.limits.modelTitle')}
              </legend>
              <p className="text-sm text-text-tertiary">
                {t('settings.modelGateway.limits.modelHint')}
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
                editing
                  ? 'settings.modelGateway.common.save'
                  : 'settings.modelGateway.models.publish',
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
