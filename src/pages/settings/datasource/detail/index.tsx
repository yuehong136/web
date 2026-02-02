'use client'

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Play, Pause, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DynamicForm } from '@/components/dynamic-form'
import {
  useFetchDataSourceDetail,
  useDataSourceResume,
} from '@/hooks/use-datasource-request'
import {
  useDataSourceInfo,
  useDataSourceFormFields,
  DataSourceFormDefaultValues,
} from '../constants'
import { type FormFieldConfig, DataSourceKey, DataSourceStatus } from '../types'
import { DataSourceLogsTable } from './logs-table'
import { datasourceAPI, type DataSourceSetRequest } from '@/api/datasource'
import { message } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { datasourceKeys } from '@/hooks/use-datasource-request'

/**
 * 数据源详情页面
 */
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

  const [fields, setFields] = useState<FormFieldConfig[]>([])
  const [saveLoading, setSaveLoading] = useState(false)

  // 构建表单字段（名称字段只读）
  useEffect(() => {
    if (detail?.source) {
      const sourceFields = formFields[detail.source as DataSourceKey] || []
      const modifiedBaseFields = baseFields.map((field) => {
        if (field.name === 'name') {
          return { ...field, disabled: true }
        }
        return field
      })
      setFields([...modifiedBaseFields, ...sourceFields])
    }
  }, [detail?.source, formFields, baseFields])

  // 保存配置
  const handleSave = async (values: any) => {
    try {
      setSaveLoading(true)
      const data: DataSourceSetRequest = {
        ...values,
        id: detail?.id,
        source: detail?.source,
      }
      await datasourceAPI.connector.set(data)
      queryClient.invalidateQueries({ queryKey: datasourceKeys.detail(id) })
      message.success(t('common.saved'))
    } catch (error: any) {
      message.error(error?.message || t('common.saveFailed'))
    } finally {
      setSaveLoading(false)
    }
  }

  // 获取状态徽章
  const getStatusBadge = (status?: DataSourceStatus) => {
    switch (status) {
      case DataSourceStatus.RUNNING:
        return <Badge variant="success">{t('datasource.statusRunning')}</Badge>
      case DataSourceStatus.PAUSED:
        return <Badge variant="warning">{t('datasource.statusPaused')}</Badge>
      case DataSourceStatus.COMPLETED:
        return <Badge variant="default">{t('datasource.statusCompleted')}</Badge>
      case DataSourceStatus.FAILED:
        return <Badge variant="destructive">{t('datasource.statusFailed')}</Badge>
      default:
        return <Badge variant="secondary">{t('datasource.statusPending')}</Badge>
    }
  }

  const sourceInfo = detail?.source ? dataSourceInfo[detail.source] : null

  if (isFetching && !detail) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-text-tertiary" />
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-text-secondary">{t('datasource.notFound')}</p>
        <Button variant="link" onClick={() => navigate('/settings/datasource')}>
          {t('datasource.backToList')}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 页面头部 */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => navigate('/settings/datasource')}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8">{sourceInfo?.icon}</div>
            <div>
              <h1 className="text-lg font-semibold text-text-primary">{detail.name}</h1>
              <p className="text-sm text-text-secondary">{sourceInfo?.name}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {getStatusBadge(detail.status)}
            {detail.status === DataSourceStatus.RUNNING ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResume(false)}
                disabled={resumeLoading}
                className="gap-1"
              >
                <Pause className="w-4 h-4" />
                {t('datasource.pause')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResume(true)}
                disabled={resumeLoading}
                className="gap-1"
              >
                <Play className="w-4 h-4" />
                {t('datasource.resume')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl space-y-6">
          {/* 配置表单 */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-4">
              {t('datasource.configuration')}
            </h2>
            <div className="p-4 border border-border rounded-radius-lg">
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
                <div className="flex justify-end pt-4 mt-4 border-t border-border">
                  <DynamicForm.SavingButton
                    submitLoading={saveLoading}
                    buttonText={t('common.save')}
                    submitFunc={handleSave}
                  />
                </div>
              </DynamicForm.Root>
            </div>
          </section>

          {/* 同步日志 */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-4">
              {t('datasource.syncLogs')}
            </h2>
            <DataSourceLogsTable
              dataSourceId={id}
              refreshFreq={detail.refresh_freq}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
