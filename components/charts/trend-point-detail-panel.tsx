"use client"

import { useState, useEffect } from "react"
import { X, CheckCircle, Loader2, XCircle, ArrowRight, Calendar, TrendingUp, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

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
  trendType: 'fetching' | 'processing' | 'workflow'
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
          const apiPath = trendType === 'workflow' ? 'workflow-execution-log' : `${trendType}-history`
          const response = await fetch(`/api/${apiPath}/meta?date=${point.date.toISOString()}`)
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

  if (!point) return null

  const total = point.success + point.active + point.failed
  const historyTab = trendType === 'fetching' ? 'fetching-history' : trendType === 'processing' ? 'processing-history' : 'workflow-execution-log'
  const dateString = point.date.toISOString()
  
  console.log('🔍 TrendPointDetailPanel - date info:', {
    pointDate: point.date,
    dateString,
    dateOnly: dateString.split('T')[0]
  })

  const handleStatusClick = (status: string) => {
    let statusFilter = ''
    if (status === 'active') {
      statusFilter = trendType === 'fetching' ? 'Currently fetching' : trendType === 'processing' ? 'Currently processing' : 'In Progress'
    } else if (status === 'success') {
      statusFilter = 'Success'
    } else if (status === 'failed') {
      statusFilter = 'Failed'
    }
    
    const dateOnly = point.date.toISOString().split('T')[0]
    
    console.log('🔍 TrendPointDetailPanel - handleStatusClick:', {
      status,
      statusFilter,
      historyTab,
      dateOnly,
      trendType
    })
    
    onNavigate(historyTab, { 
      date: dateOnly, 
      status: statusFilter
    })
    onClose()
  }

  const handleViewAll = () => {
    const dateOnly = point.date.toISOString().split('T')[0]
    onNavigate(historyTab, { date: dateOnly })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black z-[10040]"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-0 top-0 h-full w-full md:w-[300px] lg:w-[350px] xl:w-[400px] bg-white shadow-2xl z-[10045] flex flex-col"
          >
            {/* Header - Material 3 Surface */}
            <div className="flex items-center justify-between px-6 lg:px-8 py-5 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-medium text-gray-900">
                  {trendType === 'fetching' ? 'Fetching' : trendType === 'processing' ? 'Processing' : 'Workflow'} Point Details
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {format(point.date, 'EEEE, MMMM d, yyyy \'at\' h:mm a')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 lg:p-8 space-y-6">
                {/* Overview Section */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Overview</h3>
                  <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-light text-green-600">{point.success}</p>
                        <p className="text-sm text-gray-600 mt-1">Success</p>
                        <p className="text-xs text-gray-500 mt-0.5">{total > 0 ? Math.round((point.success / total) * 100) : 0}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-light text-blue-600">{point.active}</p>
                        <p className="text-sm text-gray-600 mt-1">Active</p>
                        <p className="text-xs text-gray-500 mt-0.5">{total > 0 ? Math.round((point.active / total) * 100) : 0}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-light text-red-600">{point.failed}</p>
                        <p className="text-sm text-gray-600 mt-1">Failed</p>
                        <p className="text-xs text-gray-500 mt-0.5">{total > 0 ? Math.round((point.failed / total) * 100) : 0}%</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Total items in this period</span>
                        <span className="font-medium text-gray-900">{total}</span>
                      </div>
                      {metadata && (
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-600">Total available items</span>
                          <span className="font-medium text-gray-900">{metadata.totalItems}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Details */}
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-4">Status Details</h3>
                  <div className="space-y-2">
                    {/* Success */}
                    <button
                      onClick={() => handleStatusClick('success')}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-green-300 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Successfully Completed</p>
                          <p className="text-xs text-gray-500">{point.success} {trendType === 'fetching' ? 'fetchings' : trendType === 'processing' ? 'processings' : 'workflows'}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>

                    {/* Active */}
                    <button
                      onClick={() => handleStatusClick('active')}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-blue-300 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Currently {trendType === 'fetching' ? 'Fetching' : trendType === 'processing' ? 'Processing' : 'Executing'}</p>
                          <p className="text-xs text-gray-500">{point.active} items in progress</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>

                    {/* Failed */}
                    <button
                      onClick={() => handleStatusClick('failed')}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-red-300 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">Failed Operations</p>
                          <p className="text-xs text-gray-500">{point.failed} {trendType === 'fetching' ? 'fetchings' : trendType === 'processing' ? 'processings' : 'workflows'}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer - Material 3 Actions */}
            <div className="px-6 lg:px-8 py-4 border-t border-gray-200 bg-gray-50">
              <Button 
                variant="default"
                onClick={handleViewAll}
                className="w-full"
              >
                View in History
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}