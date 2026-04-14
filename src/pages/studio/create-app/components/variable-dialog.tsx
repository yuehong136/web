import React from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DEFAULT_VARIABLE_FORM } from '../constants'
import type { CreateAppPageController } from '../hooks/use-create-app-page'

interface VariableDialogProps {
  controller: CreateAppPageController
}

export const VariableDialog: React.FC<VariableDialogProps> = ({ controller }) => {
  const {
    showVariableModal,
    setShowVariableModal,
    variableForm,
    setVariableForm,
    handleAddVariable,
  } = controller

  const handleClose = () => {
    setShowVariableModal(false)
    setVariableForm(DEFAULT_VARIABLE_FORM)
  }

  return (
    <Dialog open={showVariableModal} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>编辑变量</DialogTitle>
        </DialogHeader>

        <div className="space-y-space-base px-6 pb-2">
          <div className="space-y-space-sm">
            <label className="text-sm font-medium text-text-primary">变量名</label>
            <Input
              value={variableForm.key}
              onChange={(event) => setVariableForm((previousForm) => ({ ...previousForm, key: event.target.value }))}
              placeholder="请输入变量名"
            />
          </div>

          <div className="flex items-center justify-between py-space-xs">
            <label className="text-sm font-medium text-text-primary">是否可选</label>
            <Switch
              checked={variableForm.optional}
              onCheckedChange={(checked) => setVariableForm((previousForm) => ({ ...previousForm, optional: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button onClick={handleAddVariable}>添加</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
