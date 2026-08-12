import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'

export const DESKTOP_SMOKE_SWITCH = 'desktop-smoke-test'

interface SmokeCommandLine {
  hasSwitch(switchName: string): boolean
  appendSwitch(switchName: string): void
}

interface SmokeRuntimeApplication {
  readonly commandLine: SmokeCommandLine
  getPath(name: 'temp'): string
  setPath(name: 'userData', path: string): void
}

/**
 * Keeps packaged smoke tests independent from both the user's real profile and
 * the macOS login keychain. Production launches never enter this branch.
 */
export function configureDesktopSmokeRuntime(
  application: SmokeRuntimeApplication,
): boolean {
  const isSmokeTest = application.commandLine.hasSwitch(DESKTOP_SMOKE_SWITCH)
  if (!isSmokeTest) return false

  application.commandLine.appendSwitch('use-mock-keychain')
  application.setPath(
    'userData',
    mkdtempSync(join(application.getPath('temp'), 'multirag-desktop-smoke-')),
  )
  return true
}
