import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { GroupedSelectWithSecondaryMenu } from '../components/select-with-secondary-menu'
import { setProductLanguage } from '@/locales/i18n'

vi.mock('../../hooks/use-get-begin-query', () => ({
  useBuildPromptVariableOptions: () => [
    {
      label: 'Inputs',
      options: [
        { label: 'Uploads', value: 'Begin:input@uploads', type: 'array<file>' },
        {
          label: 'Strings',
          value: 'Begin:input@strings',
          type: 'array<string>',
        },
        {
          label: 'Structured',
          value: 'Agent:previous@structured',
          type: 'object',
        },
      ],
    },
  ],
}))

vi.mock('../../hooks/use-build-structured-output', () => ({
  useShowSecondaryMenu: () => () => false,
  useFindAgentStructuredOutputLabel: () => () => undefined,
}))
let root: Root
let container: HTMLDivElement
beforeEach(async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  Element.prototype.scrollIntoView = vi.fn()
  await setProductLanguage('en-US')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})
it('searches duplicate labels while selecting the explicit variable identity', async () => {
  const onChange = vi.fn()
  await act(async () =>
    root.render(
      <GroupedSelectWithSecondaryMenu
        onChange={onChange}
        options={[
          {
            label: 'Variables',
            options: [
              { label: 'Same label', value: 'alpha.output' },
              { label: 'Same label', value: 'beta.output' },
              {
                label: 'Nested',
                value: 'object.output',
                children: [{ label: 'Leaf', value: 'object.leaf' }],
              },
            ],
          },
        ]}
      />,
    ),
  )
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[role="combobox"]')!.click(),
  )
  expect(
    [...document.querySelectorAll('[cmdk-item]')].map((item) =>
      item.getAttribute('data-value'),
    ),
  ).toEqual(['alpha.output', 'beta.output', 'object.output'])
  const input = document.querySelector<HTMLInputElement>('[cmdk-input]')!
  await act(async () => {
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    )!.set!.call(input, 'Same label')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  expect(document.querySelectorAll('[cmdk-item]')).toHaveLength(2)
  await act(async () =>
    document.querySelector<HTMLElement>('[data-value="beta.output"]')!.click(),
  )
  expect(onChange).toHaveBeenCalledExactlyOnceWith('beta.output')
})

it('offers array<File> in the actual Visual Input File field and stores the exact reference', async () => {
  const { QueryVariable } = await import('../components/query-variable')
  const { Form } = await import('@/components/ui/form')
  const { useForm } = await import('react-hook-form')
  let read!: () => string
  function VisualFileConsumer() {
    const form = useForm({ defaultValues: { visual_files_var: '' } })
    read = () => form.getValues('visual_files_var')
    return (
      <Form {...form}>
        <QueryVariable
          name="visual_files_var"
          label="Visual Input File"
          types={['file']}
        />
      </Form>
    )
  }
  await act(async () => root.render(<VisualFileConsumer />))
  await act(async () =>
    container.querySelector<HTMLButtonElement>('[role=combobox]')!.click(),
  )
  const values = [...document.querySelectorAll('[cmdk-item]')].map((item) =>
    item.getAttribute('data-value'),
  )
  expect(values).toContain('Begin:input@uploads')
  expect(values).toContain('Agent:previous@structured')
  expect(values).not.toContain('Begin:input@strings')
  await act(async () =>
    document
      .querySelector<HTMLElement>('[data-value="Begin:input@uploads"]')!
      .click(),
  )
  expect(read()).toBe('Begin:input@uploads')
})

it('limits File compatibility to exact file arrays and preserves null-safe structured entries and array boundaries', async () => {
  const {
    isQueryVariableTypeMatch: match,
    filterQueryVariableOptionGroupsByTypes: filter,
  } = await import('../components/query-variable-utils')
  for (const type of ['file', 'array<file>', ' Array < FiLe > '])
    expect(match(type, ['file'])).toBe(true)
  for (const type of [
    'array',
    'array<string>',
    'array<filename>',
    'array<array<file>>',
    'object',
    undefined,
  ])
    expect(match(type, ['file'])).toBe(false)
  expect(match('file', ['array<file>'])).toBe(false)
  expect(match('array<file>', ['array<string>'])).toBe(false)
  expect(
    filter(
      [
        {
          label: 'Malformed',
          title: 'Malformed',
          options: [
            { label: 'Empty', value: undefined as never, type: 'object' },
          ],
        },
      ],
      ['file'],
    ),
  ).toEqual([])
  const { NoDebugOperatorsList, Operator } = await import('../../constant')
  expect(NoDebugOperatorsList).toContain(Operator.Loop)
})
