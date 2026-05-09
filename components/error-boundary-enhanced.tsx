'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { safeExtractError } from './error-boundary'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: unknown, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: unknown | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: unknown): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    const { message, stack } = safeExtractError(error)
    const normalizedError = error instanceof Error ? error : new Error(message)
    if (stack && !normalizedError.stack) {
      normalizedError.stack = stack
    }

    // Log directly to Sentry client SDK
    const errorId = Sentry.captureException(normalizedError, {
      extra: {
        errorBoundary: true,
        errorInfo,
        componentStack: errorInfo.componentStack,
      },
    })

    this.setState({
      errorInfo,
      errorId: errorId || 'sentry-client-error-id',
    })

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // Log to console
    console.error('EnhancedErrorBoundary caught an error:', {
      message,
      stack: stack || normalizedError.stack,
      componentStack: errorInfo.componentStack,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, errorInfo, errorId } = this.state
      const showDetails = this.props.showDetails ?? process.env.NODE_ENV === 'development'
      const { message, stack } = safeExtractError(error)

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 px-4">
          <Card className="max-w-2xl w-full p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                We encountered an unexpected error. Our operations team has been notified.
              </p>
              {errorId && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Error ID: <code className="font-mono">{errorId}</code>
                </p>
              )}
            </div>

            {showDetails && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Bug className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Error Details
                  </h3>
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                  <p className="mb-2 whitespace-pre-wrap">
                    <strong>Message:</strong> {message}
                  </p>
                  {stack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-amber-600 dark:text-amber-500 hover:underline select-none">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-100 dark:bg-gray-900 rounded whitespace-pre-wrap">
                        {stack}
                      </pre>
                    </details>
                  )}
                  {errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-amber-600 dark:text-amber-500 hover:underline select-none">
                        Component Stack
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-40 p-2 bg-gray-100 dark:bg-gray-900 rounded whitespace-pre-wrap">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4 animate-spin-hover" />
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                variant="outline"
              >
                Reload Page
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </div>

            {errorId && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  If this problem persists, please contact support with the Error ID above.
                </p>
              </div>
            )}
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
