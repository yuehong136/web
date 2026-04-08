interface OperatorDescriptionProps {
  description: string
}

export function OperatorDescription({
  description,
}: OperatorDescriptionProps) {
  if (!description) {
    return null
  }

  return (
    <p className="text-sm leading-6 text-text-secondary">
      {description}
    </p>
  )
}
