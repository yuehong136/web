import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { ESLint } from 'eslint'

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..',
)

async function lintBoundarySource(filePath, source) {
  const eslint = new ESLint({ cwd: repositoryRoot })
  const [result] = await eslint.lintText(source, {
    filePath: path.join(repositoryRoot, filePath),
  })
  return result.messages
}

async function assertRuleError(filePath, source, ruleId) {
  const messages = await lintBoundarySource(filePath, source)
  assert.ok(
    messages.some(
      (message) => message.ruleId === ruleId && message.severity === 2,
    ),
    `${filePath} should reject ${source.trim()} with ${ruleId}`,
  )
}

async function assertNoRuleError(filePath, source, ruleId) {
  const messages = await lintBoundarySource(filePath, source)
  assert.equal(
    messages.some((message) => message.ruleId === ruleId),
    false,
    `${filePath} should allow ${source.trim()} for ${ruleId}`,
  )
}

const assertRestrictedImport = (filePath, source) =>
  assertRuleError(filePath, source, 'no-restricted-imports')
const assertRestrictedGlobal = (filePath, source) =>
  assertRuleError(filePath, source, 'no-restricted-globals')
const assertRestrictedDynamicImport = (filePath, source) =>
  assertRuleError(
    filePath,
    source,
    'platform-boundaries/no-restricted-dynamic-import',
  )

test('Renderer rejects bare Node built-ins and deep desktop imports', async () => {
  await assertRestrictedImport('src/pages/virtual-boundary.ts', "import 'fs'\n")
  await assertRestrictedImport(
    'src/pages/deep/virtual-boundary.ts',
    "import '../../../../desktop/electron/main/index'\n",
  )
  await assertRestrictedGlobal(
    'src/pages/virtual-boundary.ts',
    'process.cwd()\n',
  )
  await assertRestrictedGlobal(
    'src/pages/virtual-boundary.ts',
    'Buffer.from("fixture")\n',
  )
  await assertRestrictedGlobal(
    'src/pages/virtual-boundary.ts',
    'require("fixture")\n',
  )
  await assertRestrictedDynamicImport(
    'src/pages/virtual-boundary.ts',
    "void import('node:fs')\n",
  )
  await assertRestrictedDynamicImport(
    'src/pages/virtual-boundary.ts',
    "void import('electron')\n",
  )
  await assertRestrictedDynamicImport(
    'src/pages/virtual-boundary.ts',
    'void import(runtimeSpecifier)\n',
  )
})

test('Desktop Renderer adapter may import only the pure bridge contract', async () => {
  await assertNoRuleError(
    'src/entrypoints/virtual-composition.ts',
    "import '@/platform/desktop'\n",
    'no-restricted-imports',
  )
  await assertNoRuleError(
    'src/platform/desktop/virtual-boundary.ts',
    "import '../../../desktop/protocol/renderer-bridge/index'\n",
    'no-restricted-imports',
  )
  await assertRestrictedImport(
    'src/platform/desktop/virtual-boundary.ts',
    "import '../../../desktop/electron/main/index'\n",
  )
  await assertRestrictedImport(
    'src/platform/desktop/virtual-boundary.ts',
    "import 'electron'\n",
  )
  await assertRestrictedImport(
    'src/platform/desktop/virtual-boundary.ts',
    "import 'node:path'\n",
  )
  await assertRestrictedDynamicImport(
    'src/platform/desktop/virtual-boundary.ts',
    "void import('../../../desktop/protocol/renderer-bridge/index')\n",
  )
  await assertRestrictedImport(
    'src/pages/virtual-boundary.ts',
    "import '../../desktop/protocol/renderer-bridge/index'\n",
  )
  await assertRestrictedImport(
    'src/pages/virtual-boundary.ts',
    "import '@/platform/desktop'\n",
  )
  await assertRestrictedDynamicImport(
    'src/pages/virtual-boundary.ts',
    "void import('@/platform/desktop')\n",
  )
})

test('explicit build generators retain their scoped Node access', async () => {
  await assertNoRuleError(
    'src/themes/build-themes.ts',
    "import 'fs'\n",
    'no-restricted-imports',
  )
  await assertNoRuleError(
    'src/themes/build-themes.ts',
    'process.cwd()\n',
    'no-restricted-globals',
  )
})

test('sandboxed preload rejects bare Node built-ins and main imports', async () => {
  await assertNoRuleError(
    'desktop/electron/preload/virtual-boundary.ts',
    "import '../../protocol/renderer-bridge/index'\n",
    'no-restricted-imports',
  )
  await assertRestrictedImport(
    'desktop/electron/preload/virtual-boundary.ts',
    "import 'child_process'\n",
  )
  await assertRestrictedImport(
    'desktop/electron/preload/virtual-boundary.ts',
    "import '../main/index'\n",
  )
  await assertRestrictedImport(
    'desktop/electron/preload/virtual-boundary.ts',
    "import 'react/jsx-runtime'\n",
  )
  await assertRestrictedGlobal(
    'desktop/electron/preload/virtual-boundary.ts',
    'process.cwd()\n',
  )
  await assertRestrictedGlobal(
    'desktop/electron/preload/virtual-boundary.ts',
    'require("fixture")\n',
  )
  await assertRestrictedDynamicImport(
    'desktop/electron/preload/virtual-boundary.ts',
    "void import('node:child_process')\n",
  )
  await assertRestrictedDynamicImport(
    'desktop/electron/preload/virtual-boundary.ts',
    "void import('react/jsx-runtime')\n",
  )
})

test('Electron main keeps Node access but rejects UI and preload imports', async () => {
  await assertNoRuleError(
    'desktop/electron/main/virtual-boundary.ts',
    "import '../../protocol/renderer-bridge/index'\n",
    'no-restricted-imports',
  )
  await assertNoRuleError(
    'desktop/electron/main/virtual-boundary.ts',
    "import 'node:path'\n",
    'no-restricted-imports',
  )
  await assertNoRuleError(
    'desktop/electron/main/virtual-boundary.ts',
    'process.cwd()\n',
    'no-restricted-globals',
  )
  await assertRestrictedImport(
    'desktop/electron/main/virtual-boundary.ts',
    "import 'react/jsx-runtime'\n",
  )
  await assertRestrictedImport(
    'desktop/electron/main/virtual-boundary.ts',
    "import 'react-dom/client'\n",
  )
  await assertRestrictedDynamicImport(
    'desktop/electron/main/virtual-boundary.ts',
    "void import('react/jsx-runtime')\n",
  )
  await assertRestrictedImport(
    'desktop/electron/main/deep/virtual-boundary.ts',
    "import '../../../preload/index'\n",
  )
})

test('pure bridge contracts reject Node and Electron implementation imports', async () => {
  await assertRestrictedImport(
    'desktop/protocol/renderer-bridge/virtual-boundary.ts',
    "import 'node:path'\n",
  )
  await assertRestrictedImport(
    'desktop/protocol/renderer-bridge/virtual-boundary.ts',
    "import '../../electron/main/index'\n",
  )
  await assertRestrictedImport(
    'desktop/protocol/renderer-bridge/virtual-boundary.ts',
    "import 'react-dom/server'\n",
  )
  await assertRestrictedGlobal(
    'desktop/protocol/renderer-bridge/virtual-boundary.ts',
    'Buffer.from("fixture")\n',
  )
  await assertRestrictedGlobal(
    'desktop/protocol/renderer-bridge/virtual-boundary.ts',
    'require("fixture")\n',
  )
  await assertRestrictedDynamicImport(
    'desktop/protocol/renderer-bridge/virtual-boundary.ts',
    "void import('electron')\n",
  )
  await assertRestrictedDynamicImport(
    'desktop/protocol/renderer-bridge/virtual-boundary.ts',
    "void import('node:path')\n",
  )
})
