import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LocalModelFields } from './local-model-fields'
import { PaddleOCRFields } from './paddleocr-fields'
import { OpenDataLoaderFields } from './opendataloader-fields'
import { getProviderFields, type ProviderDraft } from './provider-form-schema'
import { FACTORY_MODEL_TYPES } from '../constants'

interface ProviderFormFieldsProps {
  provider: string
  draft: ProviderDraft
  local: boolean
  editing: boolean
  showKey: boolean
  setShowKey: (value: boolean) => void
  change: <K extends keyof ProviderDraft>(
    name: K,
    value: ProviderDraft[K],
  ) => void
}

export function ProviderFormFields({
  provider,
  draft: d,
  local,
  editing,
  showKey,
  setShowKey,
  change,
}: ProviderFormFieldsProps) {
  const { t } = useTranslation()
  const prefix = useId()
  if (provider === 'PaddleOCR')
    return (
      <PaddleOCRFields
        modelName={d.modelName}
        apiUrl={d.paddleocrApiUrl}
        accessToken={d.paddleocrAccessToken}
        algorithm={d.paddleocrAlgorithm}
        onModelNameChange={(v) => change('modelName', v)}
        onApiUrlChange={(v) => change('paddleocrApiUrl', v)}
        onAccessTokenChange={(v) => change('paddleocrAccessToken', v)}
        onAlgorithmChange={(v) => change('paddleocrAlgorithm', v)}
      />
    )
  if (provider === 'OpenDataLoader')
    return (
      <OpenDataLoaderFields
        modelName={d.modelName}
        apiServer={d.opendataloaderApiServer}
        apiKey={d.opendataloaderApiKey}
        timeout={d.opendataloaderTimeout}
        onModelNameChange={(v) => change('modelName', v)}
        onApiServerChange={(v) => change('opendataloaderApiServer', v)}
        onApiKeyChange={(v) => change('opendataloaderApiKey', v)}
        onTimeoutChange={(v) => change('opendataloaderTimeout', v)}
      />
    )
  if (local)
    return (
      <>
        <LocalModelFields
          providerName={provider}
          modelTypes={
            FACTORY_MODEL_TYPES[provider] ?? FACTORY_MODEL_TYPES.Default
          }
          modelType={d.modelType}
          onModelTypeChange={(v) => change('modelType', v)}
          modelName={d.modelName}
          onModelNameChange={(v) => change('modelName', v)}
          baseUrl={d.baseUrl}
          onBaseUrlChange={(v) => change('baseUrl', v)}
          apiKey={d.apiKey}
          onApiKeyChange={(v) => change('apiKey', v)}
          showApiKey={showKey}
          onShowApiKeyChange={setShowKey}
          maxTokens={d.maxTokens}
          onMaxTokensChange={(v) => change('maxTokens', v)}
          vision={d.vision}
          onVisionChange={(v) => change('vision', v)}
          isTools={d.isTools}
          onToolsChange={(v) => change('isTools', v)}
          editing={editing}
        />
        {provider === 'OpenRouter' && (
          <div className="space-y-space-sm">
            <Label htmlFor={`${prefix}-providerOrder`}>
              {t('settings.models.form.providerOrder')}
            </Label>
            <Input
              id={`${prefix}-providerOrder`}
              value={d.providerOrder}
              onChange={(e) => change('providerOrder', e.target.value)}
            />
          </div>
        )}
      </>
    )
  return (
    <>
      {getProviderFields(provider, d, local).map((field) => {
        const id = field.id ?? `${prefix}-${field.name}`
        const label = t(`settings.models.form.${field.label}`)
        return (
          <div className="space-y-space-sm" key={field.name}>
            <Label htmlFor={id}>{label}</Label>
            {field.kind === 'capabilities' ? (
              <div
                id={id}
                role="group"
                aria-label={label}
                className="flex flex-wrap gap-space-sm"
              >
                {field.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-space-xs"
                  >
                    <Checkbox
                      checked={d[field.name].split(',').includes(option.value)}
                      onCheckedChange={(checked) =>
                        change(
                          field.name,
                          (checked === true
                            ? [
                                ...d[field.name].split(',').filter(Boolean),
                                option.value,
                              ]
                            : d[field.name]
                                .split(',')
                                .filter((value) => value !== option.value)
                          ).join(','),
                        )
                      }
                    />
                    {t(`common.modelPicker.capabilities.${option.value}`)}
                  </label>
                ))}
              </div>
            ) : field.kind === 'select' ? (
              <Select
                value={d[field.name]}
                onValueChange={(v) => change(field.name, v)}
              >
                <SelectTrigger id={id} aria-required={field.required}>
                  <SelectValue placeholder={label} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.translated ? t(option.label) : option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.kind === 'toggle' ? (
              <Switch
                id={id}
                checked={d[field.name]}
                onCheckedChange={(v) => change(field.name, v)}
              />
            ) : field.kind === 'number' ? (
              <Input
                id={id}
                type="number"
                min={0}
                step={1}
                required={field.required}
                value={Number.isFinite(d[field.name]) ? d[field.name] : ''}
                onChange={(e) =>
                  change(
                    field.name,
                    e.target.value === '' ? NaN : Number(e.target.value),
                  )
                }
              />
            ) : (
              <Input
                id={id}
                type={field.kind === 'secret' ? 'password' : 'text'}
                autoComplete="off"
                required={field.required}
                value={d[field.name]}
                onChange={(e) => change(field.name, e.target.value)}
                placeholder={
                  field.placeholder ? t(field.placeholder) : undefined
                }
              />
            )}
          </div>
        )
      })}
      {provider === 'Bedrock' && d.bedrockAuthMode === 'assume_role' && (
        <p className="text-sm text-text-secondary">
          {t('settings.models.form.assumeRoleHint')}
        </p>
      )}
    </>
  )
}
