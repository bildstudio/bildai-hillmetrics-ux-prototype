"use client"

import { useEffect, useState, useCallback } from "react"
import {
  X,
  Loader2,
  MoreVertical,
  Eye,
  Copy,
  Download,
  Zap,
  History,
  Clock,
  Bug,
  DollarSign,
  Minus,
} from "lucide-react"
import { FileTextIcon } from "@radix-ui/react-icons"
import { BaseBlade } from "@/components/blade/base-blade"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateReportById } from "@/app/actions/reports"
import type { FluxData } from "@/lib/data-store"
import { BasicInformationForm, type BasicInformationData } from "@/components/forms/basic-information-form"
import { FluxConfigurationForm, type FluxConfigurationData } from "@/components/forms/flux-configuration-form"
import { TypeConfigurationForm, type TypeConfigurationData } from "@/components/forms/type-configuration-form"
import { UnsavedChangesDialog } from "@/components/blade/unsaved-changes-dialog"
import { useToast } from "@/hooks/use-toast"
import { isEqual } from "lodash"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { mapToScheduleData, mapToTypeConfigData } from "@/lib/mappers"
import { mapToDbScheduleConfig, mapToDbTypeConfig } from "@/lib/reverse-mappers"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useEditBlade } from "@/lib/edit-blade-context"
import { useBladeStack } from "@/lib/blade-stack-context"

interface AllFormData {
  basicInfo: BasicInformationData
  fluxConfig: FluxConfigurationData
  typeConfig: TypeConfigurationData
}

const safeJsonParse = (json: string | object | null | undefined): object => {
  if (!json) return {}
  if (typeof json === "object") return json
  try {
    return JSON.parse(json)
  } catch (e) {
    console.error("Failed to parse JSON string:", json, e)
    return {}
  }
}

const mapDbSourceToForm = (dbSource: string): string => {
  switch (dbSource) {
    case "Option 1":
      return "option1"
    case "Option 2":
      return "option2"
    default:
      return dbSource
  }
}

const mapSourceToDb = (formSource: string): string => {
  switch (formSource) {
    case "option1":
      return "Option 1"
    case "option2":
      return "Option 2"
    default:
      return formSource
  }
}

const mapDbFluxStateToForm = (dbFluxState: string): string => {
  switch (dbFluxState) {
    case "Disabled":
      return "Inactive"
    case "Back office only":
      return "Archived"
    default:
      return dbFluxState
  }
}

const mapFluxStateToDb = (formFluxState: string): string => {
  switch (formFluxState) {
    case "Inactive":
      return "Disabled"
    case "Archived":
      return "Back office only"
    default:
      return formFluxState
  }
}

export default function EditFluxBlade({ reportId, onReady }: { reportId: string; onReady?: () => void }) {
  const { getBlade, closeBlade, minimizeBlade, updateBladeState } = useEditBlade()
  const bladeState = getBlade(reportId)
  const { toast } = useToast()
  const { closeTopBlade, minimizeStack, stackCount } = useBladeStack()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showProgress, setShowProgress] = useState(false)

  const [formData, setFormData] = useState<AllFormData | null>(null)
  const [initialData, setInitialData] = useState<AllFormData | null>(null)
  const [isUnsavedDialogOpen, setIsUnsavedDialogOpen] = useState(false)

  const headerHeight = "h-16"

  useEffect(() => {
    onReady?.()
    // run once on mount
  }, [])

  useEffect(() => {
    if (!formData || !initialData) {
      updateBladeState(reportId, { isDirty: false })
      return
    }
    const hasChanged = !isEqual(formData, initialData)
    updateBladeState(reportId, { isDirty: hasChanged })
  }, [formData, initialData, reportId, updateBladeState])

  useEffect(() => {
    if (formData?.basicInfo.fluxName) {
      updateBladeState(reportId, { name: formData.basicInfo.fluxName })
    }
  }, [formData?.basicInfo.fluxName, reportId, updateBladeState])

  const forceClose = useCallback(() => {
    closeBlade(reportId)
    closeTopBlade()
    setIsUnsavedDialogOpen(false)
  }, [reportId, closeBlade, closeTopBlade])

  const attemptClose = useCallback(() => {
    if (bladeState?.isDirty) {
      setIsUnsavedDialogOpen(true)
    } else {
      forceClose()
    }
  }, [bladeState?.isDirty, forceClose])

  const handleMinimize = useCallback(() => {
    if (bladeState?.stackControlled) {
      minimizeStack()
    } else {
      minimizeBlade(reportId)
    }
  }, [bladeState?.stackControlled, minimizeStack, minimizeBlade, reportId])

  useEffect(() => {
    const fetchAndSetData = async () => {
      if (reportId) {
        setIsLoading(true)
        setError(null)
        try {
          const idNum = Number.parseInt(reportId, 10)
          if (isNaN(idNum)) throw new Error("Invalid report ID.")

          const res = await fetch(`/api/reports/${idNum}`)
          const json = await res.json()
          if (json.error || !json.data) throw new Error(json.error || "Report not found.")

          const report = json.data

          const fetchConfig = safeJsonParse(report.fetchScheduleConfiguration)
          const processConfig = safeJsonParse(report.processingScheduleConfiguration)
          const typeConfigFromDb = safeJsonParse(report.fluxTypeConfiguration)

          const transformedData: AllFormData = {
            basicInfo: {
              fluxName: report.name || "",
              source: mapDbSourceToForm(report.source || ""),
              comment: report.comment || "",
              description: report.description || "",
              fetchSchedule: mapToScheduleData(fetchConfig, "fetch"),
              processSchedule: mapToScheduleData(processConfig, "process"),
            },
            fluxConfig: {
              fluxType: report.fluxType || "",
              financialType: report.financialType || "",
              fluxState: mapDbFluxStateToForm(report.fluxState || ""),
              allowConcurrentMultiFetching: report.allowConcurrentMultiFetching || false,
            },
            typeConfig: mapToTypeConfigData(report.fluxType || "", typeConfigFromDb),
          }

          setFormData(transformedData)
          setInitialData(JSON.parse(JSON.stringify(transformedData)))
          updateBladeState(reportId, { name: transformedData.basicInfo.fluxName || "Edit Report" })
        } catch (e: any) {
          console.error("Error fetching or mapping report data:", e)
          setError("Failed to load or process report data. Please check the console for details.")
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchAndSetData()
  }, [reportId, updateBladeState])


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        attemptClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [attemptClose])

  const handleFormChange = <T extends keyof AllFormData>(form: T, data: AllFormData[T]) => {
    setFormData((prev) => (prev ? { ...prev, [form]: data } : null))
  }

  const handleSave = async () => {
    if (!formData || !reportId) return
    setIsSaving(true)

    const { basicInfo, fluxConfig, typeConfig } = formData

    const fetchScheduleConfig = mapToDbScheduleConfig(basicInfo.fetchSchedule)
    const processingScheduleConfig = mapToDbScheduleConfig(basicInfo.processSchedule)
    const fluxTypeDbConfig = mapToDbTypeConfig(fluxConfig.fluxType, typeConfig)

    const payload: Partial<FluxData> = {
      name: basicInfo.fluxName,
      source: mapSourceToDb(basicInfo.source),
      comment: basicInfo.comment,
      description: basicInfo.description,
      fetchScheduleType: basicInfo.fetchSchedule.frequencyType,
      fetchScheduleConfiguration: fetchScheduleConfig,
      processingScheduleType: basicInfo.processSchedule.frequencyType,
      processingScheduleConfiguration: processingScheduleConfig,
      fluxType: fluxConfig.fluxType,
      financialType: fluxConfig.financialType,
      fluxState: mapFluxStateToDb(fluxConfig.fluxState),
      allowConcurrentMultiFetching: fluxConfig.allowConcurrentMultiFetching,
      fluxTypeConfiguration: fluxTypeDbConfig,
    }

    const result = await updateReportById(Number.parseInt(reportId, 10), payload)
    setIsSaving(false)

    if (result.success) {
      toast({
        title: "Success",
        description: "Report updated successfully.",
      })
      updateBladeState(reportId, { isDirty: false })
      forceClose()
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update report.",
        variant: "destructive",
      })
    }
  }

  const fluxName = bladeState?.name || "Edit Report"
  const zIndex = bladeState?.zIndex || 101
  const disableMinimize = bladeState?.disableMinimize

  if (!bladeState) return null

  return (
    <>
      <UnsavedChangesDialog
        isOpen={isUnsavedDialogOpen}
        onClose={() => setIsUnsavedDialogOpen(false)}
        onConfirm={forceClose}
      />
      {/* Overlay handled by BladeStackProvider */}
        <BaseBlade onClose={forceClose} bladeType="edit" zIndex={zIndex}>
          <div aria-labelledby="blade-title" className="flex flex-col h-full">
        <div
          className={cn(
            "flex items-center justify-between pl-[25px] md:pl-[25px] md:pr-3 border-b shrink-0",
            headerHeight,
          )}
        >
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium text-gray-800">
              {isLoading ? <Skeleton className="h-6 w-40" /> : error ? "Error" : fluxName}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!disableMinimize && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMinimize}
                className="h-8 w-8 text-gray-500 hover:bg-gray-100"
                aria-label="Minimize"
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:bg-gray-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuItem onClick={() => console.log("View action")}>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>View</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Make a copy action")}>
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Make a copy</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("Fetch action")}>
                  <Download className="mr-2 h-4 w-4" />
                  <span>Fetch</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("Force Process all fetching action")}>
                  <Zap className="mr-2 h-4 w-4" />
                  <span>Force Process all fetching</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("View fetching history action")}>
                  <History className="mr-2 h-4 w-4" />
                  <span>View fetching history</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("View processing history action")}>
                  <Clock className="mr-2 h-4 w-4" />
                  <span>View processing history</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("View error logs action")}>
                  <Bug className="mr-2 h-4 w-4" />
                  <span>View error logs</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => console.log("View financial data points action")}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>View financial data points</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => console.log("View workflow details action")}>
                  <FileTextIcon className="mr-2 h-4 w-4" />
                  <span>View workflow details</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              onClick={attemptClose}
              className="hover:bg-gray-100 rounded-full"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto bg-[#F1F3F4]">
          <div className="w-full md:w-4/5 xl:w-3/5 mx-auto">
            <div className="mt-2.5 px-4 md:px-6 py-0 bg-[#F1F3F4] border-b border-[#e5e7eb] sticky top-0 z-10">
              <Tabs defaultValue="basic-info" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
                  <TabsTrigger
                    value="basic-info"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400"
                  >
                    Basic information
                  </TabsTrigger>
                  <TabsTrigger
                    value="flux-config"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400"
                  >
                    Flux configuration
                  </TabsTrigger>
                  <TabsTrigger
                    value="type-config"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400"
                  >
                    Type configuration
                  </TabsTrigger>
                </TabsList>

                <div className="pt-0 px-4 pb-4 md:pt-0 md:px-6 md:pb-6">
                  {isLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : error ? (
                    <div className="text-red-500 text-center h-64 flex items-center justify-center">
                      <p>{error}</p>
                    </div>
                  ) : formData ? (
                    <>
                      <TabsContent value="basic-info" className="mt-0">
                        <BasicInformationForm
                          data={formData.basicInfo}
                          onChange={(data) => handleFormChange("basicInfo", data)}
                        />
                      </TabsContent>
                      <TabsContent value="flux-config" className="mt-0">
                        <FluxConfigurationForm
                          data={formData.fluxConfig}
                          onChange={(data) => handleFormChange("fluxConfig", data)}
                        />
                      </TabsContent>
                      <TabsContent value="type-config" className="mt-0">
                        <TypeConfigurationForm
                          fluxType={formData.fluxConfig.fluxType}
                          data={formData.typeConfig}
                          onChange={(data) => handleFormChange("typeConfig", data)}
                        />
                      </TabsContent>
                    </>
                  ) : null}
                </div>
              </Tabs>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t bg-white shrink-0">
          <Button
            variant="outline"
            onClick={attemptClose}
            disabled={isSaving}
            className="px-6 w-28 border-[#DEDEDE] text-[#717171] hover:bg-gray-100 bg-transparent"
          >
            Cancel
          </Button>

          <div className="flex-grow" />

          <Button
            onClick={handleSave}
            disabled={!bladeState?.isDirty || isSaving}
            className={cn(
              "px-6 w-28",
              bladeState?.isDirty && !isSaving
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "border border-input bg-background text-gray-400 cursor-not-allowed",
            )}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </BaseBlade>
    </>
  )
}
