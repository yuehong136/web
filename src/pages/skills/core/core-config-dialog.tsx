import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  useCoreConfig,
  useCoreModels,
  useCoreAction,
  useCoreProtocols,
} from '@/hooks/use-skill-core-request'
import { skillCoreAPI } from '@/api/skill-core'
import { APIError } from '@/api/client'
import type { CoreConfig } from '@/api/skill-core-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PageLoadingState } from '@/components/patterns'
import { SkillError } from '../skill-shared'
import { SkillSelect } from '../skill-select'

function CoreConfigForm({
  space,
  config,
}: {
  space: string
  config: CoreConfig
}) {
  const { t } = useTranslation()
  const models = useCoreModels()
  const protocols = useCoreProtocols()
  const capabilities = protocols.data?.protocols.find(
    (item) => item.protocol === 'ragflow-skills-v1',
  )?.capabilities
  const action = useCoreAction()
  const [saved, setSaved] = useState(false)
  const [indexed, setIndexed] = useState(false)
  const form = useForm({
    defaultValues: { ...config, rerank_id: config.rerank_id ?? '' },
  })
  return (
    <form
      className="flex flex-col gap-space-base px-space-lg pb-space-lg"
      onSubmit={form.handleSubmit((data) =>
        action.mutate(async () => {
          const result = await skillCoreAPI.updateConfig(space, data)
          form.reset({ ...result, rerank_id: result.rerank_id ?? '' })
          setSaved(true)
          setIndexed(false)
        }),
      )}
    >
      <SkillError error={models.error || protocols.error} />
      {(['embd_id', 'rerank_id'] as const).map((name) => (
        <Controller
          key={name}
          name={name}
          control={form.control}
          render={({ field }) => (
            <SkillSelect
              label={t(
                name === 'embd_id' ? 'skills.embedding' : 'skills.rerank',
              )}
              value={field.value || 'none'}
              disabled={models.isLoading || action.isPending}
              onChange={(value) =>
                field.onChange(value === 'none' ? '' : value)
              }
              options={[
                { value: 'none', label: t('skills.none') },
                ...(models.data?.models
                  .filter(
                    (model) =>
                      model.type ===
                      (name === 'embd_id' ? 'embedding' : 'rerank'),
                  )
                  .map((model) => ({
                    value: model.id,
                    label: `${model.name} · ${model.provider} · #${model.id}`,
                    disabled: !model.available,
                  })) || []),
                ...(field.value &&
                !models.data?.models.some((model) => model.id === field.value)
                  ? [
                      {
                        value: field.value,
                        label: `${field.value} · ${t('skills.unavailable')}`,
                        disabled: true,
                      },
                    ]
                  : []),
              ]}
            />
          )}
        />
      ))}
      {capabilities?.rerank === false && (
        <p className="text-sm text-text-secondary">
          {t('skills.core.rerankNotApplied')}
        </p>
      )}
      <details className="flex flex-col gap-space-base">
        <summary className="cursor-pointer py-space-sm font-medium">
          {t('skills.advanced')}
        </summary>
        <div className="flex flex-col gap-space-base pt-space-base">
          <Input
            label={t('skills.topK')}
            type="number"
            min={1}
            max={100}
            {...form.register('top_k', { valueAsNumber: true })}
          />
          <Input
            label={t('skills.vectorWeight')}
            type="number"
            min={0}
            max={1}
            step={0.05}
            {...form.register('vector_similarity_weight', {
              valueAsNumber: true,
            })}
          />
          <p className="text-sm text-text-secondary">
            {t('skills.core.strategyHint')}
          </p>
          <Input
            label={t('skills.threshold')}
            type="number"
            min={0}
            max={1}
            step={0.05}
            {...form.register('similarity_threshold', { valueAsNumber: true })}
          />
          {(['name', 'tags', 'description', 'content'] as const).map((name) => (
            <div
              key={name}
              className="grid grid-cols-2 items-center gap-space-base"
            >
              <Controller
                name={`field_config.${name}.enabled`}
                control={form.control}
                render={({ field }) => (
                  <Label
                    htmlFor={`core-${name}`}
                    className="flex items-center gap-space-sm"
                  >
                    <Checkbox
                      id={`core-${name}`}
                      checked={field.value}
                      onCheckedChange={(value) =>
                        field.onChange(value === true)
                      }
                    />
                    {t(`skills.${name}`)}
                  </Label>
                )}
              />
              <Input
                aria-label={`${t(`skills.${name}`)} ${t('skills.weight')}`}
                type="number"
                min={0}
                max={10}
                step={0.1}
                {...form.register(`field_config.${name}.weight`, {
                  valueAsNumber: true,
                })}
              />
            </div>
          ))}
        </div>
      </details>
      <SkillError error={action.error} />
      {(saved || indexed) && (
        <p aria-live="polite" className="text-sm text-status-info">
          {t(indexed ? 'skills.core.indexReady' : 'skills.requiresReindex')}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-space-sm">
        <Button
          type="button"
          variant="outline"
          disabled={action.isPending || form.formState.isDirty}
          onClick={() =>
            action.mutate(async () => {
              const result = await skillCoreAPI.reindex(space)
              if (result.failed_count)
                throw new APIError(
                  200,
                  'CORE_INDEX_PARTIAL',
                  'Index incomplete',
                )
              setIndexed(true)
            })
          }
        >
          {t('skills.reindex')}
        </Button>
        <Button disabled={action.isPending || models.isLoading}>
          {t('skills.save')}
        </Button>
      </div>
    </form>
  )
}
export function CoreConfigDialog({
  space,
  onClose,
}: {
  space: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const query = useCoreConfig(space)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{t('skills.configuration')}</DialogTitle>
          <DialogDescription>
            {t('skills.core.configDescription')}
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <PageLoadingState
            compact
            title={t('skills.loading')}
            description=""
          />
        ) : query.data ? (
          <CoreConfigForm space={space} config={query.data} />
        ) : (
          <SkillError error={query.error} />
        )}
      </DialogContent>
    </Dialog>
  )
}
