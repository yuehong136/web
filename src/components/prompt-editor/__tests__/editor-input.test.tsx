// @vitest-environment jsdom

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  PASTE_COMMAND,
} from 'lexical'
import type { LexicalEditor } from 'lexical'
import { act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { EnterKeyPlugin } from '../enter-key-plugin'
import { PasteHandlerPlugin } from '../paste-handler-plugin'

it('retains Chinese composition and multiline paste with the prompt input plugins', async () => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.stubGlobal('DragEvent', class extends Event {})
  vi.stubGlobal('ClipboardEvent', class extends Event {})
  const caretRect = Object.getOwnPropertyDescriptor(
    Range.prototype,
    'getBoundingClientRect',
  )
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(),
  })
  let editor: LexicalEditor | undefined
  function CaptureEditor() {
    const [instance] = useLexicalComposerContext()
    useEffect(() => {
      editor = instance
    }, [instance])
    return null
  }
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  try {
    await act(async () => {
      root.render(
        <LexicalComposer
          initialConfig={{
            namespace: 'PromptInputTest',
            onError: (error) => {
              throw error
            },
          }}
        >
          <RichTextPlugin
            contentEditable={<ContentEditable />}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <EnterKeyPlugin />
          <PasteHandlerPlugin />
          <CaptureEditor />
        </LexicalComposer>,
      )
    })
    const instance = editor!
    const editable = container.querySelector<HTMLElement>('[contenteditable]')!
    await act(async () => {
      instance.update(
        () => {
          $getRoot()
            .clear()
            .append($createParagraphNode().append($createTextNode('开始')))
          $getRoot().selectEnd()
        },
        { discrete: true },
      )
      editable.focus()
    })
    await act(async () => {
      editable.dispatchEvent(
        new CompositionEvent('compositionstart', { bubbles: true }),
      )
    })
    expect(instance.isComposing()).toBe(true)
    await act(async () => {
      const text = editable.querySelector('[data-lexical-text]')!.firstChild!
      text.textContent = '开始中文'
      const selection = window.getSelection()!
      selection.collapse(text, '开始中文'.length)
      editable.dispatchEvent(
        new InputEvent('input', {
          bubbles: true,
          inputType: 'insertCompositionText',
          data: '中文',
          isComposing: true,
        }),
      )
      editable.dispatchEvent(
        new CompositionEvent('compositionend', { bubbles: true, data: '中文' }),
      )
    })
    expect(instance.isComposing()).toBe(false)
    expect(
      instance.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe('开始中文')

    await act(async () => {
      instance.dispatchCommand(
        PASTE_COMMAND,
        new InputEvent('beforeinput', { inputType: 'insertFromPaste' }),
      )
    })
    expect(
      instance.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe('开始中文')
    await act(async () => {
      const paste = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(paste, 'clipboardData', {
        value: { getData: () => '第一行\n第二行' },
      })
      editable.dispatchEvent(paste)
      expect(paste.defaultPrevented).toBe(true)
    })
    expect(
      instance.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe('开始中文第一行\n第二行')
  } finally {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
    if (caretRect)
      Object.defineProperty(Range.prototype, 'getBoundingClientRect', caretRect)
    else Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect')
  }
})
