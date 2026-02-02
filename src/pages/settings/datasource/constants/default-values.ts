import { DataSourceKey } from '../types'
import { s3DefaultValues } from './s3'
import { confluenceDefaultValues } from './confluence'
import { bitbucketDefaultValues } from './bitbucket'

/**
 * 所有数据源的默认值配置
 */
export const DataSourceFormDefaultValues: Record<DataSourceKey, any> = {
  [DataSourceKey.S3]: s3DefaultValues,
  [DataSourceKey.R2]: {
    name: '',
    source: DataSourceKey.R2,
    config: {
      bucket_name: '',
      credentials: { account_id: '', r2_access_key_id: '', r2_secret_access_key: '' },
    },
  },
  [DataSourceKey.GOOGLE_CLOUD_STORAGE]: {
    name: '',
    source: DataSourceKey.GOOGLE_CLOUD_STORAGE,
    config: {
      bucket_name: '',
      credentials: { access_key_id: '', secret_access_key: '' },
    },
  },
  [DataSourceKey.OCI_STORAGE]: {
    name: '',
    source: DataSourceKey.OCI_STORAGE,
    config: {
      bucket_name: '',
      credentials: { namespace: '', region: '', access_key_id: '', secret_access_key: '' },
    },
  },
  [DataSourceKey.DROPBOX]: {
    name: '',
    source: DataSourceKey.DROPBOX,
    config: { batch_size: 2, credentials: { dropbox_access_token: '' } },
  },
  [DataSourceKey.BOX]: {
    name: '',
    source: DataSourceKey.BOX,
    config: { folder_id: '0', credentials: { box_tokens: '' } },
  },
  [DataSourceKey.WEBDAV]: {
    name: '',
    source: DataSourceKey.WEBDAV,
    config: { base_url: '', remote_path: '/', credentials: { username: '', password: '' } },
  },
  [DataSourceKey.NOTION]: {
    name: '',
    source: DataSourceKey.NOTION,
    config: { root_page_id: '', credentials: { notion_integration_token: '' } },
  },
  [DataSourceKey.CONFLUENCE]: confluenceDefaultValues,
  [DataSourceKey.JIRA]: {
    name: '',
    source: DataSourceKey.JIRA,
    config: {
      base_url: '',
      project_key: '',
      jql_query: '',
      batch_size: 2,
      include_comments: true,
      include_attachments: false,
      attachment_size_limit: 10 * 1024 * 1024,
      labels_to_skip: [],
      comment_email_blacklist: [],
      scoped_token: false,
      credentials: { jira_user_email: '', jira_api_token: '', jira_password: '' },
    },
  },
  [DataSourceKey.ASANA]: {
    name: '',
    source: DataSourceKey.ASANA,
    config: {
      asana_workspace_id: '',
      asana_project_ids: '',
      asana_team_id: '',
      credentials: { asana_api_token_secret: '' },
    },
  },
  [DataSourceKey.AIRTABLE]: {
    name: '',
    source: DataSourceKey.AIRTABLE,
    config: { base_id: '', table_name_or_id: '', credentials: { airtable_access_token: '' } },
  },
  [DataSourceKey.ZENDESK]: {
    name: '',
    source: DataSourceKey.ZENDESK,
    config: {
      zendesk_content_type: 'articles',
      credentials: { zendesk_subdomain: '', zendesk_email: '', zendesk_token: '' },
    },
  },
  [DataSourceKey.GITHUB]: {
    name: '',
    source: DataSourceKey.GITHUB,
    config: {
      repository_owner: '',
      repository_name: '',
      include_pull_requests: false,
      include_issues: false,
      credentials: { github_access_token: '' },
    },
  },
  [DataSourceKey.GITLAB]: {
    name: '',
    source: DataSourceKey.GITLAB,
    config: {
      project_owner: '',
      project_name: '',
      gitlab_url: 'https://gitlab.com',
      include_mrs: true,
      include_issues: true,
      include_code_files: true,
      credentials: { gitlab_access_token: '' },
    },
  },
  [DataSourceKey.BITBUCKET]: bitbucketDefaultValues,
  [DataSourceKey.GOOGLE_DRIVE]: {
    name: '',
    source: DataSourceKey.GOOGLE_DRIVE,
    config: {
      include_shared_drives: false,
      include_my_drives: true,
      include_files_shared_with_me: false,
      allow_images: false,
      shared_drive_urls: '',
      shared_folder_urls: '',
      my_drive_emails: '',
      specific_user_emails: '',
      credentials: { google_primary_admin: '', google_tokens: '', authentication_method: 'uploaded' },
    },
  },
  [DataSourceKey.GMAIL]: {
    name: '',
    source: DataSourceKey.GMAIL,
    config: {
      credentials: { google_primary_admin: '', google_tokens: '', authentication_method: 'uploaded' },
    },
  },
  [DataSourceKey.DISCORD]: {
    name: '',
    source: DataSourceKey.DISCORD,
    config: { server_ids: [], channels: [], credentials: { discord_bot_token: '' } },
  },
  [DataSourceKey.MOODLE]: {
    name: '',
    source: DataSourceKey.MOODLE,
    config: { moodle_url: '', credentials: { moodle_token: '' } },
  },
  [DataSourceKey.IMAP]: {
    name: '',
    source: DataSourceKey.IMAP,
    config: {
      imap_host: '',
      imap_port: 993,
      imap_mailbox: [],
      poll_range: 30,
      credentials: { imap_username: '', imap_password: '' },
    },
  },
}
