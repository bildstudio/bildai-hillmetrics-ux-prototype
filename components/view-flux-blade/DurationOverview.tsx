"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2 } from "lucide-react"

interface DurationCount {
  bucket: string
  count: number
}

export default function DurationOverview({
  fluxId,
  onNavigate,
}: {
  fluxId: string
  onNavigate: (tab: string, opts?: { durationBucket?: string }) => void
}) {
  const [active, setActive] = useState<"fetching" | "processings" | "workflows">("workflows")
  const [fetchData, setFetchData] = useState<DurationCount[]>([])
  const [procData, setProcData] = useState<DurationCount[]>([])
  const [workflowData, setWorkflowData] = useState<DurationCount[]>([])
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [loadingProc, setLoadingProc] = useState(true)
  const [loadingWorkflow, setLoadingWorkflow] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoadingFetch(true)
      setLoadingProc(true)
      setLoadingWorkflow(true)
      const rf = await fetch(`/api/fetching-history/duration-buckets?fluxId=${fluxId}`)
      const f = await rf.json()
      if (!f.error) setFetchData(f.data)
      setLoadingFetch(false)
      const rp = await fetch(`/api/processing-history/duration-buckets?fluxId=${fluxId}`)
      const p = await rp.json()
      if (!p.error) setProcData(p.data)
      setLoadingProc(false)
      const rw = await fetch(`/api/workflow-execution-log/duration-buckets?fluxId=${fluxId}`)
      const w = await rw.json()
      if (!w.error) setWorkflowData(w.data)
      setLoadingWorkflow(false)
    }
    load()
  }, [fluxId])

  const buckets = ["0-1 min", "1-2 min", "2-5 min", "5-10 min", "10-20 min", "20+ min"]
  const currentData = active === "fetching" ? fetchData : active === "processings" ? procData : workflowData
  const total = currentData.reduce((s, d) => s + d.count, 0)
  const items = buckets.map((label) => {
    const c = currentData.find((d) => d.bucket === label)?.count ?? 0
    const percent = total ? Math.round((c / total) * 100) : 0
    return { label, count: c, percent }
  })
  const loading = active === "fetching" ? loadingFetch : active === "processings" ? loadingProc : loadingWorkflow
  const historyTab = active === "fetching" ? "fetching-history" : active === "processings" ? "processing-history" : "workflow-execution-log"

  const handleRowClick = (bucket: string) => {
    onNavigate(historyTab, { durationBucket: bucket })
  }

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow relative lg:mr-4 min-h-[420px]">
      {/* Mobile-first header layout */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-bold pr-2">
            {active === "fetching" ? "Duration of fetching" : active === "processings" ? "Duration of processing" : "Duration of workflow execution"}
          </h3>
          <p className="text-sm text-gray-500">
            {active === "fetching"
              ? "See how long your flux fetchings take."
              : active === "processings"
              ? "See how long your flux processings take."
              : "See how long your workflow executions take."}{" "}
            <button 
              onClick={() => onNavigate(historyTab)} 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              View detailed durations
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </p>
        </div>
        {/* Tabs positioned below title on mobile, to the right on larger screens */}
        <div className="flex-shrink-0">
          <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
            <TabsList className="bg-gray-100 p-1 rounded-lg">
              <TabsTrigger value="workflows" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Workflows
              </TabsTrigger>
              <TabsTrigger value="fetching" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Fetching
              </TabsTrigger>
              <TabsTrigger value="processings" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Processings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-52">
          <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
        </div>
      ) : (
        <div className="space-y-3 max-h-[280px] overflow-y-auto">
          {items.map(({ label, count, percent }) => (
            <TooltipProvider key={label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                    onClick={() => handleRowClick(label)}
                  >
                    <span className="text-sm w-20 flex-shrink-0 font-medium">{label}</span>
                    <div className="h-7 rounded-full bg-gray-100 relative flex-1">
                      {count > 0 && (
                        <div
                          className="h-full rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium"
                          style={{ width: `${Math.max(percent, 15)}%` }}
                        >
                          {percent > 0 && `${percent}%`}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-gray-800 w-12 text-right">{count}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {`${percent}% (${count} / ${total} ${active === "fetching" ? "fetching items" : active === "processings" ? "processing items" : "workflow items"})`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
    </div>
  )
}
