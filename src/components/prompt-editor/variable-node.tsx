import { BeginId } from '@/pages/agent/constant'
import type { LexicalNode, NodeKey, SerializedLexicalNode } from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactNode } from 'react'
import i18n from 'i18next'
import { getVariableVisual } from './variable-picker-visuals'

const prefix = BeginId + '@'

type SerializedVariableNode = SerializedLexicalNode & {
  value: string
  label: string
  parentLabel?: string
  variableType?: string
}

export class VariableNode extends DecoratorNode<ReactNode> {
  __value: string
  __label: string
  __parentLabel: string
  __type: string
  __icon?: ReactNode

  static getType(): string {
    return 'variable'
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(
      node.__value,
      node.__label,
      node.__key,
      node.__parentLabel,
      node.__type,
      node.__icon,
    )
  }

  static importJSON(serializedNode: SerializedVariableNode): VariableNode {
    return new VariableNode(
      serializedNode.value,
      serializedNode.label,
      undefined,
      serializedNode.parentLabel ?? '',
      serializedNode.variableType ?? '',
    )
  }

  constructor(
    value = '',
    label = '',
    key?: NodeKey,
    parentLabel = '',
    type = '',
    icon?: ReactNode,
  ) {
    super(key)
    this.__value = value
    this.__label = label
    this.__parentLabel = parentLabel
    this.__type = type
    this.__icon = icon
  }

  createDOM(): HTMLElement {
    const dom = document.createElement('span')
    dom.className = 'prompt-editor-variable-node'

    return dom
  }

  updateDOM(): false {
    return false
  }

  decorate(): ReactNode {
    let parentLabel = this.__parentLabel

    if (this.__value.startsWith(prefix)) {
      parentLabel = i18n.t('flow.begin')
    }

    const variableVisual = getVariableVisual({
      label: this.__label,
      parentLabel,
      type: this.__type,
    })

    return (
      <span className="inline-flex max-w-full items-center gap-space-sm rounded-radius-lg border border-border-default bg-background-subtle px-space-sm py-space-xs align-middle shadow-elevation-low">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-radius-md bg-components-system-accent-bg text-components-system-accent-text">
          <span className="flex items-center justify-center text-xs font-medium [&_svg]:size-3.5">
            {variableVisual.icon}
          </span>
        </span>

        <span className="min-w-0 flex items-center gap-space-xs">
          {parentLabel ? (
            <>
              <span className="max-w-28 truncate text-xs text-text-secondary">
                {parentLabel}
              </span>
              <span className="text-text-tertiary">/</span>
            </>
          ) : null}

          <span className="max-w-40 truncate text-sm font-medium text-components-system-accent-text">
            {this.__label}
          </span>
        </span>

        {this.__type ? (
          <span className="inline-flex shrink-0 items-center rounded-radius-full border border-border-default bg-surface-primary px-space-sm py-0.5 text-xs text-text-secondary">
            {this.__type}
          </span>
        ) : null}
      </span>
    )
  }

  getTextContent(): string {
    return `{${this.__value}}`
  }

  exportJSON(): SerializedVariableNode {
    return {
      ...super.exportJSON(),
      type: VariableNode.getType(),
      version: 1,
      value: this.__value,
      label: this.__label,
      parentLabel: this.__parentLabel || undefined,
      variableType: this.__type || undefined,
    }
  }
}

export function $createVariableNode(
  value: string,
  label: string,
  parentLabel = '',
  type = '',
  icon?: ReactNode,
): VariableNode {
  return new VariableNode(value, label, undefined, parentLabel, type, icon)
}

export function $isVariableNode(
  node: LexicalNode | null | undefined,
): node is VariableNode {
  return node instanceof VariableNode
}
