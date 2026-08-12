import React from 'react'
import { useTranslation } from 'react-i18next'
import { PageErrorState } from '@/components/patterns'

interface ErrorBoundaryState {
  hasError: boolean
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (retry: () => void) => React.ReactNode
  onRetry?: () => void
}

export const handleCaughtApplicationError = () => undefined

function DefaultErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full min-h-[320px] flex-col">
      <PageErrorState
        title={t('routeErrors.unexpected.title', '页面无法显示')}
        description={t(
          'routeErrors.unexpected.description',
          '页面遇到了意外问题，请重新加载。',
        )}
        retryLabel={t('routeErrors.actions.retry', '重新加载')}
        onRetry={onRetry}
      />
    </div>
  )
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.props.onRetry()
      return
    }
    this.setState({ hasError: false })
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.handleRetry)
      }

      return <DefaultErrorFallback onRetry={this.handleRetry} />
    }

    return this.props.children
  }
}

// 函数组件包装器
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (retry: () => void) => React.ReactNode,
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}
