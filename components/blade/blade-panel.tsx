"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UnsavedChangesDialog } from "./unsaved-changes-dialog"
import { CustomCloseIcon } from "@/components/icons/custom-close-icon"
import { Stepper, type StepData } from "@/components/stepper/stepper"
import { BasicInformationForm, type BasicInformationData } from "@/components/forms/basic-information-form"
import { FluxConfigurationForm, type FluxConfigurationData } from "@/components/forms/flux-configuration-form"
import { TypeConfigurationForm, type TypeConfigurationData } from "@/components/forms/type-configuration-form"
import { Progress } from "@/components/ui/progress"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Info } from "lucide-react"
// Removed useIsMobile import as it's not directly used for width calculation anymore,
// width is handled by inline style and calculatedWidthPercentage state.

export interface BladePanelData {
  basic: BasicInformationData
  fluxConfig: FluxConfigurationData
  typeConfig: TypeConfigurationData
}
interface BladePanelProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: BladePanelData) => void
  initialData?: BladePanelData | null
  widthPercentage?: number
}

const initialBasicInformationData: BasicInformationData = {
  fluxName: "",
  source: "",
  comment: "",
  description: "",
  fetchSchedule: { active: false, frequencyType: "", intervalHours: 1 },
  processSchedule: { active: false, frequencyType: "", intervalDays: 1, startTime: "00:00" },
}

const initialFluxConfigurationData: FluxConfigurationData = {
  fluxType: "",
  financialType: "",
  fluxState: "",
  allowConcurrentMultiFetching: false, // New: Default false
}

const initialTypeConfigurationData: TypeConfigurationData = {
  contentLocation: "",
  emailRuleGroups: [],
  emailMetadata: [], // New: Default empty
  apiUrl: "",
  apiKey: "",
  apiMetadata: [],
  httpDownloadUrl: "",
  httpDownloadContentType: "",
  httpDownloadMetadata: [],
  sftpHost: "",
  sftpPort: 22, // Default SFTP port
  sftpUsername: "",
  sftpPassword: "",
  sftpProtocol: "SFTP", // Default SFTP protocol
  sftpFilePattern: "", // New: Default empty
  sftpDeleteAfterDownload: false, // New: Default false
  sftpUseSshKeyAuth: false, // New: Default false
  sftpFileRuleGroups: [], // New: Default empty
  sftpMetadata: [], // New: Default empty
  processAllAttachments: false, // New: Default false
  webhookUrl: "", // New: Default empty
  webhookApiKey: "", // New: Default empty
  webhookMetadata: [], // New: Default empty
  scrapingUrl: "", // New: Default empty
  scrapingContentType: "", // New: Default empty
  scrapingMetadata: [], // New: Default empty
  manualContentType: "", // New: Default empty
  manualMetadata: [], // New: Default empty
}

export function BladePanel({
  isOpen,
  onClose,
  onSave,
  initialData: initialDataProp,
  widthPercentage = 80, // Default to 80% for desktop
}: BladePanelProps) {
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [basicInformationData, setBasicInformationData] = useState<BasicInformationData>(initialBasicInformationData)
  const [fluxConfigurationData, setFluxConfigurationData] =
    useState<FluxConfigurationData>(initialFluxConfigurationData)
  const [typeConfigurationData, setTypeConfigurationData] =
    useState<TypeConfigurationData>(initialTypeConfigurationData)

  const [progress, setProgress] = useState(0)
  const [missingFields, setMissingFields] = useState<{ id: string; label: string }[]>([])

  const bladeRef = useRef<HTMLDivElement>(null)
  const [calculatedWidthPercentage, setCalculatedWidthPercentage] = useState(widthPercentage)

  // Helper validation functions - moved to the top
  const isValidEmail = (email: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch (e) {
      return false
    }
  }
  const isValidSftpHost = (host: string) => {
    return host.trim() !== "" && (host.includes(".") || /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host))
  }
  const isValidFilePattern = (pattern: string) => {
    return pattern.trim() !== ""
  }

  // Determine if the save button is enabled (all steps valid and progress 100%)
  // This must be defined before stepperSteps if stepperSteps depends on it
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return basicInformationData.fluxName.trim() !== ""
      case 2:
        return (
          fluxConfigurationData.fluxType.trim() !== "" &&
          fluxConfigurationData.financialType.trim() !== "" &&
          fluxConfigurationData.fluxState.trim() !== ""
          // allowConcurrentMultiFetching is optional, no validation needed
        )
      case 3:
        if (fluxConfigurationData.fluxType === "Email") {
          const emailRuleGroups = typeConfigurationData.emailRuleGroups || []
          const emailMetadata = typeConfigurationData.emailMetadata || []
          const areMetadataValid = emailMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          if (!typeConfigurationData.contentLocation) return false
          // Email rule groups are required for Email type
          if (emailRuleGroups.length === 0) return false
          for (const ruleGroup of emailRuleGroups) {
            const criteria = ruleGroup.criteria || []
            if (criteria.length > 0 && !ruleGroup.logicalOperator) return false
            if (criteria.length === 0) return false
            for (const criterion of criteria) {
              if (!criterion.key || !criterion.operator || !criterion.value.trim()) return false
              if (criterion.key === "Email Sender" && !isValidEmail(criterion.value)) return false
            }
          }
          // Email metadata is optional
          return emailMetadata.length === 0 || areMetadataValid
        } else if (fluxConfigurationData.fluxType === "API") {
          const apiMetadata = typeConfigurationData.apiMetadata || []
          const areMetadataValid = apiMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          return (
            !!typeConfigurationData.apiUrl &&
            isValidUrl(typeConfigurationData.apiUrl) &&
            (apiMetadata.length === 0 || areMetadataValid)
          )
        } else if (fluxConfigurationData.fluxType === "HTTP Download") {
          const httpDownloadMetadata = typeConfigurationData.httpDownloadMetadata || []
          const areMetadataValid = httpDownloadMetadata.every(
            (item) => item.key.trim() !== "" && item.value.trim() !== "",
          )

          return (
            !!typeConfigurationData.httpDownloadUrl &&
            isValidUrl(typeConfigurationData.httpDownloadUrl) &&
            !!typeConfigurationData.httpDownloadContentType &&
            (httpDownloadMetadata.length === 0 || areMetadataValid)
          )
        } else if (fluxConfigurationData.fluxType === "SFTP") {
          const sftpFileRuleGroups = typeConfigurationData.sftpFileRuleGroups || []
          const sftpMetadata = typeConfigurationData.sftpMetadata || []
          const areMetadataValid = sftpMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          return (
            !!typeConfigurationData.sftpHost &&
            isValidSftpHost(typeConfigurationData.sftpHost) &&
            !!typeConfigurationData.sftpPort &&
            typeConfigurationData.sftpPort > 0 &&
            typeConfigurationData.sftpPort <= 65535 &&
            !!typeConfigurationData.sftpUsername &&
            !!typeConfigurationData.sftpPassword &&
            !!typeConfigurationData.sftpProtocol &&
            !!typeConfigurationData.sftpFilePattern &&
            isValidFilePattern(typeConfigurationData.sftpFilePattern) &&
            // File rules and metadata are optional, so no validation here
            (sftpFileRuleGroups.length === 0 ||
              sftpFileRuleGroups.every(
                (group) =>
                  group.logicalOperator &&
                  group.criteria.length > 0 &&
                  group.criteria.every((c) => c.key && c.operator && c.value.trim()),
              )) &&
            (sftpMetadata.length === 0 || areMetadataValid)
          )
        } else if (fluxConfigurationData.fluxType === "Webhook") {
          const webhookMetadata = typeConfigurationData.webhookMetadata || []
          const areMetadataValid = webhookMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          return (
            !!typeConfigurationData.webhookUrl &&
            isValidUrl(typeConfigurationData.webhookUrl) &&
            !!typeConfigurationData.webhookApiKey &&
            (webhookMetadata.length === 0 || areMetadataValid)
          )
        } else if (fluxConfigurationData.fluxType === "Scraping") {
          const scrapingMetadata = typeConfigurationData.scrapingMetadata || []
          const areMetadataValid = scrapingMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          return (
            !!typeConfigurationData.scrapingUrl &&
            isValidUrl(typeConfigurationData.scrapingUrl) &&
            !!typeConfigurationData.scrapingContentType &&
            (scrapingMetadata.length === 0 || areMetadataValid)
          )
        } else if (fluxConfigurationData.fluxType === "Manual") {
          const manualMetadata = typeConfigurationData.manualMetadata || []
          const areMetadataValid = manualMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          return !!typeConfigurationData.manualContentType && (manualMetadata.length === 0 || areMetadataValid)
        }
        return true
      default:
        return false
    }
  }

  const isSaveEnabled = currentStep === 3 && isStepValid(3) && progress === 100

  const stepperSteps: StepData[] = [
    { id: 1, title: "Basic information", completed: currentStep > 1, active: currentStep === 1 },
    { id: 2, title: "Flux configuration", completed: currentStep > 2, active: currentStep === 2 },
    // Step 3 is completed if currentStep is greater than 3 OR if it's the current step (3) AND save is enabled
    {
      id: 3,
      title: "Type configuration",
      completed: currentStep > 3 || (currentStep === 3 && isSaveEnabled),
      active: currentStep === 3,
    },
  ]
  const totalSteps = stepperSteps.length

  useEffect(() => {
    if (isOpen) {
      if (initialDataProp) {
        setBasicInformationData(initialDataProp.basic)
        setFluxConfigurationData(initialDataProp.fluxConfig)
        setTypeConfigurationData(initialDataProp.typeConfig)
        setHasUnsavedChanges(false)
        setCurrentStep(1)
      } else {
        setBasicInformationData(initialBasicInformationData)
        setFluxConfigurationData(initialFluxConfigurationData)
        setTypeConfigurationData(initialTypeConfigurationData)
        setHasUnsavedChanges(false)
        setCurrentStep(1)
      }
    } else {
      // Reset when closed
      setBasicInformationData(initialBasicInformationData)
      setFluxConfigurationData(initialFluxConfigurationData)
      setTypeConfigurationData(initialTypeConfigurationData)
      setHasUnsavedChanges(false)
      setCurrentStep(1)
    }
  }, [isOpen, initialDataProp])

  const handleCloseAttempt = useCallback(
    () => (hasUnsavedChanges ? setShowUnsavedDialog(true) : onClose()),
    [hasUnsavedChanges, onClose],
  )

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleCloseAttempt()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleCloseAttempt])

  useEffect(() => {
    const calculateProgress = () => {
      let totalFields = 0
      let validFields = 0
      const newMissingFields: { id: string; label: string }[] = []

      if (currentStep === 1) {
        const step1Checks = [
          { id: "fluxName", label: "Flux name", isValid: !!basicInformationData.fluxName.trim() },
          { id: "source", label: "Source", isValid: !!basicInformationData.source },
          {
            id: "fetchScheduleFrequency",
            label: "Fetch schedule frequency",
            isValid: !!basicInformationData.fetchSchedule.frequencyType,
          },
          {
            id: "processScheduleFrequency",
            label: "Process schedule frequency",
            isValid: !!basicInformationData.processSchedule.frequencyType,
          },
        ]
        totalFields = step1Checks.length
        step1Checks.forEach((check) => {
          if (check.isValid) validFields++
          else newMissingFields.push({ id: check.id, label: check.label })
        })
      } else if (currentStep === 2) {
        const step2Checks = [
          { id: "fluxType", label: "Flux type", isValid: !!fluxConfigurationData.fluxType },
          { id: "financialType", label: "Financial type", isValid: !!fluxConfigurationData.financialType },
          { id: "fluxState", label: "Flux state", isValid: !!fluxConfigurationData.fluxState },
          // allowConcurrentMultiFetching is optional, not included in progress calculation
        ]
        totalFields = step2Checks.length
        step2Checks.forEach((check) => {
          if (check.isValid) validFields++
          else newMissingFields.push({ id: check.id, label: check.label })
        })
      } else if (currentStep === 3) {
        if (fluxConfigurationData.fluxType === "Email") {
          const isRuleGroupsValid = () => {
            const groups = typeConfigurationData.emailRuleGroups || []
            if (groups.length === 0) return false // Email rule groups are required for Email type
            return groups.every(
              (group) =>
                group.logicalOperator &&
                group.criteria.length > 0 &&
                group.criteria.every((c) => c.key && c.operator && c.value.trim()),
            )
          }
          const emailMetadata = typeConfigurationData.emailMetadata || []
          const areMetadataValid = emailMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          const step3Checks = [
            { id: "contentLocation", label: "Content location", isValid: !!typeConfigurationData.contentLocation },
            { id: "emailRuleGroupsContainer", label: "Email Rule Groups", isValid: isRuleGroupsValid() },
            {
              id: "emailMetadataContainer",
              label: "Additional Metadata",
              isValid: emailMetadata.length === 0 || areMetadataValid,
            },
          ]
          totalFields = step3Checks.length
          step3Checks.forEach((check) => {
            if (check.isValid) validFields++
            else newMissingFields.push({ id: check.id, label: check.label })
          })
        } else if (fluxConfigurationData.fluxType === "API") {
          const apiMetadata = typeConfigurationData.apiMetadata || []
          const areMetadataValid = apiMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          const step3Checks = [
            {
              id: "apiUrl",
              label: "API URL",
              isValid: !!typeConfigurationData.apiUrl && isValidUrl(typeConfigurationData.apiUrl),
            },
            { id: "apiKey", label: "API Key", isValid: typeConfigurationData.apiKey !== undefined },
            {
              id: "apiMetadataContainer",
              label: "Additional Metadata",
              isValid: apiMetadata.length === 0 || areMetadataValid,
            },
          ]
          totalFields = step3Checks.length
          step3Checks.forEach((check) => {
            if (check.isValid) validFields++
            else newMissingFields.push({ id: check.id, label: check.label })
          })
        } else if (fluxConfigurationData.fluxType === "HTTP Download") {
          const httpDownloadMetadata = typeConfigurationData.httpDownloadMetadata || []
          const areMetadataValid = httpDownloadMetadata.every(
            (item) => item.key.trim() !== "" && item.value.trim() !== "",
          )

          const step3Checks = [
            {
              id: "httpDownloadUrl",
              label: "URL",
              isValid: !!typeConfigurationData.httpDownloadUrl && isValidUrl(typeConfigurationData.httpDownloadUrl),
            },
            {
              id: "httpDownloadContentType",
              label: "Content Type",
              isValid: !!typeConfigurationData.httpDownloadContentType,
            },
            {
              id: "httpDownloadMetadataContainer",
              label: "Additional Metadata",
              isValid: httpDownloadMetadata.length === 0 || areMetadataValid,
            },
          ]
          totalFields = step3Checks.length
          step3Checks.forEach((check) => {
            if (check.isValid) validFields++
            else newMissingFields.push({ id: check.id, label: check.label })
          })
        } else if (fluxConfigurationData.fluxType === "SFTP") {
          const sftpFileRuleGroups = typeConfigurationData.sftpFileRuleGroups || []
          const sftpMetadata = typeConfigurationData.sftpMetadata || []
          const areMetadataValid = sftpMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          const step3Checks = [
            {
              id: "sftpHost",
              label: "Host",
              isValid: !!typeConfigurationData.sftpHost && isValidSftpHost(typeConfigurationData.sftpHost),
            },
            {
              id: "sftpProtocol",
              label: "Protocol",
              isValid: !!typeConfigurationData.sftpProtocol,
            },
            {
              id: "sftpPort",
              label: "Port",
              isValid:
                !!typeConfigurationData.sftpPort &&
                typeConfigurationData.sftpPort > 0 &&
                typeConfigurationData.sftpPort <= 65535,
            },
            { id: "sftpUsername", label: "Username", isValid: !!typeConfigurationData.sftpUsername },
            { id: "sftpPassword", label: "Password", isValid: !!typeConfigurationData.sftpPassword },
            {
              id: "sftpFilePattern",
              label: "File Pattern",
              isValid:
                !!typeConfigurationData.sftpFilePattern && isValidFilePattern(typeConfigurationData.sftpFilePattern),
            },
            // File rules, metadata, and processAllAttachments are optional, not included in progress calculation
          ]
          totalFields = step3Checks.length
          step3Checks.forEach((check) => {
            if (check.isValid) validFields++
            else newMissingFields.push({ id: check.id, label: check.label })
          })
        } else if (fluxConfigurationData.fluxType === "Webhook") {
          const webhookMetadata = typeConfigurationData.webhookMetadata || []
          const areMetadataValid = webhookMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          const step3Checks = [
            {
              id: "webhookUrl",
              label: "URL",
              isValid: !!typeConfigurationData.webhookUrl && isValidUrl(typeConfigurationData.webhookUrl),
            },
            { id: "webhookApiKey", label: "API Key", isValid: !!typeConfigurationData.webhookApiKey },
            {
              id: "webhookMetadataContainer",
              label: "Additional Metadata",
              isValid: webhookMetadata.length === 0 || areMetadataValid,
            },
          ]
          totalFields = step3Checks.length
          step3Checks.forEach((check) => {
            if (check.isValid) validFields++
            else newMissingFields.push({ id: check.id, label: check.label })
          })
        } else if (fluxConfigurationData.fluxType === "Scraping") {
          const scrapingMetadata = typeConfigurationData.scrapingMetadata || []
          const areMetadataValid = scrapingMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          const step3Checks = [
            {
              id: "scrapingUrl",
              label: "URL",
              isValid: !!typeConfigurationData.scrapingUrl && isValidUrl(typeConfigurationData.scrapingUrl),
            },
            {
              id: "scrapingContentType",
              label: "Content Type",
              isValid: !!typeConfigurationData.scrapingContentType,
            },
            {
              id: "scrapingMetadataContainer",
              label: "Additional Metadata",
              isValid: scrapingMetadata.length === 0 || areMetadataValid,
            },
          ]
          totalFields = step3Checks.length
          step3Checks.forEach((check) => {
            if (check.isValid) validFields++
            else newMissingFields.push({ id: check.id, label: check.label })
          })
        } else if (fluxConfigurationData.fluxType === "Manual") {
          const manualMetadata = typeConfigurationData.manualMetadata || []
          const areMetadataValid = manualMetadata.every((item) => item.key.trim() !== "" && item.value.trim() !== "")

          const step3Checks = [
            {
              id: "manualContentType",
              label: "Content Type",
              isValid: !!typeConfigurationData.manualContentType,
            },
            {
              id: "manualMetadataContainer",
              label: "Additional Metadata",
              isValid: manualMetadata.length === 0 || areMetadataValid,
            },
          ]
          totalFields = step3Checks.length
          step3Checks.forEach((check) => {
            if (check.isValid) validFields++
            else newMissingFields.push({ id: check.id, label: check.label })
          })
        } else {
          totalFields = 1
          validFields = 1
        }
      }
      setProgress(totalFields > 0 ? (validFields / totalFields) * 100 : 100)
      setMissingFields(newMissingFields)
    }
    calculateProgress()
  }, [currentStep, basicInformationData, fluxConfigurationData, typeConfigurationData])

  const canGoToNextStep = isStepValid(currentStep) && progress === 100
  const canGoToPreviousStep = currentStep > 1
  // isSaveEnabled is already defined above

  const disabledButtonStyle = "border border-input bg-background text-gray-400 cursor-not-allowed"

  const handleNext = () => {
    if (canGoToNextStep && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
      setHasUnsavedChanges(true)
    }
  }
  const handlePrevious = () => {
    if (canGoToPreviousStep) setCurrentStep(currentStep - 1)
  }

  const handleBasicInformationChange = (data: BasicInformationData) => {
    setBasicInformationData(data)
    setHasUnsavedChanges(true)
  }
  const handleFluxConfigurationChange = (data: FluxConfigurationData) => {
    setFluxConfigurationData(data)
    setHasUnsavedChanges(true)
  }
  const handleTypeConfigurationChange = (data: TypeConfigurationData) => {
    setTypeConfigurationData(data)
    setHasUnsavedChanges(true)
  }

  const confirmClose = () => {
    setShowUnsavedDialog(false)
    setHasUnsavedChanges(false)
    onClose()
  }
  const cancelClose = () => setShowUnsavedDialog(false)

  const handleSaveClick = () => {
    if (isSaveEnabled) {
      onSave({
        basic: basicInformationData,
        fluxConfig: fluxConfigurationData,
        typeConfig: typeConfigurationData,
      })
    }
  }

  const handleFocusField = (fieldId: string) => {
    const element = document.getElementById(fieldId)
    if (element) {
      element.focus({ preventScroll: true })
      element.scrollIntoView({ behavior: "smooth", block: "center" })
      element.style.outline = "2px solid #3b82f6"
      setTimeout(() => {
        element.style.outline = ""
      }, 2000)
    }
  }

  useEffect(() => {
    const updateBladeWidth = () => {
      if (typeof window === "undefined") return
      const currentWindowWidth = window.innerWidth
      const mobileBreakpoint = 768
      const largeScreenStartBreakpoint = 1280
      const veryLargeScreenEndBreakpoint = 1920

      if (currentWindowWidth < mobileBreakpoint) {
        setCalculatedWidthPercentage(100)
      } else if (currentWindowWidth < largeScreenStartBreakpoint) {
        setCalculatedWidthPercentage(widthPercentage)
      } else if (currentWindowWidth >= veryLargeScreenEndBreakpoint) {
        setCalculatedWidthPercentage(widthPercentage)
      } else {
        const minPercentage = 60
        const maxPercentage = widthPercentage
        const rangeWidth = veryLargeScreenEndBreakpoint - largeScreenStartBreakpoint
        const currentRangePosition = currentWindowWidth - largeScreenStartBreakpoint
        const percentageIncrease = (maxPercentage - minPercentage) * (currentRangePosition / rangeWidth)
        const newPercentage = minPercentage + percentageIncrease
        setCalculatedWidthPercentage(Math.round(newPercentage))
      }
    }
    updateBladeWidth()
    window.addEventListener("resize", updateBladeWidth)
    return () => window.removeEventListener("resize", updateBladeWidth)
  }, [widthPercentage])

  const headerHeight = "h-16"

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicInformationForm
            data={basicInformationData} // Corrected prop name
            onChange={handleBasicInformationChange}
            // Removed setHasUnsavedChanges
          />
        )
      case 2:
        return (
          <FluxConfigurationForm
            data={fluxConfigurationData} // Corrected prop name
            onChange={handleFluxConfigurationChange}
            // Removed setHasUnsavedChanges
          />
        )
      case 3:
        return (
          <TypeConfigurationForm
            data={typeConfigurationData} // Corrected prop name
            onChange={handleTypeConfigurationChange}
            // Removed setHasUnsavedChanges
            fluxType={fluxConfigurationData.fluxType}
          />
        )
      default:
        return <div>Unknown step</div>
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed top-0 right-0 h-full bg-white shadow-2xl z-[99] transition-transform duration-[240ms] ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
        style={{ width: `${calculatedWidthPercentage}%` }} // Apply width as inline style
        ref={bladeRef}
      >
        <div className={cn("flex items-center justify-between px-1 md:px-3 border-b shrink-0", headerHeight)}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                handleCloseAttempt()
              }}
              className="hover:bg-gray-100 rounded-full"
            >
              <CustomCloseIcon className="h-3.5 w-3.5" />
            </Button>
            <h1 className="text-xl font-medium text-gray-800">{basicInformationData.fluxName.trim() || "New Flux"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveClick}
              disabled={!isSaveEnabled}
              className={cn(
                "px-6 w-[135px]",
                isSaveEnabled ? "bg-primary hover:bg-primary/90 text-primary-foreground" : disabledButtonStyle,
              )}
            >
              Save
            </Button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto bg-[#F1F3F4]">
          <div className="w-full md:w-4/5 xl:w-3/5 mx-auto">
            <div className="px-4 md:px-6 py-0 bg-[#F1F3F4] border-b border-gray-200 sticky top-0 z-10">
              <Stepper steps={stepperSteps} currentStep={currentStep} />
            </div>
            <div className="pt-0 px-4 pb-4 md:pt-0 md:px-6 md:pb-6">{renderStepContent()}</div>
          </div>
        </div>

        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t bg-white shrink-0">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={!canGoToPreviousStep}
            className={cn(
              "px-6 w-28",
              !canGoToPreviousStep ? disabledButtonStyle : "border-[#DEDEDE] text-[#717171] hover:bg-gray-100",
            )}
          >
            Previous
          </Button>

          <div className="flex flex-col items-center mx-4 flex-grow max-w-xs">
            <div className="w-full flex justify-center items-center mb-1">
              <span className="text-xs font-medium text-gray-500">
                Step {currentStep} of {totalSteps} - Completion
              </span>
            </div>
            <div className="flex items-center w-full gap-2">
              <Progress value={progress} className="h-2 flex-grow" />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 p-1">
                    <Info className="h-4 w-4 text-gray-500" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="p-2">
                    <h4 className="font-medium text-gray-800 mb-2 text-sm">Remaining fields to complete:</h4>
                    {missingFields.length > 0 ? (
                      <ul className="space-y-1">
                        {missingFields.map((field) => (
                          <li key={field.id}>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-blue-600 hover:text-blue-800 font-normal text-xs"
                              onClick={() => handleFocusField(field.id)}
                            >
                              • {field.label}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-500">All fields for this step are complete!</p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoToNextStep || currentStep >= totalSteps}
            className={cn(
              "px-6 w-28",
              canGoToNextStep && currentStep < totalSteps
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : disabledButtonStyle,
            )}
          >
            Next
          </Button>
        </div>
      </div>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-[98]" onClick={handleCloseAttempt} />}
      <UnsavedChangesDialog isOpen={showUnsavedDialog} onClose={cancelClose} onConfirm={confirmClose} />
    </>
  )
}
