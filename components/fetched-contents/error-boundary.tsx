"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class FetchedContentsErrorBoundary extends React.Component<
  { children: React.ReactNode; onRetry?: () => void },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onRetry?: () => void }) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('FetchedContents Error Boundary caught an error:', error)
    console.error('Error details:', errorInfo)
    
    // Specific logging for the 'enabled' property error
    if (error.message.includes('Cannot set property enabled')) {
      console.error('ENABLED PROPERTY ERROR CAUGHT!')
      console.error('Stack trace:', error.stack)
      console.error('Component stack:', errorInfo.componentStack)
    }
    
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-center text-red-500 p-6">
          <FileText className="h-16 w-16 mb-4 text-red-300" />
          <h2 className="text-lg font-semibold mb-2">Something went wrong with the data grid</h2>
          <p className="text-sm mb-4 max-w-md">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={() => {
                this.setState({ hasError: false, error: null, errorInfo: null })
                this.props.onRetry?.()
              }} 
              variant="outline"
            >
              Try Again
            </Button>
            <details className="text-xs text-left bg-gray-100 p-2 rounded max-w-md">
              <summary className="cursor-pointer font-medium">Technical Details</summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
