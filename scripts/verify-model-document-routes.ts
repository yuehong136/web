/** Exercise production Web clients against integration-owned HTTP listeners. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { apiClient } from '../src/api/client'
import { agentAPI } from '../src/api/agent'
import { llmAPI } from '../src/api/llm'
import { buildLocalModelParams } from '../src/pages/settings/model-providers/components/api-key-modal-utils'

const base = process.env.DOMAIN_ACCEPTANCE_BASE
const token = process.env.DOMAIN_ACCEPTANCE_TOKEN
const mode = process.env.DOMAIN_ACCEPTANCE_MODE
assert.ok(base && token && mode)
apiClient.setAuthToken(token)
const realFetch = globalThis.fetch
const paths: string[] = []
globalThis.fetch = ((url, init) => {
  const parsed = new URL(String(url), base)
  paths.push(parsed.pathname)
  return realFetch(`${base}${parsed.pathname}${parsed.search}`, init)
}) as typeof fetch

if (mode === 'model') {
  const providerBase = process.env.DOMAIN_ACCEPTANCE_PROVIDER
  assert.ok(providerBase)
  const flags: boolean[] = []
  for (const enabled of [false, true, false]) {
    const params = buildLocalModelParams({
      providerName: 'Ollama',
      modelName: 'combined-fixture',
      modelType: 'chat',
      vision: false,
      apiKey: 'fixture-key',
      baseUrl: providerBase,
      maxTokens: 4096,
      isTools: enabled,
      includeTools: true,
    })
    await llmAPI.addLLM(params)
    const providers = await llmAPI.getMyLLMs({ include_details: true })
    const model = providers.Ollama.llm.find(
      (item) => item.name === 'combined-fixture',
    )
    assert.equal(model?.is_tools, enabled)
    assert.ok(!JSON.stringify(providers).includes('fixture-key'))
    flags.push(enabled)
  }
  console.log(JSON.stringify({ flags, paths }))
} else if (mode === 'document-save') {
  const dsl = {
    components: {
      begin: {
        obj: { component_name: 'Begin', params: {} },
        downstream: [],
        upstream: [],
      },
      'DocGenerator:combined': {
        obj: {
          component_name: 'DocGenerator',
          params: {
            output_format: 'txt',
            content: 'Combined report 中文',
            filename: 'combined-report',
            add_timestamp: false,
            include_download_info_in_content: true,
          },
        },
        downstream: [],
        upstream: [],
      },
    },
    path: [],
    history: [],
    retrieval: [],
  }
  const created = await agentAPI.setAgent({
    title: 'Owned Web document contract',
    dsl,
  })
  const agent = await agentAPI.fetchAgent(created.id)
  const saved =
    typeof agent.dsl === 'string' ? JSON.parse(agent.dsl) : agent.dsl
  assert.equal(
    saved.components['DocGenerator:combined'].obj.params
      .include_download_info_in_content,
    true,
  )
  console.log(JSON.stringify({ agent_id: created.id, paths }))
} else {
  assert.equal(mode, 'document-download')
  const file = JSON.parse(process.env.DOMAIN_ACCEPTANCE_ATTACHMENT || '{}')
  const { JSDOM } = createRequire(import.meta.url)('jsdom') as {
    JSDOM: new (
      html: string,
      options: { url: string },
    ) => { window: Window & typeof globalThis }
  }
  const dom = new JSDOM('<body></body>', { url: 'http://localhost/' })
  Object.defineProperty(globalThis, 'window', {
    value: dom.window,
    configurable: true,
  })
  Object.defineProperty(globalThis, 'document', {
    value: dom.window.document,
    configurable: true,
  })
  const { downloadRuntimeAttachment } =
    await import('../src/pages/agent/components/runtime-chat/download-runtime-attachment')
  let blob: Blob | undefined
  let clicked = false
  // Only the browser download sink is controlled; HTTP and binary decoding run unchanged.
  dom.window.URL.createObjectURL = (value: Blob | MediaSource) => {
    assert.ok(value instanceof Blob)
    blob = value
    return 'blob:owned-download'
  }
  dom.window.URL.revokeObjectURL = () => {}
  dom.window.HTMLAnchorElement.prototype.click = () => {
    clicked = true
  }
  await downloadRuntimeAttachment(file)
  assert.ok(clicked && blob)
  const bytes = Buffer.from(await blob.arrayBuffer())
  assert.equal(
    createHash('sha256').update(bytes).digest('hex'),
    process.env.DOMAIN_ACCEPTANCE_SHA256,
  )
  apiClient.setAuthToken(null)
  await assert.rejects(downloadRuntimeAttachment(file))
  console.log(
    JSON.stringify({
      sha256: createHash('sha256').update(bytes).digest('hex'),
      size: bytes.length,
      anonymous_denied: true,
      paths,
    }),
  )
}
