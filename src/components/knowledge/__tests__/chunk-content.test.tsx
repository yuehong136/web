import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ChunkContent } from '../chunk-content'

let root: Root
let host: HTMLDivElement
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

it('keeps a table chunk a table and drops anything active', async () => {
  const html =
    '<table class="fixed inset-0"><thead><tr><th>Year</th><th colspan="2">Revenue</th></tr></thead>' +
    '<tbody><tr><td>2025</td><td onclick="alert(1)">1.2</td><td><em>up</em></td></tr></tbody></table>' +
    '<script>alert(1)</script><img src=x onerror="alert(1)"><a href="javascript:alert(1)">link</a>'
  await act(async () => root.render(<ChunkContent html={html} />))
  const content = host.querySelector('[data-slot="chunk-content"]')!
  const table = content.querySelector('table')
  expect(table).not.toBeNull()
  // Classes could borrow the app's layout utilities; they are dropped.
  expect(table?.getAttribute('class')).toBeNull()
  expect(content.querySelector('th[colspan="2"]')).not.toBeNull()
  expect(content.querySelector('em')?.textContent).toBe('up')
  expect(content.innerHTML).not.toMatch(/script|onclick|onerror|<img|<a\b/)
  expect(content.textContent).toContain('link')
})

it('clamps to the requested lines and marks hits', async () => {
  await act(async () =>
    root.render(<ChunkContent html="a <mark>hit</mark>" clamp={8} />),
  )
  const content = host.querySelector('[data-slot="chunk-content"]')!
  expect(content.className).toContain('line-clamp-8')
  expect(content.className).toContain('chunk-content-hits')
})

it('is the only chunk sanitising policy in the source', () => {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name)
      if (statSync(full).isDirectory()) {
        if (name !== '__tests__') walk(full)
      } else if (/\.(ts|tsx)$/.test(name)) files.push(full)
    }
  }
  walk(path.resolve('src'))
  const declaring = files
    .filter((file) => /ALLOWED_TAGS\s*:/.test(readFileSync(file, 'utf8')))
    .map((file) => path.relative(process.cwd(), file).replaceAll('\\', '/'))
  expect(declaring).toEqual(['src/components/knowledge/chunk-content.tsx'])
})
