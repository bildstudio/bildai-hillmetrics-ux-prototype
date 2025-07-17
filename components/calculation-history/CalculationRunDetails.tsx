"use client"

import { useEffect, useState } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2 } from "lucide-react"
import { getCalculationHistoryById, type CalculationHistoryData } from "@/app/actions/calculation-history"

export default function CalculationRunDetails({ calculationId }: { calculationId: number }) {
  const [data, setData] = useState<CalculationHistoryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const res = await getCalculationHistoryById(calculationId)
      if (!res.error) setData(res.data)
      setLoading(false)
    }
    load()
  }, [calculationId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-red-500 text-center py-10">No data</div>
  }

  const itemClass = "bg-white rounded-xl shadow-sm overflow-hidden"
  const triggerClass = "text-lg px-6 py-4 hover:bg-gray-50 border-b border-gray-200"
  const contentClass = "px-6"

  const formatDuration = (secs: number | null) => (secs != null ? `${(secs / 60).toFixed(1)} min` : "-")

  return (
    <div className="w-full sm:w-[90%] md:w-[80%] lg:w-[60%] mx-auto">
      <Accordion type="multiple" defaultValue={["basic", "timing"]} className="space-y-6">
        <AccordionItem value="basic" className={itemClass}>
          <AccordionTrigger className={triggerClass}>Basic information</AccordionTrigger>
          <AccordionContent className={contentClass}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <p className="text-sm text-gray-500">Flux ID</p>
                <p className="font-medium break-all">{data.fluxID}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium break-all">{data.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Progress</p>
                <p className="font-medium break-all">{data.progress ?? 0}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Number of items</p>
                <p className="font-medium break-all">{data.numberOfItems ?? "-"}</p>
              </div>
              {data.errorMessage && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Error message</p>
                  <p className="font-medium break-words">{data.errorMessage}</p>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="timing" className={itemClass}>
          <AccordionTrigger className={triggerClass}>Timing</AccordionTrigger>
          <AccordionContent className={contentClass}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div>
                <p className="text-sm text-gray-500">Started at</p>
                <p className="font-medium break-all">{data.timestamp}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Completed at</p>
                <p className="font-medium break-all">{data.completedAt ?? "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium break-all">{formatDuration(data.calculationTimeInSeconds)}</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
