import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import '@ant-design/x-markdown/dist/x-markdown.css'
import './index.css'
import App from './App.tsx'
import {
  ErrorBoundary,
  handleCaughtApplicationError,
} from '@/components/ui/error-boundary'
import { initTheme } from '@/themes'

// 初始化 i18n 国际化
import '@/locales/i18n'

// 初始化主题系统
initTheme()

createRoot(document.getElementById('root')!, {
  onCaughtError: handleCaughtApplicationError,
}).render(
  <StrictMode>
    <ErrorBoundary onRetry={() => window.location.reload()}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
