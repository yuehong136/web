import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { stageAppDirectory } from './paths.mjs'

const allowedStageRoots = new Set([
  'build-manifest.json',
  'main',
  'package.json',
  'preload',
  'renderer',
])

async function sha256File(filePath) {
  const contents = await fs.readFile(filePath)
  return crypto.createHash('sha256').update(contents).digest('hex')
}

function createContentHash(files) {
  const digest = crypto.createHash('sha256')
  for (const file of files) {
    digest.update(`${file.path}\0${file.sha256}\0${file.size}\n`)
  }
  return digest.digest('hex')
}

async function collectRegularFiles(directoryPath, relativeDirectory = '') {
  const files = []
  const entries = await fs.readdir(directoryPath, { withFileTypes: true })
  entries.sort((left, right) => left.name.localeCompare(right.name, 'en'))
  for (const entry of entries) {
    const absolutePath = path.join(directoryPath, entry.name)
    const relativePath = path.join(relativeDirectory, entry.name)
    if (entry.isSymbolicLink()) {
      throw new Error(
        `staged application contains a symbolic link: ${relativePath}`,
      )
    }
    if (entry.isDirectory()) {
      files.push(...(await collectRegularFiles(absolutePath, relativePath)))
    } else if (!entry.isFile()) {
      throw new Error(
        `staged application contains a non-regular entry: ${relativePath}`,
      )
    } else {
      files.push(relativePath.split(path.sep).join('/'))
    }
  }
  return files
}

export async function verifyStagedApplication(
  applicationDirectory = stageAppDirectory,
) {
  const rootEntries = await fs.readdir(applicationDirectory, {
    withFileTypes: true,
  })
  for (const entry of rootEntries) {
    if (!allowedStageRoots.has(entry.name)) {
      throw new Error(
        `staged application contains an unexpected root: ${entry.name}`,
      )
    }
  }
  const actualFiles = await collectRegularFiles(applicationDirectory)

  const manifestPath = path.join(applicationDirectory, 'build-manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  if (!Array.isArray(manifest.files)) {
    throw new Error('staging manifest files must be an array')
  }

  const sortedPaths = manifest.files
    .map(({ path: filePath }) => filePath)
    .sort((left, right) => left.localeCompare(right, 'en'))
  if (
    JSON.stringify(sortedPaths) !==
    JSON.stringify(manifest.files.map(({ path: filePath }) => filePath))
  ) {
    throw new Error('staging manifest files are not sorted')
  }

  const expectedFiles = actualFiles.filter(
    (filePath) => filePath !== 'build-manifest.json',
  )
  if (JSON.stringify(sortedPaths) !== JSON.stringify(expectedFiles)) {
    throw new Error(
      'staging manifest does not describe the exact staged file set',
    )
  }

  for (const file of manifest.files) {
    if (
      typeof file.path !== 'string' ||
      typeof file.sha256 !== 'string' ||
      typeof file.size !== 'number'
    ) {
      throw new Error('staging manifest contains an invalid file record')
    }
    const absolutePath = path.resolve(applicationDirectory, file.path)
    const relativePath = path.relative(applicationDirectory, absolutePath)
    if (
      relativePath.startsWith('..') ||
      path.isAbsolute(relativePath) ||
      relativePath === 'build-manifest.json'
    ) {
      throw new Error(`staging manifest contains an unsafe path: ${file.path}`)
    }
    const stats = await fs.lstat(absolutePath)
    if (!stats.isFile() || stats.isSymbolicLink()) {
      throw new Error(
        `staging manifest path is not a regular file: ${file.path}`,
      )
    }
    if (stats.size !== file.size) {
      throw new Error(`staging manifest size mismatch: ${file.path}`)
    }
    if ((await sha256File(absolutePath)) !== file.sha256) {
      throw new Error(`staging manifest hash mismatch: ${file.path}`)
    }
  }

  if (manifest.contentSha256 !== createContentHash(manifest.files)) {
    throw new Error('staging manifest content hash mismatch')
  }

  const requiredManifestPaths = [
    'main/index.mjs',
    'package.json',
    'preload/index.cjs',
    'renderer/index.html',
  ]
  for (const requiredPath of requiredManifestPaths) {
    if (!sortedPaths.includes(requiredPath)) {
      throw new Error(
        `staging manifest is missing required file: ${requiredPath}`,
      )
    }
  }

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
  const manifest = await verifyStagedApplication()
  process.stdout.write(
    `verified ${manifest.files.length} staged files (${manifest.contentSha256})\n`,
  )
}
