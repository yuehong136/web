/**
 * 生成结果删除确认弹窗
 */

import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { ConfirmModal } from '@/components/ui'
import { GenerateTaskType } from '@/hooks/use-generate-task'
import { TASK_TYPE_CONFIG } from './constants'

interface GenerateDeleteConfirmProps {
  open: boolean
  loading?: boolean
  type: GenerateTaskType | null
  onConfirm: () => void
  onClose: () => void
}

const GenerateDeleteConfirmComponent: React.FC<GenerateDeleteConfirmProps> = ({
  open,
  type,
  loading,
  onConfirm,
  onClose,
}) => {
  const { t } = useTranslation()
  const label = type ? t(TASK_TYPE_CONFIG[type].labelKey) : ''

  return (
    <ConfirmModal
      open={open}
      loading={loading}
      variant="destructive"
      confirmText={t('common.delete')}
      cancelText={t('common.cancel')}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t('knowledge.documents.generate.deleteTitle', { label })}
      description={t('knowledge.documents.generate.deleteDescription', {
        label,
      })}
    />
  )
}

export const GenerateDeleteConfirm = memo(GenerateDeleteConfirmComponent)
