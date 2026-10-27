import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { llmAPI } from '@/api/llm'
import { useEnableLLM } from '@/hooks/use-llm-request'
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
  vi.spyOn(llmAPI, 'enableLlm').mockImplementation(async () => {
    enabled = false
  })
  let models!: ReturnType<typeof useSearchModels>
  let mutation!: ReturnType<typeof useEnableLLM>
  function Models({ open }: { open: boolean }) {
    models = useSearchModels(open)
    mutation = useEnableLLM()
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
    await mutation.enableLlm('Fixture', 'model', false)
  })
  await render(true)
  expect(list).toHaveBeenCalledTimes(2)
  expect(models.chatModelProviders.Fixture).toBeUndefined()
})
