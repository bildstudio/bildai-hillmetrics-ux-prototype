"use client"

import { useEffect, useState, useCallback } from "react"
import { BaseBlade } from "@/components/blade/base-blade"
import { X, MoreVertical, Info, Globe, Eye, Workflow, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useViewBlade } from "@/lib/view-blade-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import FluxDetailsInfoPanel from "../processing-history/FluxDetailsInfoPanel"
import NormalizationDiagram from "./NormalizationDiagram"

interface NormalizationDetailsBladeProps {
  normalizationId: number
  fluxName?: string
  fluxId?: string
  onClose: () => void
  onReady?: () => void
}

// Mock normalization data interface
interface NormalizationData {
  id: number
  flux_id: number
  flux_name: string | null
  run_number: number
  status: string
  progress: number | null
  started_at: string
  completed_at: string | null
  duration_minutes: number | null
  content_count: number | null
  error_message: string | null
  stage_type: string
  stage_order: number
  sub_process_count: number | null
  processed_records: number
  failed_records: number
  skipped_records: number
  normalization_rules: string[]
  data_quality_score: number
}

export default function NormalizationDetailsBlade({
  normalizationId,
  fluxName = `Normalization ${normalizationId}`,
  fluxId = "",
  onClose,
  onReady,
}: NormalizationDetailsBladeProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [infoOpen, setInfoOpen] = useState(false)
  const [normalizationData, setNormalizationData] = useState<NormalizationData | null>(null)
  const [loading, setLoading] = useState(true)

  const { openBlade, closeTopBlade } = useBladeStack()
  const { openBlade: openViewBlade } = useViewBlade()
  const { openBlade: openEditBlade } = useEditBlade()

  const fullTitle = `${fluxName} - Normalization ${normalizationId}`

  const truncateTitle = (title: string, maxLength: number) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title
  }

  const handleMinimize = useCallback(() => {
    // Minimize blade logic
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key.toLowerCase() === "i") setInfoOpen(true)
    },
    [onClose],
  )

  // Load normalization data
  useEffect(() => {
    const loadNormalizationData = async () => {
      setLoading(true)
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        
        // Generate mock data
        const mockData: NormalizationData = {
          id: normalizationId,
          flux_id: parseInt(fluxId) || Math.floor(Math.random() * 100) + 1,
          flux_name: fluxName,
          run_number: Math.floor(Math.random() * 1000) + 1,
          status: ["Success", "Failed", "InProgress"][Math.floor(Math.random() * 3)],
          progress: Math.floor(Math.random() * 100),
          started_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          completed_at: Math.random() > 0.3 ? new Date().toISOString() : null,
          duration_minutes: Math.floor(Math.random() * 120) + 1,
          content_count: Math.floor(Math.random() * 1000) + 100,
          error_message: Math.random() > 0.7 ? "Normalization validation failed" : null,
          stage_type: "Normalization Stage",
          stage_order: 3,
          sub_process_count: Math.floor(Math.random() * 20) + 5,
          processed_records: Math.floor(Math.random() * 5000) + 1000,
          failed_records: Math.floor(Math.random() * 100),
          skipped_records: Math.floor(Math.random() * 50),
          normalization_rules: [
            "Remove duplicate entries",
            "Standardize date formats",
            "Validate data types",
            "Apply business rules",
            "Clean text fields"
          ],
          data_quality_score: Math.floor(Math.random() * 30) + 70
        }
        
        setNormalizationData(mockData)
      } catch (error) {
        console.error("Failed to load normalization data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadNormalizationData()
  }, [normalizationId, fluxId, fluxName])

  useEffect(() => {
    onReady?.()
  }, [onReady])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200'
      case 'failed': return 'text-red-600 bg-red-50 border-red-200'
      case 'inprogress': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <BaseBlade onClose={onClose} bladeType="view" className="z-[10000]">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between pl-[25px] md:pl-[25px] md:pr-3 border-b h-16 shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <h1 className="text-xl font-medium text-gray-800 truncate max-w-[60vw]">
                  <span className="hidden md:inline">{fullTitle}</span>
                  <span className="md:hidden">{truncateTitle(fullTitle, 20)}</span>
                </h1>
              </TooltipTrigger>
              <TooltipContent>
                <p>{fullTitle}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className={cn(
                "hidden md:flex items-center gap-2 text-[#5f6b7b] hover:bg-[#5f6b7b]/10",
                infoOpen && "bg-[#5f6b7b]/20",
              )}
              onClick={() => setInfoOpen(true)}
            >
              <Info className="h-4 w-4" /> Flux details
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMinimize}
              className="h-8 w-8 text-gray-500 hover:bg-gray-100"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-grow flex bg-[#F1F3F4] overflow-hidden">
          <div className="flex-grow flex flex-col min-w-0 min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
              <div className="sticky top-0 z-10 bg-[#F1F3F4] border-b border-[#e5e7eb] shrink-0">
                <div className="px-4 md:px-6">
                  <TabsList className="relative flex items-center justify-start bg-transparent p-0 h-auto w-full overflow-hidden">
                    <TabsTrigger
                      value="summary"
                      className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                    >
                      <Globe className="h-4 w-4" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger
                      value="diagram"
                      className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                    >
                      <Workflow className="h-4 w-4" />
                      View as diagram
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <TabsContent value="summary" className="flex-grow overflow-y-auto gmail-scrollbar">
                <div className="p-4 md:p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : normalizationData ? (
                    <div className="space-y-6">
                      {/* Status Overview */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Normalization Overview</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{normalizationData.processed_records.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">Processed Records</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{normalizationData.failed_records}</div>
                            <div className="text-sm text-gray-500">Failed Records</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{normalizationData.skipped_records}</div>
                            <div className="text-sm text-gray-500">Skipped Records</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{normalizationData.data_quality_score}%</div>
                            <div className="text-sm text-gray-500">Quality Score</div>
                          </div>
                        </div>
                      </div>

                      {/* Normalization Rules */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Applied Normalization Rules</h3>
                        <div className="space-y-2">
                          {normalizationData.normalization_rules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
                                {index + 1}
                              </div>
                              <span className="text-sm">{rule}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Execution Details */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Execution Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Status:</span>
                              <span className={`px-2 py-1 rounded text-sm border ${getStatusColor(normalizationData.status)}`}>
                                {normalizationData.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Progress:</span>
                              <span className="font-medium">{normalizationData.progress}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{normalizationData.duration_minutes}m</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Started:</span>
                              <span className="font-medium">{new Date(normalizationData.started_at).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Completed:</span>
                              <span className="font-medium">
                                {normalizationData.completed_at ? new Date(normalizationData.completed_at).toLocaleString() : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sub Processes:</span>
                              <span className="font-medium">{normalizationData.sub_process_count}</span>
                            </div>
                          </div>
                        </div>
                        {normalizationData.error_message && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                            <div className="text-sm text-red-600 font-medium">Error Message:</div>
                            <div className="text-sm text-red-700 mt-1">{normalizationData.error_message}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <p>No normalization data available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="diagram" className="flex-grow overflow-hidden">
                <div className="p-0 md:p-0 h-full">
                  <NormalizationDiagram normalizationId={normalizationId} />
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="flex-grow overflow-auto">
                <div className="p-4 md:p-6 space-y-2 text-sm">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : normalizationData ? (
                    <div className="space-y-4">
                      <div><strong>ID:</strong> {normalizationData.id}</div>
                      <div><strong>Flux ID:</strong> {normalizationData.flux_id}</div>
                      <div><strong>Flux Name:</strong> {normalizationData.flux_name}</div>
                      <div><strong>Run Number:</strong> {normalizationData.run_number}</div>
                      <div><strong>Status:</strong> {normalizationData.status}</div>
                      <div><strong>Progress:</strong> {normalizationData.progress}%</div>
                      <div><strong>Started At:</strong> {new Date(normalizationData.started_at).toLocaleString()}</div>
                      <div><strong>Completed At:</strong> {normalizationData.completed_at ? new Date(normalizationData.completed_at).toLocaleString() : "Not completed"}</div>
                      <div><strong>Duration:</strong> {normalizationData.duration_minutes} minutes</div>
                      <div><strong>Content Count:</strong> {normalizationData.content_count}</div>
                      <div><strong>Stage Type:</strong> {normalizationData.stage_type}</div>
                      <div><strong>Stage Order:</strong> {normalizationData.stage_order}</div>
                      <div><strong>Sub Process Count:</strong> {normalizationData.sub_process_count}</div>
                      <div><strong>Processed Records:</strong> {normalizationData.processed_records}</div>
                      <div><strong>Failed Records:</strong> {normalizationData.failed_records}</div>
                      <div><strong>Skipped Records:</strong> {normalizationData.skipped_records}</div>
                      <div><strong>Data Quality Score:</strong> {normalizationData.data_quality_score}%</div>
                      {normalizationData.error_message && (
                        <div><strong>Error Message:</strong> {normalizationData.error_message}</div>
                      )}
                    </div>
                  ) : (
                    <p>No details available</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {infoOpen && (
        <FluxDetailsInfoPanel
          isOpen={infoOpen}
          onClose={() => setInfoOpen(false)}
          fluxId={fluxId}
          fluxName={fluxName}
        />
      )}
    </BaseBlade>
  )
}
