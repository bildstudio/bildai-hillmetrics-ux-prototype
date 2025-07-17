interface FluxData {
  id: string
  name: string
  status: "active" | "completed" | "failed"
  progress: number
  category: string
  duration: number
  lastRun: string
  nextRun?: string
  description?: string
  createdAt: string
  updatedAt: string
  lastFetchingDate?: string
  fetchingErrorCount?: number
  lastProcessingDate?: string
  financialType?: string
  fluxType?: string
  fetchingStatus?: string
  stage?: string
  startTime?: string
  processingEvents?: Array<{
    id: string
    timestamp: string
    type: string
    status: string
    message: string
  }>
  fetchingEvents?: Array<{
    id: string
    timestamp: string
    type: string
    status: string
    message: string
  }>
}

interface Notification {
  id: string
  type: string
  category: string
  title: string
  message: string
  timestamp: string
  isRead: boolean
}

interface ChartDataEntry {
  date: string
  active: number
  successful: number
  failed: number
}

interface Stats {
  activeFlux: number
  completedFlux: number
  failedFlux: number
  avgTime: number
}

// Define AppliedFilter and SavedFilter here for DataStore's internal use
interface AppliedFilter {
  id: string
  field: string
  operator: string
  value: any
  label: string
}

interface SavedFilter {
  id: string
  name: string
  filters: AppliedFilter[]
  createdAt: string
}

class DataStore {
  private _chartData: Record<string, ChartDataEntry[]> = {}
  private _fluxData: FluxData[] = []
  private _notificationsData: Notification[] = []
  private _savedFiltersData: SavedFilter[] = [] // Correct type
  private _isLoaded = false
  private _loadPromise: Promise<void>

  constructor() {
    this._loadPromise = this.loadAllData()
  }

  private async loadAllData() {
    try {
      const base =
        typeof window === "undefined"
          ? process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
          : window.location.origin
      const [chartRes, fluxRes, notificationsRes, savedFiltersRes] = await Promise.all([
        fetch(new URL("/data/chart-data.json", base).toString()),
        fetch(new URL("/data/flux-data.json", base).toString()),
        fetch(new URL("/data/notifications.json", base).toString()),
        fetch(new URL("/data/saved-filters.json", base).toString()),
      ])

      this._chartData = await chartRes.json()
      this._fluxData = await fluxRes.json()
      this._notificationsData = await notificationsRes.json()

      // Validate saved filters data
      const rawSavedFilters = await savedFiltersRes.json()
      if (Array.isArray(rawSavedFilters)) {
        this._savedFiltersData = rawSavedFilters.map((sf: any) => ({
          id: sf.id,
          name: sf.name,
          createdAt: sf.createdAt,
          filters: Array.isArray(sf.filters) ? sf.filters : [], // Ensure filters property is an array
        }))
      } else {
        console.warn("Saved filters data is not an array, initializing as empty.")
        this._savedFiltersData = []
      }

      this._isLoaded = true
      console.log("DataStore: All data loaded successfully.")
    } catch (error) {
      console.error("DataStore: Failed to load data:", error)
      // Initialize with empty data on error to prevent crashes
      this._chartData = {}
      this._fluxData = []
      this._notificationsData = []
      this._savedFiltersData = []
    }
  }

  async waitForLoad() {
    await this._loadPromise
  }

  getChartData(period: string): ChartDataEntry[] {
    return this._chartData[period] || []
  }

  getAllFlux(): FluxData[] {
    return this._fluxData
  }

  getNotifications(): Notification[] {
    return this._notificationsData
  }

  getSavedFilters(): SavedFilter[] {
    return this._savedFiltersData
  }

  getStats(): Stats {
    const activeFlux = this._fluxData.filter((item) => item.status === "active").length
    const completedFlux = this._fluxData.filter((item) => item.status === "completed").length
    const failedFlux = this._fluxData.filter((item) => item.status === "failed").length
    const avgTime =
      Math.round(this._fluxData.reduce((sum, item) => sum + item.duration, 0) / this._fluxData.length) || 0

    return {
      activeFlux,
      completedFlux,
      failedFlux,
      avgTime,
    }
  }

  // Method to update notifications (simulated)
  updateNotificationStatus(id: string, isRead: boolean) {
    this._notificationsData = this._notificationsData.map((n) => (n.id === id ? { ...n, isRead } : n))
  }

  markAllNotificationsAsRead() {
    this._notificationsData = this._notificationsData.map((n) => ({ ...n, isRead: true }))
  }

  // Method to reset data (for development/testing)
  resetData(): void {
    this._isLoaded = false
    this._loadPromise = this.loadAllData()
  }
}

export const dataStore = new DataStore()
export type { FluxData, ChartDataEntry, Stats, Notification, AppliedFilter, SavedFilter }
