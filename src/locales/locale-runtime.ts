import type { i18n as I18nInstance } from 'i18next'
import {
  BOOTSTRAP_NAMESPACES,
  loadLocaleNamespace,
  normalizeLocale,
  type LocaleNamespace,
  type LocaleResource,
  type ProductLocale,
} from './locale-registry'

export interface LocaleSnapshot {
  readonly productLocale: ProductLocale
  readonly effectiveLocale: ProductLocale
}

interface LocaleIntent {
  productLocale: ProductLocale
  persistProduct: boolean
  overrides: Map<symbol, ProductLocale>
}

export interface LocaleRuntimeOptions {
  instance: I18nInstance
  initialLocale: ProductLocale
  loadNamespace?: (
    locale: ProductLocale,
    namespace: LocaleNamespace,
  ) => Promise<LocaleResource>
  persist?: (locale: ProductLocale) => void
  applyDocument?: (locale: ProductLocale) => void
}

/** Owns preference, temporary scopes and async commits for one i18next instance. */
export const createLocaleRuntime = ({
  instance,
  initialLocale,
  loadNamespace = loadLocaleNamespace,
  persist,
  applyDocument,
}: LocaleRuntimeOptions) => {
  const changeLanguage = instance.changeLanguage.bind(instance)
  const listeners = new Set<() => void>()
  const productListeners = new Set<(locale: ProductLocale) => void>()
  const activeNamespaces = new Set<LocaleNamespace>(BOOTSTRAP_NAMESPACES)
  const pendingResources = new Map<string, Promise<void>>()
  let snapshot: LocaleSnapshot = {
    productLocale: initialLocale,
    effectiveLocale: initialLocale,
  }
  let committed: LocaleIntent = {
    productLocale: initialLocale,
    persistProduct: false,
    overrides: new Map(),
  }
  let desired = committed
  let revision = 0
  let latestRequest: Promise<ProductLocale> = Promise.resolve(initialLocale)

  const effective = (intent: LocaleIntent) =>
    [...intent.overrides.values()].at(-1) ?? intent.productLocale

  const ensureNamespaces = async (
    locale: ProductLocale,
    namespaces: readonly LocaleNamespace[] = [...activeNamespaces],
  ) => {
    await Promise.all(
      namespaces.map((namespace) => {
        if (instance.hasResourceBundle(locale, namespace)) return
        const key = `${locale}/${namespace}`
        let pending = pendingResources.get(key)
        if (!pending) {
          pending = loadNamespace(locale, namespace)
            .then((resource) => {
              if (!resource || typeof resource !== 'object') {
                throw new Error(`Invalid locale resource: ${key}`)
              }
              const keys = Object.keys(resource)
              const root =
                (keys.length === 1 ? keys[0] : undefined) ?? namespace
              const domain = resource[root]
              const namespaced =
                domain && typeof domain === 'object'
                  ? {
                      ...domain,
                      ...Object.fromEntries(
                        Object.entries(resource).filter(
                          ([key]) => key !== root,
                        ),
                      ),
                    }
                  : resource
              instance.addResourceBundle(
                locale,
                namespace,
                namespaced,
                true,
                true,
              )
              // Keep all existing t('domain.key') calls while storing actual domain
              // bundles separately. Only requested domains enter either bundle.
              instance.addResourceBundle(
                locale,
                'translation',
                resource,
                true,
                true,
              )
            })
            .finally(() => pendingResources.delete(key))
          pendingResources.set(key, pending)
        }
        return pending
      }),
    )
    namespaces.forEach((namespace) => activeNamespaces.add(namespace))
    return locale
  }

  const request = (update: (intent: LocaleIntent) => void) => {
    const next: LocaleIntent = {
      ...desired,
      overrides: new Map(desired.overrides),
    }
    update(next)
    desired = next
    const requestRevision = ++revision
    const nextLocale = effective(next)
    const operation = (async () => {
      try {
        await ensureNamespaces(nextLocale)
        if (
          (next.persistProduct || next.overrides.size > 0) &&
          next.productLocale !== nextLocale
        ) {
          await ensureNamespaces(next.productLocale)
        }
        if (requestRevision !== revision) return latestRequest
        const previousLocale = snapshot.effectiveLocale
        try {
          await changeLanguage(nextLocale)
          if (requestRevision !== revision) {
            await changeLanguage(snapshot.effectiveLocale)
            return latestRequest
          }
          if (next.persistProduct) persist?.(next.productLocale)
        } catch (error) {
          await changeLanguage(previousLocale)
          throw error
        }
        if (requestRevision !== revision) return latestRequest
        const productChanged = snapshot.productLocale !== next.productLocale
        snapshot = {
          productLocale: next.productLocale,
          effectiveLocale: nextLocale,
        }
        committed = { ...next, persistProduct: false }
        desired = committed
        applyDocument?.(nextLocale)
        listeners.forEach((listener) => listener())
        if (productChanged)
          productListeners.forEach((listener) => listener(next.productLocale))
        return next.productLocale
      } catch (error) {
        if (requestRevision !== revision) return latestRequest
        desired = committed
        throw error
      }
    })()
    latestRequest = operation
    return operation
  }

  const createRouteScope = () => {
    const owner = Symbol('route-locale')
    let disposed = false
    return {
      set: (value: unknown) => {
        if (disposed) return Promise.resolve(snapshot.effectiveLocale)
        const locale = normalizeLocale(value)
        return request((intent) => {
          intent.overrides.delete(owner)
          if (locale) intent.overrides.set(owner, locale)
        }).then(() => snapshot.effectiveLocale)
      },
      dispose: () => {
        disposed = true
        return request((intent) => {
          intent.overrides.delete(owner)
        }).then(() => snapshot.effectiveLocale)
      },
    }
  }
  const defaultScope = createRouteScope()
  return {
    instance,
    ensureNamespaces,
    createRouteScope,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    subscribeProductLanguage: (listener: (locale: ProductLocale) => void) => {
      productListeners.add(listener)
      return () => {
        productListeners.delete(listener)
      }
    },
    setProductLanguage: (value: ProductLocale) => {
      const locale = normalizeLocale(value)
      if (!locale)
        return Promise.reject(new Error('Unsupported product locale'))
      return request((intent) => {
        intent.productLocale = locale
        intent.persistProduct = true
      })
    },
    applyRouteLocale: defaultScope.set,
    clearRouteLocale: () => defaultScope.set(undefined),
  }
}

export type LocaleRuntime = ReturnType<typeof createLocaleRuntime>
