import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'

interface OpenDataLoaderFieldsProps {
  modelName: string
  apiServer: string
  apiKey: string
  timeout: number
  onModelNameChange: (value: string) => void
  onApiServerChange: (value: string) => void
  onApiKeyChange: (value: string) => void
  onTimeoutChange: (value: number) => void
}

export const OpenDataLoaderFields = ({
  modelName,
  apiServer,
  apiKey,
  timeout,
  onModelNameChange,
  onApiServerChange,
  onApiKeyChange,
  onTimeoutChange,
}: OpenDataLoaderFieldsProps) => {
  const { t } = useTranslation()
  return (
    <>
      <div>
        <label
          htmlFor="opendataloader-model-type"
          className="mb-space-sm block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.modelType')}
        </label>
        <Input
          id="opendataloader-model-type"
          value="OCR"
          disabled
          className="cursor-not-allowed bg-surface-secondary"
        />
      </div>
      <div>
        <label
          htmlFor="opendataloader-model-name"
          className="mb-space-sm block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.modelName')}{' '}
          <span className="text-status-error">*</span>
        </label>
        <Input
          id="opendataloader-model-name"
          value={modelName}
          onChange={(event) => onModelNameChange(event.target.value)}
          placeholder={t('settings.models.form.ocrModelExample')}
          required
        />
      </div>
      <div>
        <label
          htmlFor="opendataloader-api-server"
          className="mb-space-sm block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.apiServer')}{' '}
          <span className="text-status-error">*</span>
        </label>
        <Input
          id="opendataloader-api-server"
          value={apiServer}
          onChange={(event) => onApiServerChange(event.target.value)}
          placeholder={t('settings.models.form.apiServerExample')}
          required
        />
      </div>
      <div>
        <label
          htmlFor="opendataloader-api-key"
          className="mb-space-sm block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.apiKey')}{' '}
          <span className="ml-space-xs font-normal text-text-tertiary">
            {t('settings.models.form.optional')}
          </span>
        </label>
        <Input
          id="opendataloader-api-key"
          type="password"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder={t('settings.models.form.credentialExample')}
        />
      </div>
      <div>
        <label
          htmlFor="opendataloader-timeout"
          className="mb-space-sm block text-sm font-medium text-text-primary"
        >
          {t('settings.models.form.timeout')}
        </label>
        <Input
          id="opendataloader-timeout"
          type="number"
          min={1}
          value={Number.isFinite(timeout) ? timeout : ''}
          onChange={(event) =>
            onTimeoutChange(
              event.target.value === '' ? NaN : Number(event.target.value),
            )
          }
        />
      </div>
    </>
  )
}
