'use client'

import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Pause, Play } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { datasourceAPI, type DataSourceSetRequest } from '@/api/datasource'
import { DynamicForm } from '@/components/dynamic-form'
import {
  PageEmptyState,
  PageHeader,
  PageLoadingState,
  SectionCard,
} from '@/components/patterns'
import { Button } from '@/components/ui/button'
import {
  datasourceKeys,
  useDataSourceLogs,
  useDataSourceResume,
  useFetchDataSourceDetail,
} from '@/hooks/use-datasource-request'
import {
  DataSourceFormDefaultValues,
  useDataSourceFormFields,
  useDataSourceInfo,
} from '../constants'
import { DataSourceKey, type FormFieldConfig } from '../types'
import { DataSourceLogsTable } from './logs-table'
import { DataSourceStatusBadge, isDataSourceActive } from './status-display'
import { SyncOverview } from './sync-overview'

/** Data source configuration and sync operations console. */
export default function DataSourceDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const id = searchParams.get('id') || ''
  const queryClient = useQueryClient()

  const { data: detail, isFetching } = useFetchDataSourceDetail(id)
  const { handleResume, isLoading: resumeLoading } = useDataSourceResume(id)
  const { dataSourceInfo } = useDataSourceInfo()
  const { formFields, baseFields } = useDataSourceFormFields()
  const [saveLoading, setSaveLoading] = useState(false)

  const isActive = isDataSourceActive(detail?.status)
  const logsState = useDataSourceLogs(id, isActive)

  const fields = useMemo<FormFieldConfig[]>(() => {
    if (!detail?.source) return []
    const sourceFields = formFields[detail.source as DataSourceKey] || []
    const readOnlyBaseFields = baseFields.map((field) =>
      field.name === 'name' ? { ...field, disabled: true } : field,
    )
    return [...readOnlyBaseFields, ...sourceFields]
  }, [baseFields, detail?.source, formFields])

  const handleSave = async (values: Record<string, unknown>) => {
    if (!detail) return

    try {
      setSaveLoading(true)
      const data: DataSourceSetRequest = {
        ...values,
        id: detail.id,
        name: detail.name,
        source: detail.source,
        config: (values.config as Record<string, unknown>) || detail.config,
      }
      await datasourceAPI.connector.set(data)
      await queryClient.invalidateQueries({
        queryKey: datasourceKeys.detail(id),
      })
      toast.success(t('common.saved'))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('common.saveFailed'),
      )
    } finally {
      setSaveLoading(false)
    }
  }

  if (isFetching && !detail) {
    return (
      <PageLoadingState
        title={t('datasource.loadingDetail')}
        description={t('datasource.loadingDetailDescription')}
      />
    )
  }

  if (!detail) {
    return (
      <PageEmptyState
        title={t('datasource.notFound')}
        description={t('datasource.notFoundDescription')}
        action={
          <Button
            variant="outline"
            onClick={() => navigate('/settings/datasource')}
          >
            {t('datasource.backToList')}
          </Button>
        }
      />
    )
  }

  const sourceInfo = dataSourceInfo[detail.source]

  return (
    <div className="h-full overflow-y-auto bg-components-settings-content-bg">
      <PageHeader
        compact
        titleSize="md"
        title={detail.name}
        description={sourceInfo?.name}
        leading={
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-space-xs"
              onClick={() => navigate('/settings/datasource')}
            >
              <ArrowLeft className="size-icon-sm" aria-hidden="true" />
              {t('common.back')}
            </Button>
            <div className="h-8 w-8" aria-hidden="true">
              {sourceInfo?.icon}
            </div>
          </>
        }
        actions={
          <>
            <DataSourceStatusBadge status={detail.status} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleResume(!isActive)}
              disabled={resumeLoading}
              className="gap-space-xs"
            >
              {isActive ? (
                <Pause className="size-icon-sm" aria-hidden="true" />
              ) : (
                <Play className="size-icon-sm" aria-hidden="true" />
              )}
              {isActive ? t('datasource.pause') : t('datasource.resume')}
            </Button>
          </>
        }
      />

      <main className="p-space-lg">
        <div className="gap-space-lg mx-auto grid w-full max-w-7xl grid-cols-1 xl:grid-cols-3">
          <SectionCard
            title={t('datasource.configuration')}
            className="xl:col-span-2"
          >
            <DynamicForm.Root
              fields={fields}
              onSubmit={handleSave}
              defaultValues={{
                ...DataSourceFormDefaultValues[detail.source as DataSourceKey],
                ...detail,
                ...detail.config,
              }}
              labelClassName="font-normal"
            >
              <div className="mt-space-lg pt-space-base flex justify-end border-t border-border-subtle">
                <DynamicForm.SavingButton
                  submitLoading={saveLoading}
                  buttonText={t('common.save')}
                  submitFunc={handleSave}
                />
              </div>
            </DynamicForm.Root>
          </SectionCard>

          <SyncOverview
            status={detail.status}
            logs={logsState.logs}
            refreshFreq={detail.refresh_freq}
          />

          <SectionCard
            title={t('datasource.syncHistory')}
            padding="none"
            className="xl:col-span-3"
          >
            <div className="p-space-lg">
              <DataSourceLogsTable state={logsState} />
            </div>
          </SectionCard>
        </div>
      </main>
    </div>
  )
}
