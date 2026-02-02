import { FormFieldType, type FormFieldConfig } from '../types'

/**
 * S3 数据源表单字段配置
 */
export const getS3FormFields = (t: (key: string) => string): FormFieldConfig[] => [
  {
    label: 'AWS Region',
    name: 'config.credentials.region',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'us-east-1',
    tooltip: t('datasource.s3RegionTip'),
  },
  {
    label: t('datasource.authMethod'),
    name: 'config.credentials.authentication_method',
    type: FormFieldType.Select,
    required: true,
    defaultValue: 'access_key',
    options: [
      { label: 'Access Key', value: 'access_key' },
      { label: 'IAM Role ARN', value: 'iam_role_arn' },
    ],
  },
  {
    label: 'AWS Access Key ID',
    name: 'config.credentials.aws_access_key_id',
    type: FormFieldType.Text,
    required: true,
    showWhen: { field: 'config.credentials.authentication_method', value: 'access_key' },
  },
  {
    label: 'AWS Secret Access Key',
    name: 'config.credentials.aws_secret_access_key',
    type: FormFieldType.Password,
    required: true,
    showWhen: { field: 'config.credentials.authentication_method', value: 'access_key' },
  },
  {
    label: 'IAM Role ARN',
    name: 'config.credentials.aws_role_arn',
    type: FormFieldType.Text,
    required: true,
    placeholder: 'arn:aws:iam::123456789012:role/MyRole',
    showWhen: { field: 'config.credentials.authentication_method', value: 'iam_role_arn' },
  },
  {
    label: 'Bucket Name',
    name: 'config.bucket_name',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'Prefix',
    name: 'config.prefix',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'documents/',
    tooltip: t('datasource.s3PrefixTip'),
  },
  {
    label: t('datasource.s3Compatible'),
    name: 'config.bucket_type',
    type: FormFieldType.Select,
    required: false,
    defaultValue: 's3',
    options: [
      { label: 'Amazon S3', value: 's3' },
      { label: 'MinIO', value: 'minio' },
      { label: t('datasource.otherS3Compatible'), value: 'other' },
    ],
  },
  {
    label: 'Endpoint URL',
    name: 'config.credentials.endpoint_url',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'https://s3.example.com',
    showWhen: { field: 'config.bucket_type', value: ['minio', 'other'] },
    tooltip: t('datasource.s3EndpointTip'),
  },
  {
    label: 'Addressing Style',
    name: 'config.credentials.addressing_style',
    type: FormFieldType.Select,
    required: false,
    defaultValue: 'virtual',
    options: [
      { label: 'Virtual', value: 'virtual' },
      { label: 'Path', value: 'path' },
    ],
    showWhen: { field: 'config.bucket_type', value: ['minio', 'other'] },
  },
]

/**
 * S3 数据源默认值
 */
export const s3DefaultValues = {
  name: '',
  source: 's3',
  config: {
    bucket_name: '',
    bucket_type: 's3',
    prefix: '',
    credentials: {
      aws_access_key_id: '',
      aws_secret_access_key: '',
      region: '',
      authentication_method: 'access_key',
      aws_role_arn: '',
      endpoint_url: '',
      addressing_style: 'virtual',
    },
  },
}
