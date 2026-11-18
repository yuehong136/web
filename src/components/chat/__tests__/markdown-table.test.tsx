import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  markdownConfig,
  markdownStreamingComponents,
} from '../MarkdownCodeBlock'
import { StreamingXMarkdown } from '../streaming-x-markdown'
import {
  copyTableRows,
  readTableRows,
  tableToCsv,
  tableToHtml,
  tableToTsv,
} from '../table-data'

const TABLE = [
  '| Period | Outcome |',
  '| --- | :---: |',
  '| 1934-10 | Left the base, "moved" west |',
  '| 1935-01 | =SUM(A1) |',
  '| 1935-05 | -12.5 |',
].join('\n')

describe('answer tables', () => {
  let container: HTMLDivElement
  let root: Root
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
  async function render(content: string, streaming = false) {
    await act(async () =>
      root.render(
        <StreamingXMarkdown
          content={content}
          isStreaming={streaming}
          config={markdownConfig}
          components={markdownStreamingComponents}
        />,
      ),
    )
    await act(async () => {
      await new Promise(requestAnimationFrame)
    })
  }

  it('renders a real table inside a named, focusable scroll frame', async () => {
    await render(TABLE)
    const frame = container.querySelector('.chat-table > .chat-table-scroll')
    expect(frame?.tagName).toBe('SECTION')
    expect(frame?.getAttribute('aria-label')).toBeTruthy()
    expect(frame?.getAttribute('tabindex')).toBe('0')
    const table = frame?.querySelector(':scope > table')
    expect(table?.querySelectorAll('thead th')).toHaveLength(2)
    expect(table?.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(
      container.querySelectorAll('.chat-table-actions button'),
    ).toHaveLength(3)
  })

  it('exports the cell text as TSV, CSV and a bare HTML table', async () => {
    await render(TABLE)
    const rows = readTableRows(container.querySelector('table')!)
    expect(rows[0]).toEqual(['Period', 'Outcome'])
    expect(tableToTsv(rows).split('\n')[1]).toBe(
      '1934-10\tLeft the base, "moved" west',
    )
    // Quoted where needed; a formula becomes text, a signed number does not.
    expect(tableToCsv(rows).split('\r\n')).toEqual([
      'Period,Outcome',
      '1934-10,"Left the base, ""moved"" west"',
      "1935-01,'=SUM(A1)",
      '1935-05,-12.5',
    ])
    expect(tableToHtml([['a<b'], ['1 & 2']])).toBe(
      '<table><thead><tr><th>a&lt;b</th></tr></thead><tbody><tr><td>1 &amp; 2</td></tr></tbody></table>',
    )
  })

  it('falls back to plain text when rich copy is unavailable', async () => {
    const copyText = vi.fn(async () => {})
    await copyTableRows(
      [
        ['a', 'b'],
        ['1', '2'],
      ],
      copyText,
    )
    expect(copyText).toHaveBeenCalledWith('a\tb\n1\t2')
  })
})
