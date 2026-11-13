import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { modelProvidersAPI } from '@/api/llm-providers'
import type { ModelInstance } from '@/api/llm-provider-types'
import {
  useModelProviderMutation,
  useTenantModels,
} from '@/hooks/use-model-provider-request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog'
import { InstanceModelForm } from './instance-model-form'
import { InstanceModelRow } from './instance-model-row'
import { KeyRound, MapPin, Plug } from 'lucide-react'
import { ModelMutationError } from './model-mutation-error'

type Removal = { label: string; operation: () => Promise<unknown> }
export function ProviderInstance({ instance }: { instance: ModelInstance }) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false),
    [addingModel, setAddingModel] = useState(false)
  const [key, setKey] = useState(''),
    [baseUrl, setBaseUrl] = useState(instance.base_url),
    [region, setRegion] = useState(instance.region)
  const [clear, setClear] = useState(false),
    [failure, setFailure] = useState<unknown>(null)
  const [removal, setRemoval] = useState<Removal | null>(null)
  const requestRemoval = (target: Removal) => {
    setFailure(null)
    setRemoval(target)
  }
  const models = useTenantModels(),
    mutation = useModelProviderMutation()
  const perform = (operation: () => Promise<unknown>, done?: () => void) => {
    setFailure(null)
    mutation.mutate(operation, {
      onSuccess: done,
      onError: (error) => setFailure(error),
    })
  }
  const owned = (models.data ?? []).filter(
    (model) => model.instance_id === instance.id,
  )
  return (
    <section className="flex min-w-0 flex-col gap-space-sm rounded-radius-md bg-background-subtle p-space-base">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <div className="min-w-0 space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-medium text-text-primary">
            <Plug aria-hidden className="size-4 text-text-tertiary" />
            {instance.instance_name === 'default'
              ? t('common.modelPicker.defaultConnection')
              : instance.instance_name}
          </h3>
          <p
            className="truncate text-xs text-text-secondary"
            title={instance.base_url}
          >
            {instance.base_url ||
              t('settings.models.instances.defaultEndpoint')}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
            {instance.region && (
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden className="size-3" />
                {instance.region}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <KeyRound aria-hidden className="size-3" />
              {t(
                instance.has_api_key
                  ? 'settings.models.instances.keySaved'
                  : 'settings.models.instances.noKey',
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-space-xs">
          <Switch
            aria-label={t('settings.models.instances.enabled', {
              name: instance.instance_name,
            })}
            checked={instance.status === 'active'}
            disabled={mutation.isPending}
            onCheckedChange={(active) =>
              perform(() =>
                modelProvidersAPI.updateInstance(
                  instance.provider_name,
                  instance.instance_name,
                  { status: active ? 'active' : 'inactive' },
                ),
              )
            }
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAddingModel(true)}
          >
            {t('settings.models.instances.addModel')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setKey('')
              setClear(false)
              setBaseUrl(instance.base_url)
              setRegion(instance.region)
              setEditing(!editing)
            }}
          >
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              requestRemoval({
                label: instance.instance_name,
                operation: () =>
                  modelProvidersAPI.deleteInstance(
                    instance.provider_name,
                    instance.instance_name,
                  ),
              })
            }
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>
      {editing && (
        <form
          className="flex flex-col gap-space-sm"
          onSubmit={(event) => {
            event.preventDefault()
            perform(
              () =>
                modelProvidersAPI.updateInstance(
                  instance.provider_name,
                  instance.instance_name,
                  {
                    api_key: key,
                    base_url: baseUrl,
                    region,
                    clear_api_key: clear,
                  },
                ),
              () => {
                setKey('')
                setEditing(false)
              },
            )
          }}
        >
          <Label htmlFor={`key-${instance.id}`}>
            {t('settings.models.instances.credential')}
          </Label>
          <Input
            id={`key-${instance.id}`}
            type="password"
            autoComplete="new-password"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={t('settings.models.localModel.editKeyHint')}
          />
          <label className="flex items-center gap-space-sm">
            <Checkbox
              checked={clear}
              onCheckedChange={(checked) => setClear(checked === true)}
            />
            {t('settings.models.instances.clearKey')}
          </label>
          <Label htmlFor={`url-${instance.id}`}>
            {t('settings.models.instances.baseUrl')}
          </Label>
          <Input
            id={`url-${instance.id}`}
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
          />
          <Label htmlFor={`region-${instance.id}`}>
            {t('settings.models.instances.region')}
          </Label>
          <Input
            id={`region-${instance.id}`}
            value={region}
            onChange={(event) => setRegion(event.target.value)}
          />
          <Button type="submit" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </form>
      )}
      {models.isError ? (
        <p role="alert">{t('settings.models.defaultsModelsFailed')}</p>
      ) : (
        <ul className="divide-y divide-border-subtle border-t border-border-subtle">
          {owned.map((model) => (
            <InstanceModelRow
              key={model.id}
              model={model}
              pending={mutation.isPending}
              onToggle={(active) =>
                perform(() =>
                  modelProvidersAPI.setModelStatus(
                    instance.provider_name,
                    instance.instance_name,
                    model.id,
                    active,
                  ),
                )
              }
              onRemove={() =>
                requestRemoval({
                  label: model.name,
                  operation: () =>
                    modelProvidersAPI.deleteModel(
                      instance.provider_name,
                      instance.instance_name,
                      model.id,
                    ),
                })
              }
            />
          ))}
        </ul>
      )}
      {!removal && failure !== null && <ModelMutationError error={failure} />}
      {addingModel && (
        <InstanceModelForm
          provider={instance.provider_name}
          instance={instance.instance_name}
          close={() => setAddingModel(false)}
        />
      )}
      <ConfirmationDialog
        open={!!removal}
        onOpenChange={(open) =>
          !open && !mutation.isPending && setRemoval(null)
        }
        title={t('common.delete')}
        description={
          <div className="space-y-space-sm">
            <span className="block">
              {t('settings.models.instances.deleteConfirm', {
                name: removal?.label,
              })}
            </span>
            {failure !== null && <ModelMutationError error={failure} />}
          </div>
        }
        cancelLabel={t('common.cancel')}
        confirmLabel={t('common.delete')}
        pending={mutation.isPending}
        onConfirm={() => {
          if (removal) perform(removal.operation, () => setRemoval(null))
        }}
      />
    </section>
  )
}
