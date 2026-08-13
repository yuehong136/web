import {
  PlatformKind,
  type ApplicationComposition,
  type CommandSource,
  type PlatformCapabilities,
  type PlatformPort,
} from '@/platform/contracts'

const BROWSER_CAPABILITIES: Readonly<PlatformCapabilities> = Object.freeze({
  desktop: false,
  nativeMenu: false,
  updater: false,
  notifications: false,
  localAgent: false,
  pty: false,
  localMcp: false,
})

const NOOP_UNSUBSCRIBE = () => undefined

const BROWSER_COMMAND_SOURCE: CommandSource = Object.freeze({
  subscribe: () => NOOP_UNSUBSCRIBE,
})

const BROWSER_PLATFORM: PlatformPort = Object.freeze({
  kind: PlatformKind.WEB,
  capabilities: () => BROWSER_CAPABILITIES,
})

const BROWSER_COMPOSITION: ApplicationComposition = Object.freeze({
  platform: BROWSER_PLATFORM,
  commandSource: BROWSER_COMMAND_SOURCE,
})

export function createBrowserApplicationComposition(): ApplicationComposition {
  return BROWSER_COMPOSITION
}
