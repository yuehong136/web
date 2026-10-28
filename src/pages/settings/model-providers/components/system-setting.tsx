import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormTooltip } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import {
  AppScene,
  PageErrorState,
  PageLoadingState,
} from '@/components/patterns'
import { type MyLLMProvider } from '@/stores/model'
import { useFetchMyLLMs } from '@/hooks/use-llm-request'
import { useDefaultModelRequest } from '@/hooks/use-default-model-request'
import { modelOptions } from '@/components/models/model-select-options'
import { ModelSelect } from '@/components/models/model-select'
import { toast } from '@/lib/toast'
import type { TenantInfo } from '@/types/team'
import type { TenantModelSettings } from '@/api/auth'
import type { ModelDefault } from '@/api/llm-provider-types'

const MODEL_FIELDS = [
  {
    field: 'llm_id',
    name: 'chat',
    types: ['chat'],
    required: false,
  },
  { field: 'embd_id', name: 'embedding', types: ['embedding'] },
  { field: 'img2txt_id', name: 'vision', types: ['image2text'] },
  { field: 'asr_id', name: 'speech', types: ['speech2text'] },
  { field: 'rerank_id', name: 'rerank', types: ['rerank'] },
  { field: 'tts_id', name: 'tts', types: ['tts'] },
  { field: 'ocr_id', name: 'ocr', types: ['ocr'] },
] as const

type ModelField = (typeof MODEL_FIELDS)[number]['field']
const defaultModelsSchema = z.object({
  llm_id: z.string(),
  embd_id: z.string(),
  img2txt_id: z.string(),
  asr_id: z.string(),
  rerank_id: z.string(),
  tts_id: z.string(),
  ocr_id: z.string(),
})
type ModelValues = z.infer<typeof defaultModelsSchema>

function getModelValues(tenant: TenantInfo): ModelValues {
  return Object.fromEntries(
    MODEL_FIELDS.map(({ field }) => [field, tenant[field] ?? '']),
  ) as ModelValues
}

export function SystemSetting() {
  const { t } = useTranslation()
  const request = useDefaultModelRequest()
  const models = useFetchMyLLMs()
  if (!request.tenantInfo) {
    if (request.isError)
      return (
        <PageErrorState
          scene={AppScene.CONSOLE}
          compact
          title={t('settings.models.defaultsLoadFailed')}
          description={null}
          retryLabel={t('common.retry')}
          onRetry={() => {
            void request.refetch()
          }}
        />
      )
    return (
      <PageLoadingState
        scene={AppScene.CONSOLE}
        compact
        title={t('common.loading')}
        description={null}
      />
    )
  }
  return (
    <DefaultModelsForm
      key={request.tenantInfo.tenant_id}
      tenant={request.tenantInfo}
      defaultModels={request.defaultModels}
      models={models.myLLMs}
      saving={request.update.isPending}
      modelsFailed={models.isError}
      modelsLoading={models.isLoading || models.isPending || models.isPaused}
      retryModels={() => {
        void models.refetch()
      }}
      onSave={(values) => request.update.mutateAsync(values)}
    />
  )
}

function DefaultModelsForm({
  tenant,
  defaultModels,
  models,
  saving,
  modelsFailed,
  modelsLoading,
  retryModels,
  onSave,
}: {
  tenant: TenantInfo
  defaultModels: ModelDefault[]
  models: MyLLMProvider
  saving: boolean
  modelsFailed: boolean
  modelsLoading: boolean
  retryModels: () => void
  onSave: (values: TenantModelSettings) => Promise<unknown>
}) {
  const { t } = useTranslation()
  const current = useMemo(() => getModelValues(tenant), [tenant])
  const form = useForm<ModelValues>({
    resolver: zodResolver(defaultModelsSchema),
    defaultValues: current,
    values: current,
    resetOptions: { keepDirtyValues: true },
  })
  const values = { ...current, ...useWatch({ control: form.control }) }
  const builtinEmbedding = defaultModels.find(
    (model) =>
      model.model_type === 'embedding' &&
      model.model_id === null &&
      model.model_provider === 'Builtin' &&
      model.model_instance === 'default' &&
      model.model_name !== '' &&
      model.reference !== '' &&
      model.reference === values.embd_id,
  )
  const dirty = form.formState.isDirty
  const [saveFailed, setSaveFailed] = useState(false)
  const [localPending, setLocalPending] = useState(false)
  const pending = saving || localPending
  const active = useRef(false)
  const submitting = useRef(false)
  useEffect(() => {
    active.current = true
    return () => {
      active.current = false
    }
  }, [])
  const options = Object.fromEntries(
    MODEL_FIELDS.map(({ field, types }) => [
      field,
      modelOptions(models, types),
    ]),
  ) as Record<ModelField, ReturnType<typeof modelOptions>>

  const save = async (submitted: ModelValues) => {
    if (!dirty || pending || submitting.current) return
    submitting.current = true
    setLocalPending(true)
    setSaveFailed(false)
    try {
      await onSave({
        tenant_id: tenant.tenant_id,
        name: tenant.name,
        ...submitted,
      })
      if (!active.current) return
      form.reset(submitted)
      toast.success(t('settings.models.defaultsSaved'))
    } catch {
      if (!active.current) return
      setSaveFailed(true)
      toast.error(t('settings.models.defaultsSaveFailed'))
    } finally {
      submitting.current = false
      if (active.current) setLocalPending(false)
    }
  }

  return (
    <section className="flex flex-col gap-space-lg">
      <header className="flex flex-col gap-space-xs">
        <h2 className="text-base font-semibold text-text-primary">
          {t('settings.models.defaults')}
        </h2>
        <p className="text-sm text-text-secondary">
          {t('settings.models.defaultDescription')}
        </p>
      </header>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(save)(event)
        }}
        className="overflow-hidden rounded-radius-lg border border-border-subtle"
      >
        <div className="flex flex-col divide-y divide-border-subtle">
          {MODEL_FIELDS.map((config) => (
            <div
              key={config.field}
              className="grid items-center gap-space-md p-space-base sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]"
            >
              <div className="flex flex-col gap-space-xs">
                <span className="flex items-center gap-space-xs text-sm font-medium text-text-primary">
                  {t(`settings.models.defaultFields.${config.name}.label`)}
                  {'required' in config && config.required && (
                    <span aria-hidden className="text-status-error">
                      *
                    </span>
                  )}
                  <FormTooltip
                    tooltip={t(
                      `settings.models.defaultFields.${config.name}.hint`,
                    )}
                  />
                </span>
              </div>
              <div className="flex flex-col gap-space-sm">
                {config.field === 'embd_id' && builtinEmbedding && (
                  <output className="text-sm text-text-secondary">
                    {t('settings.models.defaultsBuiltin', {
                      model: builtinEmbedding.model_name,
                      instance: builtinEmbedding.model_instance,
                    })}
                  </output>
                )}
                <ModelSelect
                  ariaLabel={t(
                    `settings.models.defaultFields.${config.name}.label`,
                  )}
                  triggerClassName="w-full"
                  value={
                    config.field === 'embd_id' && builtinEmbedding
                      ? ''
                      : values[config.field]
                  }
                  {...options[config.field]}
                  loading={modelsLoading}
                  error={modelsFailed}
                  showStatus={false}
                  onChange={(value) => {
                    form.setValue(config.field, value, { shouldDirty: true })
                    setSaveFailed(false)
                  }}
                  disabled={pending}
                  placeholder={t('settings.models.defaultsSelect')}
                  emptyText={t('settings.models.defaultsEmpty')}
                  searchPlaceholder={t('common.search')}
                  allowClear
                />
              </div>
            </div>
          ))}
        </div>
        {modelsLoading && (
          <output className="block p-space-md text-sm text-text-secondary">
            {t('common.modelPicker.loading')}
          </output>
        )}
        {modelsFailed && (
          <div className="flex items-center justify-between gap-space-sm border-t border-border-subtle p-space-md text-sm text-text-secondary">
            <span>{t('settings.models.defaultsModelsFailed')}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={retryModels}
            >
              {t('common.retry')}
            </Button>
          </div>
        )}
        {saveFailed && (
          <p
            role="alert"
            className="px-space-lg py-space-md text-sm text-status-error"
          >
            {t('settings.models.defaultsSaveFailed')}
          </p>
        )}
        <footer className="flex flex-wrap items-center justify-between gap-space-md border-t border-border-subtle bg-background-subtle p-space-md">
          <output className="text-sm text-text-secondary">
            {t(
              pending
                ? 'common.saving'
                : dirty
                  ? 'settings.models.defaultsUnsaved'
                  : 'settings.models.defaultsSavedHint',
            )}
          </output>
          <div className="flex gap-space-sm">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!dirty || pending}
              onClick={() => {
                if (submitting.current) return
                form.reset(current)
                setSaveFailed(false)
              }}
            >
              {t('common.reset')}
            </Button>
            <Button
              type="submit"
              size="sm"
              loading={pending}
              disabled={!dirty || pending}
            >
              {t('common.save')}
            </Button>
          </div>
        </footer>
      </form>
    </section>
  )
}
