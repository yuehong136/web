import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'

interface LocalModelFieldsProps {
  providerName: string
  modelTypes: { value: string; label: string }[]
  modelType: string
  onModelTypeChange: (value: string) => void
  modelName: string
  onModelNameChange: (value: string) => void
  baseUrl: string
  onBaseUrlChange: (value: string) => void
  apiKey: string
  onApiKeyChange: (value: string) => void
  showApiKey: boolean
  onShowApiKeyChange: (value: boolean) => void
  maxTokens: number
  onMaxTokensChange: (value: number) => void
  vision: boolean
  onVisionChange: (value: boolean) => void
  isTools: boolean
  onToolsChange: (value: boolean) => void
  editing: boolean
}

export const LocalModelFields = (props: LocalModelFieldsProps) => {
  const { t } = useTranslation()
  const key = 'settings.models.localModel'
  const selectedTypes = props.modelType.split(',').filter(Boolean)
  const supportsTools =
    selectedTypes.includes('chat') || selectedTypes.includes('image2text')
  return (
    <>
      <div>
        <label
          htmlFor="local-model-type"
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          {t(`${key}.type`)}
        </label>
        <div
          id="local-model-type"
          role="group"
          aria-label={t(`${key}.type`)}
          className="flex flex-wrap gap-space-sm"
        >
          {props.modelTypes.map((type) => (
            <label key={type.value} className="flex items-center gap-space-xs">
              <Checkbox
                checked={selectedTypes.includes(type.value)}
                onCheckedChange={(checked) =>
                  props.onModelTypeChange(
                    (checked === true
                      ? [...selectedTypes, type.value]
                      : selectedTypes.filter((value) => value !== type.value)
                    ).join(','),
                  )
                }
              />
              {t(`common.modelPicker.capabilities.${type.value}`)}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label
          htmlFor="local-model-name"
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          {t(`${key}.name`)}
        </label>
        <Input
          id="local-model-name"
          value={props.modelName}
          disabled={props.editing}
          onChange={(event) => props.onModelNameChange(event.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="local-model-url"
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.baseUrl')}
        </label>
        <Input
          id="local-model-url"
          value={props.baseUrl}
          onChange={(event) => props.onBaseUrlChange(event.target.value)}
          placeholder={
            props.providerName === 'Ollama'
              ? 'http://localhost:11434'
              : 'http://localhost:8000'
          }
        />
      </div>
      <div>
        <label
          htmlFor="local-model-key"
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.apiKey')}
        </label>
        <div className="relative">
          <Input
            id="local-model-key"
            type={props.showApiKey ? 'text' : 'password'}
            value={props.apiKey}
            onChange={(event) => props.onApiKeyChange(event.target.value)}
            placeholder={t(
              `${key}.${props.editing ? 'editKeyHint' : 'keyHint'}`,
            )}
            className="pr-10"
          />
          <button
            type="button"
            aria-label={t(
              props.showApiKey
                ? 'auth.login.hidePassword'
                : 'auth.login.showPassword',
            )}
            onClick={() => props.onShowApiKeyChange(!props.showApiKey)}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
          >
            {props.showApiKey ? (
              <EyeOff className="size-icon-sm" />
            ) : (
              <Eye className="size-icon-sm" />
            )}
          </button>
        </div>
      </div>
      <div>
        <label
          htmlFor="local-model-tokens"
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.maxTokens')}
        </label>
        <Input
          id="local-model-tokens"
          type="number"
          value={Number.isFinite(props.maxTokens) ? props.maxTokens : ''}
          onChange={(event) =>
            props.onMaxTokensChange(
              event.target.value === '' ? NaN : Number(event.target.value),
            )
          }
          min={0}
        />
      </div>
      {selectedTypes.includes('chat') && (
        <div className="flex items-center justify-between">
          <label
            htmlFor="local-model-vision"
            className="text-sm font-medium text-text-primary"
          >
            {t(`${key}.vision`)}
          </label>
          <Switch
            id="local-model-vision"
            checked={props.vision}
            onCheckedChange={props.onVisionChange}
          />
        </div>
      )}
      {supportsTools && (
        <div className="space-y-space-xs">
          <div className="flex items-center justify-between">
            <label
              htmlFor="local-model-tools"
              className="text-sm font-medium text-text-primary"
            >
              {t(`${key}.tools`)}
            </label>
            <Switch
              id="local-model-tools"
              checked={props.isTools}
              onCheckedChange={props.onToolsChange}
              aria-describedby="local-model-tools-hint"
            />
          </div>
          <p
            id="local-model-tools-hint"
            className="text-sm text-text-secondary"
          >
            {t(`${key}.toolsHint`)}
          </p>
        </div>
      )}
    </>
  )
}
