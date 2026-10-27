import { useEffect, useState } from 'react'
import { useShikiHighlighter } from 'react-shiki/core'
import {
  loadCodeHighlighter,
  type CodeHighlighter,
} from '@/components/chat/code-highlighter'
import { CODE_THEMES } from '@/components/chat/shiki-engine'

interface CodeHighlightProps {
  code: string
  language: string
  streaming: boolean
}
function PlainCode({ code }: { code: string }) {
  return (
    <pre className="m-0 overflow-x-auto px-space-md py-space-base text-sm leading-relaxed">
      <code className="font-mono text-text-primary">{code}</code>
    </pre>
  )
}
function HighlightedCode({
  highlighter,
  ...props
}: CodeHighlightProps & { highlighter: CodeHighlighter }) {
  const highlighted = useShikiHighlighter(
    props.code,
    props.language,
    CODE_THEMES,
    { highlighter, defaultColor: 'light', delay: props.streaming ? 120 : 0 },
  )
  return highlighted ?? <PlainCode code={props.code} />
}

/** Language loading never changes the owner or content of the code block. */
export function CodeHighlight(props: CodeHighlightProps) {
  const [loaded, setLoaded] = useState<{
    requested: string
    language: string
    highlighter: CodeHighlighter
  }>()
  useEffect(() => {
    let active = true
    void loadCodeHighlighter(props.language)
      .then((result) => {
        if (active) setLoaded({ requested: props.language, ...result })
      })
      .catch(() => {
        /* A failed/unknown grammar remains readable plain text. */
      })
    return () => {
      active = false
    }
  }, [props.language])
  return loaded?.requested === props.language ? (
    <HighlightedCode
      {...props}
      language={loaded.language}
      highlighter={loaded.highlighter}
    />
  ) : (
    <PlainCode code={props.code} />
  )
}
