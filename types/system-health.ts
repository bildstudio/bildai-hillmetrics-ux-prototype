export type ServiceStatusType = "API" | "Database" | "Realtime" | "AI Agent"
export type ComponentStatusValue = "up" | "down" | "degraded"

export interface ComponentStatus {
  name: string
  status: ComponentStatusValue
  uptime: string // e.g., "99.85% uptime"
  history: ComponentStatusValue[] // Array of recent statuses
}

export interface ServiceHealth {
  type: ServiceStatusType
  overallStatus: ComponentStatusValue
  overallUptime: string
  components: ComponentStatus[]
}
