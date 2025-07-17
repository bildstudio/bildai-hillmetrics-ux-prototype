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
  const [active, setActive] = useState<"fetching" | "processings">("fetching")
  const [fetchData, setFetchData] = useState<ErrorTypeCount[]>([])
  const [procData, setProcData] = useState<ErrorTypeCount[]>([])
  const [loadingFetch, setLoadingFetch] = useState(true)
  const [loadingProc, setLoadingProc] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoadingFetch(true)
      setLoadingProc(true)
      const rf = await fetch(`/api/fetching-history/error-types?fluxId=${fluxId}`)
      const f = await rf.json()
      if (!f.error) setFetchData(f.data)
      setLoadingFetch(false)
      const rp = await fetch(`/api/processing-history/error-types?fluxId=${fluxId}`)
      const p = await rp.json()
      if (!p.error) setProcData(p.data)
      setLoadingProc(false)
    }
    load()
  }, [fluxId])

  const currentData = active === "fetching" ? fetchData : procData
  const total = currentData.reduce((s, d) => s + d.count, 0)
  const loading = active === "fetching" ? loadingFetch : loadingProc
  const historyTab = active === "fetching" ? "fetching-history" : "processing-history"

  const handleRowClick = (msg: string) => {
    onNavigate(historyTab, { errorType: msg })
  }

  const headerTitle = active === "fetching" ? "Type of fetching errors" : "Type of processing errors"
  const headerDesc =
    active === "fetching"
      ? "Understand what went wrong during fetchings."
      : "Understand what went wrong during processings."
  const linkLabel = active === "fetching" ? "Explore error fetchings" : "Explore error processings"

  return (
    <div className="w-full lg:w-1/2 bg-white rounded-xl p-6 shadow relative lg:ml-4 h-[420px]">
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
        <h3 className="text-lg font-bold">{headerTitle}</h3>
        <p className="text-sm text-gray-500">
          {headerDesc}{" "}
          <button onClick={() => onNavigate(historyTab)} className="text-blue-600 underline">
            {linkLabel}
          </button>
        </p>
      </div>
      <div className="mt-6 max-h-[300px] overflow-y-auto gmail-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-52">
            <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
          </div>
        ) : currentData.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-gray-500 py-12">
            <AlertCircle className="h-6 w-6 mb-2" />
            <span>{active === "fetching" ? "No fetching errors found" : "No processing errors found"}</span>
          </div>
        ) : (
          currentData.map(({ message, count }) => {
            const percent = total ? Math.round((count / total) * 100) : 0
            return (
              <TooltipProvider key={message}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="p-2 rounded cursor-pointer hover:bg-gray-100 flex flex-col space-y-1 mb-2"
                      onClick={() => handleRowClick(message)}
                    >
                      <span className="text-sm font-medium">{message}</span>
                      <div className="h-6 rounded bg-muted relative">
                        <div
                          className="h-full rounded bg-red-500 flex items-center justify-center text-white text-xs"
                          style={{ width: `${percent}%` }}
                        >
                          {percent} %
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {`${percent} % (${count} / ${total} ${active === "fetching" ? "fetching errors" : "processing errors"})`}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })
        )}
      </div>
    </div>
  )
}
