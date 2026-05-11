import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type EmbedInbound,
  type EmbedOutboundPayload,
  isEmbedInbound,
  makeOutbound,
} from './protocol'

export type EmbedBridgeStatus = 'awaiting-init' | 'ready' | 'error'

export interface EmbedBridgeOptions {
  parentOrigin: string
  /**
   * Element whose size should be reported to the host via `resize` messages.
   * Resize tracking is opt-in: pass `null`/`undefined` to disable.
   */
  resizeTarget?: HTMLElement | null
  /**
   * Dispatchers for inbound messages. Each handler is invoked at most once per
   * matching message; missing handlers cause the message to be dropped.
   */
  onInit: (msg: Extract<EmbedInbound, { type: 'embed-init' }>) => void
  onAuthRefreshed: (
    msg: Extract<EmbedInbound, { type: 'auth-refreshed' }>,
  ) => void
  onSetTheme: (msg: Extract<EmbedInbound, { type: 'set-theme' }>) => void
  onSetLocale: (msg: Extract<EmbedInbound, { type: 'set-locale' }>) => void
  onTriggerSave: () => void
}

export interface EmbedBridge {
  status: EmbedBridgeStatus
  /** Send a message to the parent window using the strict origin. */
  postToParent: (msg: EmbedOutboundPayload) => void
  /** Mark the bridge ready (called once host `embed-init` has been processed). */
  markReady: () => void
}

const RESIZE_THROTTLE_MS = 100

/**
 * Wire the iframe ↔ host postMessage channel.
 *
 * Key safety properties:
 *   - `event.origin` is compared exactly against `parentOrigin` (no wildcard).
 *   - Outbound `postMessage` always targets `parentOrigin`, never `'*'`.
 *   - Unknown / version-mismatched / type-invalid messages are silently dropped.
 *   - The `ready` signal is sent automatically once on mount.
 */
export function useEmbedBridge(options: EmbedBridgeOptions): EmbedBridge {
  const {
    parentOrigin,
    resizeTarget,
    onInit,
    onAuthRefreshed,
    onSetTheme,
    onSetLocale,
    onTriggerSave,
  } = options

  const handlersRef = useRef({
    onInit,
    onAuthRefreshed,
    onSetTheme,
    onSetLocale,
    onTriggerSave,
  })
  handlersRef.current = {
    onInit,
    onAuthRefreshed,
    onSetTheme,
    onSetLocale,
    onTriggerSave,
  }

  const [status, setStatus] = useState<EmbedBridgeStatus>('awaiting-init')

  const postToParent = useCallback(
    (msg: EmbedOutboundPayload) => {
      if (typeof window === 'undefined') return
      try {
        window.parent.postMessage(makeOutbound(msg), parentOrigin)
      } catch {
        // postMessage can throw on closed/disconnected hosts; we choose silent
        // failure because there is no recovery path inside the iframe.
      }
    },
    [parentOrigin],
  )

  const markReady = useCallback(() => {
    setStatus('ready')
  }, [])

  // Inbound dispatcher
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handler = (event: MessageEvent) => {
      if (event.origin !== parentOrigin) return
      if (!isEmbedInbound(event.data)) return

      const handlers = handlersRef.current
      switch (event.data.type) {
        case 'embed-init':
          handlers.onInit(event.data)
          break
        case 'auth-refreshed':
          handlers.onAuthRefreshed(event.data)
          break
        case 'set-theme':
          handlers.onSetTheme(event.data)
          break
        case 'set-locale':
          handlers.onSetLocale(event.data)
          break
        case 'trigger-save':
          handlers.onTriggerSave()
          break
      }
    }

    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [parentOrigin])

  // Initial `ready` announce — done once on mount.
  useEffect(() => {
    postToParent({ type: 'ready' })
  }, [postToParent])

  // Resize observer (throttled). Reports document height to the host so it can
  // size the iframe element. Hosts that prefer a fixed iframe height can
  // simply ignore these messages.
  useEffect(() => {
    if (typeof window === 'undefined' || !resizeTarget) return
    if (typeof ResizeObserver === 'undefined') return

    let last = 0
    let pending: number | null = null

    const send = (height: number) => {
      last = Date.now()
      pending = null
      postToParent({ type: 'resize', height })
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const height = Math.round(entry.contentRect.height)
      const now = Date.now()
      const elapsed = now - last
      if (elapsed >= RESIZE_THROTTLE_MS) {
        send(height)
      } else if (pending == null) {
        pending = window.setTimeout(
          () => send(height),
          RESIZE_THROTTLE_MS - elapsed,
        )
      }
    })

    observer.observe(resizeTarget)
    return () => {
      observer.disconnect()
      if (pending != null) {
        window.clearTimeout(pending)
      }
    }
  }, [resizeTarget, postToParent])

  return { status, postToParent, markReady }
}
