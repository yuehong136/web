import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  createTypedTranslator,
  type TranslationScope,
} from './typed-translation'

/** Opt-in typed scopes reuse the existing resource boundary and provider. */
export function useTypedTranslation<Scope extends TranslationScope>(
  scope: Scope,
) {
  const { t, i18n, ready } = useTranslation()
  const translate = useMemo(() => createTypedTranslator(scope, t), [scope, t])
  return { t: translate, i18n, ready }
}
