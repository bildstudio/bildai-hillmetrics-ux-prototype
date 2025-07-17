import type { BasicInformationData } from "@/components/forms/basic-information-form"
import type { TypeConfigurationData, MetadataItem, EmailRulesData } from "@/components/forms/type-configuration-form"

/**
 * Transforms a record object (like {"key": "value"}) into an array of MetadataItem objects.
 * @param metadataObj The object to transform.
 * @returns An array of MetadataItem objects.
 */
const transformMetadata = (metadataObj: Record<string, any> | undefined): MetadataItem[] => {
  if (!metadataObj) return []
  return Object.entries(metadataObj).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value: String(value),
  }))
}

/**
 * Transforms rule groups from the database format to the form format, adding unique IDs.
 * @param ruleGroups The array of rule groups from the database.
 * @returns An array of EmailRulesData objects compatible with the form.
 */
const transformRuleGroups = (ruleGroups: any[] | undefined): EmailRulesData[] => {
  if (!ruleGroups || !Array.isArray(ruleGroups)) return []
  return ruleGroups.map((group) => ({
    id: crypto.randomUUID(),
    logicalOperator: group.logicalOperator || "AND (All condition must match)", // Provide a default
    criteria: (group.criteria || []).map((criterion: any) => ({
      id: crypto.randomUUID(),
      key: criterion.field || "", // Map DB 'field' to form 'key'
      operator: criterion.operator || "",
      value: criterion.value || "",
    })),
  }))
}

/**
 * Maps the schedule configuration from the database to the format expected by the BasicInformationForm.
 * @param config The schedule configuration object from the database.
 * @param scheduleType The type of schedule ('fetch' or 'process').
 * @returns A schedule object for the form state.
 */
export const mapToScheduleData = (
  config: any,
  scheduleType: "fetch" | "process",
): BasicInformationData["fetchSchedule"] | BasicInformationData["processSchedule"] => {
  const frequencyType = config?.type || "Never"
  const active = frequencyType !== "Never"

  const scheduleData: any = { active, frequencyType }

  switch (frequencyType) {
    case "Specific":
      const hours = String(config.hours?.[0] || 0).padStart(2, "0")
      const minutes = String(config.minutes?.[0] || 0).padStart(2, "0")
      scheduleData.startTime = `${hours}:${minutes}`
      break
    case "Every X Minutes":
      scheduleData.intervalMinutes = config.intervalMinutes
      break
    case "Every X Hours":
      scheduleData.intervalHours = config.intervalHours
      break
    case "Daily":
      // The process schedule form expects intervalDays for Daily.
      if (scheduleType === "process" && config.intervalDays) {
        scheduleData.intervalDays = config.intervalDays
      }
      // The fetch schedule form does not have an input for intervalDays, so we don't map it.
      break
    case "Monthly":
      scheduleData.startTime = config.startTime
      scheduleData.dayOfMonth = config.dayOfMonth
      break
    default:
      // For "Immediately" and "Never", no extra fields are needed.
      break
  }
  return scheduleData
}

/**
 * Maps the flux type configuration from the database to the format expected by the TypeConfigurationForm.
 * @param fluxType The type of the flux (e.g., 'Email', 'API').
 * @param config The flux type configuration object from the database.
 * @returns A type configuration object for the form state.
 */
export const mapToTypeConfigData = (fluxType: string, config: any): TypeConfigurationData => {
  if (!config) return {}

  let typeConfigData: TypeConfigurationData = {}

  switch (fluxType) {
    case "Email":
      typeConfigData = {
        contentLocation: config.contentLocation,
        emailRuleGroups: transformRuleGroups(config.emailRuleGroup),
        emailMetadata: transformMetadata(config.metadata),
      }
      break
    case "API":
      typeConfigData = {
        apiUrl: config.apiUrl,
        apiKey: config.apiKey,
        apiMetadata: transformMetadata(config.metadata),
      }
      break
    case "HTTP Download":
      typeConfigData = {
        httpDownloadUrl: config.url,
        httpDownloadContentType: config.contentType,
        httpDownloadMetadata: transformMetadata(config.metadata),
      }
      break
    case "SFTP":
      typeConfigData = {
        sftpHost: config.host,
        sftpPort: config.port,
        sftpUsername: config.user,
        sftpPassword: config.password,
        sftpUseSshKeyAuth: config.useSshKey,
        sftpDeleteAfterDownload: config.deleteAfterDownload,
        sftpFilePattern: config.fileGroups?.[0]?.pattern, // Assuming the first pattern is the main one
        sftpMetadata: transformMetadata(config.metadata),
        sftpFileRuleGroups: transformRuleGroups(config.fileRuleGroups), // Handle case where it might exist
      }
      break
    case "Webhook":
      typeConfigData = {
        webhookUrl: config.url,
        webhookApiKey: config.apiKey,
        webhookMetadata: transformMetadata(config.metadata),
      }
      break
    case "Scraping":
      typeConfigData = {
        scrapingUrl: config.url,
        scrapingContentType: config.contentType,
        scrapingMetadata: transformMetadata(config.metadata),
      }
      break
    case "Manual":
      typeConfigData = {
        manualContentType: config.contentType,
        manualMetadata: transformMetadata(config.metadata),
      }
      break
    default:
      break
  }

  return typeConfigData
}
