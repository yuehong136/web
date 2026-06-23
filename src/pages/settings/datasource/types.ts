import type { ReactNode } from 'react'

/**
 * 数据源类型枚举 - 支持 23 种数据源
 */
export enum DataSourceKey {
  // 云存储类
  S3 = 's3',
  R2 = 'r2',
  GOOGLE_CLOUD_STORAGE = 'google_cloud_storage',
  OCI_STORAGE = 'oci_storage',
  DROPBOX = 'dropbox',
  BOX = 'box',
  WEBDAV = 'webdav',

  // 协作平台类
  NOTION = 'notion',
  CONFLUENCE = 'confluence',
  JIRA = 'jira',
  ASANA = 'asana',
  AIRTABLE = 'airtable',
  ZENDESK = 'zendesk',

  // 代码仓库类
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',

  // 数据库类
  MYSQL = 'mysql',
  POSTGRESQL = 'postgresql',

  // 其他
  GOOGLE_DRIVE = 'google_drive',
  GMAIL = 'gmail',
  DISCORD = 'discord',
  MOODLE = 'moodle',
  IMAP = 'imap',
}

/**
 * 数据源运行状态
 */
export const enum DataSourceStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * 数据源信息（用于展示）
 */
export interface IDataSourceInfo {
  id: DataSourceKey
  name: string
  description: string
  icon: ReactNode
}

/**
 * 数据源基础信息
 */
export interface IDataSourceBase {
  id: string
  name: string
  source: DataSourceKey
}

/**
 * 数据源完整信息
 */
export interface IDataSource extends IDataSourceBase {
  config: Record<string, any>
  indexing_start: string | null
  input_type: string
  prune_freq: number
  refresh_freq: number
  status: DataSourceStatus
  tenant_id: string
  update_date: string
  update_time: number
  create_date?: string
  create_time?: number
}

/**
 * 数据源日志
 */
export interface IDataSourceLog {
  id: string
  connector_id: string
  kb_id: string
  kb_name: string
  name: string
  source: DataSourceKey
  status: DataSourceStatus
  error_count: number
  error_msg: string
  new_docs_indexed: number
  poll_range_start: string | null
  poll_range_end: string | null
  reindex: string
  timeout_secs: number
  tenant_id: string
  create_date?: string
  update_date?: string
}

/**
 * 数据源信息映射类型
 */
export type IDataSourceInfoMap = Record<
  DataSourceKey,
  {
    name: string
    description: string
    icon: ReactNode
  }
>

/**
 * 数据源关联知识库的信息
 */
export interface IConnector {
  id: string
  name: string
  source: DataSourceKey
  auto_parse: '0' | '1'
  status?: DataSourceStatus
}

/**
 * 表单字段类型
 */
export const enum FormFieldType {
  Text = 'text',
  Password = 'password',
  Number = 'number',
  Select = 'select',
  Checkbox = 'checkbox',
  Tag = 'tag',
  Textarea = 'textarea',
  Segmented = 'segmented',
}

/**
 * 表单字段条件显示配置
 */
export interface FormFieldShowWhen {
  field: string
  value: string | string[]
}

/**
 * 表单字段配置
 */
export interface FormFieldConfig {
  label: string
  name: string
  type: FormFieldType
  required?: boolean
  hidden?: boolean
  disabled?: boolean
  placeholder?: string
  tooltip?: string
  defaultValue?: any
  options?: Array<{ label: string; value: string }>
  showWhen?: FormFieldShowWhen
  render?: (fieldProps: any) => ReactNode
}

/**
 * 分类后的数据源列表项
 */
export interface ICategorizedDataSource extends IDataSourceInfo {
  list: IDataSourceBase[]
}
