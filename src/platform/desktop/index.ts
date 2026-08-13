import { DESKTOP_BRIDGE_VERSION } from '../../../desktop/protocol/renderer-bridge'
import {
  PlatformKind,
  type ApplicationComposition,
  type CommandListener,
  type CommandSource,
  type PlatformCapabilities,
  type PlatformPort,
} from '@/platform/contracts'
import { isProductCommandId } from '@/lib/commands/types'

interface DesktopCommandsBridge {
  onInvoked(listener: (id: unknown) => void): unknown
}

interface DesktopBridge {
  readonly version: unknown
  capabilities(): unknown
  readonly commands: DesktopCommandsBridge
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isDesktopBridge(value: unknown): value is DesktopBridge {
  if (!isRecord(value) || value.version !== DESKTOP_BRIDGE_VERSION) {
    return false
  }
  if (typeof value.capabilities !== 'function' || !isRecord(value.commands)) {
    return false
  }
  return typeof value.commands.onInvoked === 'function'
}

function normalizeCapabilities(
  value: unknown,
): Readonly<PlatformCapabilities> | null {
  if (!isRecord(value)) return null

  const capabilities: PlatformCapabilities = {
    desktop: value.desktop === true,
    nativeMenu: value.nativeMenu === true,
    updater: value.updater === true,
    notifications: value.notifications === true,
    localAgent: value.localAgent === true,
    pty: value.pty === true,
    localMcp: value.localMcp === true,
  }

  if (!capabilities.desktop || !capabilities.nativeMenu) return null
  if (
    [
      'desktop',
      'nativeMenu',
      'updater',
      'notifications',
      'localAgent',
      'pty',
      'localMcp',
    ].some((key) => typeof value[key] !== 'boolean')
  ) {
    return null
  }

  return Object.freeze(capabilities)
}

function createDesktopCommandSource(bridge: DesktopBridge): CommandSource {
  return Object.freeze({
    subscribe(listener: CommandListener): () => void {
      let active = true
      let unsubscribe: unknown
      try {
        unsubscribe = bridge.commands.onInvoked((commandId) => {
          if (active && isProductCommandId(commandId)) {
            listener(commandId)
          }
        })
      } catch {
        active = false
        throw new Error('Desktop command subscription is unavailable.')
      }
      if (typeof unsubscribe !== 'function') {
        active = false
        throw new Error('Desktop command subscription is unavailable.')
      }

      return () => {
        if (!active) return
        active = false
        unsubscribe()
      }
    },
  })
}

export function createDesktopApplicationComposition(
  bridgeCandidate: unknown,
): ApplicationComposition | null {
  let bridge: DesktopBridge
  try {
    if (!isDesktopBridge(bridgeCandidate)) return null
    bridge = bridgeCandidate
  } catch {
    return null
  }

  let capabilities: Readonly<PlatformCapabilities> | null
  try {
    capabilities = normalizeCapabilities(bridge.capabilities())
  } catch {
    return null
  }
  if (!capabilities) return null

  const platform: PlatformPort = Object.freeze({
    kind: PlatformKind.DESKTOP,
    capabilities: () => capabilities,
  })

  return Object.freeze({
    platform,
    commandSource: createDesktopCommandSource(bridge),
  })
}
