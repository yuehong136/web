import { FormFieldType, type FormFieldConfig } from '../types'

export const getR2FormFields = (): FormFieldConfig[] => [
  {
    label: 'R2 Account ID',
    name: 'config.credentials.account_id',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'R2 Access Key ID',
    name: 'config.credentials.r2_access_key_id',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'R2 Secret Access Key',
    name: 'config.credentials.r2_secret_access_key',
    type: FormFieldType.Password,
    required: true,
  },
  {
    label: 'Bucket Name',
    name: 'config.bucket_name',
    type: FormFieldType.Text,
    required: true,
  },
]

export const getGoogleCloudStorageFormFields = (): FormFieldConfig[] => [
  {
    label: 'GCS Access Key ID',
    name: 'config.credentials.access_key_id',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'GCS Secret Access Key',
    name: 'config.credentials.secret_access_key',
    type: FormFieldType.Password,
    required: true,
  },
  {
    label: 'Bucket Name',
    name: 'config.bucket_name',
    type: FormFieldType.Text,
    required: true,
  },
]

export const getOciStorageFormFields = (): FormFieldConfig[] => [
  {
    label: 'OCI Namespace',
    name: 'config.credentials.namespace',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'OCI Region',
    name: 'config.credentials.region',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'OCI Access Key ID',
    name: 'config.credentials.access_key_id',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'OCI Secret Access Key',
    name: 'config.credentials.secret_access_key',
    type: FormFieldType.Password,
    required: true,
  },
  {
    label: 'Bucket Name',
    name: 'config.bucket_name',
    type: FormFieldType.Text,
    required: true,
  },
]
