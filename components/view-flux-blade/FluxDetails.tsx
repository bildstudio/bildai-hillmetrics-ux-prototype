"use client"

import { useEffect, useState } from "react"
import type { FluxData } from "@/lib/data-store"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Loader2 } from "lucide-react"

interface FluxDetailsProps {
  reportId: string
  singleColumn?: boolean
  compact?: boolean
}

const safeParse = (val: any) => {
  if (!val) return {}
  if (typeof val === "object") return val
  try {
    return JSON.parse(val)
  } catch {
    return {}
  }
}

export default function FluxDetails({ reportId, singleColumn = false, compact = false }: FluxDetailsProps) {
  const [data, setData] = useState<FluxData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      const idNum = Number.parseInt(reportId, 10)
      if (isNaN(idNum)) {
        setError("Invalid report ID")
        setIsLoading(false)
        return
      }
      const res = await fetch(`/api/reports/${idNum}`)
      const json = await res.json()
      if (json.error || !json.data) {
        setError(json.error || "Failed to load data")
      } else {
        setData(json.data)
      }
      setIsLoading(false)
    }
    load()
  }, [reportId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
      </div>
    )
  }

  if (!data || error) {
    return <div className="text-red-500 text-center py-10">{error || "No data"}</div>
  }

  const fetchConfig = safeParse((data as any).fetchScheduleConfiguration)
  const processConfig = safeParse((data as any).processingScheduleConfiguration)
  const typeConfig = safeParse((data as any).fluxTypeConfiguration)

  const itemClass = compact
    ? "bg-white rounded-none shadow-sm overflow-hidden"
    : "bg-white rounded-xl shadow-sm overflow-hidden"
  const triggerClass = compact
    ? "text-base font-normal px-6 py-4 hover:bg-gray-50 border-b border-gray-200"
    : "text-lg px-6 py-4 hover:bg-gray-50 border-b border-gray-200"
  const contentClass = "px-6"
  
  const renderValue = (key: string, value: any) => {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">Not set</span>
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 italic">None</span>
      }

      // Handle metadata array
      if (
        key.toLowerCase().includes("metadata") &&
        value.every((item) => typeof item === "object" && "key" in item && "value" in item)
      ) {
        return (
          <div className="space-y-2">
            {value.map((item, index) => (
              <div key={index} className="space-y-1 p-2 border border-gray-200 rounded-lg bg-white">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500 capitalize">{item.key}</p>
                  <p className="font-medium break-all">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        )
      }

      // Handle email rule groups
      if (key.toLowerCase().includes("emailrulegroup") || key.toLowerCase().includes("rulegrou")) {
        return (
          <div className="space-y-4">
            {value.map((group, groupIndex) => (
              <div key={groupIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-700">Rule Group {groupIndex + 1}</span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {group.logicalOperator || "AND"}
                  </span>
                </div>
                {group.criteria && group.criteria.length > 0 ? (
                  <div className="space-y-2">
                    {group.criteria.map((criterion, criterionIndex) => (
                      <div key={criterionIndex} className="flex items-center gap-2 text-sm p-2 bg-white rounded border">
                        <span className="font-medium text-gray-700">{criterion.field || criterion.key}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          {criterion.operator}
                        </span>
                        <span className="text-gray-600 break-all">{criterion.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-sm">No criteria defined</span>
                )}
              </div>
            ))}
          </div>
        )
      }

      // Handle other arrays
      return (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div key={index}>
              {typeof item === "object" ? (
                <div className="space-y-1">
                  {Object.entries(item).map(([k, v]) => (
                    <div key={k} className="flex items-center gap-2">
                      <p className="text-sm text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                      <p className="font-medium break-all">{String(v)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-medium break-all">{String(item)}</p>
              )}
            </div>
          ))}
        </div>
      )
    }

    // Handle objects
    if (typeof value === "object") {
      const entries = Object.entries(value)
      if (entries.length === 0) {
        return <span className="text-gray-400 italic">Empty</span>
      }

      return (
        <div className="space-y-2">
          {entries.map(([k, v]) => (
            <div key={k} className="space-y-1 p-2 border border-gray-200 rounded-lg bg-white">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</p>
                <p className="font-medium break-all">{String(v)}</p>
              </div>
            </div>
          ))}
        </div>
      )
    }

    // Handle primitive values
    return <span className="font-medium text-right break-all ml-0">{String(value)}</span>
  }

  const renderKeyValue = (obj: Record<string, any>) => (
    <div className="space-y-4">
      {Object.entries(obj).map(([k, v]) => (
        <div key={k} className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1").trim()}</span>
          </div>
          <div className="ml-0">{renderValue(k, v)}</div>
        </div>
      ))}
    </div>
  )

  return (
    <div className={singleColumn ? "w-full" : "w-full sm:w-[90%] md:w-[80%] lg:w-[60%] mx-auto"}>
      <Accordion type="multiple" defaultValue={["basic", "flux", "type"]} className="space-y-6">
        <AccordionItem value="basic" className={itemClass}>
          <AccordionTrigger className={triggerClass}>
            Basic information
          </AccordionTrigger>
          <AccordionContent className={contentClass}>
            <div className="space-y-6">
              <div className={singleColumn ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                <div>
                  <p className="text-sm text-gray-500">Flux name</p>
                  <p className="font-medium break-all">{data.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium break-all">{(data as any).source || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Comment</p>
                  <p className="font-medium break-words">{(data as any).comment || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium break-words">{(data as any).description || "-"}</p>
                </div>
              </div>
              <div className={singleColumn ? "grid grid-cols-1 gap-6" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
                <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-white">
                  <h3 className="text-lg text-gray-900 font-normal">Fetch schedule</h3>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium break-all">{fetchConfig.type === "Never" ? "Inactive" : "Active"}</p>
                  </div>
                  {Object.keys(fetchConfig).length > 0 && renderKeyValue(fetchConfig)}
                </div>
                <div className="space-y-2 p-4 border border-gray-200 rounded-lg bg-white">
                  <h3 className="text-lg text-gray-900 font-normal">Process schedule</h3>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium break-all">{processConfig.type === "Never" ? "Inactive" : "Active"}</p>
                  </div>
                  {Object.keys(processConfig).length > 0 && renderKeyValue(processConfig)}
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="flux" className={itemClass}>
          <AccordionTrigger className={triggerClass}>
            Flux configuration
          </AccordionTrigger>
          <AccordionContent className={contentClass}>
            <div className="space-y-4">
              <div className={singleColumn ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                <div>
                  <p className="text-sm text-gray-500">Flux Type</p>
                  <p className="font-medium break-all">{(data as any).fluxType || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Financial Type</p>
                  <p className="font-medium break-all">{(data as any).financialType || "-"}</p>
                </div>
              </div>
              <div className={singleColumn ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
                <div>
                  <p className="text-sm text-gray-500">Flux State</p>
                  <p className="font-medium break-all">{(data as any).fluxState || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Allow Concurrent Multi-Fetching</p>
                  <p className="font-medium break-all">{(data as any).allowConcurrentMultiFetching ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="type" className={itemClass}>
          <AccordionTrigger className={triggerClass}>
            Type configuration
          </AccordionTrigger>
          <AccordionContent className={contentClass}>
            {Object.keys(typeConfig).length > 0 ? (
              renderKeyValue(typeConfig)
            ) : (
              <p className="text-sm text-gray-500">No type configuration</p>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
