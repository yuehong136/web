import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { PreferenceChoiceGroup } from '../preference-choice-group'

const choices = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
  { value: 'ko-KR', label: '한국어' },
] as const

let root: Root
let host: HTMLDivElement

function Group({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState<string>('zh-CN')
  return (
    <PreferenceChoiceGroup
      label="Language"
      value={value}
      choices={choices}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    />
  )
}

beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})

afterEach(async () => {
  await act(async () => root.unmount())
  host.remove()
  vi.unstubAllGlobals()
})

it('keeps each visually hidden radio positioned inside its own card', async () => {
  await act(async () => root.render(<Group onChange={() => undefined} />))
  const radios = host.querySelectorAll<HTMLInputElement>('input[type=radio]')
  expect(radios).toHaveLength(choices.length)
  for (const radio of radios) {
    // sr-only is absolutely positioned. Without a positioned card it lands
    // against an ancestor outside the scrolling page, and focusing it on
    // click scrolls the whole app shell away.
    expect(radio.classList.contains('sr-only')).toBe(true)
    const card = radio.closest('label')!
    expect(card.htmlFor).toBe(radio.id)
    expect(card.classList.contains('relative')).toBe(true)
  }
})

it('selects through the card with native radio semantics', async () => {
  const onChange = vi.fn()
  await act(async () => root.render(<Group onChange={onChange} />))
  const card = [...host.querySelectorAll('label')].find((label) =>
    label.textContent?.includes('한국어'),
  )!
  await act(async () => card.click())
  expect(onChange).toHaveBeenCalledWith('ko-KR')
  const checked = host.querySelector<HTMLInputElement>('input:checked')!
  expect(checked.value).toBe('ko-KR')
  expect(
    new Set(
      [...host.querySelectorAll<HTMLInputElement>('input')].map((i) => i.name),
    ).size,
  ).toBe(1)
})
