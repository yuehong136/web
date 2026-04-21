import { createContext } from 'react'

export interface FormBindingValue {
  nodeId: string
  formData?: Record<string, unknown>
  path?: (string | number)[]
}

export const FormBindingContext = createContext<FormBindingValue | null>(null)
