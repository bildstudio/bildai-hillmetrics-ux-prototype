"use client"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PlusIcon, Trash2Icon, EyeIcon, EyeOffIcon } from "lucide-react"
import { useState } from "react"
import { testSftpConnection } from "@/app/actions/sftp"
import { Switch } from "@/components/ui/switch" // Import Switch component

// Interfaces for data
export interface EmailRuleCriterion {
  id: string // Unique ID for React keys
  key: string
  operator: string
  value: string
}

export interface EmailRulesData {
  id: string // Unique ID for the rule group
  logicalOperator: string
  criteria: EmailRuleCriterion[]
}

export interface MetadataItem {
  id: string // Unique ID for React keys
  key: string
  value: string
}

export interface TypeConfigurationData {
  contentLocation?: string
  emailRuleGroups?: EmailRulesData[]
  emailMetadata?: MetadataItem[]
  apiUrl?: string
  apiKey?: string
  apiMetadata?: MetadataItem[]
  httpDownloadUrl?: string
  httpDownloadContentType?: string
  httpDownloadMetadata?: MetadataItem[]
  sftpHost?: string
  sftpPort?: number
  sftpUsername?: string
  sftpPassword?: string
  sftpProtocol?: string
  sftpFilePattern?: string // New: File Pattern
  sftpDeleteAfterDownload?: boolean // New: Delete file after download
  sftpUseSshKeyAuth?: boolean // New: Use SSH Key Authentication
  sftpFileRuleGroups?: EmailRulesData[] // New: SFTP File Rule Groups (reusing EmailRulesData)
  sftpMetadata?: MetadataItem[] // New: SFTP Additional Metadata (reusing MetadataItem)
  processAllAttachments?: boolean // New: Process all attachments toggle
  webhookUrl?: string // New: Webhook URL
  webhookApiKey?: string // New: Webhook API Key
  webhookMetadata?: MetadataItem[] // New: Webhook Additional Metadata
  scrapingUrl?: string // New: Scraping URL
  scrapingContentType?: string // New: Scraping Content Type
  scrapingMetadata?: MetadataItem[] // New: Scraping Additional Metadata
  manualContentType?: string // New: Manual Content Type
  manualMetadata?: MetadataItem[] // New: Manual Additional Metadata
}

interface TypeConfigurationFormProps {
  fluxType: string
  data: TypeConfigurationData
  onChange: (data: TypeConfigurationData) => void
}

export function TypeConfigurationForm({ fluxType, data, onChange }: TypeConfigurationFormProps) {
  const updateData = (updates: Partial<TypeConfigurationData>) => {
    onChange({ ...data, ...updates })
  }

  // State for SFTP connection test
  const [sftpTestResult, setSftpTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isTestingSftp, setIsTestingSftp] = useState(false)
  const [showSftpPassword, setShowSftpPassword] = useState(false)

  // Email specific handlers (reused for SFTP File Rules)
  const handleAddRuleGroup = (type: "email" | "sftp") => {
    const newRuleGroup: EmailRulesData = {
      id: crypto.randomUUID(),
      logicalOperator: "",
      criteria: [],
    }
    if (type === "email") {
      updateData({ emailRuleGroups: [...(data.emailRuleGroups || []), newRuleGroup] })
    } else if (type === "sftp") {
      updateData({ sftpFileRuleGroups: [...(data.sftpFileRuleGroups || []), newRuleGroup] })
    }
  }

  const handleDeleteRuleGroup = (type: "email" | "sftp", groupId: string) => {
    if (type === "email") {
      updateData({
        emailRuleGroups: (data.emailRuleGroups || []).filter((group) => group.id !== groupId),
      })
    } else if (type === "sftp") {
      updateData({
        sftpFileRuleGroups: (data.sftpFileRuleGroups || []).filter((group) => group.id !== groupId),
      })
    }
  }

  const handleRuleGroupChange = (type: "email" | "sftp", groupId: string, updates: Partial<EmailRulesData>) => {
    if (type === "email") {
      updateData({
        emailRuleGroups: (data.emailRuleGroups || []).map((group) =>
          group.id === groupId ? { ...group, ...updates } : group,
        ),
      })
    } else if (type === "sftp") {
      updateData({
        sftpFileRuleGroups: (data.sftpFileRuleGroups || []).map((group) =>
          group.id === groupId ? { ...group, ...updates } : group,
        ),
      })
    }
  }

  const handleAddCriterion = (type: "email" | "sftp", groupId: string) => {
    const newCriterion: EmailRuleCriterion = {
      id: crypto.randomUUID(),
      key: "",
      operator: "",
      value: "",
    }
    if (type === "email") {
      handleRuleGroupChange("email", groupId, {
        criteria: [...((data.emailRuleGroups || []).find((g) => g.id === groupId)?.criteria || []), newCriterion],
      })
    } else if (type === "sftp") {
      handleRuleGroupChange("sftp", groupId, {
        criteria: [...((data.sftpFileRuleGroups || []).find((g) => g.id === groupId)?.criteria || []), newCriterion],
      })
    }
  }

  const handleDeleteCriterion = (type: "email" | "sftp", groupId: string, criterionId: string) => {
    if (type === "email") {
      handleRuleGroupChange("email", groupId, {
        criteria: ((data.emailRuleGroups || []).find((g) => g.id === groupId)?.criteria || []).filter(
          (c) => c.id !== criterionId,
        ),
      })
    } else if (type === "sftp") {
      handleRuleGroupChange("sftp", groupId, {
        criteria: ((data.sftpFileRuleGroups || []).find((g) => g.id === groupId)?.criteria || []).filter(
          (c) => c.id !== criterionId,
        ),
      })
    }
  }

  const handleCriterionChange = (
    type: "email" | "sftp",
    groupId: string,
    criterionId: string,
    field: keyof EmailRuleCriterion,
    value: string,
  ) => {
    if (type === "email") {
      updateData({
        emailRuleGroups: (data.emailRuleGroups || []).map((group) =>
          group.id === groupId
            ? {
                ...group,
                criteria: group.criteria.map((c) => (c.id === criterionId ? { ...c, [field]: value } : c)),
              }
            : group,
        ),
      })
    } else if (type === "sftp") {
      updateData({
        sftpFileRuleGroups: (data.sftpFileRuleGroups || []).map((group) =>
          group.id === groupId
            ? {
                ...group,
                criteria: group.criteria.map((c) => (c.id === criterionId ? { ...c, [field]: value } : c)),
              }
            : group,
        ),
      })
    }
  }

  // Generic metadata handlers (used for API, HTTP Download, SFTP, Email, Webhook, Scraping, and Manual)
  const handleAddMetadata = (type: "api" | "httpDownload" | "sftp" | "email" | "webhook" | "scraping" | "manual") => {
    const newMetadata: MetadataItem = {
      id: crypto.randomUUID(),
      key: "",
      value: "",
    }
    if (type === "api") {
      updateData({ apiMetadata: [...(data.apiMetadata || []), newMetadata] })
    } else if (type === "httpDownload") {
      updateData({ httpDownloadMetadata: [...(data.httpDownloadMetadata || []), newMetadata] })
    } else if (type === "sftp") {
      updateData({ sftpMetadata: [...(data.sftpMetadata || []), newMetadata] })
    } else if (type === "email") {
      updateData({ emailMetadata: [...(data.emailMetadata || []), newMetadata] })
    } else if (type === "webhook") {
      updateData({ webhookMetadata: [...(data.webhookMetadata || []), newMetadata] })
    } else if (type === "scraping") {
      updateData({ scrapingMetadata: [...(data.scrapingMetadata || []), newMetadata] })
    } else if (type === "manual") {
      updateData({ manualMetadata: [...(data.manualMetadata || []), newMetadata] })
    }
  }

  const handleDeleteMetadata = (
    type: "api" | "httpDownload" | "sftp" | "email" | "webhook" | "scraping" | "manual",
    metadataId: string,
  ) => {
    if (type === "api") {
      updateData({
        apiMetadata: (data.apiMetadata || []).filter((item) => item.id !== metadataId),
      })
    } else if (type === "httpDownload") {
      updateData({
        httpDownloadMetadata: (data.httpDownloadMetadata || []).filter((item) => item.id !== metadataId),
      })
    } else if (type === "sftp") {
      updateData({
        sftpMetadata: (data.sftpMetadata || []).filter((item) => item.id !== metadataId),
      })
    } else if (type === "email") {
      updateData({
        emailMetadata: (data.emailMetadata || []).filter((item) => item.id !== metadataId),
      })
    } else if (type === "webhook") {
      updateData({
        webhookMetadata: (data.webhookMetadata || []).filter((item) => item.id !== metadataId),
      })
    } else if (type === "scraping") {
      updateData({
        scrapingMetadata: (data.scrapingMetadata || []).filter((item) => item.id !== metadataId),
      })
    } else if (type === "manual") {
      updateData({
        manualMetadata: (data.manualMetadata || []).filter((item) => item.id !== metadataId),
      })
    }
  }

  const handleMetadataChange = (
    type: "api" | "httpDownload" | "sftp" | "email" | "webhook" | "scraping" | "manual",
    metadataId: string,
    field: keyof MetadataItem,
    value: string,
  ) => {
    if (type === "api") {
      updateData({
        apiMetadata: (data.apiMetadata || []).map((item) =>
          item.id === metadataId ? { ...item, [field]: value } : item,
        ),
      })
    } else if (type === "httpDownload") {
      updateData({
        httpDownloadMetadata: (data.httpDownloadMetadata || []).map((item) =>
          item.id === metadataId ? { ...item, [field]: value } : item,
        ),
      })
    } else if (type === "sftp") {
      updateData({
        sftpMetadata: (data.sftpMetadata || []).map((item) =>
          item.id === metadataId ? { ...item, [field]: value } : item,
        ),
      })
    } else if (type === "email") {
      updateData({
        emailMetadata: (data.emailMetadata || []).map((item) =>
          item.id === metadataId ? { ...item, [field]: value } : item,
        ),
      })
    } else if (type === "webhook") {
      updateData({
        webhookMetadata: (data.webhookMetadata || []).map((item) =>
          item.id === metadataId ? { ...item, [field]: value } : item,
        ),
      })
    } else if (type === "scraping") {
      updateData({
        scrapingMetadata: (data.scrapingMetadata || []).map((item) =>
          item.id === metadataId ? { ...item, [field]: value } : item,
        ),
      })
    } else if (type === "manual") {
      updateData({
        manualMetadata: (data.manualMetadata || []).map((item) =>
          item.id === metadataId ? { ...item, [field]: value } : item,
        ),
      })
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const isValidUrl = (url: string) => {
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

  // SFTP connection test handler
  const canTestSftpConnection =
    !!data.sftpHost &&
    isValidSftpHost(data.sftpHost) &&
    !!data.sftpPort &&
    data.sftpPort > 0 &&
    data.sftpPort <= 65535 &&
    !!data.sftpUsername &&
    !!data.sftpPassword &&
    !!data.sftpProtocol

  const handleTestSftpConnection = async () => {
    if (!canTestSftpConnection) {
      setSftpTestResult({ success: false, message: "Please fill all required SFTP fields." })
      return
    }

    setIsTestingSftp(true)
    setSftpTestResult(null)

    try {
      const response = await testSftpConnection({
        host: data.sftpHost!,
        port: data.sftpPort!,
        username: data.sftpUsername!,
        password: data.sftpPassword!,
        protocol: data.sftpProtocol!,
      })
      setSftpTestResult(response)
    } catch (error) {
      console.error("SFTP test connection error:", error)
      setSftpTestResult({ success: false, message: "An unexpected error occurred during connection test." })
    } finally {
      setIsTestingSftp(false)
    }
  }

  // Options for dropdowns
  const contentLocationOptions = ["Attachment", "Email Body"]
  const logicalOperatorOptions = ["OR (Any condition can match)", "AND (All condition must match)"]
  const criterionKeyOptions = ["Email Sender", "Email Subject", "Email Attachment Name", "Email Attachment File Type"]
  const criterionOperatorOptions = ["Equals", "Not Equal", "Contains", "NotContains", "Starts With", "Ends With"]

  const fileTypeOptions = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".txt",
    ".csv",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".tiff",
    ".svg",
    ".zip",
    ".rar",
    ".7z",
    ".tar",
    ".gz",
    ".mp3",
    ".wav",
    ".aac",
    ".flac",
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".html",
    ".xml",
    ".json",
    ".js",
    ".css",
    ".ts",
    ".tsx",
    ".py",
    ".java",
    ".c",
    ".cpp",
    ".cs",
    ".exe",
    ".dll",
    ".dmg",
    ".apk",
  ]

  const httpDownloadContentTypes = ["Xlxs", "Xlx", "CSV", "Json", "Pdf", "Html", "Text", "Xml"]
  const sftpProtocols = ["SFTP", "FTP", "FTPS"]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2 mt-[15px]">
        Type Configuration
      </h3>

      {fluxType === "Email" && (
        <div className="space-y-6">
          {/* Content Location */}
          <div className="space-y-2">
            <Label htmlFor="contentLocation">Content location *</Label>
            <Select
              value={data.contentLocation || ""}
              onValueChange={(value) => updateData({ contentLocation: value })}
            >
              <SelectTrigger id="contentLocation">
                <SelectValue placeholder="Select content location" />
              </SelectTrigger>
              <SelectContent>
                {contentLocationOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email Rule Groups */}
          {(data.emailRuleGroups || []).length === 0 ? (
            <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
              You must add at least one Email Rule Group to proceed.
            </div>
          ) : (
            <div id="emailRuleGroupsContainer">
              {(data.emailRuleGroups || []).map((ruleGroup, groupIndex) => (
                <div key={ruleGroup.id} className="space-y-4 border p-4 rounded-md bg-gray-50 relative">
                  <h4 className="text-md font-semibold text-gray-800">Email Rule Group {groupIndex + 1}</h4>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteRuleGroup("email", ruleGroup.id)}
                    className="absolute top-4 right-4"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>

                  {/* Logical Operator */}
                  <div className="space-y-2">
                    <Label htmlFor={`logicalOperator-${ruleGroup.id}`}>Logical operator *</Label>
                    <Select
                      value={ruleGroup.logicalOperator || ""}
                      onValueChange={(value) =>
                        handleRuleGroupChange("email", ruleGroup.id, { logicalOperator: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select logical operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {logicalOperatorOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Criteria Field Group */}
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium text-gray-700">Criteria</h5>
                    {ruleGroup.criteria.length === 0 ? (
                      <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                        No criteria added. You must add at least one to finish.
                      </div>
                    ) : (
                      ruleGroup.criteria.map((criterion) => (
                        <div
                          key={criterion.id}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor={`key-${ruleGroup.id}-${criterion.id}`}>Key *</Label>
                            <Select
                              value={criterion.key}
                              onValueChange={(value) =>
                                handleCriterionChange("email", ruleGroup.id, criterion.id, "key", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select key" />
                              </SelectTrigger>
                              <SelectContent>
                                {criterionKeyOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`operator-${ruleGroup.id}-${criterion.id}`}>Operator *</Label>
                            <Select
                              value={criterion.operator}
                              onValueChange={(value) =>
                                handleCriterionChange("email", ruleGroup.id, criterion.id, "operator", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                {criterionOperatorOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 flex items-end gap-2">
                            <div className="flex-grow relative">
                              {" "}
                              {/* Added relative positioning here */}
                              <Label htmlFor={`value-${ruleGroup.id}-${criterion.id}`}>Value *</Label>
                              {criterion.key === "Email Attachment File Type" ? (
                                <Select
                                  value={criterion.value}
                                  onValueChange={(value) =>
                                    handleCriterionChange("email", ruleGroup.id, criterion.id, "value", value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select file type" />
                                  </SelectTrigger>
                                  <SelectContent className="z-[100]">
                                    {/* Changed from Command/CommandItem to direct SelectItem */}
                                    {fileTypeOptions.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  id={`value-${ruleGroup.id}-${criterion.id}`}
                                  value={criterion.value}
                                  onChange={(e) =>
                                    handleCriterionChange("email", ruleGroup.id, criterion.id, "value", e.target.value)
                                  }
                                  placeholder="Enter value"
                                  type={criterion.key === "Email Sender" ? "email" : "text"}
                                />
                              )}
                              {/* Error message as a dropdown panel */}
                              {criterion.key === "Email Sender" &&
                                criterion.value &&
                                !isValidEmail(criterion.value) && (
                                  <div className="absolute left-0 right-0 mt-1 p-1 bg-red-50 text-red-700 text-xs rounded-md shadow-sm z-10">
                                    Please enter a valid email address.
                                  </div>
                                )}
                            </div>
                            {/* Changed to ghost variant and red text for icon-only appearance */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCriterion("email", ruleGroup.id, criterion.id)}
                              className="shrink-0"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}

                    <Button
                      variant="outline"
                      onClick={() => handleAddCriterion("email", ruleGroup.id)}
                      className="w-full"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" /> Add criterion
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => handleAddRuleGroup("email")} className="w-full">
            <PlusIcon className="mr-2 h-4 w-4" /> Add Email Rule Group
          </Button>

          {/* Additional Metadata for Email */}
          <div className="space-y-4" id="emailMetadataContainer">
            <h4 className="text-md font-semibold text-gray-800">Additional Metadata</h4>
            {(data.emailMetadata || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No additional metadata defined.
              </div>
            ) : (
              (data.emailMetadata || []).map((metadataItem) => (
                <div key={metadataItem.id} className="flex items-end gap-2 border-b pb-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`email-metadata-key-${metadataItem.id}`}>Key *</Label>
                    <Input
                      id={`email-metadata-key-${metadataItem.id}`}
                      value={metadataItem.key}
                      onChange={(e) => handleMetadataChange("email", metadataItem.id, "key", e.target.value)}
                      placeholder="Enter key"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`email-metadata-value-${metadataItem.id}`}>Value *</Label>
                    <Input
                      id={`email-metadata-value-${metadataItem.id}`}
                      value={metadataItem.value}
                      onChange={(e) => handleMetadataChange("email", metadataItem.id, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetadata("email", metadataItem.id)}
                    className="shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddMetadata("email")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add metadata
            </Button>
          </div>
        </div>
      )}

      {fluxType === "API" && (
        <div className="space-y-6">
          {/* API URL */}
          <div className="space-y-2">
            <Label htmlFor="apiUrl">API URL *</Label>
            <Input
              id="apiUrl"
              type="url"
              value={data.apiUrl || ""}
              onChange={(e) => updateData({ apiUrl: e.target.value })}
              placeholder="e.g., https://api.example.com/data"
            />
            {data.apiUrl && !isValidUrl(data.apiUrl) && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid URL.</p>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="text"
              value={data.apiKey || ""}
              onChange={(e) => updateData({ apiKey: e.target.value })}
              placeholder="Enter API Key (optional)"
            />
          </div>

          {/* Additional Metadata */}
          <div className="space-y-4" id="apiMetadataContainer">
            <h4 className="text-md font-semibold text-gray-800">Additional Metadata</h4>
            {(data.apiMetadata || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No additional metadata defined.
              </div>
            ) : (
              (data.apiMetadata || []).map((metadataItem) => (
                <div key={metadataItem.id} className="flex items-end gap-2 border-b pb-4">
                  {" "}
                  {/* Changed to flex */}
                  <div className="flex-1 space-y-2">
                    {" "}
                    {/* Key input takes flex-1 */}
                    <Label htmlFor={`metadata-key-${metadataItem.id}`}>Key *</Label>
                    <Input
                      id={`metadata-key-${metadataItem.id}`}
                      value={metadataItem.key}
                      onChange={(e) => handleMetadataChange("api", metadataItem.id, "key", e.target.value)}
                      placeholder="Enter key"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    {" "}
                    {/* Value input takes flex-1 */}
                    <Label htmlFor={`metadata-value-${metadataItem.id}`}>Value *</Label>
                    <Input
                      id={`metadata-value-${metadataItem.id}`}
                      value={metadataItem.value}
                      onChange={(e) => handleMetadataChange("api", metadataItem.id, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetadata("api", metadataItem.id)}
                    className="shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddMetadata("api")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add metadata
            </Button>
          </div>
        </div>
      )}

      {fluxType === "HTTP Download" && (
        <div className="space-y-6">
          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="httpDownloadUrl">URL *</Label>
            <Input
              id="httpDownloadUrl"
              type="url"
              value={data.httpDownloadUrl || ""}
              onChange={(e) => updateData({ httpDownloadUrl: e.target.value })}
              placeholder="e.g., https://example.com/file.csv"
            />
            {data.httpDownloadUrl && !isValidUrl(data.httpDownloadUrl) && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid URL.</p>
            )}
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="httpDownloadContentType">Content Type *</Label>
            <Select
              value={data.httpDownloadContentType || ""}
              onValueChange={(value) => updateData({ httpDownloadContentType: value })}
            >
              <SelectTrigger id="httpDownloadContentType">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {httpDownloadContentTypes.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Metadata (reusing API styling) */}
          <div className="space-y-4" id="httpDownloadMetadataContainer">
            <h4 className="text-md font-semibold text-gray-800">Additional Metadata</h4>
            {(data.httpDownloadMetadata || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No additional metadata defined.
              </div>
            ) : (
              (data.httpDownloadMetadata || []).map((metadataItem) => (
                <div key={metadataItem.id} className="flex items-end gap-2 border-b pb-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`http-metadata-key-${metadataItem.id}`}>Key *</Label>
                    <Input
                      id={`http-metadata-key-${metadataItem.id}`}
                      value={metadataItem.key}
                      onChange={(e) => handleMetadataChange("httpDownload", metadataItem.id, "key", e.target.value)}
                      placeholder="Enter key"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`http-metadata-value-${metadataItem.id}`}>Value *</Label>
                    <Input
                      id={`http-metadata-value-${metadataItem.id}`}
                      value={metadataItem.value}
                      onChange={(e) => handleMetadataChange("httpDownload", metadataItem.id, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetadata("httpDownload", metadataItem.id)}
                    className="shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddMetadata("httpDownload")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add metadata
            </Button>
          </div>
        </div>
      )}

      {fluxType === "SFTP" && (
        <div className="space-y-6">
          {/* Host, Protocol and Port in one row */}
          <div className="flex gap-4 items-end">
            <div className="flex-grow-[7] space-y-2">
              <div className="relative">
                <Label htmlFor="sftpHost">Host *</Label>
                <Input
                  id="sftpHost"
                  type="text"
                  value={data.sftpHost || ""}
                  onChange={(e) => updateData({ sftpHost: e.target.value })}
                  placeholder="e.g., sftp.example.com"
                />
                {data.sftpHost && !isValidSftpHost(data.sftpHost) && (
                  <div className="absolute left-0 right-0 mt-1 p-1 bg-red-50 text-red-700 text-xs rounded-md shadow-sm z-10">
                    Please enter a valid SFTP host (e.g., hostname or IP).
                  </div>
                )}
              </div>
            </div>
            <div className="flex-grow-[1.5] space-y-2">
              <Label htmlFor="sftpProtocol">Protocol *</Label>
              <Select value={data.sftpProtocol || ""} onValueChange={(value) => updateData({ sftpProtocol: value })}>
                <SelectTrigger id="sftpProtocol">
                  <SelectValue placeholder="SFTP" />
                </SelectTrigger>
                <SelectContent>
                  {sftpProtocols.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow-[1.5] space-y-2">
              <Label htmlFor="sftpPort">Port *</Label>
              <Input
                id="sftpPort"
                type="number"
                value={data.sftpPort || ""}
                onChange={(e) => updateData({ sftpPort: Number.parseInt(e.target.value) || undefined })}
                placeholder="22"
                min={1}
                max={65535}
              />
            </div>
          </div>

          {/* Username and Password in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sftpUsername">Username *</Label>
              <Input
                id="sftpUsername"
                type="text"
                value={data.sftpUsername || ""}
                onChange={(e) => updateData({ sftpUsername: e.target.value })}
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sftpPassword">Password *</Label>
              <div className="relative">
                <Input
                  id="sftpPassword"
                  type={showSftpPassword ? "text" : "password"}
                  value={data.sftpPassword || ""}
                  onChange={(e) => updateData({ sftpPassword: e.target.value })}
                  placeholder="Enter password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSftpPassword(!showSftpPassword)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center px-3"
                >
                  {showSftpPassword ? (
                    <EyeOffIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* New fields: File Pattern and Toggles */}
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Label htmlFor="sftpFilePattern">File pattern *</Label>
                <Input
                  id="sftpFilePattern"
                  type="text"
                  value={data.sftpFilePattern || ""}
                  onChange={(e) => updateData({ sftpFilePattern: e.target.value })}
                  placeholder="e.g., *.csv or data_*.xlsx"
                />
                {data.sftpFilePattern && !isValidFilePattern(data.sftpFilePattern) && (
                  <div className="absolute left-0 right-0 mt-1 p-1 bg-red-50 text-red-700 text-xs rounded-md shadow-sm z-10">
                    File pattern cannot be empty.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="sftpDeleteAfterDownload"
                  checked={data.sftpDeleteAfterDownload || false}
                  onCheckedChange={(checked) => updateData({ sftpDeleteAfterDownload: checked })}
                />
                <Label htmlFor="sftpDeleteAfterDownload">Delete file after download</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="sftpUseSshKeyAuth"
                  checked={data.sftpUseSshKeyAuth || false}
                  onCheckedChange={(checked) => updateData({ sftpUseSshKeyAuth: checked })}
                />
                <Label htmlFor="sftpUseSshKeyAuth">Use SSH Key Authentication</Label>
              </div>
            </div>
          </div>

          {/* Connection Test Section */}
          <div className="space-y-4 border p-4 rounded-md bg-gray-50">
            <h4 className="text-md font-semibold text-gray-800">Test Connection</h4>
            <p className="text-sm text-gray-600">
              Enter SFTP credentials above and click "Test Connection" to verify connectivity.
            </p>
            <Button
              onClick={handleTestSftpConnection}
              disabled={isTestingSftp || !canTestSftpConnection}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isTestingSftp ? "Testing..." : "Test Connection"}
            </Button>
            {sftpTestResult && (
              <div
                className={cn(
                  "mt-2 p-3 rounded-md text-sm",
                  sftpTestResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800",
                )}
              >
                {sftpTestResult.message}
              </div>
            )}
          </div>

          {/* Process all attachments toggle for SFTP only */}
          <div className="space-y-4 border-t border-gray-200 pt-6 mt-6">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="processAllAttachments">Process all attachments</Label>
              <Switch
                id="processAllAttachments"
                checked={data.processAllAttachments || false}
                onCheckedChange={(checked) => updateData({ processAllAttachments: checked })}
              />
            </div>
          </div>

          {/* File Rules (similar to Email Rule Groups) */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-800">File Rules</h4>
            {(data.sftpFileRuleGroups || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No rules added. You must add at least one to finish.
              </div>
            ) : (
              (data.sftpFileRuleGroups || []).map((ruleGroup, groupIndex) => (
                <div key={ruleGroup.id} className="space-y-4 border p-4 rounded-md bg-gray-50 relative">
                  <h5 className="text-md font-semibold text-gray-800">File Rule Group {groupIndex + 1}</h5>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeleteRuleGroup("sftp", ruleGroup.id)}
                    className="absolute top-4 right-4"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>

                  {/* Logical Operator */}
                  <div className="space-y-2">
                    <Label htmlFor={`sftp-logicalOperator-${ruleGroup.id}`}>Logical operator *</Label>
                    <Select
                      value={ruleGroup.logicalOperator || ""}
                      onValueChange={(value) => handleRuleGroupChange("sftp", ruleGroup.id, { logicalOperator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select logical operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {logicalOperatorOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Criteria Field Group */}
                  <div className="space-y-4">
                    <h6 className="text-sm font-medium text-gray-700">Criteria</h6>
                    {ruleGroup.criteria.length === 0 ? (
                      <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                        No criteria added. You must add at least one to finish.
                      </div>
                    ) : (
                      ruleGroup.criteria.map((criterion) => (
                        <div
                          key={criterion.id}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor={`sftp-key-${ruleGroup.id}-${criterion.id}`}>Key *</Label>
                            <Select
                              value={criterion.key}
                              onValueChange={(value) =>
                                handleCriterionChange("sftp", ruleGroup.id, criterion.id, "key", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select key" />
                              </SelectTrigger>
                              <SelectContent>
                                {criterionKeyOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`sftp-operator-${ruleGroup.id}-${criterion.id}`}>Operator *</Label>
                            <Select
                              value={criterion.operator}
                              onValueChange={(value) =>
                                handleCriterionChange("sftp", ruleGroup.id, criterion.id, "operator", value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select operator" />
                              </SelectTrigger>
                              <SelectContent>
                                {criterionOperatorOptions.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2 flex items-end gap-2">
                            <div className="flex-grow relative">
                              <Label htmlFor={`sftp-value-${ruleGroup.id}-${criterion.id}`}>Value *</Label>
                              {criterion.key === "Email Attachment File Type" ? (
                                <Select
                                  value={criterion.value}
                                  onValueChange={(value) =>
                                    handleCriterionChange("sftp", ruleGroup.id, criterion.id, "value", value)
                                  }
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select file type" />
                                  </SelectTrigger>
                                  <SelectContent className="z-[100]">
                                    {fileTypeOptions.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  id={`sftp-value-${ruleGroup.id}-${criterion.id}`}
                                  value={criterion.value}
                                  onChange={(e) =>
                                    handleCriterionChange("sftp", ruleGroup.id, criterion.id, "value", e.target.value)
                                  }
                                  placeholder="Enter value"
                                  type={criterion.key === "Email Sender" ? "email" : "text"}
                                />
                              )}
                              {criterion.key === "Email Sender" &&
                                criterion.value &&
                                !isValidEmail(criterion.value) && (
                                  <div className="absolute left-0 right-0 mt-1 p-1 bg-red-50 text-red-700 text-xs rounded-md shadow-sm z-10">
                                    Please enter a valid email address.
                                  </div>
                                )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCriterion("sftp", ruleGroup.id, criterion.id)}
                              className="shrink-0"
                            >
                              <Trash2Icon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}

                    <Button
                      variant="outline"
                      onClick={() => handleAddCriterion("sftp", ruleGroup.id)}
                      className="w-full"
                    >
                      <PlusIcon className="mr-2 h-4 w-4" /> Add criterion
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddRuleGroup("sftp")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add File Rule Group
            </Button>
          </div>

          {/* Additional Metadata (reusing API/HTTP Download styling) */}
          <div className="space-y-4" id="sftpMetadataContainer">
            <h4 className="text-md font-semibold text-gray-800">Additional Metadata</h4>
            {(data.sftpMetadata || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No additional metadata defined.
              </div>
            ) : (
              (data.sftpMetadata || []).map((metadataItem) => (
                <div key={metadataItem.id} className="flex items-end gap-2 border-b pb-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`sftp-metadata-key-${metadataItem.id}`}>Key *</Label>
                    <Input
                      id={`sftp-metadata-key-${metadataItem.id}`}
                      value={metadataItem.key}
                      onChange={(e) => handleMetadataChange("sftp", metadataItem.id, "key", e.target.value)}
                      placeholder="Enter key"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`sftp-metadata-value-${metadataItem.id}`}>Value *</Label>
                    <Input
                      id={`sftp-metadata-value-${metadataItem.id}`}
                      value={metadataItem.value}
                      onChange={(e) => handleMetadataChange("sftp", metadataItem.id, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetadata("sftp", metadataItem.id)}
                    className="shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddMetadata("sftp")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add metadata
            </Button>
          </div>
        </div>
      )}

      {fluxType === "Webhook" && (
        <div className="space-y-6">
          {/* URL and API Key in one row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="relative">
                <Label htmlFor="webhookUrl">URL *</Label>
                <Input
                  id="webhookUrl"
                  type="url"
                  value={data.webhookUrl || ""}
                  onChange={(e) => updateData({ webhookUrl: e.target.value })}
                  placeholder="e.g., https://webhook.site/abc"
                />
                {data.webhookUrl && !isValidUrl(data.webhookUrl) && (
                  <div className="absolute left-0 right-0 mt-1 p-1 bg-red-50 text-red-700 text-xs rounded-md shadow-sm z-10">
                    Please enter a valid URL.
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                {" "}
                {/* Dodat div za konzistentno poravnanje */}
                <Label htmlFor="webhookApiKey">API Key *</Label>
                <Input
                  id="webhookApiKey"
                  type="text"
                  value={data.webhookApiKey || ""}
                  onChange={(e) => updateData({ webhookApiKey: e.target.value })}
                  placeholder="Enter API Key"
                />
              </div>
            </div>
          </div>

          {/* Additional Metadata for Webhook */}
          <div className="space-y-4" id="webhookMetadataContainer">
            <h4 className="text-md font-semibold text-gray-800">Additional Metadata</h4>
            {(data.webhookMetadata || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No additional metadata defined.
              </div>
            ) : (
              (data.webhookMetadata || []).map((metadataItem) => (
                <div key={metadataItem.id} className="flex items-end gap-2 border-b pb-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`webhook-metadata-key-${metadataItem.id}`}>Key *</Label>
                    <Input
                      id={`webhook-metadata-key-${metadataItem.id}`}
                      value={metadataItem.key}
                      onChange={(e) => handleMetadataChange("webhook", metadataItem.id, "key", e.target.value)}
                      placeholder="Enter key"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`webhook-metadata-value-${metadataItem.id}`}>Value *</Label>
                    <Input
                      id={`webhook-metadata-value-${metadataItem.id}`}
                      value={metadataItem.value}
                      onChange={(e) => handleMetadataChange("webhook", metadataItem.id, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetadata("webhook", metadataItem.id)}
                    className="shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddMetadata("webhook")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add metadata
            </Button>
          </div>
        </div>
      )}

      {fluxType === "Scraping" && (
        <div className="space-y-6">
          {/* URL */}
          <div className="space-y-2">
            <div className="relative">
              <Label htmlFor="scrapingUrl">URL *</Label>
              <Input
                id="scrapingUrl"
                type="url"
                value={data.scrapingUrl || ""}
                onChange={(e) => updateData({ scrapingUrl: e.target.value })}
                placeholder="e.g., https://example.com/page"
              />
              {data.scrapingUrl && !isValidUrl(data.scrapingUrl) && (
                <div className="absolute left-0 right-0 mt-1 p-1 bg-red-50 text-red-700 text-xs rounded-md shadow-sm z-10">
                  Please enter a valid URL.
                </div>
              )}
            </div>
          </div>

          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="scrapingContentType">Content Type *</Label>
            <Select
              value={data.scrapingContentType || ""}
              onValueChange={(value) => updateData({ scrapingContentType: value })}
            >
              <SelectTrigger id="scrapingContentType">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {httpDownloadContentTypes.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Metadata for Scraping */}
          <div className="space-y-4" id="scrapingMetadataContainer">
            <h4 className="text-md font-semibold text-gray-800">Additional Metadata</h4>
            {(data.scrapingMetadata || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No additional metadata defined.
              </div>
            ) : (
              (data.scrapingMetadata || []).map((metadataItem) => (
                <div key={metadataItem.id} className="flex items-end gap-2 border-b pb-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`scraping-metadata-key-${metadataItem.id}`}>Key *</Label>
                    <Input
                      id={`scraping-metadata-key-${metadataItem.id}`}
                      value={metadataItem.key}
                      onChange={(e) => handleMetadataChange("scraping", metadataItem.id, "key", e.target.value)}
                      placeholder="Enter key"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`scraping-metadata-value-${metadataItem.id}`}>Value *</Label>
                    <Input
                      id={`scraping-metadata-value-${metadataItem.id}`}
                      value={metadataItem.value}
                      onChange={(e) => handleMetadataChange("scraping", metadataItem.id, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetadata("scraping", metadataItem.id)}
                    className="shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddMetadata("scraping")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add metadata
            </Button>
          </div>
        </div>
      )}

      {fluxType === "Manual" && (
        <div className="space-y-6">
          {/* Content Type */}
          <div className="space-y-2">
            <Label htmlFor="manualContentType">Content Type *</Label>
            <Select
              value={data.manualContentType || ""}
              onValueChange={(value) => updateData({ manualContentType: value })}
            >
              <SelectTrigger id="manualContentType">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {httpDownloadContentTypes.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Metadata for Manual */}
          <div className="space-y-4" id="manualMetadataContainer">
            <h4 className="text-md font-semibold text-gray-800">Additional Metadata</h4>
            {(data.manualMetadata || []).length === 0 ? (
              <div className="text-center text-gray-500 p-4 border border-dashed rounded-md">
                No additional metadata defined.
              </div>
            ) : (
              (data.manualMetadata || []).map((metadataItem) => (
                <div key={metadataItem.id} className="flex items-end gap-2 border-b pb-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`manual-metadata-key-${metadataItem.id}`}>Key *</Label>
                    <Input
                      id={`manual-metadata-key-${metadataItem.id}`}
                      value={metadataItem.key}
                      onChange={(e) => handleMetadataChange("manual", metadataItem.id, "key", e.target.value)}
                      placeholder="Enter key"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`manual-metadata-value-${metadataItem.id}`}>Value *</Label>
                    <Input
                      id={`manual-metadata-value-${metadataItem.id}`}
                      value={metadataItem.value}
                      onChange={(e) => handleMetadataChange("manual", metadataItem.id, "value", e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMetadata("manual", metadataItem.id)}
                    className="shrink-0"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" onClick={() => handleAddMetadata("manual")} className="w-full">
              <PlusIcon className="mr-2 h-4 w-4" /> Add metadata
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
