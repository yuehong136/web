import { useContext } from 'react'
import { FormBindingContext } from './form-binding-context'

export function useFormBinding() {
  return useContext(FormBindingContext)
}
