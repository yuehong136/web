'use client'

import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { ConnectorLogo } from './connector-logo'

interface AddDataSourceModalProps {
  visible: boolean
  loading: boolean
  hideModal: () => void
  onOk: (data: DataSourceSetRequest) => Promise<void>
  sourceData: IDataSourceInfo
}

/** Adds a connection of one connector type: its logo, name and form. */
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
    let preparedValues: ReturnType<typeof prepareDataSourceValues>
    try {
      preparedValues = prepareDataSourceValues(sourceData.id, values)
    } catch {
      toast.error(
        t(
          sourceData.id === DataSourceKey.AZURE_BLOB
            ? 'datasource.azureBlob.invalidConfig'
            : 'datasource.restApi.invalidConfig',
        ),
      )
      return
    }
    const data: DataSourceSetRequest = {
      ...preparedValues,
      name: String(values.name ?? ''),
      config: preparedValues.config ?? {},
      source: sourceData.id,
    }
    try {
      await onOk(data)
    } catch {
      // The mutation owner displays the canonical error; keep the draft open.
    }
  }

  const defaultValues = getDataSourceDefaultValues(sourceData.id)

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && hideModal()}>
      <DialogContent
        size="md"
        className="flex max-h-[85vh] flex-col gap-0 overflow-clip p-0"
      >
        <DialogHeader className="border-b border-border-subtle px-space-lg py-space-base">
          <div className="flex items-center gap-space-base">
            <ConnectorLogo icon={sourceData?.icon} size="xl" />
            <div className="flex min-w-0 flex-col gap-space-2xs">
              <DialogTitle className="text-base font-semibold text-text-primary">
                {t('datasource.addModalTitle', { name: sourceData?.name })}
              </DialogTitle>
              {sourceData?.description ? (
                <DialogDescription className="text-sm text-text-secondary">
                  {sourceData.description}
                </DialogDescription>
              ) : null}
            </div>
          </div>
        </DialogHeader>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto">
          <div className="px-space-lg py-space-base">
            <DynamicForm.Root
              fields={fields}
              onSubmit={handleOk}
              defaultValues={defaultValues}
              labelClassName="text-sm font-medium text-text-secondary"
            >
              <div className="sticky bottom-0 mt-space-lg flex items-center justify-end gap-space-sm border-t border-border-subtle bg-background-surface py-space-base">
                <DynamicForm.CancelButton handleCancel={hideModal} />
                <DynamicForm.SavingButton
                  submitLoading={loading}
                  buttonText={t('common.confirm')}
                  submitFunc={handleOk}
                />
              </div>
            </DynamicForm.Root>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
