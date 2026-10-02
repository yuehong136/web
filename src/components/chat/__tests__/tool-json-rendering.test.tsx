import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ToolCallDisplay } from '@/components/chat/ToolCallDisplay'
import ToolCallRenderer from '@/components/chat/ToolCallRenderer'
import { parseToolJsonObject } from '@/components/chat/tool-json'

// Exercise the real CodeBlock's plain-text fallback; highlighting is checked
// in the browser because react-shiki's external CSS cannot load in Node.
vi.mock('react-shiki', () => ({
  useShikiHighlighter: () => undefined,
  createJavaScriptRegexEngine: () => ({}),
}))

let root: Root
let container: HTMLDivElement
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})
afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
})

it('accepts only structured JSON and leaves incomplete text or scalars to text rendering', () => {
  expect(parseToolJsonObject('{"count":2}')).toEqual({ count: 2 })
  expect(parseToolJsonObject('[{"count":2}]')).toEqual([{ count: 2 }])
  for (const text of [
    '{"count":',
    'null',
    'true',
    '12',
    '"plain"',
    'ordinary text',
  ]) {
    expect(parseToolJsonObject(text)).toBeUndefined()
  }
})

it.each(['display', 'renderer'] as const)(
  '%s keeps structured, malformed and hostile content as visible tool data',
  async (kind) => {
    const hostile = '<img src=x onerror=alert(1)><script>tool-data</script>'
    for (const result of [
      JSON.stringify({ output: hostile }),
      '{"incomplete":',
      hostile,
      JSON.stringify([hostile]),
    ]) {
      const argumentsValue = { query: JSON.stringify({ nested: hostile }) }
      await act(async () =>
        root.render(
          kind === 'display' ? (
            <ToolCallDisplay
              toolCalls={[
                {
                  id: 'tool-fixture',
                  tool_name: 'inspect',
                  server_name: 'fixture',
                  input: argumentsValue,
                  output: result,
                  status: 'success',
                  timestamp: '2026-10-02T08:00:00Z',
                },
              ]}
            />
          ) : (
            <ToolCallRenderer
              toolCalls={[
                {
                  id: 'tool-fixture',
                  name: 'inspect',
                  arguments: argumentsValue,
                  result,
                  status: 'success',
                  timestamp: '2026-10-02T08:00:00Z',
                },
              ]}
            />
          ),
        ),
      )
      if (kind === 'display') {
        const trigger = container.querySelector<HTMLElement>(
          '[aria-expanded="false"]',
        )
        if (trigger) await act(async () => trigger.click())
      }
      expect(container.textContent).toContain(hostile)
      if (result === '{"incomplete":')
        expect(container.textContent).toContain(result)
      expect(container.querySelector('img,script')).toBeNull()
    }
  },
)

it('shows structured long results in the full-result dialog', async () => {
  const value = 'detail '.repeat(80)
  await act(async () =>
    root.render(
      <ToolCallDisplay
        toolCalls={[
          {
            id: 'long-fixture',
            tool_name: 'inspect',
            server_name: 'fixture',
            input: {},
            output: JSON.stringify({ detail: value }),
            status: 'success',
            timestamp: '2026-10-02T08:00:00Z',
          },
        ]}
      />,
    ),
  )
  await act(async () =>
    container.querySelector<HTMLElement>('[aria-expanded="false"]')?.click(),
  )
  const open = Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes('完整结果'),
  )
  expect(open).toBeDefined()
  await act(async () => open?.click())
  expect(document.querySelector('dialog[open]')?.textContent).toContain(
    value.trim(),
  )
})
