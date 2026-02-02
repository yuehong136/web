import { FormFieldType, type FormFieldConfig } from '../types'

/**
 * Confluence 数据源表单字段配置
 */
export const getConfluenceFormFields = (t: (key: string) => string): FormFieldConfig[] => [
  {
    label: 'Wiki Base URL',
    name: 'config.wiki_base',
    type: FormFieldType.Text,
    required: true,
    placeholder: 'https://your-domain.atlassian.net/wiki',
    tooltip: t('datasource.confluenceWikiBaseTip'),
  },
  {
    label: t('datasource.confluenceIsCloud'),
    name: 'config.is_cloud',
    type: FormFieldType.Checkbox,
    required: false,
    defaultValue: true,
  },
  {
    label: 'Space Key',
    name: 'config.space',
    type: FormFieldType.Text,
    required: false,
    placeholder: 'MYSPACE',
    tooltip: t('datasource.confluenceSpaceTip'),
  },
  {
    label: 'Page ID',
    name: 'config.page_id',
    type: FormFieldType.Text,
    required: false,
    tooltip: t('datasource.confluencePageIdTip'),
  },
  {
    label: t('datasource.indexMode'),
    name: 'config.index_mode',
    type: FormFieldType.Select,
    required: false,
    defaultValue: 'everything',
    options: [
      { label: t('datasource.indexEverything'), value: 'everything' },
      { label: t('datasource.indexSpaceOnly'), value: 'space' },
      { label: t('datasource.indexPageOnly'), value: 'page' },
    ],
  },
  {
    label: 'Confluence Username',
    name: 'config.credentials.confluence_username',
    type: FormFieldType.Text,
    required: true,
    placeholder: 'you@example.com',
  },
  {
    label: 'Confluence Access Token',
    name: 'config.credentials.confluence_access_token',
    type: FormFieldType.Password,
    required: true,
    tooltip: t('datasource.confluenceTokenTip'),
  },
]

/**
 * Confluence 数据源默认值
 */
export const confluenceDefaultValues = {
  name: '',
  source: 'confluence',
  config: {
    wiki_base: '',
    is_cloud: true,
    space: '',
    page_id: '',
    index_mode: 'everything',
    credentials: {
      confluence_username: '',
      confluence_access_token: '',
    },
  },
}
