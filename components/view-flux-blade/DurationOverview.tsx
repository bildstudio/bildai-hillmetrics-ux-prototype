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
  const [active, setActive] = useState<"fetching" | "processings">("fetching")
  const [fetchData, setFetchData] = useState<DurationCount[]>([])
  const [procData, setProcData] = useState<DurationCount[]>([])
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [loadingProc, setLoadingProc] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoadingFetch(true)
      setLoadingProc(true)
      const rf = await fetch(`/api/fetching-history/duration-buckets?fluxId=${fluxId}`)
      const f = await rf.json()
      if (!f.error) setFetchData(f.data)
      setLoadingFetch(false)
      const rp = await fetch(`/api/processing-history/duration-buckets?fluxId=${fluxId}`)
      const p = await rp.json()
      if (!p.error) setProcData(p.data)
      setLoadingProc(false)
    }
    load()
  }, [fluxId])

  const buckets = ["0-1 min", "1-2 min", "2-5 min", "5-10 min", "10-20 min", "20+ min"]
  const currentData = active === "fetching" ? fetchData : procData
  const total = currentData.reduce((s, d) => s + d.count, 0)
  const items = buckets.map((label) => {
    const c = currentData.find((d) => d.bucket === label)?.count ?? 0
    const percent = total ? Math.round((c / total) * 100) : 0
    return { label, count: c, percent }
  })
  const loading = active === "fetching" ? loadingFetch : loadingProc
  const historyTab = active === "fetching" ? "fetching-history" : "processing-history"

  const handleRowClick = (bucket: string) => {
    onNavigate(historyTab, { durationBucket: bucket })
  }

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl p-6 shadow relative mr-4 h-[420px]">
      <div className="absolute right-4 top-4">
        <Tabs value={active} onValueChange={(v) => setActive(v as any)}>
          <TabsList className="bg-transparent space-x-2">
            <TabsTrigger value="fetching" className="px-2 py-1 text-sm">
              Fetching
            </TabsTrigger>
            <TabsTrigger value="processings" className="px-2 py-1 text-sm">
              Processings
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-bold">
          {active === "fetching" ? "Duration of fetching" : "Duration of processing"}
        </h3>
        <p className="text-sm text-gray-500">
          {active === "fetching"
            ? "See how long your flux fetchings take."
            : "See how long your flux processings take."}{" "}
          <button onClick={() => onNavigate(historyTab)} className="text-blue-600 underline">
            View detailed durations
          </button>
        </p>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-52">
          <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
        </div>
      ) : (
        <div className="mt-6 space-y-2 max-h-[300px] overflow-y-auto">
          {items.map(({ label, count, percent }) => (
            <TooltipProvider key={label}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className="flex items-center gap-2.5 p-2 rounded cursor-pointer hover:bg-gray-100"
                    onClick={() => handleRowClick(label)}
                  >
                    <span className="text-sm w-16 flex-shrink-0">{label}</span>
                    <div className="h-6 rounded bg-muted relative flex-1">
                      <div
                        className="h-full rounded bg-gray-500 flex items-center justify-center text-white text-xs"
                        style={{ width: `${percent}%` }}
                      >
                        {percent} %
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {`${percent} % (${count} / ${total} ${active === "fetching" ? "fetching items" : "processing items"})`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      )}
    </div>
  )
}
