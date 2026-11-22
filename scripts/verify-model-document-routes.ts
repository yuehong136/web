/** Exercise production Web clients against integration-owned HTTP listeners. */
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { apiClient } from '../src/api/client'
import { agentAPI } from '../src/api/agent'
import { llmAPI } from '../src/api/llm'
import { createModelProvidersAPI } from '../src/api/llm-providers'
import { buildLocalModelParams } from '../src/pages/settings/model-providers/components/api-key-modal-utils'
import { buildInstancePayload } from '../src/pages/settings/model-providers/components/instance-payload'

const base = process.env.DOMAIN_ACCEPTANCE_BASE
const token = process.env.DOMAIN_ACCEPTANCE_TOKEN
const mode = process.env.DOMAIN_ACCEPTANCE_MODE
assert.ok(base && token && mode)
assert.ok(['127.0.0.1', 'localhost', '[::1]'].includes(new URL(base).hostname))
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
  assert.ok(
    ['127.0.0.1', 'localhost', '[::1]'].includes(
      new URL(providerBase).hostname,
    ),
  )
  const modelsAPI = createModelProvidersAPI(base)
  const flags: boolean[] = []
  const saved: Array<{ id: string; instance: string; is_tools: boolean }> = []
  for (const [index, enabled] of [false, true, false].entries()) {
    const instanceName = `combined-${index + 1}`
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
    const { instance } = buildInstancePayload(
      'Ollama',
      instanceName,
      'fixture-key',
      providerBase,
      params,
      '',
    )
    await modelsAPI.createInstance('Ollama', instance)
    const [providers, models, instances] = await Promise.all([
      llmAPI.getMyLLMs(),
      modelsAPI.models(),
      modelsAPI.instances('Ollama'),
    ])
    const selection = providers.Ollama.llm.find(
      (item) =>
        item.name === 'combined-fixture' && item.instance_name === instanceName,
    )
    const model = models.find((item) => item.id === selection?.id)
    assert.ok(selection && model)
    assert.match(model.id, /^[0-9a-f]{32}$/)
    assert.equal(model.reference, model.id)
    assert.equal(selection.reference, model.id)
    assert.deepEqual(model.model_types, ['chat'])
    assert.equal(model.is_tools, enabled)
    assert.equal(selection.is_tools, enabled)
    assert.equal(
      instances.find((item) => item.instance_name === instanceName)?.has_api_key,
      true,
    )
    assert.ok(!JSON.stringify({ providers, models, instances }).includes('fixture-key'))
    flags.push(model.is_tools)
    saved.push({ id: model.id, instance: instanceName, is_tools: model.is_tools })
  }
  const ids = saved.map((item) => item.id)
  assert.equal(new Set(ids).size, 3)
  apiClient.setAuthToken(null)
  await assert.rejects(modelsAPI.models())
  console.log(
    JSON.stringify({ flags, ids, models: saved, paths, anonymous_denied: true }),
  )
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
