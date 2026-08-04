import assert from 'node:assert/strict'
import test from 'node:test'
import type { RequestConfig } from '../client'
import { apiClient } from '../client'
import { mcpAPI } from '../mcp'

type Call = {
  method: string
  endpoint: string
  data?: unknown
  config?: RequestConfig
}

test('MCP CRUD, import and connection tests use the RESTful API', async () => {
  const originalGet = apiClient.get
  const originalPost = apiClient.post
  const originalPut = apiClient.put
  const originalDelete = apiClient.delete
  const calls: Call[] = []

  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'GET', endpoint, config })
    if (endpoint === '/mcp/servers') {
      return { mcp_servers: [], total: 0 }
    }
    return { id: 'mcp/id' }
  }) as typeof apiClient.get
  apiClient.post = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'POST', endpoint, data, config })
    return endpoint.endsWith('/test') ? [] : { id: 'mcp/id', results: [] }
  }) as typeof apiClient.post
  apiClient.put = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'PUT', endpoint, data, config })
    return { id: 'mcp/id' }
  }) as typeof apiClient.put
  apiClient.delete = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'DELETE', endpoint, config })
    return true
  }) as typeof apiClient.delete

  try {
    await mcpAPI.listServers(
      { mcp_ids: ['mcp/id', 'mcp two'] },
      { keywords: 'demo', page: 2, page_size: 10, desc: false },
    )
    await mcpAPI.getServerDetail('mcp/id')
    await mcpAPI.createServer({
      name: 'server',
      server_type: 'sse',
      url: 'https://example.test/mcp',
    })
    await mcpAPI.updateServer({
      mcp_id: 'mcp/id',
      name: 'renamed',
    })
    await mcpAPI.deleteServers(['mcp/id', 'mcp two'])
    await mcpAPI.import({
      mcpServers: {
        server: { type: 'sse', url: 'https://example.test/mcp' },
      },
    })
    await mcpAPI.testConnection({
      url: 'https://example.test/mcp',
      server_type: 'sse',
    })
  } finally {
    apiClient.get = originalGet
    apiClient.post = originalPost
    apiClient.put = originalPut
    apiClient.delete = originalDelete
  }

  assert.deepEqual(
    calls.map((call) => [call.method, call.endpoint]),
    [
      ['GET', '/mcp/servers'],
      ['GET', '/mcp/servers/mcp%2Fid'],
      ['POST', '/mcp/servers'],
      ['PUT', '/mcp/servers/mcp%2Fid'],
      ['DELETE', '/mcp/servers/mcp%2Fid'],
      ['DELETE', '/mcp/servers/mcp%20two'],
      ['POST', '/mcp/servers/import'],
      ['POST', '/mcp/servers/preview/test'],
    ],
  )
  assert.deepEqual(calls[0]?.config?.params, {
    keywords: 'demo',
    page: 2,
    page_size: 10,
    desc: false,
    mcp_ids: 'mcp/id,mcp two',
  })
  assert.deepEqual(calls[1]?.config?.params, { mode: 'preview' })
  assert.deepEqual(calls[3]?.data, { name: 'renamed' })
  for (const call of calls) {
    assert.equal(call.config?.baseURL, 'http://localhost:8000/api')
  }
})

test('MCP batch export downloads each server and merges the configs', async () => {
  const originalGet = apiClient.get
  const calls: Call[] = []

  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'GET', endpoint, config })
    const name = endpoint.endsWith('mcp-1') ? 'one' : 'two'
    return {
      mcpServers: {
        [name]: {
          type: 'sse',
          url: `https://example.test/${name}`,
          name,
          authorization_token: '',
          tools: {},
        },
      },
    }
  }) as typeof apiClient.get

  try {
    const result = await mcpAPI.export({ mcp_ids: ['mcp-1', 'mcp-2'] })
    assert.deepEqual(Object.keys(result.mcpServers), ['one', 'two'])
  } finally {
    apiClient.get = originalGet
  }

  assert.deepEqual(
    calls.map((call) => call.endpoint),
    ['/mcp/servers/mcp-1', '/mcp/servers/mcp-2'],
  )
  assert.ok(calls.every((call) => call.config?.baseURL?.endsWith('/api')))
  assert.ok(calls.every((call) => call.config?.params?.mode === 'download'))
})

test('MCP tool management uses RESTful resource routes', async () => {
  const originalGet = apiClient.get
  const originalPost = apiClient.post
  const originalPut = apiClient.put
  const calls: Call[] = []

  apiClient.get = (async (endpoint: string, config?: RequestConfig) => {
    calls.push({ method: 'GET', endpoint, config })
    return [{ name: 'search', description: 'Search' }]
  }) as typeof apiClient.get
  apiClient.post = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'POST', endpoint, data, config })
    return { content: [{ text: 'ok' }], isError: false }
  }) as typeof apiClient.post
  apiClient.put = (async (
    endpoint: string,
    data?: unknown,
    config?: RequestConfig,
  ) => {
    calls.push({ method: 'PUT', endpoint, data, config })
    return {}
  }) as typeof apiClient.put

  try {
    const tools = await mcpAPI.listTools({
      mcp_ids: ['mcp-1', 'mcp two'],
      timeout: 3,
    })
    assert.deepEqual(Object.keys(tools), ['mcp-1', 'mcp two'])
    await mcpAPI.testTool({
      mcp_id: 'mcp-1',
      tool_name: 'search/web',
      arguments: { query: 'q' },
      timeout: 4,
    })
    await mcpAPI.cacheTools({ mcp_id: 'mcp-1', tools: [] })
  } finally {
    apiClient.get = originalGet
    apiClient.post = originalPost
    apiClient.put = originalPut
  }

  assert.deepEqual(
    calls.map((call) => [call.method, call.endpoint]),
    [
      ['GET', '/mcp/servers/mcp-1/tools'],
      ['GET', '/mcp/servers/mcp%20two/tools'],
      ['POST', '/mcp/servers/mcp-1/tools/search%2Fweb/test'],
      ['PUT', '/mcp/servers/mcp-1/tools'],
    ],
  )
  assert.deepEqual(calls[0]?.config?.params, { timeout: 3 })
  assert.deepEqual(calls[1]?.config?.params, { timeout: 3 })
  assert.deepEqual(calls[2]?.data, {
    arguments: { query: 'q' },
    timeout: 4,
  })
  assert.deepEqual(calls[3]?.data, { tools: [] })
  assert.ok(calls.every((call) => call.config?.baseURL?.endsWith('/api')))
})
