import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { Arch, Platform, build } from 'electron-builder'

import { electronBuilderConfig } from './electron-builder.config.mjs'
import { artifactDirectory, stageAppDirectory } from './paths.mjs'
import {
  resolveExpectedPackagedApplicationDirectory,
  verifyPackagedApplication,
} from './verify-package.mjs'

export function createDesktopPackagingOptions(overrides = {}) {
  return {
    projectDir: stageAppDirectory,
    config: electronBuilderConfig,
    ...overrides,
  }
}

function currentArchitecture() {
  const architecture = Arch[process.arch]
  if (typeof architecture !== 'number') {
    throw new Error(`unsupported packaging architecture: ${process.arch}`)
  }
  return architecture
}

export function createDirectoryPackagingOptions(overrides = {}) {
  const platform = Platform.current()
  const directoryConfig =
    platform === Platform.MAC
      ? {
          ...electronBuilderConfig,
          mac: {
            ...electronBuilderConfig.mac,
            // Flipping fuses invalidates the signature shipped in Electron's
            // upstream zip. Local unpacked smoke builds therefore need a new
            // ad-hoc signature after fuses are written. Release builds keep
            // automatic Developer ID discovery and hardened runtime enabled.
            identity: '-',
            hardenedRuntime: false,
          },
        }
      : electronBuilderConfig
  return createDesktopPackagingOptions({
    config: directoryConfig,
    targets: platform.createTarget('dir', currentArchitecture()),
    ...overrides,
  })
}

async function assertStagedApplication(projectDirectory) {
  const requiredPaths = [
    'package.json',
    'build-manifest.json',
    'main/index.mjs',
    'preload/index.cjs',
    'renderer/index.html',
  ]

  for (const relativePath of requiredPaths) {
    const absolutePath = path.join(projectDirectory, relativePath)
    let stats
    try {
      stats = await fs.lstat(absolutePath)
    } catch (error) {
      if (error?.code === 'ENOENT') {
        throw new Error(`staged application is incomplete: ${relativePath}`)
      }
      throw error
    }
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new Error(
        `staged application entry must be a regular file: ${relativePath}`,
      )
    }
  }
}

export async function packageDesktopApp(overrides = {}) {
  const options = createDesktopPackagingOptions(overrides)
  await assertStagedApplication(options.projectDir)
  return build(options)
}

export async function packageAndVerifyDesktopDirectory(overrides = {}) {
  const options = createDirectoryPackagingOptions(overrides)
  await assertStagedApplication(options.projectDir)
  const artifacts = await build(options)
  const appOutDirectory = resolveExpectedPackagedApplicationDirectory(
    artifactDirectory,
    Platform.current().nodeName,
    process.arch,
  )
  const verification = await verifyPackagedApplication({
    appOutDirectory,
    platform: Platform.current().nodeName,
  })
  return { artifacts, verification }
}

function isDirectExecution() {
  const executable = process.argv[1]
  return (
    executable &&
    import.meta.url === pathToFileURL(path.resolve(executable)).href
  )
}

if (isDirectExecution()) {
  const { artifacts, verification } = await packageAndVerifyDesktopDirectory()
  for (const artifact of artifacts) {
    process.stdout.write(`${artifact}\n`)
  }
  process.stdout.write(
    `verified ${verification.archiveFileCount} app.asar entries and hardened Electron fuses\n`,
  )
}
