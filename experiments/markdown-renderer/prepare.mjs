import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { execFile, spawnSync } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const repository = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
)
export const scratch = path.join(
  repository,
  'output/playwright/round2/renderer-scratch',
)
export const candidates = {
  streamdown: '2.7.1',
  '@streamdown/code': '2.0.0',
  '@streamdown/math': '1.0.3',
  '@streamdown/mermaid': '1.0.3',
  '@streamdown/cjk': '1.0.4',
}

export async function prepare() {
  await mkdir(scratch, { recursive: true })
  const records = await Promise.all(
    Object.entries(candidates).map(async ([name, version]) => {
      const { stdout } = await promisify(execFile)(
        'npm',
        ['view', `${name}@${version}`, '--json'],
        { timeout: 60000, maxBuffer: 4 * 1024 * 1024 },
      )
      const exact = JSON.parse(stdout)
      if (exact.version !== version)
        throw new Error(`Missing exact version ${name}@${version}`)
      return {
        name,
        version,
        publishedAt: exact.time?.[version],
        integrity: exact.dist.integrity,
        dependencies: exact.dependencies,
        peerDependencies: exact.peerDependencies,
      }
    }),
  )
  await writeFile(
    path.join(scratch, 'registry.json'),
    JSON.stringify(records, null, 2),
  )
  const manifest = { private: true, type: 'module', dependencies: candidates }
  // JSONL keeps the exact isolated transitive lock reviewable below 600 lines.
  const [headerRecord, ...packageRecords] = (
    await readFile(new URL('./candidate-lock.jsonl', import.meta.url), 'utf8')
  )
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  const locked = {
    ...headerRecord.header,
    packages: Object.fromEntries(
      packageRecords.map(({ path: packagePath, data }) => [packagePath, data]),
    ),
  }
  if (
    !Object.entries(candidates).every(
      ([name, version]) => locked.packages[''].dependencies[name] === version,
    )
  )
    throw new Error('Candidate lock and manifest differ')
  await writeFile(
    path.join(scratch, 'package-lock.json'),
    JSON.stringify(locked, null, 2),
  )
  await writeFile(
    path.join(scratch, 'package.json'),
    JSON.stringify(manifest, null, 2),
  )
  const command = 'ci'
  const install = spawnSync(
    'npm',
    [
      command,
      '--ignore-scripts',
      '--legacy-peer-deps',
      '--no-audit',
      '--no-fund',
    ],
    { cwd: scratch, stdio: 'inherit' },
  )
  if (install.status !== 0)
    throw new Error(`Isolated npm ${command} failed: ${install.status}`)
  await writeFile(
    path.join(scratch, 'index.html'),
    `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><div id="root"></div><script type="module" src="/@fs/${repository}/experiments/markdown-renderer/harness.tsx"></script></body></html>`,
  )
  console.log(`Prepared ${scratch}; production dependencies untouched`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await prepare()
