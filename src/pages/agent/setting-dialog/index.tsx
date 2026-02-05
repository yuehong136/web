import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SettingForm, type SettingFormSchemaType } from './setting-form'

interface SettingDialogProps {
  hideModal?: () => void
}

export function SettingDialog({ hideModal }: SettingDialogProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)

  const submit = useCallback(
    async (values: SettingFormSchemaType) => {
      setLoading(true)
      try {
        // TODO: 集成实际的 API 调用
        console.log('Save settings:', values)
        hideModal?.()
      } finally {
        setLoading(false)
      }
    },
    [hideModal],
  )

  return (
    <Dialog open onOpenChange={() => hideModal?.()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('common.edit', '编辑')}</DialogTitle>
        </DialogHeader>
        <SettingForm submit={submit} />
        <DialogFooter>
          <Button type="submit" form="agent-setting-form" disabled={loading}>
            {loading ? t('common.saving', '保存中...') : t('common.save', '保存')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
