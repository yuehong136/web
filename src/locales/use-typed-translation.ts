import { useMemo } from 'react'
import { useTranslation, type UseTranslationOptions } from 'react-i18next'
import {
  createTypedTranslator,
  type TranslationScope,
} from './typed-translation'

/**
 * Opt-in typed scopes reuse the existing resource boundary and provider.
 * `options` pass through to useTranslation, e.g. to re-render when bundles
 * load for components that sit above the route locale boundary.
 */
export function useTypedTranslation<Scope extends TranslationScope>(
  scope: Scope,
  options?: UseTranslationOptions<undefined>,
) {
  const { t, i18n, ready } = useTranslation(undefined, options)
  const translate = useMemo(() => createTypedTranslator(scope, t), [scope, t])
  return { t: translate, i18n, ready }
}
