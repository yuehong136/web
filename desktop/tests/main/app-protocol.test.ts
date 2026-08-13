import assert from 'node:assert/strict'
import {
  mkdir,
  mkdtemp,
  realpath,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { parseAppResourceUrl } from '../../electron/main/app-protocol/app-url'
import {
  APP_SCHEME_PRIVILEGES,
  createAppContentSecurityPolicy,
} from '../../electron/main/app-protocol/constants'
import {
  AppRequestResolutionKind,
  createAppRequestResolver,
  isDocumentNavigationRequest,
} from '../../electron/main/app-protocol/request-resolution'

async function createRendererFixture(context: test.TestContext) {
  const fixtureRoot = await mkdtemp(join(tmpdir(), 'multirag-protocol-'))
  context.after(() => rm(fixtureRoot, { force: true, recursive: true }))

  const rendererRoot = join(fixtureRoot, 'renderer')
  await mkdir(join(rendererRoot, 'assets'), { recursive: true })
  await Promise.all([
    writeFile(join(rendererRoot, 'index.html'), '<main>MultiRAG</main>'),
    writeFile(join(rendererRoot, 'assets', 'main.js'), 'export {}'),
  ])

  return { fixtureRoot, rendererRoot }
}

test('app URL accepts only the exact packaged authority', () => {
  assert.deepEqual(parseAppResourceUrl('app://bundle/assets/main.js'), {
    url: new URL('app://bundle/assets/main.js'),
    pathSegments: ['assets', 'main.js'],
  })

  for (const value of [
    'https://bundle/assets/main.js',
    'app://other/assets/main.js',
    'app://BUNDLE/assets/main.js',
    'app://user@bundle/assets/main.js',
    'app://bundle:443/assets/main.js',
    'app://bundle./assets/main.js',
    'app://%62undle/assets/main.js',
  ]) {
    assert.equal(parseAppResourceUrl(value), null, value)
  }
})

test('app URL rejects traversal and encoded separator variants', () => {
  for (const value of [
    'app://bundle/../secret',
    'app://bundle/%2e%2e/secret',
    'app://bundle/%252e%252e/secret',
    'app://bundle/%25252e%25252e/secret',
    'app://bundle/assets%2fmain.js',
    'app://bundle/assets%5cmain.js',
    'app://bundle/%255csecret',
    'app://bundle//assets/main.js',
    'app://bundle/assets//main.js',
    'app://bundle/assets/%00main.js',
    'app://bundle/C:%5csecret',
  ]) {
    assert.equal(parseAppResourceUrl(value), null, value)
  }
})

test('resolver serves allowlisted files and uses SPA fallback only for documents', async (context) => {
  const { rendererRoot } = await createRendererFixture(context)
  const resolver = await createAppRequestResolver(rendererRoot)

  const asset = await resolver.resolve('app://bundle/assets/main.js', {
    documentNavigation: false,
  })
  assert.equal(asset.kind, AppRequestResolutionKind.FILE)
  if (asset.kind === AppRequestResolutionKind.FILE) {
    assert.equal(
      asset.filePath,
      await realpath(join(rendererRoot, 'assets', 'main.js')),
    )
    assert.equal(asset.spaFallback, false)
  }

  assert.deepEqual(
    await resolver.resolve('app://bundle/assets/missing.js', {
      documentNavigation: false,
    }),
    { kind: AppRequestResolutionKind.NOT_FOUND },
  )

  const route = await resolver.resolve('app://bundle/agent/run-1?tab=logs', {
    documentNavigation: true,
  })
  assert.equal(route.kind, AppRequestResolutionKind.FILE)
  if (route.kind === AppRequestResolutionKind.FILE) {
    assert.equal(
      route.filePath,
      await realpath(join(rendererRoot, 'index.html')),
    )
    assert.equal(route.spaFallback, true)
  }

  assert.deepEqual(
    await resolver.resolve('app://user@bundle/agent/run-1', {
      documentNavigation: true,
    }),
    { kind: AppRequestResolutionKind.INVALID },
  )
})

test('resolver rejects symlink escapes even when the target is a file', async (context) => {
  const { fixtureRoot, rendererRoot } = await createRendererFixture(context)
  const outsideFile = join(fixtureRoot, 'outside.js')
  await writeFile(outsideFile, 'secret')
  await symlink(outsideFile, join(rendererRoot, 'assets', 'linked.js'))

  const resolver = await createAppRequestResolver(rendererRoot)
  assert.deepEqual(
    await resolver.resolve('app://bundle/assets/linked.js', {
      documentNavigation: false,
    }),
    { kind: AppRequestResolutionKind.NOT_FOUND },
  )
})

test('document classification does not trust Accept headers', () => {
  assert.equal(
    isDocumentNavigationRequest({
      method: 'GET',
      mode: 'navigate',
      destination: '',
      headers: new Headers(),
    }),
    true,
  )
  assert.equal(
    isDocumentNavigationRequest(
      new Request('app://bundle/route', {
        headers: { 'sec-fetch-dest': 'document' },
      }),
    ),
    true,
  )
  assert.equal(
    isDocumentNavigationRequest(
      new Request('app://bundle/route', {
        headers: { accept: 'text/html' },
      }),
    ),
    false,
  )
  assert.equal(
    isDocumentNavigationRequest(
      new Request('app://bundle/route', {
        method: 'POST',
        headers: { 'sec-fetch-dest': 'document' },
      }),
    ),
    false,
  )
})

test('scheme privileges and CSP remain least-privilege', () => {
  assert.deepEqual(APP_SCHEME_PRIVILEGES, {
    standard: true,
    secure: true,
    bypassCSP: false,
    allowServiceWorkers: false,
    supportFetchAPI: true,
    corsEnabled: true,
    stream: false,
    codeCache: true,
    allowExtensions: false,
  })
  const productionPolicy = createAppContentSecurityPolicy([
    'https://api.example.com',
    'wss://api.example.com',
  ])
  assert.match(productionPolicy, /script-src 'self'/)
  assert.match(
    productionPolicy,
    /connect-src 'self' https:\/\/api\.example\.com wss:\/\/api\.example\.com/,
  )
  assert.doesNotMatch(productionPolicy, /unsafe-eval|localhost|\bhttp:/)

  const localPolicy = createAppContentSecurityPolicy(['http://127.0.0.1:8123'])
  assert.match(localPolicy, /connect-src 'self' http:\/\/127\.0\.0\.1:8123/)
  assert.doesNotMatch(localPolicy, /connect-src[^;]*\bhttp:\s/)

  assert.throws(
    () =>
      createAppContentSecurityPolicy([
        "https://api.example.com; script-src 'unsafe-eval'",
      ]),
    /absolute origin/,
  )
  assert.throws(
    () => createAppContentSecurityPolicy(['https://*.example.com']),
    /exact HTTP\(S\)\/WS\(S\) origin/,
  )
})
