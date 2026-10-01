import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'
import { getListOperationLabelKey } from '../../form/list-operations/utils'
import type { IListOperationsForm } from '../../types'

function InnerListOperationsNode({
  ...props
}: NodeProps<BaseNode<IListOperationsForm>>) {
  const { data } = props
  const { t } = useTranslation()

  return (
    <RagNode {...props}>
      <div className="px-space-base py-space-sm">
        <LabelCard>{t(getListOperationLabelKey(data.form || {}))}</LabelCard>
      </div>
    </RagNode>
  )
}

export const ListOperationsNode = memo(InnerListOperationsNode)
