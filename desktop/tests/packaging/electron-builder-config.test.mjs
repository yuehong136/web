import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import {
  afterPack,
  beforeBuild,
  electronBuilderConfig,
  hardenedElectronFuses,
} from '../../build/electron-builder.config.mjs'
import {
  createDesktopPackagingOptions,
  createDirectoryPackagingOptions,
} from '../../build/package-electron.mjs'

test('electron-builder consumes only the staged application', () => {
  const packagingOptions = createDesktopPackagingOptions()

  assert.equal(
    packagingOptions.projectDir,
    electronBuilderConfig.directories.app,
  )
  assert.equal(packagingOptions.config, electronBuilderConfig)
  assert.equal(path.basename(electronBuilderConfig.directories.app), 'app')
  assert.match(
    electronBuilderConfig.directories.app,
    /desktop[/\\]\.out[/\\]stage[/\\]app$/,
  )
  assert.deepEqual(electronBuilderConfig.files, [
    'package.json',
    'build-manifest.json',
    'main/index.mjs',
    'preload/index.cjs',
    'renderer/**/*',
  ])
  assert.equal(electronBuilderConfig.extraResources, undefined)
  assert.equal(electronBuilderConfig.asarUnpack, undefined)
  assert.equal(electronBuilderConfig.npmRebuild, true)
  assert.equal(electronBuilderConfig.beforeBuild, beforeBuild)
  assert.equal(beforeBuild(), false)
  assert.equal(electronBuilderConfig.afterPack, afterPack)
})

test('programmatic packaging wrapper requests only the current-platform dir target', () => {
  const directoryOptions = createDirectoryPackagingOptions()
  assert.equal(directoryOptions.targets.size, 1)
  const [[platform, architectures]] = [...directoryOptions.targets]
  assert.equal(platform.nodeName, process.platform)
  assert.equal(architectures.size, 1)
  const [[, targets]] = [...architectures]
  assert.deepEqual(targets, ['dir'])

  if (process.platform === 'darwin') {
    assert.notEqual(directoryOptions.config, electronBuilderConfig)
    assert.equal(directoryOptions.config.mac.identity, '-')
    assert.equal(directoryOptions.config.mac.hardenedRuntime, false)
    assert.equal(electronBuilderConfig.mac.identity, undefined)
    assert.equal(electronBuilderConfig.mac.hardenedRuntime, true)
  } else {
    assert.equal(directoryOptions.config, electronBuilderConfig)
  }
})

test('Electron and ASAR security settings are explicit', () => {
  assert.equal(electronBuilderConfig.electronVersion, '43.4.0')
  assert.equal(electronBuilderConfig.asar, true)
  assert.equal(electronBuilderConfig.disableAsarIntegrity, false)
  assert.deepEqual(hardenedElectronFuses, {
    runAsNode: false,
    enableCookieEncryption: true,
    enableNodeOptionsEnvironmentVariable: false,
    enableNodeCliInspectArguments: false,
    enableEmbeddedAsarIntegrityValidation: true,
    onlyLoadAppFromAsar: true,
    loadBrowserProcessSpecificV8Snapshot: false,
    grantFileProtocolExtraPrivileges: false,
  })
})

test('release targets remain private-build outputs without auto-publish', () => {
  assert.equal(electronBuilderConfig.publish, null)
  assert.deepEqual(electronBuilderConfig.mac.target, [
    { target: 'dmg', arch: ['arm64', 'x64'] },
    { target: 'zip', arch: ['arm64', 'x64'] },
  ])
  assert.deepEqual(electronBuilderConfig.win.target, [
    { target: 'nsis', arch: ['x64'] },
  ])
})
