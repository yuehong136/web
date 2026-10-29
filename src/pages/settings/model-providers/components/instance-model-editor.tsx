import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  modelTypeSchema,
  type ModelType,
  type InstanceModelInput,
} from '@/api/llm-provider-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
const EMPTY_NAMES: ReadonlySet<string> = new Set()

export function InstanceModelEditor({
  onSubmit,
  pending = false,
  submitLabel,
  existingNames = EMPTY_NAMES,
}: {
  onSubmit: (model: InstanceModelInput) => void | Promise<void>
  pending?: boolean
  submitLabel: string
  existingNames?: ReadonlySet<string>
}) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [types, setTypes] = useState<ModelType[]>(['chat'])
  const [tokens, setTokens] = useState<number | undefined>(0)
  const [tools, setTools] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <form
      inert={pending}
      className="flex flex-col gap-space-base px-space-lg pb-space-lg"
      onSubmit={async (event) => {
        event.preventDefault()
        if (pending) return
        setFailed(false)
        if (
          !name.trim() ||
          !types.length ||
          tokens === undefined ||
          !Number.isSafeInteger(tokens) ||
          tokens < 0 ||
          existingNames.has(name.trim())
        ) {
          setFailed(true)
          return
        }
        try {
          await onSubmit({
            model_name: name.trim(),
            model_types: types,
            max_tokens: tokens,
            is_tools: tools,
          })
        } catch {
          setFailed(true)
        }
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
        autoFocus
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
            event.target.value === '' ? undefined : Number(event.target.value),
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
          {t(
            existingNames.has(name.trim())
              ? 'settings.models.discovery.duplicate'
              : 'settings.models.instances.failed',
          )}
        </p>
      )}
      <Button type="submit" loading={pending} disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
