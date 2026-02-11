'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DynamicForm } from '@/components/dynamic-form'
import {
  useDataSourceFormFields,
  DataSourceFormDefaultValues,
} from '../constants'
import { type IDataSourceInfo, type FormFieldConfig, DataSourceKey } from '../types'
import type { DataSourceSetRequest } from '@/api/datasource'

interface AddDataSourceModalProps {
  visible: boolean
  loading: boolean
  hideModal: () => void
  onOk: (data: DataSourceSetRequest) => Promise<void>
  sourceData: IDataSourceInfo
}

/**
 * 添加数据源模态框 - 使用项目设计令牌
 */
export function AddDataSourceModal({
  visible,
  loading,
  hideModal,
  onOk,
  sourceData,
}: AddDataSourceModalProps) {
  const { t } = useTranslation()
  const { formFields, baseFields } = useDataSourceFormFields()
  const [fields, setFields] = useState<FormFieldConfig[]>([])

  useEffect(() => {
    if (sourceData) {
      const sourceFields = formFields[sourceData.id as DataSourceKey] || []
      setFields([...baseFields, ...sourceFields])
    }
  }, [sourceData, formFields, baseFields])

  const handleOk = async (values: any) => {
    const data: DataSourceSetRequest = {
      ...values,
      source: sourceData.id,
    }
    await onOk(data)
  }

  const defaultValues = DataSourceFormDefaultValues[sourceData?.id as DataSourceKey] || {}

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && hideModal()}>
      <DialogContent 
        size="md" 
        className="max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden"
      >
        {/* 头部 */}
        <DialogHeader className="px-6 py-5 border-b border-border-default bg-background-subtle">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-background-body 
                            flex items-center justify-center
                            shadow-sm border border-border-default">
              <div className="w-7 h-7 flex items-center justify-center">
                {sourceData?.icon}
              </div>
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-text-primary">
                {t('datasource.addModalTitle', { name: sourceData?.name })}
              </DialogTitle>
              <p className="mt-0.5 text-sm text-text-tertiary">
                {sourceData?.description}
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* 表单内容区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            <DynamicForm.Root
              fields={fields}
              onSubmit={handleOk}
              defaultValues={defaultValues}
              labelClassName="text-sm font-medium text-text-secondary"
            >
              {/* 底部操作按钮 */}
              <div className="sticky bottom-0 flex items-center justify-end gap-3 
                              pt-5 mt-6 border-t border-border-default 
                              bg-surface-primary">
                <DynamicForm.CancelButton 
                  handleCancel={hideModal}
                  className="px-5 h-10 text-sm font-medium"
                />
                <DynamicForm.SavingButton
                  submitLoading={loading}
                  buttonText={t('common.confirm')}
                  submitFunc={handleOk}
                  className="px-6 h-10 text-sm font-medium"
                />
              </div>
            </DynamicForm.Root>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
