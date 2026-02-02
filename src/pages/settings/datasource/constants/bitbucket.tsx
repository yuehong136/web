import { FormFieldType, type FormFieldConfig } from '../types'

/**
 * Bitbucket 数据源表单字段配置
 */
export const getBitbucketFormFields = (t: (key: string) => string): FormFieldConfig[] => [
  {
    label: 'Workspace',
    name: 'config.workspace',
    type: FormFieldType.Text,
    required: true,
    placeholder: 'my-workspace',
    tooltip: t('datasource.bitbucketWorkspaceTip'),
  },
  {
    label: t('datasource.indexMode'),
    name: 'config.index_mode',
    type: FormFieldType.Select,
    required: true,
    defaultValue: 'workspace',
    options: [
      { label: t('datasource.indexWorkspace'), value: 'workspace' },
      { label: t('datasource.indexRepositories'), value: 'repositories' },
      { label: t('datasource.indexProjects'), value: 'projects' },
    ],
  },
  {
    label: 'Repository Slugs',
    name: 'config.repository_slugs',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'repo1,repo2',
    showWhen: { field: 'config.index_mode', value: 'repositories' },
    tooltip: t('datasource.bitbucketRepoSlugsTip'),
  },
  {
    label: 'Projects',
    name: 'config.projects',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'PROJECT1,PROJECT2',
    showWhen: { field: 'config.index_mode', value: 'projects' },
    tooltip: t('datasource.bitbucketProjectsTip'),
  },
  {
    label: 'Bitbucket API Token',
    name: 'config.credentials.bitbucket_api_token',
    type: FormFieldType.Password,
    required: true,
    tooltip: t('datasource.bitbucketTokenTip'),
  },
]

/**
 * Bitbucket 数据源默认值
 */
export const bitbucketDefaultValues = {
  name: '',
  source: 'bitbucket',
  config: {
    workspace: '',
    index_mode: 'workspace',
    repository_slugs: '',
    projects: '',
    credentials: {
      bitbucket_api_token: '',
    },
  },
}
