import { useEffect } from 'react'
import { useFormState } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { Button } from '@/components/ui/button'
import { useFormInstance } from '@/components/dynamic-form'
import {
  DataSourceStatus,
  FormFieldType,
  type DataSourceKey,
  type FormFieldConfig,
} from '../types'
import { deletionSyncSources } from '../constants/sync-settings'
import { isDataSourceActive } from './status-display'

export function getScheduleFields(
  source: DataSourceKey,
  t: TFunction,
): FormFieldConfig[] {
  return [
    { name: 'refresh_freq', label: t('datasource.refreshMinutes'), minimum: 0 },
    ...(deletionSyncSources.has(source)
      ? [
          {
            name: 'prune_freq',
            label: t('datasource.pruneMinutes'),
            minimum: 0,
          },
        ]
      : []),
    { name: 'timeout_secs', label: t('datasource.timeoutSeconds'), minimum: 1 },
  ].map(({ name, label, minimum }) => ({
    name,
    label,
    required: true,
    type: FormFieldType.Number,
    step: 1,
    ...(name === 'prune_freq'
      ? { showWhen: { field: 'config.sync_deleted_files', value: true } }
      : {}),
    validate: (value: unknown) =>
      (typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= minimum) ||
      t('datasource.scheduleInteger', { minimum }),
  }))
}

export function DataSourceActions({
  status,
  savedValues,
  busy,
  onSave,
  onStatus,
}: {
  status: DataSourceStatus
  savedValues?: Record<string, unknown>
  busy: boolean
  onSave: (values: Record<string, unknown>) => Promise<boolean>
  onStatus: (status: '2' | '5') => void
}) {
  const { t } = useTranslation()
  const form = useFormInstance()
  useEffect(() => {
    if (savedValues) form.reset(savedValues)
  }, [form, savedValues])
  const { isDirty } = useFormState({ control: form.control })
  const save = isDirty || status === DataSourceStatus.PENDING
  const stop = isDataSourceActive(status)
  return (
    <Button
      type="button"
      disabled={busy}
      aria-busy={busy}
      onClick={
        save
          ? form.handleSubmit(async (values) => {
              await onSave(values)
            })
          : () => onStatus(stop ? '2' : '5')
      }
    >
      {t(save ? 'common.save' : stop ? 'datasource.stop' : 'datasource.resume')}
    </Button>
  )
}
