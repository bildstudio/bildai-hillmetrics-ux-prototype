"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BaseBlade } from "@/components/blade/base-blade"
import { X, MoreVertical, Info, Globe, Eye, FileText, Minus, Workflow, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProcessingHistoryMenuItems, type ProcessingHistoryMenuAction } from "./menu-items"
import type { ProcessingHistoryData } from "@/app/actions/processing-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { FetchedContentsGrid } from "@/components/fetched-contents/fetched-contents-grid"
import { useViewBlade } from "@/lib/view-blade-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useToast } from "@/hooks/use-toast"
import FluxDetailsInfoPanel from "./FluxDetailsInfoPanel"
import ContentInformation from "./ContentInformation"
import ProcessingStatistics from "./ProcessingStatistics"
import ProcessingDetails from "./ProcessingDetails"
import ProcessingRunDetails from "./ProcessingRunDetails"
import ProcessingDiagram from "./ProcessingDiagram"
import type { ContentStatusCount, ProcessingStats } from "@/app/actions/processing-content-history"

const TABS = [
  { id: "summary", label: "Summary", icon: Globe },
  { id: "details", label: "Details", icon: Eye },
  { id: "diagram", label: "View as diagram", icon: Workflow },
  { id: "content", label: "Content", icon: FileText },
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

interface ProcessingHistoryDetailsBladeProps {
  processingId: number
  fluxName: string
  fluxId: string
  onClose: () => void
  onFluxDetails?: () => void
  onPreviewOpenChange?: (open: boolean) => void
  onReady?: () => void
}

export default function ProcessingHistoryDetailsBlade({
  processingId,
  fluxName,
  fluxId,
  onClose,
  onFluxDetails,
  onPreviewOpenChange,
  onReady,
}: ProcessingHistoryDetailsBladeProps) {
  // State to hold the actual flux information
  const [actualFluxId, setActualFluxId] = useState<string>(fluxId)
  const [actualFluxName, setActualFluxName] = useState<string>(fluxName)
  
  const fullTitle = `ID: ${processingId} - Processing history details - ${actualFluxName}`
  const [infoOpen, setInfoOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")
  const [contentStatusFilter, setContentStatusFilter] = useState<string | null>(null)
  const [overrideChart, setOverrideChart] = useState<ContentStatusCount[] | null>(null)
  const [overrideStats, setOverrideStats] = useState<ProcessingStats | null>(null)
  const truncateTitle = (title: string, maxLength = 30) => {
    return title.length <= maxLength ? title : `${title.substring(0, maxLength - 3)}...`
  }
  const { openBlade: openStackBlade, closeTopBlade, minimizeStack } = useBladeStack()
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openEditBladeCtx } = useEditBlade()
  const { toast } = useToast()

  // Effect to fetch actual flux data if fluxId is invalid or missing
  useEffect(() => {
    const fetchFluxData = async () => {
      // Check if we have an invalid fluxId ("all", empty string, etc.)
      if (!fluxId || fluxId === "all" || fluxId === "" || fluxName.includes(`Flux ${processingId}`)) {
        try {
          // Fetch the processing history data to get the real fluxId and fluxName
          const response = await fetch(`/api/processing-history?${new URLSearchParams({
            fluxId: 'all',
            page: '1',
            pageSize: '1',
            sortColumn: 'processingID',
            sortDirection: 'desc',
            filters: JSON.stringify([{ field: 'processingID', operator: 'equals', value: processingId }])
          })}`)
          
          if (response.ok) {
            const data = await response.json()
            if (data.data && !data.error && data.data.length > 0) {
              const processingData = data.data[0]
              const realFluxId = String(processingData.fluxID || processingData.flux_id || "")
              
              setActualFluxId(realFluxId)
              
              // Try to get the flux name from reports API
              if (realFluxId && realFluxId !== "all" && realFluxId !== "") {
                try {
                  const fluxResponse = await fetch(`/api/reports/${realFluxId}`)
                  if (fluxResponse.ok) {
                    const fluxData = await fluxResponse.json()
                    if (fluxData.data && !fluxData.error) {
                      setActualFluxName(fluxData.data.name || `Flux ${realFluxId}`)
                    } else {
                      setActualFluxName(`Flux ${realFluxId}`)
                    }
                  } else {
                    setActualFluxName(`Flux ${realFluxId}`)
                  }
                } catch (error) {
                  console.error('Error fetching flux name:', error)
                  setActualFluxName(`Flux ${realFluxId}`)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error fetching processing history data:', error)
        }
      }
    }
    
    fetchFluxData()
  }, [processingId, fluxId, fluxName])

  const openViewBlade = useCallback(
    (id?: string, name?: string) => {
      const targetId = id || actualFluxId
      const targetName = name || actualFluxName
      
      if (!targetId || targetId === "all" || targetId === "") {
        toast({
          title: "Error",
          description: "Invalid flux ID. Cannot open flux details.",
          variant: "destructive",
        })
        return
      }
      
      openViewBladeCtx(targetId, targetName, { stackControlled: true })
      openStackBlade(
        () => import("@/components/view-flux-blade/ViewFluxBlade"),
        {
          reportId: targetId,
        },
        targetName,
      )
    },
    [openViewBladeCtx, openStackBlade, actualFluxId, actualFluxName, toast],
  )

  const openEditBlade = useCallback(
    (id?: string, name?: string) => {
      const targetId = id || actualFluxId
      const targetName = name || actualFluxName
      
      if (!targetId || targetId === "all" || targetId === "") {
        toast({
          title: "Error",
          description: "Invalid flux ID. Cannot open flux editor.",
          variant: "destructive",
        })
        return
      }
      
      openEditBladeCtx(targetId, targetName, { stackControlled: true })
      openStackBlade(
        () => import("@/components/edit-flux-blade/EditFluxBlade"),
        {
          reportId: targetId,
        },
        targetName,
      )
    },
    [openEditBladeCtx, openStackBlade, actualFluxId, actualFluxName, toast],
  )

  const handleMinimize = () => {
    minimizeStack()
  }

  useEffect(() => {
    onReady?.()
    // run once on mount
  }, [])

  const handlePreviewFile = useCallback(
    (file: { id: string; name: string; fluxId: string; fluxName?: string }) => {
      openStackBlade(
        () => import("../view-flux-blade/FilePreviewBlade"),
        {
          file,
          onClose: closeTopBlade,
        },
        file.name,
      )
    },
    [openStackBlade, closeTopBlade],
  )

  const handleNavigateToContent = useCallback((status: string | null) => {
    setContentStatusFilter(status)
    setActiveTab("content")
  }, [])

  const handleMenuAction = (action: ProcessingHistoryMenuAction) => {
    switch (action) {
      case "viewDetails":
        console.log("View details clicked for", processingId)
        break
      case "quickFlux":
        console.log("Quick flux clicked for", processingId)
        break
      case "viewFlux":
        if (!fluxId) {
          toast({
            title: "Flux ID unavailable",
            description: "Cannot open flux details without a Flux ID.",
            variant: "destructive",
          })
          break
        }
        openViewBlade(fluxId, fluxName)
        break
      case "editFlux":
        if (!fluxId) {
          toast({
            title: "Flux ID unavailable",
            description: "Cannot edit flux because no Flux ID was provided.",
            variant: "destructive",
          })
          break
        }
        openEditBlade(fluxId, fluxName)
        break
      case "renameFlux":
        console.log("Rename flux clicked for", processingId)
        break
      case "viewContent":
        console.log("View content clicked for", processingId)
        break
      default:
        break
    }
  }

  useEffect(() => {
    return () => {
      onPreviewOpenChange?.(false)
    }
  }, [onPreviewOpenChange])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
      if (e.key.toLowerCase() === "i") setInfoOpen(true)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <BaseBlade onClose={onClose} bladeType="view" className="z-[10000]">
      <motion.div className="h-full flex flex-col">
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
                infoOpen && "bg-[#5f6b7b]/20"
              )}
              onClick={() =>
                setInfoOpen((prev) => {
                  const next = !prev
                  if (next) onFluxDetails?.()
                  return next
                })
              }
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
            <DropdownMenu 
              modal={false}
              onOpenChange={(open) => {
                // Prevent blade from closing when dropdown opens
                if (open) {
                  document.body.style.pointerEvents = 'auto'
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-64 z-[10050]" 
                align="end"
                onCloseAutoFocus={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <ProcessingHistoryMenuItems
                  item={{ processingID: processingId, fluxID: Number(fluxId), fetchingID: null } as ProcessingHistoryData}
                  onAction={handleMenuAction}
                  components={{ Item: DropdownMenuItem, Separator: DropdownMenuSeparator }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
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
          <div className="flex-grow flex flex-col min-w-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-[#F1F3F4] border-b border-[#e5e7eb] shrink-0">
              <div className="px-4 md:px-6">
                <ResponsiveTabs activeTab={activeTab} onTabChange={setActiveTab} />
              </div>
            </div>
            <TabsContent value="summary" className="flex-grow overflow-auto">
              <div className="p-4 md:p-6 space-y-6">
                <ProcessingDetails
                  processingId={processingId}
                  onPreview={handlePreviewFile}
                  onComplete={() => {
                    setOverrideChart([
                      { status: "Success", count: 1 },
                      { status: "Currently processing", count: 0 },
                      { status: "Failed", count: 0 },
                    ])
                    setOverrideStats({
                      inserted: 154,
                      updated: 65,
                      ignored: 5,
                      errors: 0,
                    })
                  }}
                />
                <div className="flex flex-col lg:flex-row gap-6">
                  <ContentInformation
                    processingId={processingId}
                    onNavigate={handleNavigateToContent}
                    overrideData={overrideChart}
                  />
                  <ProcessingStatistics
                    processingId={processingId}
                    onNavigate={handleNavigateToContent}
                    overrideStats={overrideStats}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="details" className="flex-grow overflow-auto">
              <div className="p-4 md:p-6">
                <ProcessingRunDetails processingId={processingId} />
              </div>
            </TabsContent>
            <TabsContent value="diagram" className="flex-grow overflow-hidden">
              <div className="p-0 md:p-0 h-full">
                <ProcessingDiagram processingId={processingId} />
              </div>
            </TabsContent>
            <TabsContent value="content" className="flex-grow overflow-auto">
              <div className="p-4 md:p-6">
                <FetchedContentsGrid
                  fluxId="all"
                  processingIdFilter={processingId}
                  onPreviewClick={handlePreviewFile}
                  hideProcessingIdBadge
                  hideFluxIdColumn
                  statusFilter={contentStatusFilter}
                  onClearStatusFilter={() => setContentStatusFilter(null)}
                />
              </div>
            </TabsContent>
          </Tabs>
          </div>
          <FluxDetailsInfoPanel
            reportId={actualFluxId}
            open={infoOpen}
            onClose={() => setInfoOpen(false)}
            drawer
          />
        </div>
      </motion.div>
    </BaseBlade>
  )
}
