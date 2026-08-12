import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateAgentSetting } from '@/hooks/use-agent-mutation'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingForm, type SettingFormSchemaType } from './setting-form'
import { buildAgentSettingsPayload } from './settings-payload'

interface SettingDialogProps {
  agentId: string
  title: string
  description?: string
  hideModal?: () => void
  onSaved?: (title: string) => void
}

export function SettingDialog({
  agentId,
  title,
  description,
  hideModal,
  onSaved,
}: SettingDialogProps) {
  const { t } = useTranslation()
  const { updateAgentSetting, isLoading } = useUpdateAgentSetting()
  const defaultValues = useMemo(
    () => ({ name: title, description: description || '' }),
    [description, title],
  )

  const submit = useCallback(
    async (values: SettingFormSchemaType) => {
      const payload = buildAgentSettingsPayload({
        agentId,
        name: values.name,
        description: values.description,
      })
      try {
        await updateAgentSetting(payload)
      } catch {
        // Mutation 层已经展示错误；保留弹窗和用户输入供再次提交。
        return
      }
      onSaved?.(payload.title)
      hideModal?.()
    },
    [agentId, hideModal, onSaved, updateAgentSetting],
  )

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isLoading) hideModal?.()
      }}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{t('common.edit', '编辑')}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-4">
          <SettingForm
            submit={submit}
            defaultValues={defaultValues}
            disabled={isLoading}
          />
        </div>
        <DialogFooter>
          <Button type="submit" form="agent-setting-form" disabled={isLoading}>
            {isLoading
              ? t('common.saving', '保存中...')
              : t('common.save', '保存')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
