import { BeginId } from '@/pages/agent/constant'
import type { LexicalNode, NodeKey, SerializedLexicalNode } from 'lexical'
import { DecoratorNode } from 'lexical'
import type { ReactNode } from 'react'
import i18n from 'i18next'

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
  __dataType: string
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
      node.__dataType,
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
    dataType = '',
    icon?: ReactNode,
  ) {
    super(key)
    this.__value = value
    this.__label = label
    this.__parentLabel = parentLabel
    this.__dataType = dataType
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

    return (
      <span className="inline-flex max-w-full items-center gap-space-xs rounded-radius-sm bg-components-system-accent-soft px-space-sm py-0.5 align-middle text-sm text-components-system-accent-text">
        {this.__icon ? (
          <span className="flex items-center justify-center [&_svg]:size-4">
            {this.__icon}
          </span>
        ) : null}
        {parentLabel ? (
          <>
            <span className="max-w-28 truncate text-sm opacity-75">
              {parentLabel}
            </span>
            <span className="opacity-50">/</span>
          </>
        ) : null}
        <span className="max-w-40 truncate text-sm font-medium">
          {this.__label}
        </span>
        {this.__dataType ? (
          <span className="ml-space-xs shrink-0 rounded-radius-sm bg-background-surface/60 px-1 font-mono text-xs text-text-secondary">
            {this.__dataType}
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
      variableType: this.__dataType || undefined,
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
