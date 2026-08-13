import { describe, expect, it, vi } from 'vitest'
import { CommandRegistry } from '../registry'
import {
  CommandCategory,
  CommandScope,
  ProductCommandId,
  type ProductCommand,
} from '../types'
import { getDesktopActivityForPath } from '../navigation'
import { DesktopActivity } from '@/stores/ui'

const createCommand = (
  id: ProductCommandId,
  run = vi.fn(),
): ProductCommand => ({
  id,
  titleKey: `desktop.commands.${id}`,
  fallbackTitle: id,
  category: CommandCategory.NAVIGATION,
  scope: CommandScope.GLOBAL,
  run,
})

describe('CommandRegistry', () => {
  it('maps product routes to the matching Desktop activity', () => {
    expect(getDesktopActivityForPath('/home')).toBe(DesktopActivity.WORK)
    expect(getDesktopActivityForPath('/search/results')).toBe(
      DesktopActivity.DISCOVER,
    )
    expect(getDesktopActivityForPath('/knowledge')).toBe(
      DesktopActivity.KNOWLEDGE,
    )
    expect(getDesktopActivityForPath('/studio/editor')).toBe(
      DesktopActivity.BUILD,
    )
    expect(getDesktopActivityForPath('/mcp-servers')).toBe(
      DesktopActivity.TOOLS,
    )
    expect(getDesktopActivityForPath('/settings')).toBeUndefined()
  })
  it('keeps the approved eight stable command ids', () => {
    expect(Object.values(ProductCommandId)).toEqual([
      'palette.open',
      'conversation.new',
      'view.sidebar.toggle',
      'navigation.home',
      'navigation.search',
      'navigation.settings',
      'navigation.back',
      'navigation.forward',
    ])
  })

  it('rejects duplicate stable command ids', () => {
    const registry = new CommandRegistry()
    registry.register(createCommand(ProductCommandId.NAVIGATE_HOME))

    expect(() =>
      registry.register(createCommand(ProductCommandId.NAVIGATE_HOME)),
    ).toThrow('Duplicate product command')
  })

  it('executes a registered command once and supports idempotent disposal', async () => {
    const registry = new CommandRegistry()
    const run = vi.fn()
    const dispose = registry.register(
      createCommand(ProductCommandId.NAVIGATE_SEARCH, run),
    )

    await expect(
      registry.execute(ProductCommandId.NAVIGATE_SEARCH, {
        closePalette: vi.fn(),
      }),
    ).resolves.toBe(true)
    expect(run).toHaveBeenCalledTimes(1)

    dispose()
    dispose()
    await expect(
      registry.execute(ProductCommandId.NAVIGATE_SEARCH, {
        closePalette: vi.fn(),
      }),
    ).resolves.toBe(false)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('does not execute a disabled command', async () => {
    const registry = new CommandRegistry()
    const run = vi.fn()
    registry.register({
      ...createCommand(ProductCommandId.NAVIGATE_SETTINGS, run),
      isEnabled: () => false,
    })

    await expect(
      registry.execute(ProductCommandId.NAVIGATE_SETTINGS, {
        closePalette: vi.fn(),
      }),
    ).resolves.toBe(false)
    expect(run).not.toHaveBeenCalled()
  })
})
