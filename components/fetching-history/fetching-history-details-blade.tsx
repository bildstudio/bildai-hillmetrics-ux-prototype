"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BaseBlade } from "@/components/blade/base-blade"
import { X, MoreVertical, Info, Globe, Eye, FileText, Minus, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FetchingHistoryMenuItems, type FetchingHistoryMenuAction } from "./menu-items"
import type { FetchingHistoryData } from "@/app/actions/fetching-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import FluxDetailsInfoPanel from "../processing-history/FluxDetailsInfoPanel"
import { FetchedContentsGrid } from "@/components/fetched-contents/fetched-contents-grid"
import { useViewBlade } from "@/lib/view-blade-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { useToast } from "@/hooks/use-toast"
import FetchingDetails from "./FetchingDetails"
import FetchedContentInformation from "./FetchedContentInformation"
import ProcessingStatusInformation from "./ProcessingStatusInformation"
import FetchingRunDetails from "./FetchingRunDetails"
import FetchingDiagram from "./FetchingDiagram"
import type { ContentStatusCount } from "@/app/actions/fetching-content-history"

interface FetchingHistoryDetailsBladeProps {
  fetchingId: number
  fluxName: string
  fluxId: string
  onClose: () => void
  onFluxDetails?: () => void
  onReady?: () => void
}

export default function FetchingHistoryDetailsBlade({
  fetchingId,
  fluxName,
  fluxId,
  onClose,
  onFluxDetails,
  onReady,
}: FetchingHistoryDetailsBladeProps) {
  const fullTitle = `ID: ${fetchingId} - Fetching history details - ${fluxName}`

  const truncateTitle = (title: string, maxLength = 30) => {
    return title.length <= maxLength ? title : `${title.substring(0, maxLength - 3)}...`
  }

  const [infoOpen, setInfoOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")
  const [contentStatusFilter, setContentStatusFilter] = useState<string | null>(null)
  const { openBlade: openStackBlade, closeTopBlade, minimizeStack } = useBladeStack()
  const [overrideChart, setOverrideChart] = useState<ContentStatusCount[] | null>(null)

  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openEditBladeCtx } = useEditBlade()
  const { toast } = useToast()

  const openViewBlade = useCallback(
    (id: string, name?: string) => {
      openViewBladeCtx(id, name, { stackControlled: true })
      openStackBlade(
        () => import("@/components/view-flux-blade/ViewFluxBlade"),
        {
          reportId: id,
        },
        name,
      )
    },
    [openViewBladeCtx, openStackBlade],
  )

  const openEditBlade = useCallback(
    (id: string, name?: string) => {
      openEditBladeCtx(id, name, { stackControlled: true })
      openStackBlade(
        () => import("@/components/edit-flux-blade/EditFluxBlade"),
        {
          reportId: id,
        },
        name,
      )
    },
    [openEditBladeCtx, openStackBlade],
  )

  useEffect(() => {
    onReady?.()
    
    // Global handler for unhandled promise rejections related to 'enabled' property
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.toString().includes('enabled') && event.reason?.toString().includes('getter')) {
        event.preventDefault() // Prevent the error from showing in console
      }
    }
    
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', handleUnhandledRejection)
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      }
    }
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

  const handleMinimize = () => {
    minimizeStack()
  }

  const handleNavigateToContent = useCallback((status: string | null) => {
    setContentStatusFilter(status)
    setActiveTab("content")
  }, [])

  const handleMenuAction = (action: FetchingHistoryMenuAction) => {
    switch (action) {
      case "viewDetails":
        console.log("View details clicked for", fetchingId)
        break
      case "quickFlux":
        console.log("Quick flux clicked for", fetchingId)
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
        console.log("Rename flux clicked for", fetchingId)
        break
      case "viewContent":
        console.log("View content clicked for", fetchingId)
        break
      case "viewProcessings":
        console.log("View processings clicked for", fetchingId)
        break
      default:
        break
    }
  }

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
                infoOpen && "bg-[#5f6b7b]/20",
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 z-[10001]" align="end">
                <FetchingHistoryMenuItems
                  item={{ fetchingID: fetchingId, fluxID: Number(fluxId) } as FetchingHistoryData}
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
                <TabsList className="relative flex items-center justify-start bg-transparent p-0 h-auto w-full overflow-hidden">
                  <TabsTrigger
                    value="summary"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                  >
                    <Globe className="h-4 w-4" />
                    Summary
                  </TabsTrigger>
                  <TabsTrigger
                    value="details"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                  >
                    <Eye className="h-4 w-4" />
                    Details
                  </TabsTrigger>
                  <TabsTrigger
                    value="diagram"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                  >
                    <Workflow className="h-4 w-4" />
                    View as diagram
                  </TabsTrigger>
                  <TabsTrigger
                    value="content"
                    className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                  >
                    <FileText className="h-4 w-4" />
                    Content
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
            <TabsContent value="summary" className="flex-grow overflow-auto">
              <div className="p-4 md:p-6 space-y-6">
                <FetchingDetails fetchingId={fetchingId} />
                <div className="flex flex-col lg:flex-row gap-6">
                  <FetchedContentInformation
                    fetchingId={fetchingId}
                    onNavigate={handleNavigateToContent}
                    overrideData={overrideChart}
                  />
                  <ProcessingStatusInformation fetchingId={fetchingId} onNavigate={handleNavigateToContent} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="details" className="flex-grow overflow-auto">
              <div className="p-4 md:p-6">
                <FetchingRunDetails fetchingId={fetchingId} />
              </div>
            </TabsContent>
            <TabsContent value="diagram" className="flex-grow overflow-hidden">
              <div className="p-0 md:p-0 h-full">
                <FetchingDiagram fetchingId={fetchingId} />
              </div>
            </TabsContent>
            <TabsContent value="content" className="flex-grow overflow-auto">
              <div className="p-4 md:p-6">
                <FetchedContentsGrid
                  fluxId="all"
                  fetchingIdFilter={fetchingId}
                  onPreviewClick={handlePreviewFile}
                  hideFetchingIdBadge
                  hideFluxIdColumn
                  statusFilter={contentStatusFilter}
                  onClearStatusFilter={() => setContentStatusFilter(null)}
                />
              </div>
            </TabsContent>
          </Tabs>
          </div>
          <FluxDetailsInfoPanel
            reportId={fluxId}
            open={infoOpen}
            onClose={() => setInfoOpen(false)}
            drawer
          />
        </div>
      </motion.div>
    </BaseBlade>
  )
}
