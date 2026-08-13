import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import '@ant-design/x-markdown/dist/x-markdown.css'
import '@/index.css'
import '@/locales/i18n'
import { Application } from '@/App'
import {
  ErrorBoundary,
  handleCaughtApplicationError,
} from '@/components/ui/error-boundary'
import type { ApplicationComposition } from '@/platform'
import { initTheme } from '@/themes'
import { ClientRuntime } from './runtime-selection'

function getApplicationRoot(): HTMLElement {
  const root = document.getElementById('root')
  if (!root) {
    throw new Error('Application root is unavailable.')
  }
  return root
}

function renderApplicationNode(node: ReactNode, runtime: ClientRuntime): void {
  document.documentElement.dataset.clientRuntime = runtime
  initTheme()

  createRoot(getApplicationRoot(), {
    onCaughtError: handleCaughtApplicationError,
  }).render(
    <StrictMode>
      <ErrorBoundary onRetry={() => window.location.reload()}>
        {node}
      </ErrorBoundary>
    </StrictMode>,
  )
}

export function mountApplication(
  composition: ApplicationComposition,
  runtime: ClientRuntime.WEB | ClientRuntime.DESKTOP,
): void {
  renderApplicationNode(<Application composition={composition} />, runtime)
}

export function mountFailure(node: ReactNode): void {
  renderApplicationNode(node, ClientRuntime.INCOMPATIBLE)
}
