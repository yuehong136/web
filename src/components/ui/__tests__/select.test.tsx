import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test, vi } from 'vitest'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select'

let cleanup: (() => void) | undefined

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  document.body.innerHTML = ''
})

const TestSelect = ({ onChange }: { onChange: (value: string) => void }) => {
  const [value, setValue] = useState('')

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        onChange(nextValue)
        setValue(nextValue)
      }}
    >
      <SelectTrigger data-testid="select-trigger">
        <SelectValue placeholder="Choose target" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="target-1" data-testid="select-option">
          Published agent
        </SelectItem>
      </SelectContent>
    </Select>
  )
}

test('selects a pointer-activated portal option before outside-click handling', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  const onChange = vi.fn<(value: string) => void>()

  cleanup = () => {
    root.unmount()
  }

  await act(async () => {
    root.render(<TestSelect onChange={onChange} />)
  })

  const trigger = container.querySelector<HTMLButtonElement>(
    '[data-testid="select-trigger"]',
  )
  expect(trigger).not.toBeNull()

  await act(async () => {
    trigger?.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  const option = document.body.querySelector<HTMLButtonElement>(
    '[data-testid="select-option"]',
  )
  expect(option).not.toBeNull()
  expect(
    option
      ?.closest('[data-select-content]')
      ?.classList.contains('pointer-events-auto'),
  ).toBe(true)

  await act(async () => {
    option?.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }))
  })

  expect(onChange).toHaveBeenCalledOnce()
  expect(onChange).toHaveBeenCalledWith('target-1')
  expect(trigger?.textContent).toContain('Published agent')
  expect(
    document.body.querySelector('[data-testid="select-option"]'),
  ).toBeNull()
})
