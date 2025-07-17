"use client"

import { useEffect, useState } from "react"
import { BaseBlade } from "@/components/blade/base-blade"
import { X, MoreVertical, Info, Globe, Eye, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useBladeStack } from "@/lib/blade-stack-context"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import NormalizationRunDetails from "./NormalizationRunDetails"
import FluxDetailsInfoPanel from "../processing-history/FluxDetailsInfoPanel"

interface NormalizationDetailsBladeProps {
  normalizationId: number
  fluxName: string
  fluxId: string
  onClose: () => void
  onFluxDetails?: () => void
  onReady?: () => void
}

export default function NormalizationDetailsBlade({
  normalizationId,
  fluxName,
  fluxId,
  onClose,
  onFluxDetails,
  onReady,
}: NormalizationDetailsBladeProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [infoOpen, setInfoOpen] = useState(false)
  const fullTitle = `ID: ${normalizationId} - Normalization details - ${fluxName}`
  const { minimizeStack } = useBladeStack()
  const handleMinimize = () => {
    minimizeStack()
  }

  const truncateTitle = (title: string, maxLength = 30) => (title.length <= maxLength ? title : `${title.substring(0, maxLength - 3)}...`)

  useEffect(() => {
    onReady?.()
    // run once on mount
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key.toLowerCase() === "i") setInfoOpen(true)
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <BaseBlade onClose={onClose} bladeType="view" className="z-[10000]">
      <div aria-labelledby="blade-title" className="flex flex-col h-full">
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 z-[10001]" align="end">
                <div className="block md:hidden">
                  <DropdownMenuItem
                    onClick={() =>
                      setInfoOpen((prev) => {
                        const next = !prev
                        if (next) onFluxDetails?.()
                        return next
                      })
                    }
                  >
                    <Info className="mr-2 h-4 w-4" />
                    <span>Flux details</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </div>
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
            <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-gray-100 rounded-full" aria-label="Close">
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
                    <TabsTrigger value="summary" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0">
                      <Globe className="h-4 w-4" />
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="details" className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0">
                      <Eye className="h-4 w-4" />
                      Details
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              <TabsContent value="summary" className="flex-grow overflow-auto">
                <div className="p-4 md:p-6">{/* Summary content placeholder */}</div>
              </TabsContent>
              <TabsContent value="details" className="flex-grow overflow-auto">
                <div className="p-4 md:p-6">
                  <NormalizationRunDetails normalizationId={normalizationId} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        <FluxDetailsInfoPanel
          reportId={fluxId}
          open={infoOpen}
          onClose={() => setInfoOpen(false)}
          drawer
        />
      </div>
    </BaseBlade>
  )
}
