'use client'

import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DynamicForm } from '@/components/dynamic-form'
import { useDataSourceFormFields } from '../constants'
import { type IDataSourceInfo, DataSourceKey } from '../types'
import type { DataSourceSetRequest } from '@/api/datasource'
import { toast } from 'sonner'
import {
  getDataSourceDefaultValues,
  prepareDataSourceValues,
  validateJiraCredentials,
} from '@/pages/settings/datasource/constants/form-values'

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
  const fields = sourceData
    ? [...baseFields, ...(formFields[sourceData.id as DataSourceKey] || [])]
    : []

  const handleOk = async (values: Record<string, unknown>) => {
    if (loading) return
    const errorKey = validateJiraCredentials(sourceData.id, values)
    if (errorKey) {
      toast.error(t(errorKey))
      return
    }
    const preparedValues = prepareDataSourceValues(sourceData.id, values)
    const data: DataSourceSetRequest = {
      ...preparedValues,
      name: String(values.name ?? ''),
      config: preparedValues.config ?? {},
      source: sourceData.id,
    }
    await onOk(data)
  }

  const defaultValues = getDataSourceDefaultValues(sourceData.id)

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && hideModal()}>
      <DialogContent
        size="md"
        className="flex max-h-[85vh] flex-col gap-0 overflow-clip p-0"
      >
        {/* 头部 */}
        <DialogHeader className="border-b border-border-default bg-background-subtle px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border-default bg-background-body shadow-xs">
              <div className="flex h-7 w-7 items-center justify-center">
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="px-6 py-5">
            <DynamicForm.Root
              fields={fields}
              onSubmit={handleOk}
              defaultValues={defaultValues}
              labelClassName="text-sm font-medium text-text-secondary"
            >
              {/* 底部操作按钮 */}
              <div className="bg-surface-primary sticky bottom-0 mt-6 flex items-center justify-end gap-3 border-t border-border-default pt-5">
                <DynamicForm.CancelButton
                  handleCancel={hideModal}
                  className="h-10 px-5 text-sm font-medium"
                />
                <DynamicForm.SavingButton
                  submitLoading={loading}
                  buttonText={t('common.confirm')}
                  submitFunc={handleOk}
                  className="h-10 px-6 text-sm font-medium"
                />
              </div>
            </DynamicForm.Root>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
