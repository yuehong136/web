import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { TextNode, type EditorState, type LexicalEditor } from 'lexical'
import { useEffect } from 'react'
import { ProgrammaticTag } from './constant'
import { mergeLeadingVariablePathTextNode } from './variable-path-transform'

interface IProps {
  onChange: (
    editorState: EditorState,
    editor?: LexicalEditor,
    tags?: Set<string>,
  ) => void
  enablePathQueryAutoMerge?: boolean
}

export function VariableOnChangePlugin({
  onChange,
  enablePathQueryAutoMerge = true,
}: IProps) {
  // Access the editor through the LexicalComposerContext
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!enablePathQueryAutoMerge) {
      return undefined
    }

    return editor.registerNodeTransform(TextNode, (textNode) => {
      mergeLeadingVariablePathTextNode(textNode)
    })
  }, [editor, enablePathQueryAutoMerge])

  // Wrap our listener in useEffect to handle the teardown and avoid stale references.
  useEffect(() => {
    // most listeners return a teardown function that can be called to clean them up.
    return editor.registerUpdateListener(
      ({ editorState, tags, dirtyElements }) => {
        // Check if there is a "programmatic" tag
        const isProgrammaticUpdate = tags.has(ProgrammaticTag)

        // The onchange event is only triggered when the data is manually updated
        // Otherwise, the content will be displayed incorrectly.
        if (dirtyElements.size > 0 && !isProgrammaticUpdate) {
          onChange(editorState)
        }
      },
    )
  }, [editor, onChange])

  return null
}
