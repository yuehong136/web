import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AddVariableModal } from './add-variable-modal'
import { useGlobalVariableSheet } from './hooks'

interface GlobalVariableSheetProps {
  hideModal?: (open: boolean) => void
}

function isPreviewableValue(value: unknown) {
  return (
    value !== undefined &&
    value !== null &&
    typeof value !== 'object' &&
    !Array.isArray(value)
  )
}

export function GlobalVariableSheet({ hideModal }: GlobalVariableSheetProps) {
  const { t } = useTranslation()
  const {
    variables,
    loading,
    addModalOpen,
    editingVariable,
    showAddModal,
    showEditModal,
    hideAddModal,
    handleSubmit,
    handleDelete,
  } = useGlobalVariableSheet()
  const entries = Object.entries(variables)

  return (
    <>
      <Sheet open onOpenChange={hideModal} modal={false}>
        <SheetContent
          className={cn('top-20 h-auto flex flex-col p-0 gap-0')}
          onInteractOutside={(event) => event.preventDefault()}
        >
          <SheetHeader className="p-space-lg">
            <SheetTitle className="flex items-center gap-space-sm">
              {t('flow.conversationVariable', '会话变量')}
            </SheetTitle>
            <SheetDescription>
              {t(
                'flow.conversationVariableDescription',
                'Manage variables saved to the Agent DSL and exposed as env.* prompt variables.',
              )}
            </SheetDescription>
          </SheetHeader>

          <div className="px-space-lg pb-space-lg">
            <Button
              variant="outline"
              className="w-full"
              onClick={showAddModal}
              disabled={loading}
            >
              <Plus className="size-4 mr-space-xs" />
              {t('flow.add', '添加')}
            </Button>
          </div>

          <div className="flex flex-col gap-space-sm px-space-lg pb-space-lg">
            {entries.length === 0 ? (
              <div className="text-center text-text-secondary py-space-xl">
                {t('flow.noVariables', '暂无变量')}
              </div>
            ) : (
              entries.map(([key, item]) => (
                <div
                  key={key}
                  className="flex min-h-14 cursor-pointer items-center justify-between gap-space-sm rounded-radius-lg border border-border-default px-space-lg py-space-sm hover:bg-surface-secondary group"
                  onClick={() => showEditModal(key)}
                >
                  <div className="min-w-0 flex flex-col">
                    <div className="flex min-w-0 items-center gap-space-sm">
                      <span className="truncate font-medium text-text-primary">
                        {item.name || key}
                      </span>
                      <span className="shrink-0 text-sm font-medium text-text-secondary">
                        {item.type}
                      </span>
                    </div>
                    {isPreviewableValue(item.value) ? (
                      <span className="truncate text-sm text-text-secondary">
                        {String(item.value)}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden group-hover:flex"
                    disabled={loading}
                    onClick={(event) => {
                      event.stopPropagation()
                      void handleDelete(key)
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {addModalOpen ? (
        <AddVariableModal
          visible={addModalOpen}
          hideModal={hideAddModal}
          onSubmit={handleSubmit}
          defaultValues={editingVariable}
          loading={loading}
        />
      ) : null}
    </>
  )
}
