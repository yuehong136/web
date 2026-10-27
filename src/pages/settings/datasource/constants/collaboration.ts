import { FormFieldType, type FormFieldConfig } from '../types'

export const getSharePointFormFields = (
  t: (key: string) => string,
): FormFieldConfig[] => [
  {
    label: t('datasource.sharepoint.siteUrl'),
    name: 'config.credentials.site_url',
    type: FormFieldType.Text,
    required: true,
    placeholder: 'https://contoso.sharepoint.com/sites/MySite',
    tooltip: t('datasource.sharepoint.siteUrlTip'),
  },
  {
    label: t('datasource.sharepoint.tenantId'),
    name: 'config.credentials.tenant_id',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: t('datasource.sharepoint.clientId'),
    name: 'config.credentials.client_id',
    type: FormFieldType.Text,
    required: true,
  },
  {
    label: t('datasource.sharepoint.clientSecret'),
    name: 'config.credentials.client_secret',
    type: FormFieldType.Password,
    required: true,
  },
]

export const getSlackFormFields = (
  t: (key: string) => string,
): FormFieldConfig[] => [
  {
    label: t('datasource.slack.botToken'),
    name: 'config.credentials.slack_bot_token',
    type: FormFieldType.Password,
    required: true,
    tooltip: t('datasource.slack.botTokenTip'),
  },
  {
    label: t('datasource.slack.channelScope'),
    name: 'slackChannelScope',
    type: FormFieldType.Select,
    options: [
      { label: t('datasource.slack.allChannels'), value: 'all' },
      { label: t('datasource.slack.selectedChannels'), value: 'selected' },
      { label: t('datasource.slack.noChannels'), value: 'none' },
    ],
  },
  {
    label: t('datasource.slack.channels'),
    name: 'config.channels',
    type: FormFieldType.Tag,
    placeholder: t('datasource.slack.channelsPlaceholder'),
    tooltip: t('datasource.slack.channelsTip'),
    showWhen: { field: 'slackChannelScope', value: 'selected' },
  },
  {
    label: t('datasource.slack.useRegex'),
    name: 'config.channel_regex_enabled',
    type: FormFieldType.Checkbox,
    showWhen: { field: 'slackChannelScope', value: 'selected' },
  },
]
