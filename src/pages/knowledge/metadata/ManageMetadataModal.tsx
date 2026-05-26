import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Settings2, Database, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MetadataManageType, type MetadataFieldDefinition } from '@/types/api'
import { DeleteMetadataConfirm } from './components/delete-metadata-confirm'
import { MetadataFieldTable } from './components/metadata-field-table'
import { MetadataModalHeader } from './components/metadata-modal-header'
import { MetadataModalTip } from './components/metadata-modal-tip'
import { MetadataFieldEditorModal } from './MetadataFieldEditorModal'
import { useMetadataEditor } from './hooks/use-metadata-editor'
import { getModalConfig } from './utils'

interface ManageMetadataModalProps {
  open: boolean
  onClose: () => void
  kbId: string
  mode: MetadataManageType
  initialSettings?: MetadataFieldDefinition[]
  documentId?: string
  onSuccess?: (data?: MetadataFieldDefinition[]) => void
  onNavigateToSettings?: () => void
}

export const ManageMetadataModal: React.FC<ManageMetadataModalProps> = ({
  open,
  onClose,
  kbId,
  mode,
  initialSettings,
  documentId,
  onSuccess,
  onNavigateToSettings,
}) => {
  const { t } = useTranslation()
  const editor = useMetadataEditor({
    open,
    onClose,
    kbId,
    mode,
    initialSettings,
    documentId,
    onSuccess,
  })

  const { title, subtitle } = getModalConfig(mode, t)
  const headerIcon = editor.isSettingMode ? (
    <Sparkles className="h-5 w-5 text-status-info" />
  ) : (
    <Database className="h-5 w-5 text-text-secondary" />
  )
  const headerIconClass = editor.isSettingMode
    ? 'bg-status-info/10'
    : 'bg-surface-secondary'

  const allowRemoveValue =
    editor.isManageMode || mode === MetadataManageType.UPDATE_SINGLE
  const editingFieldName = editor.fieldEditor.editingData?.field
  const editorExistingKeys = editor.existingKeys.filter(
    (key) => key !== editingFieldName,
  )

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className="max-w-2xl">
          <MetadataModalHeader
            icon={headerIcon}
            iconClassName={headerIconClass}
            title={title}
            subtitle={subtitle}
          />

          <div className="flex-1 overflow-y-auto px-6 pb-4 scrollbar-thin">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-text-primary">
                  {t('knowledge.metadata.modal.fieldList')}
                </span>
                {editor.tableData.length > 0 && (
                  <span className="bg-surface-secondary inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-medium text-text-tertiary">
                    {editor.tableData.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {editor.isManageMode && onNavigateToSettings && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-text-secondary hover:text-text-accent"
                    onClick={() => {
                      onClose()
                      onNavigateToSettings()
                    }}
                  >
                    <Settings2 className="mr-1.5 h-4 w-4" />
                    {t('knowledge.metadata.modal.templateSettings')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={editor.handlers.addField}
                  disabled={editor.isSaving}
                  className="hover:border-surface-accent hover:text-surface-accent"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {t('knowledge.metadata.modal.addField')}
                </Button>
              </div>
            </div>

            <MetadataFieldTable
              data={editor.tableData}
              isLoading={editor.isLoading}
              isSettingMode={editor.isSettingMode}
              allowRemoveValue={allowRemoveValue}
              onEdit={editor.handlers.editField}
              onDelete={editor.handlers.deleteField}
              onRemoveValue={editor.handlers.removeValue}
              disabled={editor.isSaving}
            />

            {editor.isManageMode && editor.tableData.length > 0 && (
              <MetadataModalTip variant="manage" />
            )}
            {editor.isSettingMode && editor.tableData.length > 0 && (
              <MetadataModalTip variant="setting" />
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={editor.isSaving}
            >
              {t('knowledge.common.cancel')}
            </Button>
            <Button onClick={editor.handlers.save} loading={editor.isSaving}>
              {t('knowledge.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MetadataFieldEditorModal
        open={editor.fieldEditor.open}
        onClose={editor.fieldEditor.close}
        initialData={editor.fieldEditor.editingData || undefined}
        existingKeys={editorExistingKeys}
        mode={mode}
        onSave={editor.handlers.saveField}
      />

      <DeleteMetadataConfirm
        open={editor.deleteConfirm.state.open}
        title={editor.deleteConfirm.state.title}
        name={editor.deleteConfirm.state.name}
        warnText={editor.deleteConfirm.state.warnText}
        onCancel={editor.deleteConfirm.hide}
        onConfirm={editor.deleteConfirm.state.onConfirm}
      />
    </>
  )
}
