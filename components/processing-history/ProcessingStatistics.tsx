"use client"

import { useEffect, useState } from "react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartTooltip,
} from "recharts"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { ProcessingStats } from "@/app/actions/processing-content-history"

export default function ProcessingStatistics({
  processingId,
  onNavigate,
  overrideStats,
}: {
  processingId: number
  onNavigate: (status: string | null) => void
  overrideStats?: ProcessingStats | null
}) {
  const [stats, setStats] = useState<ProcessingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(
        `/api/processing-content-history/statistics?processingId=${processingId}`
      )
      const json = await res.json()
      if (!json.error) setStats(json.data)
      setLoading(false)
    }
    load()
  }, [processingId])

  useEffect(() => {
    if (!overrideStats) return
    setLoading(true)
    const t = setTimeout(() => {
      setStats(overrideStats)
      setLoading(false)
    }, 500)
    return () => clearTimeout(t)
  }, [overrideStats])

  const items = [
    { label: "Inserted", color: "#34D399" },
    { label: "Updated", color: "#FBBF24" },
    { label: "Ignored", color: "#9CA3AF" },
    { label: "Errors", color: "#EF4444" },
  ] as const

  const chartData = items.map((it) => ({
    name: it.label,
    value:
      it.label === "Inserted"
        ? stats?.inserted ?? 0
        : it.label === "Updated"
        ? stats?.updated ?? 0
        : it.label === "Ignored"
        ? stats?.ignored ?? 0
        : stats?.errors ?? 0,
  }))

  const total = chartData.reduce((s, d) => s + d.value, 0)

  const handleSegment = (index: number) => {
    if (items[index].label === "Errors") {
      onNavigate("Failed")
    }
  }

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl p-3 sm:p-4 md:p-6 shadow relative min-h-[420px]">
      <div className="space-y-2 mb-4">
        <h3 className="text-lg font-bold pr-2">Processing statistics</h3>
        <p className="text-sm text-gray-500">Overview of rows affected during this processing run.</p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-52 flex-col gap-2">
          <Skeleton className="w-24 h-24 rounded-full" />
          <span className="text-gray-500 text-sm">Loading…</span>
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
                      fill={items[idx].color}
                      opacity={hoverIndex === idx ? 0.7 : 1}
                      style={{ cursor: items[idx].label === "Errors" ? "pointer" : "default" }}
                    />
                  ))}
                </Pie>
                <RechartTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-bold text-xl md:text-[1.625rem]">{total}</span>
              <span className="text-xs text-gray-500 text-center">Total rows</span>
            </div>
          </div>
          
          {/* Legend section - full width on mobile, stacked under chart */}
          <div className="w-full md:w-1/2 flex flex-col justify-center space-y-2 md:pl-4">
            {items.map((it, idx) => (
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
  )
}
