import { DataSourceKey, FormFieldType, type FormFieldConfig } from '../types'

type MicrosoftSource = DataSourceKey.TEAMS | DataSourceKey.ONEDRIVE
const defaults = (source: MicrosoftSource) => ({
  name: '',
  source,
  config: {
    batch_size: 32,
    sync_deleted_files: false,
    ...(source === DataSourceKey.ONEDRIVE
      ? { drive_ids: [], folder_path: '' }
      : {}),
    credentials: { tenant_id: '', client_id: '', client_secret: '' },
  },
})
export const microsoftDefaultValues = {
  [DataSourceKey.TEAMS]: defaults(DataSourceKey.TEAMS),
  [DataSourceKey.ONEDRIVE]: defaults(DataSourceKey.ONEDRIVE),
}

export function getMicrosoftFormFields(
  source: MicrosoftSource,
  t: (key: string) => string,
): FormFieldConfig[] {
  const fields: FormFieldConfig[] = [
    ...['tenant_id', 'client_id', 'client_secret'].map(
      (key): FormFieldConfig => ({
        label: t(`datasource.microsoft.${key}`),
        name: `config.credentials.${key}`,
        type:
          key === 'client_secret' ? FormFieldType.Password : FormFieldType.Text,
        required: true,
        tooltip: t(`datasource.microsoft.${source}Permissions`),
      }),
    ),
  ]
  if (source === DataSourceKey.ONEDRIVE) {
    fields.push(
      {
        label: t('datasource.microsoft.driveIds'),
        name: 'config.drive_ids',
        type: FormFieldType.Tag,
        placeholder: t('datasource.microsoft.driveIdsPlaceholder'),
        tooltip: t('datasource.microsoft.driveIdsTip'),
        validate: (value) =>
          (Array.isArray(value) &&
            value.every(
              (id) =>
                typeof id === 'string' &&
                id.trim().length > 0 &&
                id === id.trim(),
            ) &&
            new Set(value).size === value.length) ||
          'datasource.microsoft.driveIdsInvalid',
      },
      {
        label: t('datasource.microsoft.folderPath'),
        name: 'config.folder_path',
        type: FormFieldType.Text,
        placeholder: '/Documents/Reports',
        tooltip: t('datasource.microsoft.folderPathTip'),
        validate: (value) => {
          if (value == null || value === '') return true
          if (typeof value !== 'string')
            return 'datasource.microsoft.folderPathInvalid'
          return (
            !value
              .trim()
              .split('/')
              .some(
                (part) =>
                  part === '.' ||
                  part === '..' ||
                  [...part].some((character) => character.charCodeAt(0) < 32),
              ) || 'datasource.microsoft.folderPathInvalid'
          )
        },
      },
    )
  }
  fields.push({
    label: t('datasource.microsoft.batchSize'),
    name: 'config.batch_size',
    type: FormFieldType.Number,
    step: 1,
    validate: (value) =>
      value == null ||
      value === '' ||
      (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) ||
      'datasource.microsoft.batchSizeInvalid',
  })
  return fields
}
