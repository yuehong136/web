import type { ApplicationComposition } from '@/platform'
import { createDesktopApplicationComposition } from '@/platform/desktop'

export enum ClientRuntime {
  WEB = 'web',
  DESKTOP = 'desktop',
  INCOMPATIBLE = 'incompatible',
}

export interface RuntimeSelectionInput {
  readonly protocol: string
  readonly host: string
  readonly bridge?: unknown
}

export type RuntimeSelection =
  | { readonly runtime: ClientRuntime.WEB }
  | {
      readonly runtime: ClientRuntime.DESKTOP
      readonly composition: ApplicationComposition
    }
  | { readonly runtime: ClientRuntime.INCOMPATIBLE }

const WEB_PROTOCOLS = new Set(['http:', 'https:'])

export function selectApplicationRuntime(
  input: RuntimeSelectionInput,
): RuntimeSelection {
  if (WEB_PROTOCOLS.has(input.protocol)) {
    return Object.freeze({ runtime: ClientRuntime.WEB })
  }

  if (input.protocol !== 'app:' || input.host !== 'bundle') {
    return Object.freeze({ runtime: ClientRuntime.INCOMPATIBLE })
  }

  const composition = createDesktopApplicationComposition(input.bridge)
  if (!composition) {
    return Object.freeze({ runtime: ClientRuntime.INCOMPATIBLE })
  }

  return Object.freeze({
    runtime: ClientRuntime.DESKTOP,
    composition,
  })
}
