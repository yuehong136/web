import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  buildSearchSessionFilename,
  buildSearchSessionMarkdown,
  canExportSearchSession,
  downloadSearchSessionMarkdown,
  type SearchSessionExportCopy,
} from '../search-session-export'
import {
  SearchExecutionMode,
  SearchExecutionPhase,
  SearchSourceMode,
  type SearchTurn,
} from '@/types/search'

const copy: SearchSessionExportCopy = {
  exportedAt: 'Exported at: Aug 13, 2026, 10:00 AM',
  round: (index) => `Round ${index}`,
  question: 'Question',
  answer: 'Answer',
  relatedQuestions: 'Related questions',
  noSummary: 'No summary is available for this round.',
}

const turnWithInternalFields: SearchTurn = {
  id: 'secret-turn-id',
  query: 'What changed?',
  executionMode: SearchExecutionMode.DEEP_RESEARCH,
  sourceMode: SearchSourceMode.KNOWLEDGE_BASE,
  summaryEnabled: true,
  relatedEnabled: true,
  mindmapEnabled: false,
  rerankEnabled: true,
  rerankModelId: 'secret-rerank-id',
  rerankModelName: 'Reranker',
  kbIdsSnapshot: ['secret-kb-id'],
  summary: 'Only the visible answer is exported.',
  thinking: 'secret-chain-of-thought',
  isStreaming: false,
  chunks: [
    {
      chunk_id: 'secret-chunk-id',
      text: 'secret-raw-chunk',
      doc_id: 'secret-document-id',
      docnm_kwd: 'secret-document-name',
      kb_id: 'secret-kb-id',
      similarity: 0.9,
      vector_similarity: 0.8,
      term_similarity: 0.7,
    },
  ],
  docAggs: [
    {
      doc_name: 'secret-document-name',
      doc_id: 'secret-document-id',
      count: 1,
    },
  ],
  relatedQuestions: ['What happens next?'],
  total: 1,
  phase: SearchExecutionPhase.COMPLETE,
  latencyMs: 123,
  errorMessage: 'secret-backend-error',
}

const exportInput = {
  appName: 'Research workspace',
  turns: [turnWithInternalFields],
  copy,
  now: new Date('2026-08-13T02:00:00.000Z'),
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
  document.body.replaceChildren()
})

describe('Search session Markdown export', () => {
  it('allows export only after every visible turn has stopped streaming', () => {
    expect(canExportSearchSession([])).toBe(false)
    expect(canExportSearchSession([{ isStreaming: false }])).toBe(true)
    expect(
      canExportSearchSession([{ isStreaming: false }, { isStreaming: true }]),
    ).toBe(false)
  })

  it('serializes only visible questions, answers and related questions', () => {
    const markdown = buildSearchSessionMarkdown(exportInput)

    expect(markdown).toContain('# Research workspace')
    expect(markdown).toContain('What changed?')
    expect(markdown).toContain('Only the visible answer is exported.')
    expect(markdown).toContain('- What happens next?')

    for (const secret of [
      'secret-turn-id',
      'secret-chain-of-thought',
      'secret-rerank-id',
      'secret-kb-id',
      'secret-chunk-id',
      'secret-raw-chunk',
      'secret-document-id',
      'secret-document-name',
      'secret-backend-error',
    ]) {
      expect(markdown).not.toContain(secret)
    }
  })

  it('removes thinking tags embedded in the summary', () => {
    const markdown = buildSearchSessionMarkdown({
      ...exportInput,
      turns: [
        {
          ...turnWithInternalFields,
          summary:
            '<thinking>private chain of thought</thinking>Visible answer',
        },
      ],
    })

    expect(markdown).toContain('Visible answer')
    expect(markdown).not.toContain('private chain of thought')
    expect(markdown).not.toContain('&lt;thinking&gt;')
  })

  it('keeps raw HTML and active Markdown links inert', () => {
    const markdown = buildSearchSessionMarkdown({
      ...exportInput,
      turns: [
        {
          ...turnWithInternalFields,
          query: '<script>alert(1)</script>',
          summary: '[open](javascript:alert(1))',
        },
      ],
    })

    expect(markdown).not.toContain('<script>')
    expect(markdown).not.toContain('[open](javascript:')
    expect(markdown).toContain('&lt;script&gt;')
    expect(markdown).toContain('\\[open\\](javascript-blocked:alert(1))')
  })

  it('builds a portable bounded filename', () => {
    const filename = buildSearchSessionFilename(
      ' CON / quarterly:* research? ',
      exportInput.now,
    )

    expect(filename).toBe('CON - quarterly- research-2026-08-13.md')
    expect(filename).not.toMatch(/[<>:"/\\|?*]/)
    expect(
      buildSearchSessionFilename('a'.repeat(100), exportInput.now).length,
    ).toBeLessThanOrEqual(78)
    expect(
      new TextEncoder().encode(
        buildSearchSessionFilename('🚀'.repeat(100), exportInput.now),
      ).byteLength,
    ).toBeLessThanOrEqual(255)
  })

  it('clicks the download link, removes it, then revokes the URL next task', () => {
    vi.useFakeTimers()
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:search-session')
    const revokeObjectURL = vi
      .spyOn(URL, 'revokeObjectURL')
      .mockImplementation(() => undefined)
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined)

    const result = downloadSearchSessionMarkdown(exportInput)

    expect(result.filename).toBe('Research workspace-2026-08-13.md')
    expect(result.content).toContain('Only the visible answer is exported.')
    expect(createObjectURL).toHaveBeenCalledOnce()
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob)
    expect(click).toHaveBeenCalledOnce()
    expect(document.querySelector('a[download]')).toBeNull()
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()

    expect(revokeObjectURL).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:search-session')
  })
})
