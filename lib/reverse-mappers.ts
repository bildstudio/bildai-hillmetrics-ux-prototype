import type { BasicInformationData } from "@/components/forms/basic-information-form"
import type { TypeConfigurationData, MetadataItem, EmailRulesData } from "@/components/forms/type-configuration-form"

/**
 * Converts an array of metadata items back into a key-value object.
 * @param metadata The array of MetadataItem objects from the form.
 * @returns A key-value object.
 */
const reverseTransformMetadata = (metadata: MetadataItem[] | undefined): Record<string, any> => {
  if (!metadata) return {}
  return metadata.reduce(
    (acc, item) => {
      if (item.key) {
        acc[item.key] = item.value
      }
      return acc
    },
    {} as Record<string, any>,
  )
}

/**
 * Converts email rule groups from the form format back to the database format.
 * @param ruleGroups The array of EmailRulesData objects from the form.
 * @returns An array of rule groups for the database.
 */
const reverseTransformRuleGroups = (ruleGroups: EmailRulesData[] | undefined): any[] => {
  if (!ruleGroups) return []
  return ruleGroups.map((group) => ({
    logicalOperator: group.logicalOperator,
    criteria: group.criteria.map((criterion) => ({
      field: criterion.key, // Map form 'key' back to DB 'field'
      operator: criterion.operator,
      value: criterion.value,
    })),
  }))
}

/**
 * Maps schedule data from the form state back to the database configuration format.
 * @param scheduleData The schedule data from the form.
 * @returns A configuration object for the database.
 */
export const mapToDbScheduleConfig = (
  scheduleData: BasicInformationData["fetchSchedule"] | BasicInformationData["processSchedule"],
): object => {
  const { frequencyType, active, ...rest } = scheduleData
  const config: any = { type: frequencyType }

  if (frequencyType === "Never") {
    return { type: "Never" }
  }

  switch (frequencyType) {
    case "Specific":
      const [hours, minutes] = (rest.startTime || "00:00").split(":").map(Number)
      config.hours = [hours || 0]
      config.minutes = [minutes || 0]
      break
    case "Every X Minutes":
      config.intervalMinutes = rest.intervalMinutes
      break
    case "Every X Hours":
      config.intervalHours = rest.intervalHours
      break
    case "Daily":
      if (rest.intervalDays) {
        config.intervalDays = rest.intervalDays
      }
      break
    case "Monthly":
      config.startTime = rest.startTime
      config.dayOfMonth = rest.dayOfMonth
      break
  }
  return config
}

/**
 * Maps type configuration data from the form state back to the database format.
 * @param fluxType The type of the flux.
 * @param typeConfig The type configuration data from the form.
 * @returns A configuration object for the database.
 */
export const mapToDbTypeConfig = (fluxType: string, typeConfig: TypeConfigurationData): object => {
  let dbConfig: any = {}

  switch (fluxType) {
    case "Email":
      dbConfig = {
        contentLocation: typeConfig.contentLocation,
        emailRuleGroup: reverseTransformRuleGroups(typeConfig.emailRuleGroups),
        metadata: reverseTransformMetadata(typeConfig.emailMetadata),
      }
      break
    case "API":
      dbConfig = {
        apiUrl: typeConfig.apiUrl,
        apiKey: typeConfig.apiKey,
        metadata: reverseTransformMetadata(typeConfig.apiMetadata),
      }
      break
    case "HTTP Download":
      dbConfig = {
        url: typeConfig.httpDownloadUrl,
        contentType: typeConfig.httpDownloadContentType,
        metadata: reverseTransformMetadata(typeConfig.httpDownloadMetadata),
      }
      break
    case "SFTP":
      dbConfig = {
        host: typeConfig.sftpHost,
        port: typeConfig.sftpPort,
        user: typeConfig.sftpUsername,
        password: typeConfig.sftpPassword,
        useSshKey: typeConfig.sftpUseSshKeyAuth,
        deleteAfterDownload: typeConfig.sftpDeleteAfterDownload,
        fileGroups: [{ path: "/remote/path/", pattern: typeConfig.sftpFilePattern }],
        metadata: reverseTransformMetadata(typeConfig.sftpMetadata),
      }
      break
    case "Webhook":
      dbConfig = {
        url: typeConfig.webhookUrl,
        apiKey: typeConfig.webhookApiKey,
        metadata: reverseTransformMetadata(typeConfig.webhookMetadata),
      }
      break
    case "Scraping":
      dbConfig = {
        url: typeConfig.scrapingUrl,
        contentType: typeConfig.scrapingContentType,
        metadata: reverseTransformMetadata(typeConfig.scrapingMetadata),
      }
      break
    case "Manual":
      dbConfig = {
        url: "manual_upload",
        contentType: typeConfig.manualContentType,
        metadata: reverseTransformMetadata(typeConfig.manualMetadata),
      }
      break
  }
  return dbConfig
}
