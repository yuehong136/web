import { useTranslation } from 'react-i18next'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const supportsTools =
    props.modelType === 'chat' || props.modelType === 'image2text'
  return (
    <>
      <div>
        <label
          htmlFor="local-model-type"
          className="mb-2 block text-sm font-medium text-text-primary"
        >
          {t(`${key}.type`)}
        </label>
        <Select value={props.modelType} onValueChange={props.onModelTypeChange}>
          <SelectTrigger id="local-model-type" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.modelTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          Base URL
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
          API Key
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
          Max Tokens
        </label>
        <Input
          id="local-model-tokens"
          type="number"
          value={props.maxTokens}
          onChange={(event) =>
            props.onMaxTokensChange(parseInt(event.target.value) || 8192)
          }
          min={1}
        />
      </div>
      {props.modelType === 'chat' && (
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
