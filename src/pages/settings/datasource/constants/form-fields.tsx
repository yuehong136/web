import { FormFieldType, type FormFieldConfig, DataSourceKey } from '../types'
import { getS3FormFields } from './s3'
import { getConfluenceFormFields } from './confluence'
import { getBitbucketFormFields } from './bitbucket'
import {
  getGoogleCloudStorageFormFields,
  getOciStorageFormFields,
  getR2FormFields,
} from './cloud-storage'
import { getMySQLFormFields, getPostgreSQLFormFields } from './rdbms'

/**
 * 基础表单字段（所有数据源共用）
 */
export const getBaseFormFields = (): FormFieldConfig[] => [
  {
    label: 'Id',
    name: 'id',
    type: FormFieldType.Text,
    required: false,
    hidden: true,
  },
  {
    label: 'Name',
    name: 'name',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: 'Source',
    name: 'source',
    type: FormFieldType.Select,
    required: true,
    hidden: true,
    options: Object.values(DataSourceKey).map((key) => ({
      label: key,
      value: key,
    })),
  },
]

/**
 * 获取各数据源的表单字段配置
 */
export const getDataSourceFormFields = (
  t: (key: string) => string,
): Record<DataSourceKey, FormFieldConfig[]> => ({
  [DataSourceKey.S3]: getS3FormFields(t),
  [DataSourceKey.R2]: getR2FormFields(),
  [DataSourceKey.GOOGLE_CLOUD_STORAGE]: getGoogleCloudStorageFormFields(),
  [DataSourceKey.OCI_STORAGE]: getOciStorageFormFields(),
  [DataSourceKey.DROPBOX]: [
    {
      label: 'Access Token',
      name: 'config.credentials.dropbox_access_token',
      type: FormFieldType.Password,
      required: true,
      tooltip: t('datasource.dropboxAccessTokenTip'),
    },
    {
      label: 'Batch Size',
      name: 'config.batch_size',
      type: FormFieldType.Number,
      required: false,
      placeholder: '2',
    },
  ],
  [DataSourceKey.BOX]: [
    {
      label: 'Box OAuth JSON',
      name: 'config.credentials.box_tokens',
      type: FormFieldType.Textarea,
      required: true,
    },
    {
      label: 'Folder ID',
      name: 'config.folder_id',
      type: FormFieldType.Text,
      required: false,
      placeholder: '0',
    },
  ],
  [DataSourceKey.WEBDAV]: [
    {
      label: 'WebDAV Server URL',
      name: 'config.base_url',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'https://webdav.example.com',
    },
    {
      label: 'Username',
      name: 'config.credentials.username',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Password',
      name: 'config.credentials.password',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Remote Path',
      name: 'config.remote_path',
      type: FormFieldType.Text,
      required: false,
      placeholder: '/',
      tooltip: t('datasource.webdavRemotePathTip'),
    },
  ],
  [DataSourceKey.NOTION]: [
    {
      label: 'Notion Integration Token',
      name: 'config.credentials.notion_integration_token',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Root Page Id',
      name: 'config.root_page_id',
      type: FormFieldType.Text,
      required: false,
    },
  ],
  [DataSourceKey.CONFLUENCE]: getConfluenceFormFields(t),
  [DataSourceKey.JIRA]: [
    {
      label: 'Jira Base URL',
      name: 'config.base_url',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'https://your-domain.atlassian.net',
      tooltip: t('datasource.jiraBaseUrlTip'),
    },
    {
      label: 'Project Key',
      name: 'config.project_key',
      type: FormFieldType.Text,
      required: false,
      placeholder: 'RAGFlow',
      tooltip: t('datasource.jiraProjectKeyTip'),
    },
    {
      label: 'Custom JQL',
      name: 'config.jql_query',
      type: FormFieldType.Textarea,
      required: false,
      placeholder: 'project = RAG AND updated >= -7d',
      tooltip: t('datasource.jiraJqlTip'),
    },
    {
      label: 'Batch Size',
      name: 'config.batch_size',
      type: FormFieldType.Number,
      required: false,
      tooltip: t('datasource.jiraBatchSizeTip'),
    },
    {
      label: 'Include Comments',
      name: 'config.include_comments',
      type: FormFieldType.Checkbox,
      required: false,
      defaultValue: true,
      tooltip: t('datasource.jiraCommentsTip'),
    },
    {
      label: 'Include Attachments',
      name: 'config.include_attachments',
      type: FormFieldType.Checkbox,
      required: false,
      defaultValue: false,
      tooltip: t('datasource.jiraAttachmentsTip'),
    },
    {
      label: 'Jira User Email',
      name: 'config.credentials.jira_user_email',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'you@example.com',
      tooltip: t('datasource.jiraEmailTip'),
    },
    {
      label: 'Jira API Token',
      name: 'config.credentials.jira_api_token',
      type: FormFieldType.Password,
      required: false,
      tooltip: t('datasource.jiraTokenTip'),
    },
  ],
  [DataSourceKey.ASANA]: [
    {
      label: 'API Token',
      name: 'config.credentials.asana_api_token_secret',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Workspace ID',
      name: 'config.asana_workspace_id',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Project IDs',
      name: 'config.asana_project_ids',
      type: FormFieldType.Text,
      required: false,
    },
    {
      label: 'Team ID',
      name: 'config.asana_team_id',
      type: FormFieldType.Text,
      required: false,
    },
  ],
  [DataSourceKey.AIRTABLE]: [
    {
      label: 'Access Token',
      name: 'config.credentials.airtable_access_token',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Base ID',
      name: 'config.base_id',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Table Name OR ID',
      name: 'config.table_name_or_id',
      type: FormFieldType.Text,
      required: true,
    },
  ],
  [DataSourceKey.ZENDESK]: [
    {
      label: 'Zendesk Domain',
      name: 'config.credentials.zendesk_subdomain',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Zendesk Email',
      name: 'config.credentials.zendesk_email',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Zendesk Token',
      name: 'config.credentials.zendesk_token',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Content',
      name: 'config.zendesk_content_type',
      type: FormFieldType.Segmented,
      required: true,
      options: [
        { label: 'Articles', value: 'articles' },
        { label: 'Tickets', value: 'tickets' },
      ],
    },
  ],
  [DataSourceKey.GITHUB]: [
    {
      label: 'Repository Owner',
      name: 'config.repository_owner',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Repository Name',
      name: 'config.repository_name',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'GitHub Access Token',
      name: 'config.credentials.github_access_token',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Include Pull Requests',
      name: 'config.include_pull_requests',
      type: FormFieldType.Checkbox,
      required: false,
      defaultValue: false,
    },
    {
      label: 'Include Issues',
      name: 'config.include_issues',
      type: FormFieldType.Checkbox,
      required: false,
      defaultValue: false,
    },
  ],
  [DataSourceKey.GITLAB]: [
    {
      label: 'Project Owner',
      name: 'config.project_owner',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Project Name',
      name: 'config.project_name',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'GitLab Personal Access Token',
      name: 'config.credentials.gitlab_access_token',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'GitLab URL',
      name: 'config.gitlab_url',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'https://gitlab.com',
    },
    {
      label: 'Include Merge Requests',
      name: 'config.include_mrs',
      type: FormFieldType.Checkbox,
      required: false,
      defaultValue: true,
    },
    {
      label: 'Include Issues',
      name: 'config.include_issues',
      type: FormFieldType.Checkbox,
      required: false,
      defaultValue: true,
    },
    {
      label: 'Include Code Files',
      name: 'config.include_code_files',
      type: FormFieldType.Checkbox,
      required: false,
      defaultValue: true,
    },
  ],
  [DataSourceKey.BITBUCKET]: getBitbucketFormFields(t),
  [DataSourceKey.MYSQL]: getMySQLFormFields(t),
  [DataSourceKey.POSTGRESQL]: getPostgreSQLFormFields(t),
  [DataSourceKey.GOOGLE_DRIVE]: [
    {
      label: 'Primary Admin Email',
      name: 'config.credentials.google_primary_admin',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'admin@example.com',
      tooltip: t('datasource.google_drivePrimaryAdminTip'),
    },
    {
      label: 'OAuth Token JSON',
      name: 'config.credentials.google_tokens',
      type: FormFieldType.Textarea,
      required: true,
      tooltip: t('datasource.google_driveTokenTip'),
    },
    {
      label: 'My Drive Emails',
      name: 'config.my_drive_emails',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'user1@example.com,user2@example.com',
      tooltip: t('datasource.google_driveMyDriveEmailsTip'),
    },
    {
      label: 'Shared Folder URLs',
      name: 'config.shared_folder_urls',
      type: FormFieldType.Textarea,
      required: true,
      placeholder: 'https://drive.google.com/drive/folders/XXXXX',
      tooltip: t('datasource.google_driveSharedFoldersTip'),
    },
    {
      label: '',
      name: 'config.credentials.authentication_method',
      type: FormFieldType.Text,
      required: false,
      hidden: true,
      defaultValue: 'uploaded',
    },
  ],
  [DataSourceKey.GMAIL]: [
    {
      label: 'Primary Admin Email',
      name: 'config.credentials.google_primary_admin',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'admin@example.com',
      tooltip: t('datasource.gmailPrimaryAdminTip'),
    },
    {
      label: 'OAuth Token JSON',
      name: 'config.credentials.google_tokens',
      type: FormFieldType.Textarea,
      required: true,
      tooltip: t('datasource.gmailTokenTip'),
    },
    {
      label: '',
      name: 'config.credentials.authentication_method',
      type: FormFieldType.Text,
      required: false,
      hidden: true,
      defaultValue: 'uploaded',
    },
  ],
  [DataSourceKey.DISCORD]: [
    {
      label: 'Discord Bot Token',
      name: 'config.credentials.discord_bot_token',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Server IDs',
      name: 'config.server_ids',
      type: FormFieldType.Tag,
      required: false,
    },
    {
      label: 'Channels',
      name: 'config.channels',
      type: FormFieldType.Tag,
      required: false,
    },
  ],
  [DataSourceKey.MOODLE]: [
    {
      label: 'Moodle URL',
      name: 'config.moodle_url',
      type: FormFieldType.Text,
      required: true,
      placeholder: 'https://moodle.example.com',
    },
    {
      label: 'API Token',
      name: 'config.credentials.moodle_token',
      type: FormFieldType.Password,
      required: true,
    },
  ],
  [DataSourceKey.IMAP]: [
    {
      label: 'Username',
      name: 'config.credentials.imap_username',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Password',
      name: 'config.credentials.imap_password',
      type: FormFieldType.Password,
      required: true,
    },
    {
      label: 'Host',
      name: 'config.imap_host',
      type: FormFieldType.Text,
      required: true,
    },
    {
      label: 'Port',
      name: 'config.imap_port',
      type: FormFieldType.Number,
      required: true,
    },
    {
      label: 'Mailboxes',
      name: 'config.imap_mailbox',
      type: FormFieldType.Tag,
      required: false,
    },
    {
      label: 'Poll Range',
      name: 'config.poll_range',
      type: FormFieldType.Number,
      required: false,
    },
  ],
})
