import { FormFieldType, type FormFieldConfig } from '../types'

export function getDingTalkFormFields(
  t: (key: string) => string,
): FormFieldConfig[] {
  return [
    {
      label: t('datasource.dingtalkTableId'),
      name: 'config.table_id',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: t('datasource.dingtalkOperatorId'),
      name: 'config.operator_id',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: t('datasource.dingtalkAccessToken'),
      name: 'config.credentials.access_token',
      type: FormFieldType.Password,
      required: true,
    },
  ]
}
