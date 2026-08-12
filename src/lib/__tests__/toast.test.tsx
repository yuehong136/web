import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, expect, test } from 'vitest'
import { Toaster } from 'sonner'
import { toast } from '@/lib/toast'

let cleanup: (() => void) | undefined

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)

const flushEffects = () => new Promise((resolve) => setTimeout(resolve, 0))

afterEach(() => {
  cleanup?.()
  cleanup = undefined
  toast.dismiss()
  document.body.innerHTML = ''
  Reflect.deleteProperty(globalThis, '__toastXssMarker')
})

test('renders untrusted toast messages as text instead of HTML', async () => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  cleanup = () => root.unmount()

  await act(async () => {
    root.render(<Toaster />)
    await flushEffects()
  })

  const maliciousMessage =
    '<img src=x onerror="globalThis.__toastXssMarker=true"><script>globalThis.__toastXssMarker=true</script>'

  await act(async () => {
    toast.error(maliciousMessage)
    await flushEffects()
  })

  expect(document.body.textContent).toContain(maliciousMessage)
  expect(document.body.querySelector('img')).toBeNull()
  expect(document.body.querySelector('script')).toBeNull()
  expect(Reflect.has(globalThis, '__toastXssMarker')).toBe(false)
})
