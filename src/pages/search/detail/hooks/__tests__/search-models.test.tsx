import {
  useFetchRerankLLMs,
  rerankLLMsQueryKey,
} from '@/pages/knowledge/search-workbench/hooks/use-fetch-rerank-llms'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { llmAPI } from '@/api/llm'
import { useModelProviderMutation } from '@/hooks/use-model-provider-request'
import { modelProvidersAPI } from '@/api/llm-providers'
import { useSearchModels } from '../use-search-models'

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
  expect(models.chatModelProviders.Fixture).toBeUndefined()
})

it('invalidates the knowledge retrieval reranker inventory after a model mutation', async () => {
  let active = true
  const list = vi
    .spyOn(llmAPI, 'list')
    .mockImplementation(async () => ({
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
