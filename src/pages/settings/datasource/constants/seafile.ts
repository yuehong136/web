import { FormFieldType, type FormFieldConfig } from '../types'

export function getSeafileFormFields(
  t: (key: string) => string,
): FormFieldConfig[] {
  return [
    {
      label: t('datasource.seafileUrl'),
      name: 'config.seafile_url',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: t('datasource.seafileScope'),
      name: 'config.sync_scope',
      type: FormFieldType.Select,
      required: true,
      options: ['account', 'library', 'directory'].map((value) => ({
        value,
        label: t(`datasource.seafileScope_${value}`),
      })),
    },
    {
      label: t('datasource.seafileRepo'),
      name: 'config.repo_id',
      type: FormFieldType.Text,
      tooltip: t('datasource.seafileScopeTip'),
    },
    {
      label: t('datasource.seafilePath'),
      name: 'config.sync_path',
      type: FormFieldType.Text,
      tooltip: t('datasource.seafileScopeTip'),
    },
    {
      label: t('datasource.seafileShared'),
      name: 'config.include_shared',
      type: FormFieldType.Checkbox,
      defaultValue: true,
    },
    {
      label: t('datasource.seafileToken'),
      name: 'config.credentials.seafile_token',
      type: FormFieldType.Password,
      tooltip: t('datasource.seafileCredentialsTip'),
    },
    {
      label: t('datasource.seafileRepoToken'),
      name: 'config.credentials.repo_token',
      type: FormFieldType.Password,
      tooltip: t('datasource.seafileCredentialsTip'),
    },
  ]
}
