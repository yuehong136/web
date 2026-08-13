import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertDesktopCompositionReady,
  isExpectedRendererDocument,
} from '../../electron/main/windows/readiness-policy'

interface FakeWebContentsOptions {
  readonly marker?: unknown
  readonly markers?: readonly unknown[]
  readonly executeError?: Error
  readonly neverResolve?: boolean
  readonly urlAfterExecute?: string
}

function createFakeWebContents(options: FakeWebContentsOptions = {}) {
  const executions: Array<readonly [string, boolean | undefined]> = []
  let currentUrl = 'app://bundle/'

  return {
    executions,
    webContents: {
      getURL: () => currentUrl,
      executeJavaScript: (script: string, userGesture?: boolean) => {
        executions.push([script, userGesture])
        if (options.neverResolve) return new Promise<unknown>(() => undefined)
        if (options.executeError) return Promise.reject(options.executeError)
        currentUrl = options.urlAfterExecute ?? currentUrl
        const marker = options.markers
          ? options.markers[
              Math.min(executions.length - 1, options.markers.length - 1)
            ]
          : options.marker
        return Promise.resolve(marker)
      },
    },
  }
}

test('smoke readiness requires a validated packaged Renderer URL', () => {
  assert.equal(isExpectedRendererDocument('app://bundle/'), true)
  assert.equal(isExpectedRendererDocument('app://bundle/auth/login'), true)
  assert.equal(
    isExpectedRendererDocument('app://bundle/home?source=desktop#work'),
    true,
  )

  for (const url of [
    'about:blank',
    'app://other/',
    'app://bundle.evil/auth/login',
    'app://user@bundle/auth/login',
    'app://bundle:443/auth/login',
    'https://example.com/',
  ]) {
    assert.equal(isExpectedRendererDocument(url), false, url)
  }
})

test('desktop composition readiness accepts only the fixed desktop marker', async () => {
  const fake = createFakeWebContents({ marker: 'desktop' })

  await assertDesktopCompositionReady(fake.webContents)

  assert.equal(fake.executions.length, 1)
  assert.equal(fake.executions[0]?.[1], false)
  assert.equal(
    fake.executions[0]?.[0],
    'document.documentElement.dataset.clientRuntime ?? null',
  )
})

test('desktop composition readiness waits for the React composition marker', async () => {
  const fake = createFakeWebContents({
    markers: [null, undefined, 'desktop'],
  })

  await assertDesktopCompositionReady(fake.webContents, 200)

  assert.equal(fake.executions.length, 3)
})

test('desktop composition readiness permits same-document SPA routing', async () => {
  const fake = createFakeWebContents({
    marker: 'desktop',
    urlAfterExecute: 'app://bundle/auth/login',
  })

  await assertDesktopCompositionReady(fake.webContents)
})

test('desktop composition readiness rejects untrusted documents before probing', async () => {
  const fake = createFakeWebContents({ marker: 'desktop' })
  fake.webContents.getURL = () => 'https://example.com/'

  await assert.rejects(
    assertDesktopCompositionReady(fake.webContents),
    /document is not trusted/,
  )
  assert.deepEqual(fake.executions, [])
})

test('desktop composition readiness rejects missing and invalid markers', async () => {
  for (const marker of [undefined, null, '', 'web', true]) {
    const fake = createFakeWebContents({ marker })
    await assert.rejects(
      assertDesktopCompositionReady(fake.webContents, 5),
      /marker is missing or invalid/,
    )
  }
})

test('desktop composition readiness rejects navigation races', async () => {
  const fake = createFakeWebContents({
    marker: 'desktop',
    urlAfterExecute: 'https://example.com/',
  })

  await assert.rejects(
    assertDesktopCompositionReady(fake.webContents),
    /document changed during verification/,
  )
})

test('desktop composition readiness fails closed on probe errors', async () => {
  const fake = createFakeWebContents({ executeError: new Error('secret') })

  await assert.rejects(
    assertDesktopCompositionReady(fake.webContents),
    /marker verification failed/,
  )
})

test('desktop composition readiness fails closed when the probe times out', async () => {
  const fake = createFakeWebContents({ neverResolve: true })

  await assert.rejects(
    assertDesktopCompositionReady(fake.webContents, 5),
    /marker verification timed out/,
  )
})
