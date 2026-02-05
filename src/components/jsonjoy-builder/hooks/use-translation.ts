import { useContext } from 'react'
import { TranslationContext } from '../i18n/translation-context'

export function useTranslation() {
  return useContext(TranslationContext)
}
