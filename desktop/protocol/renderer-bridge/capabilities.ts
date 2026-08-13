import type {
  DesktopCommandBridge,
  DesktopCommandListener,
  DesktopCommandSource,
} from './commands'

export const DESKTOP_BRIDGE_VERSION = 2 as const

export interface DesktopCapabilities {
  readonly desktop: true
  readonly nativeMenu: true
  readonly updater: false
  readonly notifications: false
  readonly localAgent: false
  readonly pty: false
  readonly localMcp: false
}

export interface MultiRagDesktopBridge {
  readonly version: typeof DESKTOP_BRIDGE_VERSION
  capabilities(): DesktopCapabilities
  readonly commands: DesktopCommandBridge
}

const DESKTOP_CAPABILITIES: DesktopCapabilities = Object.freeze({
  desktop: true,
  nativeMenu: true,
  updater: false,
  notifications: false,
  localAgent: false,
  pty: false,
  localMcp: false,
})

export function getDesktopCapabilities(): DesktopCapabilities {
  return DESKTOP_CAPABILITIES
}

export function createDesktopBridge(
  commandSource: DesktopCommandSource,
): MultiRagDesktopBridge {
  const commands: DesktopCommandBridge = Object.freeze({
    onInvoked(listener: DesktopCommandListener): () => void {
      if (typeof listener !== 'function') {
        throw new TypeError('Desktop command listener must be a function.')
      }
      return commandSource.subscribe(listener)
    },
  })

  return Object.freeze({
    version: DESKTOP_BRIDGE_VERSION,
    capabilities: getDesktopCapabilities,
    commands,
  })
}
