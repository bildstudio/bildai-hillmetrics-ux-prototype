"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { BaseBlade } from "@/components/blade/base-blade"
import { X, MoreVertical, Info, Globe, Eye, Workflow, Minus, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useViewBlade } from "@/lib/view-blade-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import FluxDetailsInfoPanel from "../processing-history/FluxDetailsInfoPanel"
import CalculationDiagram from "./CalculationDiagram"

const TABS = [
  { id: "summary", label: "Summary", icon: Globe },
  { id: "diagram", label: "View as diagram", icon: Workflow },
  { id: "details", label: "Details", icon: Eye },
]

const ResponsiveTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tabId: string) => void
}) => {
  const [visibleTabs, setVisibleTabs] = useState(TABS)
  const [hiddenTabs, setHiddenTabs] = useState<typeof TABS>([])
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const measurementRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const calculateTabs = () => {
      const container = tabsContainerRef.current
      if (!container) return

      const containerWidth = container.offsetWidth
      const moreButtonWidth = 120
      let totalWidth = 0
      let visibleCount = 0

      for (let i = 0; i < TABS.length; i++) {
        const measurementEl = measurementRefs.current[i]
        if (!measurementEl) continue

        const tabWidth = measurementEl.offsetWidth + 8

        if (
          totalWidth + tabWidth >
          containerWidth - (hiddenTabs.length > 0 || i < TABS.length - 1 ? moreButtonWidth : 0)
        ) {
          break
        }

        totalWidth += tabWidth
        visibleCount++
      }

      if (visibleCount === 0) visibleCount = 1

      const newVisibleTabs = TABS.slice(0, visibleCount)
      const newHiddenTabs = TABS.slice(visibleCount)

      setVisibleTabs(newVisibleTabs)
      setHiddenTabs(newHiddenTabs)
    }

    const timeoutId = setTimeout(calculateTabs, 100)

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculateTabs, 100)
    })

    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

  const handleDropdownSelect = (tabId: string) => {
    onTabChange(tabId)
    setIsMoreOpen(false)
  }

  return (
    <>
      <TabsList
        ref={tabsContainerRef}
        className="relative flex items-center justify-start bg-transparent p-0 h-auto w-full overflow-hidden"
      >
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
        {hiddenTabs.length > 0 && (
          <DropdownMenu 
            open={isMoreOpen} 
            onOpenChange={setIsMoreOpen}
            modal={false}
          >
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 ml-auto px-4 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                More ({hiddenTabs.length}) <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              forceMount 
              className="z-[10050]" 
              style={{ zIndex: 10050 }}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {hiddenTabs.map((tab) => (
                <DropdownMenuItem key={tab.id} onSelect={() => handleDropdownSelect(tab.id)}>
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none -z-10">
        <div className="flex">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                measurementRefs.current[index] = el
              }}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-3 font-medium"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

interface CalculationDetailsBladeProps {
  calculationId: number
  fluxName?: string
  fluxId?: string
  onClose: () => void
  onReady?: () => void
}

// Mock calculation data interface
interface CalculationData {
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
  input_records: number
  processed_records: number
  output_records: number
  calculation_rules: string[]
  accuracy_percentage: number
  performance_metrics: {
    cpu_usage: number
    memory_usage: number
    disk_io: number
  }
}

export default function CalculationDetailsBlade({
  calculationId,
  fluxName = `Calculation ${calculationId}`,
  fluxId = "",
  onClose,
  onReady,
}: CalculationDetailsBladeProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [infoOpen, setInfoOpen] = useState(false)
  const [calculationData, setCalculationData] = useState<CalculationData | null>(null)
  const [loading, setLoading] = useState(true)

  const { closeTopBlade } = useBladeStack()

  const fullTitle = `${fluxName} - Calculation ${calculationId}`

  const truncateTitle = (title: string, maxLength: number) => {
    return title.length > maxLength ? `${title.substring(0, maxLength)}...` : title
  }

  const handleMinimize = useCallback(() => {
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key.toLowerCase() === "i") setInfoOpen(true)
    },
    [onClose],
  )

  // Load calculation data
  useEffect(() => {
    const loadCalculationData = async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 800))
        
        const mockData: CalculationData = {
          id: calculationId,
          flux_id: parseInt(fluxId) || Math.floor(Math.random() * 100) + 1,
          flux_name: fluxName,
          run_number: Math.floor(Math.random() * 1000) + 1,
          status: ["Success", "Failed", "InProgress"][Math.floor(Math.random() * 3)],
          progress: Math.floor(Math.random() * 100),
          started_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          completed_at: Math.random() > 0.3 ? new Date().toISOString() : null,
          duration_minutes: Math.floor(Math.random() * 180) + 1,
          content_count: Math.floor(Math.random() * 2000) + 500,
          error_message: Math.random() > 0.7 ? "Calculation overflow detected" : null,
          stage_type: "Calculation Stage",
          stage_order: 5,
          sub_process_count: Math.floor(Math.random() * 30) + 10,
          input_records: Math.floor(Math.random() * 10000) + 2000,
          processed_records: Math.floor(Math.random() * 8000) + 1500,
          output_records: Math.floor(Math.random() * 7000) + 1000,
          calculation_rules: [
            "Apply mathematical transformations",
            "Execute complex algorithms",
            "Perform statistical analysis",
            "Generate computed metrics",
            "Validate calculation results",
            "Optimize performance parameters"
          ],
          accuracy_percentage: Math.floor(Math.random() * 15) + 85,
          performance_metrics: {
            cpu_usage: Math.floor(Math.random() * 40) + 30,
            memory_usage: Math.floor(Math.random() * 50) + 25,
            disk_io: Math.floor(Math.random() * 30) + 10
          }
        }
        
        setCalculationData(mockData)
      } catch (error) {
        console.error("Failed to load calculation data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCalculationData()
  }, [calculationId, fluxId, fluxName])

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
                  <ResponsiveTabs activeTab={activeTab} onTabChange={setActiveTab} />
                </div>
              </div>
              
              <TabsContent value="summary" className="flex-grow overflow-y-auto gmail-scrollbar">
                <div className="p-4 md:p-6">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : calculationData ? (
                    <div className="space-y-6">
                      {/* Status Overview */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Calculation Overview</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{calculationData.input_records.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">Input Records</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{calculationData.processed_records.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">Processed Records</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{calculationData.output_records.toLocaleString()}</div>
                            <div className="text-sm text-gray-500">Output Records</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{calculationData.accuracy_percentage}%</div>
                            <div className="text-sm text-gray-500">Accuracy</div>
                          </div>
                        </div>
                      </div>

                      {/* Performance Metrics */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-gray-50 rounded">
                            <div className="text-xl font-bold text-red-600">{calculationData.performance_metrics.cpu_usage}%</div>
                            <div className="text-sm text-gray-500">CPU Usage</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded">
                            <div className="text-xl font-bold text-yellow-600">{calculationData.performance_metrics.memory_usage}%</div>
                            <div className="text-sm text-gray-500">Memory Usage</div>
                          </div>
                          <div className="text-center p-4 bg-gray-50 rounded">
                            <div className="text-xl font-bold text-blue-600">{calculationData.performance_metrics.disk_io}%</div>
                            <div className="text-sm text-gray-500">Disk I/O</div>
                          </div>
                        </div>
                      </div>

                      {/* Calculation Rules */}
                      <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4">Applied Calculation Rules</h3>
                        <div className="space-y-2">
                          {calculationData.calculation_rules.map((rule, index) => (
                            <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                              <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-sm font-medium">
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
                              <span className={`px-2 py-1 rounded text-sm border ${getStatusColor(calculationData.status)}`}>
                                {calculationData.status}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Progress:</span>
                              <span className="font-medium">{calculationData.progress}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Duration:</span>
                              <span className="font-medium">{calculationData.duration_minutes}m</span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Started:</span>
                              <span className="font-medium">{new Date(calculationData.started_at).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Completed:</span>
                              <span className="font-medium">
                                {calculationData.completed_at ? new Date(calculationData.completed_at).toLocaleString() : "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sub Processes:</span>
                              <span className="font-medium">{calculationData.sub_process_count}</span>
                            </div>
                          </div>
                        </div>
                        {calculationData.error_message && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                            <div className="text-sm text-red-600 font-medium">Error Message:</div>
                            <div className="text-sm text-red-700 mt-1">{calculationData.error_message}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                      <p>No calculation data available</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="diagram" className="flex-grow overflow-hidden">
                <div className="p-0 md:p-0 h-full">
                  <CalculationDiagram calculationId={calculationId} />
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="flex-grow overflow-auto">
                <div className="p-4 md:p-6 space-y-2 text-sm">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : calculationData ? (
                    <div className="space-y-4">
                      <div><strong>ID:</strong> {calculationData.id}</div>
                      <div><strong>Flux ID:</strong> {calculationData.flux_id}</div>
                      <div><strong>Flux Name:</strong> {calculationData.flux_name}</div>
                      <div><strong>Run Number:</strong> {calculationData.run_number}</div>
                      <div><strong>Status:</strong> {calculationData.status}</div>
                      <div><strong>Progress:</strong> {calculationData.progress}%</div>
                      <div><strong>Started At:</strong> {new Date(calculationData.started_at).toLocaleString()}</div>
                      <div><strong>Completed At:</strong> {calculationData.completed_at ? new Date(calculationData.completed_at).toLocaleString() : "Not completed"}</div>
                      <div><strong>Duration:</strong> {calculationData.duration_minutes} minutes</div>
                      <div><strong>Content Count:</strong> {calculationData.content_count}</div>
                      <div><strong>Stage Type:</strong> {calculationData.stage_type}</div>
                      <div><strong>Stage Order:</strong> {calculationData.stage_order}</div>
                      <div><strong>Sub Process Count:</strong> {calculationData.sub_process_count}</div>
                      <div><strong>Input Records:</strong> {calculationData.input_records}</div>
                      <div><strong>Processed Records:</strong> {calculationData.processed_records}</div>
                      <div><strong>Output Records:</strong> {calculationData.output_records}</div>
                      <div><strong>Accuracy:</strong> {calculationData.accuracy_percentage}%</div>
                      <div><strong>CPU Usage:</strong> {calculationData.performance_metrics.cpu_usage}%</div>
                      <div><strong>Memory Usage:</strong> {calculationData.performance_metrics.memory_usage}%</div>
                      <div><strong>Disk I/O:</strong> {calculationData.performance_metrics.disk_io}%</div>
                      {calculationData.error_message && (
                        <div><strong>Error Message:</strong> {calculationData.error_message}</div>
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
