import { useState, type ComponentProps } from 'react'
import { Input } from '@/components/ui/input'
import { parseListCountInput } from './utils'

type CountInputProps = Omit<
  ComponentProps<typeof Input>,
  'value' | 'onChange'
> & {
  value: unknown
  onValueChange: (value: number) => void
  onValidityChange: (valid: boolean) => void
}

export function ListCountInput({
  value,
  onValueChange,
  onValidityChange,
  ...props
}: CountInputProps) {
  const [draft, setDraft] = useState(String(value ?? ''))
  const [previousValue, setPreviousSource] = useState(value)
  if (previousValue !== value) {
    setPreviousSource(value)
    setDraft(String(value ?? ''))
  }
  return (
    <Input
      {...props}
      inputMode="numeric"
      value={draft}
      onChange={(event) => {
        const text = event.target.value
        setDraft(text)
        const next = parseListCountInput(text)
        onValidityChange(next !== undefined)
        if (next !== undefined) onValueChange(next)
      }}
    />
  )
}
