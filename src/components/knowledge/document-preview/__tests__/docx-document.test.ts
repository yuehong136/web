import { describe, expect, it } from 'vitest'
import { renderDocxDocument, stepDocxZoom } from '../components/docx-document'

// Synthetic OOXML: landscape, wide table, CJK, explicit break, malicious link/altChunk.
const FIXTURE =
  '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'

describe('Word page renderer', () => {
  it('renders real OOXML completely and isolates document styles and unsafe content', async () => {
    const input = Uint8Array.from(Buffer.from(FIXTURE, 'base64')).buffer
    const html = await renderDocxDocument(input)
    const doc = new DOMParser().parseFromString(html, 'text/html')
    expect(doc.querySelectorAll('.docx-wrapper > section')).toHaveLength(2)
    expect(doc.body.textContent).toContain('Wide table right')
    expect(doc.body.textContent).toContain('FINAL CONTENT MARKER')
    expect(doc.body.textContent).toContain('中文')
    expect(doc.querySelector('table')).not.toBeNull()
    expect(doc.querySelector('a')?.hasAttribute('href')).toBe(false)
    expect(doc.querySelectorAll('script, iframe, object, embed')).toHaveLength(
      0,
    )
    expect(html).not.toContain('EVIL ALTCHUNK')
    expect(doc.querySelector('meta')?.content).toContain("default-src 'none'")
    expect(doc.head.querySelectorAll('style').length).toBeGreaterThan(1)
  })
  it('rejects legacy Word and empty inputs', async () => {
    await expect(renderDocxDocument(new ArrayBuffer(0))).rejects.toThrow()
    await expect(
      renderDocxDocument(Uint8Array.from([0xd0, 0xcf]).buffer),
    ).rejects.toThrow()
  })
  it('moves to the nearest zoom step from a non-step fit without skipping', () => {
    expect(stepDocxZoom(63, 1)).toBe(75)
    expect(stepDocxZoom(63, -1)).toBe(50)
    expect(stepDocxZoom(75, 1)).toBe(100)
    expect(stepDocxZoom(75, -1)).toBe(50)
    expect(stepDocxZoom(200, 1)).toBe(200)
    expect(stepDocxZoom(5, -1)).toBe(5)
  })
})
