// @vitest-environment jsdom
import * as React from 'react'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Toaster } from 'sonner'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { useCreateKnowledge } from '@/pages/knowledge/create/use-create-knowledge'
import i18n from '@/locales/i18n'
import { useQuickEdit } from '@/pages/knowledge/list/use-quick-edit'
import type { KnowledgeBase } from '@/types/api'

const createKnowledge = vi.hoisted(() => vi.fn())
const defaults = vi.hoisted(() => ({
  tenantInfo: null as { tenant_id: string; embd_id: string } | null,
}))
vi.mock('@/hooks/use-default-model-request', () => ({
  useDefaultModelRequest: () => defaults,
}))
const updateKnowledge = vi.hoisted(() => vi.fn())
vi.mock('@/hooks/use-knowledge-request', () => ({
  useCreateKnowledge: () => ({ createKnowledge }),
  useUpdateKnowledge: () => ({ updateKnowledge }),
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
  defaults.tenantInfo = null
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

it('submits Chinese and spaced names, and refuses names beyond the UTF-8 byte budget', async () => {
  createKnowledge.mockResolvedValue({ kb_id: 'created-id' })
  await act(async () => {
    form.handleNameChange('  中文 knowledge 2026  ')
    form.handleModelSelect('embedding-model')
  })
  await act(async () => {
    await form.submit()
  })
  expect(createKnowledge).toHaveBeenLastCalledWith(
    expect.objectContaining({ name: '中文 knowledge 2026' }),
  )
  createKnowledge.mockClear()
  await act(async () => {
    form.handleNameChange('中'.repeat(43))
    form.handleModelSelect('embedding-model')
  })
  await act(async () => {
    await form.submit()
  })
  expect(createKnowledge).not.toHaveBeenCalled()
  expect(container.querySelector('p')?.textContent).toContain('128 UTF-8 bytes')
})

it('quick edit uses the same byte budget and preserves pipeline ownership', async () => {
  let quick: ReturnType<typeof useQuickEdit>
  const onUpdated = vi.fn()
  const Probe = () => {
    const current = useQuickEdit({
      editingKnowledgeBase: {
        id: 'kb',
        pipeline_id: 'a'.repeat(32),
      } as KnowledgeBase,
      onUpdated,
    })
    React.useEffect(() => {
      quick = current
    }, [current])
    return null
  }
  updateKnowledge.mockReset().mockResolvedValue({})
  await act(async () => root.render(<Probe />))
  await act(async () => {
    await quick.handleQuickEditSubmit({
      name: '  中文库 - 2026  ',
      description: null,
    })
  })
  expect(updateKnowledge).toHaveBeenLastCalledWith({
    kb_id: 'kb',
    name: '中文库 - 2026',
    description: null,
  })
  expect(onUpdated).toHaveBeenCalledOnce()
  updateKnowledge.mockClear()
  await act(async () => {
    await quick.handleQuickEditSubmit({
      name: '中'.repeat(43),
      description: null,
    })
  })
  expect(updateKnowledge).not.toHaveBeenCalled()
})

it('backfills a late tenant embedding ID and submits that exact ID', async () => {
  await act(async () => form.handleNameChange('late default'))
  defaults.tenantInfo = { tenant_id: 'owner', embd_id: 'default@Provider' }
  await act(async () => root.render(<Probe />))
  expect(form.formData.embd_id).toBe('default@Provider')
  createKnowledge.mockResolvedValue({ kb_id: 'created-id' })
  await act(async () => form.submit())
  expect(createKnowledge).toHaveBeenCalledWith(
    expect.objectContaining({ embd_id: 'default@Provider' }),
  )
  expect(form.formData.name).toBe('')
  expect(form.formData.embd_id).toBe('default@Provider')
})

it('never overwrites a chosen or explicitly cleared model when defaults arrive', async () => {
  await act(async () => form.handleModelSelect('chosen@Provider'))
  defaults.tenantInfo = { tenant_id: 'owner', embd_id: 'default@Provider' }
  await act(async () => root.render(<Probe />))
  expect(form.formData.embd_id).toBe('chosen@Provider')
  await act(async () => form.handleModelSelect(null))
  defaults.tenantInfo = { ...defaults.tenantInfo, embd_id: 'new@Provider' }
  await act(async () => root.render(<Probe />))
  expect(form.formData.embd_id).toBe('')
})

it('clears a previous tenant draft and resets the model on reset or reopening', async () => {
  defaults.tenantInfo = { tenant_id: 'first', embd_id: 'first@Provider' }
  await act(async () => root.render(<Probe />))
  await fill()
  defaults.tenantInfo = { tenant_id: 'second', embd_id: 'second@Provider' }
  await act(async () => root.render(<Probe />))
  expect(form.formData.name).toBe('')
  expect(form.formData.embd_id).toBe('second@Provider')
  await fill()
  await act(async () => form.resetForm())
  expect(form.formData.embd_id).toBe('second@Provider')
  await fill()
  await act(async () => root.render(null))
  await act(async () => root.render(<Probe />))
  expect(form.formData.name).toBe('')
  expect(form.formData.embd_id).toBe('second@Provider')
})
