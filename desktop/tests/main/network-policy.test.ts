import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  loadDesktopNetworkPolicy,
  parseDesktopNetworkPolicy,
} from '../../electron/main/security/network-policy'

test('Desktop manifest accepts exact secure and loopback connect origins', () => {
  const policy = parseDesktopNetworkPolicy({
    schemaVersion: 2,
    security: {
      schemaVersion: 1,
      connectSources: [
        'http://127.0.0.1:8123',
        'https://api.example.com',
        'ws://localhost:8123',
        'wss://stream.example.com',
      ],
    },
  })

  assert.deepEqual(policy.connectSources, [
    'http://127.0.0.1:8123',
    'https://api.example.com',
    'ws://localhost:8123',
    'wss://stream.example.com',
  ])
  assert.equal(Object.isFrozen(policy), true)
  assert.equal(Object.isFrozen(policy.connectSources), true)
})

test('Desktop manifest rejects broad, credentialed, and remote insecure sources', () => {
  for (const connectSources of [
    ['http:'],
    ['https:'],
    ['*'],
    ['http://api.example.com'],
    ['ws://api.example.com'],
    ['https://user:secret@api.example.com'],
    ['https://api.example.com/path'],
    ['https://example.com;sandbox'],
    ['https://api.example.com', 'https://api.example.com'],
    ['wss://stream.example.com', 'https://api.example.com'],
  ]) {
    assert.throws(
      () =>
        parseDesktopNetworkPolicy({
          schemaVersion: 2,
          security: { schemaVersion: 1, connectSources },
        }),
      TypeError,
      JSON.stringify(connectSources),
    )
  }
})

test('Desktop manifest requires the staged and network policy schema versions', () => {
  assert.throws(
    () =>
      parseDesktopNetworkPolicy({
        schemaVersion: 1,
        security: { schemaVersion: 1, connectSources: [] },
      }),
    /build manifest has an unsupported version/,
  )
  assert.throws(
    () =>
      parseDesktopNetworkPolicy({
        schemaVersion: 2,
        security: { schemaVersion: 2, connectSources: [] },
      }),
    /network policy has an unsupported version/,
  )
})

test('Desktop network policy loader fails closed on invalid JSON', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'multirag-policy-test-'))
  context.after(() => rm(directory, { force: true, recursive: true }))
  const manifestPath = join(directory, 'build-manifest.json')
  await writeFile(manifestPath, '{not-json}\n')

  await assert.rejects(
    loadDesktopNetworkPolicy(manifestPath),
    /build manifest cannot be read/,
  )
})
