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
import FluxTrend from "./FluxTrend"

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
  const [active, setActive] = useState<"fetchings" | "processings">("fetchings")
  const [fetchData, setFetchData] = useState<StatusCount[]>([])
  const [procData, setProcData] = useState<StatusCount[]>([])
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [loadingProc, setLoadingProc] = useState(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoadingFetch(true)
      setLoadingProc(true)
      const rf = await fetch(`/api/fetching-history/status-counts?fluxId=${fluxId}`)
      const f = await rf.json()
      if (!f.error) setFetchData(f.data)
      setLoadingFetch(false)
      const rp = await fetch(`/api/processing-history/status-counts?fluxId=${fluxId}`)
      const p = await rp.json()
      if (!p.error) setProcData(p.data)
      setLoadingProc(false)
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
  } as const

  const current = configs[active]
  const chartData = current.items.map((it) => ({
    name: it.label,
    value: current.data.find((d) => d.status === it.label)?.count ?? 0,
  }))
  const total = chartData.reduce((s, d) => s + d.value, 0)
  const isLoading = active === "fetchings" ? loadingFetch : loadingProc

  const handleSegment = (index: number) => {
    const status = current.items[index].label
    onNavigate(current.history, { status })
  }

  return (
    <div className="w-[90%] mx-auto">
      {/* First row - Status Overview and Recent Activity */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/2 bg-white rounded-xl p-6 shadow relative h-[420px]">
          <div className="absolute right-4 top-4">
            <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
              <TabsList className="bg-transparent space-x-2">
                <TabsTrigger value="fetchings" className="px-2 py-1 text-sm">
                  Fetchings
                </TabsTrigger>
                <TabsTrigger value="processings" className="px-2 py-1 text-sm">
                  Processings
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">{current.title}</h3>
            <p className="text-sm text-gray-500">
              {current.subtitle}{" "}
              <button onClick={() => onNavigate(current.history)} className="text-blue-600 underline">
                {current.link}
              </button>
            </p>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center h-52">
              <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
            </div>
          ) : (
            <div className="mt-6 flex">
              <div className="w-1/2 relative">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={104}
                      activeIndex={hoverIndex ?? -1}
                      activeOuterRadius={112}
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
                  <span className="font-bold text-[1.625rem]">{total}</span>
                  <span className="text-xs text-gray-500">
                    Total {active === "fetchings" ? "fetchings" : "processings"}
                  </span>
                </div>
              </div>
              <div className="w-1/2 flex flex-col justify-center space-y-2 pl-4">
                {current.items.map((it, idx) => (
                  <TooltipProvider key={it.label}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="flex items-center cursor-pointer gap-2 text-sm hover:bg-gray-50 p-2 rounded transition-colors"
                          onMouseEnter={() => setHoverIndex(idx)}
                          onMouseLeave={() => setHoverIndex(null)}
                          onClick={() => handleSegment(idx)}
                        >
                          <Badge style={{ backgroundColor: it.color }} className="w-3 h-3 rounded-full p-0" />
                          <span>{it.label}</span>
                          <span className="ml-auto font-medium">{chartData[idx].value}</span>
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
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-0 mt-6">
        <DurationOverview fluxId={fluxId} onNavigate={onNavigate} />
        <ErrorTypesOverview fluxId={fluxId} onNavigate={onNavigate} />
      </div>

      {/* Third row - Flux Trend */}
      <div className="mt-6">
        <FluxTrend fluxId={fluxId} onNavigate={onNavigate} />
      </div>

    </div>
  )
}
