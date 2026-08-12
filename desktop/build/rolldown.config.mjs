import { builtinModules } from 'node:module'
import path from 'node:path'

import {
  desktopDirectory,
  mainBuildDirectory,
  preloadBuildDirectory,
} from './paths.mjs'

const nodeRuntimeModules = new Set(
  builtinModules.flatMap((moduleName) => [moduleName, `node:${moduleName}`]),
)

export function isElectronRuntimeExternal(moduleId) {
  return (
    moduleId === 'electron' ||
    moduleId.startsWith('electron/') ||
    moduleId.startsWith('node:') ||
    nodeRuntimeModules.has(moduleId)
  )
}

export function createElectronBuildConfigs({
  mainInput = path.join(desktopDirectory, 'electron', 'main', 'index.ts'),
  preloadInput = path.join(desktopDirectory, 'electron', 'preload', 'index.ts'),
  mainOutputDirectory = mainBuildDirectory,
  preloadOutputDirectory = preloadBuildDirectory,
} = {}) {
  return [
    {
      name: 'main',
      input: {
        input: mainInput,
        platform: 'node',
        external: isElectronRuntimeExternal,
        treeshake: true,
      },
      output: {
        dir: mainOutputDirectory,
        format: 'esm',
        entryFileNames: 'index.mjs',
        chunkFileNames: '[name]-[hash].mjs',
        codeSplitting: false,
        cleanDir: true,
        sourcemap: true,
      },
      expectedEntry: 'index.mjs',
    },
    {
      name: 'preload',
      input: {
        input: preloadInput,
        platform: 'node',
        external: isElectronRuntimeExternal,
        treeshake: true,
      },
      output: {
        dir: preloadOutputDirectory,
        format: 'cjs',
        entryFileNames: 'index.cjs',
        chunkFileNames: '[name]-[hash].cjs',
        codeSplitting: false,
        cleanDir: true,
        sourcemap: true,
      },
      expectedEntry: 'index.cjs',
    },
  ]
}

export const electronBuildConfigs = createElectronBuildConfigs()

export default electronBuildConfigs.map(({ input, output }) => ({
  ...input,
  output,
}))
