"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, Loader2, XCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface TrendPoint {
  date: Date
  success: number
  active: number
  failed: number
}

interface TrendPointDetailPanelProps {
  isOpen: boolean
  onClose: () => void
  point: TrendPoint | null
  trendType: 'fetching' | 'processing'
  onNavigate: (tab: string, opts?: { date?: string; status?: string }) => void
}

export default function TrendPointDetailPanel({
  isOpen,
  onClose,
  point,
  trendType,
  onNavigate
}: TrendPointDetailPanelProps) {
  const [metadata, setMetadata] = useState<{ totalItems: number } | null>(null)

  useEffect(() => {
    if (point && isOpen) {
      // Prefetch metadata on panel open
      const fetchMetadata = async () => {
        try {
          const response = await fetch(`/api/${trendType}-history/meta?date=${point.date.toISOString()}`)
          const data = await response.json()
          if (!data.error) {
            setMetadata({ totalItems: data.totalItems || 0 })
          }
        } catch (error) {
          console.error('Failed to fetch metadata:', error)
        }
      }
      fetchMetadata()
    }
  }, [point, isOpen, trendType])

  if (!isOpen || !point) return null

  const total = point.success + point.active + point.failed
  const historyTab = trendType === 'fetching' ? 'fetching-history' : 'processing-history'
  const dateString = point.date.toISOString()

  const handleStatusClick = (status: string) => {
    onNavigate(historyTab, { 
      date: dateString, 
      status: status === 'active' ? 'Currently processing' : status === 'success' ? 'Success' : 'Failed'
    })
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              {trendType === 'fetching' ? (
                <XCircle className="h-5 w-5 text-primary" />
              ) : (
                <Loader2 className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                {trendType === 'fetching' ? 'Fetching' : 'Processing'} Details
              </h2>
              <p className="text-sm text-gray-600">
                {format(point.date, 'EEE, MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">
          {/* Summary */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">Summary</h3>
            <p className="text-xs text-gray-600">
              You selected {total} {total === 1 ? 'item' : 'items'} from {format(point.date, 'PPP')}.
              {metadata && ` Total items in period: ${metadata.totalItems}`}
            </p>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Status Breakdown</h3>
            
            {/* Success */}
            <div 
              className="flex items-center justify-between p-4 rounded-xl border border-green-200 bg-green-50/50 cursor-pointer hover:bg-green-50 transition-colors"
              onClick={() => handleStatusClick('success')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-100">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">Success</p>
                  <p className="text-xs text-green-700">
                    {point.success} items ({total > 0 ? Math.round((point.success / total) * 100) : 0}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {point.success}
                </Badge>
                <ArrowRight className="h-4 w-4 text-green-600" />
              </div>
            </div>

            {/* Active */}
            <div 
              className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => handleStatusClick('active')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100">
                  <Loader2 className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Currently {trendType}</p>
                  <p className="text-xs text-blue-700">
                    {point.active} items ({total > 0 ? Math.round((point.active / total) * 100) : 0}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {point.active}
                </Badge>
                <ArrowRight className="h-4 w-4 text-blue-600" />
              </div>
            </div>

            {/* Failed */}
            <div 
              className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50 transition-colors"
              onClick={() => handleStatusClick('failed')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100">
                  <XCircle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-red-900">Failed</p>
                  <p className="text-xs text-red-700">
                    {point.failed} items ({total > 0 ? Math.round((point.failed / total) * 100) : 0}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {point.failed}
                </Badge>
                <ArrowRight className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <Button 
            className="w-full"
            onClick={() => {
              onNavigate(historyTab, { date: dateString })
              onClose()
            }}
          >
            View All Items for This Period
          </Button>
        </div>
      </div>
    </>
  )
}
