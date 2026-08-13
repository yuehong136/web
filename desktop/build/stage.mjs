import crypto from 'node:crypto'
import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

import {
  DESKTOP_APP_NAME,
  DESKTOP_PRODUCT_NAME,
  ELECTRON_VERSION,
  RENDERER_BRIDGE_VERSION,
  RUN_CLIENT_PROTOCOL_VERSION,
  STAGE_MANIFEST_VERSION,
} from './constants.mjs'
import { validateDesktopContracts } from './contracts.mjs'
import {
  createDesktopNetworkPolicyFromReceipt,
  loadRendererNetworkPolicyReceipt,
  resolveDesktopNetworkPolicy,
} from './network-policy.mjs'
import {
  mainBuildDirectory,
  preloadBuildDirectory,
  rendererBuildDirectory,
  rendererNetworkPolicyReceiptPath,
  repositoryRoot,
  stageAppDirectory,
  stageDirectory,
} from './paths.mjs'
import {
  REQUIRED_RENDERER_ROOT_FILES,
  shouldOmitGeneratedRendererFile,
  toPosixPath,
  validateRendererFile,
  validateRendererRootEntry,
} from './staging-policy.mjs'

const execFileAsync = promisify(execFile)

async function assertDirectory(directoryPath, label) {
  let stats
  try {
    stats = await fs.lstat(directoryPath)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`${label} does not exist: ${directoryPath}`)
    }
    throw error
  }

  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error(`${label} must be a real directory: ${directoryPath}`)
  }
}

async function assertRegularFile(filePath, label) {
  let stats
  try {
    stats = await fs.lstat(filePath)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`${label} does not exist: ${filePath}`)
    }
    throw error
  }

  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(`${label} must be a regular file: ${filePath}`)
  }
}

async function prepareSafeStageTarget(targetPath, guardRoot) {
  const resolvedTarget = path.resolve(targetPath)
  const resolvedGuard = path.resolve(guardRoot)
  const relativeTarget = path.relative(resolvedGuard, resolvedTarget)

  if (
    relativeTarget !== 'app' ||
    path.dirname(resolvedTarget) !== resolvedGuard
  ) {
    throw new Error(`refusing unsafe staging target: ${resolvedTarget}`)
  }

  const guardParent = path.dirname(resolvedGuard)
  await fs.mkdir(guardParent, { recursive: true })
  await assertDirectory(guardParent, 'staging guard parent')

  try {
    const guardStats = await fs.lstat(resolvedGuard)
    if (!guardStats.isDirectory() || guardStats.isSymbolicLink()) {
      throw new Error(
        `staging guard root must be a real directory: ${resolvedGuard}`,
      )
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
    await fs.mkdir(resolvedGuard)
    await assertDirectory(resolvedGuard, 'staging guard root')
  }

  const [canonicalParent, canonicalGuard] = await Promise.all([
    fs.realpath(guardParent),
    fs.realpath(resolvedGuard),
  ])
  if (
    path.dirname(canonicalGuard) !== canonicalParent ||
    path.basename(canonicalGuard) !== path.basename(resolvedGuard)
  ) {
    throw new Error(`staging guard escapes its parent: ${resolvedGuard}`)
  }

  try {
    const targetStats = await fs.lstat(resolvedTarget)
    if (!targetStats.isDirectory() || targetStats.isSymbolicLink()) {
      throw new Error(
        `staging target must be a real directory: ${resolvedTarget}`,
      )
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

async function copyRegularFile(sourcePath, destinationPath, label) {
  await assertRegularFile(sourcePath, label)
  await fs.mkdir(path.dirname(destinationPath), { recursive: true })
  await fs.copyFile(sourcePath, destinationPath)
}

async function assertRuntimeBundleDirectory(
  directoryPath,
  expectedEntry,
  allowedSourceMap,
  label,
) {
  await assertDirectory(directoryPath, `${label} build directory`)
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  const allowedEntries = new Set([expectedEntry, allowedSourceMap])

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`${label} build contains a symbolic link: ${entry.name}`)
    }
    if (!entry.isFile() || !allowedEntries.has(entry.name)) {
      throw new Error(
        `${label} build contains an unexpected entry: ${entry.name}`,
      )
    }
  }

  if (!entries.some((entry) => entry.name === expectedEntry)) {
    throw new Error(
      `${label} build is missing required entry: ${expectedEntry}`,
    )
  }
}

async function collectRendererFiles(rendererDirectory) {
  await assertDirectory(rendererDirectory, 'renderer build directory')

  const rootEntries = await fs.readdir(rendererDirectory, {
    withFileTypes: true,
  })
  rootEntries.sort((left, right) => left.name.localeCompare(right.name, 'en'))

  const rootFiles = new Set()
  const collectedFiles = []

  async function visitDirectory(absoluteDirectory, relativeDirectory) {
    const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))

    for (const entry of entries) {
      const absolutePath = path.join(absoluteDirectory, entry.name)
      const relativePath = path.join(relativeDirectory, entry.name)

      if (entry.isSymbolicLink()) {
        throw new Error(
          `renderer contains a symbolic link: ${toPosixPath(relativePath)}`,
        )
      }
      if (entry.isDirectory()) {
        await visitDirectory(absolutePath, relativePath)
        continue
      }
      if (!entry.isFile()) {
        throw new Error(
          `renderer contains a non-regular entry: ${toPosixPath(relativePath)}`,
        )
      }

      if (shouldOmitGeneratedRendererFile(relativePath)) {
        continue
      }
      validateRendererFile(relativePath)
      collectedFiles.push(relativePath)
    }
  }

  for (const entry of rootEntries) {
    if (entry.isSymbolicLink()) {
      throw new Error(`renderer contains a symbolic link: ${entry.name}`)
    }

    validateRendererRootEntry(entry.name, entry.isDirectory())
    if (entry.isDirectory()) {
      await visitDirectory(path.join(rendererDirectory, entry.name), entry.name)
    } else if (entry.isFile()) {
      rootFiles.add(entry.name)
      collectedFiles.push(entry.name)
    } else {
      throw new Error(`renderer contains a non-regular entry: ${entry.name}`)
    }
  }

  for (const requiredFile of REQUIRED_RENDERER_ROOT_FILES) {
    if (!rootFiles.has(requiredFile)) {
      throw new Error(`renderer is missing required root file: ${requiredFile}`)
    }
  }

  return collectedFiles.sort((left, right) =>
    toPosixPath(left).localeCompare(toPosixPath(right), 'en'),
  )
}

async function resolveSourceRevision(rootDirectory, explicitRevision) {
  if (explicitRevision !== undefined) {
    return explicitRevision
  }

  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], {
      cwd: rootDirectory,
      encoding: 'utf8',
      windowsHide: true,
    })
    const revision = stdout.trim()
    return /^[a-f0-9]{40}$/i.test(revision) ? revision.toLowerCase() : null
  } catch {
    return null
  }
}

async function sha256File(filePath) {
  const contents = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(contents).digest('hex')
}

async function createFileManifest(appDirectory) {
  const files = []

  async function visit(absoluteDirectory, relativeDirectory = '') {
    const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true })
    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))

    for (const entry of entries) {
      const absolutePath = path.join(absoluteDirectory, entry.name)
      const relativePath = path.join(relativeDirectory, entry.name)

      if (entry.name === 'build-manifest.json' && !relativeDirectory) {
        continue
      }
      if (entry.isSymbolicLink()) {
        throw new Error(
          `staging output contains a symbolic link: ${toPosixPath(relativePath)}`,
        )
      }
      if (entry.isDirectory()) {
        await visit(absolutePath, relativePath)
        continue
      }
      if (!entry.isFile()) {
        throw new Error(
          `staging output contains a non-regular entry: ${toPosixPath(relativePath)}`,
        )
      }

      const stats = await fs.stat(absolutePath)
      files.push({
        path: toPosixPath(relativePath),
        sha256: await sha256File(absolutePath),
        size: stats.size,
      })
    }
  }

  await visit(appDirectory)
  files.sort((left, right) => left.path.localeCompare(right.path, 'en'))
  return files
}

function createContentHash(files) {
  const digest = crypto.createHash('sha256')
  for (const file of files) {
    digest.update(`${file.path}\0${file.sha256}\0${file.size}\n`)
  }
  return digest.digest('hex')
}

async function readApplicationVersion(packageJsonPath) {
  await assertRegularFile(packageJsonPath, 'root package.json')
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'))
  if (typeof packageJson.version !== 'string' || !packageJson.version) {
    throw new Error('root package.json must contain a non-empty version')
  }
  return packageJson.version
}

export async function stageDesktopApp({
  rootDirectory = repositoryRoot,
  rendererDirectory = rendererBuildDirectory,
  mainDirectory = mainBuildDirectory,
  preloadDirectory = preloadBuildDirectory,
  outputDirectory = stageAppDirectory,
  outputGuardDirectory = stageDirectory,
  platform = process.platform,
  architecture = process.arch,
  sourceRevision = process.env.SOURCE_REVISION,
  rendererBridgeVersion = RENDERER_BRIDGE_VERSION,
  runClientProtocolVersion = RUN_CLIENT_PROTOCOL_VERSION,
  viteMode = 'production',
  networkPolicyReceiptPath = rendererNetworkPolicyReceiptPath,
} = {}) {
  await prepareSafeStageTarget(outputDirectory, outputGuardDirectory)

  const rendererReceipt = await loadRendererNetworkPolicyReceipt(
    networkPolicyReceiptPath,
  )
  if (rendererReceipt.viteMode !== viteMode) {
    throw new Error(
      `Renderer was built in Vite mode ${rendererReceipt.viteMode}, expected ${viteMode}`,
    )
  }
  const rendererNetworkPolicy =
    createDesktopNetworkPolicyFromReceipt(rendererReceipt)
  const resolvedNetworkPolicy = resolveDesktopNetworkPolicy({
    rootDirectory,
    mode: viteMode,
  })
  if (
    JSON.stringify(rendererNetworkPolicy) !==
    JSON.stringify(resolvedNetworkPolicy)
  ) {
    throw new Error(
      'Renderer network configuration does not match the current staging environment',
    )
  }

  const mainInput = path.join(mainDirectory, 'index.mjs')
  const preloadInput = path.join(preloadDirectory, 'index.cjs')
  const rendererFiles = await collectRendererFiles(rendererDirectory)
  await assertRuntimeBundleDirectory(
    mainDirectory,
    'index.mjs',
    'index.mjs.map',
    'main',
  )
  await assertRuntimeBundleDirectory(
    preloadDirectory,
    'index.cjs',
    'index.cjs.map',
    'preload',
  )
  await assertRegularFile(mainInput, 'main bundle')
  await assertRegularFile(preloadInput, 'preload bundle')

  const version = await readApplicationVersion(
    path.join(rootDirectory, 'package.json'),
  )
  const resolvedSourceRevision = await resolveSourceRevision(
    rootDirectory,
    sourceRevision,
  )

  await fs.rm(outputDirectory, { recursive: true, force: true })
  await fs.mkdir(outputDirectory, { recursive: true })

  const stagedPackageJson = {
    name: DESKTOP_APP_NAME,
    productName: DESKTOP_PRODUCT_NAME,
    version,
    private: true,
    type: 'module',
    main: 'main/index.mjs',
  }
  await fs.writeFile(
    path.join(outputDirectory, 'package.json'),
    `${JSON.stringify(stagedPackageJson, null, 2)}\n`,
    'utf8',
  )

  await copyRegularFile(
    mainInput,
    path.join(outputDirectory, 'main', 'index.mjs'),
    'main bundle',
  )
  await copyRegularFile(
    preloadInput,
    path.join(outputDirectory, 'preload', 'index.cjs'),
    'preload bundle',
  )

  for (const relativePath of rendererFiles) {
    await copyRegularFile(
      path.join(rendererDirectory, relativePath),
      path.join(outputDirectory, 'renderer', relativePath),
      `renderer file ${toPosixPath(relativePath)}`,
    )
  }

  const files = await createFileManifest(outputDirectory)
  const contracts = {
    rendererBridgeVersion,
    runClientProtocolVersion,
  }
  validateDesktopContracts(contracts)

  const manifest = {
    schemaVersion: STAGE_MANIFEST_VERSION,
    app: {
      name: DESKTOP_APP_NAME,
      version,
      main: 'main/index.mjs',
    },
    target: {
      platform,
      architecture,
      electronVersion: ELECTRON_VERSION,
    },
    sourceRevision: resolvedSourceRevision,
    contracts,
    security: resolvedNetworkPolicy,
    contentSha256: createContentHash(files),
    files,
  }

  await fs.writeFile(
    path.join(outputDirectory, 'build-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8',
  )

  return manifest
}

function isDirectExecution() {
  const executable = process.argv[1]
  return (
    executable &&
    import.meta.url === pathToFileURL(path.resolve(executable)).href
  )
}

if (isDirectExecution()) {
  const manifest = await stageDesktopApp()
  process.stdout.write(
    `staged ${manifest.files.length} files (${manifest.contentSha256}) -> ${stageAppDirectory}\n`,
  )
}
