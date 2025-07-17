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
import type { ContentStatusCount } from "@/app/actions/processing-content-history"

export default function ContentInformation({
  processingId,
  onNavigate,
  overrideData,
}: {
  processingId: number
  onNavigate: (status: string | null) => void
  overrideData?: ContentStatusCount[] | null
}) {
  const [data, setData] = useState<ContentStatusCount[]>([])
  const [loading, setLoading] = useState(true)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await fetch(
        `/api/processing-content-history/status-counts?processingId=${processingId}`
      )
      const json = await res.json()
      if (!json.error) setData(json.data)
      setLoading(false)
    }
    load()
  }, [processingId])

  useEffect(() => {
    if (!overrideData) return
    setLoading(true)
    const t = setTimeout(() => {
      setData(overrideData)
      setLoading(false)
    }, 500)
    return () => clearTimeout(t)
  }, [overrideData])

  const items = [
    { label: "Success", color: "#10B981" },
    { label: "Currently processing", color: "#3B82F6" },
    { label: "Failed", color: "#EF4444" },
  ] as const

  const chartData = items.map((it) => ({
    name: it.label,
    value: data.find((d) => d.status === it.label)?.count ?? 0,
  }))

  const total = chartData.reduce((s, d) => s + d.value, 0)

  const handleSegment = (index: number) => {
    const status = items[index].label
    onNavigate(status)
  }

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl p-6 shadow relative h-[420px]">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Content information</h3>
        <p className="text-sm text-gray-500">
          Get a snapshot of the status of your flux contents.{' '}
          <button onClick={() => onNavigate(null)} className="text-blue-600 underline">
            View all content items
          </button>
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-52 flex-col gap-2">
          <Skeleton className="w-24 h-24 rounded-full" />
          <span className="text-gray-500 text-sm">Loading…</span>
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
                      fill={items[idx].color}
                      opacity={hoverIndex === idx ? 0.7 : 1}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <RechartTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-bold text-[1.625rem]">{total}</span>
              <span className="text-xs text-gray-500">Total items</span>
            </div>
          </div>
          <div className="w-1/2 flex flex-col justify-center space-y-2 pl-4">
            {items.map((it, idx) => (
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
  )
}
