import type { ReactElement, ReactNode } from 'react'

export interface VariableOptionItem {
  label: string
  value: string
  parentLabel?: string
  icon?: ReactNode
  type?: string
  insertMode?: 'text' | 'variable'
}

export interface VariableOptionGroup {
  label: ReactElement | string
  title: string
  options: VariableOptionItem[]
}
