import type { Session } from 'electron'

export function installSessionSecurityPolicy(session: Session): void {
  session.setPermissionCheckHandler(() => false)
  session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false)
  })
  session.setDevicePermissionHandler(() => false)
  session.on('will-download', (event) => {
    event.preventDefault()
  })
}
