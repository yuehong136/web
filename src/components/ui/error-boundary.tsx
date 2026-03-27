import React from 'react'
import { PageErrorState } from '@/components/patterns'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: (error: Error, retry: () => void) => React.ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.handleRetry)
      }

      return (
        <div className="flex h-full min-h-[320px] flex-col">
          <PageErrorState
            title="出现了一个错误"
            description={this.state.error?.message || '应用程序遇到了意外错误'}
            onRetry={this.handleRetry}
          />
          {process.env.NODE_ENV === 'development' && this.state.error ? (
            <div className="px-space-lg pb-space-lg">
              <details className="rounded-radius-lg border border-border-subtle bg-background-subtle p-space-base">
                <summary className="cursor-pointer text-xs text-text-secondary">
                  错误详情 (开发模式)
                </summary>
                <pre className="mt-space-sm overflow-auto rounded-radius-md bg-background-surface p-space-sm text-xs text-text-secondary">
                  {this.state.error.stack}
                </pre>
              </details>
            </div>
          ) : null}
        </div>
      )
    }

    return this.props.children
  }
}

// 函数组件包装器
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: (error: Error, retry: () => void) => React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
} 
