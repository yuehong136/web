import React from 'react'
import { useTranslation } from 'react-i18next'
import { Settings2 } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { MetadataManageType, MetadataTableData } from '@/types/api'
import { FieldEditorFormBody } from './components/field-editor-form-body'
import { MetadataModalHeader } from './components/metadata-modal-header'
import { useFieldEditorForm } from './hooks/use-field-editor-form'
import { getEditorCopy, isSettingMode as checkSettingMode } from './utils'

interface MetadataFieldEditorModalProps {
  open: boolean
  onClose: () => void
  initialData?: {
    field: string
    description?: string
    restrictDefinedValues?: boolean
    values: string[]
  }
  existingKeys?: string[]
  mode: MetadataManageType
  onSave: (data: MetadataTableData) => void
  loading?: boolean
}

export const MetadataFieldEditorModal: React.FC<
  MetadataFieldEditorModalProps
> = ({
  open,
  onClose,
  initialData,
  existingKeys = [],
  mode,
  onSave,
  loading = false,
}) => {
  const { t } = useTranslation()
  const isSettingMode = checkSettingMode(mode)
  const isNew = !initialData?.field

  const form = useFieldEditorForm({
    open,
    initialData,
    existingKeys,
    onSave,
    onClose,
  })

  const { title, description } = getEditorCopy({ isNew, isSettingMode, t })

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => !isOpen && form.handlers.close()}
    >
      <DialogContent size="sm">
        <MetadataModalHeader
          icon={<Settings2 className="text-status-info h-5 w-5" />}
          iconClassName="bg-status-info/10"
          title={title}
          subtitle={description}
        />

        <FieldEditorFormBody
          form={form}
          isNew={isNew}
          isSettingMode={isSettingMode}
          loading={loading}
        />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={form.handlers.close}
            disabled={loading}
          >
            {t('knowledge.common.cancel')}
          </Button>
          <Button
            onClick={form.handlers.save}
            disabled={loading || form.hasErrors}
          >
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                {t('knowledge.metadata.editor.saving')}
              </>
            ) : (
              t('knowledge.metadata.editor.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
