#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import {
  formatInventorySummary,
  groupInventoryByLane,
  loadRepositoryTestInventory,
  TEST_LANES,
} from './test-inventory.mjs'

const repositoryRoot = path.resolve(import.meta.dirname, '..')
const require = createRequire(import.meta.url)

const MODES = Object.freeze({
  unit: [
    TEST_LANES.SOURCE_NODE,
    TEST_LANES.SOURCE_VITEST,
    TEST_LANES.TOOLING_NODE,
  ],
  ci: Object.values(TEST_LANES),
})

function resolvePackageBin(packageName, binName) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`)
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const relativeBin =
    typeof packageJson.bin === 'string'
      ? packageJson.bin
      : packageJson.bin?.[binName]
  if (typeof relativeBin !== 'string') {
    throw new Error(`${packageName} does not expose the ${binName} binary`)
  }
  return path.resolve(path.dirname(packageJsonPath), relativeBin)
}

function commandForLane(lane, files) {
  switch (lane) {
    case TEST_LANES.SOURCE_NODE:
      return {
        label: 'source node:test',
        args: [
          resolvePackageBin('tsx', 'tsx'),
          '--tsconfig',
          'tsconfig.app.json',
          '--test',
          '--test-concurrency=4',
          '--test-force-exit',
          '--test-timeout=30000',
          ...files,
        ],
      }
    case TEST_LANES.SOURCE_VITEST:
      return {
        label: 'source Vitest/jsdom',
        args: [
          resolvePackageBin('vitest', 'vitest'),
          'run',
          '--maxWorkers=4',
          ...files,
        ],
      }
    case TEST_LANES.DESKTOP_NODE:
      return {
        label: 'desktop node:test',
        args: [
          resolvePackageBin('tsx', 'tsx'),
          '--test',
          '--test-concurrency=2',
          '--test-force-exit',
          '--test-timeout=180000',
          ...files,
        ],
      }
    case TEST_LANES.TOOLING_NODE:
      return {
        label: 'tooling node:test',
        args: [
          '--test',
          '--test-concurrency=2',
          '--test-force-exit',
          '--test-timeout=30000',
          ...files,
        ],
      }
    default:
      throw new Error(`unsupported test lane: ${lane}`)
  }
}

function runLane(lane, files) {
  const command = commandForLane(lane, files)
  console.log(`\ntest-suite: ${command.label} (${files.length} file(s))`)
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, command.args, {
      cwd: repositoryRoot,
      env: process.env,
      stdio: 'inherit',
    })
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else {
        reject(
          new Error(
            `${command.label} failed with ${signal === null ? `exit code ${String(code)}` : `signal ${signal}`}`,
          ),
        )
      }
    })
  })
}

async function main(rawMode) {
  const lanes = MODES[rawMode]
  if (lanes === undefined) {
    throw new Error(`expected mode unit | ci, got ${JSON.stringify(rawMode)}`)
  }

  const inventory = loadRepositoryTestInventory(repositoryRoot)
  console.log(formatInventorySummary(inventory))
  if (inventory.errors.length > 0) {
    throw new Error('test inventory contains unassigned or invalid files')
  }

  const grouped = groupInventoryByLane(inventory.entries)
  for (const lane of lanes) {
    const files = grouped.get(lane) ?? []
    if (files.length === 0) {
      throw new Error(`test lane ${lane} has no files`)
    }
    await runLane(lane, files)
  }
}

try {
  await main(process.argv[2])
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`test-suite: ${message}`)
  process.exitCode = 1
}
