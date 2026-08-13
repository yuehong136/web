import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { stageDesktopApp } from '../../build/stage.mjs'
import { verifyStagedApplication } from '../../build/verify-stage.mjs'
import {
  createDesktopNetworkPolicy,
  createRendererNetworkPolicyReceipt,
} from '../../build/network-policy.mjs'

const fixtureNetworkPolicy = createDesktopNetworkPolicy({})

async function createFixture(context) {
  const rootDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'multirag-stage-test-'),
  )
  context.after(() => fs.rm(rootDirectory, { recursive: true, force: true }))

  const rendererDirectory = path.join(rootDirectory, 'dist')
  const mainDirectory = path.join(rootDirectory, '.out', 'build', 'main')
  const preloadDirectory = path.join(rootDirectory, '.out', 'build', 'preload')
  const outputGuardDirectory = path.join(rootDirectory, '.out', 'stage')
  const outputDirectory = path.join(outputGuardDirectory, 'app')
  const networkPolicyReceiptPath = path.join(
    rootDirectory,
    '.out',
    'build',
    'renderer',
    'network-policy.json',
  )

  await fs.mkdir(path.join(rendererDirectory, 'assets'), { recursive: true })
  await fs.mkdir(path.join(rendererDirectory, 'js'), { recursive: true })
  await fs.mkdir(path.join(rendererDirectory, 'vs'), { recursive: true })
  await fs.mkdir(path.join(rendererDirectory, 'pdfjs-dist', 'cmaps'), {
    recursive: true,
  })
  await fs.mkdir(mainDirectory, { recursive: true })
  await fs.mkdir(preloadDirectory, { recursive: true })
  await fs.mkdir(path.dirname(networkPolicyReceiptPath), { recursive: true })

  await Promise.all([
    fs.writeFile(
      path.join(rootDirectory, 'package.json'),
      '{"name":"web","version":"0.9.8"}\n',
    ),
    fs.writeFile(
      path.join(rendererDirectory, 'index.html'),
      '<main>fixture</main>\n',
    ),
    fs.writeFile(path.join(rendererDirectory, 'iconfont.js'), 'void 0\n'),
    fs.writeFile(path.join(rendererDirectory, 'openapi.json'), '{}\n'),
    fs.writeFile(path.join(rendererDirectory, 'theme-init.js'), 'void 0\n'),
    fs.writeFile(
      path.join(rendererDirectory, 'assets', 'app.css'),
      ':root {}\n',
    ),
    fs.writeFile(path.join(rendererDirectory, 'js', 'app.js'), 'void 0\n'),
    fs.writeFile(path.join(rendererDirectory, 'js', 'app.js.map'), '{}\n'),
    fs.writeFile(path.join(rendererDirectory, 'vs', 'loader.js'), 'void 0\n'),
    fs.writeFile(
      path.join(rendererDirectory, 'pdfjs-dist', 'cmaps', 'LICENSE'),
      'fixture license\n',
    ),
    fs.writeFile(
      path.join(rendererDirectory, 'pdfjs-dist', 'cmaps', 'Roman.bcmap'),
      'fixture cmap\n',
    ),
    fs.writeFile(path.join(mainDirectory, 'index.mjs'), 'export {}\n'),
    fs.writeFile(path.join(preloadDirectory, 'index.cjs'), "'use strict'\n"),
    fs.writeFile(
      networkPolicyReceiptPath,
      `${JSON.stringify(createRendererNetworkPolicyReceipt({}), null, 2)}\n`,
    ),
  ])

  return {
    rootDirectory,
    rendererDirectory,
    mainDirectory,
    preloadDirectory,
    outputGuardDirectory,
    outputDirectory,
    networkPolicyReceiptPath,
  }
}

test('staging is deterministic, minimal, and has a sorted SHA-256 manifest', async (context) => {
  const fixture = await createFixture(context)
  const options = {
    ...fixture,
    platform: 'darwin',
    architecture: 'arm64',
    sourceRevision: 'fixture-revision',
  }

  const firstManifest = await stageDesktopApp(options)
  const firstManifestBytes = await fs.readFile(
    path.join(fixture.outputDirectory, 'build-manifest.json'),
    'utf8',
  )
  const secondManifest = await stageDesktopApp(options)
  const secondManifestBytes = await fs.readFile(
    path.join(fixture.outputDirectory, 'build-manifest.json'),
    'utf8',
  )

  assert.deepEqual(firstManifest, secondManifest)
  assert.equal(firstManifestBytes, secondManifestBytes)
  assert.deepEqual(
    firstManifest.files.map(({ path: filePath }) => filePath),
    [...firstManifest.files.map(({ path: filePath }) => filePath)].sort(),
  )
  assert.match(firstManifest.contentSha256, /^[a-f0-9]{64}$/)
  assert.equal(firstManifest.schemaVersion, 2)
  assert.deepEqual(firstManifest.contracts, {
    rendererBridgeVersion: 2,
    runClientProtocolVersion: null,
  })
  assert.deepEqual(firstManifest.security, fixtureNetworkPolicy)
  for (const file of firstManifest.files) {
    assert.match(file.sha256, /^[a-f0-9]{64}$/)
  }

  const packageJson = JSON.parse(
    await fs.readFile(
      path.join(fixture.outputDirectory, 'package.json'),
      'utf8',
    ),
  )
  assert.deepEqual(packageJson, {
    name: 'multirag-desktop',
    productName: 'MultiRAG',
    version: '0.9.8',
    private: true,
    type: 'module',
    main: 'main/index.mjs',
  })

  const stagedPaths = firstManifest.files.map(({ path: filePath }) => filePath)
  assert.deepEqual(stagedPaths, [
    'main/index.mjs',
    'package.json',
    'preload/index.cjs',
    'renderer/assets/app.css',
    'renderer/iconfont.js',
    'renderer/index.html',
    'renderer/js/app.js',
    'renderer/openapi.json',
    'renderer/pdfjs-dist/cmaps/LICENSE',
    'renderer/pdfjs-dist/cmaps/Roman.bcmap',
    'renderer/theme-init.js',
    'renderer/vs/loader.js',
  ])

  const mainHash = crypto
    .createHash('sha256')
    .update('export {}\n')
    .digest('hex')
  assert.equal(
    firstManifest.files.find(
      ({ path: filePath }) => filePath === 'main/index.mjs',
    )?.sha256,
    mainHash,
  )

  const verifiedManifest = await verifyStagedApplication(
    fixture.outputDirectory,
  )
  assert.deepEqual(verifiedManifest, firstManifest)
})

test('stage verifier detects manifest tampering', async (context) => {
  const fixture = await createFixture(context)
  await stageDesktopApp({ ...fixture, sourceRevision: null })
  await fs.writeFile(
    path.join(fixture.outputDirectory, 'main', 'index.mjs'),
    'export const tampered = true\n',
  )

  await assert.rejects(
    verifyStagedApplication(fixture.outputDirectory),
    /manifest (?:size|hash) mismatch/,
  )
})

test('staging and verification reject renderer bridge contract drift', async (context) => {
  const fixture = await createFixture(context)
  await assert.rejects(
    stageDesktopApp({
      ...fixture,
      sourceRevision: null,
      rendererBridgeVersion: 1,
    }),
    /renderer bridge version must be 2/,
  )

  await stageDesktopApp({ ...fixture, sourceRevision: null })
  const manifestPath = path.join(fixture.outputDirectory, 'build-manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  manifest.contracts.rendererBridgeVersion = 1
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  await assert.rejects(
    verifyStagedApplication(fixture.outputDirectory),
    /renderer bridge version must be 2/,
  )
})

test('stage verifier rejects a broadened network policy', async (context) => {
  const fixture = await createFixture(context)
  await stageDesktopApp({ ...fixture, sourceRevision: null })
  const manifestPath = path.join(fixture.outputDirectory, 'build-manifest.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  manifest.security.connectSources = ['http:']
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  await assert.rejects(
    verifyStagedApplication(fixture.outputDirectory),
    /connectSources must exactly match|absolute URL/,
  )
})

test('staging rejects Renderer and current environment network drift', async (context) => {
  const fixture = await createFixture(context)
  await fs.writeFile(
    fixture.networkPolicyReceiptPath,
    `${JSON.stringify(
      createRendererNetworkPolicyReceipt({
        VITE_API_BASE_URL: 'https://stale-renderer.example.com',
      }),
      null,
      2,
    )}\n`,
  )

  await assert.rejects(
    stageDesktopApp(fixture),
    /Renderer network configuration does not match/,
  )
})

test('staging rejects a missing Renderer network receipt', async (context) => {
  const fixture = await createFixture(context)
  await fs.rm(fixture.networkPolicyReceiptPath)

  await assert.rejects(
    stageDesktopApp(fixture),
    /Renderer network policy receipt cannot be read/,
  )
})

test('stage verifier rejects files added after manifest creation', async (context) => {
  const fixture = await createFixture(context)
  await stageDesktopApp(fixture)
  await fs.writeFile(
    path.join(fixture.outputDirectory, 'renderer', 'assets', 'injected.js'),
    'export const injected = true\n',
  )

  await assert.rejects(
    verifyStagedApplication(fixture.outputDirectory),
    /does not describe the exact staged file set/,
  )
})

test('staging rejects unknown top-level renderer content', async (context) => {
  const fixture = await createFixture(context)
  await fs.writeFile(
    path.join(fixture.rendererDirectory, 'vite.svg'),
    '<svg />\n',
  )

  await assert.rejects(
    stageDesktopApp(fixture),
    /unknown top-level file: vite\.svg/,
  )
})

test('staging omits generated source maps', async (context) => {
  const fixture = await createFixture(context)
  const manifest = await stageDesktopApp({
    ...fixture,
    sourceRevision: null,
  })

  assert.equal(
    manifest.files.some(({ path: filePath }) => filePath.endsWith('.map')),
    false,
  )
  await assert.rejects(
    fs.stat(path.join(fixture.outputDirectory, 'renderer', 'js', 'app.js.map')),
    { code: 'ENOENT' },
  )
})

test('staging rejects source files, env files, and credential files', async (context) => {
  const cases = [
    ['assets/widget.ts', 'export {}\n', /source or source-map content/],
    ['assets/.env.production', 'TOKEN=secret\n', /forbidden development file/],
    ['assets/signing-key.pem', 'secret\n', /credential-like content/],
  ]

  for (const [relativePath, contents, expectedError] of cases) {
    await context.test(relativePath, async (nestedContext) => {
      const fixture = await createFixture(nestedContext)
      const filePath = path.join(fixture.rendererDirectory, relativePath)
      await fs.mkdir(path.dirname(filePath), { recursive: true })
      await fs.writeFile(filePath, contents)
      await assert.rejects(stageDesktopApp(fixture), expectedError)
    })
  }
})

test('staging rejects renderer symlinks', async (context) => {
  const fixture = await createFixture(context)
  const targetPath = path.join(fixture.rendererDirectory, 'assets', 'app.css')
  const linkPath = path.join(fixture.rendererDirectory, 'assets', 'linked.css')

  try {
    await fs.symlink(targetPath, linkPath)
  } catch (error) {
    if (error?.code === 'EPERM') {
      context.skip('symlink creation is not available in this environment')
      return
    }
    throw error
  }

  await assert.rejects(stageDesktopApp(fixture), /contains a symbolic link/)
})

test('staging rejects unexpected runtime bundle output', async (context) => {
  const fixture = await createFixture(context)
  await fs.writeFile(path.join(fixture.mainDirectory, 'secret.env'), 'secret\n')

  await assert.rejects(
    stageDesktopApp(fixture),
    /main build contains an unexpected entry: secret\.env/,
  )
})

test('staging refuses a target outside the guarded app directory', async (context) => {
  const fixture = await createFixture(context)

  await assert.rejects(
    stageDesktopApp({
      ...fixture,
      outputDirectory: path.join(fixture.rootDirectory, 'unsafe'),
    }),
    /refusing unsafe staging target/,
  )
})

test('staging refuses a symlinked guard directory', async (context) => {
  const fixture = await createFixture(context)
  const escapedGuard = path.join(fixture.rootDirectory, 'escaped-stage')
  await fs.mkdir(escapedGuard)
  await fs.symlink(escapedGuard, fixture.outputGuardDirectory)

  await assert.rejects(
    stageDesktopApp(fixture),
    /staging guard root must be a real directory/,
  )
})
