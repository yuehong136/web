import {
  useFetchRerankLLMs,
  rerankLLMsQueryKey,
} from '@/pages/knowledge/search-workbench/hooks/use-fetch-rerank-llms'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { modelOptions } from '@/components/models/model-select-options'
import { llmAPI } from '@/api/llm'
import { apiClient } from '@/api/client'
import { useChatModelGroupedOptions } from '@/hooks/use-llm-request'
import { useModelProviderMutation } from '@/hooks/use-model-provider-request'
import { modelProvidersAPI } from '@/api/llm-providers'
import { normalizeSearchModels, useSearchModels } from '../use-search-models'

let root: Root
let container: HTMLDivElement
let client: QueryClient
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  client.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('refreshes cached search model choices after disabling a model while settings are closed', async () => {
  let enabled = true
  const list = vi.spyOn(llmAPI, 'list').mockImplementation(async () => ({
    Fixture: [
      {
        id: 'model@Fixture',
        fid: 'Fixture',
        llm_name: 'model',
        mdl_type: 'chat',
        status: enabled ? '1' : '0',
        available: enabled,
      },
    ],
  }))
  vi.spyOn(modelProvidersAPI, 'setModelStatus').mockImplementation(async () => {
    enabled = false
  })
  let models!: ReturnType<typeof useSearchModels>
  let mutation!: ReturnType<typeof useModelProviderMutation>
  function Models({ open }: { open: boolean }) {
    models = useSearchModels(open)
    mutation = useModelProviderMutation()
    return null
  }
  const render = async (open: boolean) => {
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Models open={open} />
        </QueryClientProvider>,
      ),
    )
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
  }

  await render(true)
  expect(models.chatModelProviders.Fixture.llm).toHaveLength(1)
  await render(false)
  await act(async () => {
    await mutation.mutateAsync(() =>
      modelProvidersAPI.setModelStatus('Fixture', 'instance', 1, false),
    )
  })
  await render(true)
  expect(list).toHaveBeenCalledTimes(2)
  expect(models.chatModelProviders.Fixture.llm[0]).toMatchObject({
    available: false,
  })
  expect(modelOptions(models.chatModelProviders, ['chat']).options).toEqual([])
})

it('invalidates the knowledge retrieval reranker inventory after a model mutation', async () => {
  let active = true
  const list = vi.spyOn(llmAPI, 'list').mockImplementation(async () => ({
    Fixture: active
      ? [
          {
            id: '17',
            llm_name: 'reranker',
            fid: 'Fixture',
            mdl_type: 'rerank',
            available: true,
            status: '1',
          },
        ]
      : [],
  }))
  vi.spyOn(modelProvidersAPI, 'setModelStatus').mockImplementation(async () => {
    active = false
  })
  let query!: ReturnType<typeof useFetchRerankLLMs>,
    mutation!: ReturnType<typeof useModelProviderMutation>
  function Harness() {
    query = useFetchRerankLLMs()
    mutation = useModelProviderMutation()
    return null
  }
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    )
  })
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
  expect(query.data).toHaveLength(1)
  expect(client.getQueryData(rerankLLMsQueryKey)).toHaveLength(1)
  await act(async () => {
    await mutation.mutateAsync(() =>
      modelProvidersAPI.setModelStatus('Fixture', 'instance', 17, false),
    )
  })
  await act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
  expect(list).toHaveBeenCalledTimes(2)
  expect(query.data).toEqual([])
})

it('refreshes warm chat choices after adding and removing a connection and isolates account changes', async () => {
  let rows: Awaited<ReturnType<typeof modelProvidersAPI.models>> = []
  vi.spyOn(modelProvidersAPI, 'models').mockImplementation(async () => rows)
  const model = {
    id: 27,
    reference: '27',
    provider_name: 'Ollama',
    provider_id: 'provider-owned',
    instance_id: 'owned',
    instance_name: 'local',
    name: 'vision-fixture',
    model_types: ['chat', 'image2text'] as const,
    status: 'active' as const,
    effective_status: 'active' as const,
    max_tokens: 0,
    is_tools: false,
  }
  let choices!: ReturnType<typeof useChatModelGroupedOptions>
  let mutation!: ReturnType<typeof useModelProviderMutation>
  function Harness() {
    choices = useChatModelGroupedOptions()
    mutation = useModelProviderMutation()
    return null
  }
  const flush = async () =>
    act(async () => new Promise((resolve) => setTimeout(resolve, 10)))
  await act(async () =>
    root.render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    ),
  )
  await flush()
  expect(choices.options).toEqual([])
  await act(async () => {
    await mutation.mutateAsync(async () => {
      rows = [{ ...model, model_types: [...model.model_types] }]
    })
  })
  await flush()
  expect(choices.options[0]?.options).toMatchObject([
    { value: '27', label: 'vision-fixture' },
  ])
  await act(async () => {
    await mutation.mutateAsync(async () => {
      rows = []
    })
  })
  await flush()
  expect(choices.options).toEqual([])
  const invalidate = vi.spyOn(client, 'invalidateQueries')
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  let result!: Promise<unknown>
  await act(async () => {
    result = mutation.mutateAsync(async () => pending)
    result.catch(() => {})
  })
  apiClient.setAuthToken('controlled-different-account')
  await act(async () => {
    release()
    await expect(result).rejects.toMatchObject({ name: 'AbortError' })
  })
  expect(invalidate).not.toHaveBeenCalled()
  apiClient.setAuthToken(null)
})

it('keeps exact references and connection labels separate in Search model adapters', () => {
  const result = normalizeSearchModels({
    Fixture: [
      {
        id: '56',
        name: 'same-model',
        llm_name: 'same-model · production',
        mdl_type: 'chat',
        available: true,
      },
      {
        id: '57',
        name: 'same-model',
        llm_name: 'same-model · testing',
        mdl_type: 'chat',
        available: true,
      },
      {
        id: '58',
        name: 'rerank-v3',
        llm_name: 'rerank-v3 · production',
        mdl_type: 'rerank',
        available: true,
      },
    ],
  })
  expect(
    modelOptions(result.chatModelProviders, ['chat']).options[0].options,
  ).toMatchObject([
    { value: '56', label: 'same-model · production' },
    { value: '57', label: 'same-model · testing' },
  ])
  expect(result.rerankModels[0]).toMatchObject({
    id: '58',
    llm_name: 'rerank-v3',
    display_name: 'rerank-v3 · production',
  })
})
