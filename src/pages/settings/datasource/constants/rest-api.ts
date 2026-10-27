import {
  DataSourceKey,
  FormFieldType,
  type FormFieldConfig,
  type FormFieldShowWhen,
} from '../types'
import { validateRestApiObject } from './rest-api-values'

export const restApiDefaultValues = {
  name: '',
  source: DataSourceKey.REST_API,
  restApiSettings: 'basic',
  config: {
    url: '',
    method: 'GET',
    headers: '',
    query_params: '',
    auth_type: 'none',
    auth_config: { header_name: 'X-API-Key' },
    credentials: { api_key: '', token: '', username: '', password: '' },
    items_path: '',
    id_field: '',
    content_fields: '',
    metadata_fields: '',
    pagination_type: 'none',
    pagination_config: {
      start_page: 1,
      page_param: 'page',
      start_offset: 0,
      offset_param: 'offset',
      cursor_param: 'cursor',
    },
    request_body: '',
    poll_timestamp_field: '',
    max_pages: 1000,
    request_delay: 0.5,
  },
}

export function getRestApiFormFields(
  t: (key: string) => string,
): FormFieldConfig[] {
  const label = (key: string) => t(`datasource.restApi.${key}`)
  const advanced: FormFieldShowWhen = {
    field: 'restApiSettings',
    value: 'advanced',
  }
  const when = (
    field: string,
    value: string | string[],
  ): FormFieldShowWhen => ({ field: `config.${field}`, value })
  const text = (
    key: string,
    name: string,
    extra: Partial<FormFieldConfig> = {},
  ): FormFieldConfig => ({
    label: label(key),
    name: `config.${name}`,
    type: FormFieldType.Text,
    ...extra,
  })
  const number = (
    key: string,
    name: string,
    minimum: number,
    showWhen: FormFieldConfig['showWhen'],
    integer = true,
    maximum = Number.MAX_SAFE_INTEGER,
  ): FormFieldConfig =>
    text(key, name, {
      type: FormFieldType.Number,
      showWhen,
      step: integer ? 1 : 0.1,
      validate: (value) =>
        value == null ||
        value === '' ||
        (typeof value === 'number' &&
          Number.isFinite(value) &&
          value >= minimum &&
          value <= maximum &&
          (!integer || Number.isInteger(value))) ||
        label(integer ? 'integerRequired' : 'delayRequired'),
    })
  const select = (
    key: string,
    name: string,
    options: string[],
    translate = true,
  ): FormFieldConfig =>
    text(key, name, {
      type: FormFieldType.Select,
      required: true,
      options: options.map((value) => ({
        value,
        label: translate ? label(value) : value,
      })),
    })
  const auth = (
    key: string,
    name: string,
    mode: string,
    password = false,
  ): FormFieldConfig =>
    text(key, name, {
      required: true,
      type: password ? FormFieldType.Password : FormFieldType.Text,
      showWhen: when('auth_type', mode),
    })
  const json = (
    key: string,
    name: string,
    extra: Partial<FormFieldConfig> = {},
    keyValueText = false,
  ): FormFieldConfig =>
    text(key, name, {
      type: FormFieldType.Textarea,
      validate: (value) =>
        validateRestApiObject(
          value,
          label(keyValueText ? 'keyValueRequired' : 'objectRequired'),
          keyValueText,
        ),
      ...extra,
    })
  return [
    text('url', 'url', {
      required: true,
      placeholder: 'https://api.example.com/v1/resources',
      validate: (value) => {
        try {
          return (
            ['http:', 'https:'].includes(new URL(String(value)).protocol) ||
            label('urlRequired')
          )
        } catch {
          return label('urlRequired')
        }
      },
    }),
    select('method', 'method', ['GET', 'POST'], false),
    json(
      'queryParams',
      'query_params',
      {
        placeholder: 'status=published\nlimit=100',
        tooltip: label('queryParamsTip'),
      },
      true,
    ),
    json('requestBody', 'request_body', {
      placeholder: '{"status":"published"}',
      showWhen: when('method', 'POST'),
      tooltip: label('requestBodyTip'),
    }),
    text('itemsPath', 'items_path', {
      placeholder: '$.items',
      tooltip: label('itemsPathTip'),
    }),
    text('idField', 'id_field', {
      placeholder: 'id',
      tooltip: label('idFieldTip'),
    }),
    select('authType', 'auth_type', [
      'none',
      'api_key_header',
      'bearer',
      'basic',
    ]),
    auth('headerName', 'auth_config.header_name', 'api_key_header'),
    auth('apiKey', 'credentials.api_key', 'api_key_header', true),
    auth('bearerToken', 'credentials.token', 'bearer', true),
    auth('username', 'credentials.username', 'basic'),
    auth('password', 'credentials.password', 'basic', true),
    text('contentFields', 'content_fields', {
      required: true,
      placeholder: 'title,body',
      tooltip: label('contentFieldsTip'),
      validate: (value) =>
        String(value ?? '')
          .split(',')
          .some((field) => field.trim()) || label('contentFieldsRequired'),
    }),
    text('metadataFields', 'metadata_fields', {
      placeholder: 'author,category',
      tooltip: label('metadataFieldsTip'),
    }),
    select('paginationType', 'pagination_type', [
      'none',
      'page',
      'offset',
      'cursor',
    ]),
    number(
      'startPage',
      'pagination_config.start_page',
      0,
      when('pagination_type', 'page'),
    ),
    text('offsetParam', 'pagination_config.offset_param', {
      placeholder: 'offset',
      showWhen: when('pagination_type', 'offset'),
    }),
    number(
      'startOffset',
      'pagination_config.start_offset',
      0,
      when('pagination_type', 'offset'),
    ),
    text('cursorParam', 'pagination_config.cursor_param', {
      placeholder: 'cursor',
      showWhen: when('pagination_type', 'cursor'),
    }),
    text('nextCursorPath', 'pagination_config.next_cursor_path', {
      placeholder: '$.next_cursor',
      showWhen: when('pagination_type', 'cursor'),
      tooltip: label('nextCursorPathTip'),
    }),
    {
      label: label('settings'),
      name: 'restApiSettings',
      type: FormFieldType.Segmented,
      options: ['basic', 'advanced'].map((value) => ({
        value,
        label: label(value === 'basic' ? 'standard' : value),
      })),
    },
    json(
      'headers',
      'headers',
      {
        placeholder: '{"X-Custom-Header":"value"}',
        showWhen: advanced,
        tooltip: label('headersTip'),
      },
      true,
    ),
    text('pageParam', 'pagination_config.page_param', {
      placeholder: 'page',
      showWhen: [advanced, when('pagination_type', 'page')],
    }),
    text('pageSizeParam', 'pagination_config.page_size_param', {
      showWhen: [advanced, when('pagination_type', 'page')],
    }),
    number('pageSize', 'pagination_config.page_size', 1, [
      advanced,
      when('pagination_type', ['page', 'offset']),
    ]),
    text('limitParam', 'pagination_config.limit_param', {
      showWhen: [advanced, when('pagination_type', 'offset')],
    }),
    number('limit', 'pagination_config.limit', 1, [
      advanced,
      when('pagination_type', 'offset'),
    ]),
    text('initialCursor', 'pagination_config.initial_cursor', {
      showWhen: [advanced, when('pagination_type', 'cursor')],
    }),
    text('nextCursorField', 'pagination_config.next_cursor_field', {
      showWhen: [advanced, when('pagination_type', 'cursor')],
      tooltip: label('nextCursorFieldTip'),
    }),
    text('hasNextPagePath', 'pagination_config.has_next_page_path', {
      showWhen: [
        advanced,
        when('pagination_type', ['page', 'offset', 'cursor']),
      ],
      tooltip: label('hasNextPagePathTip'),
    }),
    number('maxPages', 'max_pages', 1, advanced, true, 10000),
    number('batchSize', 'batch_size', 1, advanced, true, 10000),
    number('requestDelay', 'request_delay', 0, advanced, false, 60),
    text('pollTimestampField', 'poll_timestamp_field', {
      placeholder: 'updated_at',
      showWhen: advanced,
      tooltip: label('pollTimestampFieldTip'),
    }),
    json('fieldTypeHints', 'field_type_hints', {
      showWhen: advanced,
      placeholder: '{"amount":"number"}',
      tooltip: label('fieldTypeHintsTip'),
    }),
    json('fieldDefaults', 'field_default_values', {
      showWhen: advanced,
      placeholder: '{"category":"general"}',
    }),
    text('contentTemplate', 'content_template', {
      showWhen: advanced,
      tooltip: label('contentTemplateTip'),
    }),
  ]
}
