"use client"

import { useEffect, useState, useCallback } from "react"
import { BaseBlade } from "@/components/blade/base-blade"
import { X, MoreVertical, Info, Globe, Eye, Workflow, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WorkflowMenuItems, type WorkflowMenuAction } from "./menu-items"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import FluxDetailsInfoPanel from "../processing-history/FluxDetailsInfoPanel"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useBladeStack } from "@/lib/blade-stack-context"
import WorkflowStagesOverview from "./WorkflowStagesOverview"
import WorkflowDiagram from "./WorkflowDiagram"
import dynamic from "next/dynamic"
import type { WorkflowStagesGrid as WorkflowStagesGridType } from "./workflow-stages-grid"
import { Loader2 } from "lucide-react"

const WorkflowStagesGrid = dynamic(() => import("./workflow-stages-grid").then((mod) => mod.WorkflowStagesGrid), {
  loading: () => (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#5499a2]" />
    </div>
  ),
  ssr: false,
}) as typeof WorkflowStagesGridType
import { useViewBlade } from "@/lib/view-blade-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import { useTestNotification, type NotificationAction } from "@/lib/test-notification-context"
import { updateReportById } from "@/app/actions/reports"
import type { WorkflowExecutionLogData } from "@/app/actions/workflow-execution-log"

interface WorkflowExecutionItemDetailsBladeProps {
  item: WorkflowExecutionLogData
  onClose: () => void
  onViewFetching?: (id: number, fluxId?: number, fluxName?: string) => void
  onViewProcessing?: (id: number, fluxId?: number, fluxName?: string) => void
  onViewNormalization?: (id: number, fluxId?: number, fluxName?: string) => void
  onViewRefinement?: (id: number, fluxId?: number, fluxName?: string) => void
  onViewCalculation?: (id: number, fluxId?: number, fluxName?: string) => void
  onContentClick?: (fetchingId: number) => void
  onReady?: () => void
}

export default function WorkflowExecutionItemDetailsBlade({
  item,
  onClose,
  onViewFetching,
  onViewProcessing,
  onViewNormalization,
  onViewRefinement,
  onViewCalculation,
  onContentClick,
  onReady,
}: WorkflowExecutionItemDetailsBladeProps) {
  const { openBlade, closeTopBlade, minimizeStack } = useBladeStack()
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openEditBladeCtx } = useEditBlade()

  const openViewBlade = useCallback(
    (reportId: string, name?: string) => {
      openViewBladeCtx(reportId, name, { stackControlled: true })
      openBlade(() => import("@/components/view-flux-blade/ViewFluxBlade"), { reportId }, name)
    },
    [openBlade, openViewBladeCtx],
  )

  const openEditBlade = useCallback(
    (reportId: string, name?: string) => {
      openEditBladeCtx(reportId, name, { stackControlled: true })
      openBlade(() => import("@/components/edit-flux-blade/EditFluxBlade"), { reportId }, name)
    },
    [openBlade, openEditBladeCtx],
  )
  const { showCustomNotification, hideCustomNotification } = useTestNotification()

  const [infoOpen, setInfoOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [renameValue, setRenameValue] = useState(item.flux_name || `Flux ${item.flux_id}`)

  const fullTitle = `ID: ${item.id} - Workflow Execution Item Details - ${item.flux_name || `Flux ${item.flux_id}`}`

  const truncateTitle = (title: string, maxLength = 30) =>
    title.length <= maxLength ? title : `${title.substring(0, maxLength - 3)}...`

  const handleMinimize = () => {
    minimizeStack()
  }

  const handlePreviewFile = useCallback(
    (file: { id: string; name: string }) => {
      openBlade(
        () => import("@/components/view-flux-blade/FilePreviewBlade"),
        {
          file: {
            ...file,
            fluxId: String(item.flux_id),
            fluxName: item.flux_name || `Flux ${item.flux_id}`,
          },
          onClose: closeTopBlade,
        },
        file.name,
      )
    },
    [openBlade, closeTopBlade, item.flux_id, item.flux_name],
  )

  const handleRenameConfirm = async () => {
    const newName = renameValue.trim()
    const oldName = item.flux_name || `Flux ${item.flux_id}`
    if (!newName || newName === oldName) {
      setIsRenameDialogOpen(false)
      return
    }
    await updateReportById(item.flux_id, { name: newName })
    const undoAction: NotificationAction = {
      label: "Undo",
      variant: "destructive",
      onClick: async () => {
        await updateReportById(item.flux_id, { name: oldName })
        hideCustomNotification()
      },
    }
    const closeAction: NotificationAction = {
      label: "Close",
      variant: "ghost",
      onClick: () => hideCustomNotification(),
    }
    showCustomNotification(`"${oldName}" renamed to "${newName}"`, [undoAction, closeAction])
    setIsRenameDialogOpen(false)
  }

  const handleMenuAction = (action: WorkflowMenuAction) => {
    switch (action) {
      case "quickFlux":
        setInfoOpen(true)
        break
      case "viewFlux":
        openViewBlade(String(item.flux_id), item.flux_name || `Flux ${item.flux_id}`)
        break
      case "editFlux":
        openEditBlade(String(item.flux_id), item.flux_name || `Flux ${item.flux_id}`)
        break
      case "renameFlux":
        setIsRenameDialogOpen(true)
        break
      case "viewFetching":
        item.fetching_id && onViewFetching?.(item.fetching_id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
        break
      case "viewProcessing":
        item.processing_id &&
          onViewProcessing?.(item.processing_id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
        break
      case "viewNormalization":
        item.normalization_id &&
          onViewNormalization?.(item.normalization_id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
        break
      case "viewRefinement":
        item.refinement_id &&
          onViewRefinement?.(item.refinement_id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
        break
      case "viewCalculation":
        item.calculation_id &&
          onViewCalculation?.(item.calculation_id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
        break
      case "viewContent":
        item.fetching_id && onContentClick?.(item.fetching_id)
        break
      default:
        break
    }
  }

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key.toLowerCase() === "i") setInfoOpen(true)
    },
    [onClose],
  )

  useEffect(() => {
    onReady?.()
    // run once on mount
  }, [])

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 z-[10001]" align="end">
                <WorkflowMenuItems
                  item={item}
                  onAction={(action) => handleMenuAction(action)}
                  includeView={false}
                  components={{
                    Item: DropdownMenuItem,
                    Label: DropdownMenuLabel,
                    Separator: DropdownMenuSeparator,
                  }}
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
                      value="stages"
                      className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                      Workflow stages
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
                  <WorkflowStagesOverview
                    item={item}
                    onViewFetching={onViewFetching}
                    onViewProcessing={onViewProcessing}
                    onViewNormalization={onViewNormalization}
                    onViewRefinement={onViewRefinement}
                    onViewCalculation={onViewCalculation}
                    onPreviewFile={handlePreviewFile}
                  />
                </div>
              </TabsContent>
              <TabsContent value="stages" className="flex-grow overflow-auto">
                <div className="p-4 md:p-6">
                  <WorkflowStagesGrid
                    runId={item.id}
                    onViewFetching={(id) =>
                      onViewFetching?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewProcessing={(id) =>
                      onViewProcessing?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewNormalization={(id) =>
                      onViewNormalization?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewRefinement={(id) =>
                      onViewRefinement?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewCalculation={(id) =>
                      onViewCalculation?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                  />
                </div>
              </TabsContent>
              <TabsContent value="diagram" className="flex-grow overflow-hidden">
                <div className="p-0 md:p-0 h-full">
                  <WorkflowDiagram
                    item={item}
                    onViewFetching={(id) =>
                      onViewFetching?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewProcessing={(id) =>
                      onViewProcessing?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewNormalization={(id) =>
                      onViewNormalization?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewRefinement={(id) =>
                      onViewRefinement?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onViewCalculation={(id) =>
                      onViewCalculation?.(id, item.flux_id, item.flux_name || `Flux ${item.flux_id}`)
                    }
                    onContentClick={onContentClick}
                    onPreviewFile={(contentId, contentName) => 
                      handlePreviewFile({ id: String(contentId), name: contentName })
                    }
                    isOnWorkflowBlade={true}
                  />
                </div>
              </TabsContent>
              <TabsContent value="details" className="flex-grow overflow-auto">
                <div className="p-4 md:p-6 space-y-2 text-sm">
                  <div>ID: {item.id}</div>
                  <div>Status: {item.status}</div>
                  <div>Started at: {item.started_at}</div>
                  <div>Completed at: {item.completed_at || "N/A"}</div>
                  <div>Progress: {item.progress ?? "N/A"}%</div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <FluxDetailsInfoPanel
            reportId={String(item.flux_id)}
            open={infoOpen}
            onClose={() => setInfoOpen(false)}
            drawer
          />
        </div>
      </div>
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="sm:max-w-md z-[10050]" style={{ zIndex: 10050 }}>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRenameConfirm}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </BaseBlade>
  )
}
