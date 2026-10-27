import { createInstance } from 'i18next'
import { createLocaleRuntime } from './locale-runtime'
import { DEFAULT_PRODUCT_LANGUAGE, type ProductLocale } from './locale-registry'

/** A widget owns its language and resources; it never installs the global React plugin. */
export const createIsolatedLocaleRuntime = (
  locale: ProductLocale = DEFAULT_PRODUCT_LANGUAGE,
) => {
  const instance = createInstance()
  void instance.init({
    resources: {},
    lng: locale,
    fallbackLng: false,
    ns: ['translation'],
    defaultNS: 'translation',
    initImmediate: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
  return createLocaleRuntime({ instance, initialLocale: locale })
}
