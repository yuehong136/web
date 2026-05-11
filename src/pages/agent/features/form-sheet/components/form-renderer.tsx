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
        <div className="rounded-radius-md border-border-primary bg-surface-secondary p-space-base border">
          <div className="text-sm font-medium text-text-primary">
            暂不支持编辑该节点配置
          </div>
          <p className="mt-space-xs text-sm text-text-secondary">
            当前节点类型为 {operatorType || 'unknown'}
            。你可以继续在画布中连接、运行或保存该节点。
          </p>
        </div>
        <pre className="rounded-radius-md border-border-primary bg-surface-secondary p-space-base max-h-[24rem] overflow-auto border text-xs text-text-secondary">
          {JSON.stringify(node.data?.form || {}, null, 2)}
        </pre>
      </div>
    )
  }

  return <FormComponent node={node} nodeId={node.id} />
}
