import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { createPackage } from '@electron/asar'

import {
  resolveExpectedPackagedApplicationDirectory,
  verifyPackagedApplication,
  verifyPackagedArchive,
} from '../../build/verify-package.mjs'

async function writeBuildManifest(sourceDirectory) {
  const relativePaths = [
    'main/index.mjs',
    'package.json',
    'preload/index.cjs',
    'renderer/index.html',
  ]
  const files = []
  for (const relativePath of relativePaths) {
    const contents = await fs.readFile(path.join(sourceDirectory, relativePath))
    files.push({
      path: relativePath,
      sha256: crypto.createHash('sha256').update(contents).digest('hex'),
      size: contents.byteLength,
    })
  }
  const digest = crypto.createHash('sha256')
  for (const file of files) {
    digest.update(`${file.path}\0${file.sha256}\0${file.size}\n`)
  }
  await fs.writeFile(
    path.join(sourceDirectory, 'build-manifest.json'),
    `${JSON.stringify({ contentSha256: digest.digest('hex'), files })}\n`,
  )
}

test('package locator selects only the current platform and architecture output', () => {
  assert.equal(
    resolveExpectedPackagedApplicationDirectory('/artifacts', 'win32', 'x64'),
    path.join('/artifacts', 'win-unpacked'),
  )
  assert.equal(
    resolveExpectedPackagedApplicationDirectory(
      '/artifacts',
      'darwin',
      'arm64',
    ),
    path.join('/artifacts', 'mac-arm64'),
  )
  assert.throws(
    () =>
      resolveExpectedPackagedApplicationDirectory(
        '/artifacts',
        'freebsd',
        'x64',
      ),
    /unsupported packaged application platform/,
  )
})

test('package verifier fails closed when a packaged binary has no Electron fuse wire', async (context) => {
  const rootDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'multirag-package-test-'),
  )
  context.after(() => fs.rm(rootDirectory, { recursive: true, force: true }))

  const sourceDirectory = path.join(rootDirectory, 'source')
  const appOutDirectory = path.join(rootDirectory, 'out')
  const appBundleDirectory = path.join(
    appOutDirectory,
    'MultiRAG.app',
    'Contents',
  )
  const resourcesDirectory = path.join(appBundleDirectory, 'Resources')
  const executablePath = path.join(appBundleDirectory, 'MacOS', 'MultiRAG')

  for (const relativePath of [
    'main/index.mjs',
    'preload/index.cjs',
    'renderer/index.html',
  ]) {
    const filePath = path.join(sourceDirectory, relativePath)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, 'fixture\n')
  }
  await fs.writeFile(path.join(sourceDirectory, 'package.json'), '{}\n')
  await writeBuildManifest(sourceDirectory)
  await fs.mkdir(path.dirname(executablePath), { recursive: true })
  await fs.mkdir(resourcesDirectory, { recursive: true })
  await fs.writeFile(executablePath, 'not-electron\n')
  await createPackage(
    sourceDirectory,
    path.join(resourcesDirectory, 'app.asar'),
  )

  await assert.rejects(
    verifyPackagedApplication({
      appOutDirectory,
      platform: 'darwin',
      productName: 'MultiRAG',
    }),
    /(?:Could not find sentinel|Electron Framework)/,
  )
})

test('package verifier rejects an unpacked ASAR fallback before fuse inspection', async (context) => {
  const rootDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'multirag-package-test-'),
  )
  context.after(() => fs.rm(rootDirectory, { recursive: true, force: true }))

  const contentsDirectory = path.join(rootDirectory, 'MultiRAG.app', 'Contents')
  const resourcesDirectory = path.join(contentsDirectory, 'Resources')
  const executablePath = path.join(contentsDirectory, 'MacOS', 'MultiRAG')
  await fs.mkdir(path.join(resourcesDirectory, 'app'), { recursive: true })
  await fs.mkdir(path.dirname(executablePath), { recursive: true })
  await fs.writeFile(executablePath, 'fixture\n')
  await fs.writeFile(path.join(resourcesDirectory, 'app.asar'), 'fixture\n')

  await assert.rejects(
    verifyPackagedArchive({
      appOutDirectory: rootDirectory,
      platform: 'darwin',
      productName: 'MultiRAG',
    }),
    /contains a forbidden fallback/,
  )
})
