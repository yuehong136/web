import type { MenuItemConstructorOptions } from 'electron'
import { DesktopCommandId } from '../../../protocol/renderer-bridge'

export const DESKTOP_COMMAND_MENU_ITEM_PREFIX = 'desktop-command:' as const

export type DesktopCommandDispatcher = (commandId: DesktopCommandId) => void

interface DesktopMenuLabels {
  readonly file: string
  readonly edit: string
  readonly view: string
  readonly go: string
  readonly window: string
  readonly newConversation: string
  readonly commandPalette: string
  readonly toggleSidebar: string
  readonly home: string
  readonly search: string
  readonly settings: string
  readonly back: string
  readonly forward: string
}

const ENGLISH_LABELS: DesktopMenuLabels = Object.freeze({
  file: 'File',
  edit: 'Edit',
  view: 'View',
  go: 'Go',
  window: 'Window',
  newConversation: 'New Conversation',
  commandPalette: 'Command Palette…',
  toggleSidebar: 'Toggle Sidebar',
  home: 'Home',
  search: 'Search',
  settings: 'Settings',
  back: 'Back',
  forward: 'Forward',
})

const CHINESE_LABELS: DesktopMenuLabels = Object.freeze({
  file: '文件',
  edit: '编辑',
  view: '视图',
  go: '前往',
  window: '窗口',
  newConversation: '新建对话',
  commandPalette: '命令面板…',
  toggleSidebar: '切换侧栏',
  home: '首页',
  search: '搜索',
  settings: '设置',
  back: '后退',
  forward: '前进',
})

function resolveDesktopMenuLabels(locale: string): DesktopMenuLabels {
  return locale.toLowerCase().startsWith('zh') ? CHINESE_LABELS : ENGLISH_LABELS
}

function createCommandMenuItem(
  label: string,
  commandId: DesktopCommandId,
  dispatch: DesktopCommandDispatcher,
  accelerator?: string,
): MenuItemConstructorOptions {
  return {
    id: `${DESKTOP_COMMAND_MENU_ITEM_PREFIX}${commandId}`,
    label,
    accelerator,
    click: () => dispatch(commandId),
  }
}

function createFileMenu(
  labels: DesktopMenuLabels,
  platform: NodeJS.Platform,
  dispatch: DesktopCommandDispatcher,
): MenuItemConstructorOptions {
  const submenu: MenuItemConstructorOptions[] = [
    createCommandMenuItem(
      labels.newConversation,
      DesktopCommandId.CONVERSATION_NEW,
      dispatch,
      'CommandOrControl+N',
    ),
  ]

  if (platform !== 'darwin') {
    submenu.push(
      createCommandMenuItem(
        labels.settings,
        DesktopCommandId.NAVIGATION_SETTINGS,
        dispatch,
        'CommandOrControl+,',
      ),
      { type: 'separator' },
      { role: 'quit' },
    )
  } else {
    submenu.push({ type: 'separator' }, { role: 'close' })
  }

  return { label: labels.file, submenu }
}

function createEditMenu(labels: DesktopMenuLabels): MenuItemConstructorOptions {
  return {
    label: labels.edit,
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'delete' },
      { role: 'selectAll' },
    ],
  }
}

function createViewMenu(
  labels: DesktopMenuLabels,
  dispatch: DesktopCommandDispatcher,
): MenuItemConstructorOptions {
  return {
    label: labels.view,
    submenu: [
      createCommandMenuItem(
        labels.commandPalette,
        DesktopCommandId.PALETTE_OPEN,
        dispatch,
        'CommandOrControl+K',
      ),
      createCommandMenuItem(
        labels.toggleSidebar,
        DesktopCommandId.VIEW_SIDEBAR_TOGGLE,
        dispatch,
        'CommandOrControl+B',
      ),
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  }
}

function createGoMenu(
  labels: DesktopMenuLabels,
  platform: NodeJS.Platform,
  dispatch: DesktopCommandDispatcher,
): MenuItemConstructorOptions {
  const backAccelerator = platform === 'darwin' ? 'Command+[' : 'Alt+Left'
  const forwardAccelerator = platform === 'darwin' ? 'Command+]' : 'Alt+Right'

  return {
    label: labels.go,
    submenu: [
      createCommandMenuItem(
        labels.back,
        DesktopCommandId.NAVIGATION_BACK,
        dispatch,
        backAccelerator,
      ),
      createCommandMenuItem(
        labels.forward,
        DesktopCommandId.NAVIGATION_FORWARD,
        dispatch,
        forwardAccelerator,
      ),
      { type: 'separator' },
      createCommandMenuItem(
        labels.home,
        DesktopCommandId.NAVIGATION_HOME,
        dispatch,
      ),
      createCommandMenuItem(
        labels.search,
        DesktopCommandId.NAVIGATION_SEARCH,
        dispatch,
      ),
    ],
  }
}

function createWindowMenu(
  labels: DesktopMenuLabels,
  platform: NodeJS.Platform,
): MenuItemConstructorOptions {
  const submenu: MenuItemConstructorOptions[] = [
    { role: 'minimize' },
    { role: 'zoom' },
  ]
  if (platform === 'darwin') {
    submenu.push({ type: 'separator' }, { role: 'front' })
  } else {
    submenu.push({ role: 'close' })
  }
  return { label: labels.window, submenu }
}

function createMacApplicationMenu(
  appName: string,
  labels: DesktopMenuLabels,
  dispatch: DesktopCommandDispatcher,
): MenuItemConstructorOptions {
  return {
    label: appName,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      createCommandMenuItem(
        labels.settings,
        DesktopCommandId.NAVIGATION_SETTINGS,
        dispatch,
        'CommandOrControl+,',
      ),
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  }
}

export interface DesktopMenuTemplateOptions {
  readonly appName: string
  readonly locale: string
  readonly platform: NodeJS.Platform
  readonly dispatch: DesktopCommandDispatcher
}

export function createDesktopMenuTemplate({
  appName,
  locale,
  platform,
  dispatch,
}: DesktopMenuTemplateOptions): MenuItemConstructorOptions[] {
  const labels = resolveDesktopMenuLabels(locale)
  const template: MenuItemConstructorOptions[] = []
  if (platform === 'darwin') {
    template.push(createMacApplicationMenu(appName, labels, dispatch))
  }
  template.push(
    createFileMenu(labels, platform, dispatch),
    createEditMenu(labels),
    createViewMenu(labels, dispatch),
    createGoMenu(labels, platform, dispatch),
    createWindowMenu(labels, platform),
  )
  return template
}
