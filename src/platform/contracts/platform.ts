export enum PlatformKind {
  WEB = 'web',
  DESKTOP = 'desktop',
}

export interface PlatformCapabilities {
  readonly desktop: boolean
  readonly nativeMenu: boolean
  readonly updater: boolean
  readonly notifications: boolean
  readonly localAgent: boolean
  readonly pty: boolean
  readonly localMcp: boolean
}

export interface PlatformPort {
  readonly kind: PlatformKind
  capabilities(): Readonly<PlatformCapabilities>
}
