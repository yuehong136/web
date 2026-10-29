import { FormFieldType, type FormFieldConfig } from '../types'

const getCommonDatabaseFormFields = (
  t: (key: string) => string,
  port: string,
  tooltipPrefix: 'mysql' | 'postgresql' | 'mssql',
): FormFieldConfig[] => [
  {
    label: t('datasource.fieldHost'),
    name: 'config.host',
    type: FormFieldType.Text,
    required: true,
    placeholder: 'localhost',
  },
  {
    label: t('datasource.fieldPort'),
    name: 'config.port',
    type: FormFieldType.Number,
    required: true,
    placeholder: port,
    step: 1,
    validate: (value) => {
      const numeric =
        typeof value === 'number'
          ? value
          : typeof value === 'string' && value.trim()
            ? Number(value)
            : NaN
      return Number.isInteger(numeric) && numeric >= 1 && numeric <= 65535
        ? true
        : 'datasource.invalidDatabasePort'
    },
  },
  {
    label: t('datasource.fieldDatabase'),
    name: 'config.database',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: t('datasource.fieldUsername'),
    name: 'config.credentials.username',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: t('datasource.fieldPassword'),
    name: 'config.credentials.password',
    type: FormFieldType.Password,
    required: true,
  },
  {
    label: t('datasource.fieldSqlQuery'),
    name: 'config.query',
    type: FormFieldType.Textarea,
    required: tooltipPrefix === 'mssql',
    placeholder:
      tooltipPrefix === 'mssql'
        ? 'SELECT id, body FROM dbo.records'
        : t('datasource.rdbmsQueryPlaceholder'),
    tooltip: t(`datasource.${tooltipPrefix}QueryTip`),
  },
  {
    label: t('datasource.fieldContentColumns'),
    name: 'config.content_columns',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'title,description,content',
    tooltip: t(`datasource.${tooltipPrefix}ContentColumnsTip`),
  },
  {
    label: t('datasource.fieldMetadataColumns'),
    name: 'config.metadata_columns',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'id,category,status',
    tooltip: t(`datasource.${tooltipPrefix}MetadataColumnsTip`),
  },
  {
    label: t('datasource.fieldIdColumn'),
    name: 'config.id_column',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'id',
    tooltip: t(`datasource.${tooltipPrefix}IdColumnTip`),
  },
  {
    label: t('datasource.fieldTimestampColumn'),
    name: 'config.timestamp_column',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'updated_at',
    tooltip: t(`datasource.${tooltipPrefix}TimestampColumnTip`),
  },
]

export const getMySQLFormFields = (
  t: (key: string) => string,
): FormFieldConfig[] => getCommonDatabaseFormFields(t, '3306', 'mysql')

export const getPostgreSQLFormFields = (
  t: (key: string) => string,
): FormFieldConfig[] => getCommonDatabaseFormFields(t, '5432', 'postgresql')

export const getMSSQLFormFields = (
  t: (key: string) => string,
): FormFieldConfig[] => getCommonDatabaseFormFields(t, '1433', 'mssql')
