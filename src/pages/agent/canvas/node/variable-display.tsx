import { type ReactNode } from 'react'

interface VariableDisplayProps {
  content: string
  getLabel?: (value?: string) => string | ReactNode
}

function VariableNodeDisplay({ label }: { label: ReactNode }) {
  return (
    <div className="inline-flex items-center mr-1">
      <span className="text-text-accent">{label}</span>
    </div>
  )
}

export function VariableDisplay({ content, getLabel }: VariableDisplayProps) {
  if (!content) return null

  const regex = /{([^}]*)}/g
  let match: RegExpExecArray | null
  let lastIndex = 0
  const elements: ReactNode[] = []

  const findLabelByValue = (value: string) => {
    if (getLabel) {
      return getLabel(value)
    }
    return null
  }

  while ((match = regex.exec(content)) !== null) {
    const { 1: variableValue, index, 0: template } = match

    if (index > lastIndex) {
      elements.push(
        <span key={`text-${index}`}>
          {content.slice(lastIndex, index)}
        </span>,
      )
    }

    const label = findLabelByValue(variableValue)

    if (label && label !== variableValue) {
      elements.push(
        <VariableNodeDisplay key={`variable-${index}`} label={label} />,
      )
    } else {
      elements.push(<span key={`text-${index}-template`}>{template}</span>)
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < content.length) {
    elements.push(
      <span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>,
    )
  }

  return <>{elements.length > 0 ? elements : content}</>
}

