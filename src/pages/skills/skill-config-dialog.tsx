import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { skillsAPI } from '@/api/skills'
import {
  skillConfigSchema,
  type SkillConfig,
  type AcceptedSkillOperation,
} from '@/api/skill-types'
import {
  useSkillAction,
  useSkillConfig,
  useSkillModels,
} from '@/hooks/use-skill-request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PageLoadingState } from '@/components/patterns'
import { SkillError } from './skill-shared'
import { SkillSelect } from './skill-select'

const schema = skillConfigSchema.refine(
  (config) =>
    Object.values(config.fields).some(
      (field) => field.enabled && field.weight > 0,
    ),
  { path: ['fields'] },
)
function ConfigForm({
  space,
  config,
  onAccepted,
}: {
  space: string
  config: SkillConfig
  onAccepted: (operation: AcceptedSkillOperation) => void
}) {
  const { t } = useTranslation()
  const [requiresReindex, setRequiresReindex] = useState(false)
  const models = useSkillModels()
  const form = useForm<SkillConfig>({
    resolver: zodResolver(schema),
    defaultValues: config,
  })
  const action = useSkillAction(onAccepted)
  return (
    <form
      className="flex flex-col gap-space-base px-space-lg pb-space-lg"
      onSubmit={form.handleSubmit((data) =>
        action.mutate(async () => {
          const result = await skillsAPI.updateConfig(space, data)
          form.reset(result.config)
          setRequiresReindex(result.requires_reindex)
          return result
        }),
      )}
    >
      <SkillError error={models.error} />
      {(['embedding', 'rerank'] as const).map((type) => (
        <Controller
          key={type}
          control={form.control}
          name={type === 'embedding' ? 'embedding_model_id' : 'rerank_model_id'}
          render={({ field }) => (
            <SkillSelect
              label={t(`skills.${type}`)}
              value={field.value || 'none'}
              disabled={models.isLoading || action.isPending}
              onChange={(value) =>
                field.onChange(value === 'none' ? null : value)
              }
              options={[
                { value: 'none', label: t('skills.none') },
                ...(models.data?.models
                  .filter((model) => model.type === type)
                  .map((model) => ({
                    value: model.id,
                    label: `${model.name} · ${model.provider} · #${model.id}${model.available ? '' : ` · ${t('skills.unavailable')}`}`,
                    disabled: !model.available,
                  })) || []),
                ...(field.value &&
                !models.data?.models.some((model) => model.id === field.value)
                  ? [
                      {
                        value: field.value,
                        label: `#${field.value} · ${t('skills.unavailable')}`,
                        disabled: true,
                      },
                    ]
                  : []),
              ]}
            />
          )}
        />
      ))}
      <div className="grid gap-space-base sm:grid-cols-3">
        <Input
          disabled={action.isPending}
          label={t('skills.topK')}
          type="number"
          min={1}
          max={100}
          {...form.register('top_k', { valueAsNumber: true })}
        />
        <Input
          disabled={action.isPending}
          label={t('skills.vectorWeight')}
          type="number"
          min={0}
          max={1}
          step={0.05}
          {...form.register('vector_weight', { valueAsNumber: true })}
        />
        <Input
          disabled={action.isPending}
          label={t('skills.threshold')}
          type="number"
          min={0}
          max={1}
          step={0.05}
          {...form.register('similarity_threshold', { valueAsNumber: true })}
        />
      </div>
      {(['name', 'tags', 'description', 'content'] as const).map((name) => (
        <div
          className="grid grid-cols-2 items-center gap-space-base"
          key={name}
        >
          <Controller
            control={form.control}
            name={`fields.${name}.enabled`}
            render={({ field }) => (
              <Label
                htmlFor={`skill-field-${name}`}
                className="flex items-center gap-space-sm"
              >
                <Checkbox
                  disabled={action.isPending}
                  id={`skill-field-${name}`}
                  checked={field.value}
                  onCheckedChange={(value) => field.onChange(value === true)}
                />
                {t(`skills.${name}`)}
              </Label>
            )}
          />
          <Input
            disabled={action.isPending}
            aria-label={`${t(`skills.${name}`)} ${t('skills.weight')}`}
            type="number"
            min={0}
            max={10}
            step={0.1}
            {...form.register(`fields.${name}.weight`, { valueAsNumber: true })}
          />
        </div>
      ))}
      {!!Object.keys(form.formState.errors).length && (
        <SkillError error="HTTP_422" />
      )}
      <SkillError error={action.error} />
      {requiresReindex && (
        <output className="text-sm text-status-info">
          {t('skills.requiresReindex')}
        </output>
      )}
      <div className="flex flex-wrap justify-end gap-space-sm">
        <Button
          type="button"
          variant="outline"
          disabled={action.isPending || form.formState.isDirty}
          onClick={() => {
            const key = action.requestKey(
              `reindex/${space}/${form.getValues('revision')}`,
            )
            action.mutate(() => skillsAPI.reindex(space, key))
          }}
        >
          {t('skills.reindex')}
        </Button>
        <Button type="submit" disabled={action.isPending || models.isLoading}>
          {t('skills.save')}
        </Button>
      </div>
    </form>
  )
}

export function SkillConfigDialog({
  space,
  onClose,
  onAccepted,
}: {
  space: string
  onClose: () => void
  onAccepted: (operation: AcceptedSkillOperation) => void
}) {
  const { t } = useTranslation()
  const query = useSkillConfig(space)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('skills.configuration')}</DialogTitle>
          <DialogDescription>
            {t('skills.configurationDescription')}
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <PageLoadingState
            compact
            title={t('skills.loading')}
            description=""
          />
        ) : query.data ? (
          <ConfigForm
            space={space}
            config={query.data}
            onAccepted={onAccepted}
          />
        ) : (
          <SkillError error={query.error} />
        )}
      </DialogContent>
    </Dialog>
  )
}
