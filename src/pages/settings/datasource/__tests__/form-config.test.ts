import { describe, expect, it } from 'vitest'
import { DataSourceKey } from '@/pages/settings/datasource/types'
import { getDataSourceFormFields } from '@/pages/settings/datasource/constants/form-fields'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
  validateJiraCredentials,
} from '@/pages/settings/datasource/constants/form-values'
import { deletionSyncSources } from '@/pages/settings/datasource/constants/sync-settings'

const t = (key: string) => key

describe('connector configuration contracts', () => {
  it('round-trips Gmail deletion sync while preserving unknown configuration and credentials', () => {
    const config = {
      sync_deleted_files: true,
      custom_option: 'keep',
      credentials: {
        google_primary_admin: 'user@example.test',
        google_tokens: 'synthetic',
        custom_credential: 'keep',
      },
    }
    const values = getDataSourceDefaultValues(DataSourceKey.GMAIL, { config })
    expect(
      prepareDataSourceValues(DataSourceKey.GMAIL, values).config,
    ).toMatchObject(config)
    values.config!.sync_deleted_files = false
    expect(
      prepareDataSourceValues(DataSourceKey.GMAIL, values).config,
    ).toMatchObject({ ...config, sync_deleted_files: false })
    expect(config.sync_deleted_files).toBe(true)
  })

  it('keeps Drive default personal scope usable without forcing explicit email or folder scopes', () => {
    const fields = getDataSourceFormFields(t)[DataSourceKey.GOOGLE_DRIVE]
    for (const name of [
      'config.my_drive_emails',
      'config.shared_folder_urls',
    ]) {
      expect(fields.find((field) => field.name === name)?.required).toBe(false)
    }
    expect(
      getDataSourceDefaultValues(DataSourceKey.GOOGLE_DRIVE).config,
    ).toMatchObject({
      include_my_drives: true,
      my_drive_emails: '',
      shared_folder_urls: '',
      sync_deleted_files: false,
    })
  })

  it('exposes deletion sync only for approved complete snapshot sources', () => {
    const fields = getDataSourceFormFields(t)
    expect([...deletionSyncSources].sort()).toEqual([
      'airtable',
      'asana',
      'bitbucket',
      'box',
      'confluence',
      'dropbox',
      'github',
      'gitlab',
      'gmail',
      'google_cloud_storage',
      'google_drive',
      'jira',
      'notion',
      'oci_storage',
      'r2',
      's3',
      'seafile',
      'webdav',
      'zendesk',
    ])
    for (const source of Object.values(DataSourceKey)) {
      const deletionFields = fields[source].filter(
        (field) => field.name === 'config.sync_deleted_files',
      )
      expect(deletionFields).toHaveLength(
        deletionSyncSources.has(source) ? 1 : 0,
      )
      if (deletionSyncSources.has(source)) {
        expect(deletionFields[0]?.defaultValue).toBe(false)
        expect(
          getDataSourceDefaultValues(source).config?.sync_deleted_files,
        ).toBe(false)
      }
    }
  })

  it('disables Zendesk deletion when switching to tickets while preserving credentials', () => {
    const config = {
      zendesk_content_type: 'tickets',
      sync_deleted_files: true,
      custom: 'keep',
      credentials: { zendesk_token: 'synthetic' },
    }
    expect(
      prepareDataSourceValues(DataSourceKey.ZENDESK, { config }).config,
    ).toEqual({ ...config, sync_deleted_files: false })
    const field = getDataSourceFormFields(t)[DataSourceKey.ZENDESK].find(
      (field) => field.name === 'config.sync_deleted_files',
    )
    expect(field?.showWhen).toEqual({
      field: 'config.zendesk_content_type',
      value: 'articles',
    })
  })

  it('fills missing defaults while preserving stored config, credentials and enabled deletion sync', () => {
    const detail = {
      id: 'box-1',
      name: 'Box',
      config: {
        sync_deleted_files: true,
        custom: 1,
        credentials: { box_tokens: 'saved', tenant_scope: 'scope' },
      },
    }
    const merged = getDataSourceDefaultValues(DataSourceKey.BOX, detail)
    expect(merged.config).toMatchObject({
      folder_id: '0',
      sync_deleted_files: true,
      custom: 1,
      credentials: { box_tokens: 'saved', tenant_scope: 'scope' },
    })
    expect(detail.config).not.toHaveProperty('folder_id')
  })

  it('recognizes existing Server aliases and produces compatible credentials without a UI mode', () => {
    const stored = {
      config: {
        is_cloud: false,
        credentials: {
          username: 'server-user',
          password: 'saved-password',
          rest_api_version: '2',
        },
      },
    }
    const merged = getDataSourceDefaultValues(DataSourceKey.JIRA, stored)
    expect(merged.jiraAuthMode).toBe('server')
    expect(merged.config?.credentials).toMatchObject({
      jira_username: 'server-user',
      jira_password: 'saved-password',
    })
    expect(validateJiraCredentials(DataSourceKey.JIRA, merged)).toBeUndefined()
    const submitted = prepareDataSourceValues(DataSourceKey.JIRA, merged)
    expect(submitted).not.toHaveProperty('jiraAuthMode')
    expect(submitted.config).not.toHaveProperty('is_cloud')
    expect(submitted.config?.credentials).toMatchObject({
      jira_username: 'server-user',
      jira_password: 'saved-password',
      rest_api_version: '2',
    })
    expect(submitted.config?.credentials).not.toHaveProperty('jira_api_token')
  })

  it('removes stale Cloud token aliases on Server mode so password authentication wins', () => {
    const submitted = prepareDataSourceValues(DataSourceKey.JIRA, {
      jiraAuthMode: 'server',
      config: {
        scoped_token: true,
        sync_deleted_files: true,
        credentials: {
          jira_user_email: 'cloud@example.com',
          jira_username: 'server',
          jira_password: 'password',
          jira_api_token: 'cloud',
          token: 'old',
          api_token: 'old',
        },
      },
    })
    expect(submitted.config).toMatchObject({
      scoped_token: false,
      sync_deleted_files: true,
    })
    expect(submitted.config?.credentials).toEqual({
      jira_username: 'server',
      jira_password: 'password',
    })
  })

  it('lets the backend select its API after changing Jira authentication modes', () => {
    const server = prepareDataSourceValues(
      DataSourceKey.JIRA,
      {
        jiraAuthMode: 'server',
        config: {
          credentials: {
            jira_username: 'user',
            jira_password: 'password',
            rest_api_version: '3',
          },
        },
      },
      {
        credentials: {
          jira_api_token: 'old-cloud-token',
          rest_api_version: '3',
        },
      },
    )
    const cloud = prepareDataSourceValues(
      DataSourceKey.JIRA,
      {
        jiraAuthMode: 'cloud',
        config: {
          credentials: { jira_api_token: 'token', rest_api_version: '2' },
        },
      },
      {
        credentials: {
          jira_username: 'old-server-user',
          jira_password: 'old-password',
          rest_api_version: '2',
        },
      },
    )
    expect(server.config?.credentials).not.toHaveProperty('rest_api_version')
    expect(cloud.config?.credentials).not.toHaveProperty('rest_api_version')
  })

  it('preserves explicit Jira API versions and active username aliases when editing without a mode change', () => {
    const config = {
      custom_option: 'keep',
      credentials: {
        jira_username: 'saved-user',
        token: 'saved-token',
        rest_api_version: '2',
        custom_credential: 'keep',
      },
    }
    const values = getDataSourceDefaultValues(DataSourceKey.JIRA, { config })
    const prepared = prepareDataSourceValues(DataSourceKey.JIRA, values, config)
    expect(prepared.config).toMatchObject({
      custom_option: 'keep',
      credentials: {
        jira_user_email: 'saved-user',
        jira_api_token: 'saved-token',
        rest_api_version: '2',
        custom_credential: 'keep',
      },
    })
  })

  it('does not add deletion sync for unsupported sources and preserves existing ignored fields', () => {
    expect(
      getDataSourceDefaultValues(DataSourceKey.DISCORD).config,
    ).not.toHaveProperty('sync_deleted_files')
    const stored = {
      config: {
        sync_deleted_files: true,
        custom: 'keep',
        credentials: {
          discord_bot_token: 'stored',
          custom_credential: 'keep',
        },
      },
    }
    const values = getDataSourceDefaultValues(DataSourceKey.DISCORD, stored)
    expect(
      prepareDataSourceValues(DataSourceKey.DISCORD, values).config,
    ).toMatchObject(stored.config)
  })

  it('preserves token-only Cloud authentication and rejects missing credentials for the chosen mode', () => {
    const cloud = getDataSourceDefaultValues(DataSourceKey.JIRA, {
      config: { credentials: { token: 'token' } },
    })
    expect(cloud.jiraAuthMode).toBe('cloud')
    expect(validateJiraCredentials(DataSourceKey.JIRA, cloud)).toBeUndefined()
    expect(
      prepareDataSourceValues(DataSourceKey.JIRA, cloud).config?.credentials,
    ).not.toHaveProperty('jira_password')
    expect(
      validateJiraCredentials(DataSourceKey.JIRA, {
        jiraAuthMode: 'server',
        config: { credentials: { jira_username: 'user' } },
      }),
    ).toBe('datasource.jiraServerCredentialsRequired')
    expect(
      validateJiraCredentials(
        DataSourceKey.JIRA,
        getDataSourceDefaultValues(DataSourceKey.JIRA),
      ),
    ).toBe('datasource.jiraCloudCredentialsRequired')
  })
})
