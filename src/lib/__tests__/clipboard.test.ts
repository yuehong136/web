import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { copyToClipboardWithFeedback } from '@/lib/clipboard'
import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'

const originalGlobals = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, 'navigator'),
  window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
  document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
}
const originalToastSuccess = toast.success
const originalToastError = toast.error

function setGlobal(name: 'navigator' | 'window' | 'document', value: unknown) {
  Object.defineProperty(globalThis, name, { configurable: true, value })
}

function restoreGlobal(
  name: 'navigator' | 'window' | 'document',
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) Object.defineProperty(globalThis, name, descriptor)
  else Reflect.deleteProperty(globalThis, name)
}

afterEach(() => {
  restoreGlobal('navigator', originalGlobals.navigator)
  restoreGlobal('window', originalGlobals.window)
  restoreGlobal('document', originalGlobals.document)
  toast.success = originalToastSuccess
  toast.error = originalToastError
})

test('copyToClipboard uses the Clipboard API in a secure context', async () => {
  let copiedText = ''
  setGlobal('window', { isSecureContext: true })
  setGlobal('navigator', {
    clipboard: { writeText: async (text: string) => void (copiedText = text) },
  })

  await copyToClipboard('secret-token')

  assert.equal(copiedText, 'secret-token')
})

test('copyToClipboard falls back when Clipboard API permission is denied', async () => {
  let legacyCopyCalled = false
  const container = { appendChild: () => undefined }
  const activeElement = { closest: () => container, focus: () => undefined }
  const textArea = {
    value: '',
    style: { cssText: '' },
    setAttribute: () => undefined,
    focus: () => undefined,
    select: () => undefined,
    setSelectionRange: () => undefined,
    remove: () => undefined,
  }
  setGlobal('window', { isSecureContext: true })
  setGlobal('navigator', {
    clipboard: { writeText: async () => Promise.reject(new Error('denied')) },
  })
  setGlobal('document', {
    activeElement,
    body: container,
    createElement: () => textArea,
    execCommand: () => (legacyCopyCalled = true),
  })

  await copyToClipboard('fallback-token')

  assert.equal(textArea.value, 'fallback-token')
  assert.equal(legacyCopyCalled, true)
})

test('copy feedback reports failure instead of a false success', async () => {
  let successMessage = ''
  let errorMessage = ''
  const container = { appendChild: () => undefined }
  const textArea = {
    value: '',
    style: { cssText: '' },
    setAttribute: () => undefined,
    focus: () => undefined,
    select: () => undefined,
    setSelectionRange: () => undefined,
    remove: () => undefined,
  }
  setGlobal('window', { isSecureContext: false })
  setGlobal('navigator', {})
  setGlobal('document', {
    activeElement: null,
    body: container,
    createElement: () => textArea,
    execCommand: () => false,
  })
  toast.success = ((message: string) => {
    successMessage = message
  }) as typeof toast.success
  toast.error = ((message: string) => {
    errorMessage = message
  }) as typeof toast.error

  const copied = await copyToClipboardWithFeedback(
    'not-copied',
    'Copied',
    'Copy failed',
  )

  assert.equal(copied, false)
  assert.equal(successMessage, '')
  assert.equal(errorMessage, 'Copy failed')
})
