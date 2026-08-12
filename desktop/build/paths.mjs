import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const desktopBuildDirectory = path.dirname(
  fileURLToPath(import.meta.url),
)
export const desktopDirectory = path.resolve(desktopBuildDirectory, '..')
export const repositoryRoot = path.resolve(desktopDirectory, '..')

export const rendererBuildDirectory = path.join(repositoryRoot, 'dist')
export const electronBuildDirectory = path.join(
  desktopDirectory,
  '.out',
  'build',
)
export const mainBuildDirectory = path.join(electronBuildDirectory, 'main')
export const preloadBuildDirectory = path.join(
  electronBuildDirectory,
  'preload',
)

export const stageDirectory = path.join(desktopDirectory, '.out', 'stage')
export const stageAppDirectory = path.join(stageDirectory, 'app')
export const artifactDirectory = path.join(
  desktopDirectory,
  '.out',
  'artifacts',
)
