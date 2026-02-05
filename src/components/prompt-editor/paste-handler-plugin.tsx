import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import type { LexicalNode } from 'lexical'
import {
  $createLineBreakNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  PASTE_COMMAND,
} from 'lexical'
import { useEffect } from 'react'

/**
 * 处理粘贴事件的插件。
 * 将带有换行符的文本正确转换为 TextNode 和 LineBreakNode，
 * 避免创建额外的段落边界导致换行符重复。
 */
function PasteHandlerPlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    const removeListener = editor.registerCommand(
      PASTE_COMMAND,
      (clipboardEvent: ClipboardEvent) => {
        const clipboardData = clipboardEvent.clipboardData
        if (!clipboardData) {
          return false
        }

        const text = clipboardData.getData('text/plain')
        if (!text) {
          return false
        }

        // 处理带有换行符的文本
        if (text.includes('\n')) {
          editor.update(() => {
            const selection = $getSelection()
            if (selection && $isRangeSelection(selection)) {
              // 构建节点数组（TextNode 和 LineBreakNode）
              // 直接将节点插入选区，避免创建额外的段落边界导致换行符重复
              const nodes: LexicalNode[] = []
              const lines = text.split('\n')

              lines.forEach((lineText, index) => {
                if (lineText) {
                  nodes.push($createTextNode(lineText))
                }

                // 在行之间添加 LineBreakNode（不在最后一行之后）
                if (index < lines.length - 1) {
                  nodes.push($createLineBreakNode())
                }
              })

              selection.insertNodes(nodes)
            }
          })

          // 阻止默认粘贴行为
          clipboardEvent.preventDefault()
          return true
        }

        // 如果没有换行符，使用默认行为
        return false
      },
      4,
    )

    return () => {
      removeListener()
    }
  }, [editor])

  return null
}

export { PasteHandlerPlugin }
