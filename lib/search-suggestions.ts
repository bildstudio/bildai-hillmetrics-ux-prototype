import { SearchSuggestion } from "@/components/search/unified-search"
import { 
  FileText, 
  Activity, 
  Database, 
  Workflow, 
  TrendingUp,
  Hash,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

// Mock data - in real implementation, these would come from API calls
const mockData = {
  recentFluxes: [
    { id: "1", name: "Financial Analysis 2024", status: "active" },
    { id: "2", name: "Customer Data Processing", status: "completed" },
    { id: "3", name: "Inventory Management", status: "failed" }
  ],
  
  recentFetches: [
    { fetchingID: 39739, status: "Success", numberOfContent: 25 },
    { fetchingID: 35909, status: "Currently fetching", numberOfContent: 12 },
    { fetchingID: 56352, status: "Failed", errorMessage: "Connection timeout" }
  ],

  recentProcessing: [
    { processingID: 42708, status: "Success", numberOfProcessingContent: 15 },
    { processingID: 32531, status: "Currently processing", numberOfProcessingContent: 8 }
  ],

  commonSearches: [
    "failed status",
    "progress > 50%",
    "last 7 days",
    "error messages",
    "completed workflows",
    "large files"
  ]
}

export async function generateSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []
  const lowerQuery = query.toLowerCase().trim()

  if (!lowerQuery) {
    // Return recent items and common searches when no query
    return [
      ...mockData.recentFluxes.slice(0, 3).map((flux, index) => ({
        id: `recent-flux-${flux.id}`,
        title: flux.name,
        description: `Flux ${flux.id} • ${flux.status}`,
        category: 'flux' as const,
        icon: TrendingUp,
        value: flux.name,
        data: flux,
        type: 'navigation' as const
      })),
      
      ...mockData.commonSearches.slice(0, 3).map((search, index) => ({
        id: `common-${index}`,
        title: search,
        description: "Common search",
        category: 'recent' as const,
        icon: Clock,
        value: search,
        data: { searchTerm: search },
        type: 'quick_search' as const
      }))
    ]
  }

  // Flux suggestions
  if (lowerQuery.includes('flux') || lowerQuery.includes('financial') || lowerQuery.includes('customer')) {
    mockData.recentFluxes
      .filter(flux => flux.name.toLowerCase().includes(lowerQuery))
      .forEach(flux => {
        suggestions.push({
          id: `flux-${flux.id}`,
          title: flux.name,
          description: `Flux ${flux.id} • Status: ${flux.status}`,
          category: 'flux',
          icon: TrendingUp,
          value: flux.name,
          data: flux,
          type: 'navigation'
        })
      })
  }

  // Status-based suggestions
  if (lowerQuery.includes('status') || lowerQuery.includes('failed') || lowerQuery.includes('success') || lowerQuery.includes('active')) {
    const statusSuggestions = [
      { value: 'status:success', label: 'Status is Success', icon: CheckCircle, category: 'filter' },
      { value: 'status:failed', label: 'Status is Failed', icon: AlertCircle, category: 'filter' },
      { value: 'status:active', label: 'Status is Active', icon: Activity, category: 'filter' },
      { value: 'status:processing', label: 'Currently Processing', icon: Clock, category: 'filter' }
    ]

    statusSuggestions
      .filter(status => status.label.toLowerCase().includes(lowerQuery))
      .forEach((status, index) => {
        suggestions.push({
          id: `status-${index}`,
          title: status.label,
          description: "Filter by status",
          category: 'fetching',
          icon: status.icon,
          value: status.value,
          data: { field: 'status', operator: 'equals', value: status.value.split(':')[1] },
          type: 'filter'
        })
      })
  }

  // ID-based suggestions
  if (/^\d+$/.test(lowerQuery)) {
    const id = parseInt(lowerQuery)
    
    // Fetching ID suggestions
    const matchingFetch = mockData.recentFetches.find(f => f.fetchingID.toString().includes(lowerQuery))
    if (matchingFetch) {
      suggestions.push({
        id: `fetching-${matchingFetch.fetchingID}`,
        title: `Fetching ID: ${matchingFetch.fetchingID}`,
        description: `${matchingFetch.status} • ${matchingFetch.numberOfContent} items`,
        category: 'fetching',
        icon: Database,
        value: matchingFetch.fetchingID.toString(),
        data: { fetchingID: matchingFetch.fetchingID },
        type: 'navigation'
      })
    }

    // Processing ID suggestions  
    const matchingProcessing = mockData.recentProcessing.find(p => p.processingID.toString().includes(lowerQuery))
    if (matchingProcessing) {
      suggestions.push({
        id: `processing-${matchingProcessing.processingID}`,
        title: `Processing ID: ${matchingProcessing.processingID}`,
        description: `${matchingProcessing.status} • ${matchingProcessing.numberOfProcessingContent} items`,
        category: 'processing',
        icon: Workflow,
        value: matchingProcessing.processingID.toString(),
        data: { processingID: matchingProcessing.processingID },
        type: 'navigation'
      })
    }

    // Generic ID filters
    suggestions.push({
      id: `id-filter-${id}`,
      title: `ID equals ${id}`,
      description: "Search by exact ID match",
      category: 'fetching',
      icon: Hash,
      value: `id:${id}`,
      data: { field: 'id', operator: 'equals', value: id },
      type: 'filter'
    })
  }

  // Progress-based suggestions
  if (lowerQuery.includes('progress') || lowerQuery.includes('%') || lowerQuery.includes('percent')) {
    const progressSuggestions = [
      { range: '0% - 25%', label: 'Low progress (0-25%)', icon: Clock },
      { range: '26% - 50%', label: 'Medium progress (26-50%)', icon: Activity },
      { range: '51% - 75%', label: 'High progress (51-75%)', icon: TrendingUp },
      { range: '76% - 100%', label: 'Near completion (76-100%)', icon: CheckCircle }
    ]

    progressSuggestions.forEach((prog, index) => {
      suggestions.push({
        id: `progress-${index}`,
        title: prog.label,
        description: "Filter by progress range",
        category: 'workflow',
        icon: prog.icon,
        value: `progress:${prog.range}`,
        data: { field: 'progress', operator: 'progress_ranges', value: prog.range },
        type: 'filter'
      })
    })
  }

  // Date-based suggestions
  if (lowerQuery.includes('today') || lowerQuery.includes('yesterday') || lowerQuery.includes('week') || lowerQuery.includes('month')) {
    const dateSuggestions = [
      { period: 'today', label: 'Today', description: 'Items from today' },
      { period: 'yesterday', label: 'Yesterday', description: 'Items from yesterday' },
      { period: 'week', label: 'This week', description: 'Items from this week' },
      { period: 'month', label: 'This month', description: 'Items from this month' }
    ]

    dateSuggestions
      .filter(date => date.label.toLowerCase().includes(lowerQuery))
      .forEach(date => {
        suggestions.push({
          id: `date-${date.period}`,
          title: date.label,
          description: date.description,
          category: 'workflow',
          icon: Calendar,
          value: `date:${date.period}`,
          data: { field: 'timestamp', operator: 'date_range', value: date.period },
          type: 'filter'
        })
      })
  }

  // Error-based suggestions
  if (lowerQuery.includes('error') || lowerQuery.includes('fail') || lowerQuery.includes('timeout')) {
    suggestions.push({
      id: 'has-errors',
      title: 'Has errors',
      description: "Items with error messages",
      category: 'fetching',
      icon: AlertCircle,
      value: 'has:errors',
      data: { field: 'errorMessage', operator: 'error_contains', value: true },
      type: 'filter'
    })

    if (lowerQuery.includes('timeout')) {
      suggestions.push({
        id: 'timeout-errors',
        title: 'Timeout errors',
        description: "Items with timeout errors",
        category: 'fetching',
        icon: Clock,
        value: 'error:timeout',
        data: { field: 'errorMessage', operator: 'contains', value: 'timeout' },
        type: 'filter'
      })
    }
  }

  // File type suggestions
  if (lowerQuery.includes('file') || lowerQuery.includes('pdf') || lowerQuery.includes('xlsx') || lowerQuery.includes('csv')) {
    const fileTypes = ['pdf', 'xlsx', 'csv', 'txt', 'json', 'xml']
    
    fileTypes
      .filter(type => type.includes(lowerQuery) || lowerQuery.includes(type))
      .forEach(fileType => {
        suggestions.push({
          id: `filetype-${fileType}`,
          title: `${fileType.toUpperCase()} files`,
          description: `Filter by ${fileType} file type`,
          category: 'content',
          icon: FileText,
          value: `filetype:${fileType}`,
          data: { field: 'fileType', operator: 'equals', value: fileType },
          type: 'filter'
        })
      })
  }

  // Content size suggestions
  if (lowerQuery.includes('size') || lowerQuery.includes('large') || lowerQuery.includes('small') || lowerQuery.includes('mb') || lowerQuery.includes('kb')) {
    const sizeSuggestions = [
      { size: '1mb', label: 'Large files (>1MB)', bytes: 1048576, operator: 'greaterThan' },
      { size: '10mb', label: 'Very large files (>10MB)', bytes: 10485760, operator: 'greaterThan' },
      { size: '100kb', label: 'Small files (<100KB)', bytes: 102400, operator: 'lessThan' }
    ]

    sizeSuggestions.forEach(size => {
      suggestions.push({
        id: `size-${size.size}`,
        title: size.label,
        description: "Filter by file size",
        category: 'content',
        icon: FileText,
        value: `size:${size.size}`,
        data: { field: 'fileSize', operator: size.operator, value: size.bytes },
        type: 'filter'
      })
    })
  }

  // Sort and limit results
  return suggestions.slice(0, 8)
}

// Storage for recent searches
const RECENT_SEARCHES_KEY = 'recent_searches'
const MAX_RECENT_SEARCHES = 10

export function saveRecentSearch(searchTerm: string) {
  if (typeof window === 'undefined') return
  
  try {
    const recent = getRecentSearches()
    const updated = [searchTerm, ...recent.filter(s => s !== searchTerm)].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save recent search:', error)
  }
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to get recent searches:', error)
    return []
  }
}

export function clearRecentSearches() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch (error) {
    console.error('Failed to clear recent searches:', error)
  }
}
