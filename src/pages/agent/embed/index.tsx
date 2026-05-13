import { useCallback, useEffect, useRef, useState } from 'react'
import { ScopedTheme } from '@/themes'
import { applyRouteLocale } from '@/locales/i18n'
import { useEmbedAccess } from './use-embed-access'
import { useEmbedBridge } from './use-embed-bridge'
import {
  EmbedShell,
  EmbedWaitingHost,
  EmbedAccessError,
  EmbedAuthError,
} from './embed-shell'
import {
  installApiClientPatch,
  setEmbedJwt,
  clearEmbedJwt,
} from './apiclient-embed-patch'
import { EmbedAuthorised } from './embed-authorised'
import type { EmbedAccess } from './use-embed-access'
import type { EmbedInbound, EmbedThemeValue } from './protocol'

type AuthState = 'pending' | 'authorised' | 'expired'

export default function AgentEmbedPage() {
  const { access, error } = useEmbedAccess()

  if (error || !access) {
    return <EmbedAccessError message={error ?? 'Embed access misconfigured.'} />
  }

  return <EmbedRoot access={access} />
}

function EmbedRoot({ access }: { access: EmbedAccess }) {
  const [authState, setAuthState] = useState<AuthState>('pending')
  const [theme, setTheme] = useState<EmbedThemeValue | undefined>(access.theme)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Install the apiClient patch exactly once. The onAuthExpired callback is
  // stable via ref so we can mutate the auth state without re-installing.
  const onAuthExpiredRef = useRef<() => void>(() => undefined)
  useEffect(() => {
    installApiClientPatch({
      onAuthExpired: () => onAuthExpiredRef.current(),
    })
  }, [])

  // Inbound handlers
  const handleInit = useCallback(
    (msg: Extract<EmbedInbound, { type: 'embed-init' }>) => {
      setEmbedJwt(msg.jwt)
      if (msg.theme) setTheme(msg.theme)
      if (msg.locale) applyRouteLocale(msg.locale)
      setAuthState('authorised')
    },
    [],
  )

  const handleAuthRefreshed = useCallback(
    (msg: Extract<EmbedInbound, { type: 'auth-refreshed' }>) => {
      setEmbedJwt(msg.jwt)
      setAuthState('authorised')
    },
    [],
  )

  const handleSetTheme = useCallback(
    (msg: Extract<EmbedInbound, { type: 'set-theme' }>) => {
      setTheme(msg.theme)
    },
    [],
  )

  const handleSetLocale = useCallback(
    (msg: Extract<EmbedInbound, { type: 'set-locale' }>) => {
      applyRouteLocale(msg.locale)
    },
    [],
  )

  // Trigger-save is wired below once we have the save callback in scope.
  const triggerSaveRef = useRef<() => void>(() => undefined)
  const handleTriggerSave = useCallback(() => {
    triggerSaveRef.current()
  }, [])

  const bridge = useEmbedBridge({
    parentOrigin: access.parentOrigin,
    resizeTarget: containerRef.current,
    onInit: handleInit,
    onAuthRefreshed: handleAuthRefreshed,
    onSetTheme: handleSetTheme,
    onSetLocale: handleSetLocale,
    onTriggerSave: handleTriggerSave,
  })

  // Wire onAuthExpired now that we have the bridge.
  useEffect(() => {
    onAuthExpiredRef.current = () => {
      clearEmbedJwt()
      setAuthState('expired')
      bridge.postToParent({ type: 'auth-expired' })
    }
  }, [bridge])

  // Apply locale on initial mount if URL carried one.
  useEffect(() => {
    if (access.locale) applyRouteLocale(access.locale)
  }, [access.locale])

  if (authState === 'pending') {
    return (
      <ScopedTheme theme={theme}>
        <EmbedShell>
          <EmbedWaitingHost parentOrigin={access.parentOrigin} />
        </EmbedShell>
      </ScopedTheme>
    )
  }

  if (authState === 'expired') {
    return (
      <ScopedTheme theme={theme}>
        <EmbedShell>
          <EmbedAuthError />
        </EmbedShell>
      </ScopedTheme>
    )
  }

  return (
    <ScopedTheme theme={theme}>
      <EmbedAuthorised
        access={access}
        containerRef={containerRef}
        postToParent={bridge.postToParent}
        triggerSaveRef={triggerSaveRef}
      />
    </ScopedTheme>
  )
}
