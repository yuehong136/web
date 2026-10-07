import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CenterConfigSection } from './center-config-section'
import { ToggleField, type ConfigBindings } from './config-fields'

export function ExperienceConfig({ config, onChange }: ConfigBindings) {
  const { t } = useTranslation()
  const id = useId()
  const [open, setOpen] = useState(false)
  return (
    <div className="mx-auto w-full max-w-3xl space-y-space-xl p-space-lg">
      {(['prologue', 'empty_response'] as const).map((field) => {
        const key = field === 'prologue' ? 'prologue' : 'emptyResponse'
        return (
          <div key={field} className="space-y-space-sm">
            <Label htmlFor={`${id}-${field}`}>
              {t(`studio.editor.${key}`)}
            </Label>
            <p
              id={`${id}-${field}-hint`}
              className="text-xs text-text-secondary"
            >
              {t(`studio.editor.${key}Hint`)}
            </p>
            <Textarea
              id={`${id}-${field}`}
              aria-describedby={`${id}-${field}-hint`}
              rows={4}
              value={config.prompt_config[field]}
              onChange={(event) =>
                onChange('prompt_config', {
                  ...config.prompt_config,
                  [field]: event.target.value,
                })
              }
            />
          </div>
        )
      })}
      <CenterConfigSection
        title={t('studio.editor.extraFeatures')}
        open={open}
        onOpenChange={setOpen}
      >
        <ToggleField config={config} onChange={onChange} field="tts" />
        <ToggleField
          config={config}
          onChange={onChange}
          field="refine_multiturn"
        />
      </CenterConfigSection>
    </div>
  )
}
