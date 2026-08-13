import { describe, expect, it, vi } from 'vitest'
import {
  DESKTOP_BRIDGE_VERSION,
  DesktopCommandId,
} from '../../../desktop/protocol/renderer-bridge'
import {
  ClientRuntime,
  selectApplicationRuntime,
  type RuntimeSelectionInput,
} from '../runtime-selection'
import { PlatformKind } from '@/platform'
import { ProductCommandId } from '@/lib/commands'

const desktopCapabilities = Object.freeze({
  desktop: true,
  nativeMenu: true,
  updater: false,
  notifications: false,
  localAgent: false,
  pty: false,
  localMcp: false,
})

function createBridge(overrides: Record<string, unknown> = {}) {
  return {
    version: DESKTOP_BRIDGE_VERSION,
    capabilities: () => desktopCapabilities,
    commands: {
      onInvoked: () => () => undefined,
    },
    ...overrides,
  }
}

describe('application runtime selection', () => {
  it('keeps Renderer product commands and the Desktop bridge allowlist identical', () => {
    expect(Object.values(ProductCommandId).sort()).toEqual(
      Object.values(DesktopCommandId).sort(),
    )
  })
  it('keeps HTTP and HTTPS in the Web composition without reading a bridge', () => {
    let bridgeWasRead = false
    const input = {
      protocol: 'https:',
      host: 'example.test',
      get bridge() {
        bridgeWasRead = true
        throw new Error('bridge must not be read')
      },
    } satisfies RuntimeSelectionInput

    expect(selectApplicationRuntime(input)).toEqual({
      runtime: ClientRuntime.WEB,
    })
    expect(bridgeWasRead).toBe(false)
    expect(
      selectApplicationRuntime({ protocol: 'http:', host: 'localhost' }),
    ).toEqual({ runtime: ClientRuntime.WEB })
  })

  it('selects Desktop only for app://bundle with the exact bridge contract', () => {
    expect(DESKTOP_BRIDGE_VERSION).toBe(2)
    const selection = selectApplicationRuntime({
      protocol: 'app:',
      host: 'bundle',
      bridge: createBridge(),
    })

    expect(selection.runtime).toBe(ClientRuntime.DESKTOP)
    if (selection.runtime !== ClientRuntime.DESKTOP) return
    expect(selection.composition.platform.kind).toBe(PlatformKind.DESKTOP)
    expect(selection.composition.platform.capabilities()).toEqual(
      desktopCapabilities,
    )
    expect(Object.isFrozen(selection.composition)).toBe(true)
    expect(Object.isFrozen(selection.composition.platform)).toBe(true)
    expect(Object.isFrozen(selection.composition.platform.capabilities())).toBe(
      true,
    )
  })

  it.each([
    ['missing bridge', undefined],
    ['old bridge', createBridge({ version: 1 })],
    ['future bridge', createBridge({ version: 3 })],
    ['missing capabilities', createBridge({ capabilities: undefined })],
    [
      'throwing capabilities',
      createBridge({
        capabilities: () => {
          throw new Error('secret')
        },
      }),
    ],
    [
      'invalid capabilities',
      createBridge({
        capabilities: () => ({ ...desktopCapabilities, updater: 'false' }),
      }),
    ],
    ['missing commands', createBridge({ commands: undefined })],
    ['missing subscription', createBridge({ commands: {} })],
  ])('fails closed for %s', (_label, bridge) => {
    expect(
      selectApplicationRuntime({
        protocol: 'app:',
        host: 'bundle',
        bridge,
      }),
    ).toEqual({ runtime: ClientRuntime.INCOMPATIBLE })
  })

  it.each([
    ['app:', 'other-host'],
    ['file:', ''],
    ['custom:', 'bundle'],
  ])('rejects the unapproved %s//%s document', (protocol, host) => {
    expect(
      selectApplicationRuntime({ protocol, host, bridge: createBridge() }),
    ).toEqual({ runtime: ClientRuntime.INCOMPATIBLE })
  })

  it('forwards command notifications and disposes the bridge listener once', () => {
    let bridgeListener: ((id: unknown) => void) | undefined
    const bridgeUnsubscribe = vi.fn()
    const selection = selectApplicationRuntime({
      protocol: 'app:',
      host: 'bundle',
      bridge: createBridge({
        commands: {
          onInvoked(listener: (id: unknown) => void) {
            bridgeListener = listener
            return bridgeUnsubscribe
          },
        },
      }),
    })
    expect(selection.runtime).toBe(ClientRuntime.DESKTOP)
    if (selection.runtime !== ClientRuntime.DESKTOP) return

    const listener = vi.fn()
    const unsubscribe = selection.composition.commandSource.subscribe(listener)
    bridgeListener?.('navigation.home')
    bridgeListener?.('navigation.unknown')
    bridgeListener?.(42)
    unsubscribe()
    unsubscribe()
    bridgeListener?.('navigation.search')

    expect(listener).toHaveBeenCalledOnce()
    expect(listener).toHaveBeenCalledWith('navigation.home')
    expect(bridgeUnsubscribe).toHaveBeenCalledOnce()
  })

  it('rejects a bridge that does not return an unsubscribe function', () => {
    const selection = selectApplicationRuntime({
      protocol: 'app:',
      host: 'bundle',
      bridge: createBridge({
        commands: { onInvoked: () => undefined },
      }),
    })
    expect(selection.runtime).toBe(ClientRuntime.DESKTOP)
    if (selection.runtime !== ClientRuntime.DESKTOP) return

    expect(() =>
      selection.composition.commandSource.subscribe(() => undefined),
    ).toThrow('Desktop command subscription is unavailable.')
  })
})
