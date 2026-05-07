import { loader } from '@monaco-editor/react'

let isConfigured = false

export function configureMonacoLoader() {
  if (isConfigured) return

  loader.config({ paths: { vs: '/vs' } })
  isConfigured = true
}
