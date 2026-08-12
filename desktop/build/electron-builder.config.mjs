import {
  DESKTOP_APP_ID,
  DESKTOP_PRODUCT_NAME,
  ELECTRON_VERSION,
} from './constants.mjs'
import { artifactDirectory, stageAppDirectory } from './paths.mjs'
import { verifyPackagedArchive } from './verify-package.mjs'

export const hardenedElectronFuses = Object.freeze({
  runAsNode: false,
  enableCookieEncryption: true,
  enableNodeOptionsEnvironmentVariable: false,
  enableNodeCliInspectArguments: false,
  enableEmbeddedAsarIntegrityValidation: true,
  onlyLoadAppFromAsar: true,
  loadBrowserProcessSpecificV8Snapshot: false,
  grantFileProtocolExtraPrivileges: false,
})

export async function afterPack(context) {
  await verifyPackagedArchive({
    appOutDirectory: context.appOutDir,
    platform: context.electronPlatformName,
    productName: DESKTOP_PRODUCT_NAME,
  })
}

export function beforeBuild() {
  // main/preload are fully bundled and the staged app intentionally has no
  // production dependencies. Returning false tells electron-builder not to
  // discover or copy the repository root node_modules tree.
  return false
}

export const electronBuilderConfig = {
  appId: DESKTOP_APP_ID,
  productName: DESKTOP_PRODUCT_NAME,
  electronVersion: ELECTRON_VERSION,
  directories: {
    app: stageAppDirectory,
    output: artifactDirectory,
  },
  files: [
    'package.json',
    'build-manifest.json',
    'main/index.mjs',
    'preload/index.cjs',
    'renderer/**/*',
  ],
  asar: true,
  disableAsarIntegrity: false,
  npmRebuild: true,
  buildDependenciesFromSource: false,
  beforeBuild,
  removePackageScripts: true,
  removePackageKeywords: true,
  electronFuses: hardenedElectronFuses,
  afterPack,
  artifactName: '${productName}-${version}-${os}-${arch}.${ext}',
  publish: null,
  mac: {
    category: 'public.app-category.productivity',
    hardenedRuntime: true,
    target: [
      {
        target: 'dmg',
        arch: ['arm64', 'x64'],
      },
      {
        target: 'zip',
        arch: ['arm64', 'x64'],
      },
    ],
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
  },
}

export default electronBuilderConfig
