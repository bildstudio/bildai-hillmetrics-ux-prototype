"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Loader2, AlertCircle } from "lucide-react"

interface ErrorTypeCount {
  message: string
  count: number
}

export default function ErrorTypesOverview({
  fluxId,
  onNavigate,
}: {
  fluxId: string
  onNavigate: (tab: string, opts?: { errorType?: string; status?: string; durationBucket?: string }) => void
}) {
  const [active, setActive] = useState<"fetching" | "processings" | "workflows">("workflows")
  const [fetchData, setFetchData] = useState<ErrorTypeCount[]>([])
  const [procData, setProcData] = useState<ErrorTypeCount[]>([])
  const [workflowData, setWorkflowData] = useState<ErrorTypeCount[]>([])
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [loadingProc, setLoadingProc] = useState(true)
  const [loadingWorkflow, setLoadingWorkflow] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoadingFetch(true)
      setLoadingProc(true)
      setLoadingWorkflow(true)
      const rf = await fetch(`/api/fetching-history/error-types?fluxId=${fluxId}`)
      const f = await rf.json()
      if (!f.error) setFetchData(f.data)
      setLoadingFetch(false)
      const rp = await fetch(`/api/processing-history/error-types?fluxId=${fluxId}`)
      const p = await rp.json()
      if (!p.error) setProcData(p.data)
      setLoadingProc(false)
      const rw = await fetch(`/api/workflow-execution-log/error-types?fluxId=${fluxId}`)
      const w = await rw.json()
      if (!w.error) setWorkflowData(w.data)
      setLoadingWorkflow(false)
    }
    load()
  }, [fluxId])

  const currentData = active === "fetching" ? fetchData : active === "processings" ? procData : workflowData
  const total = currentData.reduce((s, d) => s + d.count, 0)
  const loading = active === "fetching" ? loadingFetch : active === "processings" ? loadingProc : loadingWorkflow
  const historyTab = active === "fetching" ? "fetching-history" : active === "processings" ? "processing-history" : "workflow-execution-log"

  const handleRowClick = (msg: string) => {
    onNavigate(historyTab, { errorType: msg })
  }

  const headerTitle = active === "fetching" ? "Type of fetching errors" : active === "processings" ? "Type of processing errors" : "Type of workflow errors"
  const headerDesc =
    active === "fetching"
      ? "Understand what went wrong during fetchings."
      : active === "processings"
      ? "Understand what went wrong during processings."
      : "Understand what went wrong during workflow executions."
  const linkLabel = active === "fetching" ? "Explore error fetchings" : active === "processings" ? "Explore error processings" : "Explore error workflows"

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow relative lg:ml-4 min-h-[420px]">
      {/* Mobile-first header layout */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-bold pr-2">{headerTitle}</h3>
          <p className="text-sm text-gray-500">
            {headerDesc}{" "}
            <button 
              onClick={() => onNavigate(historyTab)} 
              className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              {linkLabel}
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
      
      <div className="max-h-[280px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
          </div>
        ) : currentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 py-12">
            <AlertCircle className="h-6 w-6 mb-2" />
            <span>{active === "fetching" ? "No fetching errors found" : active === "processings" ? "No processing errors found" : "No workflow errors found"}</span>
          </div>
        ) : (
          <div className="space-y-3">
            {currentData.map(({ message, count }) => {
              const percent = total ? Math.round((count / total) * 100) : 0
              return (
                <TooltipProvider key={message}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 flex flex-col space-y-2"
                        onClick={() => handleRowClick(message)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex-1 pr-2">{message}</span>
                          <span className="text-sm font-semibold text-gray-800">{count}</span>
                        </div>
                        <div className="h-7 rounded-full bg-gray-100 relative">
                          {count > 0 && (
                            <div
                              className="h-full rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-medium"
                              style={{ width: `${Math.max(percent, 15)}%` }}
                            >
                              {percent > 0 && `${percent}%`}
                            </div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {`${percent}% (${count} / ${total} ${active === "fetching" ? "fetching errors" : active === "processings" ? "processing errors" : "workflow errors"})`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
