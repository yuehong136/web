import {
  DataSourceKey,
  FormFieldType,
  type FormFieldConfig,
} from '@/pages/settings/datasource/types'

/** Only sources with a complete snapshot contract expose deletion sync. */
export const deletionSyncSources = new Set<DataSourceKey>([
  DataSourceKey.GITHUB,
  DataSourceKey.CONFLUENCE,
  DataSourceKey.BOX,
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
          tooltip: t(
            source === DataSourceKey.NOTION
              ? 'datasource.notionSyncDeletedFilesTip'
              : 'datasource.syncDeletedFilesTip',
          ),
        },
      ]
    : []
}
