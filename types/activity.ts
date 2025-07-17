export type ActivityEventType =
  | "FETCHING_SUCCESS"
  | "FETCHING_ERROR"
  | "PROCESSING_SUCCESS"
  | "PROCESSING_ERROR"
  | "FLUX_CREATED"
  | "FLUX_MODIFIED"

export interface ActivityEvent {
  id: string
  type: ActivityEventType
  title: string
  description: string
  timestamp: Date
  metadata?: Record<string, any>
  userId?: string
  userName?: string
}

export interface GetActivitiesParams {
  fluxId: string
  page: number
  pageSize: number
  filters?: {
    types?: ActivityEventType[]
    dateRange?: {
      from: Date
      to: Date
    }
  }
}

export interface GetActivitiesResponse {
  activities: ActivityEvent[]
  totalCount: number
  hasMore: boolean
  error?: string
}
