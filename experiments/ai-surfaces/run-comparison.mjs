#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  existsSync,
} from 'node:fs'
import path from 'node:path'

const source = import.meta.dirname
const repository = path.resolve(source, '../..')
const args = process.argv.slice(2)
const scratchOption = args.indexOf('--scratch')
if (
  args.some((arg, index) => arg !== '--scratch' && index !== scratchOption + 1)
)
  throw new Error(
    'Usage: node experiments/ai-surfaces/run-comparison.mjs [--scratch /absolute/path]',
  )
const scratch = path.resolve(
  scratchOption >= 0
    ? args[scratchOption + 1]
    : path.join(repository, 'output/playwright/round2/experiments/e1'),
)
if (
  scratch === repository ||
  repository.startsWith(`${scratch}${path.sep}`) ||
  (scratch.startsWith(`${repository}${path.sep}`) &&
    !scratch.startsWith(
      `${path.join(repository, 'output/playwright')}${path.sep}`,
    ))
)
  throw new Error(
    'Use an external scratch directory or ignored output/playwright subdirectory',
  )
mkdirSync(scratch, { recursive: true })
const lockHash = () =>
  createHash('sha256')
    .update(readFileSync(path.join(repository, 'package-lock.json')))
    .digest('hex')
const beforeLock = lockHash()
const runs = []
for (const group of ['json-render', 'a2ui']) {
  const cwd = path.join(scratch, group)
  mkdirSync(cwd, { recursive: true })
  for (const file of readdirSync(source).filter(
    (name) => name.endsWith('.mjs') && name !== 'run-comparison.mjs',
  ))
    copyFileSync(path.join(source, file), path.join(cwd, file))
  const manifest = path.join(source, 'manifests', `${group}.json`)
  copyFileSync(manifest, path.join(cwd, 'package.json'))
  const lock = path.join(source, 'manifests', `${group}.lock.json`)
  if (existsSync(lock)) copyFileSync(lock, path.join(cwd, 'package-lock.json'))
  const install = spawnSync(
    'npm',
    [
      existsSync(lock) ? 'ci' : 'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
    ],
    {
      cwd,
      encoding: 'utf8',
      timeout: 180_000,
    },
  )
  writeFileSync(
    path.join(cwd, 'install.log'),
    `${install.stdout ?? ''}${install.stderr ?? ''}`,
  )
  if (install.status !== 0)
    throw new Error(`${group} install failed: ${install.stderr}`)
  const dependencyTree = spawnSync(
    'npm',
    ['ls', 'react', 'react-dom', 'zod', '--all', '--json'],
    { cwd, encoding: 'utf8' },
  )
  writeFileSync(path.join(cwd, 'dependency-tree.json'), dependencyTree.stdout)
  if (dependencyTree.status !== 0)
    throw new Error(`${group}: invalid dependency tree`)
  for (const candidate of group === 'json-render'
    ? ['local-catalog', 'json-render']
    : ['a2ui']) {
    const result = spawnSync(process.execPath, ['run-fixture.mjs', candidate], {
      cwd,
      encoding: 'utf8',
      timeout: 30_000,
    })
    writeFileSync(
      path.join(cwd, `${candidate}.log`),
      `${result.stdout ?? ''}${result.stderr ?? ''}`,
    )
    runs.push({
      candidate,
      exit: result.status,
      signal: result.signal,
      installExit: install.status,
      ...(result.status === 0
        ? {
            result: JSON.parse(
              readFileSync(path.join(cwd, `${candidate}-result.json`), 'utf8'),
            ),
          }
        : { error: result.stderr || result.error?.message }),
    })
    console.log(`${candidate}: exit ${result.status}`)
  }
}
const summary = {
  date: '2026-10-24',
  scope: 'synthetic fixture; no production integration',
  beforeRootLock: beforeLock,
  afterRootLock: lockHash(),
  runs,
}
writeFileSync(
  path.join(scratch, 'comparison.json'),
  `${JSON.stringify(summary, null, 2)}\n`,
)
if (summary.beforeRootLock !== summary.afterRootLock)
  throw new Error('Root package lock changed during experiment')
if (runs.some((run) => run.exit !== 0)) process.exitCode = 1
