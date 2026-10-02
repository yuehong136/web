// @vitest-environment jsdom
import { act, StrictMode, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useShareStartup } from '../use-share-startup'
import { parseAgentShareAccess } from '../access'
import type { AgentShareSummary } from '@/types/agent'
const access = parseAgentShareAccess(
  new URLSearchParams('shared_id=first&auth=test'),
)
let root: Root
let startup: ReturnType<typeof useShareStartup>
const submit = vi.fn().mockResolvedValue(undefined)
const committed: Array<ReturnType<typeof useShareStartup>> = []
function Probe({
  id = 'first',
  inputs,
  task = true,
  webhook = false,
  running = false,
}: {
  id?: string
  inputs?: AgentShareSummary['inputs']
  task?: boolean
  webhook?: boolean
  running?: boolean
}) {
  const value = useShareStartup({
    access: id === 'first' ? access : { ...access, agentId: id },
    inputs,
    inputCount: Object.keys(inputs ?? {}).length,
    title: 'Test',
    isTaskMode: task,
    isWebhookMode: webhook,
    runner: { submit, isRunning: running },
    startTaskMessage: 'Start',
  })
  useLayoutEffect(() => {
    startup = value
    committed.push(value)
  })
  return null
}
beforeEach(() => {
  Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
  root = createRoot(document.createElement('div'))
  submit.mockClear()
  committed.length = 0
})
afterEach(() => act(() => root.unmount()))
it('starts an empty task once across StrictMode and repeated renders', async () => {
  await act(async () =>
    root.render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    ),
  )
  await act(async () =>
    root.render(
      <StrictMode>
        <Probe running />
      </StrictMode>,
    ),
  )
  await act(async () =>
    root.render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    ),
  )
  expect(submit).toHaveBeenCalledTimes(1)
  expect(submit.mock.calls[0][0]).toMatchObject({
    query: '',
    values: {},
    files: [],
  })
})
it('prompts for inputs before committing and preserves edits after closing the prompt', async () => {
  const inputs = {
    name: { type: 'text', value: 'initial' },
  } as AgentShareSummary['inputs']
  await act(async () => root.render(<Probe inputs={inputs} />))
  expect(committed[0].parameterDialogOpen).toBe(true)
  expect(startup.formValues.name).toBe('initial')
  await act(async () => {
    startup.setFormValues({ name: 'edited' })
    startup.setParameterDialogOpen(false)
  })
  expect(startup.parameterDialogOpen).toBe(false)
  expect(startup.formValues.name).toBe('edited')
  expect(submit).not.toHaveBeenCalled()
})
it('starts the next asset independently and supports an explicit reset', async () => {
  await act(async () => root.render(<Probe />))
  await act(async () => root.render(<Probe id="second" />))
  expect(submit).toHaveBeenCalledTimes(2)
  await act(async () => startup.resetAutomaticTask())
  expect(submit).toHaveBeenCalledTimes(3)
})
it('does not auto-run conversation or webhook modes', async () => {
  await act(async () => root.render(<Probe task={false} />))
  await act(async () => root.render(<Probe webhook />))
  expect(submit).not.toHaveBeenCalled()
})
