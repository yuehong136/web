import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import test from 'node:test'
import {
  configureDesktopSmokeRuntime,
  DESKTOP_SMOKE_SWITCH,
} from '../../electron/main/smoke/smoke-runtime'

function createFakeApplication(smokeEnabled: boolean, temporaryRoot: string) {
  const appendedSwitches: string[] = []
  const paths: Array<readonly [string, string]> = []
  return {
    application: {
      commandLine: {
        hasSwitch: (switchName: string) =>
          smokeEnabled && switchName === DESKTOP_SMOKE_SWITCH,
        appendSwitch: (switchName: string) => appendedSwitches.push(switchName),
      },
      getPath: (name: 'temp') => {
        assert.equal(name, 'temp')
        return temporaryRoot
      },
      setPath: (name: 'userData', path: string) => paths.push([name, path]),
    },
    appendedSwitches,
    paths,
  }
}

test('production launches never opt into smoke-only profile behavior', () => {
  const fake = createFakeApplication(false, '/unused')

  assert.equal(configureDesktopSmokeRuntime(fake.application), false)
  assert.deepEqual(fake.appendedSwitches, [])
  assert.deepEqual(fake.paths, [])
})

test('packaged smoke uses an isolated profile and mock macOS keychain', () => {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'multirag-smoke-test-'))
  const fake = createFakeApplication(true, temporaryRoot)

  try {
    assert.equal(configureDesktopSmokeRuntime(fake.application), true)
    assert.deepEqual(fake.appendedSwitches, ['use-mock-keychain'])
    assert.equal(fake.paths.length, 1)
    assert.equal(fake.paths[0]?.[0], 'userData')
    const userDataPath = fake.paths[0]?.[1] ?? ''
    assert.equal(dirname(userDataPath), temporaryRoot)
    assert.match(basename(userDataPath), /^multirag-desktop-smoke-[^\\/]+$/)
  } finally {
    rmSync(temporaryRoot, { force: true, recursive: true })
  }
})
