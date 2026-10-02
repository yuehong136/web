// @vitest-environment jsdom
import React, { act, useLayoutEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ListCountInput } from '@/pages/agent/form/list-operations/count-input'
import { RenameAgentDialog } from '@/pages/agents/components/rename-agent-dialog'
import { useFieldEditorForm } from '@/pages/knowledge/metadata/hooks/use-field-editor-form'
import type { AgentFlow } from '@/types/agent'
import '@/locales/i18n'

let container: HTMLDivElement
let root: Root
beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})
function input(text: string, element = container.querySelector('input')!) {
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(element, text)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
it('keeps an invalid numeric draft until the external value changes', async () => {
  const onValueChange = vi.fn(),
    onValidityChange = vi.fn()
  const render = (value: number) =>
    act(async () =>
      root.render(
        <ListCountInput
          value={value}
          onValueChange={onValueChange}
          onValidityChange={onValidityChange}
        />,
      ),
    )
  await render(2)
  input('invalid')
  expect(onValueChange).not.toHaveBeenCalled()
  expect(onValidityChange).toHaveBeenLastCalledWith(false)
  await render(2)
  expect(container.querySelector('input')?.value).toBe('invalid')
  await render(5)
  expect(container.querySelector('input')?.value).toBe('5')
})
it('resets a rename draft when the dialog reopens or receives a different source title', async () => {
  const flow = { id: 'agent', title: 'Original' } as AgentFlow
  const render = (open: boolean, value = flow) =>
    act(async () =>
      root.render(
        <RenameAgentDialog
          open={open}
          flow={value}
          onOpenChange={vi.fn()}
          onConfirm={vi.fn()}
        />,
      ),
    )
  await render(true)
  input('Draft', document.querySelector('input')!)
  await render(true)
  expect(document.querySelector('input')?.value).toBe('Draft')
  await render(false)
  await render(true)
  expect(document.querySelector('input')?.value).toBe('Original')
  await render(true, { ...flow, title: 'Updated' })
  expect(document.querySelector('input')?.value).toBe('Updated')
})
let fieldForm: ReturnType<typeof useFieldEditorForm>
function FieldProbe({ open, field }: { open: boolean; field: string }) {
  const initialData = React.useMemo(() => ({ field, values: ['one'] }), [field])
  const form = useFieldEditorForm({
    open,
    initialData,
    existingKeys: ['duplicate'],
    onSave: vi.fn(),
    onClose: vi.fn(),
  })
  useLayoutEffect(() => {
    fieldForm = form
  })
  return <output>{form.formData.field}</output>
}
it('resets field validation and value drafts when a new editing session opens', async () => {
  await act(async () => root.render(<FieldProbe open field="first" />))
  act(() => fieldForm.handlers.fieldChange('duplicate'))
  expect(fieldForm.hasErrors).toBe(true)
  act(() => fieldForm.handlers.valueChange(0, 'draft'))
  await act(async () => root.render(<FieldProbe open={false} field="second" />))
  await act(async () => root.render(<FieldProbe open field="second" />))
  expect(fieldForm.formData.field).toBe('second')
  expect(fieldForm.tempValues).toEqual(['one'])
  expect(fieldForm.hasErrors).toBe(false)
})
