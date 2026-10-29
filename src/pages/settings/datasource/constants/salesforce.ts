import { DataSourceKey, FormFieldType, type FormFieldConfig } from '../types'

export const salesforceDefaultValues = {
  name: '',
  source: DataSourceKey.SALESFORCE,
  config: {
    api_version: 'v59.0',
    batch_size: 100,
    credentials: { instance_url: '', client_id: '', client_secret: '' },
  },
}

export function getSalesforceFormValues(config: Record<string, unknown>) {
  const objects = config.objects
  const names = Array.isArray(objects) ? objects.join(',') : (objects ?? '')
  return {
    salesforceObjectScope:
      objects == null ? 'default' : names === '' ? 'none' : 'selected',
    config: { ...config, objects: names },
  }
}

/** Explicit empty scope stays empty; only omission asks for default objects. */
export function prepareSalesforceConfig(
  config: Record<string, unknown>,
  scope: unknown,
) {
  const stored = config.credentials as Record<string, unknown> | undefined
  const prepared: Record<string, unknown> = {
    ...config,
    credentials: Object.fromEntries(
      ['instance_url', 'client_id', 'client_secret'].map((key) => [
        key,
        stored?.[key],
      ]),
    ),
    sync_deleted_files: false,
  }
  if (scope === 'default') delete prepared.objects
  else if (scope === 'none') prepared.objects = []
  else {
    const objects = config.objects
    prepared.objects =
      typeof objects === 'string'
        ? objects
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
        : objects
  }
  for (const key of ['api_version', 'batch_size']) {
    if (prepared[key] == null || prepared[key] === '') delete prepared[key]
  }
  return prepared
}

function validOrgOrigin(value: unknown): boolean {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return (
      value === url.origin &&
      url.protocol === 'https:' &&
      !url.port &&
      /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+salesforce\.com$/.test(
        url.hostname,
      )
    )
  } catch {
    return false
  }
}

export function getSalesforceFormFields(
  t: (key: string) => string,
): FormFieldConfig[] {
  const field = (key: string, type = FormFieldType.Text): FormFieldConfig => ({
    name: `config.credentials.${key}`,
    label: t(`datasource.salesforce.${key}`),
    tooltip: t(`datasource.salesforce.${key}Tip`),
    type,
    required: true,
  })
  return [
    {
      ...field('instance_url'),
      placeholder: 'https://your-domain.my.salesforce.com',
      validate: (value) =>
        validOrgOrigin(value) || 'datasource.salesforce.instanceUrlInvalid',
    },
    field('client_id'),
    field('client_secret', FormFieldType.Password),
    {
      name: 'salesforceObjectScope',
      label: t('datasource.salesforce.objectScope'),
      tooltip: t('datasource.salesforce.objectScopeTip'),
      type: FormFieldType.Select,
      required: true,
      options: ['default', 'none', 'selected'].map((value) => ({
        value,
        label: t(`datasource.salesforce.${value}Scope`),
      })),
    },
    {
      name: 'config.objects',
      label: t('datasource.salesforce.objects'),
      tooltip: t('datasource.salesforce.objectsTip'),
      type: FormFieldType.Text,
      required: true,
      showWhen: { field: 'salesforceObjectScope', value: 'selected' },
      placeholder: 'Account,Contact,Custom_Object__c',
      validate: (value) =>
        (typeof value === 'string' &&
          value
            .split(',')
            .every((name) => /^[A-Za-z][A-Za-z0-9_]*$/.test(name.trim()))) ||
        'datasource.salesforce.objectsInvalid',
    },
    {
      name: 'config.api_version',
      label: t('datasource.salesforce.apiVersion'),
      tooltip: t('datasource.salesforce.apiVersionTip'),
      type: FormFieldType.Text,
      placeholder: 'v59.0',
      validate: (value) =>
        value == null ||
        value === '' ||
        (typeof value === 'string' && /^v[1-9]\d*\.\d+$/.test(value)) ||
        'datasource.salesforce.apiVersionInvalid',
    },
    {
      name: 'config.batch_size',
      label: t('datasource.salesforce.batchSize'),
      tooltip: t('datasource.salesforce.batchSizeTip'),
      type: FormFieldType.Number,
      step: 1,
      validate: (value) =>
        value == null ||
        value === '' ||
        (typeof value === 'number' &&
          Number.isInteger(value) &&
          value >= 1 &&
          value <= 1000) ||
        'datasource.salesforce.batchSizeInvalid',
    },
  ]
}
