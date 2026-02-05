import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AddVariableModal } from './add-variable-modal'

interface GlobalVariable {
  name: string
  type: string
  value: any
}

interface GlobalVariableSheetProps {
  hideModal?: (open: boolean) => void
}

export function GlobalVariableSheet({ hideModal }: GlobalVariableSheetProps) {
  const { t } = useTranslation()
  const [variables, setVariables] = useState<Record<string, GlobalVariable>>({})
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVariable, setEditingVariable] = useState<GlobalVariable | null>(null)

  const handleDeleteVariable = (key: string) => {
    const newVariables = { ...variables }
    delete newVariables[key]
    setVariables(newVariables)
  }

  const handleAddVariable = (variable: GlobalVariable) => {
    setVariables((prev) => ({
      ...prev,
      [variable.name]: variable,
    }))
    setShowAddModal(false)
    setEditingVariable(null)
  }

  const handleEditVariable = (key: string) => {
    const variable = variables[key]
    if (variable) {
      setEditingVariable(variable)
      setShowAddModal(true)
    }
  }

  return (
    <>
      <Sheet open onOpenChange={hideModal} modal={false}>
        <SheetContent
          className={cn('top-20 h-auto flex flex-col p-0 gap-0')}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader className="p-space-lg">
            <SheetTitle className="flex items-center gap-space-sm">
              {t('flow.conversationVariable', '会话变量')}
            </SheetTitle>
          </SheetHeader>

          <div className="px-space-lg pb-space-lg">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setEditingVariable(null)
                setShowAddModal(true)
              }}
            >
              <Plus className="size-4 mr-space-xs" />
              {t('flow.add', '添加')}
            </Button>
          </div>

          <div className="flex flex-col gap-space-sm px-space-lg pb-space-lg">
            {Object.entries(variables).length === 0 ? (
              <div className="text-center text-text-secondary py-space-xl">
                {t('flow.noVariables', '暂无变量')}
              </div>
            ) : (
              Object.entries(variables).map(([key, item]) => (
                <div
                  key={key}
                  className="flex items-center gap-space-sm min-h-14 justify-between px-space-lg py-space-sm border border-border-default rounded-radius-lg hover:bg-surface-secondary group cursor-pointer"
                  onClick={() => handleEditVariable(key)}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-space-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm font-medium text-text-secondary">
                        {item.type}
                      </span>
                    </div>
                    {typeof item.value !== 'object' && (
                      <span className="text-text-primary text-sm">
                        {String(item.value)}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden group-hover:flex"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteVariable(key)
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

      {showAddModal && (
        <AddVariableModal
          visible={showAddModal}
          hideModal={() => {
            setShowAddModal(false)
            setEditingVariable(null)
          }}
          onSubmit={handleAddVariable}
          defaultValues={editingVariable}
        />
      )}
    </>
  )
}
