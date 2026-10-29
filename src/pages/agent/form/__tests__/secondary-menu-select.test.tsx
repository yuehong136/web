import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { GroupedSelectWithSecondaryMenu } from '../components/select-with-secondary-menu'
import { setProductLanguage } from '@/locales/i18n'

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
