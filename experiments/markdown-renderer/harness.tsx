import {
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Streamdown } from 'streamdown'
import { code } from '@streamdown/code'
import { createMathPlugin } from '@streamdown/math'
import { mermaid } from '@streamdown/mermaid'
import { cjk } from '@streamdown/cjk'
import { StreamingXMarkdown } from '@/components/chat/streaming-x-markdown'
import {
  markdownConfig,
  useMarkdownComponents,
} from '@/components/chat/MarkdownCodeBlock'
import { createReferenceMarkerComponent } from '@/components/chat/ReferenceMarker'
import {
  MemoizedMarkdownArtifactLink,
  MemoizedMarkdownArtifactImage,
} from '@/components/chat/MarkdownArtifact'
import type { ReferenceChunk } from '@/utils/reference-replacer'
import { ensureLocaleLoaded, setProductLanguage } from '@/locales/i18n'
import '@/index.css'
import './experiment.css'
import { useMatchedFramePolicy } from './frame-policy'

await ensureLocaleLoaded('zh-CN', ['common', 'chat', 'sources'])
await setProductLanguage('zh-CN')
const math = createMathPlugin({ singleDollarTextMath: true })
const plugins = { code, math, mermaid, cjk }
const reference = {
  id: 'chunk-1',
  reference_index: 1,
  document_id: 'doc-1',
  document_name: '真实语料片段',
  content: '同语料引用片段',
  doc_type: 'text',
  similarity: 0.9,
} as unknown as ReferenceChunk
const currentOverrides = { sup: createReferenceMarkerComponent([reference]) }
const ReferenceSup = currentOverrides.sup
function plainChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number')
    return String(children)
  if (Array.isArray(children)) return children.map(plainChildren).join('')
  if (isValidElement<{ children?: ReactNode }>(children))
    return plainChildren(children.props.children)
  return ''
}
const candidateOverrides = {
  sup: ({ children }: { children?: ReactNode }) => (
    <ReferenceSup>{plainChildren(children)}</ReferenceSup>
  ),
  a: ({ node: _node, ...props }: { node?: unknown }) => (
    <MemoizedMarkdownArtifactLink {...props} />
  ),
  img: ({ node: _node, ...props }: { node?: unknown }) => (
    <MemoizedMarkdownArtifactImage {...props} />
  ),
}
const safeUrl = (url: string) => (/^(?:https?:|mailto:)/i.test(url) ? url : '')
const queryClient = new QueryClient()
function Candidate({
  content,
  streaming,
}: {
  content: string
  streaming: boolean
}) {
  const renderedContent = useMatchedFramePolicy(content, streaming)
  return (
    <Streamdown
      plugins={plugins}
      components={candidateOverrides as never}
      isAnimating={streaming}
      mode="streaming"
      urlTransform={safeUrl}
      allowedTags={{ sup: [] }}
      controls={{
        code: { copy: true, download: false },
        table: false,
        mermaid: false,
      }}
      mermaid={{ config: { securityLevel: 'strict' } }}
    >
      {renderedContent}
    </Streamdown>
  )
}

declare global {
  interface Window {
    rendererExperiment: {
      push: (content: string, streaming: boolean) => void
      leave: () => void
      state: () => { commits: number; active: boolean }
    }
    __rendererProbe?: unknown
  }
}

function Harness() {
  const candidate =
    new URLSearchParams(location.search).get('renderer') === 'streamdown'
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(true)
  const [active, setActive] = useState(true)
  const [clicks, setClicks] = useState(0)
  const commits = useRef(0)
  const mounted = useRef(true)
  const components = useMarkdownComponents(currentOverrides)
  useEffect(() => {
    window.rendererExperiment = {
      push: (next, running) => {
        if (!mounted.current) return
        commits.current += 1
        setContent(next)
        setStreaming(running)
      },
      leave: () => {
        mounted.current = false
        setActive(false)
      },
      state: () => ({
        commits: commits.current,
        active: mounted.current,
      }),
    }
    return () => {
      mounted.current = false
    }
  }, [])
  return (
    <main className="renderer-experiment">
      <header>
        <h1>
          {candidate
            ? 'Streamdown 2.7.1 candidate'
            : 'Current StreamingXMarkdown'}
        </h1>
        <button
          id="interaction"
          onClick={() => setClicks((value) => value + 1)}
        >
          Interaction {clicks}
        </button>
        <output id="click-count">{clicks}</output>
      </header>
      <article id="renderer" data-streaming={streaming}>
        {active &&
          (candidate ? (
            <Candidate content={content} streaming={streaming} />
          ) : (
            <StreamingXMarkdown
              paragraphTag="div"
              content={content}
              isStreaming={streaming}
              config={markdownConfig}
              components={components}
            />
          ))}
      </article>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Harness />
  </QueryClientProvider>,
)
