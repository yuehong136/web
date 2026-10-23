import { useEffect, useRef } from 'react'
import { createRouteLocaleScope } from './i18n'

/** Releases even an in-flight override when its route leaves the tree. */
export const useRouteLocale = (locale: unknown) => {
  const scope = useRef<ReturnType<typeof createRouteLocaleScope> | undefined>(
    undefined,
  )
  useEffect(() => {
    const activeScope = createRouteLocaleScope()
    scope.current = activeScope
    return () => {
      scope.current = undefined
      void activeScope.dispose().catch(() => undefined)
    }
  }, [])
  useEffect(() => {
    void scope.current?.set(locale).catch(() => undefined)
  }, [locale])
}
