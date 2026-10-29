import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InstanceModelInput } from '@/api/llm-provider-types'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ModelCapabilities } from '@/components/models/model-capabilities'
import { InstanceModelEditor } from './instance-model-editor'

export function CustomModelDrafts({
  models,
  selected,
  existingNames,
  pending,
  add,
  changeSelection,
}: {
  models: ReadonlyMap<string, InstanceModelInput>
  selected: ReadonlyMap<string, InstanceModelInput>
  existingNames: ReadonlySet<string>
  pending: boolean
  add: (model: InstanceModelInput) => void
  changeSelection: (models: Map<string, InstanceModelInput>) => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const finish = () => {
    setEditing(false)
    trigger.current?.focus()
  }
  return (
    <section
      className="space-y-space-sm"
      aria-label={t('settings.models.discovery.customModels')}
    >
      <Button
        ref={trigger}
        type="button"
        variant="outline"
        disabled={pending || selected.size >= 100}
        onClick={() => setEditing(true)}
      >
        {t('settings.models.discovery.addCustom')}
      </Button>
      {editing && (
        <div className="rounded-radius-md border border-border-default">
          <InstanceModelEditor
            pending={pending}
            existingNames={existingNames}
            submitLabel={t('settings.models.discovery.addToSelection')}
            onSubmit={(model) => {
              add(model)
              finish()
            }}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={finish}
          >
            {t('common.cancel')}
          </Button>
        </div>
      )}
      {models.size > 0 && (
        <fieldset disabled={pending}>
          <legend className="text-sm text-text-secondary">
            {t('settings.models.discovery.customModels')}
          </legend>
          <ul className="max-h-48 overflow-auto">
            {[...models.values()].map((model) => (
              <li key={model.model_name} className="p-space-sm">
                <label className="flex items-start gap-space-sm">
                  <Checkbox
                    aria-label={model.model_name}
                    checked={selected.has(model.model_name)}
                    disabled={
                      !selected.has(model.model_name) && selected.size >= 100
                    }
                    onCheckedChange={(checked) => {
                      const next = new Map(selected)
                      if (checked === true) next.set(model.model_name, model)
                      else next.delete(model.model_name)
                      changeSelection(next)
                    }}
                  />
                  <span className="min-w-0 break-words">
                    {model.model_name}
                    <ModelCapabilities
                      types={model.model_types}
                      tools={model.is_tools}
                    />
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
    </section>
  )
}
