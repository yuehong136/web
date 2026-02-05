import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createLineBreakNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

function EnterKeyPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const removeListener = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event: KeyboardEvent | null) => {
        if (event?.shiftKey) {
          return false
        }

        const selection = $getSelection()
        if (selection && $isRangeSelection(selection)) {
          event?.preventDefault()
          selection.insertNodes([$createLineBreakNode()])
          return true
        }

        return false
      },
      COMMAND_PRIORITY_HIGH,
    )

    return () => {
      removeListener()
    }
  }, [editor])

  return null
}

export { EnterKeyPlugin }
