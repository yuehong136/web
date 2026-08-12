export const DESKTOP_BRIDGE_VERSION = 1 as const

export interface DesktopCapabilities {
  readonly desktop: true
  readonly updater: false
  readonly notifications: false
  readonly localAgent: false
  readonly pty: false
  readonly localMcp: false
}

export interface MultiRagDesktopBridge {
  readonly version: typeof DESKTOP_BRIDGE_VERSION
  capabilities(): DesktopCapabilities
}

const DESKTOP_CAPABILITIES: DesktopCapabilities = Object.freeze({
  desktop: true,
  updater: false,
  notifications: false,
  localAgent: false,
  pty: false,
  localMcp: false,
})

export function getDesktopCapabilities(): DesktopCapabilities {
  return DESKTOP_CAPABILITIES
}

export function createDesktopBridge(): MultiRagDesktopBridge {
  return Object.freeze({
    version: DESKTOP_BRIDGE_VERSION,
    capabilities: getDesktopCapabilities,
  })
}
