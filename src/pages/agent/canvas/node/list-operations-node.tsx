import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { camelCase } from 'lodash'
import { useTranslation } from 'react-i18next'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'
import { ListOperations } from '../../constant'

type ListOperationsSummary = {
  operations?: string
}

function InnerListOperationsNode({
  ...props
}: NodeProps<BaseNode<ListOperationsSummary>>) {
  const { data } = props
  const { t } = useTranslation()
  const operations = data.form?.operations || ListOperations.TopN
  const operationKey = camelCase(operations)

  return (
    <RagNode {...props}>
      <div className="px-3 py-2">
        <LabelCard>
          {t(`flow.ListOperationsOptions.${operationKey}`, operations)}
        </LabelCard>
      </div>
    </RagNode>
  )
}

export const ListOperationsNode = memo(InnerListOperationsNode)
