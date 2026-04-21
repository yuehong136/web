import type { PropsWithChildren } from 'react'
import {
  FormBindingContext,
  type FormBindingValue,
} from './form-binding-context'

export function FormBindingProvider({
  value,
  children,
}: PropsWithChildren<{ value: FormBindingValue }>) {
  return (
    <FormBindingContext.Provider value={value}>
      {children}
    </FormBindingContext.Provider>
  )
}
