import { createContext, useContext } from 'react'
import { MineruLanguageOptions } from '@/types/knowledge-form'

/** Document adapters opt in; knowledge-base forms retain their existing units and ranges. */
export const ParserFieldScope = createContext<'dataset' | 'document'>('dataset')
export const useDocumentParserFields = () =>
  useContext(ParserFieldScope) === 'document'

export function documentOverlapFraction(value: number): number {
  return value > 0 && value < 1 ? value : value / 100
}

export function mineruLanguageOptions(documentScope: boolean) {
  const options: { label: string; value: string }[] = MineruLanguageOptions.map(
    (option) => ({ ...option }),
  )
  if (documentScope)
    options.push(
      ...['Bulgarian', 'Turkish'].map((value) => ({ label: value, value })),
    )
  return options
}
