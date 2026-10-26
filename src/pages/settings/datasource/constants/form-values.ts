import {
  DataSourceKey,
  type IDataSource,
} from '@/pages/settings/datasource/types'
import { DataSourceFormDefaultValues } from '@/pages/settings/datasource/constants/default-values'
import { deletionSyncSources } from '@/pages/settings/datasource/constants/sync-settings'
import { getRestApiFormConfig, prepareRestApiConfig } from './rest-api-values'

type FormValues = Record<string, unknown> & {
  config?: Record<string, unknown>
  jiraAuthMode?: string
}

function getCredentials(config: Record<string, unknown>) {
  return (config.credentials ?? {}) as Record<string, unknown>
}

/** Preserve unknown config and credential keys when editing existing sources. */
export function getDataSourceDefaultValues(
  source: DataSourceKey,
  detail: Partial<IDataSource> | FormValues = {},
): FormValues {
  const defaults = DataSourceFormDefaultValues[source]
  const config = {
    ...defaults.config,
    ...(deletionSyncSources.has(source) ? { sync_deleted_files: false } : {}),
    ...detail.config,
    credentials: {
      ...defaults.config.credentials,
      ...getCredentials(detail.config ?? {}),
    },
  }
  const values: FormValues = { ...defaults, ...detail, config }
  if (source === DataSourceKey.SLACK) {
    const channels = config.channels
    values.slackChannelScope =
      channels == null
        ? 'all'
        : Array.isArray(channels) && channels.length === 0
          ? 'none'
          : 'selected'
    config.channels =
      typeof channels === 'string'
        ? channels
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
        : (channels ?? [])
  }
  if (source === DataSourceKey.REST_API) {
    values.config = getRestApiFormConfig({
      ...config,
      auth_config: { ...defaults.config.auth_config, ...config.auth_config },
      pagination_config: {
        ...defaults.config.pagination_config,
        ...config.pagination_config,
      },
    })
  }
  if (source === DataSourceKey.JIRA) {
    const credentials = config.credentials
    const hasToken =
      credentials.jira_api_token || credentials.token || credentials.api_token
    values.jiraAuthMode =
      !hasToken && (credentials.jira_password || credentials.password)
        ? 'server'
        : 'cloud'
    credentials.jira_username =
      credentials.jira_user_email ||
      credentials.jira_username ||
      credentials.username ||
      ''
    credentials.jira_user_email =
      credentials.jira_user_email ||
      credentials.jira_username ||
      credentials.username ||
      ''
    credentials.jira_api_token =
      credentials.jira_api_token ||
      credentials.token ||
      credentials.api_token ||
      ''
    credentials.jira_password =
      credentials.jira_password || credentials.password || ''
  }
  return values
}

/** Jira mode is a form choice; the backend selects its API from credentials. */
export function prepareDataSourceValues(
  source: DataSourceKey,
  values: FormValues,
  previousConfig?: Record<string, unknown>,
): FormValues {
  const {
    jiraAuthMode,
    restApiSettings: _restApiSettings,
    slackChannelScope,
    ...prepared
  } = values
  if (source === DataSourceKey.TEAMS || source === DataSourceKey.ONEDRIVE) {
    return {
      ...prepared,
      config: { ...values.config, sync_deleted_files: false },
    }
  }
  if (source === DataSourceKey.SLACK) {
    return {
      ...prepared,
      config: {
        ...values.config,
        channels:
          slackChannelScope === 'all'
            ? null
            : slackChannelScope === 'none'
              ? []
              : (values.config?.channels ?? []),
      },
    }
  }
  if (source === DataSourceKey.REST_API) {
    return {
      ...prepared,
      config: prepareRestApiConfig(values.config ?? {}, previousConfig),
    }
  }
  if (
    source === DataSourceKey.ZENDESK &&
    values.config?.zendesk_content_type === 'tickets'
  ) {
    return {
      ...prepared,
      config: { ...values.config, sync_deleted_files: false },
    }
  }
  if (source !== DataSourceKey.JIRA) return prepared
  const config = { ...values.config }
  const credentials = { ...getCredentials(config) }
  const previousMode = previousConfig
    ? getDataSourceDefaultValues(source, { config: previousConfig })
        .jiraAuthMode
    : undefined
  if (previousMode && previousMode !== jiraAuthMode) {
    delete credentials.rest_api_version
  }
  delete config.is_cloud
  if (jiraAuthMode === 'server') {
    delete credentials.jira_user_email
    delete credentials.jira_api_token
    delete credentials.token
    delete credentials.api_token
    config.scoped_token = false
  } else {
    delete credentials.jira_username
    delete credentials.username
    delete credentials.jira_password
    delete credentials.password
  }
  config.credentials = credentials
  return { ...prepared, config }
}

export function validateJiraCredentials(
  source: DataSourceKey,
  values: FormValues,
): string | undefined {
  if (source !== DataSourceKey.JIRA) return undefined
  const credentials = getCredentials(values.config ?? {})
  if (values.jiraAuthMode === 'server') {
    return credentials.jira_username && credentials.jira_password
      ? undefined
      : 'datasource.jiraServerCredentialsRequired'
  }
  return credentials.jira_api_token
    ? undefined
    : 'datasource.jiraCloudCredentialsRequired'
}
