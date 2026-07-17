import type { OnMount } from '@monaco-editor/react'
import { useCallback, useEffect, useRef } from 'react'

type EditorInstance = Parameters<OnMount>[0]

export function useExpandedEditorFocus(isExpanded: boolean) {
  const expandedContentRef = useRef<HTMLDivElement | null>(null)
  const expandedEditorRef = useRef<EditorInstance | null>(null)
  const expandedFocusFrameRef = useRef<number | null>(null)

  const focusExpandedEditor = useCallback(() => {
    if (expandedFocusFrameRef.current !== null) {
      cancelAnimationFrame(expandedFocusFrameRef.current)
    }

    expandedFocusFrameRef.current = requestAnimationFrame(() => {
      expandedFocusFrameRef.current = null
      const editor = expandedEditorRef.current

      if (editor) {
        editor.layout()
        editor.focus()
        return
      }

      expandedContentRef.current?.focus()
    })
  }, [])

  const registerExpandedEditor = useCallback(
    (editor: EditorInstance) => {
      expandedEditorRef.current = editor
      focusExpandedEditor()
    },
    [focusExpandedEditor],
  )

  useEffect(() => {
    if (isExpanded) {
      return
    }

    if (expandedFocusFrameRef.current !== null) {
      cancelAnimationFrame(expandedFocusFrameRef.current)
      expandedFocusFrameRef.current = null
    }
    expandedEditorRef.current = null
  }, [isExpanded])

  useEffect(
    () => () => {
      if (expandedFocusFrameRef.current !== null) {
        cancelAnimationFrame(expandedFocusFrameRef.current)
      }
      expandedEditorRef.current = null
    },
    [],
  )

  return {
    expandedContentRef,
    focusExpandedEditor,
    registerExpandedEditor,
  }
}
