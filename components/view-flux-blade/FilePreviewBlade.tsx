"use client"

import { useEffect, useCallback, useState } from "react"
import { BaseBlade } from "@/components/blade/base-blade"
import { X, Download, MoreVertical, Zap, FileText, Trash2, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FetchedContentMenuItems, type FetchedContentMenuAction } from "@/components/fetched-contents/menu-items"
import type { FetchedContentData } from "@/app/actions/fetched-contents"
import { XlsxPreview } from "@/components/previews/xlsx-preview"
import { useViewBlade } from "@/lib/view-blade-context"
import { useEditBlade } from "@/lib/edit-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"

interface FilePreviewBladeProps {
  file: { id: string; name: string; fluxId: string; fluxName?: string }
  onClose: () => void
  onReady?: () => void
}

export default function FilePreviewBlade({ file, onClose, onReady }: FilePreviewBladeProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { openBlade: openViewBladeCtx } = useViewBlade()
  const { openBlade: openEditBladeCtx } = useEditBlade()
  const { openBlade: openStackBlade, minimizeStack } = useBladeStack()
  
  const handleClose = useCallback(() => {
    if (isDropdownOpen) {
      return
    }
    onClose()
  }, [isDropdownOpen, onClose])
  
  const handleMinimize = () => {
    minimizeStack()
  }

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

  const truncateFileName = (name: string, maxLength = 30) => {
    if (name.length <= maxLength) return name
    return `${name.substring(0, maxLength - 3)}...`
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [handleClose])

  useEffect(() => {
    onReady?.()
    // run once on mount
  }, [])

  const handleMenuAction = (action: FetchedContentMenuAction) => {
    switch (action) {
      case "preview":
        console.log("Preview clicked for", file.id)
        break
      case "quickFlux":
        console.log("Quick flux clicked for", file.id)
        break
      case "viewFlux":
        openViewBlade(file.fluxId, file.fluxName)
        break
      case "showMeta":
        console.log("Show meta clicked for", file.id)
        break
      case "viewWorkflow":
        console.log("View workflow clicked for", file.id)
        break
      case "downloadRaw":
        console.log("Download raw clicked for", file.id)
        break
      case "process":
        console.log("Process clicked for", file.id)
        break
      case "simulateProcess":
        console.log("Simulate process clicked for", file.id)
        break
      case "createMapping":
        console.log("Create mapping clicked for", file.id)
        break
      case "viewProcessing":
        console.log("View processing clicked for", file.id)
        break
      case "editFlux":
        openEditBlade(file.fluxId, file.fluxName)
        break
      default:
        break
    }
  }

  return (
    <BaseBlade onClose={handleClose} bladeType="view" className="z-[10003]">
        {/* Header */}
        <div className="flex items-center justify-between pl-[25px] md:pl-[25px] md:pr-3 border-b h-16 shrink-0">
          <h1 className="text-xl font-medium text-gray-800">
            <span className="hidden md:inline">{file.name}</span>
            <span className="md:hidden">{truncateFileName(file.name, 20)}</span>
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="hidden md:flex items-center gap-2 text-[#5f6b7b] hover:bg-[#5f6b7b]/10">
              <Download className="h-4 w-4" />
              Download
            </Button>
            <DropdownMenu 
              modal={false}
              onOpenChange={(open) => {
                setIsDropdownOpen(open)
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
                <FetchedContentMenuItems
                  item={{
                    contentID: Number(file.id),
                    fluxID: Number(file.fluxId),
                    fetchingID: 0,
                    status: "",
                    contentName: file.name,
                    contentShortName: file.name,
                    fileType: "",
                    fileSize: 0,
                    numberOfProcessing: 0,
                    createdAt: "",
                    sourceUrl: "",
                    processingID: null,
                  } as FetchedContentData}
                  onAction={handleMenuAction}
                  components={{ Item: DropdownMenuItem, Separator: DropdownMenuSeparator }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
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
              onClick={handleClose}
              className="hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-hidden bg-[#F1F3F4]">
          <div className="h-full p-4 md:p-6">
            <XlsxPreview fileName={file.name} />
          </div>
        </div>
      </BaseBlade>
  )
}
