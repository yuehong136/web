#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const TEST_LANES = Object.freeze({
  SOURCE_NODE: 'source-node',
  SOURCE_VITEST: 'source-vitest',
  DESKTOP_NODE: 'desktop-node',
  TOOLING_NODE: 'tooling-node',
})

const TEST_EXTENSIONS = ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts']
const TEST_PATTERNS = TEST_EXTENSIONS.flatMap((extension) => [
  `:(glob)**/*.test.${extension}`,
  `:(glob)**/*.spec.${extension}`,
])
function normalizePath(file) {
  return file.replaceAll('\\', '/')
}

export function discoverTestFiles(repositoryRoot) {
  const output = execFileSync(
    'git',
    [
      '-C',
      repositoryRoot,
      'ls-files',
      '-co',
      '--exclude-standard',
      '-z',
      '--',
      ...TEST_PATTERNS,
    ],
    { encoding: 'utf8' },
  )

  return output.split('\0').filter(Boolean).map(normalizePath).sort()
}

function importsModule(source, moduleName) {
  const patterns = [
    new RegExp(
      `^\\s*import(?:\\s+type)?(?:.+\\s+from\\s*)?['"]${moduleName}['"]`,
      'mu',
    ),
    new RegExp(`^\\s*\\}\\s*from\\s*['"]${moduleName}['"]`, 'mu'),
    new RegExp(
      `^\\s*(?:const|let|var)\\b.+require\\(\\s*['"]${moduleName}['"]\\s*\\)`,
      'mu',
    ),
  ]
  return patterns.some((pattern) => pattern.test(source))
}

function detectRunner(source) {
  const usesNodeTest = importsModule(source, 'node:test')
  const usesVitest = importsModule(source, 'vitest')

  if (usesNodeTest && usesVitest) {
    return { error: 'imports both node:test and vitest' }
  }
  if (usesNodeTest) return { runner: 'node' }
  if (usesVitest) return { runner: 'vitest' }
  return { error: 'does not import node:test or vitest' }
}

export function classifyTestFile(file, source) {
  const normalizedFile = normalizePath(file)
  const detected = detectRunner(source)
  if (detected.error !== undefined) {
    return { file: normalizedFile, error: detected.error }
  }

  if (normalizedFile.startsWith('src/')) {
    return {
      file: normalizedFile,
      lane:
        detected.runner === 'node'
          ? TEST_LANES.SOURCE_NODE
          : TEST_LANES.SOURCE_VITEST,
    }
  }

  if (normalizedFile.startsWith('desktop/')) {
    if (detected.runner !== 'node') {
      return {
        file: normalizedFile,
        error: 'desktop tests must use node:test',
      }
    }
    return { file: normalizedFile, lane: TEST_LANES.DESKTOP_NODE }
  }

  if (
    normalizedFile.startsWith('eslint-rules/') ||
    normalizedFile.startsWith('scripts/')
  ) {
    if (detected.runner !== 'node') {
      return {
        file: normalizedFile,
        error: 'tooling tests must use node:test',
      }
    }
    return { file: normalizedFile, lane: TEST_LANES.TOOLING_NODE }
  }

  return {
    file: normalizedFile,
    error:
      'is outside the supported src, desktop, eslint-rules, or scripts roots',
  }
}

export function createTestInventory(files, readSource) {
  const entries = []
  const errors = []

  for (const file of files) {
    const result = classifyTestFile(file, readSource(file))
    if (result.error !== undefined) errors.push(result)
    else entries.push(result)
  }

  return { entries, errors }
}

export function loadRepositoryTestInventory(repositoryRoot) {
  const files = discoverTestFiles(repositoryRoot)
  return createTestInventory(files, (file) =>
    readFileSync(path.join(repositoryRoot, file), 'utf8'),
  )
}

export function groupInventoryByLane(entries) {
  const grouped = new Map(Object.values(TEST_LANES).map((lane) => [lane, []]))
  for (const entry of entries) grouped.get(entry.lane)?.push(entry.file)
  return grouped
}

export function formatInventorySummary(inventory) {
  const grouped = groupInventoryByLane(inventory.entries)
  const lines = [
    `test-inventory: ${inventory.entries.length + inventory.errors.length} file(s) discovered.`,
  ]
  for (const lane of Object.values(TEST_LANES)) {
    lines.push(`  ${lane}: ${grouped.get(lane)?.length ?? 0}`)
  }
  if (inventory.errors.length > 0) {
    lines.push('test-inventory: unassigned or invalid test files:')
    for (const error of inventory.errors) {
      lines.push(`  - ${error.file}: ${error.error}`)
    }
  }
  return lines.join('\n')
}

function isMainModule() {
  const entry = process.argv[1]
  return (
    entry !== undefined &&
    path.resolve(entry) === fileURLToPath(import.meta.url)
  )
}

if (isMainModule()) {
  const repositoryRoot = path.resolve(import.meta.dirname, '..')
  const inventory = loadRepositoryTestInventory(repositoryRoot)
  console.log(formatInventorySummary(inventory))
  if (inventory.errors.length > 0) process.exitCode = 1
}
