import { DataSourceKey, FormFieldType, type FormFieldConfig } from '../types'

const authModes = ['account_key', 'connection_string', 'sas_token'] as const
type AzureBlobAuthMode = (typeof authModes)[number]

const credentialsByMode: Record<AzureBlobAuthMode, string[]> = {
  account_key: ['account_name', 'account_key', 'container_name'],
  connection_string: ['connection_string', 'container_name'],
  sas_token: ['container_url', 'sas_token'],
}

export const azureBlobDefaultValues = {
  name: '',
  source: DataSourceKey.AZURE_BLOB,
  config: {
    auth_mode: 'account_key',
    prefix: '',
    batch_size: 2,
    allow_images: false,
    sync_deleted_files: false,
    credentials: {
      account_name: '',
      account_key: '',
      container_name: '',
      connection_string: '',
      container_url: '',
      sas_token: '',
    },
  },
}

/** Send only the selected mode's credentials; retain unrelated extension keys. */
export function prepareAzureBlobConfig(config: Record<string, unknown>) {
  const mode = config.auth_mode as AzureBlobAuthMode
  if (!authModes.includes(mode)) throw new Error('Invalid Azure auth mode')
  const credentials = {
    ...(config.credentials as Record<string, unknown> | undefined),
  }
  for (const key of new Set(Object.values(credentialsByMode).flat())) {
    if (!credentialsByMode[mode].includes(key)) delete credentials[key]
  }
  const prepared: Record<string, unknown> = {
    ...config,
    credentials,
    sync_deleted_files: false,
  }
  if (prepared.batch_size == null || prepared.batch_size === '')
    delete prepared.batch_size
  return prepared
}

function validContainerUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value !== value.trim()) return false
  try {
    const url = new URL(value)
    const container = url.pathname.slice(1)
    return (
      url.protocol === 'https:' &&
      !url.port &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      /^[a-z0-9]{3,24}\.blob\.core\.(windows\.net|chinacloudapi\.cn|usgovcloudapi\.net)$/.test(
        url.hostname,
      ) &&
      (container === '$root' ||
        container === '$web' ||
        (/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(container) &&
          !container.includes('--'))) &&
      value === `https://${url.hostname}/${container}`
    )
  } catch {
    return false
  }
}

export function getAzureBlobFormFields(
  t: (key: string) => string,
): FormFieldConfig[] {
  const credential = (
    key: string,
    mode: AzureBlobAuthMode | AzureBlobAuthMode[],
    secret = false,
  ): FormFieldConfig => ({
    name: `config.credentials.${key}`,
    label: t(`datasource.azureBlob.${key}`),
    tooltip: t(`datasource.azureBlob.${key}Tip`),
    type: secret ? FormFieldType.Password : FormFieldType.Text,
    required: true,
    showWhen: { field: 'config.auth_mode', value: mode },
    ...(key === 'container_url'
      ? {
          placeholder: 'https://account.blob.core.windows.net/container',
          validate: (value: unknown) =>
            validContainerUrl(value) ||
            'datasource.azureBlob.containerUrlInvalid',
        }
      : {}),
  })
  return [
    {
      name: 'config.auth_mode',
      label: t('datasource.azureBlob.authMode'),
      tooltip: t('datasource.azureBlob.authModeTip'),
      type: FormFieldType.Select,
      required: true,
      options: authModes.map((mode) => ({
        label: t(`datasource.azureBlob.${mode}Mode`),
        value: mode,
      })),
      validate: (value) =>
        authModes.includes(value as AzureBlobAuthMode) ||
        'datasource.azureBlob.authModeInvalid',
    },
    credential('account_name', 'account_key'),
    credential('account_key', 'account_key', true),
    credential('connection_string', 'connection_string', true),
    credential('container_name', ['account_key', 'connection_string']),
    credential('container_url', 'sas_token'),
    credential('sas_token', 'sas_token', true),
    {
      name: 'config.prefix',
      label: t('datasource.azureBlob.prefix'),
      tooltip: t('datasource.azureBlob.prefixTip'),
      type: FormFieldType.Text,
      placeholder: 'documents/reports/',
    },
    {
      name: 'config.batch_size',
      label: t('datasource.azureBlob.batchSize'),
      tooltip: t('datasource.azureBlob.batchSizeTip'),
      type: FormFieldType.Number,
      step: 1,
      validate: (value) =>
        value == null ||
        value === '' ||
        (typeof value === 'number' &&
          Number.isInteger(value) &&
          value >= 1 &&
          value <= 1000) ||
        'datasource.azureBlob.batchSizeInvalid',
    },
    {
      name: 'config.allow_images',
      label: t('datasource.azureBlob.allowImages'),
      type: FormFieldType.Checkbox,
    },
  ]
}
