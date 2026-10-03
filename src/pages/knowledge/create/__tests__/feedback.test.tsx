// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { useCreateKnowledge } from '@/pages/knowledge/create/use-create-knowledge'
import i18n from '@/locales/i18n'

const createKnowledge = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-knowledge-request', () => ({
  useCreateKnowledge: () => ({ createKnowledge }),
}))
let root: Root
let container: HTMLDivElement
let form: ReturnType<typeof useCreateKnowledge>
const created = vi.fn()
const Probe = () => {
  const current = useCreateKnowledge({ onCreated: created })
  React.useEffect(() => {
    form = current
  }, [current])
  return (
    <>
      <output>{current.formData.name}</output>
      <p>{current.nameError}</p>
      <Toaster />
    </>
  )
}
const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeEach(async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  createKnowledge.mockReset()
  created.mockReset()
  await i18n.changeLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
  await act(async () => root.render(<Probe />))
})
afterEach(async () => {
  await act(async () => {
    toast.dismiss()
    await flush()
    root.unmount()
  })
  container.remove()
})
const fill = async () => {
  await act(async () => {
    form.handleNameChange('my_knowledge')
    form.handleModelSelect('embedding-model')
  })
}

it('shows successful creation immediately as a toast and runs the success callback', async () => {
  createKnowledge.mockResolvedValue({ kb_id: 'created-id' })
  await fill()
  await act(async () => {
    await form.submit()
    await flush()
  })
  expect(
    container.querySelector('[data-sonner-toast][data-type="success"]'),
  ).toBeTruthy()
  expect(created).toHaveBeenCalledExactlyOnceWith('created-id')
  expect(form.formData.name).toBe('')
})

it('preserves the draft and renders a safe error toast when creation fails', async () => {
  createKnowledge.mockRejectedValue(
    new Error('private upstream response and credential'),
  )
  await fill()
  await act(async () => {
    await form.submit()
    await flush()
  })
  expect(
    container.querySelector('[data-sonner-toast][data-type="error"]'),
  ).toBeTruthy()
  expect(document.body.textContent).not.toContain('private upstream')
  expect(form.formData.name).toBe('my_knowledge')
  expect(created).not.toHaveBeenCalled()
})

it('keeps validation errors next to the draft and never submits invalid input', async () => {
  await act(async () => {
    await form.submit()
    await flush()
  })
  expect(createKnowledge).not.toHaveBeenCalled()
  expect(container.querySelector('p')?.textContent).toBeTruthy()
  expect(
    container.querySelector('[data-sonner-toast][data-type="error"]'),
  ).toBeTruthy()
})
