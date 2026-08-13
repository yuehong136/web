import { Menu, type BrowserWindow } from 'electron'
import { dispatchDesktopCommand } from '../commands/command-dispatch'
import { createDesktopMenuTemplate } from './menu-template'

export interface DesktopApplicationMenuOptions {
  readonly appName: string
  readonly locale: string
  readonly platform: NodeJS.Platform
  readonly getMainWindow: () => BrowserWindow | null
}

export function installDesktopApplicationMenu({
  appName,
  locale,
  platform,
  getMainWindow,
}: DesktopApplicationMenuOptions): void {
  const template = createDesktopMenuTemplate({
    appName,
    locale,
    platform,
    dispatch: (commandId) => {
      dispatchDesktopCommand(getMainWindow(), commandId)
    },
  })
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}
