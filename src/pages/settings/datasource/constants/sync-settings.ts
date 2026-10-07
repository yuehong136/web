import {
  DataSourceKey,
  FormFieldType,
  type FormFieldConfig,
} from '@/pages/settings/datasource/types'

/** Sources with an explicit deletion inventory contract (RSS mirrors its current feed). */
export const deletionSyncSources = new Set<DataSourceKey>([
  DataSourceKey.AIRTABLE,
  DataSourceKey.DINGTALK_AI_TABLE,
  DataSourceKey.GOOGLE_DRIVE,
  DataSourceKey.GMAIL,
  DataSourceKey.BITBUCKET,
  DataSourceKey.GITHUB,
  DataSourceKey.GITLAB,
  DataSourceKey.CONFLUENCE,
  DataSourceKey.BOX,
  DataSourceKey.DROPBOX,
  DataSourceKey.SEAFILE,
  DataSourceKey.WEBDAV,
  DataSourceKey.RSS,
  DataSourceKey.ASANA,
  DataSourceKey.ZENDESK,
  DataSourceKey.S3,
  DataSourceKey.R2,
  DataSourceKey.GOOGLE_CLOUD_STORAGE,
  DataSourceKey.OCI_STORAGE,
  DataSourceKey.NOTION,
  DataSourceKey.JIRA,
])

export function getDeletionSyncFields(
  source: DataSourceKey,
  t: (key: string) => string,
): FormFieldConfig[] {
  return deletionSyncSources.has(source)
    ? [
        {
          label: t('datasource.syncDeletedFiles'),
          name: 'config.sync_deleted_files',
          type: FormFieldType.Checkbox,
          defaultValue: false,
          ...(source === DataSourceKey.ZENDESK
            ? {
                showWhen: {
                  field: 'config.zendesk_content_type',
                  value: 'articles',
                },
              }
            : {}),
          tooltip: t(
            source === DataSourceKey.NOTION
              ? 'datasource.notionSyncDeletedFilesTip'
              : source === DataSourceKey.RSS
                ? 'datasource.rssSyncDeletedFilesTip'
                : 'datasource.syncDeletedFilesTip',
          ),
        },
      ]
    : []
}
