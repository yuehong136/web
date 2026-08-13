import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  FuseState,
  FuseV1Options,
  FuseVersion,
  getCurrentFuseWire,
} from '@electron/fuses'

import { extractFile, getRawHeader, listPackage } from '@electron/asar'

import { DESKTOP_PRODUCT_NAME, STAGE_MANIFEST_VERSION } from './constants.mjs'
import { validateDesktopNetworkPolicy } from './network-policy.mjs'
import { artifactDirectory } from './paths.mjs'

export const requiredPackagedPaths = Object.freeze([
  '/build-manifest.json',
  '/main/index.mjs',
  '/package.json',
  '/preload/index.cjs',
  '/renderer/index.html',
])

const forbiddenArchivePatterns = [
  /(?:^|\/)\.env(?:\.|$)/i,
  /\.map$/i,
  /\.(?:jsx|ts|tsx)$/i,
  /(?:^|\/)(?:__tests__|fixtures?|specs?|tests?)(?:\/|$)/i,
]

function resolvePackagedPaths({ appOutDirectory, platform, productName }) {
  if (platform === 'darwin' || platform === 'mas') {
    const contentsDirectory = path.join(
      appOutDirectory,
      `${productName}.app`,
      'Contents',
    )
    return {
      executablePath: path.join(contentsDirectory, 'MacOS', productName),
      resourcesDirectory: path.join(contentsDirectory, 'Resources'),
    }
  }
  if (platform === 'win32') {
    return {
      executablePath: path.join(appOutDirectory, `${productName}.exe`),
      resourcesDirectory: path.join(appOutDirectory, 'resources'),
    }
  }
  return {
    executablePath: path.join(appOutDirectory, productName),
    resourcesDirectory: path.join(appOutDirectory, 'resources'),
  }
}

async function assertRegularFile(filePath, label) {
  const stats = await fs.lstat(filePath)
  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(`${label} must be a regular file: ${filePath}`)
  }
}

function assertExpectedFuseState(fuses, fuseOption, expectedState) {
  const actualState = fuses[fuseOption]
  if (actualState !== expectedState) {
    throw new Error(
      `${FuseV1Options[fuseOption]} fuse must be ${FuseState[expectedState]}, got ${FuseState[actualState]}`,
    )
  }
}

function collectAsarFileRecords(archiveHeader) {
  const files = []

  function visit(directory, relativeDirectory = '') {
    for (const [entryName, entry] of Object.entries(directory.files ?? {})) {
      const entryPath = relativeDirectory
        ? `${relativeDirectory}/${entryName}`
        : entryName
      if ('files' in entry) {
        visit(entry, entryPath)
        continue
      }
      if ('link' in entry) {
        throw new Error(`app.asar contains a symbolic link: ${entryPath}`)
      }
      if (
        entry.integrity?.algorithm !== 'SHA256' ||
        !/^[a-f0-9]{64}$/i.test(entry.integrity.hash)
      ) {
        throw new Error(
          `app.asar file lacks SHA-256 integrity metadata: ${entryPath}`,
        )
      }
      files.push({
        path: entryPath,
        sha256: entry.integrity.hash.toLowerCase(),
        size: entry.size,
      })
    }
  }

  visit(archiveHeader.header)
  files.sort((left, right) => left.path.localeCompare(right.path, 'en'))
  return files
}

function parseBuildManifest(archivePath) {
  let manifest
  try {
    manifest = JSON.parse(
      extractFile(archivePath, 'build-manifest.json').toString('utf8'),
    )
  } catch (error) {
    throw new Error('app.asar contains an invalid build manifest', {
      cause: error,
    })
  }
  if (!Array.isArray(manifest.files)) {
    throw new Error('app.asar build manifest files must be an array')
  }
  if (manifest.schemaVersion !== STAGE_MANIFEST_VERSION) {
    throw new Error('app.asar build manifest has an unsupported schema version')
  }
  validateDesktopNetworkPolicy(manifest.security)
  return manifest
}

function assertManifestMatchesArchive(manifest, archiveFiles) {
  const manifestFiles = manifest.files.map((file) => ({
    path: file.path,
    sha256: file.sha256,
    size: file.size,
  }))
  const applicationFiles = archiveFiles.filter(
    (file) => file.path !== 'build-manifest.json',
  )

  if (JSON.stringify(manifestFiles) !== JSON.stringify(applicationFiles)) {
    throw new Error(
      'app.asar contents do not exactly match the staged build manifest',
    )
  }

  const digest = crypto.createHash('sha256')
  for (const file of manifestFiles) {
    digest.update(`${file.path}\0${file.sha256}\0${file.size}\n`)
  }
  if (manifest.contentSha256 !== digest.digest('hex')) {
    throw new Error('app.asar build manifest content hash mismatch')
  }
}

export async function verifyPackagedArchive({
  appOutDirectory,
  platform = process.platform,
  productName = DESKTOP_PRODUCT_NAME,
}) {
  const { executablePath, resourcesDirectory } = resolvePackagedPaths({
    appOutDirectory,
    platform,
    productName,
  })
  const archivePath = path.join(resourcesDirectory, 'app.asar')
  const fallbackAppDirectory = path.join(resourcesDirectory, 'app')
  const unpackedArchiveDirectory = path.join(
    resourcesDirectory,
    'app.asar.unpacked',
  )

  await assertRegularFile(executablePath, 'packaged Electron binary')
  await assertRegularFile(archivePath, 'packaged app.asar')

  for (const forbiddenPath of [
    fallbackAppDirectory,
    unpackedArchiveDirectory,
  ]) {
    try {
      await fs.lstat(forbiddenPath)
      throw new Error(
        `packaged application contains a forbidden fallback: ${forbiddenPath}`,
      )
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error
      }
    }
  }

  const archiveFiles = listPackage(archivePath, { isPack: false }).sort()
  for (const requiredPath of requiredPackagedPaths) {
    if (!archiveFiles.includes(requiredPath)) {
      throw new Error(`app.asar is missing required path: ${requiredPath}`)
    }
  }
  for (const archiveFile of archiveFiles) {
    if (forbiddenArchivePatterns.some((pattern) => pattern.test(archiveFile))) {
      throw new Error(`app.asar contains forbidden content: ${archiveFile}`)
    }
  }
  const asarFiles = collectAsarFileRecords(getRawHeader(archivePath))
  assertManifestMatchesArchive(parseBuildManifest(archivePath), asarFiles)

  return {
    executablePath,
    archivePath,
    archiveFileCount: archiveFiles.length,
  }
}

export async function verifyPackagedApplication(options) {
  const archiveResult = await verifyPackagedArchive(options)
  const fuses = await getCurrentFuseWire(archiveResult.executablePath)
  if (fuses.version !== FuseVersion.V1) {
    throw new Error(`unexpected Electron fuse version: ${fuses.version}`)
  }
  assertExpectedFuseState(fuses, FuseV1Options.RunAsNode, FuseState.DISABLE)
  assertExpectedFuseState(
    fuses,
    FuseV1Options.EnableCookieEncryption,
    FuseState.ENABLE,
  )
  assertExpectedFuseState(
    fuses,
    FuseV1Options.EnableNodeOptionsEnvironmentVariable,
    FuseState.DISABLE,
  )
  assertExpectedFuseState(
    fuses,
    FuseV1Options.EnableNodeCliInspectArguments,
    FuseState.DISABLE,
  )
  assertExpectedFuseState(
    fuses,
    FuseV1Options.EnableEmbeddedAsarIntegrityValidation,
    FuseState.ENABLE,
  )
  assertExpectedFuseState(
    fuses,
    FuseV1Options.OnlyLoadAppFromAsar,
    FuseState.ENABLE,
  )
  assertExpectedFuseState(
    fuses,
    FuseV1Options.LoadBrowserProcessSpecificV8Snapshot,
    FuseState.DISABLE,
  )
  assertExpectedFuseState(
    fuses,
    FuseV1Options.GrantFileProtocolExtraPrivileges,
    FuseState.DISABLE,
  )
  return archiveResult
}

export function resolveExpectedPackagedApplicationDirectory(
  rootDirectory,
  platform,
  architecture,
) {
  const architectureSuffix = architecture === 'x64' ? '' : `-${architecture}`
  if (platform === 'darwin' || platform === 'mas') {
    return path.join(rootDirectory, `mac${architectureSuffix}`)
  }
  if (platform === 'win32') {
    return path.join(rootDirectory, `win${architectureSuffix}-unpacked`)
  }
  if (platform === 'linux') {
    return path.join(rootDirectory, `linux${architectureSuffix}-unpacked`)
  }
  throw new Error(`unsupported packaged application platform: ${platform}`)
}

async function parseCliArguments(arguments_) {
  const options = {}
  for (let index = 0; index < arguments_.length; index += 2) {
    const argumentName = arguments_[index]
    const argumentValue = arguments_[index + 1]
    if (!argumentValue) {
      throw new Error(`missing value for ${argumentName}`)
    }
    if (argumentName === '--app-out') {
      options.appOutDirectory = path.resolve(argumentValue)
    } else if (argumentName === '--platform') {
      options.platform = argumentValue
    } else if (argumentName === '--product-name') {
      options.productName = argumentValue
    } else {
      throw new Error(`unknown argument: ${argumentName}`)
    }
  }
  if (!options.appOutDirectory) {
    options.appOutDirectory = resolveExpectedPackagedApplicationDirectory(
      artifactDirectory,
      options.platform ?? process.platform,
      process.arch,
    )
  }
  return options
}

function isDirectExecution() {
  const executable = process.argv[1]
  return (
    executable &&
    import.meta.url === pathToFileURL(path.resolve(executable)).href
  )
}

if (isDirectExecution()) {
  const result = await verifyPackagedApplication(
    await parseCliArguments(process.argv.slice(2)),
  )
  process.stdout.write(
    `verified ${result.archiveFileCount} app.asar entries and hardened Electron fuses: ${result.executablePath}\n`,
  )
}
