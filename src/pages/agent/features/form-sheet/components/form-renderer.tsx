import type { RAGFlowNodeType } from '../../../types'
import { resolveFormRendererComponent } from './form-renderer-registry'

interface FormRendererProps {
  node?: RAGFlowNodeType
  rendererKey?: string
  operatorType?: string
}

export function FormRenderer({
  node,
  rendererKey,
  operatorType,
}: FormRendererProps) {
  if (!node) {
    return null
  }

  const FormComponent = resolveFormRendererComponent(rendererKey)

  if (!FormComponent) {
    return (
      <div className="space-y-space-md p-space-base">
        <div className="rounded-radius-md border border-border-primary bg-surface-secondary p-space-base">
          <div className="text-sm font-medium text-text-primary">
            该节点尚未接入 T2 表单装配映射
          </div>
          <p className="mt-space-xs text-sm text-text-secondary">
            当前节点类型为 {operatorType || 'unknown'}，后续可在 T3 中继续迁移内容层。
          </p>
        </div>
        <pre className="max-h-[24rem] overflow-auto rounded-radius-md border border-border-primary bg-surface-secondary p-space-base text-xs text-text-secondary">
          {JSON.stringify(node.data?.form || {}, null, 2)}
        </pre>
      </div>
    )
  }

  return <FormComponent node={node} nodeId={node.id} />
}
