import assert from 'node:assert/strict'
import test from 'node:test'
import type { MenuItemConstructorOptions } from 'electron'
import {
  createDesktopMenuTemplate,
  DESKTOP_COMMAND_MENU_ITEM_PREFIX,
} from '../../electron/main/menu/menu-template'
import { DesktopCommandId } from '../../protocol/renderer-bridge'

function flattenMenu(
  items: readonly MenuItemConstructorOptions[],
): MenuItemConstructorOptions[] {
  const flattened: MenuItemConstructorOptions[] = []
  for (const item of items) {
    flattened.push(item)
    if (Array.isArray(item.submenu)) {
      flattened.push(...flattenMenu(item.submenu))
    }
  }
  return flattened
}

function createFixture(platform: NodeJS.Platform, locale: string) {
  const dispatched: DesktopCommandId[] = []
  const template = createDesktopMenuTemplate({
    appName: 'MultiRAG',
    locale,
    platform,
    dispatch: (commandId) => dispatched.push(commandId),
  })
  return { dispatched, items: flattenMenu(template), template }
}

function findCommandItem(
  items: readonly MenuItemConstructorOptions[],
  commandId: DesktopCommandId,
): MenuItemConstructorOptions {
  const item = items.find(
    (candidate) =>
      candidate.id === `${DESKTOP_COMMAND_MENU_ITEM_PREFIX}${commandId}`,
  )
  assert.ok(item, commandId)
  return item
}

for (const platform of ['darwin', 'win32'] as const) {
  test(`${platform} menu maps each approved command exactly once`, () => {
    const fixture = createFixture(platform, 'en-US')
    const commandItems = fixture.items.filter((item) =>
      item.id?.startsWith(DESKTOP_COMMAND_MENU_ITEM_PREFIX),
    )
    assert.deepEqual(
      commandItems
        .map((item) => item.id?.slice(DESKTOP_COMMAND_MENU_ITEM_PREFIX.length))
        .sort(),
      [...Object.values(DesktopCommandId)].sort(),
    )

    for (const commandId of Object.values(DesktopCommandId)) {
      const click = findCommandItem(fixture.items, commandId)
        .click as () => void
      click()
    }
    assert.deepEqual(fixture.dispatched, Object.values(DesktopCommandId))

    const roles = fixture.items.map((item) => item.role)
    assert.equal(roles.includes('reload'), false)
    assert.equal(roles.includes('forceReload'), false)
    assert.equal(roles.includes('toggleDevTools'), false)
  })
}

test('native menu accelerators and locale labels follow the desktop contract', () => {
  const mac = createFixture('darwin', 'zh-CN')
  assert.equal(mac.template[0]?.label, 'MultiRAG')
  assert.ok(mac.template.some((item) => item.label === '文件'))
  assert.equal(
    findCommandItem(mac.items, DesktopCommandId.PALETTE_OPEN).accelerator,
    'CommandOrControl+K',
  )
  assert.equal(
    findCommandItem(mac.items, DesktopCommandId.NAVIGATION_BACK).accelerator,
    'Command+[',
  )
  assert.equal(
    findCommandItem(mac.items, DesktopCommandId.NAVIGATION_FORWARD).accelerator,
    'Command+]',
  )
  assert.equal(
    findCommandItem(mac.items, DesktopCommandId.NAVIGATION_SETTINGS).label,
    '设置',
  )

  const windows = createFixture('win32', 'unsupported-locale')
  assert.ok(windows.template.some((item) => item.label === 'File'))
  assert.equal(
    findCommandItem(windows.items, DesktopCommandId.NAVIGATION_BACK)
      .accelerator,
    'Alt+Left',
  )
  assert.equal(
    findCommandItem(windows.items, DesktopCommandId.NAVIGATION_FORWARD)
      .accelerator,
    'Alt+Right',
  )
})
