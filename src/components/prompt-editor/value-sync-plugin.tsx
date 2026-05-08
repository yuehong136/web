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
import { useFindAgentStructuredOutputLabel } from '@/pages/agent/hooks/use-build-structured-output'
import { ProgrammaticTag } from './constant'
import type { VariableOptionGroup, VariableOptionItem } from './types'
import {
  buildVariableOptionLookup,
  buildVariableOptionSignature,
  flattenVariableOptions,
} from './utils'
import { $createVariableNode } from './variable-node'

function normalizeEditorValue(value?: string) {
  return value ?? ''
}

type StructuredResolver = (
  value: string,
  flatOptions: VariableOptionItem[],
) => VariableOptionItem | undefined

function parseLineContent(
  line: string,
  paragraph: ReturnType<typeof $createParagraphNode>,
  optionLookup: ReturnType<typeof buildVariableOptionLookup>,
  flatOptions: VariableOptionItem[],
  resolveStructured: StructuredResolver,
) {
  const regex = /{([^}]*)}/g
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = regex.exec(line)) !== null) {
    const matchedValue = match[1]
    const index = match.index
    const matchedText = match[0]
    if (!matchedValue) {
      continue
    }

    if (index > lastIndex) {
      paragraph.append($createTextNode(line.slice(lastIndex, index)))
    }

    const option =
      optionLookup[matchedValue] ?? resolveStructured(matchedValue, flatOptions)
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
  flatOptions: VariableOptionItem[],
  resolveStructured: StructuredResolver,
) {
  const paragraph = $createParagraphNode()
  const lines = value.split('\n')

  lines.forEach((line, index) => {
    if (line) {
      parseLineContent(
        line,
        paragraph,
        optionLookup,
        flatOptions,
        resolveStructured,
      )
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

export function ValueSyncPlugin({ value, options = [] }: ValueSyncPluginProps) {
  const [editor] = useLexicalComposerContext()
  const previousValue = useRef('')
  const previousOptionSignature = useRef('')
  const findAgentStructuredOutputLabel = useFindAgentStructuredOutputLabel()

  const optionLookup = useMemo(
    () => buildVariableOptionLookup(options),
    [options],
  )
  const flatOptions = useMemo(
    () => flattenVariableOptions(options) as VariableOptionItem[],
    [options],
  )
  const optionSignature = useMemo(
    () => buildVariableOptionSignature(options),
    [options],
  )

  const resolveStructured = useMemo<StructuredResolver>(
    () => (value, flat) => {
      const resolved = findAgentStructuredOutputLabel(value, flat) as
        | VariableOptionItem
        | undefined
      return resolved && typeof resolved.label === 'string'
        ? resolved
        : undefined
    },
    [findAgentStructuredOutputLabel],
  )

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

    const currentValue = editor
      .getEditorState()
      .read(() => $getRoot().getTextContent())

    if (currentValue === nextValue && !optionsChanged) {
      previousValue.current = nextValue
      return
    }

    editor.update(
      () => {
        const paragraph = parseTextToNodes(
          nextValue,
          optionLookup,
          flatOptions,
          resolveStructured,
        )
        $getRoot().clear().append(paragraph)
        if ($isRangeSelection($getSelection())) {
          $getRoot().selectEnd()
        }
      },
      { tag: ProgrammaticTag },
    )
    previousValue.current = nextValue
    previousOptionSignature.current = optionSignature
  }, [
    editor,
    flatOptions,
    optionLookup,
    optionSignature,
    resolveStructured,
    value,
  ])

  return null
}
