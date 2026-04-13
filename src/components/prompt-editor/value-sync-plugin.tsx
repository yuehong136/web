import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createLineBreakNode,
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
} from 'lexical'
import { useEffect, useMemo, useRef } from 'react'
import { ProgrammaticTag } from './constant'
import type { VariableOptionGroup } from './types'
import {
  buildVariableOptionLookup,
  buildVariableOptionSignature,
} from './utils'
import { $createVariableNode } from './variable-node'

function normalizeEditorValue(value?: string) {
  return value ?? ''
}

function parseLineContent(
  line: string,
  paragraph: ReturnType<typeof $createParagraphNode>,
  optionLookup: ReturnType<typeof buildVariableOptionLookup>,
) {
  const regex = /{([^}]*)}/g
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = regex.exec(line)) !== null) {
    const matchedValue = match[1]
    const index = match.index
    const matchedText = match[0]

    if (index > lastIndex) {
      paragraph.append($createTextNode(line.slice(lastIndex, index)))
    }

    const option = optionLookup[matchedValue]
    if (option) {
      paragraph.append(
        $createVariableNode(
          matchedValue,
          option.label,
          option.parentLabel,
          option.type,
          option.icon,
        ),
      )
    } else {
      paragraph.append($createTextNode(matchedText))
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < line.length) {
    paragraph.append($createTextNode(line.slice(lastIndex)))
  }
}

function parseTextToNodes(
  value: string,
  optionLookup: ReturnType<typeof buildVariableOptionLookup>,
) {
  const paragraph = $createParagraphNode()
  const lines = value.split('\n')

  lines.forEach((line, index) => {
    if (line) {
      parseLineContent(line, paragraph, optionLookup)
    }

    if (index < lines.length - 1) {
      paragraph.append($createLineBreakNode())
    }
  })

  return paragraph
}

type ValueSyncPluginProps = {
  value?: string
  options?: VariableOptionGroup[]
}

export function ValueSyncPlugin({
  value,
  options = [],
}: ValueSyncPluginProps) {
  const [editor] = useLexicalComposerContext()
  const previousValue = useRef('')
  const previousOptionSignature = useRef('')
  const optionLookup = useMemo(() => buildVariableOptionLookup(options), [options])
  const optionSignature = useMemo(
    () => buildVariableOptionSignature(options),
    [options],
  )

  // Track user edits so echo-back value props are recognized and skipped.
  // Without this, typing triggers onChange → parent echoes value back →
  // ValueSyncPlugin re-parses → cursor jumps to end.
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, tags }) => {
      if (tags.has(ProgrammaticTag)) return

      editorState.read(() => {
        const text = $getRoot().getTextContent()
        if (text !== previousValue.current) {
          previousValue.current = text
        }
      })
    })
  }, [editor])

  useEffect(() => {
    const nextValue = normalizeEditorValue(value)
    const valueChanged = nextValue !== previousValue.current
    const optionsChanged = optionSignature !== previousOptionSignature.current

    if (!valueChanged && !optionsChanged) {
      return
    }

    const currentValue = editor.getEditorState().read(() =>
      $getRoot().getTextContent(),
    )

    // If the editor already has the correct text and only the value prop
    // echoed back (not an options change), just update the ref and skip.
    if (currentValue === nextValue && !optionsChanged) {
      previousValue.current = nextValue
      return
    }

    editor.update(
      () => {
        const paragraph = parseTextToNodes(nextValue, optionLookup)
        $getRoot().clear().append(paragraph)
        if ($isRangeSelection($getSelection())) {
          $getRoot().selectEnd()
        }
      },
      { tag: ProgrammaticTag },
    )
    previousValue.current = nextValue
    previousOptionSignature.current = optionSignature
  }, [editor, optionLookup, optionSignature, value])

  return null
}
