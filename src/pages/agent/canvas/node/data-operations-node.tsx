import type { NodeProps } from '@xyflow/react'
import { memo } from 'react'
import { camelCase } from 'lodash'
import { useTranslation } from 'react-i18next'
import { RagNode } from './index'
import { LabelCard } from './card'
import type { BaseNode } from '../../types'
import { Operations } from '../../constant'

type DataOperationsSummary = {
  operations?: string
}

function InnerDataOperationsNode({
  ...props
}: NodeProps<BaseNode<DataOperationsSummary>>) {
  const { data } = props
  const { t } = useTranslation()
  const operations = data.form?.operations || Operations.SelectKeys
  const operationKey = camelCase(operations)

  return (
    <RagNode {...props}>
      <div className="px-3 py-2">
        <LabelCard>
          {t(`flow.operationsOptions.${operationKey}`, operations)}
        </LabelCard>
      </div>
    </RagNode>
  )
}

export const DataOperationsNode = memo(InnerDataOperationsNode)
