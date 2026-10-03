import {
  FormFieldType,
  type FormFieldConfig,
} from '@/pages/settings/datasource/types'

export function getJiraFormFields(
  t: (key: string) => string,
): FormFieldConfig[] {
  const cloud = { field: 'jiraAuthMode', value: 'cloud' }
  const server = { field: 'jiraAuthMode', value: 'server' }
  return [
    {
      label: t('datasource.jiraBaseUrl'),
      name: 'config.base_url',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'https://your-domain.atlassian.net',
      tooltip: t('datasource.jiraBaseUrlTip'),
    },
    {
      label: t('datasource.jiraProjectKey'),
      name: 'config.project_key',
      type: FormFieldType.Text,
      tooltip: t('datasource.jiraProjectKeyTip'),
    },
    {
      label: t('datasource.jiraJql'),
      name: 'config.jql_query',
      type: FormFieldType.Textarea,
      tooltip: t('datasource.jiraJqlTip'),
    },
    {
      label: t('datasource.jiraBatchSize'),
      name: 'config.batch_size',
      type: FormFieldType.Number,
      tooltip: t('datasource.jiraBatchSizeTip'),
    },
    {
      label: t('datasource.jiraAttachmentSize'),
      name: 'config.attachment_size_limit',
      type: FormFieldType.Number,
      tooltip: t('datasource.jiraAttachmentSizeTip'),
    },
    {
      label: t('datasource.jiraLabelsToSkip'),
      name: 'config.labels_to_skip',
      type: FormFieldType.Tag,
    },
    {
      label: t('datasource.jiraCommentBlacklist'),
      name: 'config.comment_email_blacklist',
      type: FormFieldType.Tag,
    },
    {
      label: t('datasource.jiraIncludeComments'),
      name: 'config.include_comments',
      type: FormFieldType.Checkbox,
      defaultValue: true,
      tooltip: t('datasource.jiraCommentsTip'),
    },
    {
      label: t('datasource.jiraIncludeAttachments'),
      name: 'config.include_attachments',
      type: FormFieldType.Checkbox,
      defaultValue: false,
      tooltip: t('datasource.jiraAttachmentsTip'),
    },
    {
      label: t('datasource.jiraMode'),
      name: 'jiraAuthMode',
      type: FormFieldType.Segmented,
      defaultValue: 'cloud',
      options: [
        { label: t('datasource.jiraTokenAuthentication'), value: 'cloud' },
        { label: t('datasource.jiraPasswordAuthentication'), value: 'server' },
      ],
    },
    {
      label: t('datasource.jiraEmail'),
      name: 'config.credentials.jira_user_email',
      type: FormFieldType.Text,
      showWhen: cloud,
      tooltip: t('datasource.jiraEmailTip'),
    },
    {
      label: t('datasource.jiraToken'),
      name: 'config.credentials.jira_api_token',
      type: FormFieldType.Password,
      required: true,
      showWhen: cloud,
      tooltip: t('datasource.jiraTokenTip'),
    },
    {
      label: t('datasource.jiraUsername'),
      name: 'config.credentials.jira_username',
      type: FormFieldType.Text,
      required: true,
      showWhen: server,
    },
    {
      label: t('datasource.jiraPassword'),
      name: 'config.credentials.jira_password',
      type: FormFieldType.Password,
      required: true,
      showWhen: server,
      tooltip: t('datasource.jiraPasswordTip'),
    },
    {
      label: t('datasource.jiraScopedToken'),
      name: 'config.scoped_token',
      type: FormFieldType.Checkbox,
      defaultValue: false,
      showWhen: cloud,
    },
  ]
}
