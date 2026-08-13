import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertDesktopNetworkPolicy,
  assertRendererNetworkPolicyReceipt,
  createDesktopNetworkPolicy,
  createDesktopNetworkPolicyFromReceipt,
  createRendererNetworkPolicyReceipt,
  loadDesktopNetworkPolicy,
  resolveDesktopNetworkPolicy,
  validateDesktopNetworkPolicy,
} from '../../build/network-policy.mjs'

test('Renderer receipt records only the three public network build inputs', () => {
  const receipt = createRendererNetworkPolicyReceipt(
    {
      VITE_API_BASE_URL: 'https://api.example.com/v1',
      VITE_WS_BASE_URL: 'wss://stream.example.com/events',
      VITE_UNRELATED_PUBLIC_VALUE: 'excluded',
      DATABASE_PASSWORD: 'excluded',
    },
    { viteMode: 'desktop' },
  )

  assert.deepEqual(receipt, {
    schemaVersion: 1,
    viteMode: 'desktop',
    environment: {
      VITE_API_BASE_URL: 'https://api.example.com/v1',
      VITE_ADMIN_API_BASE_URL: null,
      VITE_WS_BASE_URL: 'wss://stream.example.com/events',
    },
  })
  assert.deepEqual(createDesktopNetworkPolicyFromReceipt(receipt), {
    schemaVersion: 1,
    viteMode: 'desktop',
    endpoints: {
      apiOrigin: 'https://api.example.com',
      adminApiOrigin: 'https://api.example.com:8130',
      webSocketOrigin: 'wss://stream.example.com',
    },
    connectSources: [
      'https://api.example.com',
      'https://api.example.com:8130',
      'wss://stream.example.com',
    ],
  })
  assert.equal(JSON.stringify(receipt).includes('excluded'), false)
})

test('Renderer receipt validator rejects missing or expanded public inputs', () => {
  const receipt = createRendererNetworkPolicyReceipt({})
  assert.throws(
    () =>
      assertRendererNetworkPolicyReceipt({
        ...receipt,
        environment: {
          ...receipt.environment,
          VITE_EXTRA_ORIGIN: 'https://unexpected.example.com',
        },
      }),
    /unexpected property set/,
  )
  assert.throws(
    () =>
      assertRendererNetworkPolicyReceipt({
        ...receipt,
        environment: {
          VITE_API_BASE_URL: null,
          VITE_WS_BASE_URL: null,
        },
      }),
    /unexpected property set/,
  )
})

test('network policy mirrors the Renderer API fallback without broad HTTP access', () => {
  assert.deepEqual(createDesktopNetworkPolicy({}), {
    schemaVersion: 1,
    viteMode: 'production',
    endpoints: {
      apiOrigin: 'http://localhost:8000',
      adminApiOrigin: 'http://localhost:8130',
      webSocketOrigin: null,
    },
    connectSources: ['http://localhost:8000', 'http://localhost:8130'],
  })
})

test('network policy records exact local origins and removes URL paths', () => {
  assert.deepEqual(
    createDesktopNetworkPolicy(
      {
        VITE_API_BASE_URL: 'http://127.0.0.1:8123/api',
        VITE_ADMIN_API_BASE_URL: 'http://[::1]:8130/admin',
        VITE_WS_BASE_URL: 'ws://127.0.0.1:8123/runs',
      },
      { viteMode: 'desktop' },
    ),
    {
      schemaVersion: 1,
      viteMode: 'desktop',
      endpoints: {
        apiOrigin: 'http://127.0.0.1:8123',
        adminApiOrigin: 'http://[::1]:8130',
        webSocketOrigin: 'ws://127.0.0.1:8123',
      },
      connectSources: [
        'http://[::1]:8130',
        'http://127.0.0.1:8123',
        'ws://127.0.0.1:8123',
      ],
    },
  )
})

test('network policy permits only secure protocols for remote origins', () => {
  assert.deepEqual(
    createDesktopNetworkPolicy({
      VITE_API_BASE_URL: 'https://api.example.com/v1',
      VITE_ADMIN_API_BASE_URL: 'https://admin.example.com',
      VITE_WS_BASE_URL: 'wss://stream.example.com/events',
    }).connectSources,
    [
      'https://admin.example.com',
      'https://api.example.com',
      'wss://stream.example.com',
    ],
  )

  for (const [key, value] of [
    ['VITE_API_BASE_URL', 'http://api.example.com'],
    ['VITE_ADMIN_API_BASE_URL', 'http://admin.example.com'],
    ['VITE_WS_BASE_URL', 'ws://stream.example.com'],
  ]) {
    assert.throws(
      () =>
        createDesktopNetworkPolicy({
          VITE_API_BASE_URL: 'https://api.example.com',
          [key]: value,
        }),
      /only with an exact loopback hostname/,
    )
  }
})

test('network policy rejects deceptive loopback and ambiguous URL inputs', () => {
  const rejectedValues = [
    'http://localhost.example.com:8123',
    'http://127.0.0.1.example.com:8123',
    'http://2130706433:8123',
    'http://user:password@localhost:8123',
    'http://localhost:8123/api?redirect=https://example.com',
    'https://*.example.com',
    'https://example.com;sandbox',
    'https://api.example.com%20',
    '/api',
  ]

  for (const value of rejectedValues) {
    assert.throws(
      () => createDesktopNetworkPolicy({ VITE_API_BASE_URL: value }),
      /VITE_API_BASE_URL/,
    )
  }
})

test('network policy requires HTTP API and WebSocket endpoint protocols', () => {
  assert.throws(
    () =>
      createDesktopNetworkPolicy({
        VITE_API_BASE_URL: 'wss://api.example.com',
      }),
    /unsupported protocol: wss:/,
  )
  assert.throws(
    () =>
      createDesktopNetworkPolicy({
        VITE_WS_BASE_URL: 'https://stream.example.com',
      }),
    /unsupported protocol: https:/,
  )
})

test('network policy is loaded through Vite public environment resolution', () => {
  const calls = []
  const policy = loadDesktopNetworkPolicy({
    rootDirectory: '/fixture/repository',
    viteMode: 'production',
    loadEnvironment(mode, rootDirectory, prefix) {
      calls.push({ mode, rootDirectory, prefix })
      return {
        VITE_API_BASE_URL: 'https://api.example.com',
        VITE_WS_BASE_URL: 'wss://stream.example.com',
        DATABASE_PASSWORD: 'must-not-enter-policy',
      }
    },
  })

  assert.deepEqual(calls, [
    {
      mode: 'production',
      rootDirectory: '/fixture/repository',
      prefix: 'VITE_',
    },
  ])
  assert.equal(JSON.stringify(policy).includes('must-not-enter-policy'), false)
})

test('network policy exposes the staging-oriented resolver and validator', () => {
  const policy = resolveDesktopNetworkPolicy({
    mode: 'production',
    environmentValues: {
      VITE_API_BASE_URL: 'https://api.example.com',
    },
  })

  assert.equal(validateDesktopNetworkPolicy(policy), policy)
})

test('network policy validator rejects expanded or internally inconsistent policies', () => {
  const policy = createDesktopNetworkPolicy({
    VITE_API_BASE_URL: 'https://api.example.com',
  })

  assert.throws(
    () =>
      assertDesktopNetworkPolicy({
        ...policy,
        unexpected: true,
      }),
    /unexpected property set/,
  )
  assert.throws(
    () =>
      assertDesktopNetworkPolicy({
        ...policy,
        connectSources: ['https:'],
      }),
    /must exactly match/,
  )
  assert.throws(
    () =>
      assertDesktopNetworkPolicy({
        ...policy,
        endpoints: {
          ...policy.endpoints,
          apiOrigin: 'https://api.example.com/path',
        },
      }),
    /must be a canonical origin/,
  )
})
