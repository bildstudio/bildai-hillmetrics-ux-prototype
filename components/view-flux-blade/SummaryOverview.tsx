"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartTooltip } from "recharts"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import RecentActivity from "./RecentActivity"
import DurationOverview from "./DurationOverview"
import ErrorTypesOverview from "./ErrorTypesOverview"
import FluxTrendStock from "./FluxTrendStock"

interface StatusCount {
  status: string
  count: number
}

export default function SummaryOverview({
  fluxId,
  onNavigate,
  onNavigateToFetchedContents,
  onNavigateToFetchedContentsFromProcessing,
  onViewFetchingDetails,
  onViewProcessingDetails,
  onViewWorkflowDetails,
  onViewNormalizationDetails,
  onViewRefinementDetails,
  onViewCalculationDetails,
}: {
  fluxId: string
  onNavigate: (
    tab: string,
    opts?: { status?: string; durationBucket?: string; errorType?: string; date?: string },
  ) => void
  onNavigateToFetchedContents: (fetchingID: number) => void
  onNavigateToFetchedContentsFromProcessing: (processingID: number) => void
  onViewFetchingDetails?: (fetchingID: number) => void
  onViewProcessingDetails?: (processingID: number) => void
  onViewWorkflowDetails?: (workflowID: number) => void
  onViewNormalizationDetails?: (normalizationID: number) => void
  onViewRefinementDetails?: (refinementID: number) => void
  onViewCalculationDetails?: (calculationID: number) => void
}) {
  const [active, setActive] = useState<"fetchings" | "processings" | "workflows">("workflows")
  const [fetchData, setFetchData] = useState<StatusCount[]>([])
  const [procData, setProcData] = useState<StatusCount[]>([])
  const [workflowData, setWorkflowData] = useState<StatusCount[]>([])
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [loadingProc, setLoadingProc] = useState(true)
  const [loadingWorkflow, setLoadingWorkflow] = useState(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoadingFetch(true)
      setLoadingProc(true)
      setLoadingWorkflow(true)
      const rf = await fetch(`/api/fetching-history/status-counts?fluxId=${fluxId}`)
      const f = await rf.json()
      if (!f.error) setFetchData(f.data)
      setLoadingFetch(false)
      const rp = await fetch(`/api/processing-history/status-counts?fluxId=${fluxId}`)
      const p = await rp.json()
      if (!p.error) setProcData(p.data)
      setLoadingProc(false)
      const rw = await fetch(`/api/workflow-execution-log/status-counts?fluxId=${fluxId}`)
      const w = await rw.json()
      if (!w.error) setWorkflowData(w.data)
      setLoadingWorkflow(false)
    }
    load()
  }, [fluxId])

  const configs = {
    fetchings: {
      title: "Status overview of flux fetchings",
      subtitle: "Get a snapshot of the status of your flux fetchings.",
      link: "View all fetchings",
      history: "fetching-history",
      items: [
        { label: "Success", color: "#22c55e" },
        { label: "Currently fetching", color: "#3b82f6" },
        { label: "Failed", color: "#ef4444" },
      ],
      data: fetchData,
    },
    processings: {
      title: "Status overview of flux processings",
      subtitle: "Get a snapshot of the status of your flux processings.",
      link: "View all processings",
      history: "processing-history",
      items: [
        { label: "Success", color: "#22c55e" },
        { label: "Currently processing", color: "#3b82f6" },
        { label: "Failed", color: "#ef4444" },
      ],
      data: procData,
    },
    workflows: {
      title: "Status overview of workflow execution",
      subtitle: "Get a snapshot of status of your workflow executions.",
      link: "View all workflow executions",
      history: "workflow-execution-log",
      items: [
        { label: "Success", color: "#22c55e" },
        { label: "Currently executing", color: "#3b82f6" },
        { label: "Failed", color: "#ef4444" },
      ],
      data: workflowData,
    },
  } as const

  const current = configs[active]
  const chartData = current.items.map((it) => ({
    name: it.label,
    value: current.data.find((d) => d.status === it.label)?.count ?? 0,
  }))
  const total = chartData.reduce((s, d) => s + d.value, 0)
  const isLoading = active === "fetchings" ? loadingFetch : active === "processings" ? loadingProc : loadingWorkflow

  const handleSegment = (index: number) => {
    const status = current.items[index].label
    onNavigate(current.history, { status })
  }

  return (
    <div className="w-full lg:w-[95%] lg:mx-auto">
      {/* First row - Status Overview and Recent Activity */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow relative min-h-[420px]">
          {/* Mobile-first header layout */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            <div className="space-y-2 flex-1">
              <h3 className="text-lg font-bold pr-2">{current.title}</h3>
              <p className="text-sm text-gray-500">
                {current.subtitle}{" "}
                <button 
                  onClick={() => onNavigate(current.history)} 
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  {current.link}
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
                  <TabsTrigger value="fetchings" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Fetchings
                  </TabsTrigger>
                  <TabsTrigger value="processings" className="px-3 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Processings
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-52">
              <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-4">
              {/* Chart section - full width on mobile */}
              <div className="w-full md:w-1/2 relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={85}
                      activeIndex={hoverIndex ?? -1}
                      activeOuterRadius={90}
                      onMouseEnter={(_, idx) => setHoverIndex(idx)}
                      onMouseLeave={() => setHoverIndex(null)}
                      onClick={(_, idx) => handleSegment(idx)}
                    >
                      {chartData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={current.items[idx].color}
                          opacity={hoverIndex === idx ? 0.7 : 1}
                          style={{ cursor: "pointer" }}
                        />
                      ))}
                    </Pie>
                    <RechartTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-bold text-xl md:text-[1.625rem]">{total}</span>
                  <span className="text-xs text-gray-500 text-center">
                    Total {active === "fetchings" ? "fetchings" : active === "processings" ? "processings" : "workflows"}
                  </span>
                </div>
              </div>
              
              {/* Legend section - full width on mobile, stacked under chart */}
              <div className="w-full md:w-1/2 flex flex-col justify-center space-y-2 md:pl-4">
                {current.items.map((it, idx) => (
                  <TooltipProvider key={it.label}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="flex items-center cursor-pointer gap-3 text-sm hover:bg-gray-50 p-3 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                          onMouseEnter={() => setHoverIndex(idx)}
                          onMouseLeave={() => setHoverIndex(null)}
                          onClick={() => handleSegment(idx)}
                        >
                          <Badge style={{ backgroundColor: it.color }} className="w-4 h-4 rounded-full p-0" />
                          <span className="flex-1">{it.label}</span>
                          <span className="font-semibold text-gray-800">{chartData[idx].value}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>{`${it.label}: ${chartData[idx].value}`}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}
        </div>
        <RecentActivity
          fluxId={fluxId}
          onNavigate={onNavigate}
          onNavigateToFetchedContents={onNavigateToFetchedContents}
          onNavigateToFetchedContentsFromProcessing={onNavigateToFetchedContentsFromProcessing}
          onViewFetchingDetails={onViewFetchingDetails}
          onViewProcessingDetails={onViewProcessingDetails}
          onViewWorkflowDetails={onViewWorkflowDetails}
          onViewNormalizationDetails={onViewNormalizationDetails}
          onViewRefinementDetails={onViewRefinementDetails}
          onViewCalculationDetails={onViewCalculationDetails}
        />
      </div>

      {/* Second row - Duration Overview and Error Types Overview */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-0 mt-4 lg:mt-6">
        <DurationOverview fluxId={fluxId} onNavigate={onNavigate} />
        <ErrorTypesOverview fluxId={fluxId} onNavigate={onNavigate} />
      </div>

      {/* Third row - Flux Trend */}
      <div className="mt-4 lg:mt-6">
        <FluxTrendStock fluxId={fluxId} onNavigate={onNavigate} />
      </div>

    </div>
  )
}
