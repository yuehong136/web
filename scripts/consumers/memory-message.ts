import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { APIClient } from '../../src/api/client'
import { adaptAgentFlow } from '../../src/pages/agent/adapters/flow'
import { Operator } from '../../src/pages/agent/constant'
import {
  deserializeDslToGraph,
  serializeGraphToDsl,
} from '../../src/pages/agent/operators'
import type { AgentDsl, AgentFlow } from '../../src/types/agent'
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered)
  if (value !== null && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, child]) => [key, ordered(child)]),
    )
  return value
}
export interface MemoryMessageConsumerConfig {
  baseURL: string
  token: string
  agentId: string
  messageNodeId: string
  memoryIds: string[]
  structuredMemory?: boolean
  dsl?: AgentDsl
  ownedScratchConfirmed: true
  resultFile?: string
}
/** Persist an owned Message via the actual editor serializer and shared authenticated transport. */
export async function runMemoryMessageConsumer(
  config: MemoryMessageConsumerConfig,
) {
  assert.equal(config.ownedScratchConfirmed, true)
  const client = new APIClient(config.baseURL)
  client.setAuthToken(config.token.replace(/^Bearer\s+/i, ''))
  const route = `/agents/${encodeURIComponent(config.agentId)}`,
    options = { baseURL: `${config.baseURL}/api` }
  try {
    const original = await client.get<AgentFlow>(route, options)
    const originalDsl = config.dsl ?? adaptAgentFlow(original).dsl
    const graph = deserializeDslToGraph(originalDsl).graph
    const target = graph.nodes.find((node) => node.id === config.messageNodeId)
    assert.equal(target?.data.label, Operator.Message)
    assert.ok(target)
    const form: Record<string, unknown> = {
      ...(target.data.form as Record<string, unknown>),
      memory_ids: config.memoryIds,
    }
    if (config.structuredMemory === undefined) delete form.structured_memory
    else form.structured_memory = config.structuredMemory
    target.data = { ...target.data, form }
    const dsl = serializeGraphToDsl({ graph, baseDsl: originalDsl })
    await client.put(
      route,
      { title: original.title, dsl: JSON.stringify(dsl) },
      options,
    )
    const saved = await client.get<AgentFlow>(route, options)
    const reloaded = adaptAgentFlow(saved).dsl
    const persistedComponent = reloaded.components[config.messageNodeId]
    assert.ok(persistedComponent)
    const persisted = persistedComponent.obj.params
    assert.equal(persisted.structured_memory, config.structuredMemory === true)
    assert.deepEqual(persisted.memory_ids, config.memoryIds)
    const imported = JSON.parse(JSON.stringify(reloaded)) as AgentDsl
    const roundtrip = serializeGraphToDsl({
      graph: deserializeDslToGraph(imported).graph,
      baseDsl: imported,
    })
    assert.equal(
      roundtrip.components[config.messageNodeId]!.obj.params.structured_memory,
      config.structuredMemory === true,
    )
    assert.deepEqual(
      roundtrip.components[config.messageNodeId]!.obj.params.memory_ids,
      config.memoryIds,
    )
    assert.deepEqual(
      roundtrip.components[config.messageNodeId]!.obj.params.content,
      persisted.content,
    )
    const persistedDsl =
      typeof saved.dsl === 'string' ? JSON.parse(saved.dsl) : saved.dsl
    const persistedDslSha256 = createHash('sha256')
      .update(JSON.stringify(ordered(persistedDsl)))
      .digest('hex')
    return {
      passed: true,
      persistedDslSha256,
      agentId: config.agentId,
      messageNodeId: config.messageNodeId,
      structuredMemory: config.structuredMemory === true,
      memoryIds: config.memoryIds,
      reloaded: true,
      exportImportPreserved: true,
    }
  } finally {
    client.setAuthToken(null)
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  assert.ok(process.argv[2], 'A private owned consumer config is required')
  const config: MemoryMessageConsumerConfig = JSON.parse(
    readFileSync(process.argv[2], 'utf8'),
  )
  const result = await runMemoryMessageConsumer(config)
  if (config.resultFile)
    writeFileSync(config.resultFile, JSON.stringify(result, null, 2) + '\n', {
      flag: 'wx',
      mode: 0o600,
    })
  else console.log(JSON.stringify(result))
}
