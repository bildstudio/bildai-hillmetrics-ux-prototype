"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface TableErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class TableErrorBoundary extends React.Component<
  { children: React.ReactNode; onForceSafeMode: () => void },
  TableErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onForceSafeMode: () => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<TableErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 TABLE ERROR BOUNDARY CAUGHT ERROR:', error)
    console.error('📍 Error Info:', errorInfo)
    
    // Check if this is the 'enabled' property error
    if (error.message.includes('Cannot set property enabled')) {
      console.error('🎯 CONFIRMED: This is the enabled property error!')
      console.error('🛡️ FORCING SAFE MODE from Error Boundary')
      
      // Force safe mode through parent callback
      this.props.onForceSafeMode()
    }
    
    this.setState({ error })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-semibold">Table Rendering Error</h3>
          </div>
          <p className="text-sm text-red-700 mt-2">
            {this.state.error?.message || 'Unknown table error'}
          </p>
          <div className="mt-3 space-x-2">
            <Button 
              size="sm"
              onClick={() => {
                this.setState({ hasError: false, error: null })
                this.props.onForceSafeMode()
              }}
              variant="outline"
            >
              Retry in Safe Mode
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
