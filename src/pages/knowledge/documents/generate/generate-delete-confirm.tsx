/**
 * 生成结果删除确认弹窗
 */

import React, { memo } from 'react'
import { ConfirmModal } from '@/components/ui'
import { GenerateTaskType } from '@/hooks/use-generate-task'
import { TASK_TYPE_CONFIG } from './constants'

interface GenerateDeleteConfirmProps {
  open: boolean
  type: GenerateTaskType | null
  onConfirm: () => void
  onClose: () => void
}

const GenerateDeleteConfirmComponent: React.FC<GenerateDeleteConfirmProps> = ({
  open,
  type,
  onConfirm,
  onClose,
}) => {
  const label = type ? TASK_TYPE_CONFIG[type].label : ''

  return (
    <ConfirmModal
      open={open}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`删除 ${label} 生成结果`}
      description={`确定要删除${label}的生成结果吗？删除后需要重新生成。`}
    />
  )
}

export const GenerateDeleteConfirm = memo(GenerateDeleteConfirmComponent)
