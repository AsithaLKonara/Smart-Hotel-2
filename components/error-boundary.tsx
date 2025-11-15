'use client'

import React from 'react'
import { captureException } from '@/lib/monitoring'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    captureException(error, {
      componentStack: errorInfo.componentStack || '',
      errorBoundary: true,
      errorInfo: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    })
    
    // Always log to console for debugging (helpful in production too)
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} resetError={this.resetError} />
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Something went wrong</h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            We encountered an error while loading the page.
          </p>
          {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_SHOW_ERRORS === 'true') && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Error Details
              </summary>
              <pre className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-auto max-h-48">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={resetError}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary
