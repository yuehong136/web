import { app, BrowserWindow, session } from 'electron'
import { join } from 'node:path'
import { installAppProtocol, registerAppScheme } from './app-protocol/install'
import { loadDesktopNetworkPolicy } from './security/network-policy'
import { installSessionSecurityPolicy } from './security/session-policy'
import { configureDesktopSmokeRuntime } from './smoke/smoke-runtime'
import { createMainWindow, MainWindowReadiness } from './windows/main-window'

const DESKTOP_SMOKE_SUCCESS = 'MULTIRAG_DESKTOP_SMOKE_OK\n'

const isSmokeTest = configureDesktopSmokeRuntime(app)
registerAppScheme()
app.enableSandbox()

async function openMainWindow(
  showWhenReady = true,
  readiness = MainWindowReadiness.LOAD,
): Promise<void> {
  await createMainWindow({ readiness, showWhenReady })
}

function writeSmokeSuccess(): Promise<void> {
  return new Promise((resolve, reject) => {
    process.stdout.write(DESKTOP_SMOKE_SUCCESS, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

async function bootstrap(): Promise<void> {
  await app.whenReady()

  installSessionSecurityPolicy(session.defaultSession)
  const appPath = app.getAppPath()
  const networkPolicy = await loadDesktopNetworkPolicy(
    join(appPath, 'build-manifest.json'),
  )
  await installAppProtocol(
    join(appPath, 'renderer'),
    networkPolicy.connectSources,
  )
  await openMainWindow(
    !isSmokeTest,
    isSmokeTest ? MainWindowReadiness.DOM_READY : MainWindowReadiness.LOAD,
  )

  if (isSmokeTest) {
    await writeSmokeSuccess()
    app.exit(0)
    return
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void openMainWindow().catch(() => app.exit(1))
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

void bootstrap().catch(() => app.exit(1))
