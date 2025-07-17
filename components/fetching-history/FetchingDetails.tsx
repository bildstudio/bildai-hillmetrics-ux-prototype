"use client"

import { useEffect, useState, useRef } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { fetchFetchingDetails, type FetchingDetails as Details, type FetchingDetailsItem } from "@/app/actions/fetching-content-history"

interface FetchingDetailsProps {
  fetchingId: number
  onPreviewFile?: (file: { id: string; name: string }) => void
  hideHeader?: boolean
  onLoaded?: () => void
  loadingHeight?: number
}

export default function FetchingDetails({ 
  fetchingId, 
  onPreviewFile, 
  hideHeader = false, 
  onLoaded, 
  loadingHeight = 200 
}: FetchingDetailsProps) {
  const [details, setDetails] = useState<Details | null>(null)
  const [loading, setLoading] = useState(true)
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [maxLabelWidth, setMaxLabelWidth] = useState(0)
  const [dynamicProgress, setDynamicProgress] = useState<Record<number, number>>({})
  const [elapsedTime, setElapsedTime] = useState<Record<number, number>>({})
  const [ellipsisStep, setEllipsisStep] = useState(0)
  const [completed, setCompleted] = useState(false)

  const getRunningStatus = (progress: number) => {
    const dots = ".".repeat(ellipsisStep + 1)
    if (progress >= 100) return "Completed – Content fetched successfully."
    if (progress >= 95) return `Completing${dots}`
    if (progress >= 40) return `InProgress – Step currently fetching an attachment${dots}`
    if (progress >= 5) return `Fetching Data – Starting data retrieval${dots}`
    return `Created – Workflow initialized${dots}`
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetchFetchingDetails(fetchingId)
      if (!res.error) setDetails(res.data)
      setLoading(false)
      onLoaded?.()
    }
    load()
  }, [fetchingId, onLoaded])

  useEffect(() => {
    if (!details) return
    const width = Math.max(0, ...labelRefs.current.map((el) => el?.offsetWidth || 0))
    setMaxLabelWidth(width)
  }, [details, completed])

  useEffect(() => {
    if (!details) return
    const items = details.items.length ? details.items : [{ contentID: details.numberOfContent ?? 0, status: details.status }]
    const prog: Record<number, number> = {}
    const time: Record<number, number> = {}
    items.forEach((item) => {
      if (item.status === "Currently fetching") {
        prog[item.contentID] = 0
        time[item.contentID] = 0
      }
    })
    setDynamicProgress(prog)
    setElapsedTime(time)
  }, [details])

  useEffect(() => {
    if (!details) return
    const interval = setInterval(() => {
      if (completed) return
      setDynamicProgress((prev) => {
        const next = { ...prev }
        const items = details.items.length ? details.items : [{ contentID: details.numberOfContent ?? 0, status: details.status }]
        let didComplete = false

        items.forEach((item) => {
          if (item.status === "Currently fetching") {
            const id = item.contentID
            const current = next[id] ?? 0
            const updated = current >= 100 ? 100 : current + 2
            next[id] = updated
            if (updated >= 100 && current < 100) {
              didComplete = true
            }
          }
        })
        if (didComplete) {
          setCompleted(true)
        }

        return next
      })
      setElapsedTime((prev) => {
        const next = { ...prev }
        const items = details.items.length ? details.items : [{ contentID: details.numberOfContent ?? 0, status: details.status }]
        items.forEach((item) => {
          if (item.status === "Currently fetching") {
            const id = item.contentID
            const curr = next[id] ?? 0
            if ((dynamicProgress[id] ?? 0) < 100) {
              next[id] = curr + 1
            } else {
              next[id] = curr
            }
          }
        })
        return next
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [details, completed, dynamicProgress])

  useEffect(() => {
    const elInterval = setInterval(() => {
      setEllipsisStep((e) => (e + 1) % 3)
    }, 250)
    return () => clearInterval(elInterval)
  }, [])

  const distributeProgress = (total: number, count: number) => {
    if (count === 0) return []
    const randoms = Array.from({ length: count }, () => 0.9 + Math.random() * 0.2)
    const sum = randoms.reduce((a, b) => a + b, 0)
    const raw = randoms.map((r) => Math.round((r / sum) * total))
    const diff = total - raw.reduce((a, b) => a + b, 0)
    raw[raw.length - 1] += diff
    return raw
  }

  if (loading) {
    return (
      <div 
        className="w-full bg-white rounded-xl p-6 shadow flex items-center justify-center text-gray-500"
        style={{ height: loadingHeight }}
      >
        Loading…
      </div>
    )
  }

  if (!details) {
    return null
  }

  const items = details.items.length ? details.items : [{ contentID: details.numberOfContent ?? 0, status: details.status, contentName: null } as FetchingDetailsItem]
  const progressParts = distributeProgress(Math.round(details.progress || 0), items.length)
  const totalMinutes = (details.fetchingTimeInSeconds ?? 0) / 60

  const statusColor = (status: string) => {
    switch (status) {
      case "Success":
        return "#10B981"
      case "Currently fetching":
        return "#3B82F6"
      case "Failed":
        return "#EF4444"
      default:
        return "#6B7280"
    }
  }

  const statusLabel = (status: string) => {
    return status === "Currently fetching" ? "In progress" : status
  }

  return (
    <div className="w-full bg-white rounded-xl p-6 shadow">
      {!hideHeader && (
        <div className="space-y-1 mb-4">
          <h3 className="text-lg font-bold">Fetching details</h3>
          <p className="text-sm text-gray-500">Instant progress overview for each fetched content.</p>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const baseProg = item.status === "Success" ? 100 : progressParts[idx] || 0
          const dynamicProg = dynamicProgress[item.contentID] ?? 0
          const itemProg = item.status === "Currently fetching" ? dynamicProg : baseProg
          const durationStr = Math.floor(elapsedTime[item.contentID] ?? 0)
          const isDynamicComplete = item.status === "Currently fetching" && itemProg >= 100
          const isSuccess = item.status === "Success" || isDynamicComplete
          const isError = item.status === "Failed" || item.status === "Error"
          const barColor = isSuccess ? "bg-green-500" : isError ? "bg-gray-300" : "bg-blue-500"
          return (
            <div key={item.contentID} className="p-2 rounded hover:bg-gray-50">
              <div className="text-sm font-medium mb-1">
                Content ID: {item.contentID} – {item.contentName || "Unknown"} – Fetch duration: {durationStr} sec
              </div>
              <div className="flex items-center gap-2">
                <span
                  ref={(el) => (labelRefs.current[idx] = el)}
                  className="text-xs font-semibold inline-block"
                  style={{ 
                    color: isDynamicComplete ? "#10B981" : statusColor(item.status), 
                    width: maxLabelWidth ? `${maxLabelWidth}px` : undefined 
                  }}
                >
                  {isDynamicComplete ? "Success" : statusLabel(item.status)}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div 
                        className={`flex-1 h-6 rounded bg-muted overflow-hidden relative ${
                          isSuccess ? "cursor-pointer" : ""
                        }`}
                        onClick={() => 
                          isSuccess && onPreviewFile?.({
                            id: item.contentID.toString(),
                            name: item.contentName || "Unknown File"
                          })
                        }
                      >
                        <div
                          className={`absolute inset-0 ${barColor} flex items-center justify-center text-white text-xs transition-all duration-500`}
                          style={{ width: isError ? "100%" : `${itemProg}%` }}
                        >
                          {isError 
                            ? "Fetching process failed – no data collected." 
                            : `${Math.round(itemProg)}%`
                          }
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>{item.status}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              {item.status === "Currently fetching" && (
                <div className="text-xs text-gray-500 mt-1">
                  {getRunningStatus(dynamicProg)}
                </div>
              )}
              {isError && details.errorMessage && (
                <div className="text-xs text-red-600 mt-1">
                  {details.errorMessage}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
