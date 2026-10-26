import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { modelProvidersAPI } from '@/api/llm-providers'
import { modelTypeSchema, type ModelType } from '@/api/llm-provider-types'
import { useModelProviderMutation } from '@/hooks/use-model-provider-request'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function InstanceModelForm({
  provider,
  instance,
  close,
}: {
  provider: string
  instance: string
  close: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [types, setTypes] = useState<ModelType[]>(['chat'])
  const [tokens, setTokens] = useState<number | undefined>(0)
  const [tools, setTools] = useState(false)
  const [failed, setFailed] = useState(false)
  const mutation = useModelProviderMutation()
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && !mutation.isPending && close()}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t('settings.models.instances.addModel')}</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-space-base px-space-lg pb-space-lg"
          onSubmit={(event) => {
            event.preventDefault()
            setFailed(false)
            if (
              !name.trim() ||
              !types.length ||
              tokens === undefined ||
              !Number.isSafeInteger(tokens) ||
              tokens < 0
            ) {
              setFailed(true)
              return
            }
            mutation.mutate(
              async () =>
                modelProvidersAPI.addModel(provider, instance, {
                  model_name: name.trim(),
                  model_types: types,
                  max_tokens: tokens,
                  is_tools: tools,
                }),
              { onSuccess: close, onError: () => setFailed(true) },
            )
          }}
        >
          <Label htmlFor="instance-model-name">
            {t('settings.models.localModel.name')}
          </Label>
          <Input
            id="instance-model-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <fieldset className="flex flex-wrap gap-space-sm">
            <legend>{t('settings.models.localModel.type')}</legend>
            {modelTypeSchema.options.map((type) => (
              <label key={type} className="flex items-center gap-space-xs">
                <Checkbox
                  checked={types.includes(type)}
                  onCheckedChange={(checked) =>
                    setTypes((current) =>
                      checked
                        ? [...current, type]
                        : current.filter((item) => item !== type),
                    )
                  }
                />
                {type}
              </label>
            ))}
          </fieldset>
          <Label htmlFor="instance-model-tokens">
            {t('settings.models.instances.maxTokens')}
          </Label>
          <Input
            type="number"
            id="instance-model-tokens"
            value={tokens ?? ''}
            onChange={(event) =>
              setTokens(
                event.target.value === ''
                  ? undefined
                  : Number(event.target.value),
              )
            }
            min={0}
            step={1}
          />
          <label className="flex items-center gap-space-sm">
            <Checkbox
              checked={tools}
              onCheckedChange={(checked) => setTools(checked === true)}
            />
            {t('settings.models.localModel.tools')}
          </label>
          {failed && (
            <p role="alert" className="text-status-error">
              {t('settings.models.instances.failed')}
            </p>
          )}
          <Button type="submit" loading={mutation.isPending}>
            {t('common.save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
