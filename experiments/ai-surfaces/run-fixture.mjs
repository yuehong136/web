import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { createFixtureSession } from './fixture.mjs'

const candidate = process.argv[2]
if (!['local-catalog', 'json-render', 'a2ui'].includes(candidate))
  throw new Error('Expected local-catalog, json-render or a2ui')
const dom = new JSDOM('<!doctype html><main id="surface"></main>', {
  url: 'https://fixture.invalid',
  pretendToBeVisual: true,
})
for (const name of [
  'window',
  'document',
  'HTMLElement',
  'HTMLDivElement',
  'Element',
  'Node',
  'Document',
  'CSSStyleSheet',
  'ShadowRoot',
  'customElements',
  'MutationObserver',
  'Event',
  'MouseEvent',
  'CustomEvent',
  'navigator',
])
  Object.defineProperty(globalThis, name, {
    configurable: true,
    value: name === 'window' ? dom.window : dom.window[name],
  })
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
)
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
)
globalThis.IS_REACT_ACT_ENVIRONMENT = true
let networkRequests = 0
globalThis.fetch = async () => {
  networkRequests += 1
  throw new Error('The fixture must never call a remote action')
}
const { act } = await import('react')
const { createRoot } = await import('react-dom/client')
const { createAdapter } = await import(`./${candidate}.mjs`)
const host = document.querySelector('#surface')
const root = createRoot(host)
const session = createFixtureSession()
let presentation = { locale: 'en-US', preset: 'studio', mode: 'light' }
let adapter
const update = () => {
  host.dataset.locale = presentation.locale
  host.dataset.preset = presentation.preset
  host.dataset.theme = presentation.mode
  adapter.render(presentation)
}
adapter = await createAdapter({ session, root, update })
function descendants(start = host) {
  const nodes = [...start.querySelectorAll('*')]
  return nodes.flatMap((node) => [
    node,
    ...(node.shadowRoot ? descendants(node.shadowRoot) : []),
  ])
}
const find = (id) =>
  descendants().find((node) => node.getAttribute('data-fixture-id') === id)
const text = () =>
  descendants()
    .filter(
      (node) => node.matches('p, button, output') && !node.closest('[hidden]'),
    )
    .map((node) => node.textContent)
    .join('|')
async function flush(run) {
  await act(async () => {
    run()
    await Promise.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}
await flush(update)
assert.match(text(), /Workspace design notes/u)
assert.match(text(), /Data retention policy/u)
const schemaRejection = adapter.schemaRejection()
assert.equal(
  schemaRejection.host,
  true,
  'controlled host rejects an object as text',
)
const actionPolicy = adapter.actionPolicy()
assert.equal(actionPolicy.hostRejectsUnknownAction, true)
assert.equal(session.dispatch(session.state.scope, 'executeCode', {}), false)
assert.equal(
  session.dispatch(session.state.scope, 'adoptSource', { sourceId: 'foreign' }),
  false,
)
assert.equal(
  session.dispatch('foreign-scope', 'filterSources', { kind: 'policy' }),
  false,
)
assert.equal(
  session.state.receipts.length,
  0,
  'forbidden actions must have zero effects',
)
await flush(() => {
  assert.equal(
    adapter.patch({
      scope: session.state.scope,
      revision: 1,
      source: {
        id: 'supplement',
        title: 'Retention supplement',
        kind: 'policy',
      },
    }),
    true,
  )
  update()
})
assert.match(text(), /Retention supplement/u)
const afterPatch = structuredClone(session.state)
assert.equal(
  adapter.patch({
    scope: session.state.scope,
    revision: 1,
    source: { id: 'stale', title: 'Must not arrive', kind: 'policy' },
  }),
  false,
)
assert.equal(
  adapter.patch({
    scope: 'foreign-scope',
    revision: 2,
    source: { id: 'foreign', title: 'Must not arrive', kind: 'policy' },
  }),
  false,
)
assert.deepEqual(session.state, afterPatch)
await flush(() => {
  const button = find('filter')
  assert.ok(button, 'framework renders the filter button')
  button.click()
})
assert.equal(session.state.filter, 'policy')
assert.doesNotMatch(text(), /Workspace design notes/u)
await flush(() => {
  const button = find('adopt-policy')
  assert.ok(button, 'framework renders the adoption button')
  button.click()
})
assert.deepEqual(session.state.adopted, ['policy'])
assert.equal(session.state.receipts.length, 2)
await flush(() => {
  presentation = { locale: 'zh-CN', preset: 'paper', mode: 'dark' }
  update()
})
assert.match(text(), /仅看制度/u)
assert.match(text(), /采用来源/u)
assert.equal(host.dataset.preset, 'paper')
assert.equal(host.dataset.theme, 'dark')
assert.equal(
  session.state.receipts.length,
  2,
  'presentation changes do not rerun actions',
)
assert.deepEqual(session.state.adopted, ['policy'])
await flush(() => adapter.render(presentation, true))
assert.match(text(), /暂不支持此组件/u)
let releaseLatePatch
const latePatch = new Promise((resolve) => {
  releaseLatePatch = resolve
}).then(() =>
  adapter.patch({
    scope: session.state.scope,
    revision: 2,
    source: { id: 'late', title: 'Must not arrive', kind: 'policy' },
  }),
)
await flush(() => {
  adapter.dispose()
  root.unmount()
})
const afterDispose = structuredClone(session.state)
releaseLatePatch()
assert.equal(await latePatch, false)
assert.equal(
  session.dispatch(session.state.scope, 'adoptSource', { sourceId: 'policy' }),
  false,
)
assert.deepEqual(session.state, afterDispose)
assert.equal(host.childElementCount, 0)
assert.equal(networkRequests, 0)
const result = {
  candidate,
  assertions: [
    'same fixture rendered',
    'controlled component schema rejection',
    'host action whitelist and foreign scope denial',
    'incremental source patch',
    'framework click -> fixture receiver',
    'filter and adopt scope readback',
    'locale/theme change without action replay',
    'unknown type fallback',
    'dispose ignores late patch and action',
    'React root unmounted',
  ],
  fallbackOwner: adapter.fallbackOwner,
  schemaRejection,
  actionPolicy,
  fixtureReceipts: session.state.receipts,
  productionActions: false,
  networkRequests,
  realProvider: false,
}
writeFileSync(
  `${candidate}-result.json`,
  `${JSON.stringify(result, null, 2)}\n`,
)
console.log(JSON.stringify(result))
dom.window.close()
