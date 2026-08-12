import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import { buildElectronBundles } from '../../build/build-electron.mjs'
import {
  createElectronBuildConfigs,
  isElectronRuntimeExternal,
} from '../../build/rolldown.config.mjs'

test('main and preload use isolated single-file Rolldown outputs', () => {
  const [main, preload] = createElectronBuildConfigs()

  assert.equal(main.input.platform, 'node')
  assert.equal(main.output.format, 'esm')
  assert.equal(main.output.entryFileNames, 'index.mjs')
  assert.equal(main.output.codeSplitting, false)
  assert.equal(main.output.cleanDir, true)

  assert.equal(preload.input.platform, 'node')
  assert.equal(preload.output.format, 'cjs')
  assert.equal(preload.output.entryFileNames, 'index.cjs')
  assert.equal(preload.output.codeSplitting, false)
  assert.equal(preload.output.cleanDir, true)
})

test('only Electron and Node runtime modules are externalized', () => {
  assert.equal(isElectronRuntimeExternal('electron'), true)
  assert.equal(isElectronRuntimeExternal('electron/main'), true)
  assert.equal(isElectronRuntimeExternal('node:path'), true)
  assert.equal(isElectronRuntimeExternal('fs'), true)
  assert.equal(isElectronRuntimeExternal('react'), false)
  assert.equal(isElectronRuntimeExternal('@scope/runtime'), false)
})

test('Rolldown emits one JavaScript bundle per runtime', async (context) => {
  const temporaryDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), 'multirag-rolldown-test-'),
  )
  context.after(() =>
    fs.rm(temporaryDirectory, { recursive: true, force: true }),
  )

  const mainInput = path.join(temporaryDirectory, 'main.ts')
  const preloadInput = path.join(temporaryDirectory, 'preload.ts')
  await fs.writeFile(
    mainInput,
    "import path from 'node:path'; export const mainValue = path.basename('/safe/main');\n",
  )
  await fs.writeFile(
    preloadInput,
    "import { contextBridge } from 'electron'; contextBridge.exposeInMainWorld('fixture', Object.freeze({ version: 1 }));\n",
  )

  const configs = createElectronBuildConfigs({
    mainInput,
    preloadInput,
    mainOutputDirectory: path.join(temporaryDirectory, 'out', 'main'),
    preloadOutputDirectory: path.join(temporaryDirectory, 'out', 'preload'),
  })
  const results = await buildElectronBundles(configs)

  assert.deepEqual(
    results.map(({ name, files }) => ({ name, files })),
    [
      { name: 'main', files: ['index.mjs', 'index.mjs.map'] },
      { name: 'preload', files: ['index.cjs', 'index.cjs.map'] },
    ],
  )
})
