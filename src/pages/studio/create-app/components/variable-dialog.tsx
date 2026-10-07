import { useId, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_VARIABLE_FORM } from '../constants'
import type { CreateAppPageController } from '../hooks/use-create-app-page'

type VariableBindings = Pick<
  CreateAppPageController,
  | 'showVariableModal'
  | 'setShowVariableModal'
  | 'variableForm'
  | 'setVariableForm'
  | 'handleAddVariable'
>
export function VariableDialog({
  controller,
  returnFocusRef,
}: {
  controller: VariableBindings
  returnFocusRef: RefObject<HTMLElement | null>
}) {
  const {
    showVariableModal,
    setShowVariableModal,
    variableForm,
    setVariableForm,
    handleAddVariable,
  } = controller
  const { t } = useTranslation()
  const id = useId()
  const close = () => {
    setShowVariableModal(false)
    setVariableForm(DEFAULT_VARIABLE_FORM)
  }
  return (
    <Dialog
      open={showVariableModal}
      onOpenChange={(open) => {
        if (!open) close()
      }}
    >
      <DialogContent size="sm" modal returnFocusRef={returnFocusRef}>
        <DialogHeader>
          <DialogTitle>{t('studio.editor.addVariable')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-space-lg p-space-lg">
          <div className="space-y-space-sm">
            <Label htmlFor={`${id}-key`}>
              {t('studio.editor.variableName')}
            </Label>
            <Input
              id={`${id}-key`}
              value={variableForm.key}
              onChange={(event) =>
                setVariableForm((previous) => ({
                  ...previous,
                  key: event.target.value,
                }))
              }
              placeholder={t('studio.editor.variableNamePlaceholder')}
            />
          </div>
          <div className="flex items-center justify-between gap-space-base">
            <Label htmlFor={`${id}-optional`}>
              {t('studio.editor.optional')}
            </Label>
            <Switch
              id={`${id}-optional`}
              checked={variableForm.optional}
              onCheckedChange={(optional) =>
                setVariableForm((previous) => ({ ...previous, optional }))
              }
            />
          </div>
          <p className="text-xs leading-relaxed text-text-secondary">
            {t('studio.editor.variableLimit')}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t('studio.editor.cancel')}
          </Button>
          <Button onClick={handleAddVariable}>{t('studio.editor.add')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
